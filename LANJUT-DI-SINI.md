# LANJUT-DI-SINI — migrasi Kalsara (paket v9.30)

**Untuk AI di percakapan baru:** baca berkas ini saja dulu (1 halaman). Jangan membaca seluruh `MIGRATION-STATUS.md` (80 KB, arsip); buka hanya bagian tahap yang perlu. Kerjakan **satu langkah saja** per sesi, lalu perbarui berkas ini.

## Aturan dari pemilik proyek
- Pemilik tidak menulis kode; jelaskan keputusan teknis dengan bahasa mudah, jangan menyuruh membaca seluruh kode.
- Pekerjaan pendek (satu langkah) agar konteks tidak hilang. Di akhir: beri hasil dalam **angka** dan petunjuk langkah berikutnya (berkas ini).
- Jangan klaim E2E lulus hanya dari tes unit. Jangan hapus loader legacy sebelum semua pemanggil global hilang.

## Posisi
v9.30 = **tahap 6c selesai**: logika tarif/peringatan tarif dipindah dari `js/legacy/20-hitung-etalase.js` ke `js/tarif-ui.js` (`createTarifUI`). Rincian ada di `MIGRATION-STATUS.md` bagian "Perubahan v9.30".

## Angka saat ini
| Ukuran | v9.29 | v9.30 | Target akhir |
|---|---|---|---|
| Sisa kode legacy (`js/legacy/*.js`) | 118.423 byte | **115.496 byte** | 0 (loader dihapus) |
| Pemisahan dari skrip v5.82 (193,3 KB) | 38,7% | **40,3%** | 100% |
| `20-hitung-etalase.js` | 37.528 byte | **34.601 byte** | habis dipecah |
| `npm test` | hijau | **hijau (exit 0)** | hijau |
| Asersi tes baru (`tarif-ui.test.mjs`) | – | **7.687** | – |
| Audit struktural (`legacy-split.test.mjs`) | 287 | **332** | – |
| E2E Chromium (9 berkas) | 165 | **184** | semua hijau |

## Langkah berikutnya: tahap 6d (peringatan stok/margin)
- Pindahkan `pc1, skHi, stk, warns, WN, mchg` (±2,2 KB, sekitar baris 49–73 `20-hitung-etalase.js`) ke modul baru (mis. `js/warnings.js`, `createWarnings`).
- Ketergantungan: `A`, `calc`, `fwd`, `rp`, `fmt`, `today` (cek lagi dengan `grep`). `A` ditugaskan ulang saat restore → baca lewat `getA()` di dalam fungsi.
- Pemakai di luar bagian 20: `pc1`/`warns` di `50-promosi.js` dan `60-tab-impor-sinkron.js`; `skHi` di bagian 20. Periksa apakah dipakai saat muat (hoisting) atau hanya di badan fungsi.
- Pola yang dipakai (tiru `js/tarif-ui.js` dan tesnya): (1) bekukan teks lama ke `tests/fixtures/<nama>.pre_v9_31.js.txt`; (2) modul = teks lama + sisipan minimal; (3) pasang `var {..}=createX({..})` di bagian 20 dengan pembungkus late-bound untuk nilai yang baru ada belakangan; (4) tes diferensial lama-vs-baru + sabotase; (5) audit di `legacy-split.test.mjs`; (6) `sw.js` (cache + CORE), `package.json` (versi + tes), `tests/helpers/legacy-source.mjs` (`leafModuleSources`), loader `js/legacy-app.js`.
- **Target angka 6d:** sisa legacy ≈ 114.000 byte (±500), pemisahan ≈ 41%, `npm test` hijau, E2E 184 tetap hijau (+ E2E baru bila ada jalur UI yang menampilkan peringatan stok/margin), versi 0.9.31 / cache `client-v9.31`.
- Antrean sesudahnya: `upd/updRow/fill` dan kartu Hitung (`cardBody, card, hyd, ...`) → `shop()`/Etalase dan `setStock/etUn/etSet` → `50-promosi.js` (40 KB; `calcNV` memutasi `VNO`) → `60-tab-impor-sinkron.js` (22 KB) → sisa `80-cadangan-tema.js` (butuh jembatan dua arah untuk `A/rows/SALES/PRM/TS`) → hapus loader.

## Jebakan yang sudah ketemu
- Fungsi `function` di-hoist; setelah dipindah jadi `var` yang baru ada setelah baris pemasangan. Cek pemakaian saat muat; nilai yang belum ada diberikan lewat pembungkus `function(){return x()}`.
- `tchk` dibungkus ulang di `80-cadangan-tema.js` (`var _tchk=tchk; tchk=function...`): harus tetap `var`, jangan `const`/`let`.
- `A`, `rows`, `SALES`, `PRM`, `TS` bisa diganti utuh saat restore backup: jangan simpan salinan; baca lewat getter di dalam fungsi.
- `#tchk` dan `#tbl` ada di tab **Cek tarif** (`#v5`, bagian lipat "Tabel tarif Shopee"), bukan `#v3`.
- Pada kode legacy, `KDOM` adalah global (`js/dom.js`); `$` dan `fill` didefinisikan di bagian lain.

## Cara menjalankan tes
1. `unzip` paket ke `/home/claude`, masuk ke `my-KLSCore-app-main`.
2. `npm test` (harus exit 0).
3. E2E satu per satu: `export CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` lalu `python3 tests/e2e/<nama>.e2e.py` untuk: load 8, shelf 20, hitung 13, sqlite-fallback 8, voucher 31, penjualan 27, voucher-panel 39, dialog 19, tarif 19. Bila Chromium diblokir, jangan anggap E2E lulus.

## Masih terbuka (belum terbukti)
Uji offline Service Worker, uji di HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat, alur restore lewat UI lalu mengubah tarif. Paket ini **belum boleh menggantikan aplikasi produksi**.

## Sebelum menyerahkan paket berikutnya
Perbarui: berkas ini (posisi, angka, langkah berikutnya), bagian baru di `MIGRATION-STATUS.md`, `progress.html`, `README.md` (baris versi), `sw.js`, `package.json`. Beri nama ZIP `my-KLSCore-app-v9_<NN>.zip` dengan folder `my-KLSCore-app-main/`.
