# LANJUT-DI-SINI — migrasi Kalsara (paket v9.32)

**Untuk AI di percakapan baru:** baca berkas ini saja dulu (1 halaman). Jangan membaca seluruh `MIGRATION-STATUS.md` (80 KB, arsip); buka hanya bagian tahap yang perlu. Kerjakan **satu langkah saja** per sesi, lalu perbarui berkas ini.

## Aturan dari pemilik proyek
- Pemilik tidak menulis kode; jelaskan keputusan teknis dengan bahasa mudah, jangan menyuruh membaca seluruh kode.
- Pekerjaan pendek (satu langkah) agar konteks tidak hilang. Di akhir: beri hasil dalam **angka** dan petunjuk langkah berikutnya (berkas ini).
- Jangan klaim E2E lulus hanya dari tes unit. Jangan hapus loader legacy sebelum semua pemanggil global hilang.

## Posisi
v9.32 = **tahap 6e selesai**: tampilan hasil kartu Hitung (`revHtml, CR, sp, errH`) dipindah dari `js/legacy/20-hitung-etalase.js` ke `js/hasil-view.js` (`createHasilView`). Rincian di `MIGRATION-STATUS.md` bagian "Perubahan v9.32". (Penomoran: 6d = peringatan stok/margin; 6e = tampilan hasil; `updRow` dan `upd/fill` jadi 6f dan 6g.)

## Angka saat ini
| Ukuran | v9.31 | v9.32 | Target akhir |
|---|---|---|---|
| Sisa kode legacy (`js/legacy/*.js`) | 113.452 byte | **111.495 byte** | 0 (loader dihapus) |
| Pemisahan dari skrip v5.82 (193,3 KB) | 41,3% | **42,3%** | 100% |
| `20-hitung-etalase.js` | 32.557 byte | **30.600 byte** | habis dipecah |
| `npm test` | hijau | **hijau (exit 0)** | hijau |
| Asersi tes baru (`hasil-view.test.mjs`) | – | **17.052** (14 sabotase tertangkap) | – |
| Audit struktural (`legacy-split.test.mjs`) | 363 | **395** | – |
| E2E Chromium (11 berkas) | 203 | **221** (10 lama 203 + `hasil` 18) | semua hijau |

## Langkah berikutnya: tahap 6f = `updRow`
- `updRow` (±4.721 B) memakai `acH, bdH, vnote, vscn` (belum modul: suntikkan lewat pembungkus late-bound), plus `pr, dtx, WN, stk, warns, mchg, pc1, CR, sp, revHtml, errH, calc, A` dan DOM kartu. **Ukur ulang dengan grep** sebelum menulis daftar injeksi (perkiraan sering meleset).
- Setelah itu 6g = `upd` + `fill`. `fill` ada di `80-cadangan-tema.js` baris 1 (bukan bagian 20). `upd` MENULIS `PSIG` (dideklarasikan di `50-promosi.js` baris 10, dibaca `tab()` di `60-tab-impor-sinkron.js`), jadi butuh setter. Daftar late-bound 6g dari sesi lalu (belum diukur ulang): `gwarn, dep, flt, shop, vwarn, paSync, tlRender, persist, psig, tchk` + setter `PSIG`.
- `updRow` kini memanggil `CR, sp, revHtml, errH` yang sudah modul (namanya tetap sama, global lewat `var {..}=createHasilView(..)`): aman. Pasang pembuat `updRow` SETELAH baris `createHasilView` bila nilai-nilai itu disuntikkan langsung.
- Dua tes mengutip teks `updRow/upd` (`architecture.test.mjs:38`, `compatibility.test.mjs:26`); keduanya membaca legacy + `leafModuleSources`, jadi daftarkan modul baru di `tests/helpers/legacy-source.mjs`.
- Pola yang dipakai (tiru `js/hasil-view.js` dan `tests/hasil-view.test.mjs`, yang meniru `warnings`): (1) bekukan teks lama ke `tests/fixtures/<nama>.pre_v9_33.js.txt`; (2) modul = teks lama + sisipan minimal (`var A=getA();`); (3) pasang `var {..}=createX({..})` di bagian 20 dengan pembungkus late-bound untuk nilai yang belum ada saat muat; (4) tes diferensial lama-vs-baru **plus sabotase** (rusak-kan tiap sisipan dan tiap perilaku; tes harus gagal; bila sabotase lolos, tiruan tes kurang kasus tepi); (5) audit di `legacy-split.test.mjs`; (6) `sw.js` (cache + CORE), `package.json` (versi + tes + `test:e2e`), `tests/helpers/legacy-source.mjs`, loader `js/legacy-app.js`; (7) cek apakah E2E lama benar-benar menyentuh fungsi yang dipindah (di 6e ternyata tidak, jadi ditambah `hasil.e2e.py`).
- Antrean sesudahnya: kartu Hitung (`cardBody, card, hyd, ...`) → `shop()`/Etalase dan `setStock/etUn/etSet` → `50-promosi.js` (40 KB; `calcNV` memutasi `VNO`) → `60-tab-impor-sinkron.js` (22 KB) → sisa `80-cadangan-tema.js` (butuh jembatan dua arah untuk `A/rows/SALES/PRM/TS`) → hapus loader.
- Temuan yang belum ditindak: `errH` (di `hasil-view.js`) dan `errModel` (bagian 20, ±baris 113) memuat peta pesan galat yang sama (4 pesan identik). Boleh disatukan di langkah tersendiri; jangan dicampur dengan 6f/6g.

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

