# Kalsara — migrasi client-side (basis Kalsara-v5.82)

**Versi paket: v9.43 (Tahap 7a: panel dan tampilan promosi pindah ke `js/promosi-panel.js`; Tahap 6: bagian 20-hitung-etalase pindah ke `js/hitung-etalase.js`; sebelumnya Tahap 5: bagian 60 pindah ke `js/tab-impor-sinkron.js`, Tahap 4: bagian 80 pindah ke modul fitur) — pengembangan, belum disertifikasi untuk produksi.**

- **Melanjutkan pekerjaan (mulai dari sini):** baca [`LANJUT-DI-SINI.md`](./LANJUT-DI-SINI.md) — ringkas, berisi posisi terakhir, angka target, dan langkah berikutnya.

- **Dashboard progres:** buka [`progress.html`](./progress.html) untuk melihat estimasi, hasil tes yang sudah terbukti, dan gerbang yang masih terbuka.
- **Peta ketergantungan global legacy (Tahap 1):** [`laporan/PETA-GLOBAL.md`](./laporan/PETA-GLOBAL.md), dibuat ulang dengan `node scripts/peta-global.mjs` (alat pengembang, tidak ikut ke pengguna).
- **Status teknis rinci:** lihat [`MIGRATION-STATUS.md`](./MIGRATION-STATUS.md).
- **Aplikasi:** buka [`index.html`](./index.html) setelah di-host melalui HTTPS.

Dashboard menampilkan estimasi progres kasar, bukan audit lengkap atau bukti pengujian browser. Jangan gunakan sebagai pengganti v5.82 di produksi sebelum semua gerbang penting lulus.

Paket ini mempertahankan markup, stylesheet, dan logika bisnis v5.82 sebagai lapisan kompatibilitas. Ini adalah **rilis perbaikan fondasi migrasi**, belum sertifikasi produksi.

## Isi paket
- `index.html` — markup dan navigasi asli.
- `source/Kalsara-v5_82.html` — salinan sumber asli yang tidak diubah sebagai referensi/cadangan.
- `css/app.css` — stylesheet asli, tidak didesain ulang.
- `js/promosi-panel.js` — panel dan tampilan promosi (Tahap 7a); logika data dan voucher tetap di `app-core.js` untuk Tahap 7b.
- `js/app-core.js` — modul ES inti (sejak v9.38; menggantikan loader `js/legacy-app.js` dan 12 berkas `js/legacy/*.js`). Isinya logika bisnis asli yang terbagi menjadi bagian berurutan, masing-masing diawali baris penanda `BAGIAN nn-nama`; modul lain diimpor eksplisit di bagian atas berkas. Dimuat oleh `js/main.js`.
- `js/storage.js` — penyimpanan dengan dua mode: **SQLite** (Worker, OPFS SAH Pool) sebagai satu-satunya sumber data bila `vendor/sqlite-wasm/` tersedia; **jurnal OPFS** lama hanya sebagai jalur cadangan sebelum pernah beralih ke SQLite.
- `js/sqlite-engine.js`, `js/sqlite-client.js`, `workers/sqlite-store.worker.js` — skema/transaksi SQLite (murni, diuji di SQLite nyata), proxy Worker, dan bootstrap Wasm lokal.
- `scripts/fetch-sqlite-wasm.mjs` — memasang SQLite Wasm ke `vendor/sqlite-wasm/` (`npm run vendor:sqlite`) dan memverifikasinya (`npm run vendor:check`).
- `js/main.js` — inisialisasi storage dan migrasi data localStorage serta IndexedDB ERP lama.
- `workers/compute.worker.js` + `workers/calculator-engine.js` + `js/worker-client.js` — parsing CSV/XLSX, laporan Shopee, agregasi ERP, pipeline BigInt, filter/sort, dan operasi `calculate-product`. Pengalihan semua pemanggil UI ke Worker masih tahap integrasi.
- `js/signals.js` — Preact Signals Core.
- `components/product-card.js` — custom element Shadow DOM awal.

