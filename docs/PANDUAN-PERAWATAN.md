# Panduan perawatan Kalsara (untuk AI atau orang yang meneruskan setelah lama ditinggal)

Baca urutan ini: `README.md` -> `LANJUT-DI-SINI.md` -> `state_tracker.txt` -> `CHANGELOG.md` -> berkas ini. Jangan membaca `arsip/MIGRATION-STATUS.md` penuh (arsip 112 KB); buka hanya bagian yang dibutuhkan.

## 1. Aturan emas
1. Pemilik bukan programmer: jelaskan dalam bahasa sehari-hari, sertakan langkah uji manual.
2. Tidak ada fitur baru dan tidak ada perubahan rumus tanpa persetujuan tertulis pemilik. Hasil uang harus sama persis dengan v5.82.
3. Jangan menulis "lulus" untuk tes yang tidak dijalankan. Sebutkan tempatnya: sandbox sesi atau GitHub Actions pemilik.
4. Satu tes gagal = berhenti. Dilarang melemahkan tes agar lulus; setiap perubahan tes dijelaskan dan dicatat di CHANGELOG.
5. Setiap sesi yang mengubah paket WAJIB memperbarui: `CHANGELOG.md` (entri baru), `LANJUT-DI-SINI.md`, `state_tracker.txt`, `README.md` (nomor versi dan batasan), `progress.html`, dan nomor di `js/version.js` + `package.json`. `tests/dokumentasi.test.mjs` menjaga sebagian aturan ini.

## 2. Peta modul (`js/`, `workers/`, `components/`)
Akar perakitan: `index.html` -> `js/main.js` (titik masuk, penyimpanan, Worker) -> `js/app-core.js` (merakit modul fitur; masih berisi beberapa bagian dengan variabel privat bersama, belum dipecah).

| Berkas | Tugas |
|---|---|
| js/main.js | Titik masuk; inisialisasi penyimpanan, migrasi, pemasangan kinerja dan Etalase berhalaman |
| js/app-core.js | Perakitan semua modul fitur dan sambungan eksplisit |
| js/version.js | Satu-satunya sumber nomor versi (`app` 5.82, `paket`) |
| js/state.js | Penyimpanan resmi state inti: A (setelan), rows (produk), SALES, PRM (promo), TS |
| js/money.js | Hitung uang bilangan bulat (BigInt), tanpa float |
| js/format.js | Format dan baca angka/tanggal Indonesia (`rp`, `num`, `fmt`, `today`) |
| js/tariff.js | Tabel tarif Shopee (Admin, Gratis Ongkir XTRA) |
| js/pricing.js | Pipa harga maju/mundur versi sinkron (`fwd`, `impas`, `vbest`) |
| js/calc-cache.js | Cache hasil kalkulator dan pra-hitung batch di Worker |
| js/voucher-rules.js | Aturan voucher otomatis, potongan, jadwal, ambang belanja |
| js/voucher-panel.js | Panel "Cek pesanan nyata", dialog selisih tarif dan panduan |
| js/promosi-data.js | Data dan logika promosi (CFG, harga promo, status, migrasi format lama) |
| js/promosi-panel.js | Panel dan tampilan promosi (kartu promo, daftar produk promo) |
| js/hitung-etalase.js | Tab Hitung dan Etalase (pabrik `createHitungEtalase`): filter, urut, stok, timer |
| js/etalase-view.js | Model data Etalase (`shop()`, label, harga) |
| js/etalase-halaman.js | Etalase berhalaman 50 kartu dan penanda "data berubah" (`gate`, `tandaiKotor`) |
| js/hasil-view.js | Tampilan hasil kartu Hitung |
| js/kartu-update.js | `updRow`: memperbarui satu kartu Hitung |
| js/upd-fill.js | `upd` (hitung ulang semua) dan `fill` (isi Setelan) |
| js/warnings.js | Peringatan stok dan margin |
| js/tarif-ui.js | Logika tarif dan peringatan tarif di antarmuka |
| js/helpers.js | Fungsi murni kecil (`esc`, `uid`, `feeSig`) |
| js/ui.js | Dialog konfirmasi, toast, penutup latar |
| js/dom.js | Pembuat DOM aman (penyaring konten berbahaya) |
| js/penjualan.js | Tab Penjualan/Laporan |
| js/erp.js | Tab ERP: impor CSV/XLSX Shopee, biaya operasional, laba rugi |
| js/xlsx-reader.js | Pembaca XLSX untuk impor |
| js/tab-impor-sinkron.js | Perpindahan tab, impor, sinkron |
| js/penyimpanan-cadangan.js | Status penyimpanan, cadangan, pengingat cadangan |
| js/pengaturan.js | Setelan toko, catatan tarif, tema, bantuan, onboarding |
| js/backup.js, js/backup-format.js | Orkestrasi cadangan dan pembaca teks cadangan |
| js/storage.js | Penyimpanan klien: SQLite Wasm di OPFS (utama); jalur jurnal lama hanya bila SQLite tidak tersedia |
| js/sqlite-engine.js, js/sqlite-client.js | Skema/transaksi SQLite dan proxy ke Worker |
| js/migration.js | Penggabungan aman saat migrasi satu kali dari IndexedDB lama |
| js/worker-client.js | Jembatan ke Web Worker (timeout, malas) |
| js/signals.js | Mesin reaktif lokal (Signals) |
| js/theme.js | Preferensi tampilan |
| js/pwa.js | Pemasangan PWA dan panel Pembaruan |
| js/kinerja.js | Pengukur kinerja (aktif hanya dengan `?perf=1`) |
| workers/compute.worker.js | Hitung berat di luar utas utama |
| workers/calculator-engine.js, workers/pricing-pipeline.js | Mesin kalkulator Chain of Responsibility (sen) |
| workers/sqlite-store.worker.js | Worker penyimpanan SQLite |
| components/product-card.js | Kartu produk Etalase (Web Component, Shadow DOM) |
| sw.js | Service Worker; daftar `CORE` dijaga tes agar sama dengan berkas nyata |
| vendor/sqlite-wasm/ | SQLite Wasm lokal, versi dikunci (`npm run vendor:check`) |

