# Catatan perubahan (CHANGELOG) Wulfeg

Aturan: SETIAP sesi yang mengubah paket menambah satu entri di paling atas (terbaru di atas), memakai nomor `paket` dari `js/version.js`. Tes `tests/dokumentasi.test.mjs` gagal bila entri versi saat ini tidak ada. Entri berisi: apa yang berubah (bahasa awam), berkas yang disentuh, bukti uji (dan di mana dijalankan), serta hal yang belum terbukti.

Catatan kejujuran: entri v9.40 ke atas ditulis rapi saat kejadian. Entri sebelumnya diringkas ulang dari `arsip/MIGRATION-STATUS.md` (arsip lengkap); v9.36 sampai v9.39 tidak punya bagian sendiri di arsip, jadi hanya disebut sebagai rangkaian tahap 6.

## v9.58 - Impor massal untuk pengguna baru (template Excel, impor .xlsx) dan perbaikan baris rincian (26 Nov 2026)
- Kartu sambutan: tombol utama "Pilih file Excel atau CSV" (file .xlsx dibaca langsung, tidak perlu "Simpan sebagai CSV") dan "Tempel dari Excel / Google Sheet" (modul baru `js/impor-pemula.js`). Keduanya diubah menjadi teks CSV lalu diserahkan ke alur impor lama (`#xf`), jadi aturan SKU kembar, batas produk, dan dialog konfirmasi tidak berubah.
- Template Excel (.xlsx) dibuat langsung di browser (penulis zip tanpa library di `js/impor-pemula.js`): lembar "Produk" (judul tebal, baris pertama dibekukan, kolom SKU berformat teks, satu baris contoh) dan lembar "Petunjuk". Tombolnya ada di kartu sambutan dan di bagian Impor dan ekspor CSV; template CSV lama tetap ada. Dicek terbuka di openpyxl dan LibreOffice.
- Baris contoh bawaan template ("CONTOH - GANTI DENGAN PRODUK ANDA", "Contoh produk A") tidak lagi ikut terimpor sebagai produk sungguhan.
- Dialog impor menyebut nomor baris yang dilewati karena modal kosong atau 0.
- Perbaikan (ditemukan dari CI): E2E `baris-rincian` gagal di runner GitHub ("Harga setelah voucher: teks pendek tetap 1 baris" pada 320px). Penyebab: ikon ⓘ v9.57 disisipkan `js/tips.js` sebagai item flex ketiga di baris `.rw`; bersama celah 14px di kedua sisinya ia menyempitkan teks sampai teks pendek jatuh ke baris kedua pada font yang lebih lebar dari font pengembangan (terbukti dengan DejaVu Sans). Perbaikan di `css/app.css`: margin ikon `.rw>.ib` dari `-4px auto -4px -10px` menjadi `-4px -10px -4px -10px` (celah ke angka tinggal 4px).
- Tes: `tests/e2e/baris-rincian.e2e.py` kini mengukur dasar glif angka dengan Range (sama jenisnya dengan dasar glif teks) karena kotak baris angka bergantung metrik font (di Liberation Sans selisihnya 4,8px padahal tampak sejajar). Syaratnya tidak dilonggarkan. Bukti: 62 pernyataan lulus di Chromium sandbox dengan font bawaan, DejaVu Sans, Liberation Sans, dan Carlito.
- Rumus tidak berubah. Bukti uji: unit test lulus di sandbox sesi; E2E `baris-rincian`, `tips` terkait lulus di Chromium sandbox. BELUM: GitHub Actions penuh dan uji manual di Excel/Google Sheets asli dan HP asli.