## Perbaikan pada paket v3
1. Penulisan OPFS kini melacak nilai yang benar-benar sudah persisten. Jika penulisan gagal, cache optimistis dikembalikan ke nilai persisten terakhir; perubahan berikutnya pada key yang sama dapat memulihkan statusnya. `flush` melaporkan key yang masih gagal.
2. Pemulihan cadangan kini ditulis sebagai satu event snapshot di jurnal, bukan serangkaian perubahan per-key. Jika penulisan snapshot gagal, snapshot lama tetap menjadi keadaan jurnal.
3. Migrasi `localStorage` dan ERP lama tidak menandai migrasi selesai jika pembacaan/penulisan gagal, sehingga dapat dicoba ulang saat aplikasi dibuka lagi.
4. Perhitungan persentase biaya utama memakai perkalian integer BigInt dan pembulatan eksplisit pada skala 1/10000 persen. Parser ERP mengembalikan Rupiah bulat; penggunaan `parseFloat` di `legacy-app.js` sudah dihapus.
5. Worker menolak nilai uang yang bukan integer satuan minor dan menolak basis point pecahan/negatif. Pembulatan biaya juga menangani nilai negatif secara simetris.
6. Worker client menolak semua pekerjaan tertunda jika Worker gagal dan menangani kegagalan `postMessage`.
7. Cache Service Worker dinaikkan agar browser mengambil file v3, bukan menyajikan cache v1.

## Perbaikan pada paket v2
1. Urutan startup dibalik: SQLite di-hydrate lebih dulu, lalu jurnal OPFS diputar ulang sehingga event terbaru tidak ditimpa snapshot SQLite yang lebih lama.
2. Penulisan jurnal dilakukan sebelum cache dianggap persisten. Kegagalan penulisan dicatat, dikirim sebagai event `kalsara-storage-error`, dan `flush`/backup akan gagal secara eksplisit.
3. SQLite diperlakukan sebagai indeks yang dapat dibangun ulang dari jurnal. Jika sinkronisasi SQLite gagal, jurnal OPFS tetap menjadi sumber utama.
4. Pemulihan snapshot menghapus key yang tidak ada pada snapshot, bukan hanya menimpa key yang cocok.
5. ERP tidak lagi memakai IndexedDB sebagai penyimpanan aktif. Data dari database `KalsaraERP` lama dimigrasikan satu kali ke key KStore `kalsara_erp_*`; database lama sengaja tidak dihapus sebagai sumber pemulihan.
6. Jalur unduhan `claude.use('downloads')` dihapus dan diganti dengan unduhan browser standar.

## Menjalankan
Gunakan HTTPS atau localhost (OPFS dan module imports memerlukan secure context). Tidak membutuhkan backend atau proses build. Buka `index.html` melalui static hosting HTTPS atau server statis lokal. Untuk smoke test awal di browser, buka `tests/browser-smoke.html` pada origin uji yang terpisah dari data produksi. Hasil tes browser harus disimpan sebagai bukti sebelum rilis.

## Perubahan v8
- `grossUpDiscount()` memakai BigInt untuk membalik diskon persen menjadi harga listing awal dengan pembulatan ceil rasional yang eksak.
- Jalur kalkulator menggunakan helper tersebut untuk diskon coret persen; pengurangan voucher, pengurangan biaya, dan laba di `fwdV` menggunakan penjumlahan Rupiah integer tervalidasi.
- Service Worker cache key diperbarui ke v8.
- `tests/browser-smoke.html` menyediakan smoke test untuk startup, tujuh tab, BigInt, Worker CSV, OPFS, File System Access API, dan Service Worker. Tes ini belum dijalankan di lingkungan build; jalankan pada localhost/profil uji.

## Batasan yang masih terbuka — jangan gunakan sebagai klaim selesai produksi
- Tidak ada lagi assignment `.innerHTML =` atau pemanggilan `insertAdjacentHTML()` di `legacy-app.js`. Namun template lama masih berupa string HTML yang diproses melalui sanitizer `KDOM`; belum seluruh renderer ditulis ulang sebagai komponen DOM deklaratif.
- Kalkulator harga inti, pencarian harga, kombinasi tarif, threshold voucher/promosi, dan sejumlah operasi margin masih memiliki jalur `Number`. Helper persentase dan diskon serta agregasi ERP sudah memakai BigInt, tetapi belum seluruh rumus bisnis.
- Worker sudah menangani CSV, XLSX, parsing laporan Shopee, detail pesanan, dan agregasi ERP. Kalkulator harga, tarif, promosi, dan sebagian pemetaan HPP masih di main thread.
- SQLite memiliki tabel materialisasi domain ERP, tetapi adapter CRUD ERP masih menulis JSON per-koleksi ke OPFS journal. Tabel domain belum menjadi sumber query/CRUD aktif.
- (Diperbarui v9.43a) SQLite Wasm sudah dibundel lokal di `vendor/sqlite-wasm/` dan terdaftar wajib di cache Service Worker. Tidak ada lagi pemuatan dari CDN (Signals juga memakai mesin lokal).
- Preact Signals dan Web Component tersedia sebagai fondasi; belum semua tampilan produk dipindahkan ke komponen Shadow DOM.
- Sinkron supplier/Google Sheets masih merupakan koneksi eksternal browser ke URL yang diberikan pengguna; tinjau kembali kebutuhan dan izin aksesnya.
- Pengujian unit dan static audit sudah tersedia. Browser end-to-end belum dinyatakan lulus; Chromium headless di lingkungan build berhenti sebelum merender DOM, bahkan pada halaman HTML sederhana. Migrasi localStorage/IndexedDB perlu diuji terhadap salinan data browser nyata.

