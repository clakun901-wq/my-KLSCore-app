# Status migrasi Kalsara v5.82 — paket v9.31

Tanggal build: 2026-11-04

## CARA MELANJUTKAN (baca ini dulu di percakapan baru)
**Berkas ini adalah arsip rinci (80 KB). Mulai dari `LANJUT-DI-SINI.md` (1 halaman: posisi, angka, langkah berikutnya); buka berkas ini hanya untuk detail tahap tertentu.**
Unggah ZIP terbaru dan berkas ini. Posisi: **v9.31 = tahap 6d selesai** (langkah ke-4 memecah `20-hitung-etalase.js`; rincian di bagian v9.31 di bawah dan di `LANJUT-DI-SINI.md`). Memisahkan modul inti kalkulator, hitung/etalase, penjualan, voucher, dan promosi dilakukan bertahap. Jangan menghapus loader legacy sebelum semua pemanggil global dan E2E lintas tab terbukti aman.
- Sudah menjadi modul ES: ERP (`js/erp.js`), XLSX Reader (`js/xlsx-reader.js`), PWA (`js/pwa.js`), tema/mode (`js/theme.js`), parser teks cadangan murni (`js/backup-format.js`), serta (tahap 4-5) tarif, pipa harga, cache kalkulator, aturan voucher, jembatan state, tab Penjualan, dan panel Cek tarif (`js/voucher-panel.js`, v9.27), dialog konfirmasi/toast bersama (`js/ui.js`, v9.28), dan helper murni `esc/dtx/uid/prodSig/SGL/feeSig` (`js/helpers.js`, v9.29), serta logika tarif dan peringatan tarif (`js/tarif-ui.js`, v9.30).
- Masih di legacy: alur UI backup/restore, `applyState`, penyimpanan/kuota, sinkronisasi, onboarding, catatan tarif, dan pengaturan tarif di `js/legacy/80-cadangan-tema.js`. Bagian ini mengubah state inti (`A`, `rows`, `SALES`, `PRM`, `TS`) yang bisa diganti ketika restore; perlu bridge getter/setter dua arah.
- Tahap 4 (belum): modul inti (calc, hitung-etalase, penjualan/promosi, dst.), kemudian hapus loader setelah seluruh pemanggil global dihilangkan.
- Wajib tiap tahap: `npm test`; E2E satu per satu (`python3 tests/e2e/<nama>.e2e.py`): shelf 20, hitung 13, sqlite-fallback 8 (dengan Wasm terpasang), load 8, voucher 31, penjualan 27, cek tarif 39 (`voucher-panel.e2e.py`), dialog/toast 19 (`dialog.e2e.py`), tabel tarif 19 (`tarif.e2e.py`), peringatan stok/margin 19 (`peringatan.e2e.py`); uji offline Service Worker; uji ERP (HPP, OpEx) dan impor XLSX/CSV.
- Lingkungan E2E: pada sesi v9.25 Chromium Playwright berjalan normal terhadap `http://127.0.0.1` (sesi lama sempat diblokir kebijakan lingkungan). Bila diblokir lagi, jangan anggap E2E lulus berdasarkan unit test. Catatan: `npm run test:e2e` gagal di `sh` sesi v9.25 (error sintaks shell), jadi jalankan keempat/kelima berkas Python satu per satu. (Sesi v9.27: `npm run test:e2e` berjalan utuh lewat `npm`, exit 0, ketujuh berkas; tetap jalankan satu per satu bila rantai gagal di lingkungan lain.)
- Jebakan tahap 2: loader berada di `js/`, sehingga URL modul memakai `./erp.js` bukan `../erp.js`; periksa spasi pada hasil transformasi teks (`return getRows()` jangan berubah menjadi `returngetRows()`).

## Perubahan v9.31 — tahap 6d (peringatan stok/margin → `js/warnings.js`)
- Langkah keempat memecah `20-hitung-etalase.js`. `js/warnings.js` (baru, 3.541 byte) mengekspor `createWarnings({getA,calc,fwd,rp,fmt,today,dtx})` yang berisi `pc1, skHi, stk, warns, WN, mchg`, dipindah APA ADANYA dari baris 49-73 lama. Satu-satunya perubahan teks: `var A=getA();` di awal `skHi`, `stk`, `warns`, `mchg` (kode legacy menugaskan ulang `A` saat restore, jadi harus dibaca ulang tiap dipakai). `pc1` dan `WN` murni (tak memakai `A`).
- **Koreksi atas perkiraan awal:** `mchg` juga memakai `dtx` (dari `js/helpers.js`), tidak tercantum di catatan v9.30; kini disuntikkan.
- Pemasangan di bagian 20 (tepat setelah `feeSig`): `var {pc1,skHi,stk,warns,WN,mchg}=createWarnings({getA:...,calc:<pembungkus>,fwd:<pembungkus>,rp,fmt,today,dtx})`. `calc` dan `fwd` dibungkus late-bound agar selalu membaca nilai legacy terkini. Dulu `function` yang di-hoist; kini `var` yang baru ada setelah baris pemasangan. Sudah dipetakan: tak ada pemanggilan saat muat sebelum baris itu (00-core, 10-calc, awal bagian 20); semua pemakaian (`updRow`, `revHtml`, `shop`, `50-promosi.js`, `60-tab-impor-sinkron.js`) ada di badan fungsi dan dijalankan setelah boot. Audit statis menjaganya.
- Loader `js/legacy-app.js` mengimpor `createWarnings`; `sw.js` cache `kalsara-v5.82-client-v9.31` dan `./js/warnings.js` di CORE; `package.json` 0.9.31 (`warnings.test.mjs` masuk `npm test`, `peringatan.e2e.py` masuk `test:e2e`); `leafModuleSources` menyertakan `warnings.js`.
- **`tests/golden-master.test.mjs` diubah (harness saja):** harness vm mengeluarkan `warns/WN/pc1` mentah dari teks sumber; karena kini memakai `getA()`, ditambahkan shim `function getA(){return A}` ke prelude vm. Perbandingan terhadap v5.82 asli tetap utuh dan hijau.
- Tes baru `tests/warnings.test.mjs` (17.055 assertion): isi modul == teks v9.30 yang dibekukan (`tests/fixtures/warnings.pre_v9_31.js.txt`) + tepat empat sisipan; diferensial lama vs baru dengan `A/calc/fwd` palsu yang sama (250 skenario x 2 fase; fase 2 = `A` DIGANTI UTUH seperti restore) untuk `pc1`, `skHi`, `stk`, `warns`, `WN`, `mchg` termasuk urutan panggilan `calc/fwd`; kasus absolut (batas habis/hampir habis/menipis, untung nol/tipis, potongan tinggi, modal naik/turun, ack, tanggal lewat `dtx`); **10 sabotase tertangkap** (hapus `var A=getA()` di tiap dari empat fungsi, simpan salinan `A`, ubah `<=`/`<`, hilangkan `dtx`, balik arah modal, hilangkan pembulatan `pc1`) plus kontrol yang tetap lolos.
- Audit struktural `legacy-split.test.mjs` (tahap 6d, 363 assertion total, +31): tanda tangan dan ekspor, tanpa global tersembunyi (termasuk `document`), `getA()` di dalam keempat fungsi, `A` hanya ditugaskan empat kali, pemasangan beserta pembungkus `calc/fwd`, tak ada bagian legacy yang mendefinisikan ulang keenam fungsi, tak ada pemanggilan sebelum pemasangan, urutan eksekusi bagian 50/60/95 sesudah bagian 20.
- E2E baru `tests/e2e/peringatan.e2e.py` (19 assertion, Chromium nyata, tab Hitung): peringatan stok (belum diisi, habis, hampir habis, menipis, aman), modal naik + tombol "Sudah update harga di Shopee" (klik menghilangkan peringatan), untung tipis/sehat, ambang stok diubah lewat Pengaturan langsung berlaku, lalu **restore cadangan lewat teks tempel menggantikan `A` utuh dan peringatan memakai ambang baru**, bertahan setelah muat ulang; tanpa pageerror. Temuan: target untung 0 menghasilkan untung ±Rp 36 ("Untung tipis"), bukan "Untung nol" (perilaku bawaan v5.82); "Untung nol" persis hanya diuji di tes unit.
- Pengujian (semua hijau): `npm test` (exit 0); E2E Chromium satu per satu (`CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`): load 8, shelf 20, hitung 13, sqlite 8, voucher 31, penjualan 27, cek tarif 39, dialog 19, tarif 19 (184 asersi, dijalankan ulang setelah perubahan) + peringatan 19 = 203. Belum: uji offline Service Worker, HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat.
- Pengukuran jujur: sisa legacy 115.496 -> 113.452 byte (-2.044; pemisahan 40,3% -> 41,3% dari skrip v5.82 193,3 KB); `20-hitung-etalase.js` 34.601 -> 32.557 byte; `js/warnings.js` 3.541 byte. Selisih -2.044 lebih kecil dari ±2,2 KB karena baris catatan pemasangan ditambahkan di bagian 20; angka target "±114.000" di catatan lama kira-kira, hasil nyata 113.452.
- Berikutnya (6e): `upd`, `updRow`, `fill` (ukur ketergantungan dulu, pecah bila terlalu besar); lihat `LANJUT-DI-SINI.md`.

