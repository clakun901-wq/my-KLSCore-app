# Wulfeg (dulu Kalsara) - Micro-ERP e-commerce, 100% di sisi klien (basis Kalsara v5.82)

**Versi paket: v9.55 (kartu sambutan untuk aplikasi kosong dan tambah produk dari file Shopee Mass Update; di atas v9.54: impor CSV ramah pengguna: kolom dikenali dari judul, file hasil unduhan aplikasi bisa dibaca, SKU yang sudah ada tidak diduplikasi, dialog dengan bahasa awam; rumus tidak berubah; unit dan 24 E2E lulus di sandbox sesi, BELUM dijalankan di GitHub Actions pemilik). Di bawahnya v9.53 (ganti nama aplikasi menjadi Wulfeg; hanya teks tampilan, nama berkas unduhan, dan ikon; kunci penyimpanan `kalsara_*` sengaja tidak diubah supaya data lama aman; unit dan 23 E2E lulus di sandbox sesi, BELUM dijalankan di GitHub Actions pemilik). Di bawahnya v9.52 (label umum, bukan khusus dropship: "Modal supplier" jadi "Modal / HPP per pcs", "supplier" jadi "Sumber barang (opsional)", peringatan stok "Segera isi ulang stok"; rumus dan data tidak berubah; BELUM dijalankan di GitHub Actions pemilik). Di bawahnya v9.51 (perbaikan tampilan: penanda halaman Etalase rapi dan presisi; baris rincian teks panjang turun ke baris ke-2 dengan angka sejajar; di atas Tahap 9C v9.49). v9.50 lulus di GitHub Actions pemilik (npm test dan 22 E2E, `fail=0`); v9.51 juga lulus di GitHub Actions pemilik (npm test dan 23 E2E, `fail=0`).** Pengembangan, belum disertifikasi untuk produksi. Jangan menggantikan aplikasi toko asli sebelum GitHub Actions (23 E2E) dan uji manual lulus.

Aplikasi berjalan penuh di peramban: tanpa server, tanpa build tool, tanpa CDN saat berjalan. Logika bisnis dan hasil hitung identik dengan v5.82 (dibuktikan tes golden-master dan diferensial).

## Mulai dari mana
- Urutan baca untuk yang meneruskan setelah lama ditinggal: README -> `LANJUT-DI-SINI.md` -> `state_tracker.txt` -> [`CHANGELOG.md`](./CHANGELOG.md) -> [`docs/PANDUAN-PERAWATAN.md`](./docs/PANDUAN-PERAWATAN.md) (peta modul, arti fixture, skrip, daftar periksa rilis).
- Aturan dokumentasi: setiap sesi yang mengubah paket menambah entri CHANGELOG dan memperbarui LANJUT-DI-SINI, state_tracker, README, progress.html; `npm test` menolak dokumentasi yang usang.
- Posisi terakhir dan langkah berikutnya: [`LANJUT-DI-SINI.md`](./LANJUT-DI-SINI.md) dan `state_tracker.txt`.
- Dashboard ringkas: [`progress.html`](./progress.html).
- Sejarah teknis lama (arsip, tidak perlu dibaca): [`arsip/MIGRATION-STATUS.md`](./arsip/MIGRATION-STATUS.md).
- Aplikasi: buka `index.html` lewat HTTPS (mis. GitHub Pages). Service Worker butuh https atau localhost.

## Struktur
- `index.html` memuat satu titik masuk: `js/main.js` (modul ES). `css/app.css` stylesheet asli.
- `js/version.js` satu-satunya sumber nomor versi (nama cache Service Worker, panel Pembaruan; `package.json` dicek tes).
- `js/app-core.js` akar perakitan: memasang modul-modul fitur dengan impor dan sambungan eksplisit.
- Modul fitur di `js/`: kalkulator/harga (`pricing.js`, `tariff.js`, `calc-cache.js`, `money.js`), promosi dan voucher (`promosi-panel.js`, `promosi-data.js`, `voucher-rules.js`, `voucher-panel.js`), tab Hitung/Etalase (`hitung-etalase.js`, `etalase-view.js`, `hasil-view.js`, `kartu-update.js`), penjualan (`penjualan.js`), impor/sinkron (`tab-impor-sinkron.js`, `xlsx-reader.js`), cadangan dan setelan (`backup.js`, `penyimpanan-cadangan.js`, `pengaturan.js`, `theme.js`), ERP (`erp.js`), PWA (`pwa.js`), dan pendukung (`state.js`, `signals.js`, `ui.js`, `dom.js`, `helpers.js`, `format.js`, `warnings.js`).
- Penyimpanan: `js/storage.js`, `js/sqlite-engine.js`, `js/sqlite-client.js`, `workers/sqlite-store.worker.js`. SQLite Wasm (OPFS) adalah satu-satunya sumber data utama; berkas Wasm tersimpan lokal di `vendor/sqlite-wasm/` (versi dikunci, `npm run vendor:check`).
- Worker: `workers/compute.worker.js`, `calculator-engine.js`, `pricing-pipeline.js` (hitung, impor, laporan ERP di luar utas utama).
- `components/product-card.js` kartu produk (Web Component, Shadow DOM).
- `sw.js` Service Worker; daftar cache dijaga tes agar sama dengan berkas nyata.
- `source/Kalsara-v5_82.html` salinan sumber asli (referensi). `scripts/` dan `laporan/` alat pengembang (tidak ikut cache pengguna).

## Menguji
- `npm test`: unit, diferensial terhadap kode lama, golden-master terhadap v5.82, audit arsitektur (butuh Node 22).
- E2E di Chromium nyata: GitHub -> Actions -> **Uji E2E Browser** -> Run workflow (menjalankan `npm test` lalu 23 skrip `tests/e2e/*.e2e.py`).
- Aturan: satu tes gagal = berhenti dan perbaiki; jangan melemahkan tes agar lulus.

## Batasan yang masih terbuka
- Uji manual Bagian 7 pada salinan data, uji HP nyata, uji offline pada perangkat nyata, pemulihan data besar/asli, dan cadangan lintas perangkat belum dilakukan.
- `js/app-core.js` masih satu modul perakitan yang berisi beberapa bagian; memecahnya lagi adalah pekerjaan opsional.
- Simpan cadangan data secara berkala; lakukan semua uji pada salinan data, bukan data toko asli.
