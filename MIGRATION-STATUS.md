# Status migrasi Kalsara v5.82 — paket v9.8

Tanggal build: 2026-11-02

## Ringkasan v8

### Perubahan v8
- Menambahkan `grossUpDiscount()` berbasis rasional BigInt untuk membalik diskon persen menjadi harga sebelum diskon dengan pembulatan ceil yang eksak.
- Jalur kalkulator inti kini menggunakan gross-up BigInt untuk diskon coret persen; diskon nominal, pengurangan voucher, akumulasi biaya, dan laba di jalur `fwdV` menggunakan penjumlahan Rupiah integer tervalidasi.
- Menghapus toleransi floating epsilon pada iterasi voucher karena seluruh nilai yang dibandingkan merupakan Rupiah integer.
- Menambahkan regresi rasional untuk banyak kombinasi nominal dan tarif, termasuk kasus 137 / (1 - 80%) yang secara matematis tepat Rp685 (floating-point lama dapat memulai pencarian dari Rp686).
- Seluruh test suite otomatis paket lulus pada Node.js. Ditambahkan `tests/browser-smoke.html` untuk pemeriksaan startup dan tab di browser nyata; harness ini belum dijalankan pada lingkungan build.

## Ringkasan v7

### Perubahan v7
- Estimasi harga awal kalkulator kini menggunakan perbandingan rasional BigInt untuk kombinasi tarif persentase dan batas biaya. Tidak ada pembagian tarif ke floating-point pada tahap estimasi gross price.
- Jalur pencarian harga lama menggunakan hasil estimasi integer tersebut sebagai seed; iterasi harga akhir dan aturan voucher/diskon tetap memakai alur kompatibilitas lama.
- Ditambahkan regression tests untuk kombinasi tarif berbatas, tarif 100%, dan validasi cap.

## Ringkasan v6 (fondasi yang dibawa ke v7)

Paket v6 meneruskan v5 dengan perubahan nyata pada renderer, jalur impor ERP, komputasi laporan ERP, dan materialisasi skema ERP di SQLite.

### 1. Renderer dan keamanan DOM
- 57 assignment `innerHTML` di `legacy-app.js` dialihkan ke `KDOM.setHTML` atau `KDOM.copyChildren`.
- 2 pemanggilan `insertAdjacentHTML` dialihkan ke `KDOM.insertHTML`.
- Tidak ada lagi assignment `.innerHTML =` atau pemanggilan `.insertAdjacentHTML()` di `legacy-app.js`.
- `KDOM` mem-parsing fragmen melalui `DOMParser`, menghapus elemen executable/berbahaya, membatasi atribut, menolak URL dengan protokol berbahaya, lalu memasang node dengan `replaceChildren`/`append`.
- Salinan isi `<template>` menggunakan `.content`, bukan mengandalkan `childNodes` elemen template.
- Markup template lama masih berupa string HTML; ini adalah lapisan kompatibilitas yang disanitasi, belum renderer deklaratif per komponen.

### 2. Keuangan dan pembulatan
- `pr()` memakai helper persentase integer/BigInt dengan rate diserialisasi ke satuan 1/10.000 persen.
- Harga setelah diskon persen memakai perkalian BigInt dan pembulatan floor yang eksplisit, bukan perkalian floating point. Parsing harga supplier juga dialihkan ke parser Rupiah integer.
- Total modal, agregasi fee, dan laba bersih pada jalur `fwdL` menggunakan penjumlahan integer tervalidasi.
- Parser Rupiah, persentase, dan helper diskon mempunyai regression test termasuk nilai negatif dan pembulatan.
- **Belum semua rumus kalkulator inti berpindah ke BigInt**: pencarian harga, sejumlah logika tarif/threshold voucher/promosi, margin, dan beberapa input persentase masih memakai `Number`. Estimasi harga awal kini memakai perbandingan rasional BigInt dan hanya menghasilkan seed integer untuk pencarian kompatibilitas. Hasil akhir pencarian harga belum memiliki golden-master suite lengkap terhadap v5.82.

