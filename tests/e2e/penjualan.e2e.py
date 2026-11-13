"""E2E tab Penjualan/Laporan di Chromium nyata (v9.26: js/state.js + js/penjualan.js terpasang di legacy).
Jalankan: python3 tests/e2e/penjualan.e2e.py
Alur: jual dari Etalase (tombol -), baca Laporan (harian/bulanan/navigasi periode), hapus dengan gembok dan konfirmasi
(stok kembali), ubah harga dan tanggal, ekspor CSV, hapus massal, lalu muat ulang untuk membuktikan penyimpanan dan pemulihan SALES.
Menangkap pageerror dan error konsol (mis. sisa global yang sudah pindah ke modul)."""
import datetime, json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8129
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
D = datetime.date.today(); TODAY = D.isoformat(); YEST = (D - datetime.timedelta(days=1)).isoformat(); OLD = (D - datetime.timedelta(days=40)).isoformat()
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000, d=0, p=0, t=1000, q=1, s=20, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=0, mh=[], ack=False, sup='', sku='', lnk='', o=None)
    r.update(kw); return r
def sale(i, d, p, n, a, u):
    ts = int(datetime.datetime.fromisoformat(d + 'T10:30:00').timestamp() * 1000)
    return dict(i=i, t=ts, d=d, p=p, n=n, a=a, u=u, pi=a, ui=u, sr='ideal')
