"""E2E v9.50 di Chromium nyata: baris rincian (teks + angka). Teks panjang turun ke baris ke-2 di kolomnya sendiri,
angka tetap di kanan dan SEJAJAR dengan baris TERAKHIR teks (bukan pindah ke baris sendiri). Diukur dengan geometri nyata
pada lebar HP sempit (320) dan umum (412). Struktur HTML disalin dari kode aplikasi (dijaga tests/baris-rincian.test.mjs).
Jalankan: python3 tests/e2e/baris-rincian.e2e.py"""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8132
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
# (jenis, teks, angka). 'rw' = teks + <b> (kartu Hitung/Promosi); 'erw' = span.erl + span.era (laporan ERP).
ROWS = [
    ('rw', 'Voucher Toko 8% (Voucher Toko Migrasi 8%)', '- Rp 6.498', True),
    ('rw', 'Modal + Management Partner + packing', 'Rp 54.050', True),
    ('rw', 'Harga setelah voucher', 'Rp 74.730', False),
    ('erw', 'Voucher, diskon &amp; pengembalian dana', '-Rp337.500', True),
    ('erw', 'Biaya Gratis Ongkir XTRA / layanan', '-Rp180.000', True),
    ('erw', 'Premi', '-Rp9.000', False),
]
def html(w):
    out = ['<div id="uji" style="padding:12px 16px;background:var(--card);box-sizing:border-box;width:%dpx">' % (w - 24)]
    for k, t, a, _ in ROWS:
        out.append('<div class="rw">%s<b>%s</b></div>' % (t, a) if k == 'rw' else '<div class="erw"><span class="erl">%s</span><span class="era">%s</span></div>' % (t, a))
    return ''.join(out) + '</div>'
# Ukur: baris-baris teks (dari Range), kotak angka, kotak wadah.
MEASURE = """() => [...document.querySelectorAll('#uji > div')].map(row => {
  const num = row.querySelector('b, .era'), lab = row.querySelector('.erl');
  const r = document.createRange(); r.selectNodeContents(lab || row.firstChild);
  const lines = [...r.getClientRects()].filter(x => x.width > 0);
  const tops = []; lines.forEach(x => { if (!tops.some(t => Math.abs(t - x.top) < 3)) tops.push(x.top) });
  const last = lines.reduce((m, x) => x.bottom > m.bottom ? x : m, lines[0]);
  const nb = num.getBoundingClientRect(), rb = row.getBoundingClientRect();
  return {lines: tops.length, numTop: nb.top, numBottom: nb.bottom, numRight: nb.right, numH: nb.height, rowRight: rb.right, lastTop: last.top, lastBottom: last.bottom}
})"""
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        for w in (320, 412):
            ctx = b.new_context(viewport={'width': w, 'height': 800}, service_workers='block'); pg = ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_function("document.getElementById('s1')!==null", timeout=60000); pg.wait_for_timeout(800)
            pg.evaluate("h=>{const d=document.createElement('div');d.innerHTML=h;document.body.prepend(d)}", html(w))
            res = pg.evaluate(MEASURE)
            # tinggi acuan 1 baris angka = baris pendek sejenis (font kartu dan font laporan ERP berbeda ukuran)
            ref = {k: m['numH'] for (k, _, _, panjang), m in zip(ROWS, res) if not panjang}
            for (k, t, a, panjang), m in zip(ROWS, res):
                tag = f'[{w}px {k}] {t[:30]}'
                check(m['numH'] <= ref[k] * 1.3, tag + ': angka tidak boleh patah jadi 2 baris')
                # angka berada di kanan wadah (selisih kecil = bantalan baris)
                check(m['rowRight'] - m['numRight'] <= 4, tag + ': angka harus rata kanan')
                # angka menumpuk secara vertikal dengan baris TERAKHIR teks, bukan di baris sendiri di bawahnya
                check(m['numTop'] < m['lastBottom'] - 2 and m['numBottom'] > m['lastTop'] + 2, tag + ': angka harus sejajar dengan baris terakhir teks')
                check(abs(m['numBottom'] - m['lastBottom']) <= 4, tag + ': dasar angka = dasar baris terakhir teks')
                if panjang and w == 320: check(m['lines'] >= 2, tag + ': teks panjang harus turun ke 2 baris')
                if not panjang: check(m['lines'] == 1, tag + ': teks pendek tetap 1 baris')
            if w == 320:  # kasus yang dikeluhkan: ada baris panjang yang benar-benar turun dan angka mengikuti baris ke-2
                dua = [m for m in res if m['lines'] >= 2]
                check(len(dua) >= 3, 'minimal 3 baris contoh benar-benar jatuh 2 baris pada 320px')
                check(all(m['numTop'] > m['lastTop'] - 6 for m in dua), 'angka mulai di baris ke-2, bukan di baris pertama')
            check(pg.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), f'[{w}px] halaman tidak boleh melebar ke samping')
            check(not errs, f'[{w}px] tanpa galat JS: {errs}')
            ctx.close()
        b.close()
    print(f'Baris rincian E2E (v9.50): {ok} pernyataan lulus.')
finally:
    srv.terminate()
