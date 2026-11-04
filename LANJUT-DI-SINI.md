# LANJUT-DI-SINI — migrasi Kalsara (paket v9.31)

**Untuk AI di percakapan baru:** baca berkas ini saja dulu (1 halaman). Jangan membaca seluruh `MIGRATION-STATUS.md` (80 KB, arsip); buka hanya bagian tahap yang perlu. Kerjakan **satu langkah saja** per sesi, lalu perbarui berkas ini.

## Aturan dari pemilik proyek
- Pemilik tidak menulis kode; jelaskan keputusan teknis dengan bahasa mudah, jangan menyuruh membaca seluruh kode.
- Pekerjaan pendek (satu langkah) agar konteks tidak hilang. Di akhir: beri hasil dalam **angka** dan petunjuk langkah berikutnya (berkas ini).
- Jangan klaim E2E lulus hanya dari tes unit. Jangan hapus loader legacy sebelum semua pemanggil global hilang.

## Posisi
v9.31 = **tahap 6d selesai**: peringatan stok/margin (`pc1, skHi, stk, warns, WN, mchg`) dipindah dari `js/legacy/20-hitung-etalase.js` ke `js/warnings.js` (`createWarnings`). Rincian di `MIGRATION-STATUS.md` bagian "Perubahan v9.31".

## Angka saat ini
| Ukuran | v9.30 | v9.31 | Target akhir |
|---|---|---|---|
| Sisa kode legacy (`js/legacy/*.js`) | 115.496 byte | **113.452 byte** | 0 (loader dihapus) |
| Pemisahan dari skrip v5.82 (193,3 KB) | 40,3% | **41,3%** | 100% |
| `20-hitung-etalase.js` | 34.601 byte | **32.557 byte** | habis dipecah |
| `npm test` | hijau | **hijau (exit 0)** | hijau |
| Asersi tes baru (`warnings.test.mjs`) | – | **17.055** (10 sabotase tertangkap) | – |
| Audit struktural (`legacy-split.test.mjs`) | 332 | **363** | – |
| E2E Chromium (10 berkas) | 184 | **203** | semua hijau |

## Langkah berikutnya: tahap 6e (`upd`, `updRow`, `fill`)
- Ini bagian yang paling banyak bergantung pada hal lain (menyentuh DOM kartu, `calc`, `warns/stk/mchg`, `tchk`, `A`, `rows`). **Sebelum memindah apa pun**, ukur dulu dengan `grep -n "^function upd\|^function updRow\|^function fill" js/legacy/20-hitung-etalase.js` dan daftar semua yang dipakai tiap fungsi. Bila lebih dari ±8 KB atau lebih dari ±10 ketergantungan, pecah jadi 6e (`fill`) dan 6f (`upd/updRow`), jangan dipaksa satu langkah.
- `updRow` kini memanggil `stk`, `warns`, `mchg`, `pc1` yang sudah modul (lihat `warnings.js`): itu aman, namanya tetap sama.
- Catatan: `tchk` dibungkus ulang di `80-cadangan-tema.js` dan `fill`/`upd` saling memanggil dengan `tchk`; pertahankan pembungkus late-bound seperti di pemasangan `createTarifUI`.
- Pola yang dipakai (tiru `js/warnings.js` dan `tests/warnings.test.mjs`): (1) bekukan teks lama ke `tests/fixtures/<nama>.pre_v9_32.js.txt`; (2) modul = teks lama + sisipan minimal (`var A=getA();`); (3) pasang `var {..}=createX({..})` di bagian 20 dengan pembungkus late-bound untuk nilai yang belum ada saat muat; (4) tes diferensial lama-vs-baru **plus sabotase** (rusak-kan tiap sisipan, tes harus gagal); (5) audit di `legacy-split.test.mjs`; (6) `sw.js` (cache + CORE), `package.json` (versi + tes + `test:e2e`), `tests/helpers/legacy-source.mjs` (`leafModuleSources`), loader `js/legacy-app.js`; (7) bila fungsi yang dipindah diekstrak oleh `tests/golden-master.test.mjs` lewat teks, harness vm-nya perlu shim `getA` (sudah ada sejak v9.31).
- Target angka 6e: sisa legacy turun sesuai ukuran yang dipindah, `npm test` hijau, E2E 203 tetap hijau (+ E2E baru bila ada jalur UI baru), versi 0.9.32 / cache `client-v9.32`.
- Antrean sesudahnya: kartu Hitung (`cardBody, card, hyd, ...`) → `shop()`/Etalase dan `setStock/etUn/etSet` → `50-promosi.js` (40 KB; `calcNV` memutasi `VNO`) → `60-tab-impor-sinkron.js` (22 KB) → sisa `80-cadangan-tema.js` (butuh jembatan dua arah untuk `A/rows/SALES/PRM/TS`) → hapus loader.

