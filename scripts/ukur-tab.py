"""Ukur perpindahan tab dari luar (Playwright + Chromium), sama persis untuk v9.47 dan v9.48.
Pakai: python3 scripts/ukur-tab.py <folder-aplikasi> <port> [jumlah_produk=1000] [persen_live=100] [cpu=1] [ulang=3]
cpu = faktor perlambatan CPU (CDP Emulation.setCPUThrottlingRate); 4 kira-kira meniru HP kelas menengah. INI PERKIRAAN, bukan hasil di HP asli.
Keluaran: satu baris JSON berisi median waktu (ms) tiap perpindahan: js (sinkron) dan gambar (sampai dua frame berikutnya)."""
import json, os, subprocess, sys, time, statistics
from playwright.sync_api import sync_playwright
root, port = os.path.abspath(sys.argv[1]), int(sys.argv[2])
N = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
LIVE = int(sys.argv[4]) if len(sys.argv) > 4 else 100
CPU = float(sys.argv[5]) if len(sys.argv) > 5 else 1
REP = int(sys.argv[6]) if len(sys.argv) > 6 else 3
QS = sys.argv[7] if len(sys.argv) > 7 else ''
srv = subprocess.Popen(['python3', '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
rows = [dict(id=f'p{i}', n=f'Produk {i:04d}', m=20000 + (i % 50) * 997, d=0, p=0, t=1000, q=1, s=2 + i % 30, live=(i * 100 // max(N, 1)) % 100 < LIVE, ha=0, hd=0,
             c=False, cx=0, sd='', mb=20000 + (i % 50) * 997, mh=[], ack=False, sup='', sku='', lnk='', o=None) for i in range(N)]
seed = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=[], ts=1)))
LT = "window.__lt=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push(e.duration)}).observe({type:'longtask',buffered:true})}catch(e){}"
JS = """async (id)=>{const b=document.getElementById(id);const a=performance.now();b.click();const js=performance.now()-a;
await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(r,0))));return [js,performance.now()-a]}"""
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(seed); ctx.add_init_script(LT)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        if CPU > 1:
            cdp = ctx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': CPU})
        t0 = time.time(); pg.goto(f'http://127.0.0.1:{port}/index.html{QS}')
        pg.wait_for_function("document.getElementById('s1') && document.getElementById('s1').textContent==='%d'" % N, timeout=180000)
        boot = round((time.time() - t0) * 1000); pg.wait_for_timeout(1500)
        dom = lambda: pg.evaluate("({semua:document.getElementsByTagName('*').length,etalase:document.querySelectorAll('#shl kalsara-product-card').length,hitung:document.querySelectorAll('#list .pc').length,hitungTerbangun:document.querySelectorAll('#list .pc:not(.lz)').length})")
        res = {'produk': N, 'live': sum(1 for r in rows if r['live']), 'cpu': CPU, 'bootMs': boot, 'domEtalase': dom()}
        seq = [('t1', 'Etalase>Hitung'), ('t0', 'Hitung>Etalase'), ('t3', 'Etalase>Promosi'), ('t0', 'Promosi>Etalase'), ('t4', 'Etalase>Penjualan'), ('t0', 'Penjualan>Etalase'), ('t6', 'Etalase>ERP'), ('t0', 'ERP>Etalase'), ('t1', 'Etalase>Hitung (2)'), ('t3', 'Hitung>Promosi'), ('t1', 'Promosi>Hitung')]
        acc = {}
        for _ in range(REP):
            for tid, name in seq:
                js, paint = pg.evaluate(JS, tid); pg.wait_for_timeout(250)
                acc.setdefault(name, []).append((js, paint))
        res['tab'] = {k: {'js': round(statistics.median(x[0] for x in v), 1), 'gambar': round(statistics.median(x[1] for x in v), 1), 'maks': round(max(x[1] for x in v), 1)} for k, v in acc.items()}
        res['domAkhir'] = dom()
        lt = pg.evaluate('window.__lt'); res['tugasPanjang'] = {'jumlah': len(lt), 'total': round(sum(lt)), 'terlama': round(max(lt)) if lt else 0}
        res['galatJS'] = errs
        print(json.dumps(res, ensure_ascii=False)); b.close()
finally:
    srv.terminate()
