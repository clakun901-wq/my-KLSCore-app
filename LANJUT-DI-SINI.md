# LANJUT-DI-SINI (v10) - posisi setelah v9.51 (perbaikan tampilan penanda halaman Etalase dan baris rincian; sebelumnya Tahap 9C, v9.49)

Untuk AI di sesi berikutnya: baca berkas ini dan `state_tracker.txt`; riwayat perubahan ada di `CHANGELOG.md`, peta modul/fixture/skrip/daftar periksa rilis di `docs/PANDUAN-PERAWATAN.md`. WAJIB memperbarui CHANGELOG dan dokumen ini di setiap sesi yang mengubah paket (dijaga `tests/dokumentasi.test.mjs`). Jangan membaca `arsip/MIGRATION-STATUS.md` (arsip sejarah, 112 KB). Aturan pemilik di `LANJUT-DI-SINI-v2.md` dan master prompt tetap berlaku: pemilik bukan programmer, tidak ada fitur/rumus baru, jangan klaim lulus untuk tes yang tidak dijalankan.

## Posisi
- Tahap 0-8 selesai. Tahap 9A/9B (v9.48) dan 9C (v9.49, aksi tab Hitung/Promosi/Etalase lebih cepat) selesai dan LULUS di GitHub Actions pemilik (8 Nov 2026): `npm test` lulus, 21 E2E lulus, `fail=0`. Paket terbaru: v9.51 (v9.50 dan v9.51 hanya perbaikan tampilan CSS + tes + dokumentasi di atas v9.49; v9.51 juga mengubah satu baris urutan elemen di `js/etalase-halaman.js`; lihat bagian "v9.50" dan "v9.51" di bawah). v9.50 LULUS di GitHub Actions pemilik (npm test + 22 E2E, `fail=0`).
- Sisa kinerja yang diketahui (kerjakan hanya bila HP pemilik masih berat): buka aplikasi 1.000 produk (~5 dtk pada simulasi x4), `refreshLabels()` per `upd()`, hitungan promo di `money.js` (rumus dibekukan).
- Tahap berikutnya BELUM ada. Langkah 3 (Hitung berhalaman) dan langkah 4 (`upd` per ketikan) hanya dikerjakan bila angka/kesan dari HP pemilik menunjukkan masih berat. Bila sudah lancar, keduanya dilewati. Jangan membuat tahap baru tanpa permintaan pemilik.

## v9.51 - penanda halaman Etalase rapi dan presisi (sesi 8 Nov 2026)
- Permintaan pemilik: gaya penanda halaman sudah disukai, tetapi ukuran/susunan acak (di HP "Berikutnya" jatuh sendirian). Minta dibuat proper dan presisi.
- Akar masalah: `.pgn` di `css/app.css` memakai `flex-wrap:wrap`. Perbaikan: grid. Baris 1 dua tombol selebar sama, baris 2 "Hal. [n] dari N" (kotak angka tepat di tengah), baris 3 info. Lebar maksimum 440px. Gaya visual tidak diubah. Satu baris JS: `nav.append(prev, next, mid, info)` di `js/etalase-halaman.js` (urutan DOM = urutan tampilan).
- Tes: `tests/penanda-halaman.test.mjs` (statis) dan `tests/e2e/penanda-halaman.e2e.py` (E2E ke-23, geometri nyata 320/360/412/1024 px). Uji sabotase: CSS lama membuat keduanya gagal. Jangan mengembalikan `flex-wrap`.
- Bukti sandbox sesi: di SANDBOX sesi (bukan GitHub Actions): `npm test` exit 0 (golden-master identik vs v5.82; `penanda-halaman` 13 pernyataan; `dokumentasi` 76 pernyataan) dan 23/23 E2E lulus, `fail=0` (`penanda-halaman` 173 pernyataan di Chromium nyata). GitHub Actions v9.51 BELUM dijalankan; HP asli BELUM dilihat.
- Uji manual pemilik: pasang v9.51, muat ulang sekali, buka Etalase dengan lebih dari 50 produk live: dua tombol sama lebar di atas, "Hal. [1] dari N" di tengah, "Produk 1-50 dari N" paling bawah; ketuk "Berikutnya": tidak ada yang bergeser.