### 3. Web Workers
- Parsing CSV dilakukan di Worker.
- Parsing XLSX (termasuk ZIP deflate) dipindahkan ke Worker dan ArrayBuffer ditransfer, bukan disalin.
- Parsing laporan Penghasilan Shopee dan Order completed dipindahkan ke Worker.
- Agregasi ERP (omzet, fee, HPP, OpEx, laba) dipindahkan ke Worker dan menggunakan BigInt untuk penjumlahan/perkalian nominal.
- **Belum semua komputasi dipindahkan**: kalkulator harga, tarif, promosi, voucher, dan sebagian pemetaan HPP saat mengunci snapshot masih berjalan di main thread.

### 4. SQLite ERP
- Menambahkan tabel materialisasi domain: `erp_marketplaces_raw`, `erp_order_items`, `erp_opex`, dan `erp_settings`, beserta indeks tanggal/order/SKU.
- Tabel domain diperbarui saat key ERP tersimpan dan dibangun ulang dari jurnal saat indeks SQLite direkonstruksi.
- OPFS append-only journal tetap sumber persistensi yang otoritatif; SQLite adalah materialized index yang dapat dibangun ulang.
- Adapter ERP saat ini masih menyimpan objek domain sebagai JSON per-koleksi di key OPFS, kemudian mematerialisasikannya ke tabel SQLite. CRUD ERP belum membaca/menulis langsung ke tabel domain SQLite. Ini belum merupakan normalisasi penuh.
- SQLite Wasm masih dimuat dari CDN jsDelivr. Jika jaringan/CDN tidak tersedia saat inisialisasi, jurnal OPFS tetap berjalan tetapi indeks SQLite tidak tersedia. Untuk rilis offline penuh, library Wasm perlu dibundel lokal dan diuji.

### 5. Pengujian
- Worker: 30 assertion, mencakup pipeline BigInt, CSV, XLSX terkompresi, parsing laporan Shopee, parsing detail pesanan, dan agregasi ERP.
- Money: regresi gross-up rasional BigInt untuk berbagai nominal dan tarif, termasuk kasus pembagian tepat dan batas integer aman.
- Storage: 13 assertion runtime, termasuk kegagalan penulisan, backup snapshot, dan restore yang menghapus key di luar snapshot.
- Audit skema SQLite: 6 assertion statis.
- Audit DOM: 11 assertion statis; nol assignment `innerHTML` dan nol `insertAdjacentHTML` di compatibility module.
- Audit kompatibilitas: 271 nama fungsi asli ditemukan di gabungan aplikasi + Worker; 7 tab navigasi utama tetap sama.
- Seluruh 9 file JavaScript lolos `node --check`.
- Chromium headless yang tersedia pada lingkungan build gagal menghasilkan DOM bahkan untuk halaman `data:` HTML sederhana dan berhenti karena timeout. Karena itu pengujian browser end-to-end tidak bisa dilakukan di lingkungan ini dan belum dinyatakan lulus.

## Gerbang produksi yang masih terbuka