Menambah atau menghapus berkas runtime: perbarui `CORE` di `sw.js`, tabel di atas, dan CHANGELOG (tes `tahap8` dan `dokumentasi` akan menolak bila lupa).

## 3. Mengapa ada `tests/fixtures/` dan cara memperlakukannya
Modul hasil pemisahan dari kode lama dijaga oleh tes IDENTIK: tes membaca teks kode SEBELUM dipindah (fixture `*.pre_vX_Y.js.txt`) dan membuktikan isi modul sama (pernyataan demi pernyataan, atau perilaku sama pada ribuan masukan acak). Itu pengaman utama bahwa hasil hitung tidak bergeser. Fixture BUKAN kode yang dijalankan aplikasi. Jangan hapus fixture yang masih dirujuk tes.

Bila sebuah modul yang dijaga fixture HARUS diubah (mis. perbaikan kinerja):
1. Ubah seminimal mungkin.
2. Di tes terkait, daftarkan penyimpangan secara eksplisit dan sempit (contoh: `SUBS` di `tests/hitung-etalase.test.mjs`; penurunan teks dari fixture di `tests/promosi-panel.test.mjs`), supaya perubahan LAIN tetap tertangkap.
3. Catat di CHANGELOG dan LANJUT-DI-SINI, dengan alasan dalam bahasa awam.

| Fixture | Menjaga |
|---|---|
| core.pre_v9_20, tariff.pre_v9_21, pricing.pre_v9_22 | format, tarif, pipa harga |
| calc-cache.pre_v9_24, voucher-rules.pre_v9_25, penjualan.pre_v9_26, voucher-panel.pre_v9_27 | cache kalkulator, voucher, penjualan, panel voucher |
| ui.pre_v9_28, helpers.pre_v9_29, tarif-ui.pre_v9_30, warnings.pre_v9_31, hasil-view.pre_v9_32, kartu-update.pre_v9_33, etalase-view.pre_v9_35 | modul tahap 6 |
| app-core.bagian80.pre_v9_40, app-core.bagian60.pre_v9_41, app-core.bagian20.pre_v9_42 | cadangan/tema, tab/impor, hitung/etalase |
| app-core.bagian50a.pre_v9_43, app-core.bagian50-data.pre_v9_44 | panel promosi, data promosi |
| compute.worker.v9_11.js | Worker lama (perbandingan perilaku) |
| cadangan-v5_82-dengan-erp.txt | contoh cadangan v5.82 untuk uji pemulihan/migrasi |