## v9.50 - baris rincian: teks panjang turun ke baris ke-2, angka sejajar (sesi 8 Nov 2026)
- Permintaan pemilik: di "Lihat rincian biaya" (kartu Hitung) dan laporan ERP, teks panjang harus otomatis turun jadi 2 baris dan angkanya sejajar dengan baris ke-2 teks (bukan pindah ke baris sendiri).
- Akar masalah: `flex-wrap:wrap` pada `.rw` dan `.erw` di `css/app.css`. Perbaikan: `nowrap` + angka `flex:0 0 auto` + `align-items:last baseline` (cadangan `flex-end`). Hanya CSS; tidak ada JS/rumus yang berubah. Komentar "v9.50" di `css/app.css` menjelaskan syaratnya.
- Ikut terbantu karena memakai pola yang sama: baris di Penjualan, panel Cek pesanan nyata, daftar catatan tarif (Setelan).
- Tes: `tests/baris-rincian.test.mjs` (statis) dan `tests/e2e/baris-rincian.e2e.py` (E2E ke-22, ukur geometri di Chromium, 320 dan 412 px). Uji sabotase: CSS lama membuat keduanya gagal. Jangan mengembalikan `flex-wrap:wrap` pada baris ini; bila suatu baris baru butuh susunan lain, buat kelas baru.
- Bukti sandbox sesi: di SANDBOX sesi (bukan GitHub Actions): `npm test` exit 0 (termasuk golden-master identik vs v5.82, `baris-rincian` 17 pernyataan, `dokumentasi` 76 pernyataan) dan 22/22 E2E lulus, `fail=0` (`baris-rincian` 62 pernyataan di Chromium nyata). GitHub Actions pemilik (8 Nov 2026, log dari pemilik): `npm test` lulus (termasuk `baris-rincian` 17 pernyataan) dan 22/22 E2E lulus, `fail=0` (termasuk `baris-rincian` 62 pernyataan). HP asli: belum ada tangkapan layar sesudah perbaikan.
- Uji manual pemilik (2 menit): (1) pasang v9.50 dan muat ulang sekali (Service Worker berganti versi); (2) tab Hitung, buka "Lihat rincian biaya" pada produk yang kena voucher: baris "Voucher Toko 8% (Voucher Toko Migrasi 8%)" turun 2 baris, angkanya sejajar dengan baris ke-2; (3) tab ERP: baris "Voucher, diskon & pengembalian dana" turun 2 baris, angka sejajar; (4) putar HP ke samping dan kembali: tidak ada yang bergeser aneh; (5) kirim tangkapan layar bila ada yang masih janggal.

## Yang dikerjakan di Tahap 8
- `js/version.js`: satu-satunya sumber nomor versi (`app` 5.82, `paket` 9.45). Dipakai `sw.js` (importScripts, nama cache), panel Pembaruan (APPV via `js/main.js` lalu `app-core.js`). `package.json` dan dokumen diperiksa tes.
- `tests/tahap8.test.mjs`: legacy/loader/parts.json tidak ada dan tidak dirujuk; `index.html` hanya memuat `js/main.js`; CORE `sw.js` = berkas runtime nyata (dua arah); `sw.js` dijalankan di sandbox; tiap fixture masih dirujuk tes; dokumen arsip ada.
- `tests/e2e/tahap8.e2e.py` (E2E ke-20): Service Worker aktif, cache bernama versi berisi seluruh berkas inti, halaman dimuat ulang saat offline. Tes E2E lain memblokir Service Worker, jadi ini pertama kalinya jalur offline diuji di browser.
- `MIGRATION-STATUS.md` dipindah ke `arsip/`; `README.md` dan `progress.html` diringkas dan dibetulkan (sebelumnya usang: v9.35, 46,6%, "masih ada CDN").
- Tidak ada perubahan rumus, hasil hitung, atau fitur. `tests/fixtures/*` TIDAK dihapus: semuanya masih dipakai tes diferensial yang membuktikan kode yang dipindah identik dengan aslinya.