1. Selesaikan audit seluruh rumus tarif, diskon, voucher, promo, margin, dan pencarian harga dengan golden-master tests terhadap hasil Kalsara v5.82; v8 sudah memindahkan gross-up diskon coret, pengurangan voucher, dan agregasi uang tertentu ke operasi integer/BigInt, tetapi belum semua aturan promo/voucher dan margin ditinjau.
2. Pindahkan kalkulator, pencarian harga, promosi, dan komputasi tarif ke Worker. Saat ini operasi kalkulator produk masih sinkron di main thread; perubahan ke async perlu refaktor terkontrol seluruh pemanggil agar tidak merusak UX.
3. Migrasikan CRUD ERP agar tabel domain SQLite menjadi sumber query aktif (dengan strategi jurnal/commit yang konsisten), bukan sekadar materialized view.
4. Bundel SQLite Wasm secara lokal untuk mendukung first-run/offline tanpa CDN.
5. Jalankan `tests/browser-smoke.html` pada localhost/profil browser uji, lalu browser E2E penuh untuk CRUD produk, harga, promo, stok/penjualan, impor CSV/XLSX, laporan, ERP, backup/restore, dan reload. Harness tersedia tetapi belum dijalankan pada lingkungan build. Chromium headless pada lingkungan build tetap timeout bahkan untuk HTML statis sederhana.
6. Uji migrasi pada salinan data browser v5.82, multi-tab, kuota OPFS penuh, crash saat write, dan restore lintas perangkat/browser.
7. Uji visual/responsif di viewport desktop dan mobile agar tampilan v5.82 tidak berubah.
8. Uji integrasi SQLite Wasm/OPFS pada browser nyata termasuk crash/reload dan konsistensi jurnal terhadap tabel domain.

## Status rilis

**Paket v8 adalah paket pengembangan dengan perubahan dan tes tambahan; belum disertifikasi 100% atau siap menggantikan aplikasi produksi.** Simpan file asli `Kalsara-v5_82.html` dan cadangan data pengguna sebelum uji migrasi. Jangan hapus database IndexedDB lama sampai migrasi data benar-benar diverifikasi.

## Ringkasan v9.1 — golden-master kalkulator dan voucher

Tanggal build: 2026-11-02

### Perubahan v9.1
- Memperluas `tests/golden-master.test.mjs` yang mengeksekusi blok kalkulator dari sumber asli `source/Kalsara-v5_82.html` dan blok kalkulator hasil migrasi secara terisolasi.
- Menjalankan 5 kasus terpilih dan 1.000 fixture deterministik dengan variasi tipe toko, kategori admin/Gratis Ongkir, tarif persentase, batas biaya, biaya tetap, kuantitas, modal, target laba, voucher manual, diskon nominal/persen, dan pembulatan harga.
- Seluruh 1.005 hasil objek kalkulator (harga listing, harga jual, voucher, rincian biaya, saldo masuk, laba, dan struktur tarif) identik secara serialisasi antara v5.82 dan v8 pada fixture yang diuji.
- `npm test` menjalankan golden-master kalkulator dan rule engine voucher bersama seluruh suite sebelumnya.

### Batas cakupan golden-master
- Golden-master kalkulator memverifikasi `calc()` dan `fwdL()` dengan voucher manual pada 1.005 fixture.
- Golden-master voucher tambahan memverifikasi `vcList()`, `vcApply()`, `vcBest()`, `vcThr()`, dan `vcBad()` pada 12 kasus terpilih + 100 fixture deterministik, termasuk minimum belanja, voucher produk/toko, kuota, periode aktif, cashback, Live/Video, dan kompetisi dengan voucher manual.
- Promo paket, seluruh variasi margin, seluruh perubahan tarif bertanggal, dan interaksi end-to-end UI belum sepenuhnya tercakup. Kesamaan fixture bukan bukti formal untuk seluruh input yang mungkin.

### Hasil test v9
- Worker: 30 assertion lulus.
- Money: lulus.
- Storage: 13 assertion runtime + 6 audit skema lulus.
- DOM: 11 audit statis lulus.
- Compatibility: 271 nama fungsi asli + 7 tab dipertahankan.
- Golden-master kalkulator: 1.005 differential assertions lulus.
- Golden-master rule engine voucher: 112 differential assertions lulus.
- Total golden-master differential assertions: 1.117.
- Seluruh suite `npm test` lulus pada Node.js.

