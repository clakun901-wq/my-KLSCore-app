# LANJUT-DI-SINI (v3, paket v9.40)

**Untuk AI di percakapan baru:** berkas ini menggantikan `LANJUT-DI-SINI-v2.md`. Baca berkas ini dulu; jangan membaca seluruh `MIGRATION-STATUS.md` (arsip). Rencana, aturan pemilik, cara wasit, aturan berhenti, definisi selesai, uji manual, dan format laporan TETAP seperti di v2 (Bagian 1-3 dan 5-10 dokumen itu); hanya posisi di bawah yang berubah. Kerjakan SATU tahap per sesi.

## Posisi saat ini
Tahap 0, 1, 2, 3 selesai (v9.36-v9.39). **Tahap 4 selesai di v9.40** (kode, `npm test`, 15 E2E di sandbox sesi pembuat; GitHub Actions milik pemilik BELUM).

| Ukuran | Nilai |
|---|---:|
| Nama global di `js/app-core.js` | 194 (sebelumnya 227) |
| Nama global lintas bagian | **90** (belum turun; turun saat bagian 20/30/50/60/95 dipindah) |
| Bagian 80 | tinggal pemasangan + 9 fungsi penerus |
| Modul baru | `js/penyimpanan-cadangan.js` 10.689 B, `js/pengaturan.js` 6.912 B |
| `npm test` | exit 0 |
| E2E | 14 skrip lama + `tahap4.e2e.py` (23) lulus di sandbox |

## Berikutnya: Tahap 5 (`60-tab-impor-sinkron`, 22 KB)
Pola yang terbukti di Tahap 4: (1) petakan pernyataan tingkat atas dengan acorn (`scripts/vendor/acorn.mjs`); (2) salin teks apa adanya ke `createXxx({dependensi})`; (3) nama yang dipakai bagian lain tetap tersedia sebagai deklarasi function penerus (bagian 30/40 menyalin nilai saat muat; `lateCaptures` di `legacy-split.test.mjs` akan menolak bila tidak); (4) fixture teks asli + tes kesetaraan pernyataan seperti `penyimpanan-cadangan.test.mjs`; (5) E2E untuk bagian yang hanya hidup di browser; (6) sabotase.
Catatan: `tab` dan `tchk` dibungkus ulang di beberapa tempat; bagian 60 mendefinisikan `tab` (dibungkus oleh `wrapTab`), jadi hati-hati saat memindahkannya.

## Belum terbukti
E2E di GitHub Actions milik pemilik; uji HP nyata; offline Service Worker; uji manual Bagian 7 v2; data toko asli. Paket belum boleh menggantikan aplikasi produksi.