## Pemeriksaan v4
- `node --check` untuk `main.js`, `storage.js`, `worker-client.js`, `compute.worker.js`, dan `legacy-app.js` berhasil.
- `node tests/worker.test.cjs`: 9 assertion lulus; `node tests/money.test.mjs`: 11 assertion lulus; `node tests/storage.test.mjs`: 7 assertion lulus.
- `parseFloat` tersisa di `legacy-app.js`: 0.
- `innerHTML` dan `insertAdjacentHTML` belum seluruhnya dimigrasikan.

## Gerbang sebelum produksi
1. Audit semua rumus dan buat golden-master test dari v5.82; perhitungan bisnis selain fungsi persentase utama masih belum seluruhnya menggunakan BigInt.
2. Konversi seluruh nilai uang ke integer/BigInt dengan aturan pembulatan eksplisit.
3. Migrasikan renderer secara bertahap tanpa mengubah UX.
4. Pindahkan kalkulator harga, tarif, voucher, promosi, dan sisa komputasi berat ke Worker.
5. Tambahkan uji browser untuk onboarding, CRUD produk, impor/ekspor, backup/restore, penjualan, promosi, tarif, laporan, dan ERP.
6. Uji migrasi data lama, kegagalan quota, multi-tab, serta pemulihan setelah tab/browser ditutup paksa.

Jangan mengganti aplikasi produksi dengan paket ini sebelum seluruh gerbang tersebut lulus.

## Tambahan v4
- `js/money.js` menyediakan parsing Rupiah integer berbasis BigInt, akumulasi dan perkalian nominal yang tervalidasi.
- Modul ERP memakai parser tersebut, menjumlahkan komponen biaya dan laporan dengan BigInt, lalu menolak hasil yang melampaui batas integer aman sebelum dirender.
- Parsing CSV laporan ERP dipindahkan ke Web Worker agar file besar tidak memblokir thread antarmuka.
- Jalur penggabungan biaya pada baris pesanan juga menggunakan akumulasi BigInt.
- Tambahkan tes parsing Rupiah (format lokal dan internasional), overflow, pembulatan negatif, CSV ber-quote, dan quote CSV yang rusak.


## Pemeriksaan v4
- Semua file JavaScript utama lolos `node --check`.
- `npm test`: 27 assertion lulus (Worker 9, money 11, storage 7).
- Fungsi bisnis bernama pada sumber asli dan modul kompatibilitas: 271 nama unik; tidak ditemukan nama fungsi asli yang hilang.
- `parseFloat`: 0; `claude.use`/`claude.*`: 0.
- IndexedDB hanya tersisa di jalur migrasi satu kali pada `main.js`; ERP aktif menggunakan KStore/OPFS.
- `innerHTML`: 59; `insertAdjacentHTML`: 2; keduanya masih menjadi pekerjaan renderer yang belum selesai.

## Tambahan v5
- Parser uang memperlakukan pembulatan setengah secara simetris menjauhi nol: `12,5` menjadi `13` dan `-12,5` menjadi `-13` Rupiah.
- Test regresi mencakup nilai negatif kecil (`-0,5`) dan CSV dengan baris baru di dalam field kutip.
- `npm test` pada paket v5: 32 assertion lulus (Worker 11, money 14, storage 7).
- Pemeriksaan sintaks Node.js untuk modul utama dan Worker: lulus.

Status tetap pengembangan: seluruh gerbang produksi di atas belum dinyatakan lulus.