### Gerbang produksi yang masih terbuka setelah v9
1. Golden-master seluruh rule engine voucher dan promosi (bukan hanya voucher manual), margin, threshold minimum belanja, diskon paket, serta aturan tanggal tarif.
2. Pindahkan kalkulator harga dan pencarian harga ke Worker dengan refaktor pemanggil sinkron secara terkontrol; belum dilakukan pada v9.
3. Jadikan CRUD ERP membaca/menulis tabel domain SQLite sebagai jalur aktif; saat ini JSON per-koleksi di OPFS masih otoritatif dan SQLite masih materialized index.
4. Bundel SQLite Wasm secara lokal dan verifikasi lisensi/artefak serta first-run offline; saat ini masih memakai CDN.
5. Jalankan E2E browser nyata seluruh 7 tab, impor CSV/XLSX, produk, stok/penjualan, promosi, laporan, ERP, backup, restore, reload, dan migrasi data v5.82.
6. Verifikasi tampilan desktop/mobile dan uji kuota, crash-write, multi-tab, dan pemulihan OPFS pada browser nyata.

**Status v9.1: paket pengembangan; bukan rilis produksi dan belum 100%.** Golden-master memberi bukti pembanding untuk jalur kalkulator inti pada fixture yang disebutkan, bukan untuk semua fitur.


## Pembaruan v9.1 — 2 November 2026

- Ditambahkan 112 differential assertions untuk rule engine voucher otomatis terhadap sumber v5.82: 12 kasus kurasi dan 100 fixture deterministik.
- Kasus mencakup voucher toko/produk, minimum belanja, kuota habis, tanggal mulai/berakhir, cashback, voucher Live, voucher manual vs otomatis, dan validasi voucher 100%.
- Hasil golden-master gabungan saat ini 1.117 assertion diferensial: 1.005 kalkulator inti + 112 rule engine voucher.
- Ini masih pengujian fungsi terisolasi; belum menggantikan pengujian promo paket, margin penuh, dan browser E2E nyata.


## Pembaruan v9.2 — promo, paket, dan margin promo

Tanggal build: 2026-11-02

### Perubahan
- Golden-master diperluas untuk fungsi pemilihan promo, Paket Diskon, harga promo per produk, Kombo Hemat, dan Hadiah Minimum Belanja. Perbandingan mengeksekusi fungsi dari sumber asli v5.82 dan fungsi hasil migrasi dalam VM terisolasi.
- Ditemukan dan diperbaiki perbedaan pembulatan harga promo per produk sebesar Rp1 pada sebagian input. Implementasi migrasi sekarang menggunakan `percentOfRupiah(M, 100-d)` untuk mempertahankan pembulatan integer terdekat pada sumber asli, bukan pembulatan floor.
- Ditambahkan 200 fixture deterministik khusus harga promo, 205 kasus promo/Paket Diskon (5 kurasi + 200 fixture), dan 100 fixture Kombo Hemat/Hadiah Minimum Belanja. Pengujian membandingkan keluaran hitungan/rendering fungsi antara dua versi.
- Versi paket diperbarui ke 0.9.2 dan cache Service Worker dinaikkan ke `kalsara-v5.82-client-v9.2`.

### Hasil differential test yang ditargetkan
- Kalkulator inti: 1.005
- Rule engine voucher: 112
- Promo/Paket Diskon: 205
- Harga promo produk: 200
- Kombo Hemat/Hadiah Minimum Belanja: 100
- **Total: 1.622 differential assertions**

### Batasan
Kesetaraan fungsi yang diuji tidak menggantikan pengujian seluruh UI/browser, seluruh kombinasi data, atau pengujian migrasi data nyata. Kalkulator masih berjalan di main thread; CRUD ERP belum memakai tabel SQLite sebagai sumber query aktif; SQLite Wasm masih bergantung pada CDN; browser E2E nyata belum lulus. Status tetap pengembangan dan belum boleh dianggap pengganti produksi sebelum gerbang tersebut ditutup.


## Pembaruan v9.3 — mesin kalkulator Worker

Tanggal build: 2026-11-02