## Perubahan v9.30 — tahap 6c (logika tarif dan peringatan tarif → `js/tarif-ui.js`)
- Langkah ketiga memecah `20-hitung-etalase.js`. `js/tarif-ui.js` (baru) mengekspor `createTarifUI({getA,getRows,$,document,KDOM,AD,GO,GO2,fmt,today,SGL,prodSig,feeSig,calc,upd,fill,toast})` yang berisi `tblSync`, `tbuild`, `fillT`, `tchk`, `verStale`, `ADN`, `refreshLabels`, dan salinan tarif bawaan `AD0/GO0`, dipindah APA ADANYA. Satu-satunya perubahan teks: `var A=getA();` (dan `rows=getRows()` di `verStale`) di awal setiap fungsi dan di awal dua pendengar `tbuild`, karena kode legacy menugaskan ulang `A`/`rows` saat restore.
- Pemasangan di bagian 20: `var {tblSync,tbuild,fillT,tchk,refreshLabels}=createTarifUI({...})` di posisi baris pertama lama. `verStale` dan `ADN` kini PRIVAT di modul (tak ada pemakai lain; audit menjaganya). `feeSig/calc/upd/fill/toast` disuntikkan lewat PEMBUNGKUS late-bound (`function(){return feeSig()}`, dst.), bukan nilai langsung, karena nilainya baru ada setelah baris pemasangan (`feeSig`, `toast`) atau didefinisikan di bagian lain (`fill` di 80, `upd` di 20).
- **Jebakan `tchk`:** `js/legacy/80-cadangan-tema.js` membungkus ulang (`var _tchk=tchk;tchk=function(){_tchk();...}`). Karena itu `tchk` dipasang dengan `var {..}` (bisa ditugaskan ulang), JANGAN diubah menjadi `const`/`let` atau dihapus dari destrukturisasi. Pemanggil di `upd` memakai binding legacy sehingga ikut versi terbungkus.
- **Jebakan hoisting:** semua fungsi di atas dulu deklarasi `function` (di-hoist); kini `var` yang baru ada setelah baris pemasangan. Sudah dipetakan: tak ada pemakai saat muat sebelum baris itu (00-core, 10-calc); `tbuild` dipanggil di 95-boot (sesudah bagian 20); `fill` (80) dan `upd` (20) memanggilnya di badan fungsi (runtime). Audit statis menjaga ini; kunci properti `tchk:` di `DEF` (00-core) sengaja diabaikan oleh audit.
- `sw.js` cache `client-v9.30` dan `./js/tarif-ui.js` di CORE; `package.json` 0.9.30 (`tarif-ui.test.mjs` masuk `npm test`, `tarif.e2e.py` masuk `test:e2e`); `leafModuleSources` menyertakan `tarif-ui.js` (audit kompatibilitas 271 nama fungsi tetap lulus).
- Tes baru `tarif-ui.test.mjs` (7.687 assertion): isi modul == teks v9.29 yang dibekukan (`tests/fixtures/tarif-ui.pre_v9_30.js.txt`) + tepat enam sisipan; diferensial lama vs baru dengan DOM palsu untuk `tblSync` (150 skenario, termasuk `A` diganti utuh), `tbuild` (60 skenario x 12 ketikan acak: HTML, batas 100, koma, nilai tak valid, reset; pendengar yang dibuat SEBELUM restore menulis ke `A` HASIL restore), `fillT` (120), `refreshLabels` (100, dua root), `verStale`+`tchk` (600 skenario, sebelum dan sesudah restore serta waktu maju) dan kasus tetap berasal dari kebenaran absolut. Dibuktikan aktif: 3 sabotase teks tertangkap pemeriksaan teks, dan 3 sabotase PERILAKU (membaca `A` yang basi, `rows` kosong, reset ke `A` lama) tertangkap pemeriksaan perilaku saat pemeriksaan teks dimatikan.
- Audit struktural `legacy-split.test.mjs` (tahap 6c, 332 assertion total): tanda tangan dan ekspor, tanpa global tersembunyi, `getA()` di dalam fungsi, pemasangan beserta lima pembungkus, tak ada bagian legacy yang mendefinisikan ulang atau memakai `verStale/ADN/AD0/GO0`, `tchk` tetap `var` dan tetap dibungkus di 80, tak ada rujukan sebelum pemasangan. Audit lama `feeSig` kini mengizinkan pembungkus late-bound `feeSig:function(){return feeSig()}`.
- E2E baru `tests/e2e/tarif.e2e.py` (19 assertion, Chromium nyata, tab Cek tarif bagian "Tabel tarif Shopee"): 34 kotak (kategori I tanpa Ongkir), peringatan tanggal cek (kosong, hari ini, lama), ubah tarif memperbarui label opsi, koma desimal, batas 100, nilai negatif/teks diabaikan, bertahan setelah muat ulang, tombol Kembalikan (kotak, label, toast, bertahan setelah muat ulang). Dibuktikan aktif lewat sabotase tombol Kembalikan. Catatan: `#tchk` dan `#tbl` ada di tab Cek tarif (`#v5`), BUKAN `#v3`.
- Pengujian (semua hijau): `npm test` (exit 0); E2E Chromium satu per satu (`CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`): load 8, shelf 20, hitung 13, sqlite 8, voucher 31, penjualan 27, cek tarif 39, dialog 19, tarif 19 (184 asersi). Belum: uji offline Service Worker, HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat, dan alur restore backup lewat UI yang lalu mengubah tarif (jaminan restore hanya dari tes unit dengan `A` diganti utuh).
- Pengukuran jujur: sisa legacy 118.423 -> 115.496 byte (-2.927; pemisahan 38,7% -> 40,3% dari skrip v5.82 193,3 KB); `20-hitung-etalase.js` 37.528 -> 34.601 byte; `js/tarif-ui.js` 5.134 byte.
- Berikutnya (6d): `pc1, skHi, stk, warns, WN, mchg` (peringatan stok/margin, ±2,2 KB, memakai `A`, `calc`, `fwd`, `rp`, `fmt`, `today`); lihat `LANJUT-DI-SINI.md`.

## Perubahan v9.29 — tahap 6b (helper murni → `js/helpers.js`)
- Langkah kedua memecah `20-hitung-etalase.js`. `js/helpers.js` (baru) mengekspor `esc`, `dtx`, `uid`, `prodSig`, tabel label `SGL`, dan `createFeeSig({getA,gfac})`. Teks `esc/dtx/uid/prodSig/SGL` dipindah APA ADANYA (tanpa penggantian). Satu-satunya perubahan teks ada di `feeSig`: dulu membaca `A` dan `gfac` sebagai global legacy; kini disuntikkan, dan `A` dibaca ulang lewat `getA()` DI DALAM `feeSig()` karena kode legacy menugaskan ulang `A` saat restore (jangan pernah menangkap `A` sekali di factory).
- **Koreksi atas usulan awal:** hanya `esc`, `dtx`, `prodSig` yang benar-benar murni. `uid` memakai `Date.now()` dan `Math.random()`; `feeSig` bergantung pada `A`, `gfac`, dan `SGL` (jadi memerlukan injeksi). `SGL` ikut dipindah karena dipakai `feeSig` dan `verStale`.
- Pemasangan: loader mendaftarkan `['./helpers.js','esc, dtx, uid, prodSig, SGL, createFeeSig']` (impor di awal modul gabungan, jadi `esc/dtx/uid/prodSig/SGL` tersedia di seluruh bagian legacy tanpa kode tambahan). Di bagian 20, `feeSig` dipasang di posisi lama: `var feeSig=createFeeSig({getA:function(){return A},gfac:gfac});`. `js/penjualan.js` (`esc`, `uid`) dan `js/voucher-panel.js` (`esc`, `dtx`, `prodSig`, `feeSig`) tetap menerimanya lewat injeksi dari bagian 30 dan 40, tanpa perubahan.
- **Jebakan hoisting:** hanya `feeSig` yang berubah dari deklarasi `function` (di-hoist) menjadi `var` (nilai baru ada setelah barisnya berjalan). Sudah dipetakan: tak ada rujukan `feeSig` di `00-core.js`, `10-calc.js`, atau bagian 20 sebelum pemasangan; pemakainya (`verStale` di bagian 20, bagian 40) hanya memanggilnya saat dipanggil atau sesudahnya. Audit statis menjaga ini. `esc/dtx/uid/prodSig/SGL` adalah impor (binding modul), tidak punya masalah urutan.
- `sw.js` cache `client-v9.29` dan `./js/helpers.js` di CORE; `package.json` 0.9.29 (`helpers.test.mjs` masuk `npm test`); `leafModuleSources` menyertakan `helpers.js` (audit kompatibilitas 271 nama fungsi asli tetap lulus).
- Test baru `helpers.test.mjs` (3.615 assertion): isi modul == enam deklarasi v9.28 yang dibekukan (`tests/fixtures/helpers.pre_v9_29.js.txt`; `feeSig` sama kecuali `var A=getA();`); diferensial `esc` (semua karakter khusus, nilai non-string, 400 string acak), `dtx` (12 bulan x 5 hari, tanggal rusak), `prodSig` (300 objek acak + tiap kolom berpengaruh), `uid` (Date.now/Math.random dikendalikan), `SGL`, dan `feeSig` (300 `A` acak dengan undefined/null/objek, `gfac` acak, `A` diganti di tengah jalan; cakupan cabang diverifikasi). Uji mutasi: 14 mutan nyata (apostrof/`&` tak dilepas, bulan `dtx` geser, hari `dtx` jadi string, kolom/urutan `prodSig`, panjang/waktu `uid`, kunci/label `SGL`, `A` basi di `feeSig`, `gf` dari `A` bukan `gfac`, undefined tak jadi null, tanpa `JSON.stringify`) semuanya tertangkap oleh bagian diferensial dengan pemeriksaan tekstual dimatikan.
- Audit struktural `legacy-split.test.mjs` (tahap 6b, 287 assertion total): tanda tangan dan ekspor `helpers.js`, tanpa global tersembunyi, tak ada bagian legacy yang mendefinisikan ulang helper, pemasangan `createFeeSig`, tak ada rujukan `feeSig` sebelum pemasangan, loader dan `sw.js`.
- Pengujian (semua hijau): `npm test` (exit 0); E2E Chromium satu per satu: load 8, shelf 20, hitung 13, sqlite 8, voucher 31, penjualan 27, cek tarif 39, dialog 19 (165 asersi). `feeSig`/`prodSig` terpakai nyata di alur simpan dan cek ulang di E2E cek tarif; **tidak ada E2E yang sengaja menguji `dtx`** (riwayat modal dan peringatan modal naik); jaminannya datang dari tes unit diferensial. Cakupan E2E atas `uid` belum diperiksa. Belum: uji offline Service Worker, HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat.
- Pengukuran jujur: `20-hitung-etalase.js` 38.337 -> 37.528 byte; sisa legacy 119,2 KB -> 118,4 KB (pemisahan ±38,3% -> ±38,7% dari skrip v5.82 193,3 KB). Langkah ini kecil dan hanya mengisolasi helper; sisa bagian 20 (kartu Hitung, Etalase) adalah sebagian besar bobotnya.
- Berikutnya: sisa `20-hitung-etalase.js` (37,5 KB), berurutan: (1) logika tarif/peringatan yang cukup terisolasi (`tblSync`, `tbuild`, `fillT`, `tchk`, `verStale`, `refreshLabels`; memakai `A`, `AD/GO`, `rows`, `calc`, `upd`); (2) `stk`, `warns`, `mchg`, `pc1`, `skHi` (peringatan stok/margin; memakai `A`, `calc`, `fwd`, `today`); (3) `upd/updRow/fill` dan kartu Hitung (`cardBody`, `card`, `hyd`, `add`, `dup`, `flt`, `srt`; menulis DOM dan `rows`, paling banyak ketergantungan); (4) `shop()`/Etalase dan `setStock/etUn/etSet/etAll` (memakai `KShelf`, `PRM`, `CFG`, `VUSE`, `sold`, `curP`). Lalu `50-promosi.js` (`calcNV` memutasi `VNO`), `60-tab-impor-sinkron.js`, sisa `80-cadangan-tema.js`, dan langkah (4) dan (5) dari v9.27.

