"""E2E v9.57: footer dari version.js, header tanpa PWA, ikon penjelas di kartu dan Setelan, popover, label baru. Jalankan: python3 tests/e2e/tips.e2e.py"""
import os, re, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8141
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    ver = re.search(r"paket:'([^']+)'", open(os.path.join(ROOT, 'js/version.js')).read()).group(1)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block')
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and not m.text.startswith('Failed to load resource') and 'sqlite3' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_timeout(2500)
        check(not errs, 'tidak boleh ada error: ' + '; '.join(errs))
        check(pg.inner_text('footer') == 'Wulfeg \u00b7 versi ' + ver, 'footer harus dari version.js: ' + pg.inner_text('footer'))
        check('Progressive' not in pg.inner_text('header'), 'header tanpa Progressive Web App')
        # kartu produk (tab Hitung)
        pg.locator('#mseg button[data-m=full]').dispatch_event('click'); pg.wait_for_timeout(300)
        pg.locator('#t1').click(); pg.wait_for_timeout(500)
        lab = pg.locator('#list label', has_text='Biaya tambahan per pesanan (opsional)').first
        check(lab.count() == 1 and lab.locator('.ib').count() == 1, 'label baru harus punya ikon penjelas')
        check('Management' not in pg.inner_text('#list'), 'tidak ada Management Partner di kartu')
        check(lab.evaluate("e=>e.textContent.trim()") == 'Biaya tambahan per pesanan (opsional)', 'ikon tidak boleh mengubah teks label')
        n_ib = pg.locator('#list .ib').count()
        check(n_ib >= 8, 'kartu harus memuat banyak ikon: %d' % n_ib)
        # popover
        btn = lab.locator('.ib'); btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(150)
        pop = pg.locator('#tipb')
        check(pop.is_visible() and 'Contoh:' in pop.inner_text() and '31.500' in pop.inner_text(), 'popover tampil dengan contoh angka')
        box = pop.bounding_box(); check(box['x'] >= 0 and box['x'] + box['width'] <= 412, 'popover di dalam layar')
        check(btn.get_attribute('aria-expanded') == 'true', 'aria-expanded true')
        btn.click(); check(not pop.is_visible(), 'ketuk lagi menutup')
        btn.click(); pg.keyboard.press('Escape'); check(not pop.is_visible(), 'Escape menutup')
        btn.click(); pg.mouse.click(5, 5); check(not pop.is_visible(), 'ketuk di luar menutup')
        # klik ikon tidak boleh memfokuskan input label
        # isi modal supaya hasil muncul: ikon di baris rincian, tata letak baris tetap
        pg.locator('#list input[data-f=m]').first.fill('10000'); pg.wait_for_timeout(700)
        pg.locator('#list details.rd').first.evaluate('e=>{e.open=true}'); pg.wait_for_timeout(300)
        rin = pg.locator('#list .rw:visible', has_text='Saldo masuk toko').first
        check(rin.locator('.ib').count() == 1, 'baris rincian punya ikon')
        r = rin.bounding_box(); bb = rin.locator('b').bounding_box()
        check(bb['x'] + bb['width'] <= r['x'] + r['width'] + 1 and bb['x'] > r['x'] + r['width'] / 2, 'angka tetap di sisi kanan baris')
        # ketik lagi: ikon tetap satu per baris (tidak menggandakan)
        pg.locator('#list input[data-f=m]').first.fill('12000'); pg.wait_for_timeout(700)
        pg.locator('#list details.rd').first.evaluate('e=>{e.open=true}'); pg.wait_for_timeout(200)
        check(pg.locator('#list .rw:visible:has-text("Saldo masuk toko") .ib').count() == 1, 'ikon tidak menggandakan setelah hitung ulang')
        # Setelan
        pg.locator('#t2').click(); pg.evaluate("document.querySelectorAll('#v2 details').forEach(d=>{d.open=true})"); pg.wait_for_timeout(400)
        cg = pg.locator('label[for=cg] .ib'); check(cg.count() == 1, 'label Setelan punya ikon')
        cg.scroll_into_view_if_needed(); cg.click(); pg.wait_for_timeout(150)
        check('40.000' in pg.locator('#tipb').inner_text(), 'penjelasan batas XTRA')
        b.close()
    print('Tips E2E: %d pernyataan lulus' % ok)
finally:
    srv.terminate()