## v9.57 - Footer dari version.js, ikon ⓘ penjelas istilah, label biaya tambahan (20 Nov 2026)
- Permintaan pemilik: (1) footer masih tertulis "versi 5.82 (29 Okt 2026)" padahal paket v9.56; (2) ikon ⓘ di tiap istilah berisi satu kalimat dan contoh angka, ganti label seperlunya; (3) footer membaca version.js, hapus "Progressive Web App" di header.
- Footer: teks tertulis tangan dihapus dari `index.html`; `js/main.js` mengisi `<footer id="ver">` dengan `KALSARA_VERSION.paket` ("Wulfeg · versi 9.57"). Tanggal sengaja dihapus: tanggal tertulis tangan adalah sumber basinya. Nomor logika bisnis (5.82) tetap tampil di panel Pembaruan.
- Header: `<p class="pwa">` dan gayanya dihapus.
- Ikon ⓘ: modul baru `js/tips.js` (kamus 50 istilah label Setelan/Voucher/Diskon + 39 istilah kartu produk dan baris hasil; semua kalimat memuat "Contoh:" berisi angka). Popover melayang di body, jadi struktur label/baris rincian tidak berubah. Ikon muncul juga di kartu yang dibuat ulang (MutationObserver). Terdaftar di `sw.js` CORE.
- Label: "Biaya Management Partner" menjadi "Biaya tambahan per pesanan (opsional)" di kartu produk, rincian, panel Promosi, panduan, header CSV ekspor/templat. Catatan: bukan "per pcs" karena rumus `tmod` memakai biaya ini sekali per pesanan (tidak dikali isi paket). Impor CSV tetap menerima judul lama dan judul "tambahan".
- Berkas: index.html, css/app.css, js/main.js, js/tips.js (baru), js/hitung-etalase.js, js/hasil-view.js, js/kartu-update.js, js/tab-impor-sinkron.js, js/impor-csv.js, js/promosi-panel.js, js/promosi-data.js, sw.js, version.js (9.57), package.json, README, dokumen, tests/tips.test.mjs (baru), tests/helpers/label-v9_52.mjs dan lima tes fixture, tests/e2e/baris-rincian.e2e.py.
- Bukti uji: `npm test` di sandbox sesi. Belum terbukti: E2E browser, GitHub Actions, HP asli.

## v9.56 - Tarif Gratis Ongkir XTRA 1 Des 2026 disesuaikan dengan Seller Centre (20 Nov 2026)
- Permintaan pemilik: tarif di aplikasi harus sama dengan halaman "Update Program Opsional Shopee" (dua tangkapan layar, 20 Nov 2026).
- Perbaikan: tabel `GO2` Kategori G ukuran khusus 12% menjadi 12,5% (kategori lain sudah cocok). Batas Rp60.000 biasa dan Rp80.000 khusus sudah benar.
- Baru: tabel `GOAD` (promo khusus pengguna iklan, berlaku 1 Des 2026) per kategori, biasa/khusus: A 1/3, B 4,5/6,5, C 5/7, D 7/9, E 7,5/9,5, F 8/10, G 8,5/10,5, H 9/11. Pengaturan baru `gai` (Tidak/Ya) di Program XTRA; syarat Shopee: biaya iklan bersih minimal 4% dari penjualan 30 hari terakhir. Promo tidak berlaku untuk tarif manual atau tabel kustom, dan `gad` (potongan satu angka, tarif lama) tidak dikurangkan lagi bila promo aktif.
- Berkas: js/tariff.js, js/app-core.js (DEF), js/helpers.js (SGL, +gai), index.html, tests/tariff.test.mjs, tests/helpers.test.mjs, fixture tariff/helpers (G 12,5 dan gai), laporan/PETA-GLOBAL.md, version.js, package.json, README.
- Bukti uji: `npm test` lulus penuh di sandbox (termasuk 2965 pernyataan tes tarif). Belum terbukti: tes e2e browser dan GitHub Actions belum dijalankan; tabel `GO` sebelum 1 Des tidak diverifikasi (tidak ada di tangkapan layar). Catatan: salinan Kalsara v5.82 di source/ masih memuat G khusus 12 (sumber asli, tidak diubah).