## Perubahan v9.28 — tahap 6a (dialog konfirmasi, inertBg, toast → `js/ui.js`)
- Mulai memecah `20-hitung-etalase.js` (bagian legacy terbesar, 38 KB) dari helper UI bersama yang dipakai hampir semua bagian lain. `js/ui.js` (baru): `createUI({$,document})` berisi `inertBg`, `ask`, `dclose`, `toast` beserta pendengar `#dn`, `#dy`, `#dlg`, dipindah APA ADANYA (tanpa penggantian teks sama sekali; isi modul identik dengan blok lama). `dfn`, `dprev`, dan `toastT` kini privat di closure. Nilai kembalian: `{inertBg,ask,toast,getDprev,setDprev}`; `dclose` tidak diekspos karena hanya dipakai di dalam blok itu.
- `dprev` tetap DIBAGIKAN ke dialog di `js/voucher-panel.js` lewat `getDprev/setDprev` milik `createUI` (bukan lagi getter/setter ke variabel legacy), sehingga perilaku fokus-kembali antar dialog sama persis seperti saat semuanya berbagi satu variabel. Pemasangan di bagian 40 kini `getDprev:getDprev,setDprev:setDprev`; tanda tangan `createVoucherPanel` tidak berubah.
- Pemasangan di bagian 20 menjadi `var {inertBg,ask,toast,getDprev,setDprev}=createUI({$:$,document:document});` di posisi yang sama dengan blok lama. **Jebakan hoisting:** `ask/toast/inertBg` dulu deklarasi `function` (di-hoist ke seluruh modul gabungan); kini nilainya baru ada setelah baris itu. Sudah dipetakan: semua pemakai sebelum baris itu berada di badan fungsi/handler (runtime), bukan pemanggilan atau penerusan nilai saat muat; audit statis menjaga hal ini. Bagian 00/10 tidak memakai ketiganya.
- Loader mendaftarkan `['./ui.js','createUI']`; `sw.js` cache `client-v9.28` dan berkas baru di CORE; `package.json` 0.9.28 (`ui.test.mjs` masuk `npm test`, `dialog.e2e.py` masuk `test:e2e`); `leafModuleSources` menyertakan `ui.js`.
- Test baru `ui.test.mjs` (6.097 assertion): isi modul == blok v9.27 yang dibekukan (`tests/fixtures/ui.pre_v9_28.js.txt`); diferensial 120 skenario acak (ask dengan/tanpa callback, Batal/Ya, Escape, Tab/Shift+Tab, klik latar vs klik di dalam, toast beruntun, waktu maju dengan `clearTimeout` palsu, `dprev` dibagikan, elemen aktif null atau yang `focus()`-nya melempar, `nav` tidak ada) dengan DOM tiruan dan timer palsu identik; jejak, callback, dan `dprev` dibandingkan tiap langkah; cakupan cabang diverifikasi. Uji mutasi: 13 perubahan nyata (dprev tak dikosongkan/disimpan, timer toast, `clearTimeout`, urutan fokus Tab, `preventDefault`, inert FAB, klik latar tanpa cek target, Escape, callback sebelum tutup, `focus` tanpa try/catch, `dfn`, `getDprev` basi) semuanya tertangkap dengan pemeriksaan tekstual dimatikan. Satu mutan awal (`(i+1+2)%2` vs `(i-1+2)%2`) ternyata EKUIVALEN untuk daftar 2 elemen, bukan celah tes, dan diganti dua mutasi Tab yang nyata.
- Audit struktural `legacy-split.test.mjs` (tahap 6a, 260 assertion total): tanda tangan, nilai kembalian, tanpa global tersembunyi, bagian 20 tak lagi mendefinisikan dialog/toast, tak ada bagian lain yang memakai `dfn/dprev/toastT/dclose`, tak ada penerusan `ask/toast/inertBg` sebagai nilai sebelum pemasangan. Dibuktikan aktif lewat 5 sabotase (sw.js, pemakaian `dclose` di bagian 60, definisi ulang `toast`, penerusan `toast` sebelum pemasangan, `window` di modul): semuanya gagal.
- E2E baru `tests/e2e/dialog.e2e.py` (19 assertion, Chromium nyata, tab Hitung): hapus produk membuka dialog (pesan, label "Ya, hapus", fokus di Batal, `main/nav/header/#fab` inert), Tab/Shift+Tab mengurung fokus, Escape/klik latar/Batal menutup tanpa menghapus dan mengembalikan fokus ke tombol pemicu, klik di dalam kotak tidak menutup, "Ya, hapus" menghapus produk dan melepas inert, toast tampil lalu hilang sendiri (terukur ±1,6 dtk) dan toast beruntun mereset timer. Dijalankan terhadap kode v9.27 LAMA: hasil identik (19/19); empat perusakan modul (fokus tak dikembalikan, inert tak dilepas, toast 3 dtk, klik latar menutup walau klik di dalam) membuat E2E gagal. Batas waktu toast awalnya terlalu longgar (perusakan 3 dtk lolos), lalu dikencangkan dengan pengukuran waktu.
- Pengujian (semua hijau): `npm test` (exit 0); E2E Chromium: load 8, shelf 20, hitung 13, sqlite 8, voucher 31, penjualan 27, cek tarif 39, dialog 19 (165 asersi), satu per satu dan lewat rantai `npm run test:e2e`. Belum: uji offline Service Worker, HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat.
- Pengukuran jujur: sisa legacy 119,8 KB -> 119,2 KB (pemisahan tetap ±38% dari skrip v5.82 193,3 KB). Langkah ini hanya memindahkan ~0,6 KB; nilainya ada pada isolasi helper UI yang dipakai semua bagian dan penghapusan penghubung `dprev` ke variabel legacy.
- Berikutnya: sisa `20-hitung-etalase.js` (38 KB): helper murni lebih dulu (`esc`, `dtx`, `uid`, `feeSig`, `prodSig`), lalu `upd/updRow/fill`-nya kartu Hitung, `shop()`/Etalase, dan `setStock/etUn/etSet`; kemudian `50-promosi.js` (40 KB; `calcNV` memutasi `VNO`), `60-tab-impor-sinkron.js` (22 KB), sisa `80-cadangan-tema.js`; lalu langkah (4) dan (5) dari v9.27.

