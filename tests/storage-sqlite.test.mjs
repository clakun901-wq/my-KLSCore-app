import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStoreService, migrate, loadAll } from '../js/sqlite-engine.js';
import { createSqliteBackend } from '../js/sqlite-client.js';
import { openNodeDb, fakeWorkerFactory, fakeOpfsRoot } from './helpers/node-sqlite.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; }; const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

const files = new Map();
const dbFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kls-st-')), 'kalsara.sqlite3');
const root = fakeOpfsRoot(files);
let locks;
Object.defineProperty(globalThis, 'navigator', { configurable: true, get: () => ({ storage: { async getDirectory() { return root; }, async persist() { return true; } }, locks }) });
globalThis.window = { dispatchEvent() {} };
const oldWarn = console.warn, oldError = console.error; console.warn = () => {}; console.error = () => {};

const hooks = { before: null };
const factory = () => async () => createSqliteBackend(fakeWorkerFactory(createStoreService(async () => openNodeDb(dbFile)), { before: m => hooks.before?.(m) }));
const peek = () => { const d = openNodeDb(dbFile); migrate(d); const r = { data: loadAll(d), raw: d }; return r; };
let boot = 0;
const fresh = async () => (await import('../js/storage.js?boot=' + (++boot)));

// Jurnal lama (v9.10) yang akan diimpor ke SQLite
const journal = [
  { k: 'alpha', v: '1', del: false, at: 1 },
  { k: 'kalsara_erp_opex', v: JSON.stringify({ 'opx-1': { id: 'opx-1', date: '2026-11-01', amount: 100, category: 'Sewa' }, 'opx-2': { id: 'opx-2', date: '2026-11-02', amount: 200, category: 'Utilitas' } }), del: false, at: 2 },
  { k: 'kalsara_erp_products', v: '{"p1":{"id":"p1","name":"Produk"}}', del: false, at: 3 },
  { k: 'hapus-saya', v: 'x', del: false, at: 4 },
  { k: 'hapus-saya', v: '', del: true, at: 5 }
].map(e => JSON.stringify(e)).join('\n') + '\n';
files.set('kalsara-delta.log', journal);

// 1. Boot pertama: impor atomik dari jurnal
let S = await fresh();
await S.initStorage({ backendFactory: factory() });
eq(S.KStore.backend, 'sqlite', 'mode SQLite aktif bila backend tersedia');
eq(S.KStore.getItem('alpha'), '1', 'key-value dari jurnal tersedia');
eq(S.KStore.getItem('hapus-saya'), null, 'key yang dihapus di jurnal tidak ikut');
eq((await S.KStore.erpAll('opex')).map(r => r.id), ['opx-1', 'opx-2'], 'ERP dari jurnal masuk ke tabel domain');
eq(JSON.parse(S.KStore.getItem('kalsara_erp_opex'))['opx-2'].amount, 200, 'key kompatibilitas ERP dibentuk dari tabel');
eq(files.get('kalsara-delta.log'), journal, 'jurnal lama tidak diubah (sumber pemulihan)');
eq(JSON.parse(files.get('kalsara-backend.json')).authoritative, 'sqlite', 'penanda backend ditulis');
let p = peek();
ok(p.data.meta.journal_imported_at, 'penanda impor tercatat di SQLite');
eq(p.data.kv.map(([k]) => k).sort(), ['alpha', 'kalsara_erp_products'], 'kv di SQLite');
eq(p.data.erp.opex.length, 2, 'baris ERP ada di tabel');
p.raw.close();

// 2. Penulisan masuk SQLite, bukan jurnal
S.KStore.setItem('beta', '2'); await S.KStore.flush();
await S.KStore.erpPut('opex', [{ id: 'opx-3', date: '2026-11-03', amount: 300, category: 'Sewa' }]);
await S.KStore.erpPut('products', [{ id: 'p2', name: 'Dua' }]);
p = peek();
ok(p.data.kv.some(([k, v]) => k === 'beta' && v === '2'), 'setItem tersimpan di SQLite');
eq(p.data.erp.opex.map(([id]) => id), ['opx-1', 'opx-2', 'opx-3'], 'erpPut menulis baris domain');
eq(Object.keys(JSON.parse(p.data.kv.find(([k]) => k === 'kalsara_erp_products')[1])).sort(), ['p1', 'p2'], 'entitas non-domain tetap kv');
p.raw.close();
eq(files.get('kalsara-delta.log'), journal, 'jurnal tidak ditulis lagi setelah beralih ke SQLite');
await S.KStore.erpDelete('opex', 'opx-1');
eq((await S.KStore.erpAll('opex')).map(r => r.id), ['opx-2', 'opx-3'], 'erpDelete');
const rows = await S.KStore.erpAll('opex'); rows[0].amount = -1;
eq((await S.KStore.erpAll('opex'))[0].amount, 200, 'erpAll mengembalikan salinan (mutasi pemanggil tidak merusak store)');
eq(S.KStore.length, S.KStore.length, 'length stabil'); ok(S.KStore.key(0) !== null, 'key(i) berfungsi');

