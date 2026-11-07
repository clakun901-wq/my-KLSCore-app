# LANJUT-DI-SINI (v8) - posisi setelah Tahap 8 (v9.45)

Untuk AI di sesi berikutnya: baca berkas ini dan `state_tracker.txt`. Jangan membaca `arsip/MIGRATION-STATUS.md` (arsip sejarah, 112 KB). Aturan pemilik di `LANJUT-DI-SINI-v2.md` dan master prompt tetap berlaku: pemilik bukan programmer, tidak ada fitur/rumus baru, jangan klaim lulus untuk tes yang tidak dijalankan.

## Posisi
- Tahap 0-8 sudah dikerjakan. Tahap 8 (v9.45) selesai di kode; menunggu GitHub Actions pemilik (npm test + 20 E2E) dan uji manual.
- Belum ada tahap berikutnya. Jangan membuat tahap baru tanpa permintaan pemilik.

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
| 3 | `npm test` exit 0, golden-master identik | Lulus di sandbox sesi; GitHub Actions v9.45 menunggu pemilik |
| 4 | E2E lulus di GitHub Actions pemilik | Menunggu (kini 20 skrip; angka "13 E2E / 242 pernyataan" di rencana lama sudah usang) |
| 5 | Uji manual Bagian 7 | Belum dilakukan |
| 6 | Uji sabotase tetap menangkap perubahan | Tes sabotase lama tetap ada dan lulus |

## Belum terbukti
- E2E v9.45 (terutama `tahap8`: Service Worker dan offline) belum dijalankan di browser mana pun.
- Uji HP nyata, uji offline pada perangkat nyata, pemulihan dengan data besar atau data toko asli, cadangan lintas perangkat.
- Paket ini belum boleh menggantikan aplikasi toko asli.

## Langkah pemilik
1. Simpan ZIP v9.44 koreksi2 sebagai cadangan.
2. Unggah ZIP v9.45 ke GitHub, lalu Actions -> Uji E2E Browser -> Run workflow.
3. Kirim hasilnya (lulus berapa dari 20; nama skrip yang gagal beserta log di atas baris GAGAL).
4. Setelah lulus, lakukan uji manual Bagian 7 pada salinan data.

## Hasil GitHub Actions v9.45 dan perbaikan (sesi koreksi)
- Pemilik melaporkan: hanya `tahap8` gagal (Timeout 20000ms menunggu `kalsara-product-card`).
- Penyebab (dugaan kuat): E2E `tahap8` memuat aplikasi TANPA data, sehingga kartu produk memang tidak pernah muncul. Salah di alur tes, bukan bukti aplikasi rusak. Tes lain lulus karena memakai data awal.
- Perbaikan: tes kini menunggu panel Pembaruan menulis "Versi ..." (tanda boot selesai). Belum dijalankan ulang; menunggu GitHub Actions pemilik.

## Tahap 9A/9B (v9.48) - kinerja 1.000 produk (sesi 8 Nov 2026)
- Diminta pemilik: hampir semua tab freeze dengan 1.000 produk (laptop dan HP). Keputusan pemilik: pembagian halaman (bukan virtualisasi); kerjakan langkah 1 (pengukur) dan 2 (penanda data-berubah + Etalase berhalaman). Langkah 3 (Hitung berhalaman) dan 4 (upd per ketikan) BELUM dikerjakan: tunggu angka dari HP pemilik.
- TEMUAN UTAMA dari pengukuran: penyebab terbesar freeze bukan Etalase, melainkan membuka tab Hitung. `tab()` memanggil `upd(false)` (hitung ulang seluruh produk) SETIAP kali karena `PSIG` tersalin sebagai nilai beku `''` saat dipindah ke `js/tab-impor-sinkron.js` (v9.41); v5.82 membaca variabel hidup. Diperbaiki dengan `getPSIG()` (satu penyesuaian tercatat di tests/tab-impor-sinkron.test.mjs).
- Baru: `js/kinerja.js` (pengukur, aktif hanya dengan `?perf=1`), `js/etalase-halaman.js` (potong halaman 50 kartu, `?hal=25|50|100` untuk membandingkan; penanda data-berubah berdasarkan State.TS, rows/A/PRM, kunci stok terbuka, dan batas 60 detik), `scripts/ukur-tab.py` (ukur dari luar v9.47 vs v9.48), tests/etalase-halaman.test.mjs, tests/kinerja.test.mjs, tests/e2e/kinerja.e2e.py (E2E ke-21).
- `shop()` di js/etalase-view.js TIDAK diubah; pemotongan terjadi di antara shop() dan perender kartu (KShelf dipasang ulang oleh js/main.js). Model seluruh produk live tetap dihitung; yang berkurang adalah elemen DOM. Bila angka HP menunjukkan pembuatan model masih mahal, ubah shop() dengan memperbarui fixture etalase-view secara sadar.
- Hitung sudah punya hidrasi malas (`.pc.lz`): 1.000 cangkang ada di DOM, hanya sekitar 40 yang terbangun. Pertimbangkan ini sebelum merancang langkah 3.
- Belum terbukti: HP asli, GitHub Actions v9.48 (npm test + 21 E2E). Angka kinerja di sandbox adalah Chromium headless; "CPU x4" hanya perkiraan HP kelas menengah.