## Perubahan v9.27 — tahap 5c (panel Cek tarif / "Cek pesanan nyata")
- `js/voucher-panel.js` (baru): `createVoucherPanel({st,$,esc,num,rp,today,pr,KDOM,KStore,document,calc,volt,fees,gfac,toast,upd,fill,syncVL,prodSig,feeSig,tlOk,tlRender,dtx,inertBg,getDprev,setDprev})` berisi seluruh isi lama `40-voucher-panel.js`, dipindah APA ADANYA: panel "Cek pesanan nyata" (`#vfd`: kolom cari produk `vfCombo`, isi otomatis `vfAuto`, mode pesanan campuran, tombol Bandingkan `#vfg`, hasil `#vfr` dengan tombol "Set ... dari pesanan ini"), dialog peringatan selisih tarif (`#vgd`, `vgSync/vgOpen/vgClose`), dialog panduan (`#gd`, `gdOpen/gdClose`), dan `tlPush`. (Catatan nama: berkas ini BUKAN aturan voucher; aturan ada di `voucher-rules.js`.) Tiga jenis perubahan saja: `A.x` -> `st.A.x` (26 titik), `rows` -> `st.rows` (4 titik), dan `dprev` lewat `getDprev()/setDprev()` (4 titik); `document` dan `KStore` kini disuntikkan. Nilai kembalian hanya `{vgSync,vfKeep}`, yang dipakai `tab()` di `80-cadangan-tema.js`. Semua fungsi lain privat di closure; pendengar (`#vfd`, `#vfa`, `#vfm`, `#vfg`, `#vfr`, `#vgd`, `#gd`, dokumen) dipasang saat factory dipanggil, di posisi eksekusi yang sama.
- `js/legacy/40-voucher-panel.js` kini hanya pemasangan tipis (995 byte, sebelumnya 17,5 KB), tetap di `parts.json` dan `sw.js`. Loader (`js/legacy-app.js`) mendaftarkan `['./voucher-panel.js','createVoucherPanel']`; `sw.js` cache `client-v9.27` dan berkas baru di CORE; `package.json` 0.9.27 (`voucher-panel.test.mjs` masuk `npm test`, `voucher-panel.e2e.py` masuk `test:e2e`); `leafModuleSources` menyertakan `voucher-panel.js`.
- **Jebakan hoisting:** dulu semua fungsi bagian 40 di-hoist ke seluruh modul gabungan; kini hanya `vgSync` dan `vfKeep` yang ada, dan baru setelah baris pemasangan di bagian 40 berjalan. Audit statis memastikan tak ada bagian lain yang memakai simbol privat panel, dan E2E boot tanpa error. Dependensi yang diteruskan (`upd, fill, syncVL, tlOk, tlRender, dtx, inertBg, prodSig, feeSig, toast, esc`) adalah deklarasi `function` di bagian 20/80, jadi sudah tersedia saat bagian 40 berjalan; jangan mengubahnya menjadi `var x=function` tanpa memindahkan baris pemasangan.
- **`dprev`** (elemen pemicu dialog, dipakai bersama oleh `ask()`/`dclose()` di `20-hitung-etalase.js`) masih variabel legacy dan diakses panel lewat getter/setter. Saat bagian 20 dipecah, jadikan helper dialog bersama (bukan getter/setter lagi).
- Test baru `voucher-panel.test.mjs` (12.082 assertion): (a) bukti "dipindah apa adanya": isi modul, setelah tiga pengganti ditukar balik, SAMA PERSIS dengan sumber v9.26 yang dibekukan di `tests/fixtures/voucher-panel.pre_v9_27.js.txt`; (b) diferensial: 160 skenario acak x 14-23 operasi (ganti `rows`/`A` utuh seperti restore, buka/tutup panel, pilih produk lewat combo, jumlah, isi otomatis, mode campuran, tambah/hapus baris, Bandingkan dengan angka cocok/meleset/kena batas biaya/pengecualian, tombol "Set ... dari pesanan ini", dialog abaikan peringatan dengan alasan pendek/panjang, Tab/Escape/klik latar, dialog panduan). Kode lama dan modul baru dijalankan dengan DOM tiruan dan dependensi IDENTIK; setelah tiap operasi dibandingkan seluruh jejak (setiap penulisan properti, pendengar, panggilan metode elemen, toast/upd/fill/dst.), `A`, `rows`, dan `dprev`. Cakupan cabang diverifikasi di dalam tes (Cocok, meleset, total tidak cocok, tanggal cek diperbarui, pesanan campuran, batas biaya, pengecualian, tombol Set, abaikan peringatan, pilih dari combo); (c) kontrak: state selalu segar setelah `A`/`rows` diganti utuh, penulisan `ver.ig` dan `tlog` menembus ke `A` yang sekarang, `dprev` lewat setDprev/getDprev. DOM tiruan menirukan dua perilaku DOM nyata yang sempat membuat harness salah (nilai input selalu string; pilihan yang opsinya hilang direset) tetapi tetap BUKAN DOM nyata, jadi E2E di bawah tetap wajib. Uji mutasi: 12 perubahan sengaja pada modul (A/rows basi, dprev tidak disimpan/dikosongkan, PPh membaca tarif lain, `upd` hilang, toleransi 2% -> 3%, `ig` ke objek lain, teks toast, `vfKeep` tanpa `vfFill`, `setItem` hilang, fokus tak dikembalikan) semuanya tertangkap, juga dengan pemeriksaan tekstual dimatikan (12/12 oleh diferensial saja).
- Audit struktural `legacy-split.test.mjs` (tahap 5c, 235 assertion total): tanda tangan factory, nilai kembalian, tanpa global tersembunyi/`localStorage`, tanpa akses langsung `A/rows/dprev/SALES/PRM/TS`, bagian 40 hanya pemasangan dengan semua dependensi tepat, tak ada bagian lain yang memakai simbol privat, loader dan `sw.js`. Dibuktikan aktif lewat 5 sabotase (sw.js tanpa berkas baru, bagian 60 memanggil `vfAuto`, modul memakai `A` langsung, pemasangan tanpa `inertBg`, `dprev` basi): semuanya gagal.
- E2E baru `tests/e2e/voucher-panel.e2e.py` (39 assertion, Chromium nyata): opsi produk dari `rows` terbaru (modal 0 tak masuk), kolom cari produk, isi otomatis harga/voucher (jumlah 2 = harga 2x), Bandingkan dengan kolom kosong (selisih + dasar hitungan), tombol "Set ke 0%" untuk Premi (tarif toko berubah, tercatat di Catatan perubahan tarif, dicek ulang otomatis), isi persis perkiraan aplikasi (semua cocok, "Tarif terakhir dicek" = hari ini), selisih Rp 5.000 -> peringatan muncul setelah pindah tab (`vgSync`), dialog abaikan peringatan (alasan kosong/pendek ditolak, Escape mengembalikan fokus, tombol alasan cepat, tersimpan dan tampil di `#vigi`), dialog panduan (buka bab 2, Escape), mode pesanan campuran (tambah/hapus baris, harga 2 produk), pilihan isi otomatis tersimpan, dan muat ulang (isi otomatis, peringatan diabaikan, catatan tarif, tanggal cek bertahan). Dijalankan terhadap kode v9.26 LAMA: hasil identik (39/39); tiga perusakan modul (fokus tak dikembalikan, `ver.ig` ditulis ke objek lain, tarif Premi ditulis ke objek lain) membuat E2E gagal. Menangkap `pageerror` dan error konsol.
- Pengujian (semua hijau): `npm test` (exit 0); E2E Chromium: load 8, shelf 20, hitung 13, sqlite 8, voucher 31, penjualan 27, cek tarif 39 (146 asersi), dijalankan satu per satu DAN lewat rantai `npm run test:e2e` (exit 0). Belum: uji offline Service Worker, HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat (batasan v9.25 tetap berlaku).
- Pengukuran: sisa legacy 136,3 KB -> 119,8 KB (pemisahan terukur 29% -> 38% dari skrip v5.82 193,3 KB). `voucher-panel.js` 18,8 KB (sedikit lebih besar dari 17,5 KB aslinya karena komentar kepala dan akses `st.`).
- **Catatan temuan (TIDAK diubah, karena tahap ini murni pemindahan):** Bandingkan yang menghasilkan selisih menimpa `A.ver` seluruhnya (`A.ver={ok:false,...}`), sehingga alasan "abaikan peringatan" (`ver.ig`) dari pengecekan sebelumnya hilang dan peringatan muncul lagi. Kemungkinan disengaja (hasil cek baru menggantikan yang lama), tetapi bisa mengejutkan penjual. Ditemukan lewat E2E; layak diputuskan terpisah.
- Berikutnya: (1) `20-hitung-etalase.js` (39 KB, terbesar; mendefinisikan banyak global yang dipakai bagian lain: `ask/dclose/dprev/inertBg/toast/esc/upd/uid/prodSig/feeSig`), jadi pecah bertahap dan mulai dari helper dialog + toast; (2) `50-promosi.js` (40 KB; `calcNV` memutasi `VNO`); (3) `60-tab-impor-sinkron.js` (22 KB; menulis `rows`, ingat `tab()` memanggil `rpt()` dan `rlAll()` dari `penjualan.js`); sisa `80-cadangan-tema.js` (`applyState`, `snapState`, `pruneAge` memakai `ymd` dan menugaskan ulang `SALES`); (4) bila semua penugas ulang `A/rows/SALES/PRM/TS` sudah memakai `State`, ikatan getter/setter di `00-core.js` diganti penyimpanan milik `state.js`; (5) uji beban 3.000-5.000 produk, uji offline SW dengan Wasm, dan HP nyata.

## Perubahan v9.26 — tahap 5b (jembatan `state.js` + tab Penjualan)
- `js/state.js` (baru): `createState({A,rows,SALES,PRM,TS})` menerima pasangan `{get,set}` per kunci dan mengembalikan objek tertutup dengan properti `A, rows, SALES, PRM, TS` (getter/setter) plus `snapshot()`, `get(key)`, `set(key,v)`. Variabel legacy TETAP sumber kebenaran: kode legacy (`applyState`, impor, promosi, restore) masih menugaskan ulang `A/rows/SALES/PRM/TS` langsung, dan `State` selalu membaca nilai terbaru lewat getter. Setter memvalidasi bentuk (SALES/rows/PRM harus array, A objek, TS angka terhingga) dan melempar `TypeError` bila salah; kunci tak dikenal melempar `RangeError`. Dipasang di `00-core.js` (`var State=createState(...)`); `SALES` kini dideklarasikan di `00-core.js` (sebelumnya di `30-penjualan.js`); `PRM` tetap di `50-promosi.js` (dibaca saat dipanggil). Modul tab berikutnya cukup menerima `st:State` alih-alih daftar getter sendiri.
- `js/penjualan.js` (baru): `createPenjualan({st,$,esc,today,rp,num,toast,ask,uid,KDOM,calc,fwdL,vbest,actL,ptp,getCFG,VoucherRules,CalcCache,setStock,persist,salesRows,copySales,showCpBox,dl,csv,getSalesMax})` berisi seluruh isi lama `30-penjualan.js`, dipindah APA ADANYA. Satu-satunya perubahan: `SALES/PRM/rows` dibaca dan ditulis lewat `st`, `pst` lewat `VoucherRules.pst`, `CFG` lewat `getCFG()` (dibaca di dalam `curP`), `SALES_MAX` lewat `getSalesMax()`. State privat tab (`RM/RD/RO`, `RPL`, `RLU/RLT`, swipe `SW/swMoved`, `MN/DN`) kini di closure. Nilai kembalian = yang dipakai bagian legacy lain: `rpt` (60-tab), `sold`/`curP`/`VUSE` (20-hitung-etalase), `rlAll` (60-tab), `ymd` (80-cadangan-tema). Pendengar `#v4` (klik/ubah) dan `#rpv` (geser kartu) dipasang saat factory dipanggil, di posisi eksekusi yang sama seperti sebelumnya.
- `js/legacy/30-penjualan.js` kini hanya pemasangan tipis (`var {rpt,sold,curP,VUSE,rlAll,ymd}=createPenjualan({st:State,...})`), 850 byte (sebelumnya 14,7 KB). Berkas tetap ada di `parts.json` dan `sw.js` agar urutan eksekusi dan audit tidak berubah. Loader (`js/legacy-app.js`) mendaftarkan `['./state.js','createState']` dan `['./penjualan.js','createPenjualan']`; `sw.js` cache `client-v9.26` dan menambahkan kedua berkas ke CORE; `package.json` 0.9.26.
- Test baru `state.test.mjs` (41 assertion: baca segar setelah penugasan ulang legacy, tulis menembus ke variabel, validasi bentuk, kunci tak dikenal, objek tertutup, ikatan wajib lengkap) dan `penjualan.test.mjs` (23.707 assertion diferensial terhadap kode v9.25 yang dibekukan di `tests/fixtures/penjualan.pre_v9_26.js.txt`): 300 skenario acak x 36 langkah dengan dependensi tiruan identik, jam dan timer palsu. Tiap langkah membandingkan HTML laporan, isi SALES, stok, kuota promo, dan seluruh jejak panggilan (toast, ask, persist, `VoucherRules.reset`, `CalcCache.invalidate`, DOM tak langsung, pendengar terpasang). Operasi: catat penjualan (dengan/tanpa voucher kuota), harian/bulanan, navigasi periode, gembok per entri dan massal, hapus satu/massal (konfirmasi disetujui dan ditolak), ubah harga/tanggal, ekspor/salin CSV, `rlAll`, waktu maju (gembok kedaluwarsa), SALES diganti utuh (seperti restore), `ymd`, `curP`, geser kartu. Uji mutasi: 10 perubahan sengaja pada modul (8 putaran pertama + 2 tambahan) semuanya akhirnya tertangkap; SATU sempat LOLOS pada putaran pertama (pemilihan harga promo terendah di `curP`, karena data uji tak pernah punya dua promo aktif pada produk yang sama), sehingga generator diperkuat dengan promo kedua pada produk yang sama dan mutasi itu kini tertangkap. Audit struktural di `legacy-split.test.mjs` (tahap 5b): tanda tangan factory, tanpa global tersembunyi, tanpa akses langsung `SALES/PRM/SALES_MAX` di modul, `00-core.js` memasang `State` dengan kelima getter/setter, `30-penjualan.js` hanya pemasangan; dibuktikan aktif lewat sabotase (akses `SALES` langsung dan `sw.js` tanpa berkas baru, keduanya gagal). Helper `leafModuleSources` dan prelude harness golden-master ditambah `state.js` agar audit nama fungsi lama tetap valid.
- E2E baru `tests/e2e/penjualan.e2e.py` (27 assertion, Chromium nyata): laporan awal dan navigasi periode, jual dari Etalase (stok 5 -> 4), harian/bulanan, hapus bergembok (terkunci -> buka -> konfirmasi) dengan stok kembali 4 -> 5, ubah harga (Rp 99.999) dan tanggal, unduh CSV (judul kolom + isi) dan salin CSV, muat ulang (SALES bertahan lewat `applyState`), hapus massal (konfirmasi menyebut jumlah, bertahan setelah muat ulang), lalu jual lagi (SALES baru terbaca). Dijalankan terhadap kode v9.25 LAMA: hasil identik (27/27); modul sengaja dirusak (stok tidak kembali saat hapus) membuat E2E gagal. Menangkap `pageerror` dan error konsol.
- Pengujian (semua hijau): `npm test` (exit 0); E2E Chromium berjalan satu per satu: load 8, shelf 20, hitung 13, sqlite 8, voucher 31, penjualan 27. Belum: uji offline Service Worker, HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat (batasan v9.25 tetap berlaku). `penjualan.e2e.py` sudah ditambahkan ke rantai `npm run test:e2e` di package.json, tetapi rantai itu belum dijalankan utuh lewat `npm` (catatan v9.25: gagal di `sh`); jalankan berkas Python satu per satu seperti di atas.
- Pengukuran: sisa legacy 149,5 KB -> 136,3 KB (pemisahan terukur 23% -> 29% dari skrip v5.82 193,3 KB). `penjualan.js` 15,6 KB + `state.js` 2,5 KB. Nilai tambah utama bukan ukuran, melainkan jembatan state yang dipakai bersama dan satu tab utuh yang kini teruji terisolasi.
- Berikutnya: (1) `40-voucher-panel.js` (17 KB; panel "Cek pesanan nyata" + dialog panduan/peringatan tarif; banyak global DOM: `tlPush`, `inertBg`, `dprev`, `fill`, `upd`, `prodSig`, `feeSig`, `syncVL`, mendefinisikan `vfAuto`) memakai `st:State` yang sudah ada; (2) lalu `20-hitung-etalase.js` (39 KB), `50-promosi.js` (41 KB; `calcNV` memutasi `VNO`), `60-tab-impor-sinkron.js` (22 KB; menulis `rows`, ingat `tab()` memanggil `rpt()` dan `rlAll()` dari `penjualan.js`), dan sisa `80-cadangan-tema.js` (`applyState`, `snapState`, `pruneAge` memakai `ymd` dan menugaskan ulang `SALES`); (3) bila semua penugas ulang `A/rows/SALES/PRM/TS` sudah memakai `State`, ikatan getter/setter di `00-core.js` diganti penyimpanan milik `state.js`; (4) uji beban 3.000-5.000 produk, uji offline SW dengan Wasm, dan HP nyata.

