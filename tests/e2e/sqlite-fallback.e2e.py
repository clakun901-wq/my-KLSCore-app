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
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None); ctx = b.new_context(service_workers='block'); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_function("typeof KStore!=='undefined' && document.querySelectorAll('nav button').length>=7 && document.querySelectorAll('#list > *').length>=1", timeout=30000)  # tunggu boot legacy selesai (klik tab sebelum itu = balapan, bukan bug aplikasi)
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
        if HAS_WASM:
            # Bukti SQLite + OPFS nyata: tulis, muat ulang halaman, data harus bertahan dan backend tetap sqlite
            check(backend == 'sqlite', 'dengan Wasm terpasang backend harus sqlite, dapat ' + str(backend))
            pg.evaluate("KStore.setItem('e2e_sqlite','tahan-reload')"); pg.evaluate("KStore.flush()")
            pg.reload(); pg.wait_for_function("typeof KStore!=='undefined' && document.querySelectorAll('#list > *').length>=1", timeout=30000)
            check(pg.evaluate("KStore.backend") == 'sqlite', 'setelah reload backend tetap sqlite')
            check(pg.evaluate("KStore.getItem('e2e_sqlite')") == 'tahan-reload', 'data harus bertahan di SQLite/OPFS setelah reload')
        # Tab ERP (laporan): tanpa SQLite harus memakai hitungan JS lama dan tetap tampil tanpa error
        pg.locator('#t6').click()
        pg.wait_for_function("document.getElementById('erpr') && document.getElementById('erpr').textContent.trim().length>0", timeout=15000)
        check('Omzet' in pg.inner_text('#erpr'), 'laporan ERP tampil (jalur JS saat SQLite tidak aktif)')
        check(pg.evaluate("KStore.erpReport(['']).then(r=>r)") is None or HAS_WASM, 'tanpa SQLite erpReport mengembalikan null')
        # Sambungan laporan SQL -> worker finish-erp-reports -> layar (SQLite disimulasikan: laporan disuntik lewat KStore.erpReport)
        pg.evaluate("""(()=>{KStore.erpReport=async(ms)=>ms.map(m=>({fallback:false,month:m,count:1,locked:0,lockedHpp:0,sums:{om:100000,fv:-5000,fs:0,fa:2000,fx:0,fp:0,fr:0,fk:0,ft:0,fee:6000,tp:90000},ox:3000,unlocked:[]}));return 1})()""")
        pg.locator('#t0').click(); pg.wait_for_timeout(300); pg.locator('#t6').click()
        pg.wait_for_function("document.getElementById('erpr').textContent.includes('100.000')", timeout=15000)
        txt = pg.inner_text('#erpr')
        check('100.000' in txt and '86.000' in txt, 'laporan dari jalur SQL tampil benar (omzet 100.000, laba bersih 86.000)')
        # Bila SQL menyatakan fallback untuk bulan itu, jalur JS lama dipakai dan tetap tampil tanpa error
        pg.evaluate("(()=>{KStore.erpReport=async(ms)=>ms.map(m=>({fallback:true,reason:'uji'}));return 1})()")
        pg.locator('#t0').click(); pg.wait_for_timeout(300); pg.locator('#t6').click(); pg.wait_for_timeout(1200)
        check('Omzet' in pg.inner_text('#erpr') and '100.000' not in pg.inner_text('#erpr'), 'fallback per bulan memakai hitungan JS lama')
        check(not errs, f'tidak boleh ada pageerror: {errs}')
        b.close()
finally:
    srv.terminate()
print(f'E2E SQLite fallback: {ok} assertions passed di Chromium nyata')