- **(v9.32) `fwdL` dan `tmod` sudah modul** (`createPricing` di `10-calc.js`), bukan legacy; bisa disuntikkan langsung ke modul bagian 20 karena dipasang sebelumnya dan tak pernah ditugaskan ulang. Urutan pemasangan di bagian 20 penting: modul yang butuh `warns/WN/pc1` harus dipasang SETELAH baris `createWarnings`.
- **(v9.32) Tiruan tes harus mencakup nilai tepi.** Sabotase `q.u<0` -> `q.u<=0` sempat lolos karena `fwdL` palsu tak pernah menghasilkan untung persis 0. Bila sabotase lolos, perbaiki tiruan, bukan sabotasenya.
- **(v9.32) "E2E hijau" tidak berarti jalur itu teruji.** Sebelum 6e, tak ada E2E yang menyentuh `revHtml/CR/sp/errH`. Cek dengan grep teks keluarannya di `tests/e2e/*.py`. Target untung raksasa TIDAK memicu galat; galat nyata contohnya voucher toko 100% (`vm=pct`, `vv=100` lewat Pengaturan).
- **(v9.32) Pengerjaan lewat `sh`:** `${PIPESTATUS[0]}` gagal ("Bad substitution"); tulis keluaran ke berkas lalu baca `$?`.

## Cara menjalankan tes
1. `unzip` paket ke `/home/claude`, masuk ke `my-KLSCore-app-main`.
2. `npm test` (harus exit 0).
3. E2E satu per satu: `export CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` lalu `python3 tests/e2e/<nama>.e2e.py` untuk: load 8, shelf 20, hitung 13, sqlite-fallback 8, voucher 31, penjualan 27, voucher-panel 39, dialog 19, tarif 19, peringatan 19, hasil 18 (total 221). Bila Chromium diblokir, jangan anggap E2E lulus.

## Masih terbuka (belum terbukti)
Uji offline Service Worker, uji di HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat, alur restore lewat UI lalu mengubah tarif. (Sejak v9.31 sudah terbukti: restore lewat teks tempel lalu peringatan stok memakai ambang hasil restore, di Chromium nyata. Sejak v9.32: restore lalu baris "Ongkir ditanggung" di hasil kartu Hitung memakai A hasil restore.) Paket ini **belum boleh menggantikan aplikasi produksi**.

## Sebelum menyerahkan paket berikutnya
Perbarui: berkas ini (posisi, angka, langkah berikutnya), bagian baru di `MIGRATION-STATUS.md`, `progress.html`, `README.md` (baris versi), `sw.js`, `package.json`. Beri nama ZIP `my-KLSCore-app-v9_<NN>.zip` dengan folder `my-KLSCore-app-main/`.
