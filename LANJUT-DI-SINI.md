# LANJUT-DI-SINI — migrasi Kalsara (paket v9.33)

**Untuk AI di percakapan baru:** baca berkas ini saja dulu (1 halaman). Jangan membaca seluruh `MIGRATION-STATUS.md` (80 KB, arsip); buka hanya bagian tahap yang perlu. Kerjakan **satu langkah saja** per sesi, lalu perbarui berkas ini.

## Aturan dari pemilik proyek
- Pemilik tidak menulis kode; jelaskan keputusan teknis dengan bahasa mudah, jangan menyuruh membaca seluruh kode.
- Pekerjaan pendek (satu langkah) agar konteks tidak hilang. Di akhir: beri hasil dalam **angka** dan petunjuk langkah berikutnya (berkas ini).
- Jangan klaim E2E lulus hanya dari tes unit. Jangan hapus loader legacy sebelum semua pemanggil global hilang.

## Posisi
**v9.32.1 = perbaikan darurat di atas v9.32** (bukan langkah migrasi): cadangan PENUH dan pulihkan cadangan ber-ERP error sejak v9.18 karena `createBackup({ERP:ERP})` menyalin `ERP` yang masih undefined (ERP dipasang di `90-erp.js`, sesudah `80-cadangan-tema.js`). Diperbaiki dengan pembungkus late-bound + E2E `cadangan.e2e.py` + audit permanen semua pemasangan `createXxx`. Rincian: `MIGRATION-STATUS.md` bagian "Perbaikan v9.32.1". Impor "modal Rp 1" dari ekspor Hitung BUKAN regresi (v5.82 asli sama; kolom ekspor beda dari kolom impor).

v9.32 = **tahap 6e selesai**: tampilan hasil kartu Hitung (`revHtml, CR, sp, errH`) dipindah ke `js/hasil-view.js`.
v9.33 = **tahap 6f selesai pada tingkat pemisahan dan tes unit**: `updRow` dipindah ke `js/kartu-update.js` (`createKartuUpdate`). `upd` dan `fill` TIDAK disentuh. Rincian dan batas bukti di `MIGRATION-STATUS.md` bagian "Perubahan v9.33".

## Angka saat ini
| Ukuran | v9.32.1 (diukur ulang dari ZIP) | v9.33 |
|---|---:|---:|
| Sisa kode legacy (`js/legacy/*.js`) | 111.935 byte | **108.050 byte** |
| Pemisahan dari skrip inline v5.82 (193.312 byte) | 42,1% | **44,1%** |
| `20-hitung-etalase.js` | 30.600 byte | **26.715 byte** |
| Modul `js/kartu-update.js` | – | 5.008 byte |
| Fixture `updRow` lama | – | 4.721 byte |
| `npm test` | hijau (exit 0) | **hijau (exit 0)** |
| Tes diferensial/sabotase baru | – | **48 assertion; 15 kontrol mutasi sumber** |
| Audit struktural (`legacy-split.test.mjs`) | 404 | **429** |
| E2E Chromium | 233 (v9.32.1) | **belum teruji pada v9.33** |

**Koreksi angka lama:** total legacy yang benar-benar diekstrak dari ZIP v9.32.1 adalah 111.935 byte, bukan 111.495 (selisih 440 byte). Persentase dihitung ulang dengan penyebut skrip inline v5.82 193.312 byte.

**E2E v9.33:** 13 berkas sudah dicoba satu per satu, tetapi browser diblokir saat membuka localhost (`ERR_BLOCKED_BY_ADMINISTRATOR`). E2E baru `kartu-update.e2e.py` memiliki 9 assertion tetapi belum mencapai assertion. Jangan menyebut E2E v9.33 lulus. Total target bila seluruh E2E berhasil = 242.

## Langkah berikutnya: tahap 6g = `upd` + `fill`
- **Jangan kerjakan sebelum E2E v9.33 bisa dijalankan** di lingkungan Chromium yang mengizinkan localhost. Tes unit hijau tidak membuktikan pemasangan di browser.
- `upd` masih di `js/legacy/20-hitung-etalase.js`; `fill` masih di `js/legacy/80-cadangan-tema.js`. Keduanya tetap utuh pada v9.33.
- Daftar late-bound 6g dari catatan lama (WAJIB ukur ulang dengan grep): `gwarn, dep, flt, shop, vwarn, paSync, tlRender, persist, psig, tchk` + setter `PSIG`. `upd` menulis `PSIG` (dideklarasikan di `50-promosi.js`, dibaca `tab()` di `60-tab-impor-sinkron.js`), jadi butuh setter.
- Properti baris yang dipindah `updRow` tulis: `r._ag`, `r.sl`, `r.u`, `r.lv`, `r.mg`, `r.M`. `upd` membaca agregat/filter/pengurutan; jangan ubah kontraknya.
- Sebelum 6g, ulangi 13 E2E: load 8, shelf 20, hitung 13, sqlite-fallback 8, voucher 31, penjualan 27, voucher-panel 39, dialog 19, tarif 19, peringatan 19, hasil 18, cadangan 12, kartu-update 9 (target total 242). Angka lama 233 hanya bukti v9.32.1.
- Detail migrasi 6f dan koreksi byte ada di `MIGRATION-STATUS.md` bagian "Perubahan v9.33".

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