## Perubahan v9.25 — tahap 5a (aturan voucher) + bukti SQLite nyata
- `js/voucher-rules.js` (baru): `createVoucherRules({getPRM,today,pr,fmt,rp})` berisi `vdisc`, `cbc`, `dd`, `pst`, `vcList`, `vcApply`, `vcLab`, `vcBest`, `vcBad`, `vcThr` + `reset()`. Dipindah APA ADANYA dari `50-promosi.js` (hanya `PRM.forEach` -> `getPRM()` segar). Cache voucher berjalan (`VCC`) kini privat di closure; 6 tempat yang menulis `VCC=null` (30-penjualan x2, 50-promosi x2, 80-cadangan-tema x2) memakai `VoucherRules.reset()`. Dipasang di `10-calc.js` (sebelum `createPricing`; `hooks.vcBest/vcThr/vcBad` tetap dibaca saat dipanggil). Ini tempat yang diubah bila aturan voucher Shopee berubah. `calcNV`, `vsc`, `vcWhy`, `vcEff`, `fwdV`, dan semua kode tampilan promosi TETAP di legacy.
- Test baru `voucher-rules.test.mjs`: 206.360 assertion differential terhadap kode v9.24 yang dibekukan (`tests/fixtures/voucher-rules.pre_v9_25.js.txt`): 400 skenario acak (voucher toko/produk/Live/Video/cashback, persen/nominal, batas cp, minimum belanja, kuota, jadwal), cache per tanggal, perubahan tanpa reset, `reset()`, dan PRM diganti utuh. Uji mutasi: 5 perubahan sengaja pada modul semuanya tertangkap. Harness golden-master (terhadap v5.82) menyediakan `voucher-rules.js` dan memakai helper `__rvc()` (reset netral terhadap `VCC` lama maupun `VoucherRules`); `pst` untuk sumber migrasi datang dari modul. Audit struktural ditambahkan di `legacy-split.test.mjs` (juga dibuktikan aktif lewat sabotase `sw.js`).
- E2E baru `tests/e2e/voucher.e2e.py` (31 assertion, Chromium nyata): voucher toko 10% menaikkan harga listing p0 dari Rp 34.500 ke Rp 38.400 dan menampilkan "Voucher dihitung"; voucher produk hanya berlaku di produknya; voucher kuota habis, berakhir, belum mulai, minimum belanja tak terpenuhi, cashback, dan Live TIDAK dipakai. Dijalankan terhadap kode v9.24 LAMA dan hasilnya identik (paritas di browser nyata); merusak modul baru membuatnya gagal.
- **Temuan SQLite (bukti browser nyata pertama):** `vendor/sqlite-wasm/` (3.46.1, checksum lulus `npm run vendor:check`) kini ada, dan di Chromium nyata `KStore.backend === 'sqlite'`; data yang ditulis bertahan setelah muat ulang (OPFS SAH Pool). `sqlite-fallback.e2e.py` GAGAL di baseline paket ini karena balapan di TES, bukan bug aplikasi: tes mengklik tab ERP segera setelah elemen nav ada, sebelum boot legacy selesai (dengan SQLite boot lebih lama sehingga `ERP.show()` belum terpasang). Diperbaiki dengan menunggu `#list > *`; setelah itu ERP terisi 0,4 dtk. Tes juga kini memverifikasi backend sqlite + persistensi lewat reload (8 assertion dengan Wasm, 9 tanpa Wasm).
- `progress.html` diperbarui (sebelumnya masih v9.10/76%): kini menampilkan "pemisahan kode 23%" yang TERUKUR (skrip v5.82 193 KB, sisa legacy 149,5 KB) dan memisahkannya dari kesiapan rilis; metrik dan gerbang disesuaikan dengan hasil uji nyata. `sw.js` cache `client-v9.25`, `package.json` 0.9.25.
- Pengujian (semua hijau): `npm test` (exit 0); E2E Chromium: load 8, shelf 20, hitung 13, sqlite 8, voucher 31. Belum: uji offline Service Worker, HP nyata, migrasi data v5.82 riil, backup/restore lintas perangkat. Masih ada satu dependensi CDN: `@preact/signals-core` (ada cadangan reaktif lokal; peringatan di konsol bila CDN tak terjangkau).
- Catatan ukuran jujur: langkah ini hanya memindahkan ~1,4 KB (legacy 150,9 -> 149,5 KB) karena sisa kode adalah tampilan tab, bukan aturan. Nilainya ada pada isolasi aturan yang paling sering berubah di Shopee dan pada bukti uji (diferensial + E2E + mutasi).
- Berikutnya: (1) `js/state.js` (jembatan getter/setter `A`, `rows`, `SALES`, `PRM`, `TS`) lalu tab kecil `30-penjualan.js`; (2) `40-voucher-panel.js` sebenarnya panel "Cek pesanan nyata" + dialog panduan/peringatan tarif (bukan aturan voucher), banyak DOM dan global (`tlPush`, `inertBg`, `dprev`, `fill`, `upd`, `prodSig`, `feeSig`, `syncVL`), jadi butuh `state.js` dulu; (3) `calcNV`/`vsc`/`vcWhy`/`vcEff`/`fwdV` di 50-promosi bisa menyusul ke `voucher-rules.js` setelah `VNO` dibungkus getter/setter; (4) uji beban 3.000-5.000 produk di Chromium dan di HP penjual; (5) uji offline SW dengan Wasm.

## Perubahan v9.24 — tahap 4d (cache kalkulator + pra-hitung Worker)
- `js/calc-cache.js` (baru): `createCalcCache({getA,getPRM,getRows,getVNO,getWorker,calcSync,onReady})` berisi `CC`, `GK`, `GKV`, `GKS`, `PW`, `PWQ`, `PWN`, `PWFAIL`, `gver`, `rkey`, `staleRows`, `prewarm`, `pwKick`, `calc` (state cache sekarang PRIVAT di closure). Ditambah dua metode baru: `invalidate()` (pengganti penulisan langsung `GK=null` di 7 tempat: 30-penjualan x2, 50-promosi x3, 80-cadangan-tema x2) dan `prewarmStale(only)` (blok pra-hitung yang dulu menempel di `upd()`; `upd` sekarang `CalcCache.invalidate();var light=CalcCache.prewarmStale(only);`). `getWorker` dibaca saat dipanggil; `onReady` memanggil `upd(false)` setelah batch selesai.
- `10-calc.js` kini hanya: pemasangan tarif, pemasangan pipa harga, `VNO`, pemasangan cache + `var calc=CalcCache.calc`, penanda `/*END*/` (~1,7 KB dari 8,4 KB semula).
- Loader `js/legacy-app.js` diubah menjadi berbasis daftar `modules=[[berkas, nama impor],...]` (batas "loader < 30 baris" di test terlewati oleh gaya lama). Untuk modul baru cukup tambah SATU baris di daftar itu, tambah ke `sw.js` CORE dan `leafModuleSources`.
- Test baru `calc-cache.test.mjs`: jejak 38 langkah identik antara kode v9.23 (dibekukan di `tests/fixtures/calc-cache.pre_v9_24.js.txt`, termasuk blok pra-hitung lama `upd`) dan modul baru: cache hit, batch Worker, `onReady`, dedup batch yang sedang jalan, `VNO=1` melewati cache, baris < BATCH_MIN, penggantian `A`/`PRM`/`rows`, batch ditolak (reject), hasil bukan array. Harness golden-master menyediakan `calc-cache.js`. `compatibility.test.mjs` menerima `getA()/getPRM()` pada pemanggilan batch.
- Pengujian (semua hijau): `npm test`; `npm run test:e2e` = shelf 20, hitung 13 (1.000 produk lewat batch Worker di Chromium, jalur nyata cache+prewarm+onReady), sqlite-fallback 9; `load.e2e` 8.
- Berikutnya (tahap 5, tab): urutan dari yang paling kecil dan paling sedikit ketergantungan: 30-penjualan.js (14 KB; memakai `fwdL/vbest/calc`, `SALES`, `rlSet`, `CalcCache.invalidate`), 40-voucher-panel.js (17 KB; mendefinisikan `vfAuto`, memakai `volt/fees/calc`), lalu 20-hitung-etalase.js (39 KB), 50-promosi.js (41 KB; mendefinisikan `vcBest/vcThr/vcBad`, `calcNV` yang memutasi `VNO`), 60-tab-impor-sinkron.js (22 KB) dan sisa 80-cadangan-tema.js. Tab-tab ini menulis banyak state global (`rows`, `SALES`, `PRM`, `A`), jadi perlu satu "state store" dengan getter/setter bersama lebih dulu (usulan: `js/state.js`) sebelum dipindah, supaya tiap modul tab tidak membawa daftar getter sendiri.