### Perubahan
- Menambahkan `workers/calculator-engine.js`, berisi jalur kalkulator produk kompatibilitas yang dapat dijalankan di Worker tanpa DOM.
- Menambahkan operasi `calculate-product` pada `workers/compute.worker.js`; payload berisi `settings`, `promos`, `products` (opsional), dan `product`.
- Golden-master kini membandingkan hasil v5.82 dengan kalkulator migrasi dan mesin Worker pada 5 kasus terpilih + 1.000 fixture deterministik.
- Service Worker memasukkan mesin kalkulator baru ke cache offline dan cache key dinaikkan ke `kalsara-v5.82-client-v9.3`.

### Hasil tes v9.3
- Worker test: 33 assertion dasar/operasi teruji, termasuk route `calculate-product`.
- Golden-master kalkulator: 2.010 differential assertions (1.005 hasil migrasi + 1.005 hasil Worker terhadap v5.82).
- Voucher: 112; promo/Paket Diskon: 205; harga promo produk: 200; Kombo Hemat/Hadiah Minimum Belanja: 100.
- Money, storage, skema SQLite, DOM static audit, dan compatibility audit tetap lulus.

### Batasan penting
Mesin kalkulator sekarang tersedia di Worker dan diuji terhadap v5.82, tetapi UI kompatibilitas masih mempunyai banyak pemanggilan sinkron `calc()`. Jadi, ini adalah tahap mesin Worker dan bukti parity, bukan pengalihan seluruh layar ke jalur asinkron. Mengalihkan pemanggil harus dilakukan terkontrol agar tidak ada hasil usang, race saat input berubah, atau perubahan perilaku.

### Gerbang berikutnya
1. Refaktor pemanggil UI kalkulator ke Worker dengan pengenal request/state untuk mencegah hasil lama menimpa input baru.
2. Uji alur hitung, penjualan, laporan, margin, promo, voucher, dan perubahan tarif saat Worker mengembalikan hasil asinkron.
3. Setelah integrasi Worker penuh lulus golden-master + browser E2E, lanjutkan CRUD SQLite aktif dan bundel SQLite Wasm lokal.

**Status v9.3: mesin kalkulator Worker tersedia dan parity fixture lulus; integrasi penuh UI belum selesai, belum siap menggantikan aplikasi produksi.**


## Pembaruan v9.4 — 2 November 2026

- Integrasi kalkulator Worker bertahap: `calc()` memakai hasil Worker dari snapshot yang identik bila tersedia; fallback sinkron tetap menjaga kompatibilitas saat hasil belum tersedia atau Worker gagal. Kunci cache mencakup tanggal, pengaturan, promosi, dan produk, sehingga balasan terlambat tidak dapat mengganti hasil untuk state terbaru.
- API CRUD ERP `KStore.erpAll/erpPut/erpDelete/erpClear` diperkenalkan dan dipakai modul ERP. Saat SQLite aktif, pembacaan koleksi `marketplaces_raw`, `order_items`, `opex`, dan `settings` menggunakan tabel domain; penulisan tetap masuk jurnal OPFS dan menyinkronkan tabel domain untuk pemulihan. Koleksi `products` dan `inventory_logs` masih menggunakan map kompatibilitas.
- Tes ditambah untuk CRUD ERP API dan pemeriksaan wiring Worker; `npm test` harus lulus sebelum paket dibangun.

### Status gerbang setelah v9.4
1. **Worker UI: parsial.** Hasil Worker dipakai setelah tersedia; first paint/failure fallback masih sinkron. Pengujian browser nyata dibutuhkan untuk memastikan perilaku interaktif dan beban banyak produk.
2. **Perhitungan: unit/golden-master lulus pada fixture yang ada**, tetapi seluruh alur UI penjualan/laporan/margin belum dibuktikan lewat browser E2E.
3. **CRUD ERP: parsial.** API baca domain SQLite tersedia; jurnal OPFS tetap otoritatif dan menulis map koleksi yang kemudian mematerialisasi tabel. Belum mengubah SQLite menjadi satu-satunya sumber data.
4. **SQLite Wasm lokal: belum selesai.** Akses registry tidak tersedia pada lingkungan build; aplikasi masih mencoba CDN.
5. **E2E browser/migrasi/backup/restore/visual: belum lulus.** Chromium headless timeout pada halaman statis sederhana di lingkungan build.
6. **Gerbang produksi: masih terbuka.** Jangan ganti aplikasi asli atau hapus data lama sebelum uji browser nyata dan pemulihan data berhasil.

