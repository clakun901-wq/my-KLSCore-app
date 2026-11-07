# LANJUT-DI-SINI (v6) - posisi setelah Tahap 7a (v9.43)

Untuk AI di percakapan baru: baca berkas ini dan `LANJUT-DI-SINI-v2.md` (aturan sesi dan rencana tahap). Jangan membaca seluruh `MIGRATION-STATUS.md`. Kerjakan SATU tahap per sesi. Jangan mulai Tahap 7b sebelum pemilik melaporkan hasil GitHub Actions v9.43.

## Posisi pekerjaan

- Tahap 0-6 selesai di kode. Tahap 6 (`20-hitung-etalase` -> `js/hitung-etalase.js`) sudah dilaporkan lulus oleh pemilik di GitHub Actions v9.42.
- **Tahap 7a selesai di kode, MENUNGGU GitHub Actions pemilik.** Bagian panel dan tampilan promosi dipindah ke `js/promosi-panel.js`. Logika data dan voucher tetap di bagian 50 `app-core.js` untuk Tahap 7b.
- Pemindahan 7a: 47 pernyataan dipindah dan dibandingkan satu per satu dengan fixture v9.42; 38 sambungan eksplisit ke nama/state yang tetap berada di `app-core.js`; `PSEL` dibaca/ditulis lewat getter/setter. Fungsi yang masih dipakai bagian lain tetap tersedia lewat penerus.
- Sisa bagian 50 di `app-core.js`: **9.352 byte, 26 pernyataan tingkat atas**. Yang sengaja ditunda ke 7b termasuk `migPt`, `psig`, `ptp`, `CFG`, aturan/data voucher, dan pembuat promosi.

## Bukti dan status pengujian

- Baseline v9.42: pemilik mengirim log `npm test` exit 0 dan **17/17 E2E** lulus di Chromium nyata pada lingkungannya.
- v9.43 di sandbox sesi: `npm test` exit 0; tes baru `tests/promosi-panel.test.mjs` membuktikan 47/47 pernyataan sama dengan fixture, 38 sambungan eksplisit, dan sabotase selector tertangkap. `tests/legacy-split.test.mjs` 166 assertion; laporan audit legacy kumulatif 585 assertion. Golden-master lama tetap berjalan dan cocok.
- Peta global v9.43: 120 global di `app-core.js`, 90 global lintas bagian/berkas, 0 penugasan ulang langsung variabel inti. `node scripts/peta-global.mjs --check` sudah dijalankan dan exit 0.
- **E2E v9.43 belum diuji di sandbox.** Chromium sistem di sandbox menolak membuka server lokal dengan `ERR_BLOCKED_BY_ADMINISTRATOR`. E2E baru `tests/e2e/tahap7a.e2e.py` sudah ditambahkan (alur pilih jenis, tambah, ubah, cari produk, isi otomatis harga/diskon, simpan, hapus, dan sabotase), tetapi belum dijalankan. Belum terbukti juga bahwa skrip E2E baru berjalan pada ZIP v9.42 asli sebagai pembanding.
- Hasil GitHub Actions v9.43: **BELUM ADA**. Jangan menyebut Tahap 7a lulus GitHub sebelum pemilik mengirim hasilnya.

## Angka peta dan ukuran

| Ukuran | v9.42 sebelum 7a | v9.43 setelah 7a |
|---|---:|---:|
| Bagian 50 di `app-core.js` | 40.283 byte | 9.352 byte |
| Modul baru `js/promosi-panel.js` | — | 33.193 byte |
| Global di `app-core.js` | 148 | 120 |
| Global lintas bagian/berkas | 90 | 90 |
| Penugasan ulang langsung variabel inti | 0 | 0 |
| Pernyataan yang dipindah dan dibandingkan | — | 47 |
| Pernyataan tingkat atas tersisa di bagian 50 |  — | 26 |

Catatan: peta menghitung global dari `app-core.js`; 38 sambungan factory baru diaudit terpisah oleh tes `promosi-panel.test.mjs`.

## Catatan bug lama - JANGAN DIPERBAIKI PADA TAHAP 7a

- Pada daftar **lebih dari 40 produk**, tombol **Tambah produk** (`#add`) dan tombol bulat **+** (`#fab`) dapat memunculkan pageerror `Cannot read properties of null (reading 'focus')`.
- Penyebab yang sudah diketahui: kartu baru masih berupa cangkang kosong karena hidrasi malas (`HY_ALL=40`); `js/tab-impor-sinkron.js` baris 8 menjalankan `c.querySelector('input').focus()` padahal hasil pencarian input masih `null`.
- Bug ini juga ada di ZIP v9.41 asli. Pemilik sengaja menunda perbaikannya ke Tahap 8 setelah struktur selesai.
- Jangan memperbaikinya pada Tahap 7a/7b dan jangan membuat E2E yang menekan `#add` atau `#fab` pada daftar lebih dari 40 produk.

## Berikutnya

1. Pemilik mengunggah ZIP v9.43 ke GitHub.
2. Buka **Actions** -> **Uji E2E Browser** -> **Run workflow** dan tunggu semua pemeriksaan selesai.
3. Kirim log `npm test` dan hasil seluruh 18 E2E (angka lulus/gagal serta nama skrip gagal bila ada).
4. Jika satu tes gagal, berhenti dan perbaiki di tahap yang sama atau kembali ke ZIP v9.42. Jangan mulai 7b.
5. Jika semua pemeriksaan GitHub lulus, sesi berikutnya boleh mengerjakan **Tahap 7b saja**.

## Belum terbukti (tetap dibawa)

- Uji HP/peramban nyata milik pemilik; uji offline Service Worker.
- Uji manual Bagian 7 pada `LANJUT-DI-SINI-v2.md`.
- ERP dengan data besar, cadangan/ekspor asli, migrasi data v5.82 riil, dan pemulihan lintas perangkat.
- E2E 7a pada v9.42 asli dan v9.43 di GitHub Actions.
- Paket belum boleh menggantikan aplikasi produksi.
