# SQLite Wasm (dibundel lokal)

Folder ini diisi oleh `node scripts/fetch-sqlite-wasm.mjs` (butuh jaringan sekali, di mesin Anda). Berkas yang dibutuhkan:

- `sqlite3.mjs` dan `sqlite3.wasm`
- `VERSION.json` (versi + SHA-256), diverifikasi oleh `npm run vendor:check`

Tanpa berkas ini aplikasi tetap berjalan memakai jurnal OPFS lama, dan baru beralih ke SQLite ketika berkas tersedia.
Commit folder ini bersama aplikasi agar dilayani dari origin yang sama (GitHub Pages) dan masuk cache Service Worker untuk pemakaian offline.
