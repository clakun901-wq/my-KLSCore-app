"""E2E tampilan hasil kartu Hitung di Chromium nyata (v9.32: js/hasil-view.js terpasang di legacy; revHtml, CR, sp, errH).
Jalankan: python3 tests/e2e/hasil.e2e.py
Alur: kartu dengan 'harga jual yang dicek' (cx) menampilkan revHtml (selisih dari harga impas, Total Biaya Shopee, Untung/Rugi bersih);
kartu biasa menampilkan bar 'Ke mana harga jual pergi' (sp) dan baris rincian tarif (CR); voucher toko 100% menampilkan pesan galat (errH);
lalu RESTORE cadangan lewat teks tempel dengan A.og (ongkir ditanggung) baru: baris 'Ongkir ditanggung' di revHtml dan bagian potongan di sp harus
memakai A hasil restore (bukan salinan lama). Menangkap pageerror dan error konsol."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8134
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000, d=0, p=0, t=8000, q=1, s=50, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=0, mh=[], ack=False, sup='', sku='', lnk='', o=None)
    r.update(kw); return r
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        rows = [mkrow(0, n='Cek Untung', cx=80000), mkrow(1, n='Cek Rugi', cx=21000), mkrow(2, n='Biasa')]
        SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=[], ts=1)))
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(SEED)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'signals' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(800)
        pg.click('#t1'); pg.wait_for_selector('#list .pc', state='visible', timeout=10000); pg.wait_for_timeout(600)
        card = lambda i: pg.locator('#list .pc').nth(i)
        txt = lambda i, sel: card(i).locator(sel).text_content()   # text_content: kartu di luar layar tidak dirender
        for i in range(3): card(i).scroll_into_view_if_needed(); pg.wait_for_timeout(250)
        check(pg.locator('#list .pc').count() == 3, 'tiga kartu tampil di tab Hitung')

        # 1. revHtml: kartu 'harga jual yang dicek'
        c0 = txt(0, '.cxr'); c1 = txt(1, '.cxr')
        check('Harga jual yang dicek' in c0 and 'Total Biaya Shopee' in c0 and 'Saldo masuk toko' in c0, 'revHtml: judul, Total Biaya Shopee dan Saldo masuk toko tampil')
        check('Untung bersih' in c0 and 'Rugi bersih' not in c0 and 'di atas' in c0 and 'Selisih dari harga impas' in c0, 'harga cek 80.000 (modal 20.000): Untung bersih dan selisih \"di atas\" harga impas')
        check('Margin (dari harga jual)' in c0 and '%' in c0, 'revHtml: baris margin (pc1) tampil')
        check('Rugi bersih' in c1 and 'di bawah' in c1 and 'Rugi pada harga ini' in c1, 'harga cek 21.000: Rugi bersih, selisih \"di bawah\" harga impas, dan peringatan WN \"Rugi pada harga ini\"')
        check('Ongkir ditanggung' not in c0, 'ongkir 0: baris Ongkir ditanggung tidak tampil')

        # 2. sp dan CR di kartu biasa
        res3 = txt(2, '.res')
        check('Ke mana harga jual pergi' in res3 and 'Modal ' in res3 and 'Potongan ' in res3 and 'Untung ' in res3, 'sp: bar \"Ke mana harga jual pergi\" dengan Modal/Potongan/Untung')
        check(card(2).locator('.res .pg .bar i').count() == 3, 'sp: tiga segmen bar')
        check('Tarif administrasi (' in res3 and 'Lihat rincian biaya' in res3, 'CR: baris \"Tarif administrasi (..%)\" tampil di rincian biaya')

        # 3. errH: voucher toko 100% (diubah lewat Pengaturan) membuat harga nol -> pesan galat dengan tombol, lalu dikembalikan
        def set_setting(k, v): pg.evaluate("([k,v])=>{var e=document.getElementById(k);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}", [k, v])
        pg.evaluate("document.querySelectorAll('details').forEach(function(d){d.open=true})")
        set_setting('vm', 'pct'); set_setting('vv', '100'); pg.wait_for_timeout(900)
        for i in range(3): card(i).scroll_into_view_if_needed(); pg.wait_for_timeout(250)
        e2 = txt(2, '.res')
        check('Voucher toko 100% membuat harga jadi nol. Turunkan nilainya.' in e2 and 'Buka Voucher' in e2, 'errH: pesan voucher 100% dan tombol \"Buka Voucher\" tampil di hasil')
        check(card(2).locator('.res .wn.r button[data-go="vc"]').count() == 1 and 'Ke mana harga jual pergi' not in e2, 'errH: kotak galat merah dengan tombol data-go=vc, tanpa bar sp')
        check('Voucher toko 100% membuat harga jadi nol' in txt(0, '.cxr') and 'Harga jual yang dicek' not in txt(0, '.cxr'), 'errH juga mengganti hasil \"harga yang dicek\" (revHtml) pada kartu cx')
        set_setting('vm', 'none'); set_setting('vv', '0'); pg.wait_for_timeout(900)
        card(2).scroll_into_view_if_needed(); card(0).scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        check('Ke mana harga jual pergi' in txt(2, '.res') and 'Harga jual yang dicek' in txt(0, '.cxr'), 'setelah voucher dikembalikan: bar sp dan revHtml kembali tampil')

        # 4. RESTORE cadangan dengan A.og = 5000: A diganti utuh, tampilan harus memakai nilai baru
        backup = json.dumps(dict(A=dict(og=5000), rows=[mkrow(0, n='Restore Cek', cx=80000), mkrow(1, n='Restore Biasa')], pr=[]))
        pg.evaluate("document.querySelectorAll('details').forEach(function(d){d.open=true})")
        pg.evaluate("document.getElementById('bp').click()"); pg.wait_for_timeout(200)
        pg.evaluate("([t])=>{var e=document.getElementById('bpt');e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}))}", [backup])
        pg.evaluate("document.getElementById('bpg').click()"); pg.wait_for_timeout(400)
        pg.locator('button', has_text='Ya, pulihkan').first.click(); pg.wait_for_timeout(900)
        check(pg.locator('#list .pc').count() == 2, 'restore: dua produk hasil cadangan menggantikan empat produk lama')
        for i in range(2): card(i).scroll_into_view_if_needed(); pg.wait_for_timeout(250)
        r0 = txt(0, '.cxr')
        check('Ongkir ditanggung' in r0 and 'Rp' in r0, 'setelah restore: revHtml memakai A.og baru -> baris \"Ongkir ditanggung\" muncul')
        sp_after = txt(1, '.res')
        check('Ke mana harga jual pergi' in sp_after, 'setelah restore: bar sp tetap tampil dengan A hasil restore')
        pg.wait_for_timeout(800); pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(800)
        pg.click('#t1'); pg.wait_for_selector('#list .pc', state='visible', timeout=10000); pg.wait_for_timeout(600)
        card(0).scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        check('Ongkir ditanggung' in txt(0, '.cxr'), 'ongkir hasil restore bertahan setelah muat ulang')
        check(not errs, 'tidak boleh ada error JS: %s' % errs)
        ctx.close(); b.close()
    print(f'E2E Hasil kartu Hitung: {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
