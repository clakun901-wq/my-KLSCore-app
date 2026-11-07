# Catatan perubahan (CHANGELOG) Kalsara

Aturan: SETIAP sesi yang mengubah paket menambah satu entri di paling atas (terbaru di atas), memakai nomor `paket` dari `js/version.js`. Tes `tests/dokumentasi.test.mjs` gagal bila entri versi saat ini tidak ada. Entri berisi: apa yang berubah (bahasa awam), berkas yang disentuh, bukti uji (dan di mana dijalankan), serta hal yang belum terbukti.

Catatan kejujuran: entri v9.40 ke atas ditulis rapi saat kejadian. Entri sebelumnya diringkas ulang dari `arsip/MIGRATION-STATUS.md` (arsip lengkap); v9.36 sampai v9.39 tidak punya bagian sendiri di arsip, jadi hanya disebut sebagai rangkaian tahap 6.

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
