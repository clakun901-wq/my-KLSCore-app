# LANJUT-DI-SINI (v7) — posisi setelah Tahap 7b (v9.44)

Untuk AI di sesi berikutnya: baca dokumen ini dan `LANJUT-DI-SINI-v2.md` milik pemilik. Kerjakan SATU tahap per sesi. **Tahap 8 belum dimulai.** Jangan membaca seluruh `MIGRATION-STATUS.md`; buka hanya bagian yang diperlukan.

## Posisi dan hasil sesi

- Tahap 0–6: selesai.
- Tahap 7a: panel/tampilan promosi dipindah ke `js/promosi-panel.js`; pemilik melaporkan GitHub Actions v9.43b `npm test` exit 0 dan 18/18 E2E lulus.
- Tahap 7b: kode data promosi dan voucher dipindah ke `js/promosi-data.js` dengan factory `createPromosiData(D)` dan sambungan eksplisit.
- Kode kandidat ini bernama **v9.44**. Ini belum menjadi paket produksi dan belum boleh menggantikan aplikasi toko asli.

## Perubahan Tahap 7b

- Dipindah: `CFG`, `PORD`, `migPt`, `ptp`, `psig`, `calcNV`, `vsc`, `vscT`, `vscn`, `vnote`, `vcSoon`, `vwarn`, `vcWhy`, `vcEff`, `fwdV`, `bis`, `pcalc2`, dan `actPromo`.
- `State.PRM`, `PSEL`, dan `PSIG` tetap berada di `app-core.js` sebagai keadaan bersama/penyambung yang masih dipakai bagian lain. Panel 7a tetap di modulnya sendiri.
- `CalcCache.invalidate()` tetap dijalankan pada saat modul data promosi dipasang, seperti sebelumnya.
- `js/app-core.js` kini hanya memasang modul data promosi dan meneruskan nama fungsi lama ke modul. Logika inti tidak ditulis ulang.
- Cache offline Service Worker ditambah `js/promosi-data.js`; nomor paket/cache diperbarui menjadi v9.44.
- Golden-master sekarang mengambil baseline data promosi v9.43b dari fixture khusus, agar pembanding tidak membandingkan modul baru dengan dirinya sendiri.

## Pemeriksaan

| Pemeriksaan | Hasil | Lingkungan |
|---|---|---|
| `npm test` | **Lulus**, exit 0; 44 skrip tes | Sandbox sesi |
| Golden-master kalkulator | 2.010 assertion identik | Sandbox sesi |
| Golden-master voucher | 112 assertion identik | Sandbox sesi |
| Golden-master Promo/Paket Diskon | 205 assertion identik | Sandbox sesi |
| Golden-master aturan harga promo | 200 assertion identik | Sandbox sesi |
| Golden-master Kombo/Hadiah | 100 assertion identik | Sandbox sesi |
| Golden-master pipa hitung | 1.500 assertion identik | Sandbox sesi |
| Tes baru `promosi-data.test.mjs` | Lulus; 15 fungsi cocok dengan baseline; migrasi, harga promo, psig, bis, dan VNO diuji | Sandbox sesi |
| Audit peta global | Lulus; 121 global, 90 lintas berkas, 0 penugasan ulang inti langsung | Sandbox sesi |
| 19 E2E Chromium | **Belum diuji** | Sandbox sesi memblokir `localhost` dengan `ERR_BLOCKED_BY_ADMINISTRATOR`; perlu GitHub Actions pemilik |
| Uji HP/offline/restore nyata | **Perlu uji manual** | Perangkat pemilik |

Catatan: percobaan E2E di sandbox tidak berhasil memulai navigasi localhost karena pembatasan lingkungan. Ini bukan hasil lulus atau gagal dari aplikasi. Jangan menyebut E2E v9.44 lulus sebelum log GitHub Actions pemilik tersedia.

## File yang berubah/baru

- Baru: `js/promosi-data.js`
- Baru: `tests/promosi-data.test.mjs`
- Baru: `tests/fixtures/app-core.bagian50-data.pre_v9_44.js.txt`
- Baru: `tests/e2e/tahap7b.e2e.py`
- Diubah: `js/app-core.js`, `sw.js`, `package.json`, `.github/workflows/e2e.yml`, `tests/legacy-split.test.mjs`, `tests/golden-master.test.mjs`, `README.md`, `laporan/PETA-GLOBAL.md`.

## Berikutnya — masih Tahap 7b

1. Pemilik unggah ZIP v9.44 ke GitHub.
2. Jalankan **Actions → Uji E2E Browser → Run workflow**.
3. Workflow kini menjalankan 19 E2E, termasuk `tahap7b`.
4. Kirim hasil `npm test` dan seluruh 19 E2E (jumlah lulus/gagal serta nama skrip gagal).
5. Jika satu tes gagal, berhenti dan perbaiki Tahap 7b atau kembali ke ZIP v9.43b. Jangan lanjut Tahap 8.

## Risiko/bukti yang masih kurang

- E2E v9.44 belum lulus di GitHub Actions pemilik.
- E2E Tahap 7b baru belum dijalankan pada browser yang dapat mengakses server lokal.
- Uji HP/peramban nyata, Service Worker offline, pemulihan data asli, data ERP besar, migrasi data riil, dan pemulihan lintas perangkat tetap belum terbukti.
- Masih ada 90 nama global lintas berkas; struktur global belum selesai. Ini pekerjaan Tahap 8, **jangan disentuh pada sesi ini**.

## Koreksi review v9.44 (sesi koreksi)

- Tes `tests/promosi-data.test.mjs` diperkuat: `CFG` dan `PORD` kini dibandingkan dengan baseline v9.43b. Sebelumnya hanya 15 fungsi yang dibandingkan. Isi `CFG` dan `PORD` terbukti identik; tidak ada perubahan kode aplikasi.
- Ditambahkan `state_tracker.txt` (sebelumnya tidak ada di ZIP).
- Status E2E v9.44 tetap: belum diuji di browser. Menunggu GitHub Actions pemilik.

## Koreksi review v9.44 (sesi koreksi)

- Tes `tests/promosi-data.test.mjs` diperkuat: `CFG` dan `PORD` kini dibandingkan dengan baseline v9.43b. Sebelumnya hanya 15 fungsi yang dibandingkan. Isi `CFG` dan `PORD` terbukti identik; tidak ada perubahan kode aplikasi.
- Ditambahkan `state_tracker.txt` (sebelumnya tidak ada di ZIP).
- Status E2E v9.44 tetap: belum diuji di browser. Menunggu GitHub Actions pemilik.