## Tambahan v8
- 57 penulisan `innerHTML` dan 2 `insertAdjacentHTML` diganti dengan `KDOM` (`DOMParser` + sanitasi elemen/atribut/URL + `replaceChildren`/`append`). Tidak ada lagi penulisan langsung `innerHTML` pada `legacy-app.js`.
- Parsing XLSX (termasuk DEFLATE), laporan Penghasilan Shopee, dan detail Order completed dipindahkan ke Worker. ArrayBuffer XLSX ditransfer ke Worker.
- Agregasi ERP untuk omzet, fee, HPP, OpEx, dan laba dipindahkan ke Worker dengan BigInt.
- SQLite menambah tabel materialisasi domain ERP dan indeks. OPFS journal tetap sumber kebenaran; adapter ERP belum CRUD langsung ke tabel domain.
- Helper `percentOfRupiah` dan `discountedPrice` memakai BigInt untuk persentase dan harga setelah diskon.
- Tes v8: Worker 30, Money 23, Storage runtime 13, audit SQLite 6, audit DOM 11; 271 nama fungsi asli dan 7 tab utama tetap terdeteksi.
- Browser E2E belum dapat dijalankan: Chromium headless di lingkungan build berhenti sebelum merender DOM, bahkan untuk halaman HTML sederhana. Jangan anggap paket ini sudah 100% produksi.

## Golden-master calculator tests (v9)

Run `npm test` to execute the calculator compatibility test against the embedded original `source/Kalsara-v5_82.html`. The test compares 5 curated cases plus 1,000 deterministic generated fixtures. It currently covers the core `calc()`/`fwdL()` path and manual voucher settings; it does not claim complete coverage of all promotion and voucher rule combinations.


## Tambahan v9.2 — cakupan promosi dan pembulatan harga promo
- Golden-master bertambah untuk pemilihan promo, Paket Diskon, harga promo produk, Kombo Hemat, dan Hadiah Minimum Belanja; hasil dibandingkan langsung dengan fungsi pada sumber v5.82.
- Golden-master mendeteksi perbedaan pembulatan Rp1 pada harga promo produk. Jalur migrasi diperbaiki agar memakai pembulatan integer terdekat yang sama dengan perilaku asli, lalu ditutup dengan 200 fixture deterministik.
- Total saat ini: 1.622 differential assertions: kalkulator inti 1.005, voucher 112, promo/Paket Diskon 205, harga promo produk 200, Kombo Hemat/Hadiah Minimum Belanja 100.
- Cache Service Worker dinaikkan ke v9.2 agar aset versi ini tidak memakai cache aplikasi lama.
- Ini memperluas bukti kesetaraan fungsi terpilih, bukan bukti semua kemungkinan input atau seluruh alur UI. Browser E2E, CRUD SQLite langsung, dan pemindahan kalkulator ke Worker masih menjadi gerbang produksi.


## Tambahan v9.3 — mesin kalkulator Worker
- Menambahkan `workers/calculator-engine.js`, yang menjalankan logika kalkulator kompatibilitas dalam konteks Worker tanpa akses DOM. Input mencakup pengaturan, promosi, daftar produk, dan produk yang dihitung.
- Menambahkan operasi `calculate-product` pada `workers/compute.worker.js`; hasil berisi kalkulasi kompatibilitas serta rincian harga ideal.
- Golden-master membandingkan hasil mesin Worker dengan sumber asli v5.82 pada 1.005 fixture kalkulator inti. Total pemeriksaan diferensial kalkulator (versi migrasi + Worker) menjadi 2.010 assertion.
- Service Worker memasukkan `workers/calculator-engine.js` ke cache offline.
- Batasan: aplikasi kompatibilitas masih memiliki banyak pemanggil `calc()` sinkron. Mesin Worker sudah tersedia dan teruji, tetapi konversi semua alur UI menjadi asinkron belum selesai. Jangan menganggap tahap ini sebagai pemindahan penuh atau rilis produksi.


## Pembaruan v9.4 — integrasi Worker bertahap dan API domain ERP

Tanggal build: 2026-11-02