## Perubahan v9.23 — E2E hitung diperbaiki (baseline E2E hijau)
- `tests/e2e/hitung.e2e.py` gagal sejak v9.16 pada "kartu terakhir terbangun dengan data benar saat di-scroll". **Penyebab: bug di tes, bukan di aplikasi.** CSS memakai `html{scroll-behavior:smooth}` (css/app.css baris 184), sehingga `scrollIntoView()` biasa menganimasikan ~900.000 px dan membangunkan 700+ kartu sepanjang jalan; loop 40 iterasi tidak cukup mencapai kartu terakhir, dan assertion berikutnya ("hidrasi tetap terbatas", <600 kartu) juga akan gagal. Perbaikan: `scrollIntoView({behavior:'instant'})` di tes. Aplikasi tidak diubah (hidrasi lazy via IntersectionObserver, rootMargin 900px, berfungsi benar).
- Baseline E2E sekarang HIJAU di Chromium: `npm run test:e2e` = shelf 20, hitung 13, sqlite-fallback 9, load 8. `npm test` lulus. `sw.js` cache `client-v9.23`, `package.json` 0.9.23 (tidak ada perubahan kode aplikasi dari v9.22).
- Aturan kerja mulai sekarang: setiap tahap pemisahan WAJIB menjalankan `npm test` DAN `npm run test:e2e` (target 20/13/9/8). Hasil merah = berhenti, jangan lanjut.

## Perubahan v9.22 — tahap 4c (pipa harga sinkron)
- `js/pricing.js` (baru): `vbest`, `volt`, `fees`, `tmod`, `fwdL`, `fwd`, `impas`, `calcSync` dipindah apa adanya dari `10-calc.js` ke factory `createPricing({getA,getVNO,pr,Money,tariff,hooks})`. `A` lewat `getA()`; flag `VNO` tetap di legacy (dimutasi `calcNV` di 50-promosi.js) dan dibaca lewat `getVNO()`; `KalsaraMoney` disuntikkan sebagai `Money`; `adRate/goRate/capG/rate` datang dari `tariff.js`; `vcBest/vcThr/vcBad` (50-promosi.js) lewat `hooks` yang dibaca saat dipanggil (mempertahankan semantik `typeof ... === 'function'`).
- Yang SENGAJA tetap di legacy `10-calc.js`: `VNO`, cache hasil (`CC`, `GK`, `gver`, `rkey`, `staleRows`, `prewarm`, `pwKick`) dan `calc()`, karena bergantung pada `rows`, `PRM`, `upd()`, dan `KalsaraWorker`.
- Test baru `pricing.test.mjs`: 20.931 assertion differential terhadap kode v9.21 sebelum dipindah (fixture `tests/fixtures/pricing.pre_v9_22.js.txt`) pada 3 skenario voucher x VNO 0/1 x 8 pengaturan x 36 produk, termasuk fwdL/fees/fwd/impas dan penggantian `A` utuh. Harness golden-master menyediakan `pricing.js`. `compatibility.test.mjs` menerima `Money.grossUpDiscount` (nama dependensi baru).
- Pengujian: `npm test` lulus (golden-master 4.127 assertion utuh). Chromium: `load.e2e` 8, `shelf.e2e` 20, `sqlite-fallback.e2e` 9 lulus. `hitung.e2e` gagal (bug tes, diperbaiki di v9.23).
- Berikutnya (4d): cache + `calc()` + `prewarm` (10-calc.js) memakai `rows`, `PRM`, `A`, `upd`, `KalsaraWorker`; butuh bridge getter/setter. Lalu 30-penjualan.js (14 KB, paling kecil di antara tab), 40-voucher-panel.js, 20-hitung-etalase.js, 50-promosi.js, 60-tab-impor-sinkron.js, dan sisa 80-cadangan-tema.js.

## Perubahan v9.21 — tahap 4b (tarif)
- `js/tariff.js` (baru): tabel `GO`, `GO2`, `GO2D`, `AD` (objek yang sama, tetap bisa dimutasi di tempat oleh `tblSync`) dan factory `createTariff({getA})` berisi `gcOf`, `goT`, `capG`, `gfac`, `goRate`, `adRate`, `rate`. Teks fungsi dipindah apa adanya; `A` dibaca lewat `getA()` karena `A` diganti utuh saat restore/reset. Legacy memasang lewat satu baris di `10-calc.js`; loader mengimpor modul; `sw.js` cache `client-v9.21`; `package.json` 0.9.21.
- Test baru `tariff.test.mjs`: 2.929 assertion differential terhadap kode v9.20 sebelum dipindah (fixture `tests/fixtures/tariff.pre_v9_21.js.txt`) pada 4 tanggal (sebelum/sesudah 2026-12-01), 10 variasi pengaturan, 12 variasi produk, ditambah uji tabel bersama dan `A` yang diganti utuh. Harness golden-master menyediakan `format.js` dan `tariff.js`. Catatan: baris audit tahap 4a/4b di akhir `legacy-split.test.mjs` berjalan setelah baris ringkasan, jadi tidak ikut terhitung di angka "55 assertion" (tetap dieksekusi; kegagalan akan menghentikan `npm test`).
- Pengujian: `npm test` lulus; `load.e2e` 8, `shelf.e2e` 20, `sqlite-fallback.e2e` 9 lulus.
- **[SUDAH DIPERBAIKI di v9.23: bug di tes] `hitung.e2e.py` GAGAL** pada assertion "kartu terakhir terbangun dengan data benar saat di-scroll" (`tests/e2e/hitung.e2e.py` baris ~42). Sudah gagal di v9.16 dan zip main_2, jadi bukan akibat tahap 3/4. Langkah-langkah sebelumnya (satu ketikan <250 ms, ringkasan untung) lulus. Dugaan: kartu lazy (`.lz`) belum terbangun penuh saat scroll di Chromium headless, atau pemicu scroll di tes tidak cukup. Cek: cetak `last` dan jumlah kartu `.lz` setelah scroll, coba tunggu lebih lama atau gulir bertahap per layar.
- Berikutnya (4c): `fees`, `tmod`, `fwdL`, `fwd`, `impas`, `calcSync` di `10-calc.js`. Ketergantungan: `vbest` memanggil `vcBest`/`vcThr`/`vcBad` (40-voucher-panel.js) lewat global dan membaca `A.vm`, `A.vv`, `A.vc`, `A.og`; `VNO` adalah flag global yang dimutasi dari luar. Perlu injeksi `{getA, voucher:{best,thr,bad}, getVNO}` lalu pindahkan.

## Perubahan v9.20 — tahap 4a (modul inti pertama)
- `js/format.js` (baru): `rp`, `pf`, `num`, `fmt`, `PCT`, `today` dipindah apa adanya dari `js/legacy/00-core.js` menjadi ES module murni (tanpa DOM/global/state, tanpa `parseFloat`). Loader mengimpornya; `00-core.js` kini hanya berisi `DEF`, `A`, `rows`, `TS`, `OK`, `$`, `pr`. `pr` sengaja tetap di legacy karena memakai `globalThis.KalsaraMoney`.
- Test baru `format.test.mjs`: 148 assertion differential terhadap kode v9.19 sebelum dipindah (dibekukan di `tests/fixtures/core.pre_v9_20.js.txt`). Harness vm golden-master menyediakan `format.js` untuk sumber yang dimigrasi. `legacy-split.test.mjs` diperluas (ekspor, tanpa global/parseFloat, sw CORE, loader, `00-core.js` tidak mendefinisikan ulang).
- Pengujian: `npm test` lulus (golden-master 4.127 assertion tetap utuh). Chromium: `load.e2e` 8 lulus, `shelf.e2e` 20 lulus, `sqlite-fallback.e2e` 9 lulus. **`hitung.e2e` GAGAL pada "kartu terakhir terbangun dengan data benar saat di-scroll"; kegagalan yang sama terjadi di v9.16 dan zip main_2, jadi sudah ada sebelum tahap 4a** (perlu diselidiki terpisah; kemungkinan pembangunan kartu lazy saat scroll di headless). Uji offline SW dan Android belum dijalankan.
- Berikutnya (4b): tabel tarif dan fungsi tarif murni di `10-calc.js` (`GO`, `GO2`, `AD`, `adRate`, `goRate`, `rate`) dengan state `A` disuntikkan eksplisit; lalu `fees`/`fwd`/`impas`/`calcSync`. Hati-hati: `vbest` memanggil `vcBest`/`vcThr`/`vcBad` (40-voucher-panel.js) lewat global.

## Perubahan v9.19
- Perbaikan: sisa kode tema/mode di `js/legacy/80-cadangan-tema.js` (baris `thm(TH...)`, `setMode`, handler `mseg`) dihapus karena sudah ditangani `js/theme.js`; sebelumnya memicu `ReferenceError: TH is not defined` saat muat dan daftar produk kosong. Dicek di Chromium. Ditambah `tests/e2e/load.e2e.py` (boot tanpa error, tema, mode, persistensi mode; didaftarkan di `test:e2e`); diuji gagal di v9.18 dan lulus di v9.19. `npm test` lulus. E2E lama (shelf/hitung/sqlite) belum dijalankan.