Sumber kebenaran hasil hitung adalah `source/Kalsara-v5_82.html` (dipakai golden-master).

## 4. Skrip pendukung (`scripts/`, tidak ikut cache pengguna)
| Skrip | Fungsi |
|---|---|
| scripts/peta-global.mjs | Membuat `laporan/PETA-GLOBAL.md` (nama bersama antar berkas/bagian). Jalankan ulang bila tes `peta-global` bilang usang |
| scripts/ukur-tab.py | Mengukur waktu pindah tab dengan N produk (Playwright) |
| scripts/ukur-aksi.py | Mengukur aksi di dalam tab (ketik, filter, tambah produk promo) |
| scripts/bench-erp-report.mjs | Tolok ukur laporan ERP |
| scripts/fetch-sqlite-wasm.mjs | Mengunduh SQLite Wasm ke `vendor/` (hanya saat memperbarui, versi dikunci) |
| scripts/sabotase-etalase.sh | Uji sabotase: membuktikan tes menangkap perubahan yang merusak |
| scripts/vendor/ | Alat pengembang (acorn untuk tes); tidak dikirim ke pengguna. Bukan skrip yang dijalankan langsung |

## 5. Tes
- `npm test` (Node 22): unit, diferensial, golden-master, audit arsitektur. Cepat (menit).
- E2E Chromium nyata: GitHub -> Actions -> Uji E2E Browser -> Run workflow (23 skrip di `tests/e2e/`). Lokal: `python3 tests/e2e/<nama>.e2e.py`.
- Kinerja: `python3 scripts/ukur-aksi.py . <port> 1000 100 4` (CPU x4 = perkiraan HP menengah, BUKAN HP asli).
- Daftar periksa rilis: (1) ubah kode minimal; (2) `npm test`; (3) 23 E2E; (4) naikkan versi di `js/version.js` + `package.json`; (5) perbarui dokumen (aturan emas no. 5); (6) ZIP; (7) pemilik menjalankan Actions; (8) catat hasil Actions di CHANGELOG/LANJUT.

## 6. Hal yang tetap diminta pemilik (jangan lupa)
- Uji manual Bagian 7 pada SALINAN data (tutup cepat, restore lalu muat ulang, >1.000 produk, offline, profil kosong).
- Paket belum boleh menggantikan aplikasi toko asli sebelum uji manual dan uji HP asli.

## 7. Konvensi tampilan: baris rincian "teks + angka" (v9.50)
Dipakai di kartu Hitung ("Lihat rincian biaya"), Promosi, Penjualan, Cek pesanan nyata, dan laporan ERP. Perilaku yang dijaga: teks panjang turun ke baris ke-2 di kolomnya sendiri; angka tetap di kanan, tidak patah, dan sejajar dengan baris TERAKHIR teks.

| Hal | Letak |
|---|---|
| Kartu dan panel: `<div class="rw">teks<b>angka</b></div>` | aturan `.rw` dan `.rw b` di `css/app.css`; HTML dibuat `js/hasil-view.js` (`CR`), `js/kartu-update.js`, `js/tab-impor-sinkron.js`, `js/promosi-panel.js` (`rw`), `js/promosi-data.js` |
| Laporan ERP: `<div class="erw"><span class="erl">teks</span><span class="era">angka</span></div>` | aturan `.erw`, `.erl`, `.era` di `css/app.css`; HTML dibuat `js/erp.js` (`render`) |