## Definisi selesai (LANJUT-DI-SINI-v2, Bagian 6) - status jujur
| # | Syarat | Status |
|---|---|---|
| 1 | `js/legacy/`, `legacy-app.js`, `parts.json` tidak ada | Terpenuhi (hilang sejak v9.38; kini dijaga tes) |
| 2 | 0 variabel global lintas berkas | Terpenuhi untuk LINTAS BERKAS (hanya `app-core.js` yang punya nama bersama; modul lain memakai sambungan eksplisit). Peta masih mencatat 90 nama lintas BAGIAN di dalam `app-core.js`: variabel privat satu modul, bukan global. Menghapusnya = merancang ulang akar perakitan; belum dikerjakan, perlu persetujuan pemilik |
| 3 | `npm test` exit 0, golden-master identik | Lulus di GitHub Actions pemilik (v9.48) |
| 4 | E2E lulus di GitHub Actions pemilik | LULUS v9.49: 21 skrip, `fail=0`. v9.50 menambah skrip ke-22 (`baris-rincian`): LULUS di Actions pemilik; v9.51 menambah skrip ke-23 (`penanda-halaman`): lulus di sandbox sesi, belum di Actions (angka "13 E2E / 242 pernyataan" di rencana lama sudah usang) |
| 5 | Uji manual Bagian 7 | Belum dilakukan |
| 6 | Uji sabotase tetap menangkap perubahan | Tes sabotase lama tetap ada dan lulus |

## Belum terbukti
- Uji manual Bagian 7 pada salinan data.
- HP asli: kelancaran Etalase dan Hitung dengan 1.000 produk, mode offline, pemulihan cadangan besar. Angka sandbox dan runner GitHub (boot 1.000 kartu 570 ms di run terakhir, 1.225 ms di log sebelumnya; beda mesin, bukan beda kode) TIDAK mewakili HP.
- Cadangan lintas perangkat; pemulihan dengan data toko asli.
- Paket ini belum boleh menggantikan aplikasi toko asli.

## Langkah pemilik
1. Simpan ZIP v9.48 ini sebagai cadangan (versi yang lulus Actions).
2. Pasang di HP dengan SALINAN data berisi banyak produk. Buka aplikasi dengan `?perf=1` di belakang alamatnya.
3. Pakai tab Etalase, Hitung, dan lainnya; kirim hasil `KPerf.report()` atau kesan (tab mana yang masih berat) ke AI.
4. Lakukan uji manual Bagian 7 pada salinan data.

## Hasil GitHub Actions v9.45 dan perbaikan (sesi koreksi)
- Pemilik melaporkan: hanya `tahap8` gagal (Timeout 20000ms menunggu `kalsara-product-card`).
- Penyebab (dugaan kuat): E2E `tahap8` memuat aplikasi TANPA data, sehingga kartu produk memang tidak pernah muncul. Salah di alur tes, bukan bukti aplikasi rusak. Tes lain lulus karena memakai data awal.
- Perbaikan: tes kini menunggu panel Pembaruan menulis "Versi ..." (tanda boot selesai). Sudah dijalankan ulang di GitHub Actions pemilik (v9.48): `tahap8` LULUS, jadi perbaikan alur tes terbukti.