## Perubahan v9.18 — tahap 3 selesai pada batas modul pendukung
- `js/backup.js` (baru): factory ES `createBackup({...})` memindahkan orkestrasi pembuatan backup penuh/ringan dan pemulihan teks. Semua akses state aplikasi melalui callback eksplisit; `getSales()` membaca penjualan terbaru saat konfirmasi restore backup ringan, bukan snapshot lama.
- `js/legacy/80-cadangan-tema.js` sekarang memasang factory `createBackup`; fungsi global `bkFull` dan `restoreText` dipertahankan sebagai wrapper kompatibilitas. `snapState`, `applyState`, `persist`, kuota, sinkronisasi, dan onboarding tetap di legacy karena masih mengelola state inti yang saling terkait. Ini disengaja agar tidak mengubah urutan mutasi state.
- Validasi envelope backup dilakukan sebelum dialog konfirmasi. Jika data ERP tidak valid, pemulihan dihentikan sebelum state produk/promo diubah. Backup ringan mempertahankan penjualan yang ada saat tombol konfirmasi ditekan. Kegagalan restore ERP tidak menjalankan `applyState`.
- Loader mengimpor `createBackup`; `sw.js` memasukkan `backup.js` ke CORE dan cache naik ke `client-v9.18`; `package.json` menjadi `0.9.18`.
- Test baru `backup.test.mjs`: 14 assertion untuk backup lengkap/ringan, konfirmasi restore, mempertahankan sales terbaru, validasi ERP, dan penolakan teks rusak. Audit pemisahan modul diperluas.
- Pengujian: `npm test` lulus seluruh suite termasuk golden-master 4.127 differential assertions dan suite baru backup. `npm run test:e2e` belum lulus: Chromium default tidak terpasang; dengan `/usr/bin/chromium`, navigasi localhost diblokir `ERR_BLOCKED_BY_ADMINISTRATOR`. Karena itu browser E2E, offline Service Worker pada browser, dan Android belum terverifikasi.
- **Status tahap 3:** modul ERP, XLSX Reader, PWA, tema, parser backup, dan orkestrasi backup/restore sudah terpisah. State inti, persistensi, sinkronisasi, serta `applyState` tetap legacy dan menjadi bagian pekerjaan pemisahan modul inti/adapter pada tahap berikutnya. Paket tetap pengembangan, bukan rilis produksi.

## Perubahan v9.17
- `js/theme.js` (baru): preferensi tema `auto/light/dark` dan mode `fast/full` dipindahkan ke factory `createTheme({ $, KStore, KDOM, toast, document })`. Penyimpanan key `kalsara_theme` dan `kalsara_mode`, markup ikon, aria-label, serta notifikasi dipertahankan.
- `js/backup-format.js` (baru): parser teks cadangan dipisah sebagai fungsi murni `parseBackupText(text)`. Tetap toleran BOM dan teks pembungkus, memvalidasi envelope Kalsara, dan membedakan JSON rusak/terpotong. Parser tidak menyentuh storage, ERP, atau state aplikasi.
- `js/legacy/80-cadangan-tema.js` kini menggunakan parser cadangan dan factory tema. Orkestrasi backup/restore dan manajemen state tetap legacy dengan sengaja; belum aman dipindahkan sebelum bridge state dua arah selesai.
- `js/legacy-app.js` menyisipkan import absolut `createTheme` dan `parseBackupText` ke Blob module. `sw.js` memasukkan `theme.js` dan `backup-format.js` ke CORE serta cache menjadi `client-v9.17`. `package.json` menjadi `0.9.17`.
- Test baru: `backup-format.test.mjs` (6 assertion) dan `theme.test.mjs` (7 runtime assertion). Audit pemisahan diperluas; `compatibility.test.mjs` kini juga memeriksa fungsi tema yang dipindah.
- Pengujian: `npm test` lulus seluruh suite termasuk golden-master kalkulator 2.010, voucher 112, promo 205, harga promo 200, Kombo/Hadiah 100, dan pipa sen 1.500 differential assertions. `npm run test:e2e` belum dapat dieksekusi sampai selesai: Chromium ditemukan, tetapi browser menerima `ERR_BLOCKED_BY_ADMINISTRATOR` saat membuka localhost. Uji offline SW dan Android belum dijalankan.

## Perubahan v9.16 (tahap 3 parsial)
- `js/xlsx-reader.js` memindahkan parser XLSX/CSV dan impor harga/stok ke factory ES `createXlsxReader({...})` dengan dependensi eksplisit dan bridge `getRows`/`replaceRows`.
- `js/pwa.js` memindahkan runtime PWA ke factory ES `createPWA({$, toast, lflush, APPV})`.
- `js/legacy/70-xlsx-reader.js` dan `js/legacy/99-pwa.js` hanya memasang factory.
- `js/legacy-app.js` mengimpor kedua modul dan cache Service Worker menjadi `client-v9.16`.

## Perubahan v9.15 (tahap 2 dari 4: modul ERP jadi modul ES)
- `js/erp.js` (baru): modul ES yang mengekspor `createERP({$, today, toast, getRows})`. Isinya = isi lama `js/legacy/90-erp.js` tanpa perubahan logika. Dependensi kini eksplisit: `KStore` (storage.js), `compute` (worker-client.js), `Money` (money.js), `KDOM` (dom.js) diimpor; `$`, `today`, `toast`, dan `getRows` (membaca `rows` legacy segar setiap dipanggil, karena `rows` bisa diganti `applyState`) diberikan pemanggil. Pembacaan `window.rows||rows` dan `globalThis.Kalsara*` dihapus dari ERP.
- `js/legacy/90-erp.js` kini 2 baris: `var ERP=createERP({...})`. Pemakai `ERP` (`80-cadangan-tema`, `95-boot`) tidak berubah.
- `js/legacy-app.js` menyisipkan `import {createERP} from "<URL absolut erp.js>"` di awal gabungan Blob (import relatif tidak bisa dipakai di dalam Blob).
- `sw.js`: `./js/erp.js` masuk CORE; cache `client-v9.15`. `package.json` 0.9.15.
- Test: `readLegacySource()` kini = bagian legacy + `js/erp.js` (audit statis tetap berlaku); `legacy-split.test.mjs` diperluas (55 assertion: ekspor, impor eksplisit, tanpa global tersembunyi, loader, cache).
- Diuji: semua test unit; 3 e2e Chromium 20/13/9 (sama dengan baseline); ERP di Chromium (HPP dari modal produk x qty, OpEx tersimpan dan bertahan setelah muat ulang); offline dengan service worker (erp.js di cache, tab ERP terbuka tanpa error). Belum diuji di Chrome Android.
- Catatan temuan (TIDAK diubah, karena tahap ini murni pemindahan): di `restore()` cabang `if(!d)` (penyimpanan cadangan) memeriksa `fbSave(s)` yang mengembalikan Promise sehingga `bad` tidak pernah true; `open()` selalu `null` sehingga cabang IndexedDB di `restore()` tidak pernah jalan; `MODE` selalu kosong. Layak dibereskan di tahap tersendiri setelah pemecahan selesai.


## Perubahan v9.14 (tahap 1 dari 4: pemecahan legacy-app.js)
- `js/legacy-app.js` (1.299 baris) dipecah menjadi 12 bagian berurutan di `js/legacy/` (daftar dan urutan eksekusi: `js/legacy/parts.json`). `js/legacy-app.js` kini loader kecil yang menggabungkan bagian-bagian itu dan menjalankannya sebagai SATU modul, jadi lingkup variabel (`A`, `rows`, `$`, ...) dan urutan eksekusi sama persis. Hasil gabungan terbukti identik byte per byte dengan v9.13.
- Bagian: 00-core, 10-calc (penanda /*CALC*/../*END*/ dipertahankan untuk golden-master), 20-hitung-etalase, 30-penjualan, 40-voucher-panel, 50-promosi, 60-tab-impor-sinkron, 70-xlsx-reader, 80-cadangan-tema, 90-erp, 95-boot, 99-pwa.
- Test membaca sumber lewat `tests/helpers/legacy-source.mjs`; ditambah `tests/legacy-split.test.mjs`. Cache service worker memuat parts.json dan semua bagian (client-v9.14).
- Tidak ada perubahan logika, hitungan, penyimpanan, atau skema data. Diuji: semua test unit, 3 e2e Chromium (20/13/9 assertion, sama dengan baseline), dan boot offline dengan service worker.
- Rencana: tahap 2 = ERP jadi modul ES sungguhan (js/erp.js) dengan dependensi eksplisit; tahap 3 = bagian leaf (xlsx-reader, cadangan, PWA); tahap 4 = bagian inti (calc, hitung, promosi) dan penghapusan loader.