### Perubahan
- Jalur `calc()` kini memakai hasil Worker ketika hasil dengan snapshot input yang persis sama sudah tersedia. Perhitungan sinkron v5.82 dipertahankan sebagai fallback untuk first paint dan bila Worker gagal, sehingga tidak ada layar kosong atau hitungan hilang saat Worker belum selesai.
- Cache hasil Worker memakai kunci dari tanggal lokal, seluruh pengaturan, promosi, dan data produk. Balasan Worker yang datang terlambat hanya mengisi kunci snapshot lamanya; tidak dapat menimpa hasil untuk input terbaru. Pembaruan tampilan dikoaleskan agar banyak produk tidak memicu render berulang tanpa batas.
- CRUD ERP sekarang memakai API `KStore.erpAll/erpPut/erpDelete/erpClear`. Saat SQLite tersedia, pembacaan empat koleksi domain (laporan marketplace, detail pesanan, OpEx, dan pengaturan) dilakukan dari tabel domain; penulisan tetap dijurnal ke OPFS lalu menyinkronkan tabel agar pemulihan dari jurnal tetap memungkinkan. Jika SQLite tidak tersedia, API memakai koleksi JSON dari jurnal.
- Tes storage ditambah untuk upsert, read, delete, dan clear ERP; audit kompatibilitas memverifikasi wiring Worker dan API domain.
- Cache Service Worker dinaikkan ke `kalsara-v5.82-client-v9.4`.

### Hasil tes
- `npm test` dijalankan setelah perubahan. Suite golden-master tetap membandingkan kalkulator Worker dan migrasi terhadap v5.82; storage test juga mencakup CRUD domain API.
- `node --check` dijalankan untuk file JavaScript proyek.

### Batasan yang belum tertutup
- Ini **integrasi Worker bertahap**, bukan penghapusan penuh kalkulasi sinkron: jalur sinkron tetap dipakai sebagai fallback dan untuk operasi kompatibilitas seperti panel perbandingan. Browser UI perlu diuji nyata untuk mengukur bahwa hasil Worker benar-benar terpakai pada interaksi normal.
- SQLite Wasm belum dapat dibundel lokal pada build ini karena artefak paket tidak tersedia di lingkungan build dan akses registry terhenti. (Catatan lama, sudah usang: sejak v9.3x Wasm dibundel lokal dan CDN tidak dipakai lagi; uji offline di perangkat nyata tetap belum dibuktikan.)
- Chromium headless yang tersedia pada lingkungan build timeout bahkan pada halaman HTML `data:` statis; E2E browser dan pemeriksaan visual desktop/mobile belum dinyatakan lulus.
- Tabel domain tetap merupakan indeks/materialisasi yang dibangun dari jurnal OPFS, bukan satu-satunya sumber kebenaran. Ini disengaja agar write-ahead recovery tetap aman; klaim bahwa SQLite menjadi satu-satunya storage aktif belum tepat.

**Status v9.4: tahap pengembangan, belum rilis produksi.** Simpan sumber v5.82 dan backup pengguna sebelum migrasi nyata.

## Pembaruan v9.5 — ketahanan Web Worker
- Worker kini dibuat secara lazy. Jika API `Worker` tidak tersedia atau konstruksi Worker gagal, aplikasi utama tidak lagi gagal hanya karena modul jembatan Worker diimpor; pemanggil menerima error yang dapat ditangani dan kalkulator tetap dapat memakai jalur sinkron kompatibilitas.
- Setiap permintaan Worker memiliki batas waktu 60 detik. Worker yang macet direset agar permintaan berikutnya tidak terus menunggu proses yang sudah buntu. Error Worker menggagalkan permintaan yang tertunda secara eksplisit.
- Ditambahkan tes jembatan Worker untuk keberhasilan respons, payload, mode module, dan propagasi error.
- Versi paket/cache Service Worker dinaikkan ke v9.5.
- Ini memperkuat pemulihan saat Worker gagal, tetapi belum membuktikan dukungan semua browser atau menggantikan E2E browser nyata.

## v9.6 — safe ERP migration

The legacy `localStorage` migration now reports conflicting values instead of silently skipping them; the destination value is preserved and both values are retained for review. The legacy `KalsaraERP` IndexedDB migration now merges by record ID instead of replacing the destination collection. Existing destination records win on conflicting IDs, and the source/destination pair is retained in `__kalsara_erp_idb_migration_conflicts_v1` for review. Audit metadata is stored in `__kalsara_localstorage_migration_report_v1` and `__kalsara_erp_idb_migration_report_v1`. Conflict logs are stored in `__kalsara_localstorage_migration_conflicts_v1` and `__kalsara_erp_idb_migration_conflicts_v1`. The migration helper is covered by dedicated idempotency/conflict tests. This reduces migration data-loss risk; it does not replace browser-based validation on a copy of real user data.