**Status: v9.4 paket pengembangan; tidak disertifikasi 100% atau siap produksi.**

## Pembaruan v9.5 — 2 November 2026
- `js/worker-client.js` tidak lagi membuat Worker saat modul pertama kali diimpor. Worker dibuat ketika operasi pertama diminta; kegagalan konstruksi menghasilkan Promise rejection, bukan langsung menggagalkan bootstrap aplikasi.
- Request Worker dibatasi 60 detik dan worker yang timeout direset. Error worker ditangani eksplisit untuk seluruh request yang sedang menunggu.
- Ditambahkan `tests/worker-client.test.mjs`; suite ini memverifikasi hasil sukses dan propagasi error Worker.
- `npm test` lulus setelah perubahan: Worker engine 33, Worker client 5, Money, Storage 19 + audit SQLite 9, DOM 11, compatibility 271 nama fungsi + 7 tab, dan 2.627 differential assertions.

### Batasan tetap untuk target pengganti 100%
- Belum dapat menyatakan pengganti 100%: browser E2E belum berjalan pada browser yang berfungsi di lingkungan build, SQLite Wasm masih memerlukan CDN untuk mode SQLite, dan kalkulator UI masih memiliki fallback sinkron.
- Data pengguna nyata belum dimigrasikan/diverifikasi di browser target. Jangan menghapus versi/data lama sebelum uji backup-restore dan perbandingan hasil selesai.

## Pembaruan v9.6 — keamanan dan audit migrasi ERP

- Migrasi dari IndexedDB `KalsaraERP` tidak lagi membangun map kosong lalu mengganti seluruh koleksi tujuan. Migrasi localStorage lama juga membandingkan nilai sumber dan tujuan, serta melaporkan key yang berbeda tanpa menimpa tujuan. Sekarang record sumber digabungkan berdasarkan ID ke data tujuan yang sudah ada.
- Jika ID sama dan nilainya identik, record dicatat sebagai identik. Jika ID sama tetapi isinya berbeda, nilai tujuan dipertahankan dan pasangan nilai sumber/tujuan dicatat untuk ditinjau; migrasi tidak diam-diam menimpa record yang sudah ada.
- Record sumber tanpa ID atau berbentuk tidak valid dihitung sebagai dilewati, bukan dimasukkan dengan ID buatan.
- Ditambahkan laporan migrasi localStorage `__kalsara_localstorage_migration_report_v1` dan log konflik `__kalsara_localstorage_migration_conflicts_v1`.
- Ditambahkan laporan migrasi `__kalsara_erp_idb_migration_report_v1` yang mencatat jumlah record sumber, ditambahkan, identik, konflik, dan dilewati per entitas. Konflik disimpan di `__kalsara_erp_idb_migration_conflicts_v1` dan entri konflik yang sama dideduplikasi saat retry.
- Ditambahkan `js/migration.js` sebagai helper merge teruji dan `tests/migration.test.mjs` dengan 13 assertion, termasuk urutan properti berbeda, ID bertabrakan, record tidak valid, dan migrasi ulang.

### Hasil v9.6
- `npm test`: lulus; Worker 33, Worker client 5, migration safety 13, Storage 19 + audit SQLite 9, DOM 11, compatibility 271 fungsi + 7 tab, dan 2.627 differential assertions.
- `node --check` untuk file JavaScript aplikasi, Worker, komponen, dan Service Worker: lulus.
- Ini menutup satu risiko migrasi yang konkret, tetapi belum menggantikan verifikasi browser nyata atau migrasi salinan data pengguna. Konflik yang tercatat tetap perlu ditinjau secara eksplisit sebelum data lama dihapus.

