"""E2E Etalase di Chromium nyata (Playwright). Jalankan: python3 tests/e2e/shelf.e2e.py
Menguji kartu <kalsara-product-card>: Shadow DOM, harga coret, gembok, tombol stok, input, voucher, buka produk, dan kinerja 1.000 produk."""
import json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8123
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000 + (i % 50) * 997, d=0, p=0, t=1000, q=1, s=20 + i % 30, live=True, ha=0, hd=0,
             c=False, cx=0, sd='', mb=0, mh=[], ack=False, sup='', sku='', lnk='', o=None)
    r.update(kw); return r
def seed(rows, pr):
    st = dict(A={}, rows=rows, pr=pr, sl=[], ts=1)
    return "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(st))
ok = 0
def check(cond, msg):
    global ok
    if not cond: raise AssertionError(msg)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        # ---- 1. Fungsi ----
        rows = [mkrow(1, n='Rak Buku', m=42320, s=5, ha=151080), mkrow(2, n='Kaos', s=40)]
        pr = [dict(id='v1', t='vc', jt='toko', u='rp', a=2000, b=20000, x=100, y=1, s='', e='', n='Kals53d')]
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(seed(rows, pr))
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=10000)
        cards = pg.locator('#shl kalsara-product-card')
        check(cards.count() == 2, 'harus ada 2 kartu')
        check(pg.evaluate("document.querySelector('#shl kalsara-product-card').shadowRoot.mode") == 'open', 'kartu harus punya Shadow DOM')
        check(pg.evaluate("document.querySelectorAll('#shl .si').length") == 0 and 'Belum ada harga aktual' in cards.nth(1).locator('.si').inner_text(), 'model catatan harga aktual dari actNoteModel tampil di Shadow DOM, bukan light DOM')
        first = cards.nth(0)
        check('Rp 151.080' in first.locator('.si').inner_text(), 'harga coret Shopee harus tampil')
        check(first.locator('s').count() == 1, 'elemen <s> harga coret harus ada')
        check('sisa kuota 99' in first.locator('.vuse').inner_text() and 'Voucher Toko' in first.locator('.pcs').inner_text(), 'label kuota dan chip promo dari model Etalase tampil')
        inp = first.locator('input[inputmode=numeric]')
        check(inp.get_attribute('readonly') is not None, 'stok awalnya terkunci')
        first.locator('.stp button').nth(1).dispatch_event('click'); pg.wait_for_timeout(100)
        check(inp.input_value() == '5', 'tombol + saat terkunci tidak boleh mengubah stok')
        first.locator('.lkb').click(); pg.wait_for_timeout(200)
        first = pg.locator('#shl kalsara-product-card').nth(0); inp = first.locator('input[inputmode=numeric]')
        check(first.locator('.lkb.on').count() == 1 and inp.get_attribute('readonly') is None, 'gembok terbuka')
        first.locator('.stp button').nth(1).click(); pg.wait_for_timeout(250)
        first = pg.locator('#shl kalsara-product-card').nth(0)
        check(first.locator('input[inputmode=numeric]').input_value() == '6', 'tombol + menambah stok 5 -> 6')
        first.locator('.stp button').nth(0).click(); pg.wait_for_timeout(250)
        first = pg.locator('#shl kalsara-product-card').nth(0)
        check(first.locator('input[inputmode=numeric]').input_value() == '5', 'tombol - mengurangi stok 6 -> 5')
        inp = first.locator('input[inputmode=numeric]'); inp.fill('2'); inp.dispatch_event('change'); pg.wait_for_timeout(300)
        check(pg.locator('#shl kalsara-product-card').nth(0).locator('input[inputmode=numeric]').input_value() == '2', 'isi manual stok = 2')
        txt = pg.locator('#shl kalsara-product-card').nth(0).locator('.si').inner_text()
        check('Hampir habis' in txt or 'Menipis' in txt, 'lencana stok rendah tampil')
        cb = pg.locator('#shl kalsara-product-card').nth(0).locator('.vuse input'); cb.check(); pg.wait_for_timeout(100)
        check(cb.is_checked(), 'centang voucher tersimpan di kartu')
        pg.locator('#shl kalsara-product-card').nth(0).locator('.snb').click(); pg.wait_for_timeout(400)
        check(pg.evaluate("document.querySelector('nav button[aria-selected=true], nav button.on, nav .on')?.textContent.includes('Hitung')"), 'mengetuk nama produk membuka tab Hitung')
        check(not errs, 'tidak boleh ada error JS: %s' % errs)
        ctx.close()
        # ---- 2. Etalase penuh pada batas 100 produk milik v5.82 ----
        big = [mkrow(i) for i in range(100)]
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(seed(big, []))
        pg = ctx.new_page(); pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=30000); pg.wait_for_timeout(1000)
        n = pg.evaluate("document.querySelectorAll('#shl kalsara-product-card').length"); check(n == 100, f'100 kartu harus dirender, dapat {n}')
        pg.evaluate("window.__c0=document.querySelector('#shl kalsara-product-card')")
        pg.locator('nav button').nth(1).click(); pg.wait_for_timeout(300); pg.locator('nav button').nth(0).click(); pg.wait_for_timeout(500)
        check(pg.evaluate("window.__c0===document.querySelector('#shl kalsara-product-card')&&document.querySelectorAll('#shl kalsara-product-card').length===100"), 'bolak-balik tab: 100 elemen kartu dipakai ulang')
        ctx.close()
        # ---- 3. Benchmark komponen + renderer pada 1.000 kartu ----
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); pg = ctx.new_page()
        pg.goto(f'http://127.0.0.1:{PORT}/tests/e2e/bench.html'); pg.wait_for_function('window.ready===true')
        r = pg.evaluate('window.bench()')
        print('1.000 kartu:', r)
        check(r['nodes'] == 1000 and r['reused'], '1.000 kartu dirender dan elemen dipakai ulang saat pembaruan')
        check(r['update'] < r['first'], 'pembaruan model harus lebih murah daripada render pertama')
        ctx.close(); b.close()
    print(f'E2E Etalase: {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