Aturan agar tidak rusak lagi:
1. Wadah (`.rw`, `.erw`) harus `flex-wrap:nowrap`. Dengan `wrap`, angka pindah ke baris baru (masalah yang dilaporkan pemilik 8 Nov 2026).
2. Angka harus `flex:0 0 auto` dan `white-space:nowrap`; teks boleh menyusut (`min-width:0`) dan patah.
3. Sejajar baris terakhir: `align-items:last baseline` di dalam `@supports`, dengan `flex-end` sebagai cadangan browser lama.
4. Teks harus langsung anak wadah (teks polos atau `span`), angka satu elemen. Menambah elemen ketiga di baris ini mengubah tata letaknya: buat kelas baru.
5. Bila mengubah aturan ini: jalankan `node tests/baris-rincian.test.mjs` dan `python3 tests/e2e/baris-rincian.e2e.py`. Keduanya sudah diuji sabotase (CSS lama membuat gagal). Jangan melemahkan tes agar lulus.
6. Bila tampilan perlu diperiksa dengan mata: buka tab Hitung dan ERP pada lebar 320 px dan 412 px, cari baris dengan teks panjang (mis. "Voucher Toko 8% (Voucher Toko Migrasi 8%)", "Voucher, diskon & pengembalian dana").

## 7b. Penggantian label v9.52 (tests/helpers/label-v9_52.mjs)
Fixture lama membeku teks sebelum v9.52. `tests/helpers/label-v9_52.mjs` memuat daftar tertutup penggantian label lama ke baru dan mengecek jumlah kemunculannya per fixture. Bila label diubah lagi, tambah pasangan di sana (pasangan yang lebih panjang lebih dulu) dan sesuaikan jumlah yang diharapkan di tes pemakainya.


## 7c. Penggantian nama v9.53 (tests/helpers/nama-wulfeg.mjs)
Aplikasi berganti nama dari Kalsara menjadi Wulfeg. Hanya teks tampilan, nama berkas unduhan, dan ikon yang diganti. Kunci penyimpanan dan nama internal (`kalsara_*`, `__kalsara_*`, `KalsaraERP`, `kalsara-*`, elemen `kalsara-product-card`, global `Kalsara*`) TIDAK diganti karena data dan cadangan lama pemilik memakainya; mengubahnya butuh migrasi data. `tests/helpers/nama-wulfeg.mjs` memuat daftar tertutup penggantian nama berkas/judul di fixture beku (cadangan, penjualan, hasil, templat) dengan jumlah kemunculan yang dicek tepat.

## 8. Konvensi tampilan: penanda halaman Etalase (v9.51)
Dua penanda (atas `#shpt`, bawah `#shpg`) dibuat oleh `makePager` di `js/etalase-halaman.js`; gayanya di `css/app.css` (aturan `.pgn`, `.pgn button`, `.pgn .pgm`, `.pgn input`, `.pgn .pgi`).

Susunan yang dijaga (sama di semua lebar layar): baris 1 dua tombol selebar sama (grid dua kolom `1fr 1fr`, tinggi 44px); baris 2 "Hal. [n] dari N" (grid tiga kolom `1fr auto 1fr`: "Hal." rata kanan, "dari N" rata kiri, sehingga kotak angka tepat di tengah); baris 3 info "Produk a-b dari N" di tengah. Lebar maksimum 440px.

Aturan agar tidak rusak lagi:
1. Jangan kembali ke `flex-wrap`: di HP tombol "Berikutnya" jatuh sendirian.
2. Urutan elemen di DOM harus `prev, next, mid, info` (sama dengan urutan tampilan, agar tombol Tab tidak melompat). Tes E2E lain memakai `#shpg button` ke-0 (Sebelumnya) dan ke-1 (Berikutnya).
3. Aturan `.pgn[hidden]{display:none}` wajib ada: `display:grid` menimpa atribut `hidden` bila aturan itu hilang.
4. Bila mengubah ukuran/susunan: jalankan `node tests/penanda-halaman.test.mjs` dan `python3 tests/e2e/penanda-halaman.e2e.py` (mengukur 320/360/412/1024 px; sudah diuji sabotase).
