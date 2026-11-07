"""E2E muat aplikasi di Chromium nyata. Jalankan: python3 tests/e2e/load.e2e.py
Menangkap ReferenceError/pageerror/console error saat boot (mis. sisa global yang sudah dipindah ke modul ES),
lalu menguji tema, mode, dan daftar produk awal."""
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8127
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
ok = 0
def check(cond, msg):
    global ok
    if not cond: raise AssertionError(msg)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block')
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and not m.text.startswith('Failed to load resource') and 'sqlite3' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_timeout(2500)
        check(not errs, 'tidak boleh ada error saat boot: ' + '; '.join(errs))
        check(pg.locator('#list > *').count() >= 1, 'daftar produk awal harus terisi (boot selesai)')
        cur = pg.evaluate("document.documentElement.getAttribute('data-theme')")
        pg.click('#thm'); nxt = pg.evaluate("document.documentElement.getAttribute('data-theme')")
        check(nxt != cur, 'tombol tema harus mengganti tema')
        check(pg.locator('#thm svg').count() == 1, 'ikon tema harus tampil')
        pg.locator('#mseg button[data-m=full]').dispatch_event('click')
        check(pg.evaluate("!document.body.classList.contains('fast')"), 'Mode Lengkap harus melepas kelas fast')
        pg.locator('#mseg button[data-m=fast]').dispatch_event('click')
        check(pg.evaluate("document.body.classList.contains('fast')"), 'Mode Cepat harus memasang kelas fast')
        pg.wait_for_timeout(1500)  # penyimpanan KStore menulis secara antrean
        pg.reload(); pg.wait_for_timeout(1500)
        check(pg.evaluate("document.body.classList.contains('fast')"), 'mode harus bertahan setelah muat ulang')
        check(not errs, 'tidak boleh ada error setelah muat ulang: ' + '; '.join(errs))
        b.close()
    print(f'Load E2E: {ok} assertions passed')
finally:
    srv.terminate()
