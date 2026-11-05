"""E2E cadangan penuh dan pulihkan di Chromium nyata (v9.32.1: perbaikan ERP undefined pada createBackup).
Jalankan: python3 tests/e2e/cadangan.e2e.py
Latar: sejak v9.18 `createBackup({ERP:ERP})` di 80-cadangan-tema.js menyalin ERP yang saat itu masih undefined (ERP dipasang di 90-erp.js, sesudahnya), sehingga
cadangan PENUH tidak menghasilkan unduhan dan cadangan ber-ERP dari Kalsara v5.82 tidak bisa dipulihkan. Tak ada tes lama yang menjalankan jalur ini di browser.
Alur: (1) cadangan penuh terunduh, memuat kunci erp dan bv=2; (2) pulihkan berkas ASLI v5.82 (tests/fixtures/cadangan-v5_82-dengan-erp.txt, dibuat oleh aplikasi v5.82 sungguhan:
6 produk, A.og=1500, 2 OpEx ERP) lewat teks tempel: ringkasan dialog menyebut ERP, produk/pengaturan/ERP pulih, bertahan setelah muat ulang; (3) cadangan penuh baru memuat 2 OpEx;
(4) ubah pengaturan lalu pulihkan cadangan itu lewat BERKAS (#bf): kembali ke nilai semula; (5) cadangan ringan tetap berfungsi. Menangkap pageerror dan error konsol."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8136
FIX = os.path.join(ROOT, 'tests', 'fixtures', 'cadangan-v5_82-dengan-erp.txt')
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
        SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=[mkrow(0, n='Lama A'), mkrow(1, n='Lama B'), mkrow(2, n='Lama C')], pr=[], sl=[], ts=1)))
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block', accept_downloads=True); ctx.add_init_script(SEED)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'signals' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(800)
        pg.click('#t1'); pg.wait_for_selector('#list .pc', state='visible', timeout=10000); pg.wait_for_timeout(500)
        pg.evaluate("document.querySelectorAll('details').forEach(function(d){d.open=true})")
        dlg = lambda: pg.evaluate("()=>document.getElementById('dlg').textContent")
        names = lambda: [pg.locator('#list .pc').nth(i).locator('.nm').input_value() for i in range(pg.locator('#list .pc').count())]
        def full_backup():
            with pg.expect_download(timeout=8000) as d: pg.evaluate("document.getElementById('bk').click()")
            return json.loads(open(d.value.path(), encoding='utf8').read())
        def set_setting(k, v): pg.evaluate("([k,v])=>{var e=document.getElementById(k);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}", [k, v])

        # 1. cadangan PENUH harus terunduh dan memuat ERP
        b0 = full_backup()
        check(len(b0['rows']) == 3 and 'erp' in b0 and b0.get('bv') == 2, 'cadangan penuh terunduh: 3 produk, kunci erp, bv=2 (dulu: tidak ada unduhan, error reading dump)')
        check(set(b0['erp']['n']) >= {'opex', 'marketplaces_raw', 'order_items'}, 'bagian erp.n memuat tabel ERP')

        # 2. pulihkan cadangan ASLI v5.82 (memuat erp) lewat teks tempel
        fx = open(FIX, encoding='utf8').read(); fxd = json.loads(fx)
        check('erp' in fxd and fxd['erp']['n']['opex'] == 2 and len(fxd['rows']) == 6, 'fixture asli v5.82: 6 produk, 2 OpEx ERP')
        pg.evaluate("document.getElementById('bp').click()"); pg.wait_for_timeout(200)
        pg.evaluate("([t])=>{var e=document.getElementById('bpt');e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}))}", [fx])
        pg.evaluate("document.getElementById('bpg').click()"); pg.wait_for_timeout(500)
        d = dlg()
        check('Pulihkan 6 produk' in d and 'beserta data ERP' in d and '2 OpEx' in d, 'dialog ringkasan menyebut 6 produk dan data ERP (2 OpEx): %r' % d[:200])
        pg.locator('button', has_text='Ya, pulihkan').first.click(); pg.wait_for_timeout(1500)
        check(names() == [f'Produk Asli {i}' for i in range(6)], 'enam produk dari cadangan v5.82 menggantikan tiga produk lama: %s' % names())
        check(pg.locator('#og').input_value().replace('.', '') == '1500', 'pengaturan A.og=1500 dari cadangan v5.82 terpulihkan')

        # 3. data ERP ikut pulih: cadangan penuh baru memuat 2 OpEx
        b1 = full_backup()
        check(b1['erp']['n']['opex'] == 2 and len(b1['rows']) == 6 and b1['A']['og'] == 1500, 'cadangan penuh sesudah pulih: 2 OpEx ERP, 6 produk, og 1500')
        pg.wait_for_timeout(800); pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(800)
        pg.click('#t1'); pg.wait_for_selector('#list .pc', state='visible', timeout=10000); pg.wait_for_timeout(500)
        check(len(names()) == 6, 'hasil pulih bertahan setelah muat ulang')

        # 4. ubah pengaturan, lalu pulihkan cadangan itu lewat BERKAS (#bf)
        pg.evaluate("document.querySelectorAll('details').forEach(function(d){d.open=true})")
        set_setting('og', '0'); pg.wait_for_timeout(500)
        tmp = os.path.join(ROOT, 'tests', '.tmp-cadangan.txt'); open(tmp, 'w', encoding='utf8').write(json.dumps(b1))
        try:
            pg.set_input_files('#bf', tmp); pg.wait_for_timeout(600)
            check('Pulihkan 6 produk' in dlg() and 'beserta data ERP' in dlg(), 'pulihkan lewat berkas: dialog menyebut 6 produk dan ERP')
            pg.locator('button', has_text='Ya, pulihkan').first.click(); pg.wait_for_timeout(1200)
        finally:
            os.remove(tmp)
        check(pg.locator('#og').input_value().replace('.', '') == '1500', 'pulihkan lewat berkas mengembalikan A.og=1500')

        # 5. cadangan ringan tetap berfungsi
        pg.evaluate("document.getElementById('bcl').click()"); pg.wait_for_timeout(700)
        lt = json.loads(pg.evaluate("document.getElementById('bpt').value"))
        check(len(lt['rows']) == 6 and 'erp' not in lt, 'cadangan ringan: 6 produk tanpa ERP')
        check(not errs, 'tidak boleh ada error JS: %s' % errs)
        ctx.close(); b.close()
    print(f'E2E Cadangan penuh dan pulihkan: {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