## Tahap 9A/9B (v9.48) - kinerja 1.000 produk (sesi 8 Nov 2026)
- Diminta pemilik: hampir semua tab freeze dengan 1.000 produk (laptop dan HP). Keputusan pemilik: pembagian halaman (bukan virtualisasi); kerjakan langkah 1 (pengukur) dan 2 (penanda data-berubah + Etalase berhalaman). Langkah 3 (Hitung berhalaman) dan 4 (upd per ketikan) BELUM dikerjakan: tunggu angka dari HP pemilik.
- TEMUAN UTAMA dari pengukuran: penyebab terbesar freeze bukan Etalase, melainkan membuka tab Hitung. `tab()` memanggil `upd(false)` (hitung ulang seluruh produk) SETIAP kali karena `PSIG` tersalin sebagai nilai beku `''` saat dipindah ke `js/tab-impor-sinkron.js` (v9.41); v5.82 membaca variabel hidup. Diperbaiki dengan `getPSIG()` (satu penyesuaian tercatat di tests/tab-impor-sinkron.test.mjs).
- Baru: `js/kinerja.js` (pengukur, aktif hanya dengan `?perf=1`), `js/etalase-halaman.js` (potong halaman 50 kartu, `?hal=25|50|100` untuk membandingkan; penanda data-berubah berdasarkan State.TS, rows/A/PRM, kunci stok terbuka, dan batas 60 detik), `scripts/ukur-tab.py` (ukur dari luar v9.47 vs v9.48), tests/etalase-halaman.test.mjs, tests/kinerja.test.mjs, tests/e2e/kinerja.e2e.py (E2E ke-21).
- `shop()` di js/etalase-view.js TIDAK diubah; pemotongan terjadi di antara shop() dan perender kartu (KShelf dipasang ulang oleh js/main.js). Model seluruh produk live tetap dihitung; yang berkurang adalah elemen DOM. Bila angka HP menunjukkan pembuatan model masih mahal, ubah shop() dengan memperbarui fixture etalase-view secara sadar.
- Hitung sudah punya hidrasi malas (`.pc.lz`): 1.000 cangkang ada di DOM, hanya sekitar 40 yang terbangun. Pertimbangkan ini sebelum merancang langkah 3.
- Terbukti di GitHub Actions pemilik: npm test lulus, 21 E2E lulus (`fail=0`), termasuk `kinerja` (23 pernyataan, Chromium nyata) dan boot 1.000 produk jauh di bawah batas 120 detik. Belum terbukti: HP asli. Angka kinerja di sandbox adalah Chromium headless; "CPU x4" hanya perkiraan HP kelas menengah.

## Tahap 9C (v9.49) - percepatan aksi di tab Hitung, Promosi, Etalase (sesi 8 Nov 2026)
- Pemilik melaporkan tiga tab masih berat setelah v9.48. Pengukuran ulang (`scripts/ukur-aksi.py`, Chromium, CPU x4, 1.000 produk): PINDAH tab sudah cepat (di bawah 0,3 dtk); yang berat adalah AKSI di dalam tab.
- Hitung: mengetik di kolom kartu memanggil `upd()` yang ikut membangun 1.000 model Etalase (tersembunyi). Kini `upd()` hanya menandai Etalase "kotor" (`KH.tandaiKotor()`, dipasang lewat dependensi eksplisit `tundaShop` di `createHitungEtalase`); Etalase dirender saat dibuka. Sekitar 545 ms -> 140 ms per ketikan (x4).
- Semua tab: `rp()` (js/format.js) memakai satu `Intl.NumberFormat` (sebelumnya `toLocaleString` membuat pemformat baru tiap panggilan, ~250 ms per render 1.000 kartu). Teks hasil identik.
- Promosi: daftar "Ganti produk..." di tiap baris promo berisi SEMUA produk (30 baris x 1.000 = 30.000 opsi). Kini diisi saat pertama disentuh/difokus (`itswFill` di js/promosi-panel.js). Menambah produk ke Promo Toko: sekitar 9 dtk -> 2 dtk (x4). Sisa waktu ada di hitungan promo (money.js `percentUnits`), TIDAK disentuh (rumus dibekukan).
- Penyimpangan sadar dari fixture: tests/promosi-panel.test.mjs (dua pernyataan baru + satu penggantian teks, diturunkan dari fixture sehingga perubahan lain tetap tertangkap) dan tests/hitung-etalase.test.mjs (satu penyesuaian, total 8). Tes baru: etalase-halaman (tandaiKotor) dan 2 pernyataan E2E di tahap7a (daftar kosong sebelum disentuh, terisi saat dibuka).
- Belum dikerjakan: boot 1.000 produk (sekitar 5 dtk, satu tugas panjang 2 dtk pada x4), `refreshLabels()` yang menyisir seluruh dokumen tiap `upd()`, `percentUnits`. Menunggu angka HP pemilik.
- TERBUKTI di GitHub Actions pemilik (8 Nov 2026): `npm test` lulus, 21/21 E2E, `fail=0`. Belum terbukti: HP asli.
