"""E2E v9.51 di Chromium nyata: penanda halaman Etalase rapi dan presisi di berbagai lebar layar.
Baris 1: dua tombol selebar sama, sejajar. Baris 2: "Hal. [n] dari N" dengan kotak angka tepat di tengah. Baris 3: info di tengah.
Diukur dengan geometri nyata pada 320, 360, 412 dan 1024 px, di penanda atas (#shpt) dan bawah (#shpg).
Jalankan: python3 tests/e2e/penanda-halaman.e2e.py"""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8133
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
N = 150
def mk(i): return dict(id=f'p{i}', n=f'Produk {i:04d}', m=20000 + (i % 50) * 997, d=0, p=0, t=1000, q=1, s=20 + i % 30, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=20000 + (i % 50) * 997, mh=[], ack=False, sup='', sku='', lnk='', o=None)
seed = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=[mk(i) for i in range(N)], pr=[], sl=[], ts=1)))
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
MEASURE = """id => { const nav = document.getElementById(id), R = e => e.getBoundingClientRect();
  const [prev, next] = nav.querySelectorAll('button'), mid = nav.querySelector('.pgm'), inp = nav.querySelector('input'), info = nav.querySelector('.pgi');
  const n = R(nav), p = R(prev), x = R(next), i = R(inp), f = R(info), m = R(mid);
  return {nl: n.left, nr: n.right, nt: n.top, pl: p.left, pr: p.right, pt: p.top, ph: p.height, xl: x.left, xr: x.right, xt: x.top, xh: x.height,
          il: i.left, ir: i.right, it: i.top, ih: i.height, ml: m.left, mr: m.right, mb: m.bottom, ft: f.top, fl: f.left, fr: f.right, fh: f.height,
          vw: window.innerWidth, sw: document.documentElement.scrollWidth} }"""
def verifikasi(pg, nav_id, w, tag):
    m = pg.evaluate(MEASURE, nav_id); t = f'[{w}px {tag} #{nav_id}] '
    check(abs(m['pt'] - m['xt']) <= 1 and abs(m['ph'] - 44) <= 1 and abs(m['xh'] - 44) <= 1, t + 'dua tombol sejajar satu baris, tinggi 44px')
    check(abs((m['pr'] - m['pl']) - (m['xr'] - m['xl'])) <= 1, t + 'dua tombol selebar sama')
    check(abs(m['pl'] - m['nl']) <= 1 and abs(m['xr'] - m['nr']) <= 1, t + 'tombol memenuhi lebar penanda (rata kiri dan kanan)')
    gap_c = (m['pr'] + m['xl']) / 2
    check(abs((m['il'] + m['ir']) / 2 - gap_c) <= 1.5, t + 'kotak angka tepat di tengah (di bawah celah dua tombol)')
    check(m['it'] >= m['pt'] + m['ph'] + 4 and abs(m['ih'] - 44) <= 1, t + 'kotak "Hal." di bawah tombol, tinggi 44px')
    check(m['ft'] >= m['it'] + m['ih'] and abs((m['fl'] + m['fr']) / 2 - (m['nl'] + m['nr']) / 2) <= 1.5, t + 'info di baris ke-3, di tengah')
    check(m['ml'] >= m['nl'] - 1 and m['mr'] <= m['nr'] + 1, t + '"Hal. n dari N" tidak keluar dari penanda')
    check(m['nl'] >= 0 and m['nr'] <= m['vw'] + 1 and m['sw'] <= m['vw'] + 1, t + 'tidak melebar ke samping layar')
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        for w in (320, 360, 412, 1024):
            ctx = b.new_context(viewport={'width': w, 'height': 900}, service_workers='block'); ctx.add_init_script(seed)
            pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_function(f"document.getElementById('s1').textContent==='{N}'", timeout=60000); pg.wait_for_timeout(800)
            check(pg.locator('#shpt').is_visible() and pg.locator('#shpg').is_visible(), f'[{w}px] penanda atas dan bawah tampil')
            if w == 1024:
                mm = pg.evaluate(MEASURE, 'shpt'); check(mm['nr'] - mm['nl'] <= 441, '[1024px] lebar penanda dibatasi, tombol tidak melar')
            for nid in ('shpt', 'shpg'): verifikasi(pg, nid, w, 'hal. 1')
            # pindah halaman: tata letak tidak bergeser (tombol, kotak angka tetap di tempat yang sama)
            a = pg.evaluate(MEASURE, 'shpt')
            pg.locator('#shpt button').nth(1).click(); pg.wait_for_timeout(300)
            c = pg.evaluate(MEASURE, 'shpt')
            check(abs(a['pl'] - c['pl']) <= 1 and abs(a['xl'] - c['xl']) <= 1 and abs(a['il'] - c['il']) <= 1, f'[{w}px] pindah halaman tidak menggeser tombol/kotak angka')
            verifikasi(pg, 'shpt', w, 'hal. 2')
            # angka halaman sangat panjang tetap rapi
            pg.evaluate("() => { for (const id of ['shpt','shpg']) { const s = document.querySelector('#' + id + ' .pgm span'); s.textContent = ' dari 20.000'; document.querySelector('#' + id + ' .pgi').textContent = 'Produk 999.950\\u20131.000.000 dari 1.000.000' } }")
            for nid in ('shpt', 'shpg'): verifikasi(pg, nid, w, 'angka panjang')
            check(not errs, f'[{w}px] tanpa galat JS: {errs}')
            ctx.close()
        b.close()
    print(f'Penanda halaman E2E (v9.51): {ok} pernyataan lulus.')
finally:
    srv.terminate()
