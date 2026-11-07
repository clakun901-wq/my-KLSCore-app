"""E2E Tahap 8 (v9.45) di Chromium nyata: satu sumber versi, Service Worker, dan pemakaian offline.
Alur: (1) halaman memuat satu skrip modul, KALSARA_VERSION ada, panel Pembaruan menulis versi dari sana;
(2) dengan Service Worker AKTIF (tes lain memblokirnya), cache bernama versi terisi lengkap, termasuk js/version.js;
(3) koneksi dimatikan, halaman dimuat ulang dan tetap tampil dari cache."""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8168
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = b.new_context(viewport={'width': 412, 'height': 900})  # Service Worker aktif (default)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', state='attached', timeout=20000); pg.wait_for_timeout(800)
        v = pg.evaluate("()=>globalThis.KALSARA_VERSION")
        check(v and v.get('app') and v.get('paket'), 'KALSARA_VERSION harus ada di halaman: %r' % v)
        check(pg.evaluate("()=>document.scripts.length") == 1, 'halaman hanya memuat satu skrip')
        pws = pg.evaluate("()=>document.getElementById('pws').textContent")
        check(('Versi ' + v['app']) in pws, 'panel Pembaruan memakai versi dari version.js: %r' % pws)
        ready = pg.evaluate("()=>Promise.race([navigator.serviceWorker.ready.then(r=>!!r.active),new Promise(r=>setTimeout(()=>r(false),30000))])")
        check(ready, 'Service Worker harus aktif')
        nama = 'kalsara-v%s-client-v%s' % (v['app'], v['paket'])
        urls = pg.evaluate("async(n)=>{const k=await caches.keys();if(!k.includes(n))return {keys:k};const c=await caches.open(n);return (await c.keys()).map(r=>new URL(r.url).pathname)}", nama)
        check(isinstance(urls, list), 'cache bernama versi harus ada: %r' % urls)
        for f in ['/js/version.js', '/js/app-core.js', '/js/promosi-data.js', '/vendor/sqlite-wasm/sqlite3.wasm']:
            check(f in urls, 'cache harus memuat ' + f)
        check(len(urls) >= 50, 'cache harus berisi seluruh berkas inti: %d' % len(urls))
        ctx.set_offline(True)
        pg.reload(); pg.wait_for_selector('kalsara-product-card', state='attached', timeout=30000)
        check(pg.evaluate("()=>document.title.length>0 && !!globalThis.KALSARA_VERSION"), 'halaman offline harus tampil dari cache')
        check(not errs, 'tidak ada pageerror: ' + str(errs))
        ctx.close(); b.close()
    print(f'E2E Tahap 8: {ok} assertions passed (versi tunggal, Service Worker aktif, cache lengkap, muat ulang offline).')
finally:
    srv.terminate(); srv.wait()
