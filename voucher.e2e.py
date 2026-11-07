"""E2E aturan voucher di Chromium nyata (v9.25, js/voucher-rules.js terpasang di legacy). Jalankan: python3 tests/e2e/voucher.e2e.py
Menyemai promosi lewat kalsara_v3 lalu memeriksa tab Hitung: voucher toko/produk dipakai, dan voucher yang kuotanya habis,
sudah berakhir, atau minimum belanjanya tak terpenuhi TIDAK dipakai. Menangkap pageerror (mis. sisa global yang sudah dipindah ke modul)."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8128
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
N = 40
rows = [dict(id=f'p{i}', n=f'Produk {i:02d}', m=20000 + (i % 10) * 997, d=0, p=0, t=1000, q=1, s=20, live=True, ha=0, hd=0,
             c=False, cx=0, sd='', mb=20000, mh=[], ack=False, sup='', sku='', lnk='', o=None) for i in range(N)]
base = dict(id='v1', t='vc', jt='toko', u='pct', a=10, cp=0, b=0, x=0, y=0, s='', e='', n='Uji')
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
def run(p, prs):
    seed = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=prs, sl=[], ts=1)))
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
    ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(seed)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{PORT}/index.html')
    pg.wait_for_function("document.getElementById('s1') && document.getElementById('s1').textContent==='%d'" % N, timeout=60000); pg.wait_for_timeout(800)
    pg.locator('nav button').nth(1).click(); pg.wait_for_timeout(800)
    cards = pg.evaluate("[...document.querySelectorAll('#list .pc:not(.lz)')].slice(0,2).map(c=>c.innerText)")
    b.close()
    check(not errs, 'tidak boleh ada pageerror: ' + '; '.join(errs)); check(len(cards) == 2, 'dua kartu pertama harus terbangun')
    return cards
try:
    with sync_playwright() as p:
        c0, c1 = run(p, [])
        check('Voucher dihitung' not in c0 and 'Voucher dihitung' not in c1, 'tanpa promosi tidak boleh ada voucher dihitung')
        listing0 = 'Harga listing awal | Rp 34.500'.replace(' | ', '\n')
        check(listing0 in c0, 'harga listing dasar tanpa voucher harus Rp 34.500')
        t0, t1 = run(p, [base])
        check('Voucher dihitung: Voucher Toko 10% (Uji)' in t0 and 'Voucher dihitung: Voucher Toko 10% (Uji)' in t1, 'voucher toko berlaku untuk semua produk')
        check('Harga listing awal\nRp 38.400' in t0, 'voucher toko 10% menaikkan harga listing p0 menjadi Rp 38.400')
        check('dengan voucher Rp 26.880 (naik Rp 2.730)' in t0, 'ringkasan voucher menampilkan harga dengan voucher dan kenaikannya')
        k0, k1 = run(p, [dict(base, jt='produk', p='p0', n='Khusus')])
        check('Voucher Produk 10% (Khusus)' in k0, 'voucher produk berlaku di produk p0')
        check('Voucher dihitung' not in k1, 'voucher produk TIDAK berlaku di produk lain')
        for nama, v in [('kuota habis', dict(base, x=5, y=5)), ('sudah berakhir', dict(base, e='2020-01-01')), ('belum mulai', dict(base, s='2099-01-01')),
                        ('minimum belanja tak terpenuhi', dict(base, b=10000000)), ('cashback bukan voucher harga', dict(base, u='cb')), ('voucher Live', dict(base, jt='live'))]:
            a, bb = run(p, [v])
            check('Voucher dihitung' not in a and 'Voucher dihitung' not in bb, nama + ': voucher tidak boleh dipakai')
    print(f'E2E Voucher: {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
