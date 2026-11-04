"""E2E peringatan stok/margin/modal di Chromium nyata (v9.31: js/warnings.js terpasang di legacy).
Jalankan: python3 tests/e2e/peringatan.e2e.py
Alur: kartu tab Hitung menampilkan peringatan stok (belum diisi, habis, hampir habis, menipis, aman), peringatan modal naik dengan tombol
"Sudah update harga di Shopee" (klik menghilangkan peringatan), ringkasan untung tipis/sehat, ambang stok diubah lewat Pengaturan
berlaku langsung, lalu RESTORE cadangan lewat teks tempel menggantikan A secara utuh: peringatan harus memakai ambang baru (bukan salinan lama).
Menangkap pageerror dan error konsol."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8133
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
TODAY = "(function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})()"
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000, d=0, p=0, t=8000, q=1, s=50, live=True, ha=0, hd=0, c=False, cx=0, sd='TODAY', mb=0, mh=[], ack=False, sup='', sku='', lnk='', o=None)
    r.update(kw); return r
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        tmp = b.new_context(); tp = tmp.new_page(); today = tp.evaluate(TODAY); tmp.close()
        rows = [mkrow(0, n='Stok Kosong', s=None, sd=''), mkrow(1, n='Stok Habis', s=0), mkrow(2, n='Stok Kritis', s=3), mkrow(3, n='Stok Tipis', s=8),
                mkrow(4, n='Stok Aman', s=50), mkrow(5, n='Modal Naik', m=25000, mh=[dict(a=20000, b=25000, d='2026-10-05')]),
                mkrow(6, n='Untung Tipis', t=1000), mkrow(7, n='Untung Sehat', t=8000), mkrow(8, n='Target Nol', t=0)]
        for r in rows:
            if r['sd'] == 'TODAY': r['sd'] = today
        SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=[], ts=1)))
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(SEED)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'signals' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(800)
        pg.click('#t1'); pg.wait_for_selector('#list .pc', state='visible', timeout=10000); pg.wait_for_timeout(500)   # tab Hitung (#v1)
        card = lambda i: pg.locator('#list .pc').nth(i)
        sk = lambda i: card(i).locator('.sk').text_content()   # text_content: kartu di luar layar tidak dirender (inner_text kosong)

        # 1. Peringatan stok di kartu (ambang bawaan: menipis <= 10, hampir habis <= 5)
        check(pg.locator('#list .pc').count() == 9, 'sembilan kartu tampil di tab Hitung')
        check('Stok belum diisi' in sk(0) and card(0).locator('.sk .wn.y').count() == 1, 'stok kosong: peringatan kuning "Stok belum diisi"')
        check('Stok habis' in sk(1) and card(1).locator('.sk .wn.r').count() == 1, 'stok 0: peringatan merah "Stok habis"')
        check('Stok hampir habis (3 pcs)' in sk(2) and card(2).locator('.sk .wn.r').count() == 1, 'stok 3: merah "Stok hampir habis (3 pcs)"')
        check('Stok menipis (8 pcs)' in sk(3) and card(3).locator('.sk .wn.y').count() == 1, 'stok 8: kuning "Stok menipis (8 pcs)"')
        check('Stok 50 pcs, dicek hari ini' in sk(4) and card(4).locator('.sk .wn').count() == 0, 'stok 50 dicek hari ini: aman, tanpa peringatan')

        # 2. Peringatan modal naik + tombol konfirmasi
        t5 = sk(5)
        check('Modal naik' in t5 and '5 Okt' in t5 and 'Sudah update harga di Shopee' in t5, 'modal naik: pesan, tanggal (5 Okt) dan tombol tampil')
        card(5).scroll_into_view_if_needed(); card(5).locator('.sk .ak').click(); pg.wait_for_timeout(500)
        check('Modal naik' not in sk(5) and card(5).locator('.sk .ak').count() == 0, 'klik "Sudah update harga di Shopee" menghilangkan peringatan modal')

        # 3. Ringkasan untung tipis / nol / sehat
        cs = lambda i: card(i).locator('.cs').text_content()
        check('Untung tipis' in cs(6), 'target untung 1.000 (< batas 2.000): "Untung tipis"')
        check('Untung tipis' in cs(8) and '(0,' in cs(8), 'target untung 0: harga dibulatkan ke rupiah penuh, untung hanya puluhan rupiah -> "Untung tipis" dengan margin 0,x% (pc1 berformat koma). "Untung nol" persis hanya terjangkau lewat tes unit')
        check(card(7).locator('.cs .wn').count() == 0, 'target untung 8.000: tanpa peringatan')

        # 4. Ambang stok diubah lewat Pengaturan: berlaku langsung
        def set_setting(k, v): pg.evaluate("([k,v])=>{var e=document.getElementById(k);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}", [k, v])
        set_setting('sl', '60'); pg.wait_for_timeout(600)
        check('Stok menipis (50 pcs)' in sk(4) and card(4).locator('.sk .wn.y').count() == 1, 'batas menipis diubah ke 60: stok 50 kini "menipis"')
        set_setting('sl', '10'); pg.wait_for_timeout(600)
        check('Stok 50 pcs' in sk(4) and card(4).locator('.sk .wn').count() == 0, 'batas dikembalikan 10: stok 50 aman lagi')

        # 5. RESTORE cadangan (A diganti utuh): peringatan harus memakai ambang baru
        backup = json.dumps(dict(A=dict(sl=100, sh=60), rows=[mkrow(0, n='Restore Kritis', s=50, sd=today), mkrow(1, n='Restore Tipis', s=80, sd=today), mkrow(2, n='Restore Aman', s=150, sd=today)], pr=[]))
        pg.evaluate("document.querySelectorAll('details').forEach(function(d){d.open=true})")
        pg.evaluate("document.getElementById('bp').click()"); pg.wait_for_timeout(200)
        pg.evaluate("([t])=>{var e=document.getElementById('bpt');e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}))}", [backup])
        pg.evaluate("document.getElementById('bpg').click()"); pg.wait_for_timeout(400)
        pg.locator('button', has_text='Ya, pulihkan').first.click(); pg.wait_for_timeout(900)
        check(pg.locator('#list .pc').count() == 3, 'restore: tiga produk hasil cadangan menggantikan sembilan produk lama')
        check('Stok hampir habis (50 pcs)' in sk(0) and card(0).locator('.sk .wn.r').count() == 1, 'setelah restore: stok 50 <= batas atas baru 60 -> merah "hampir habis"')
        check('Stok menipis (80 pcs)' in sk(1) and card(1).locator('.sk .wn.y').count() == 1, 'setelah restore: stok 80 <= batas bawah baru 100 -> kuning "menipis"')
        check('Stok 150 pcs' in sk(2) and card(2).locator('.sk .wn').count() == 0, 'setelah restore: stok 150 aman')
        pg.wait_for_timeout(800); pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(800)
        check('Stok hampir habis (50 pcs)' in sk(0) and 'Stok menipis (80 pcs)' in sk(1), 'ambang hasil restore bertahan setelah muat ulang')
        check(not errs, 'tidak boleh ada error JS: %s' % errs)
        ctx.close(); b.close()
    print(f'E2E Peringatan stok/margin: {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
