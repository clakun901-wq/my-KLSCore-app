/* Worker SQLite Kalsara (Tahap 3).
 *
 * - Wasm dimuat dari ../vendor/sqlite-wasm/ (dibundel lokal, tanpa CDN).
 * - Penyimpanan memakai VFS "OPFS SAH Pool": tidak membutuhkan SharedArrayBuffer,
 *   jadi tidak perlu header COOP/COEP dan dapat berjalan di GitHub Pages.
 * - Konsekuensi SAH Pool: hanya SATU koneksi (satu tab) yang dapat membuka database
 *   pada satu waktu. Penjaga multi-tab ada di js/storage.js (Web Locks).
 * Jika file Wasm tidak ada, Worker membalas error berkode 'wasm-missing' dan
 * storage.js memakai jalur jurnal OPFS lama (selama belum pernah beralih ke SQLite).
 */
import { createStoreService } from '../js/sqlite-engine.js';

const WASM_MODULE = '../vendor/sqlite-wasm/sqlite3.mjs';
const POOL = { name: 'kalsara-sahpool', directory: '/kalsara-sqlite', initialCapacity: 6 };
const DB_FILE = '/kalsara.sqlite3';

function coded(code, message, cause) {
  const e = new Error(message); e.code = code; if (cause) e.cause = cause; return e;
}

async function openWasmDb() {
  let mod;
  try { mod = await import(WASM_MODULE); }
  catch (e) { throw coded('wasm-missing', 'File SQLite Wasm tidak ditemukan di vendor/sqlite-wasm/ (jalankan scripts/fetch-sqlite-wasm.mjs).', e); }
  const sqlite3 = await mod.default({ print() {}, printErr() {} });
  if (typeof sqlite3.installOpfsSAHPoolVfs !== 'function') throw coded('sahpool-unsupported', 'Build SQLite Wasm ini tidak menyediakan OPFS SAH Pool.');
  let pool;
  try { pool = await sqlite3.installOpfsSAHPoolVfs(POOL); }
  catch (e) { throw coded('sahpool-failed', 'Penyimpanan OPFS untuk SQLite tidak dapat dibuka: ' + (e?.message || e), e); }
  const db = new pool.OpfsSAHPoolDb(DB_FILE);
  return {
    exec(sql) { db.exec(sql); },
    run(sql, bind = []) { db.exec({ sql, bind }); },
    all(sql, bind = []) { return db.exec({ sql, bind, rowMode: 'array', returnValue: 'resultRows' }); },
    close() { db.close(); }
  };
}

const service = createStoreService(openWasmDb);
// Permintaan diproses berurutan agar transaksi tidak saling menyela.
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  const { id, type, payload } = data || {};
  queue = queue.then(async () => {
    try { self.postMessage({ id, ok: true, result: await service.handle(type, payload) }); }
    catch (e) { self.postMessage({ id, ok: false, error: e?.message || String(e), code: e?.code }); }
  });
};
