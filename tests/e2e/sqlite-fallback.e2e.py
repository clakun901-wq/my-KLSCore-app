"""E2E Chromium nyata: Worker SQLite dimuat dengan benar, dan TANPA berkas Wasm aplikasi tetap hidup lewat jurnal OPFS.
Jalankan: python3 tests/e2e/sqlite-fallback.e2e.py   (lulus hanya bila vendor/sqlite-wasm belum dipasang)"""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8125
HAS_WASM = os.path.exists(os.path.join(ROOT, 'vendor', 'sqlite-wasm', 'sqlite3.wasm'))
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(service_workers='block'); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_function("typeof KStore!=='undefined' && document.querySelectorAll('nav button').length>=7", timeout=30000)
        backend = pg.evaluate("KStore.backend")
        print('backend aktif:', backend, '| wasm terpasang:', HAS_WASM)
        if not HAS_WASM:
            check(backend == 'journal', 'tanpa Wasm harus jatuh ke jurnal OPFS')
            r = pg.evaluate("""async()=>{const {createSqliteBackend}=await import('/js/sqlite-client.js');
              const b=createSqliteBackend(()=>new Worker('/workers/sqlite-store.worker.js',{type:'module'}));
              try{await b.request('open');return {ok:true}}catch(e){return {ok:false,code:e.code||null,msg:e.message}}finally{b.terminate()}}""")
            check(r['ok'] is False and r['code'] == 'wasm-missing', f'Worker SQLite harus membalas wasm-missing, dapat {r}')
            pg.evaluate("KStore.setItem('e2e_kunci','nilai')"); pg.evaluate("KStore.flush()")
            check(pg.evaluate("KStore.getItem('e2e_kunci')") == 'nilai', 'tulis/baca lewat jurnal tetap berfungsi')
            check(pg.evaluate("navigator.storage.getDirectory().then(r=>r.getFileHandle('kalsara-backend.json')).then(()=>true).catch(()=>false)") is False, 'penanda SQLite tidak boleh dibuat bila SQLite tidak pernah terbuka')
        check(not errs, f'tidak boleh ada pageerror: {errs}')
        b.close()
finally:
    srv.terminate()
print(f'E2E SQLite fallback: {ok} assertions passed di Chromium nyata')