## Pembaruan v9.7 — perbaikan bug instalasi PWA (2 November 2026)

- **Bug:** di Chrome Android muncul "Aplikasi ini tidak dapat diinstal" dan ikon pintasan hanya huruf "G". Penyebab: `manifest.webmanifest` berisi `"icons":[]`, dan `index.html` tidak menautkan ikon apa pun (v5.82 memakai `icon-192.png` dan `apple-touch-icon.png` terpisah yang tidak ikut dibawa ke paket migrasi).
- **Perbaikan:** ditambahkan `icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, dan `apple-touch-icon.png`; manifest dilengkapi `id`, `scope`, `start_url: "./"`, `lang`, `description`, dan daftar ikon (any + maskable); `index.html` menautkan ikon; Service Worker meng-cache ikon (cache `kalsara-v5.82-client-v9.7`).
- Ditambahkan `tests/pwa.test.mjs` (audit statis kelayakan instalasi). Ini bukan pengganti uji instalasi di Chrome nyata.

## Pembaruan v9.8 — Tahap 1 (pipa kalkulator) dan Tahap 2 (kartu Etalase)

**Tahap 1 — Chain of Responsibility di Worker (`workers/pricing-pipeline.js`)**
- Rumus harga kini berupa dua rantai handler: evaluasi harga tayang (Voucher → Tarif platform → Potongan → Saldo masuk → Untung) dan pencarian harga awal (Validasi → Tarif → Estimasi impas → Voucher fixed-point → Gross-up diskon → Seed → Pencarian → Pengetatan).
- Semua nominal di dalam pipa adalah bilangan bulat sen (Rupiah ×100); persen dihitung dengan BigInt lalu dibulatkan ke Rupiah penuh; konversi ke Rupiah hanya di batas keluar. Tanpa `parseFloat`/`toFixed` untuk uang.
- Worker punya operasi baru `calculate-batch`. Terbukti identik dengan v5.82 pada 1.500 kasus acak tambahan (voucher otomatis/manual, kuota, min. belanja, tarif sebelum/sesudah 1 Des 2026); tes ikut gagal bila pembulatan sengaja dirusak.
- Batch 1.000 produk dihitung ±160 ms di Worker (Node).

**Tahap 2 — `<kalsara-product-card>` (Shadow DOM + Signals)**
- Etalase tidak lagi merakit string HTML: `shop()` menyusun model data, komponen merender dengan DOM API. Elemen kartu dipakai ulang dan hanya kartu yang datanya berubah yang diperbarui.
- `js/signals.js`: mesin Signals lokal sungguhan (signal/computed/effect/batch, melacak dependensi) sebagai cadangan CDN; CDN diberi batas tunggu 2,5 detik.
- Bug ikut terperbaiki: `<s>` tidak ada di allowlist sanitizer sehingga harga coret Shopee hilang dari Etalase; ikon gembok tampil sebagai busur "∩" karena rect SVG tidak tergambar.
- Tes: `tests/architecture.test.mjs`, `tests/signals.test.mjs`, dan E2E Chromium nyata `npm run test:e2e` (20 pengecekan, butuh Playwright).

**Belum selesai / catatan jujur**
- v5.82 membatasi 100 produk (`Maksimal 100 produk`, 4 tempat). Batas ini belum dicabut karena tab Hitung masih membangun satu formulir berat per produk. Mencabutnya adalah bagian Tahap 4 (pecah per tab + virtualisasi).
- Tampilan masih memanggil `calc()` sinkron di utas utama untuk menyusun model Etalase; `calculate-batch` sudah siap tetapi belum dipasang ke tampilan.
- Tahap 3 (SQLite sebagai sumber data utama + Wasm lokal) dan Tahap 4 belum dikerjakan.