- **(v9.33) `updRow` sekarang modul, tetapi pemanggilnya belum:** `updRow` dipasang sebagai `var` setelah `createHasilView`; pemanggil hanya berada di badan `hyd` dan `upd` (bukan dipanggil saat evaluasi bagian 20). `acH/bdH/vnote/vscn` dibungkus fungsi agar lookup tetap late-bound. E2E baru belum terbukti karena navigasi localhost diblokir; jangan lanjut ke 6g sampai browser E2E dapat dijalankan.
- **(v9.32) `fwdL` dan `tmod` sudah modul** (`createPricing` di `10-calc.js`), bukan legacy; bisa disuntikkan langsung ke modul bagian 20 karena dipasang sebelumnya dan tak pernah ditugaskan ulang. Urutan pemasangan di bagian 20 penting: modul yang butuh `warns/WN/pc1` harus dipasang SETELAH baris `createWarnings`.
- **(v9.32) Tiruan tes harus mencakup nilai tepi.** Sabotase `q.u<0` -> `q.u<=0` sempat lolos karena `fwdL` palsu tak pernah menghasilkan untung persis 0. Bila sabotase lolos, perbaiki tiruan, bukan sabotasenya.
- **(v9.32) "E2E hijau" tidak berarti jalur itu teruji.** Sebelum 6e, tak ada E2E yang menyentuh `revHtml/CR/sp/errH`. Cek dengan grep teks keluarannya di `tests/e2e/*.py`. Target untung raksasa TIDAK memicu galat; galat nyata contohnya voucher toko 100% (`vm=pct`, `vv=100` lewat Pengaturan).
- **(v9.32) Pengerjaan lewat `sh`:** `${PIPESTATUS[0]}` gagal ("Bad substitution"); tulis keluaran ke berkas lalu baca `$?`.

- **(v9.32.1) Pemasangan `createXxx({k:nilai})` menyalin nilai SAAT MUAT.** Nilai berupa `var` yang baru ditugaskan di bagian/baris sesudahnya menjadi `undefined` selamanya. Bungkus dengan `function(){return x()}` atau objek pembungkus. Audit otomatis di `legacy-split.test.mjs` kini menolak pola ini.
- **(v9.32.1) Tes unit dengan dependensi palsu tidak membuktikan pemasangannya.** `backup.test.mjs` menyuntik ERP palsu langsung, jadi bug pemasangan lolos 14 versi. Setiap modul baru yang dipasang di legacy harus punya jalur E2E yang benar-benar memakai dependensi aslinya (cek dengan sabotase: kode lama harus membuat E2E gagal).
- **(v9.32.1) Cara cepat menguji kompatibilitas data v5.82:** jalankan `source/Kalsara-v5_82.html` di Chromium (server http sederhana), seed `localStorage['kalsara_v3']`, panggil `bkFull(false)`/`tbl()` di halaman asli, lalu masukkan hasilnya ke aplikasi baru lewat `#bf`/`#xf` (`set_input_files`) atau kotak teks `#bpt`. Di aplikasi baru fungsi legacy tidak global (modul), jadi pakai elemen UI.

## Cara menjalankan tes
1. `unzip` paket ke `/home/claude`, masuk ke `my-KLSCore-app-main`.
2. `npm test` (harus exit 0).
3. E2E satu per satu: `export CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` lalu `python3 tests/e2e/<nama>.e2e.py` untuk: load 8, shelf 20, hitung 13, sqlite-fallback 8, voucher 31, penjualan 27, voucher-panel 39, dialog 19, tarif 19, peringatan 19, hasil 18, cadangan 12 (total 233). Bila Chromium diblokir, jangan anggap E2E lulus.

## Masih terbuka (belum terbukti)
Uji offline Service Worker, uji di HP nyata, pemulihan ERP dengan data besar, berkas cadangan/ekspor ASLI milik pemilik (hanya tangkapan layar yang pernah dilihat), migrasi data v5.82 riil, backup/restore lintas perangkat, alur restore lewat UI lalu mengubah tarif. (Sejak v9.31 sudah terbukti: restore lewat teks tempel lalu peringatan stok memakai ambang hasil restore, di Chromium nyata. Sejak v9.32: restore lalu baris "Ongkir ditanggung" di hasil kartu Hitung memakai A hasil restore.) Paket ini **belum boleh menggantikan aplikasi produksi**.

## Sebelum menyerahkan paket berikutnya
Perbarui: berkas ini (posisi, angka, langkah berikutnya), bagian baru di `MIGRATION-STATUS.md`, `progress.html`, `README.md` (baris versi), `sw.js`, `package.json`. Beri nama ZIP `my-KLSCore-app-v9_<NN>.zip` dengan folder `my-KLSCore-app-main/`.