rows = [mkrow(1, n='Rak Buku', m=42320, s=5), mkrow(2, n='Kaos Polos', m=20000, s=40)]
sales = [sale('sY', YEST, 'p2', 'Kaos Polos', 30000, 4000), sale('sO', OLD, 'p2', 'Kaos Polos', 31000, 5000)]
SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=sales, ts=1)))
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block', accept_downloads=True); ctx.add_init_script(SEED)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'signals' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(500)
        toast = lambda: pg.evaluate("document.getElementById('tt').textContent")
        wait_toast = lambda s: pg.wait_for_function("t => document.getElementById('tt').textContent.includes(t)", arg=s, timeout=5000)
        card = lambda i: pg.locator('#shl kalsara-product-card').nth(i)
        stock = lambda i: card(i).locator('input[inputmode=numeric]').input_value()
        rpv = lambda: pg.inner_text('#rpv')
        def tab(n): pg.click(f'#t{n}'); pg.wait_for_timeout(300)
        def sell(i):
            c = card(i)
            if c.locator('.lkb.on').count() == 0: c.locator('.lkb').click(); pg.wait_for_timeout(200)
            card(i).locator('.stp button').nth(0).click(); pg.wait_for_timeout(300)

        # 1. Laporan awal: hanya penjualan seeded, hari ini kosong
        tab(4)
        check('Laporan penjualan' in pg.inner_text('#v4') and 'Omzet' in rpv(), 'tab Laporan tampil dengan ringkasan')
        check('Tidak ada penjualan di periode ini' in rpv(), 'hari ini belum ada penjualan')
        check(pg.locator('#rpv [data-rn="1"]').is_disabled(), 'tombol periode berikutnya nonaktif pada hari ini')
        pg.click('#rpv [data-rn="-1"]'); pg.wait_for_timeout(150)
        check('Kaos Polos' in rpv() and 'Rp 30.000' in rpv() and '1 pcs' in rpv(), 'kemarin menampilkan penjualan seeded')
        pg.click('#rpv [data-rn="1"]'); pg.wait_for_timeout(150)

        # 2. Jual dari Etalase -> tercatat di Laporan
        tab(0); check(stock(0) == '5', 'stok awal Rak Buku 5')
        sell(0); wait_toast('Terjual 1')
        check(stock(0) == '4', 'tombol - mengurangi stok 5 -> 4'); check('Untung' in toast() or 'Rugi' in toast(), 'toast memuat untung/rugi')
        tab(4)
        check('Rak Buku' in rpv() and 'Daftar penjualan' in rpv(), 'penjualan baru muncul di daftar hari ini')
        check('1 pcs' in pg.inner_text('#rpv .q4g'), 'ringkasan: Terjual 1 pcs')
        check('Produk paling untung' in rpv() and 'Stok cepat laku' in rpv(), 'bagian produk paling untung dan stok cepat laku')

        # 3. Bulanan lalu harian
        pg.click('#rpv [data-rm="m"]'); pg.wait_for_timeout(150)
        check('Per hari' in rpv(), 'tampilan bulanan memuat rincian per hari')
        pg.click('#rpv [data-rm="d"]'); pg.wait_for_timeout(150); check('Daftar penjualan' in rpv(), 'kembali ke harian')

        # 4. Hapus: terkunci -> buka gembok -> konfirmasi -> stok kembali
        sid = pg.get_attribute('#rpv [data-sid]', 'data-sid')
        pg.click(f'#rpv [data-del="{sid}"]', force=True); wait_toast('Terkunci')
        pg.click(f'#rpv [data-rl="{sid}"]'); wait_toast('terbuka 10 detik')
        pg.click(f'#rpv [data-del="{sid}"]'); pg.wait_for_selector('#dlg:not([hidden])', timeout=3000)
        check('stok produk dikembalikan' in pg.inner_text('#dlgm').lower(), 'dialog konfirmasi hapus menyebut stok dikembalikan')
        pg.click('#dy'); wait_toast('Penjualan dihapus'); check('Tidak ada penjualan di periode ini' in rpv(), 'penjualan hari ini terhapus')
        tab(0); check(stock(0) == '5', 'hapus penjualan mengembalikan stok 4 -> 5')

        # 5. Jual lagi, ubah harga dan tanggal
        sell(0); wait_toast('Terjual 1'); tab(4)
        pg.click('#rpv .q4w summary'); pg.wait_for_timeout(200)
        inp = pg.locator('#rpv [data-ep]'); inp.fill('99999'); inp.dispatch_event('change'); wait_toast('Penjualan diperbarui')
        check('Rp 99.999' in rpv(), 'harga jual diubah dan dihitung ulang')
        pg.click('#rpv .q4w summary'); pg.wait_for_timeout(200)  # rpt() menggambar ulang, <details> menutup
        d_inp = pg.locator('#rpv [data-ed]'); d_inp.fill(YEST); wait_toast('Penjualan diperbarui')  # fill pada input date sudah memicu 'change' sendiri
        check('Tidak ada penjualan di periode ini' in rpv(), 'tanggal dipindah ke kemarin: hari ini kosong')
        pg.click('#rpv [data-rn="-1"]'); pg.wait_for_timeout(150)
        check('Rak Buku' in rpv() and '2 pcs' in pg.inner_text('#rpv .q4g'), 'kemarin kini memuat 2 penjualan')

        # 6. Ekspor CSV
        with pg.expect_download(timeout=8000) as dli: pg.click('#rpv [data-exp]')
        dlf = dli.value; check(dlf.suggested_filename.startswith('penjualan-wulfeg-') and dlf.suggested_filename.endswith('.csv'), 'nama berkas CSV')
        txt = open(dlf.path(), encoding='utf-8-sig').read(); check(txt.startswith('Tanggal;Jam;Produk') and 'Rak Buku' in txt and txt.count('\n') >= 3, 'isi CSV: judul kolom + 3 penjualan')
        pg.click('#rpv [data-excp]'); pg.wait_for_timeout(500)
        check(pg.evaluate("(()=>{var b=document.getElementById('cpbox');return !!b&&(!b.hidden||/Salin|disalin/i.test(document.getElementById('tt').textContent))})()"), 'Salin CSV: tersalin atau kotak manual terbuka')

        # 7. Muat ulang: SALES tersimpan dan dibaca lewat applyState
        pg.wait_for_timeout(900); pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(500)
        tab(4); pg.click('#rpv [data-rn="-1"]'); pg.wait_for_timeout(150)
        check('2 pcs' in pg.inner_text('#rpv .q4g'), 'setelah muat ulang, 2 penjualan kemarin tetap ada')

        # 8. Hapus massal
        pg.click('#rpv [data-bk="per"]', force=True); wait_toast('Terkunci')
        pg.click('#rpv [data-rl="_bulk"]'); wait_toast('terbuka 10 detik')
        pg.click('#rpv [data-bk="all"]'); pg.wait_for_selector('#dlg:not([hidden])', timeout=3000)
        check('SEMUA 3' in pg.inner_text('#dlgm'), 'konfirmasi hapus semua menyebut 3 catatan')
        pg.click('#dy'); wait_toast('catatan penjualan dihapus'); check('Belum ada penjualan' in rpv(), 'setelah hapus semua, laporan kosong')
        pg.wait_for_timeout(900); pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(500)
        tab(4); check('Belum ada penjualan' in rpv(), 'hapus massal bertahan setelah muat ulang')
        tab(0); sell(1); wait_toast('Terjual 1'); tab(4)
        check('Kaos Polos' in rpv() and '1 pcs' in pg.inner_text('#rpv .q4g'), 'penjualan baru tercatat setelah hapus massal (SALES baru terbaca)')
        check(not errs, 'tidak boleh ada error JS/konsol: %s' % errs)
        ctx.close(); b.close()
finally:
    srv.terminate()
print(f'E2E Penjualan: {ok} assertions passed di Chromium nyata')
