"""E2E tab Cek tarif (panel "Cek pesanan nyata", dialog peringatan selisih, dialog panduan) di Chromium nyata
(v9.27: js/voucher-panel.js terpasang di legacy). Jalankan: python3 tests/e2e/voucher-panel.e2e.py
Alur: buka tab Tarif, pilih produk lewat kolom cari (isi otomatis harga/voucher), Bandingkan dengan kolom kosong (selisih),
klik tombol "Set ... dari pesanan ini" (mengubah tarif toko + catatan perubahan), isi angka persis perkiraan aplikasi (semua cocok,
tanggal cek tarif diperbarui), buat selisih lalu abaikan peringatan lewat dialog (validasi alasan, fokus kembali, tersimpan),
dialog panduan (buka/Escape), mode pesanan campuran, pilihan isi-otomatis yang tersimpan, dan muat ulang.
Menangkap pageerror dan error konsol (mis. sisa global yang sudah pindah ke modul)."""
import datetime, json, os, re, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8130
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
TODAY = datetime.date.today().isoformat()
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000, d=0, p=0, t=1000, q=1, s=20, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=0, mh=[], ack=False, sup='', sku='', lnk='', o=None)
    r.update(kw); return r
rows = [mkrow(1, n='Rak Buku', m=42320), mkrow(2, n='Kaos Polos', m=20000), mkrow(3, n='Tanpa Modal', m=0)]
SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=[], ts=1)))
LABELS = [('Biaya proses pesanan', 'fx'), ('Biaya administrasi', 'ad'), ('Gratis Ongkir XTRA', 'gx'), ('Promo XTRA', 'px'), ('Video/Live XTRA', 'vl'), ('Biaya pembayaran/layanan lain', 'pay'), ('Premi', 'pm'), ('PPh 22 (Pajak)', 'tx')]
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
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(500)
        wait_toast = lambda s: pg.wait_for_function("t => document.getElementById('tt').textContent.includes(t)", arg=s, timeout=5000)
        def tab(n): pg.click(f'#t{n}'); pg.wait_for_timeout(300)
        active = lambda: pg.evaluate("document.activeElement && document.activeElement.id")
        vfr = lambda: pg.inner_text('#vfr')
        def pick(sel_locator, text):
            inp = sel_locator; inp.click(); pg.wait_for_selector('.vfcl:not([hidden]) li[data-v]', timeout=3000)
            pg.locator('.vfcl:not([hidden]) li[data-v]', has_text=text).first.click(); pg.wait_for_timeout(250)
        def expected():
            out = {}
            for blk in pg.evaluate("[...document.querySelectorAll('#vfr .wn.r')].map(e=>e.innerText)"):
                for lab, k in LABELS:
                    if blk.startswith(lab + ' meleset'):
                        m = re.search(r'Aplikasi Rp ([\d.]+)', blk); out[k] = int(m.group(1).replace('.', ''))
            return out

        # 1. Tab Tarif terbuka; daftar produk dibangun dari rows terbaru (modal 0 tidak masuk)
        tab(5)
        check(pg.is_visible('#vfd .sb') and pg.is_hidden('#vig'), 'panel Cek tarif tampil, tombol abaikan peringatan tersembunyi (belum ada selisih)')
        opts = pg.evaluate("[...document.querySelectorAll('#vfp option')].map(o=>o.textContent)")
        check(opts == ['Pilih produk', 'Rak Buku', 'Kaos Polos'], 'opsi produk dari rows terbaru, tanpa produk bermodal 0: %r' % opts)
        check(pg.input_value('#vf_n') == '1' and pg.is_checked('#vfa') and pg.inner_text('#vfas') == 'Aktif', 'jumlah 1 dan isi otomatis aktif secara bawaan')

        # 2. Pilih produk lewat kolom cari -> harga dan voucher terisi otomatis
        pick(pg.locator('.vfc input').first, 'Rak Buku')
        check(pg.input_value('.vfc input') == 'Rak Buku', 'kolom cari menampilkan produk yang dipilih')
        L = int(pg.input_value('#vf_L') or 0); check(L > 0 and pg.is_visible('#vfn') and 'Terisi otomatis dari harga produk sekarang' in pg.inner_text('#vfn'), 'harga terisi otomatis dan catatan tampil')
        pg.fill('#vf_n', '2'); pg.wait_for_timeout(200); L2 = int(pg.input_value('#vf_L'))
        check(L2 == 2 * L, 'mengubah jumlah barang mengisi ulang harga (2 x %d = %d)' % (L, L2)); pg.fill('#vf_n', '1'); pg.wait_for_timeout(200)

        # 3. Bandingkan dengan kolom kosong -> selisih; tombol "Set ... dari pesanan ini" mengubah tarif toko
        pg.click('#vfg'); pg.wait_for_timeout(300)
        exp = expected()
        check('meleset' in vfr() and 'Dasar hitungan aplikasi' in vfr() and 'Produk: Rak Buku' in vfr(), 'selisih ditandai dan dasar hitungan memuat nama produk')
        check(exp.get('ad', 0) > 0 and exp.get('gx', 0) > 0 and exp.get('pm', 0) > 0, 'perkiraan aplikasi terbaca dari hasil (admin, ongkir XTRA, premi): %r' % exp)
        btn = pg.locator('#vfr [data-vfa^="pm|"]'); check(btn.count() == 1 and 'Set ke 0%' in btn.inner_text(), 'tombol "Set ke 0%" untuk Premi tersedia')
        btn.click(); wait_toast('Premi diperbarui dari pesanan ini'); pg.wait_for_timeout(400)
        check('Premi diatur tidak ikut (0%) mengikuti pesanan nyata' in pg.text_content('#tll'), 'perubahan tercatat di Catatan perubahan tarif (tlPush + tlRender)')
        check(re.search(r'Premi\s+Cocok', vfr()) is not None, 'dicek ulang otomatis: Premi sekarang cocok pada 0 (A diubah lewat state)')

        # 4. Isi persis perkiraan aplikasi -> semua cocok, tanggal cek tarif diperbarui
        exp = expected()
        for lab, k in LABELS:
            pg.fill('#vf_' + k, str(exp.get(k, 0)))
        pg.click('#vfg'); pg.wait_for_timeout(300)
        check('Semua komponen cocok' in vfr() and 'Tanggal cek tarif diperbarui ke hari ini' in vfr(), 'angka persis perkiraan -> semua cocok dan tanggal cek diperbarui')
        check(pg.input_value('#tchk') == TODAY, 'kolom "Tarif terakhir dicek" terisi hari ini')
        check(pg.is_hidden('#vig'), 'tidak ada peringatan selisih setelah semua cocok')

        # 5. Selisih -> peringatan; dialog abaikan peringatan
        pg.fill('#vf_ad', str(exp['ad'] + 5000)); pg.click('#vfg'); pg.wait_for_timeout(300)
        check('Ada 1 selisih' in vfr() and 'Biaya administrasi meleset +Rp 5.000' in vfr(), 'satu selisih Biaya administrasi +Rp 5.000 terdeteksi')
        tab(0); tab(5)
        check(pg.is_visible('#vig'), 'berpindah tab memicu vgSync: tombol abaikan peringatan muncul')
        pg.click('#vig'); pg.wait_for_timeout(200)
        check(pg.is_visible('#vgd') and active() == 'vgr' and 'Biaya administrasi' in pg.inner_text('#vgc'), 'dialog terbuka, fokus di kolom alasan, menyebut komponen yang selisih')
        pg.click('#vgy'); check(pg.is_visible('#vge') and pg.is_visible('#vgd'), 'alasan kosong ditolak dengan pesan galat (dialog tetap terbuka)')
        pg.fill('#vgr', 'a '); pg.click('#vgy'); check(pg.is_visible('#vgd') and pg.is_visible('#vge'), 'alasan terlalu pendek (<3 huruf) ditolak')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        check(pg.is_hidden('#vgd') and active() == 'vig', 'Escape menutup dialog dan mengembalikan fokus ke tombol pemicu (dprev lewat getter/setter)')
        pg.click('#vig'); pg.locator('[data-vgq]').first.click(); check(pg.input_value('#vgr') != '' and pg.is_hidden('#vge'), 'tombol alasan cepat mengisi kolom alasan')
        pg.fill('#vgr', 'Tarif promo toko berlaku mulai bulan ini'); pg.click('#vgy'); wait_toast('Peringatan diabaikan dan dicatat'); pg.wait_for_timeout(300)
        check(pg.is_hidden('#vgd') and pg.is_hidden('#vig') and pg.is_visible('#vigi'), 'dialog tertutup; tombol hilang; catatan peringatan diabaikan tampil')
        t = pg.inner_text('#vigi'); check('diabaikan pada' in t and 'Tarif promo toko berlaku mulai bulan ini' in t and 'Biaya administrasi' in t, 'catatan memuat tanggal, alasan, dan komponen')
        check('Peringatan selisih tarif diabaikan (Biaya administrasi)' in pg.text_content('#tll'), 'pengabaian dicatat di Catatan perubahan tarif')

        # 6. Dialog panduan
        pg.click('#v5 .hb[data-gd="2"]'); pg.wait_for_timeout(250)
        check(pg.is_visible('#gd') and pg.is_visible('#gdb details[data-ch="2"][open]'), 'dialog panduan terbuka di bab 2')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        check(pg.is_hidden('#gd') and active() != 'gdx', 'Escape menutup dialog panduan')

        # 7. Pesanan campuran: baris produk tambahan dan hasil campuran
        pg.check('#vfm'); pg.wait_for_timeout(200)
        check(pg.is_visible('#vfx') and pg.inner_text('#vfms') == 'Aktif' and pg.locator('#vfxl .vfxr').count() == 1, 'mode campuran aktif dan satu baris produk tambahan dibuat otomatis')
        check(pg.inner_text('#vfxl .vt') == 'Produk tambahan 1', 'baris diberi nomor')
        pick(pg.locator('#vfxl .vfc input').first, 'Kaos Polos')
        L3 = int(pg.input_value('#vf_L')); check('Terisi otomatis dari harga 2 produk' in pg.inner_text('#vfn') and L3 > L, 'harga otomatis menjumlah dua produk (%d > %d)' % (L3, L))
        pg.click('#vfg'); pg.wait_for_timeout(300)
        check('pesanan campuran' in vfr() and 'Produk Rak Buku' not in vfr() and 'Kaos Polos' in vfr() and 'Rak Buku' in vfr(), 'dasar hitungan pesanan campuran menyebut kedua produk')
        pg.click('#vfxl .vfxr button'); pg.wait_for_timeout(200)
        check(pg.locator('#vfxl .vfxr').count() == 0, 'tombol Hapus menghapus baris tambahan')
        pg.uncheck('#vfm'); pg.wait_for_timeout(200); check(pg.is_hidden('#vfx') and pg.inner_text('#vfms') == 'Mati', 'mode campuran dimatikan')

        # 8. Bandingkan di langkah 7 menimpa A.ver (hasil baru): peringatan muncul lagi, abaikan lagi, lalu uji ketahanan setelah muat ulang
        tab(0); tab(5); check(pg.is_visible('#vig') and pg.is_hidden('#vigi'), 'pengecekan baru menimpa hasil lama: peringatan muncul lagi, catatan abaikan lama hilang')
        pg.click('#vig'); pg.fill('#vgr', 'Alasan kedua setelah cek campuran'); pg.click('#vgy'); wait_toast('Peringatan diabaikan dan dicatat'); pg.wait_for_timeout(300)
        # 9. Isi otomatis dimatikan -> tersimpan; muat ulang -> tetap mati, catatan tarif dan peringatan diabaikan bertahan
        pg.uncheck('#vfa'); wait_toast('Isi sendiri harga dan voucher'); check(pg.input_value('#vf_L') == '' and pg.inner_text('#vfas') == 'Mati', 'isi otomatis dimatikan mengosongkan harga dan voucher')
        pg.wait_for_timeout(600); pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(500); tab(5)
        check(not pg.is_checked('#vfa') and pg.inner_text('#vfas') == 'Mati', 'pilihan isi otomatis (kalsara_vfauto) bertahan setelah muat ulang')
        check(pg.is_visible('#vigi') and 'Alasan kedua setelah cek campuran' in pg.inner_text('#vigi'), 'peringatan yang diabaikan (A.ver.ig) bertahan setelah muat ulang dan tampil lewat vgSync')
        check('mengikuti pesanan nyata' in pg.text_content('#tll'), 'catatan perubahan tarif bertahan setelah muat ulang')
        check(pg.input_value('#tchk') == TODAY, 'tanggal cek tarif bertahan setelah muat ulang')
        check(not errs, 'tidak boleh ada pageerror/error konsol: ' + '; '.join(errs))
        b.close()
    print(f'E2E Cek tarif (panel voucher): {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