## Perubahan v9.13
- Cetak / PDF laporan ERP diperbaiki: cetak kini memakai salinan laporan (#erpp) di luar tata letak aplikasi, bukan posisi absolut + visibility:hidden yang memotong halaman. Diuji di Chromium: PDF lama kosong, PDF baru memuat seluruh baris sampai akhir (3 halaman pada data uji 60 baris). Belum diuji di Chrome Android/iOS Safari nyata.
- Tidak ada perubahan pada hitungan, penyimpanan, atau skema data.
- Cache service worker dinaikkan ke client-v9.13 agar HP mengambil pembaruan.

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

## Pembaruan v9.9 — Tahap 4a: batas 1.000 produk dengan hidrasi malas

- **Batas produk 100 → 1.000** (`ROW_MAX`) di semua jalur: tambah, FAB, duplikat, impor, dan muat data.
- **Hidrasi malas tab Hitung:** `card()` hanya membuat cangkang ringan (tinggi mengikuti kartu asli: 895px terbuka, 347px ciut); isi formulir (`cardBody`) dibangun oleh `hyd(r)` saat kartu mendekati layar (IntersectionObserver, margin 900px). Produk ≤ 40 langsung dibangun seperti sebelumnya. Cari, urut, buka dari Etalase, duplikat, dan Ciutkan semua tetap berfungsi pada kartu yang belum terbangun.
- **`upd(save, only)` + `updRow(r)`:** perhitungan per produk dipisah dari penggambaran. Edit di kartu hanya menghitung ulang produk itu; agregat dijumlahkan dari cache `r._ag`. Terukur di Chromium dengan 1.000 produk: **satu ketikan 1.114 ms → ±50 ms**; hanya 40 dari 1.000 kartu terbangun saat boot; hasil agregat jalur cepat identik dengan hitung penuh.
- Tes: `tests/e2e/hitung.e2e.py` (`npm run test:e2e`) dan tambahan di `tests/architecture.test.mjs`.

**Masih terbuka**
- Boot dengan 1.000 produk ±3,7 detik di Chromium headless (satu hitung penuh `updRow` ±1,1 detik masih di utas utama). `calculate-batch` di Worker siap tetapi belum dipasang ke tampilan.
- Perubahan pengaturan global (tarif, voucher, promo) masih menghitung ulang semua produk di utas utama (±1 detik pada 1.000 produk).
- Belum diuji di HP sungguhan; angka di atas dari Chromium desktop headless.
- Tahap 3 (SQLite sebagai sumber data) dan pemecahan `legacy-app.js` per modul belum dikerjakan.

## Pembaruan v9.10 — Tahap 4b: hitungan batch di Worker untuk boot dan perubahan setelan

- **Cache kalkulator baru** (`rkey`/`gver`/`CC`): berkunci isi (versi global = tanggal + setelan + promo, dihitung sekali per tugas; ditambah field `id,m,d,p,t,q,o` produk). Menggantikan cache lama yang (1) men-stringify seluruh setelan/promo pada setiap panggilan, (2) mengirim seluruh daftar produk ke Worker untuk tiap produk (O(n²)), dan (3) dibatasi 600 entri sehingga pada >600 produk cache berputar dan memicu `upd` berulang.
- **`prewarm()`:** produk yang usang dihitung SEKALIGUS lewat `calculate-batch` (satu kiriman, mode `slim`). Selama Worker bekerja, `upd()` berjalan ringan (hanya kartu terbangun); begitu hasil tiba, `upd` penuh berjalan dari cache. Balasan usang (setelan berubah saat menunggu) dibuang; ada pengaman anti-loop dan jalur cadangan sinkron bila Worker gagal.
- **Terukur (Chromium desktop headless, 1.000 produk):** DOM siap 3,7 dtk → 0,63 dtk; ringkasan lengkap 1,39 dtk; satu ketikan di kartu 1.114 → 12 ms; ubah setelan global memblokir utas utama ±75 ms (sebelumnya ±1,1 dtk). Hasil identik dengan hitung penuh saat boot, termasuk ketikan beruntun cepat.
- Satu produk yang diedit tetap dihitung sinkron (±0,2 ms) karena tidak tergolong berat.
- Tes: `tests/e2e/hitung.e2e.py` (13 pengecekan) dan penyesuaian `tests/compatibility.test.mjs`.

**Masih terbuka:** Tahap 3 (SQLite sebagai sumber data utama + Wasm lokal), pemecahan `legacy-app.js` per modul, dan uji di HP sungguhan (angka di atas dari desktop).


## Pembaruan v9.11 — Tahap 3: SQLite sebagai sumber data utama (kode siap, Wasm belum disertakan)

**Temuan yang mengubah rancangan.** Jalur SQLite lama (`oo1.OpfsDb` dipanggil dari main thread, Wasm dari CDN) tidak pernah dapat berfungsi sebagai persistensi nyata: VFS "opfs" hanya tersedia di Worker dan membutuhkan header COOP/COEP yang tidak disediakan GitHub Pages. Karena itu `db` selalu `null` dan aplikasi diam-diam hanya memakai jurnal OPFS. (Kesimpulan dari dokumentasi SQLite Wasm dan pembacaan kode; belum diverifikasi di browser dengan Wasm nyata.)

### Perubahan
- **SQLite berjalan di Worker** (`workers/sqlite-store.worker.js`) dengan VFS **OPFS SAH Pool**, yang tidak butuh SharedArrayBuffer/COOP/COEP sehingga cocok untuk GitHub Pages. Wasm dimuat dari `vendor/sqlite-wasm/` (tanpa CDN). Dependensi CDN dihapus dari `storage.js`.
- **Satu sumber data.** Tiap perubahan = satu transaksi SQLite (key-value + tabel domain ERP sekaligus). Tabel ERP (`erp_marketplaces_raw`, `erp_order_items`, `erp_opex`, `erp_settings`) kini menjadi penyimpanan aktif untuk 4 koleksi itu; `erpPut/erpDelete/erpClear` menulis baris, bukan seluruh koleksi. `products` dan `inventory_logs` tetap key-value JSON.
- **Impor sekali jalan dari jurnal OPFS** pada boot pertama dengan SQLite (atomik dalam satu transaksi, bersama penanda `journal_imported_at`). Berkas jurnal tidak diubah dan tetap menjadi sumber pemulihan.
- **Penjaga keamanan data:** setelah beralih, `kalsara-backend.json` mencegah aplikasi jatuh diam-diam ke jurnal yang sudah usang; bila SQLite tidak dapat dibuka, aplikasi menampilkan pesan, bukan memakai data lama.
- **Satu tab pada satu waktu** (Web Locks) karena SAH Pool hanya mengizinkan satu koneksi. Tab kedua menampilkan pesan yang jelas.
- **Tanpa berkas Wasm** aplikasi berjalan seperti v9.10 (jurnal OPFS). Service Worker menyimpan berkas Wasm sebagai cache opsional sehingga instalasi PWA tidak gagal bila berkas belum ada. Cache: `kalsara-v5.82-client-v9.11`.
- `scripts/fetch-sqlite-wasm.mjs`: memasang `sqlite3.mjs` + `sqlite3.wasm` (versi dipin `3.46.1-build1`, SHA-256 dicatat di `VERSION.json`) dan `--check` untuk verifikasi.
- Skema lama `event_log` dihapus (tidak ada gunanya sebagai sumber data tunggal; jalur lama tidak pernah menulis ke database nyata).
- Audit statis di `tests/storage.test.mjs` diarahkan ke `sqlite-engine.js` (SQL berpindah ke sana); tes runtime 19 assertion tidak diubah.

### Tes (semua lulus di lingkungan build)
- `tests/sqlite-engine.test.mjs`: 42 assertion pada **SQLite sungguhan** (node:sqlite): migrasi, upsert/urutan, kolom turunan, atomisitas batch, restore, durabilitas lintas koneksi.
- `tests/storage-sqlite.test.mjs`: 48 assertion: impor jurnal, tulis ke SQLite bukan jurnal, rollback saat gagal tulis, backup/restore atomik, boot ulang, penolakan jatuh ke jurnal usang, penjaga tab, gagal impor, timeout klien. Diverifikasi dengan uji mutasi (merusak rollback/penanda membuat tes gagal).
- `tests/vendor-script.test.mjs`: 9 assertion untuk skrip pemasang Wasm.
- E2E Chromium nyata: `shelf` (20), `hitung` (13), dan `sqlite-fallback` (5): Worker SQLite termuat, membalas `wasm-missing` dengan benar, aplikasi tetap hidup lewat jurnal.

### Belum terbukti / masih terbuka
1. **SQLite Wasm + OPFS SAH Pool di browser nyata belum pernah dijalankan** (sandbox tanpa jaringan, berkas Wasm tidak tersedia). Lapisan Worker (`openWasmDb`, pemetaan `exec/run/all` ke API `oo1`) hanya terbukti sintaksis dan lewat jalur gagal-aman; logika SQL-nya terbukti di SQLite nyata melalui Node. Setelah Wasm dipasang: jalankan `npm run vendor:check`, `npm test`, buka aplikasi dan periksa `KStore.backend === 'sqlite'`.
2. Rollback ke v9.10 setelah beralih ke SQLite membuat v9.10 membaca jurnal lama yang tidak lagi ditulis. Buat cadangan (backup) sebelum beralih dan sebelum rollback.
3. Kuota OPFS penuh, crash saat tulis, dan perilaku dua tab pada browser nyata belum diuji.
4. Agregasi laporan ERP masih berjalan di Worker komputasi dari baris yang dimuat; memindahkannya menjadi kueri SQL (`SUM/GROUP BY`) adalah Tahap 3b. Normalisasi penuh (membuang payload JSON) juga belum dilakukan.
5. Pemecahan `legacy-app.js` per modul belum dikerjakan.


## Pembaruan v9.12 — Tahap 3b: laporan ERP dihitung di SQLite (+ perbaikan bug tab ERP)

### Bug lama yang diperbaiki (ada sejak v9.10)
Variabel `MODE` hilang saat migrasi sehingga **tab ERP menampilkan "Penyimpanan ERP tidak bisa dibuka: MODE is not defined"** dan ekspor cadangan ERP (`dump()`) ikut gagal. Satu deklarasi dikembalikan. Terbukti di Chromium nyata pada v9.10 asli (bug muncul) dan v9.12 (tab tampil).

### Perubahan
- **Skema SQLite v2** (migrasi otomatis dan atomik dari v1 saat aplikasi dibuka): kolom uang laporan (`fv, fs, fa, fx, fp, fr, fk, ft, platform_fee`) kini kolom sungguhan, ditambah penanda `rpt_ok` (baris dengan nilai bukan integer Rupiah aman). Data v1 yang sudah ada diisi ulang dari payload dalam transaksi yang sama; bila gagal, database tetap v1 dan utuh.
- **Laporan di SQL:** `erpReports()` menjumlah semua kolom uang dan HPP terkunci (snapshot) untuk SEMUA bulan dalam satu lintasan. Hanya baris tanpa snapshot yang dikembalikan ke JS untuk pencocokan modal. Tab ERP dan grafik 6 bulan memakai satu permintaan (sebelumnya 7 kali kirim seluruh data ke worker).
- **Pencarian modal terindeks:** pencocokan SKU memakai Map (hasil sama persis; SKU ganda, modal 0, dan urutan produk dipertahankan).
- **Fallback aman:** bila SQLite tidak aktif, atau ada nilai tak valid (yang membuat hitungan lama melempar RangeError), jalur JS lama dipakai dengan hasil identik.
- `scripts/bench-erp-report.mjs`: pengukuran ulang kapan saja.

### Bukti
- `tests/erp-report.test.mjs` (21): hasil jalur SQL == **worker v9.11 asli yang dibekukan** (`tests/fixtures/compute.worker.v9_11.js`) pada data acak berbenih tetap (baris terkunci/tidak, SKU ganda, tautan, modal 0, bulan kosong, nilai tak valid -> fallback). Uji mutasi pada filter bulan, aturan terkunci, dan indeks SKU membuat tes gagal.
- `tests/sqlite-migration.test.mjs` (16): migrasi v1->v2 pada data yang sudah ada, laporan hasil migrasi == laporan data tulis langsung, kegagalan di tengah migrasi kembali ke v1 dengan data utuh.
- E2E Chromium nyata `sqlite-fallback` (9): tab ERP tampil, sambungan laporan SQL (disimulasikan) -> worker -> layar benar (omzet 100.000, laba bersih 86.000), fallback per bulan memakai hitungan lama.
- Benchmark (Node, SQLite native, data sintetis, 90% HPP terkunci, 1 tampilan + 6 bulan grafik): 20.000 baris 1816 ms -> 152 ms (12x); 100.000 baris 11190 ms -> 844 ms (13x); hasil identik. **Angka di browser akan berbeda** (SQLite Wasm lebih lambat dari native; di sisi lama ada juga biaya salin data ke worker), jadi jangan dibaca sebagai janji 12x di perangkat.

### Belum terbukti
1. Migrasi v1->v2 dan laporan SQL pada **SQLite Wasm di browser nyata** (perangkat pengguna sudah v1 dan akan bermigrasi saat pertama dibuka). Logikanya terbukti di SQLite nyata lewat Node. Buat cadangan sebelum memperbarui.
2. Kecepatan di handphone belum diukur.
3. Normalisasi penuh (membuang payload JSON) dan pemecahan `legacy-app.js` per modul belum dikerjakan.