// 2b. Laporan ERP lewat KStore: menunggu penulisan antre, hasil cocok dengan isi tabel
await S.KStore.erpPut('marketplaces_raw', [{ id: 'm1', date: '2026-11-01', gross_revenue: 50000, fv: -2000, qty: 1 }, { id: 'm2', date: '2026-10-01', gross_revenue: 7000 }]);
const rep = await S.KStore.erpReport(['2026-11', '']);
eq([rep[0].count, rep[0].sums.om, rep[0].sums.fv, rep[1].count, rep[1].sums.om], [1, 50000, -2000, 2, 57000], 'erpReport menjumlah di SQLite');
eq(rep[0].ox, 500, 'OpEx November = opx-2 (200) + opx-3 (300) dari data uji sebelumnya'); eq((await S.KStore.erpReport(['2026-11'])).length, 1, 'satu hasil per bulan diminta');

// 3. Kegagalan tulis: rollback ke nilai durabel, flush melapor
hooks.before = m => { if (m.type === 'apply') { hooks.before = null; throw new Error('simulated disk full'); } };
S.KStore.setItem('alpha', '999');
await assert.rejects(S.KStore.flush(), /alpha.*disk full/); n++;
eq(S.KStore.getItem('alpha'), '1', 'nilai optimistis dikembalikan ke nilai durabel');
S.KStore.setItem('alpha', '1b'); await S.KStore.flush();
eq(peek().data.kv.find(([k]) => k === 'alpha')[1], '1b', 'penulisan berikutnya memulihkan status');
hooks.before = m => { if (m.type === 'apply') { hooks.before = null; throw new Error('simulated disk full'); } };
await assert.rejects(S.KStore.erpPut('opex', [{ id: 'gagal', amount: 1 }]), /disk full/); n++;
eq((await S.KStore.erpAll('opex')).map(r => r.id), ['opx-2', 'opx-3'], 'ERP gagal tulis disinkronkan ulang dari tabel (baris gagal hilang)');
await S.KStore.erpPut('opex', [{ id: 'opx-4', amount: 4 }]);
eq((await S.KStore.erpAll('opex')).map(r => r.id), ['opx-2', 'opx-3', 'opx-4'], 'ERP pulih setelah penulisan sukses');

// 4. Backup / restore atomik, termasuk ERP
const backup = await S.KStore.exportSnapshot();
const parsed = JSON.parse(backup);
ok(parsed.alpha === '1b' && JSON.parse(parsed.kalsara_erp_opex)['opx-4'], 'snapshot memuat kv dan ERP (format v5.82 kompatibel)');
S.KStore.setItem('sementara', 'ya'); await S.KStore.erpClear('opex');
await S.KStore.flush();
eq((await S.KStore.erpAll('opex')).length, 0, 'erpClear');
eq(S.KStore.getItem('kalsara_erp_opex'), null, 'koleksi kosong => key kompatibilitas null');
await S.KStore.importSnapshot(backup);
eq(S.KStore.getItem('sementara'), null, 'restore menghapus key di luar snapshot');
eq((await S.KStore.erpAll('opex')).length, 3, 'restore mengembalikan baris ERP');
const stateBefore = JSON.stringify(loadSnapshot());
function loadSnapshot() { const q = peek(); q.raw.close(); return q.data; }
await assert.rejects(S.KStore.importSnapshot(JSON.stringify({ x: '1', kalsara_erp_opex: '[1,2]' })), /tidak valid/); n++;
eq(JSON.stringify(loadSnapshot()), stateBefore, 'restore gagal tidak mengubah database (semua-atau-tidak-sama-sekali)');
eq((await S.KStore.erpAll('opex')).length, 3, 'state memori tetap utuh setelah restore gagal');
S.KStore.setItem('kalsara_erp_opex', JSON.stringify({ k: { id: 'k', amount: 1 } })); await S.KStore.flush();
eq((await S.KStore.erpAll('opex')).map(r => r.id), ['k'], 'setItem pada key ERP (jalur migrasi main.js) mengganti koleksi via tabel domain');
S.KStore.removeItem('kalsara_erp_opex'); await S.KStore.flush();
eq((await S.KStore.erpAll('opex')).length, 0, 'removeItem key ERP mengosongkan koleksi');
await S.KStore.importSnapshot(backup);

