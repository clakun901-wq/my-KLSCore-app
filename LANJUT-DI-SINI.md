# LANJUT-DI-SINI — migrasi Kalsara (paket v9.35)

**Untuk AI di percakapan baru:** baca berkas ini saja dulu. Jangan membaca seluruh `MIGRATION-STATUS.md` (arsip); buka hanya bagian tahap yang diperlukan. Kerjakan satu tahap saja per sesi.

## Aturan pemilik proyek
- Pemilik tidak menulis kode. Jelaskan keputusan teknis dengan bahasa mudah; jangan menyuruh membaca seluruh kode.
- Jangan klaim E2E lulus hanya dari tes unit. Jangan hapus loader legacy.
- Di akhir setiap tahap: beri angka byte, persentase, jumlah assertion, bukti E2E, dan hal yang belum terbukti.

## Posisi saat ini
**v9.35 = tahap 6h diimplementasikan, lulus tes unit, DAN lulus 13 E2E (242/242) di Chromium pada sesi review; sabotase modul Etalase terbukti tertangkap.** Yang belum: job GitHub Actions milik pemilik untuk ZIP ini. Lima fungsi model/render Etalase (`errModel`, `actNoteModel`, `shopChips`, `shopPrice`, `shop`) dipindah ke `js/etalase-view.js` melalui `createEtalaseView`. `shop` tetap dipasang sebagai `var` global agar pemanggil `upd` dan `60-tab-impor-sinkron.js` tidak berubah. Detail teknis: `MIGRATION-STATUS.md`, bagian **Perubahan v9.35 — tahap 6h**.

## Angka v9.35
| Ukuran | Hasil |
|---|---:|
| Sisa `js/legacy/*.js` | **103.212 byte** |
| Pemisahan dari skrip inline v5.82 (penyebut 193.312 byte) | **46,6%** |
| `js/legacy/20-hitung-etalase.js` | **22.039 byte** |
| Teks lima fungsi lama (fixture) | 5.302 byte termasuk newline |
| Modul baru `js/etalase-view.js` | 6.163 byte |
| `npm test` | **exit 0; 318.634 assertion terhitung dari laporan tes** |
| Tes khusus Etalase | **23 assertion**, termasuk pembandingan fixture dan sabotase getter |
| Audit struktural legacy | **454 assertion total** |
| E2E pasca-6h | **242/242 assertion lulus** (13 skrip, satu per satu, Chromium 1243 headless, sesi review); sebelumnya 0/242 karena localhost diblokir di sesi pembuat |
| Sabotase Etalase | getter `rows` dikosongkan di salinan -> `shelf.e2e.py` dan `penjualan.e2e.py` **GAGAL**, `etalase-view.test.mjs` **GAGAL** (terbukti tertangkap) |

Pengurangan bersih legacy dari v9.34 adalah 4.430 byte setelah baris pemasangan modul ditambahkan. Penyebut persentase tetap 193.312 byte.

## Keputusan lingkup 6h
- Dipindah: `errModel` 734 byte, `actNoteModel` 433, `shopChips` 965, `shopPrice` 1.590, `shop` 1.575. Total badan fungsi lama 5.297 byte.
- Dependensi diukur ulang dari badan fungsi. `A`, `rows`, `PRM`, `CFG`, `VUSE`, `curP`, `vbest` dibaca lewat getter agar penggantian objek saat restore terbaca. `actL` dan `ptp` dibungkus; `shop` tetap binding `var` global.
- Tidak dipindah: `setStock` 173 byte, `etUn` 52, `etSet` 297, `etAll` 69, `clearMark` 86, `goProd` 607 (total 1.284 byte). Fungsi ini mengurus event stok/timer, navigasi dan fokus DOM, bukan kelompok model/render Etalase.
- Loader legacy tetap dipertahankan.

## Bukti E2E dan langkah berikutnya
Pemilik melaporkan 13 E2E = **242 assertion** lulus di Chromium lokal dan GitHub Actions pada v9.34. Itu baseline sebelum 6h, bukan bukti v9.35.

## Bukti E2E v9.35 (diukur ulang pada sesi review)
Dijalankan satu per satu dengan `CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (localhost TIDAK diblokir di sesi ini): `load 8, shelf 20, hitung 13, sqlite-fallback 8 (backend sqlite aktif, Wasm terpasang), voucher 31, penjualan 27, voucher-panel 39, dialog 19, tarif 19, peringatan 19, hasil 18, cadangan 12, kartu-update 9` = **242, semuanya exit 0**.

Sabotase (di salinan, bisa diulang: `bash scripts/sabotase-etalase.sh`): di `js/etalase-view.js` fungsi `shop` dibuat memakai `rows=[]`. Hasil: `shelf.e2e.py` gagal (kartu tidak muncul), `penjualan.e2e.py` gagal, `hitung.e2e.py` tetap lulus (wajar, tab Hitung tidak memakai Etalase), `etalase-view.test.mjs` gagal.

**Berikutnya:** (1) opsional tetapi disarankan: pemilik menjalankan job E2E GitHub Actions untuk ZIP ini sebagai konfirmasi di lingkungan kedua; (2) bila lulus, tahap 6i boleh dimulai (satu tahap per sesi). Lingkungan sesi review = Linux sandbox headless; ini bukan HP nyata.

## Hal yang tetap belum terbukti
- E2E v9.35 di GitHub Actions milik pemilik (di sandbox review sudah lulus 242/242, lihat atas).
- Uji offline Service Worker; uji HP nyata.
- Pemulihan ERP dengan data besar; cadangan/ekspor ASLI milik pemilik; migrasi data v5.82 riil; backup/restore lintas perangkat; restore lewat UI lalu mengubah tarif.
- Paket belum boleh menggantikan aplikasi produksi.