## v9.55 - Kartu sambutan dan tambah produk dari file Shopee (13 Nov 2026)
- Permintaan pemilik: (A) aplikasi kosong menampilkan kartu "Masukkan produk Anda" dengan tombol langsung ke template dan impor; (B) produk bisa ditambahkan dari file Mass Update Seller Centre supaya nama dan SKU tidak diketik ulang. Catatan jujur: paket v9.55 versi pertama (hanya kartu) hilang dari sandbox dan dari pemilik, jadi kartu dibangun ulang dari v9.54 bersama fitur ini.
- Kartu sambutan: tampil di tab Hitung selama belum ada produk berisi (aplikasi baru membuat dua baris kosong; itu tidak dihitung). Tombol: unduh template impor, pilih file CSV (dialog impor v9.54 tetap muncul), ambil dari file Shopee, atau isi satu produk (fokus ke kolom nama). Hilang otomatis saat ada data; muncul lagi bila semua produk dikosongkan. Kartu "Mulai cepat: 3 langkah" tipe toko tetap di atasnya.
- Tambah produk dari Shopee: file Informasi Penjualan (paling lengkap: nama, variasi, SKU, harga, stok) atau Informasi Dasar (hanya nama dan SKU). Satu variasi menjadi satu produk bernama "Nama produk - Nama variasi" (dipotong aman di 120 huruf, nama variasi dipertahankan). Harga masuk ke Harga listing awal, stok ke Stok Shopee. Modal TIDAK ada di file Shopee, jadi 0 dan diisi sendiri. Duplikat dicegah lewat SKU; bila SKU kosong lewat nama yang persis sama. Produk lama tidak diubah.
- Berkas: `js/impor-shopee.js` (BARU, modul murni), `js/kartu-sambutan.js` (BARU), `js/xlsx-reader.js` (fungsi spRun/spFile), `js/main.js` (satu baris pasang kartu), `index.html` (kartu #sm, tombol #spb), `sw.js`, `js/version.js`, `package.json`, dokumen. `js/app-core.js` dan rumus TIDAK diubah.
- Tes: `tests/impor-shopee.test.mjs` (BARU, memakai baris contoh bergaya file Mass Update), `tests/e2e/sambutan.e2e.py` (E2E ke-25).
- Belum terbukti: GitHub Actions pemilik BELUM dijalankan; HP asli belum diuji.

## v9.54 - Impor CSV ramah pengguna (13 Nov 2026)
- Permintaan pemilik: aplikasi akan dipublikasikan; pengguna baru maupun lama tidak boleh kesulitan saat impor. Temuan: mengimpor file hasil unduhan aplikasi (`hasil-wulfeg.csv`, 38 kolom, 78 produk) menampilkan "78 baris bermodal di bawah Rp100" (contoh modal Rp 1) dan "78 tarif Gratis Ongkir XTRA tidak terbaca".
- Penyebab (terbukti dari file pemilik): impor membaca kolom menurut URUTAN templat (11 kolom). Di file hasil, kolom ke-2 adalah "Isi paket" (1) sehingga terbaca sebagai modal Rp 1, dan kolom ke-11 adalah "Total modal" (mis. 42.320) sehingga terbaca sebagai tarif di luar 0-100. Bila pemilik menekan "Ya, impor", 78 produk akan GANDA dengan modal Rp 1.
- Perbaikan: (1) kolom dikenali dari JUDUL baris pertama (urutan bebas; judul lama "Modal supplier", "Supplier", dan "Gratis Ongkir XTRA" tetap dikenali); (2) file hasil unduhan bisa diimpor, tetapi hasil hitungan dan tarif TIDAK diimpor (tarif di file hasil sudah tarif efektif, bukan tarif penuh; mengimpornya akan menerapkan keringanan toko dua kali); (3) produk yang SKU-nya sudah ada, atau kembar di dalam file, dilewati agar tidak dobel, produk lama tidak diubah, dan dialog menunjuk ke "Sinkron modal dan stok" untuk memperbarui modal/stok; (4) file tanpa judul yang dikenal tetap dibaca menurut urutan seperti sebelumnya; judul sebagian dikenal di posisi templat tetap dibaca menurut posisi; judul acak yang tidak dikenal tidak ditebak; (5) kolom wajib (nama, modal) hilang: pesan jelas dan tidak ada yang masuk; (6) dialog memakai bahasa awam dengan bagian "Catatan", batas jumlah produk disebut bila terlampaui; semua baris dialog bisa digulir di layar kecil; (7) petunjuk di bagian "Impor dan ekspor CSV" diperbarui.
- Berkas: `js/impor-csv.js` (BARU, modul murni), `js/tab-impor-sinkron.js` (hanya `imp(t)` dan satu baris impor modul), `css/app.css` (`.dbx p`: baris baru + gulir), `index.html` (teks petunjuk), `sw.js` (daftar cache), `js/version.js`, `package.json`, `.github/workflows/e2e.yml`, dokumen.
- Tidak berubah: rumus, hasil hitung, `impGo`, `impGxStat`, `parseCsv`, template impor, impor harga/stok Shopee (via SKU) dan sinkron supplier.
- Tes: `tests/impor-csv.test.mjs` (BARU, 26 pernyataan, termasuk baris file pemilik dan sabotase bug lama), `tests/e2e/impor-csv.e2e.py` (E2E ke-24, 20 pernyataan di Chromium nyata), `tests/tab-impor-sinkron.test.mjs` (SATU pengecualian sempit terhadap fixture beku: pernyataan `function imp(t)`; pernyataan lain tetap identik).
- Bukti: di SANDBOX sesi (bukan GitHub Actions): lihat `state_tracker.txt`. Dicoba juga dengan file asli pemilik (`hasil-kalsara.csv`, 78 produk) pada aplikasi berisi 60 produk yang sama: dialog "Impor 18 produk baru?" dengan catatan 60 produk sudah ada. GitHub Actions pemilik: BELUM dijalankan. HP asli belum dilihat.

## v9.53 - Ganti nama aplikasi dari Kalsara menjadi Wulfeg (13 Nov 2026)
- Permintaan pemilik: nama baru "Wulfeg" menggantikan "Kalsara" (nama dipilih pemilik; ketersediaan nama belum dicek di Play Store, domain, dan DJKI).
- Perubahan (HANYA teks tampilan dan nama berkas unduhan): judul halaman, nama di header, huruf avatar (K jadi W), footer, panduan, banner "Versi baru", nama PWA di `manifest.webmanifest`, pesan toast dan galat (terpasang, penyimpanan tidak bisa dibuka, aplikasi terbuka di tab lain, worker), pesan cadangan tidak valid, judul dialog bagikan cadangan, serta nama berkas unduhan (`cadangan-wulfeg-<tanggal>.txt`, `penjualan-wulfeg-<tanggal>.csv`, `hasil-wulfeg.csv`, `template-produk-wulfeg.csv`, `wulfeg-backup.json`). Ikon aplikasi (192, 512, maskable, apple-touch) dibuat ulang dengan huruf W.
- Sengaja TIDAK diubah: semua kunci penyimpanan dan nama internal (`kalsara_*`, `__kalsara_*`, IndexedDB `KalsaraERP`, berkas jurnal `kalsara-*`, kunci Web Locks, kolam dan berkas SQLite `kalsara-sahpool`/`kalsara.sqlite3`, peristiwa `kalsara-storage-error`, elemen `<kalsara-product-card>`, variabel global `Kalsara*`, nama cache SW `kalsara-v...`). Alasannya: mengganti kunci akan membuat data dan cadangan lama pemilik tidak terbaca. Nama berkas sumber historis (`source/Kalsara-v5_82.html`) dan fixture beku juga tidak diubah.
- Berkas: `index.html`, `manifest.webmanifest`, `progress.html`, `icons/*.png`, `js/pwa.js`, `js/main.js`, `js/backup-format.js`, `js/storage.js`, `js/penyimpanan-cadangan.js`, `js/penjualan.js`, `js/tab-impor-sinkron.js`, `js/worker-client.js`, `js/version.js`, `package.json`, dokumen.
- Tes: `tests/helpers/nama-wulfeg.mjs` (daftar penggantian tertutup dengan jumlah kemunculan dicek tepat) dipakai tes kesetaraan penjualan, penyimpanan-cadangan, dan tab-impor-sinkron terhadap fixture beku; `tests/backup-format.test.mjs`, `tests/e2e/penjualan.e2e.py`, `tests/e2e/tahap4.e2e.py` memakai nama berkas/pesan baru. Seluruh `npm test` (unit) lulus di sesi ini, dan 23 skrip E2E (`npm run test:e2e`) lulus di Chromium nyata di sandbox sesi (BUKAN GitHub Actions pemilik).
- Belum terbukti: belum dijalankan di GitHub Actions pemilik; ikon baru dan tampilan nama belum dilihat langsung di HP. Pemilik yang sudah memasang PWA lama mungkin perlu membuka ulang/memasang ulang agar nama dan ikon baru muncul di layar utama.

## v9.52 - Label umum, tidak khusus dropship (12 Nov 2026)
- Permintaan pemilik: aplikasi terasa khusus dropship karena kata "supplier" ada di banyak label. Penjual yang membuat atau menyimpan barang sendiri tidak punya supplier.
- Perubahan (HANYA teks tampilan): "Modal supplier" jadi "Modal / HPP per pcs"; "Nama supplier" jadi "Sumber barang (opsional)"; "Link produk supplier" jadi "Link sumber barang (opsional)"; ringkasan "Supplier dan riwayat modal" jadi "Sumber barang dan riwayat modal"; peringatan stok merah jadi "Segera isi ulang stok." dan kuning jadi "Cek stok di Shopee dan sumber barang."; kolom pencarian dan teks bantuan memakai "sumber barang"; header CSV ekspor dan templat impor ikut diganti.
- Sengaja TIDAK diubah: fitur "Sinkron modal dan stok dari supplier" (nilai tambah bagi yang memakainya), nama field data (`sup`, `lnk`), urutan kolom CSV (impor memakai posisi kolom, bukan nama header), dan semua rumus.
- Berkas: `index.html`, `js/hitung-etalase.js`, `js/kartu-update.js`, `js/warnings.js`, `js/promosi-panel.js`, `js/tab-impor-sinkron.js`, `js/version.js`.
- Tes: tes kesetaraan terhadap fixture lama (promosi-panel, warnings, kartu-update, tab-impor-sinkron, hitung-etalase) memakai daftar penggantian tertutup di `tests/helpers/label-v9_52.mjs` dengan jumlah kemunculan yang dicek tepat; `tests/e2e/kartu-update.e2e.py` memakai teks tautan baru.
- Bukti: lihat `state_tracker.txt` (hasil di sandbox sesi). GitHub Actions pemilik: BELUM dijalankan.

## v9.51 - Tampilan: penanda halaman Etalase rapi dan presisi (8 Nov 2026)
- Pemilik: gaya penanda halaman ("Sebelumnya", "Hal. 1 dari 10", "Berikutnya", "Produk 1-50 dari 500") sudah disukai, tetapi ukuran dan susunannya acak: di HP tombol "Berikutnya" jatuh sendirian di baris kedua.
- Penyebab: `.pgn` memakai `flex-wrap:wrap`; tiga blok berdampingan tidak muat di lebar HP, sehingga pecah tidak beraturan.
- Perbaikan: `.pgn` kini grid. Baris 1: dua tombol selebar sama persis (tinggi 44px). Baris 2: "Hal. [n] dari N" dengan kotak angka tepat di tengah (kolom kiri-kanan sama lebar). Baris 3: teks info di tengah. Susunan sama di semua lebar layar; lebar dibatasi 440px agar tombol tidak melar di laptop. Warna, sudut membulat, tinggi, ukuran huruf tidak diubah.
- Berkas: `css/app.css` (aturan `.pgn*`), `js/etalase-halaman.js` (SATU baris: urutan elemen `prev, next, mid, info` agar urutan tombol Tab sama dengan urutan tampilan; tidak mengubah perilaku halaman).
- TIDAK berubah: pembagian halaman, jumlah kartu, rumus, data, teks.
- Tes baru: `tests/penanda-halaman.test.mjs` (penjaga statis, 13 pernyataan) dan `tests/e2e/penanda-halaman.e2e.py` (E2E ke-23, 173 pernyataan di Chromium nyata: lebar 320/360/412/1024 px, penanda atas dan bawah, halaman 1 dan 2, angka halaman sangat panjang). Uji sabotase: CSS lama membuat keduanya GAGAL.
- Bukti: di SANDBOX sesi (bukan GitHub Actions): `npm test` exit 0 (golden-master identik vs v5.82; `penanda-halaman` 13 pernyataan; `dokumentasi` 76 pernyataan) dan 23/23 E2E lulus, `fail=0` (`penanda-halaman` 173 pernyataan di Chromium nyata).
- Bukti tambahan: GitHub Actions pemilik (8 Nov 2026, log dari pemilik): `npm test` lulus (termasuk `penanda-halaman` 13 pernyataan, `baris-rincian` 17, `dokumentasi` 76, golden-master identik) dan 23/23 E2E lulus, `fail=0` (`penanda-halaman` 173 pernyataan, `baris-rincian` 62).
- Belum terbukti: tampilan di HP asli pemilik.

## v9.50 - Tampilan: teks rincian panjang turun ke baris ke-2, angka sejajar (8 Nov 2026)
- Pemilik: pada baris rincian (kartu Hitung "Lihat rincian biaya" dan laporan ERP), teks yang panjang membuat angkanya pindah ke baris sendiri atau teks terjepit. Diminta: teks panjang otomatis turun jadi 2 baris, dan angka hasil ikut sejajar dengan baris ke-2 teks.
- Penyebab: wadah baris memakai `flex-wrap:wrap`. Bila teks + angka tidak muat satu baris, browser memindahkan SELURUH angka ke baris baru. (Dua aturan terpisah: `.rw` untuk kartu, `.erw` untuk laporan ERP.)
- Perbaikan (hanya CSS, `css/app.css`): `.rw` dan `.erw` kini `flex-wrap:nowrap`; teks boleh menyusut dan turun baris di kolomnya sendiri, angka tetap utuh (tidak menyusut, tidak patah) di kanan. Angka rata dengan baris TERAKHIR teks: `align-items:last baseline` bila browser mendukung, `flex-end` sebagai cadangan. Kata yang sangat panjang tetap dipatahkan (`overflow-wrap:anywhere`).
- Ikut terbantu (struktur teks + angka yang sama, tidak diubah kodenya): baris di tab Penjualan, panel "Cek pesanan nyata", dan daftar catatan tarif di Setelan.
- TIDAK berubah: rumus, hasil hitung, teks, JS, data. Golden-master tidak tersentuh.
- Tes baru: `tests/baris-rincian.test.mjs` (penjaga statis: aturan CSS dan struktur HTML yang diandalkan CSS), `tests/e2e/baris-rincian.e2e.py` (E2E ke-22: mengukur posisi nyata di Chromium pada lebar 320 dan 412 px). Sudah diuji sabotase: dengan CSS lama kedua tes GAGAL, dengan CSS baru lulus.
- Versi: `js/version.js` dan `package.json` naik ke 9.50 (nama cache Service Worker ikut berganti, sehingga HP pemilik memuat CSS baru).
- Bukti: di SANDBOX sesi (bukan GitHub Actions): `npm test` exit 0 (termasuk golden-master identik vs v5.82, `baris-rincian` 17 pernyataan, `dokumentasi` 76 pernyataan) dan 22/22 E2E lulus, `fail=0` (`baris-rincian` 62 pernyataan di Chromium nyata).
- Bukti tambahan: GitHub Actions pemilik (8 Nov 2026, log dari pemilik): `npm test` lulus (termasuk `baris-rincian` 17 pernyataan) dan 22/22 E2E lulus, `fail=0` (termasuk `baris-rincian` 62 pernyataan).
- Belum terbukti: tampilan di HP asli pemilik (belum ada tangkapan layar sesudah perbaikan). Lihat langkah uji manual di `LANJUT-DI-SINI.md`.

## v9.49 - Tahap 9C: aksi di tab Hitung, Promosi, Etalase lebih cepat (8 Nov 2026)
- Pemilik: tiga tab masih berat dengan 1.000 produk. Pengukuran menunjukkan pindah tab sudah cepat; yang berat adalah aksi di dalam tab (`scripts/ukur-aksi.py`, CPU x4).
- Hitung: mengetik di kartu tidak lagi menyusun 1.000 model Etalase yang tersembunyi (`tundaShop` + `KEtalaseHalaman.tandaiKotor()`); Etalase disusun saat dibuka. Sekitar 545 ms -> 140 ms per ketikan.
- Semua tab: `rp()` memakai satu `Intl.NumberFormat` (teks hasil identik).
- Promosi: daftar "Ganti produk..." diisi saat pertama disentuh (`itswFill`). Menambah produk ke promo sekitar 9 dtk -> 2 dtk.
- Berkas: `js/hitung-etalase.js`, `js/etalase-halaman.js`, `js/format.js`, `js/promosi-panel.js`, `js/app-core.js`; tes: `promosi-panel`, `hitung-etalase`, `etalase-halaman`, E2E `tahap7a`; baru `scripts/ukur-aksi.py`.
- Bukti: GitHub Actions pemilik: `npm test` lulus, 21 E2E lulus, `fail=0`. Rumus tidak berubah (golden-master identik).
- Belum terbukti: HP asli. Belum dikerjakan: buka aplikasi 1.000 produk (sekitar 5 dtk pada simulasi x4), `refreshLabels()` per `upd()`, hitungan promo (`money.js`).
- Dokumentasi: ditambah `CHANGELOG.md`, `docs/PANDUAN-PERAWATAN.md`, `tests/dokumentasi.test.mjs`.

## v9.48 - Tahap 9A/9B: kinerja 1.000 produk (8 Nov 2026)
- Pengukur kinerja `js/kinerja.js` (aktif hanya dengan `?perf=1`); Etalase berhalaman 50 kartu (`js/etalase-halaman.js`, `?hal=25|50|100`); penanda "data berubah" supaya pindah tab tidak menghitung ulang.
- Temuan utama: membuka tab Hitung menghitung ulang SEMUA produk karena `PSIG` tersalin sebagai nilai beku saat dipindah modul (v9.41). Diperbaiki dengan `getPSIG()`.
- Tes baru: `etalase-halaman`, `kinerja`, E2E `kinerja` (E2E ke-21).
- Bukti: GitHub Actions pemilik: 21/21 E2E, `fail=0`; `tahap8` (Service Worker offline) lulus setelah alur tesnya dibetulkan.

## v9.47 - koreksi E2E `tahap8` (7 Nov 2026)
- E2E `tahap8` gagal di Actions karena menunggu kartu produk padahal tanpa data (salah alur tes). Tes kini menunggu tanda boot selesai. Aplikasi tidak berubah.

## v9.45 - Tahap 8: penutupan migrasi (Nov 2026)
- `js/legacy/`, `legacy-app.js`, `parts.json` dihapus; `index.html` hanya memuat `js/main.js`; satu sumber nomor versi `js/version.js`; daftar cache `sw.js` dijaga tes (`tests/tahap8.test.mjs`); `MIGRATION-STATUS.md` dipindah ke `arsip/`; README dan progress.html diringkas.
- E2E baru `tahap8` (Service Worker aktif, cache lengkap, muat ulang offline).

## v9.44 - Tahap 7b: data promosi dan voucher -> `js/promosi-data.js`
- Bukti: Actions pemilik npm test lulus, E2E 19/19; uji manual restore Promo Toko format lama lulus.

## v9.43 - Tahap 7a: panel dan tampilan promosi -> `js/promosi-panel.js`
- Bukti: Actions pemilik npm test exit 0, E2E 18/18.

## v9.42 - Tahap 6: bagian hitung dan etalase -> `js/hitung-etalase.js` (pabrik `createHitungEtalase`)
## v9.41 - Tahap 5: tab, impor, sinkron -> `js/tab-impor-sinkron.js`
## v9.40 - Tahap 4: penyimpanan, cadangan, pengaturan, tema -> `js/penyimpanan-cadangan.js`, `js/pengaturan.js`, `js/theme.js`
## v9.36-v9.39 - tidak punya bagian sendiri di arsip; kelanjutan tahap 6 (lihat `state_tracker.txt` dan arsip bila perlu).
## v9.35 - tahap 6h: model Etalase -> `js/etalase-view.js`
## v9.34 - tahap 6g: `upd` dan `fill` -> `js/upd-fill.js`
## v9.33 - tahap 6f: `updRow` -> `js/kartu-update.js`
## v9.32.1 - perbaikan: cadangan penuh dan pulihkan cadangan ber-ERP (regresi sejak v9.18)
## v9.32 - tahap 6e: tampilan hasil kartu -> `js/hasil-view.js`
## v9.31 - tahap 6d: peringatan stok/margin -> `js/warnings.js`
## v9.30 - tahap 6c: tarif dan peringatan tarif -> `js/tarif-ui.js`
## v9.29 - tahap 6b: helper murni -> `js/helpers.js`
## v9.28 - tahap 6a: dialog, toast -> `js/ui.js`
## v9.27 - tahap 5c: panel "Cek pesanan nyata" -> `js/voucher-panel.js`
## v9.26 - tahap 5b: jembatan state dan tab Penjualan -> `js/penjualan.js`
## v9.25 - tahap 5a: aturan voucher -> `js/voucher-rules.js`; bukti SQLite nyata
## v9.24 - tahap 4d: cache kalkulator dan pra-hitung Worker -> `js/calc-cache.js`
## v9.23 - E2E hitung diperbaiki (baseline E2E hijau)
## v9.22 / v9.21 / v9.20 - tahap 4c / 4b / 4a: pipa harga, tarif, modul inti -> `js/pricing.js`, `js/tariff.js`, `js/format.js`
## v9.14-v9.19 - pemecahan `legacy-app.js` bertahap; ERP jadi modul ES (`js/erp.js`)
## v9.8-v9.13 - pipa kalkulator Chain of Responsibility, kartu Etalase (Web Component), hidrasi malas 1.000 produk, hitungan batch di Worker, SQLite sebagai sumber data utama (OPFS), laporan ERP di SQLite
## v9.1-v9.7 - golden-master terhadap v5.82, promo dan paket, mesin kalkulator Worker, audit migrasi ERP, perbaikan pemasangan PWA
## v5.82 - basis logika bisnis (aplikasi satu berkas HTML asli, `source/Kalsara-v5_82.html`)
