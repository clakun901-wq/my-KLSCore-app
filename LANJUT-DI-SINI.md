# LANJUT-DI-SINI (v5) - posisi setelah Tahap 6 (v9.42)

Untuk AI di percakapan baru: baca berkas ini dan LANJUT-DI-SINI-v2.md (rencana tahap). Jangan membaca seluruh MIGRATION-STATUS.md. Kerjakan SATU tahap per sesi.

## Posisi (dibuktikan)
- Tahap 0-5 SELESAI. Tahap 5 terbukti: npm test exit 0 dan 16 E2E LULUS di GitHub Actions milik pemilik (v9.41).
- Tahap 6 (v9.42): bagian 20-hitung-etalase pindah ke js/hitung-etalase.js. Status: KODE SELESAI, MENUNGGU E2E GITHUB (17 skrip).
  - Di sandbox sesi: 41 berkas tes unit lulus, tests/hitung-etalase.test.mjs 99 assertion (45 dari 45 pernyataan cocok fixture v9.41; 7 penyesuaian nama terdokumentasi), 16 E2E lama lulus, tahap6.e2e.py 21 assertion lulus (juga lulus di v9.41 asli).
  - Sabotase terbukti tertangkap unit dan E2E.
- Ukuran: 148 nama global di app-core.js (dari 177); lintas bagian masih 90 (turun saat bagian 30/40/50/95 dipindah). Sisa app-core.js: bagian 00,10,20(pemasangan),30,40,50,60(pemasangan),70,80(pemasangan),90,95,99.
- Belum terbukti: uji HP nyata, offline Service Worker, uji manual Bagian 7 v2, data toko asli. Paket BELUM boleh menggantikan produksi.

## Catatan temuan (di luar tahap, belum diperbaiki)
1. BUG LAMA: tombol #add (tab-impor-sinkron.js) memanggil .focus() pada input kartu baru; di atas 40 produk kartu belum terhidrasi sehingga error sekali dan upd(false) terlewat. Ada di v9.41. Perlu persetujuan pemilik sebelum diperbaiki (tes tahap6 mengizinkan persis satu error ini).
2. globalThis.KShelf dibaca langsung di hitung-etalase.js (ada di teks asli); jadikan dependensi eksplisit.
3. DUGAAN belum diperiksa: tab-impor-sinkron menerima PSIG sebagai nilai salinan, bukan dibaca ulang.

## Berikutnya (Tahap 7 menurut v2: 50-promosi, 40 KB, dua sesi bila perlu)
Pola: peta acorn -> pabrik createXxx -> fixture teks asli -> tes kesetaraan -> E2E -> daftar di package.json dan e2e.yml -> sabotase -> sw.js, versi, node scripts/peta-global.mjs.
Hati-hati: tab/tchk dibungkus ulang (wrapTab/wrapTchk lewat HE.wrapTchk); PSEL/PSIG/CFG ditulis/dibaca lintas modul lewat penerus.
