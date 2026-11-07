"""E2E tabel tarif (tab Cek tarif, bagian "Tabel tarif Shopee") di Chromium nyata (v9.30: js/tarif-ui.js terpasang di legacy).
Jalankan: python3 tests/e2e/tarif.e2e.py
Alur: tabel tarif dibangun (34 kotak; kategori I tanpa Ongkir), peringatan tanggal cek tarif muncul lalu hilang setelah tanggal diisi,
mengubah tarif memperbarui label opsi kategori dan bertahan setelah muat ulang, nilai >100 dibatasi 100, desimal koma diterima,
tombol Kembalikan memulihkan tarif bawaan (label, kotak, toast) dan juga bertahan setelah muat ulang. Menangkap pageerror dan error konsol."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8132
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000, d=0, p=0, t=1000, q=1, s=20, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=0, mh=[], ack=False, sup='', sku='', lnk='', o=None)
    r.update(kw); return r
rows = [mkrow(1, n='Rak Buku', m=42320), mkrow(2, n='Kaos Polos')]
SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=[], ts=1)))
TODAY = "(function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})()"
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(SEED)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'signals' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(600)
        inp = lambda k: pg.locator(f'[data-t="{k}"]')
        optA = lambda: pg.evaluate("document.querySelector('#ac option[value=A]').textContent")
        optC = lambda: pg.evaluate("document.querySelector('#ac option[value=C]').textContent")
        def open_tarif(): pg.click('#t5'); pg.evaluate("document.querySelectorAll('#v5 details').forEach(function(d){d.open=true})"); pg.wait_for_timeout(300)

        # 1. Tabel tarif dibangun
        open_tarif()
        check(pg.is_visible('#v5') and pg.is_visible('#tbl') and pg.locator('#tbl [data-t]').count() == 34, 'tab Cek tarif menampilkan 34 kotak tarif (9 admin x2 + 8 ongkir x2)')
        check(inp('GO|0|I').count() == 0 and inp('GO|1|H').count() == 1 and inp('AD|1|I').count() == 1, 'kategori I hanya punya Admin (tanpa Ongkir)')
        check(inp('AD|0|A').input_value() == '10' and inp('GO|0|B').input_value() == '2' and inp('AD|1|A').input_value() == '11,7', 'kotak terisi tarif bawaan (koma desimal)')
        check(optA().startswith('A (10%)') and optC().startswith('C (9%)'), 'label opsi kategori admin memuat tarif bawaan')

        # 2. Peringatan tanggal cek tarif: muncul saat kosong, hilang setelah diisi
        txt0 = lambda: pg.evaluate("document.getElementById('tw0').hidden?'':document.getElementById('tw0').textContent")
        check('belum diisi' in txt0(), 'peringatan "tanggal pengecekan belum diisi" tampil bila tanggal kosong')
        pg.fill('#tchk', pg.evaluate(TODAY)); pg.wait_for_timeout(300)
        check(txt0() == '' and pg.evaluate("document.getElementById('tw').hidden"), 'peringatan hilang setelah tanggal cek diisi hari ini')
        pg.fill('#tchk', '2025-01-01'); pg.wait_for_timeout(300)
        check('hari lalu' in txt0(), 'tanggal cek lama memunculkan peringatan "hari lalu"')
        pg.fill('#tchk', pg.evaluate(TODAY)); pg.wait_for_timeout(300)

        # 3. Ubah tarif: label berubah, batas 100, desimal koma, nilai tak valid diabaikan
        inp('AD|0|A').fill('12'); pg.wait_for_timeout(300)
        check(optA().startswith('A (12%)'), 'mengubah Admin A menjadi 12 memperbarui label opsi')
        inp('AD|0|C').fill('7,5'); pg.wait_for_timeout(300)
        check(optC().startswith('C (7,5%)'), 'desimal dengan koma diterima (7,5)')
        inp('GO|1|B').fill('150'); pg.wait_for_timeout(300)
        check(inp('GO|1|B').input_value() == '100', 'nilai di atas 100 dibatasi menjadi 100')
        inp('AD|0|D').fill('-5'); pg.wait_for_timeout(300)
        check(pg.evaluate("document.querySelector('#ac option[value=D]').textContent").startswith('D (8,25%)'), 'nilai negatif diabaikan (tarif D tetap bawaan)')
        inp('AD|0|D').fill('abc'); pg.wait_for_timeout(300)
        check(pg.evaluate("document.querySelector('#ac option[value=D]').textContent").startswith('D (8,25%)'), 'teks bukan angka diabaikan')

        # 4. Bertahan setelah muat ulang
        pg.wait_for_timeout(800); pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(600); open_tarif()
        check(inp('AD|0|A').input_value() == '12' and inp('AD|0|C').input_value() == '7,5' and inp('GO|1|B').input_value() == '100', 'tarif yang diubah bertahan setelah muat ulang')
        check(optA().startswith('A (12%)') and optC().startswith('C (7,5%)'), 'label opsi mengikuti tarif tersimpan setelah muat ulang')

        # 5. Tombol Kembalikan: kotak, label, toast, dan tetap setelah muat ulang
        pg.click('#tr'); pg.wait_for_timeout(300)
        check(inp('AD|0|A').input_value() == '10' and inp('AD|0|C').input_value() == '9' and inp('GO|1|B').input_value() == '3,5', 'Kembalikan memulihkan semua kotak ke tarif bawaan')
        check(optA().startswith('A (10%)') and optC().startswith('C (9%)'), 'Kembalikan memulihkan label opsi')
        check('Tabel tarif dikembalikan' in pg.inner_text('#tt'), 'toast "Tabel tarif dikembalikan" tampil')
        pg.wait_for_timeout(800); pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(600); open_tarif()
        check(inp('AD|0|A').input_value() == '10' and optA().startswith('A (10%)'), 'pemulihan tarif bawaan bertahan setelah muat ulang')

        check(not errs, 'tanpa pageerror/error konsol: ' + '; '.join(errs[:3]))
        b.close()
    print(f'E2E Tarif: {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
