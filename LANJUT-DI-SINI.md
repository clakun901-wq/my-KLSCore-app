# LANJUT-DI-SINI (v4, paket v9.41)

**Panduan sesi:** aturan pemilik, cara kerja, definisi selesai, uji manual, format laporan, dan aturan berhenti tetap seperti `LANJUT-DI-SINI-v2.md` (Bagian 1-3 dan 5-10). Posisi terbaru di bawah menggantikan posisi v3. Kerjakan SATU tahap per sesi.

## Posisi saat ini

Tahap 0-4 selesai (v9.36-v9.40). **Tahap 5 sudah dipindahkan secara kode ke v9.41, tetapi BELUM boleh dinyatakan selesai** karena E2E browser belum berhasil dijalankan di sandbox sesi ini dan belum ada hasil GitHub Actions pemilik.

| Ukuran | Nilai |
|---|---:|
| Versi paket | v9.41 (`package.json` 0.9.41; cache SW v9.41) |
| Global di `js/app-core.js` | 177 |
| Global lintas bagian | 90 (sebelumnya 90; penghubung yang diperlukan masih ada) |
| `npm test` | exit 0; tes Tahap 5: 61 assertion |
| Kesetaraan bagian 60 | 51 pernyataan sama dengan fixture v9.40 |
| E2E Tahap 5 | Belum diuji: Chromium memblokir akses `127.0.0.1` di sandbox sesi |

## Tahap 5 (`60-tab-impor-sinkron`)

Isi 51 pernyataan asli bagian 60 dipindahkan ke `js/tab-impor-sinkron.js` dalam factory `createTabImporSinkron`. `State` dan `KStore` diimpor langsung; fungsi yang masih dipakai bagian lain tersedia lewat penerus kompatibilitas. `parseCsv.bad` diteruskan melalui getter/setter karena bagian XLSX lama membaca status parser itu. Modul sudah didaftarkan di `sw.js`.

Bukti otomatis yang sudah dijalankan:
- `npm test`: LULUS (termasuk golden-master uang, peta global, tes kompatibilitas, dan tes Tahap 5).
- `node --check` untuk `js/app-core.js` dan `js/tab-impor-sinkron.js`: LULUS.
- `python -m py_compile tests/e2e/tahap5.e2e.py`: LULUS.
- `node scripts/peta-global.mjs`: 177 global, 90 lintas bagian, 0 penugasan ulang langsung variabel inti.

## Berikutnya (masih Tahap 5, jangan mulai Tahap 6)

1. Unggah ZIP v9.41 ke repositori GitHub.
2. Buka Actions → **Uji E2E Browser** → Run workflow.
3. Workflow kini menjalankan 16 skrip E2E, termasuk `tahap4` dan `tahap5`.
4. Laporkan hasil dan nama skrip yang gagal. Jika ada satu kegagalan, berhenti dan perbaiki Tahap 5; jangan lanjut ke Tahap 6.

## Risiko dan hal belum terbukti

E2E Tahap 5, E2E GitHub Actions, uji HP nyata, offline Service Worker, dan uji manual Bagian 7 v2 belum terbukti. Paket v9.41 belum boleh menggantikan aplikasi produksi atau data toko asli.