// 5. Boot ulang: SQLite otoritatif, jurnal tidak diimpor ulang
files.set('kalsara-delta.log', journal + JSON.stringify({ k: 'hantu', v: 'jurnal usang', del: false, at: 9 }) + '\n');
S = await fresh();
await S.initStorage({ backendFactory: factory() });
eq(S.KStore.getItem('alpha'), '1b', 'data bertahan lintas boot');
eq(S.KStore.getItem('hantu'), null, 'jurnal usang tidak diimpor lagi setelah beralih');
eq((await S.KStore.erpAll('opex')).length, 3, 'ERP bertahan lintas boot');

// 6. Penjaga stale: SQLite wajib bila penanda ada
S = await fresh();
const broken = async () => { const e = new Error('File SQLite Wasm tidak ditemukan'); e.code = 'wasm-missing'; throw e; };
await assert.rejects(S.initStorage({ backendFactory: broken }), e => e.code === 'sqlite-required' && /usang/.test(e.message)); n++;

// 7. Tanpa penanda & tanpa SQLite: jalur jurnal lama tetap berjalan
files.delete('kalsara-backend.json');
files.set('kalsara-delta.log', journal);
S = await fresh();
await S.initStorage({ backendFactory: broken });
eq(S.KStore.backend, 'journal', 'jatuh ke jurnal hanya bila belum pernah beralih');
eq(S.KStore.getItem('alpha'), '1', 'jalur jurnal membaca data lama');
eq(await S.KStore.erpReport(['']), null, 'mode jurnal: erpReport null (pemanggil memakai hitungan JS)');
S.KStore.setItem('lewat-jurnal', 'ok'); await S.KStore.flush();
ok(files.get('kalsara-delta.log').includes('lewat-jurnal'), 'jalur jurnal masih menulis ke jurnal');
files.set('kalsara-delta.log', journal);

// 8. Penjaga multi-tab (Web Locks)
let released = 0;
locks = { request: (name, opts, cb) => Promise.resolve(cb(null)) };
S = await fresh();
await assert.rejects(S.initStorage({ backendFactory: factory() }), e => e.code === 'another-tab'); n++;
locks = { request: (name, opts, cb) => { const r = cb({ name }); return r.then(() => { released++; }); } };
S = await fresh();
await S.initStorage({ backendFactory: broken }); // tidak ada penanda => jurnal; kunci harus dilepas
await new Promise(r => setTimeout(r, 5));
eq(released, 1, 'kunci tab dilepas bila SQLite tidak dipakai');
files.delete('kalsara-backend.json');
S = await fresh();
await S.initStorage({ backendFactory: factory() });
await new Promise(r => setTimeout(r, 5));
eq(released, 1, 'kunci tab dipegang selama SQLite aktif');
locks = undefined;

// 9. Impor pertama gagal: tidak jatuh diam-diam ke jurnal setelah penanda ditulis
files.delete('kalsara-backend.json'); fs.rmSync(dbFile, { force: true });
files.set('kalsara-delta.log', journal);
hooks.before = m => { if (m.type === 'apply') throw new Error('simulated import failure'); };
S = await fresh();
await assert.rejects(S.initStorage({ backendFactory: factory() }), e => e.code === 'sqlite-required'); n++;
hooks.before = null;
S = await fresh();
await S.initStorage({ backendFactory: factory() });
eq(S.KStore.getItem('alpha'), '1', 'impor diulang dengan benar pada boot berikutnya (jurnal tetap utuh)');

// 10. Klien Worker: timeout menggagalkan permintaan, bukan menggantung
const hang = createSqliteBackend(() => ({ postMessage() {}, terminate() {} }), { timeoutMs: 20 });
await assert.rejects(hang.request('load'), e => e.code === 'timeout'); n++;
await assert.rejects(hang.request('load'), /batas waktu/); n++;
console.warn = oldWarn; console.error = oldError;
console.log(`Storage SQLite mode (SQLite nyata + Worker palsu): ${n} assertions passed`);