## Jebakan yang sudah ketemu
- Fungsi `function` di-hoist; setelah dipindah jadi `var` yang baru ada setelah baris pemasangan. Cek pemakaian saat muat; nilai yang belum ada diberikan lewat pembungkus `function(){return x()}`.
- `tchk` dibungkus ulang di `80-cadangan-tema.js` (`var _tchk=tchk; tchk=function...`): harus tetap `var`, jangan `const`/`let`.
- `A`, `rows`, `SALES`, `PRM`, `TS` bisa diganti utuh saat restore backup: jangan simpan salinan; baca lewat getter di dalam fungsi.
- `#tchk` dan `#tbl` ada di tab **Cek tarif** (`#v5`, bagian lipat "Tabel tarif Shopee"), bukan `#v3`.
- Pada kode legacy, `KDOM` adalah global (`js/dom.js`); `$` dan `fill` didefinisikan di bagian lain.
- **Perkiraan ketergantungan bisa meleset.** Catatan v9.30 menyebut `warns/mchg` hanya butuh `A, calc, fwd, rp, fmt, today`; ternyata `mchg` juga memakai `dtx` (dari `js/helpers.js`). Selalu `grep` badan fungsinya sebelum menulis daftar injeksi.
- **Harness `golden-master.test.mjs` mengambil fungsi lewat teks** (`extractFunction`). Fungsi yang dipindah ke modul dan memakai `getA()` butuh shim `function getA(){return A}` di vm (sudah ada untuk `warns/WN/pc1`).
- **`kalkulasi target untung 0` tidak menghasilkan "Untung nol" di layar:** harga dibulatkan ke rupiah penuh sehingga untung ±Rp 36 -> "Untung tipis". Itu perilaku bawaan v5.82 (golden-master sama), bukan bug pemindahan. "Untung nol" persis hanya diuji di `warnings.test.mjs`.
- **Playwright:** kartu di luar layar tidak dirender, jadi `inner_text()` kosong; pakai `text_content()` dan `scroll_into_view_if_needed()` sebelum klik. `#list` ada di tab Hitung (`#t1`/`#v1`), yang tersembunyi saat muat (tab awal = Etalase).

## Cara menjalankan tes
1. `unzip` paket ke `/home/claude`, masuk ke `my-KLSCore-app-main`.
2. `npm test` (harus exit 0).
3. E2E satu per satu: `export CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` lalu `python3 tests/e2e/<nama>.e2e.py` untuk: load 8, shelf 20, hitung 13, sqlite-fallback 8, voucher 31, penjualan 27, voucher-panel 39, dialog 19, tarif 19, peringatan 19. Bila Chromium diblokir, jangan anggap E2E lulus.

## Masih terbuka (belum terbukti)
Uji offline Service Worker, uji di HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat, alur restore lewat UI lalu mengubah tarif. (Sejak v9.31 sudah terbukti: restore lewat teks tempel lalu peringatan stok memakai ambang hasil restore, di Chromium nyata.) Paket ini **belum boleh menggantikan aplikasi produksi**.

## Sebelum menyerahkan paket berikutnya
Perbarui: berkas ini (posisi, angka, langkah berikutnya), bagian baru di `MIGRATION-STATUS.md`, `progress.html`, `README.md` (baris versi), `sw.js`, `package.json`. Beri nama ZIP `my-KLSCore-app-v9_<NN>.zip` dengan folder `my-KLSCore-app-main/`.
