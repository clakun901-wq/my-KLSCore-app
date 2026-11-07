# Kalsara - Micro-ERP e-commerce, 100% di sisi klien (basis Kalsara v5.82)

**Versi paket: v9.49 (Tahap 9C: percepatan aksi di tab Hitung, Promosi, dan Etalase; v9.48 lulus 21 E2E di GitHub Actions).** Pengembangan, belum disertifikasi untuk produksi. Jangan menggantikan aplikasi toko asli sebelum GitHub Actions (21 E2E) dan uji manual lulus.

Aplikasi berjalan penuh di peramban: tanpa server, tanpa build tool, tanpa CDN saat berjalan. Logika bisnis dan hasil hitung identik dengan v5.82 (dibuktikan tes golden-master dan diferensial).

## Mulai dari mana
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
- E2E di Chromium nyata: GitHub -> Actions -> **Uji E2E Browser** -> Run workflow (menjalankan `npm test` lalu 21 skrip `tests/e2e/*.e2e.py`).
- Aturan: satu tes gagal = berhenti dan perbaiki; jangan melemahkan tes agar lulus.

## Batasan yang masih terbuka
- E2E v9.49 belum dijalankan di GitHub Actions (v9.48 lulus 21/21); uji HP nyata, uji offline pada perangkat nyata, pemulihan data besar/asli, dan cadangan lintas perangkat belum dilakukan.
- `js/app-core.js` masih satu modul perakitan yang berisi beberapa bagian; memecahnya lagi adalah pekerjaan opsional.
- Simpan cadangan data secara berkala; lakukan semua uji pada salinan data, bukan data toko asli.
