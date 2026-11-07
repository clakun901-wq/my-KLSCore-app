/* SATU-SATUNYA sumber nomor versi (Tahap 8, v9.45).
 * app   = versi logika bisnis Kalsara yang dipertahankan (v5.82), tampil di panel Pembaruan.
 * paket = nomor paket migrasi; dipakai nama cache Service Worker (kalsara-v<app>-client-v<paket>).
 * Sengaja berupa skrip biasa (bukan export) supaya bisa dimuat dua cara dari SATU berkas:
 *   import './version.js' di modul halaman (js/main.js) dan importScripts('./js/version.js') di sw.js.
 * package.json dan README tidak boleh berbeda: tests/tahap8.test.mjs memeriksanya. */
globalThis.KALSARA_VERSION=Object.freeze({app:'5.82',paket:'9.48'});
