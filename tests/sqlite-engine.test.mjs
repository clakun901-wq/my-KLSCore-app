import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { migrate, applyOps, loadAll, loadEntity, isEmptyData, createStoreService, SCHEMA_VERSION, erpEntityOfKey } from '../js/sqlite-engine.js';
import { openNodeDb } from './helpers/node-sqlite.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; }; const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// Migrasi: idempoten, versi skema tercatat, menolak skema yang lebih baru
let db = openNodeDb();
eq(migrate(db), { from: 0, to: SCHEMA_VERSION }, 'migrasi pertama membuat skema');
eq(migrate(db), { from: SCHEMA_VERSION, to: SCHEMA_VERSION }, 'migrasi kedua tidak berbuat apa-apa');
const tables = db.all("SELECT name FROM sqlite_master WHERE type='table'").map(r => r[0]);
for (const t of ['kv', 'meta', 'erp_marketplaces_raw', 'erp_order_items', 'erp_opex', 'erp_settings']) ok(tables.includes(t), 'tabel ' + t);
db.exec('PRAGMA user_version = 99');
assert.throws(() => migrate(db), /lebih baru/); n++;

// key-value
db = openNodeDb(); migrate(db);
applyOps(db, [{ op: 'put', k: 'a', v: '1' }, { op: 'put', k: 'b', v: '2' }, { op: 'put', k: 'a', v: '3' }]);
eq(db.all('SELECT k,v,rev FROM kv ORDER BY k'), [['a', '3', 2], ['b', '2', 1]], 'upsert menaikkan rev');
applyOps(db, [{ op: 'del', k: 'b' }]);
eq(loadAll(db).kv, [['a', '3']], 'del menghapus key');
eq(erpEntityOfKey('kalsara_erp_opex'), 'opex', 'key ERP domain dikenali');
eq(erpEntityOfKey('kalsara_erp_products'), null, 'products bukan entitas domain (tetap key-value)');

// ERP: kolom turunan, upsert menjaga urutan, hapus, kosongkan
db = openNodeDb(); migrate(db);
applyOps(db, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: [
  { id: 'm1', order_id: 'O1', sku: 'S1', date: '2026-11-01', gross_revenue: 100000, tp: 90000, qty: 2 },
  { id: 'm2', order_id: 'O2', sku: 'S2', date: '2026-11-02', gross_revenue: 12.5, tp: 'x', qty: 1 }] }]);
eq(db.all('SELECT id,order_id,sku,date,gross_revenue,released_amount,quantity FROM erp_marketplaces_raw ORDER BY rowid'),
  [['m1', 'O1', 'S1', '2026-11-01', 100000, 90000, 2], ['m2', 'O2', 'S2', '2026-11-02', null, null, 1]], 'kolom turunan; nilai non-integer menjadi NULL');
applyOps(db, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: [{ id: 'm1', order_id: 'O1', sku: 'S1', date: '2026-11-01', gross_revenue: 1, tp: 1, qty: 1 }] }]);
eq(loadEntity(db, 'marketplaces_raw').map(([id]) => id), ['m1', 'm2'], 'upsert baris lama tidak memindahkan urutannya');
eq(loadEntity(db, 'marketplaces_raw')[0][1].gross_revenue, 1, 'payload ikut diperbarui');
applyOps(db, [{ op: 'erp-put', entity: 'opex', rows: [{ id: 'x1', date: '2026-11-02', category: 'Sewa', amount: 7000, notes: 'n' }] },
  { op: 'erp-put', entity: 'order_items', rows: [{ id: 'i1', order_id: 'O1', sku: 'S1', qty: 3, price: 5000 }] },
  { op: 'erp-put', entity: 'settings', rows: [{ id: 's1', v: 1 }] }]);
eq(db.all('SELECT date,category,amount,notes FROM erp_opex'), [['2026-11-02', 'Sewa', 7000, 'n']], 'kolom opex');
eq(db.all('SELECT order_id,sku,quantity,price FROM erp_order_items'), [['O1', 'S1', 3, 5000]], 'kolom order_items');
applyOps(db, [{ op: 'erp-del', entity: 'marketplaces_raw', id: 'm1' }]);
eq(loadEntity(db, 'marketplaces_raw').map(([id]) => id), ['m2'], 'erp-del menghapus satu baris');
applyOps(db, [{ op: 'erp-clear', entity: 'marketplaces_raw' }]);
eq(loadEntity(db, 'marketplaces_raw'), [], 'erp-clear mengosongkan tabel');
ok(db.all("SELECT 1 FROM sqlite_master WHERE name='idx_erp_opex_date'").length === 1, 'indeks tanggal ada');

// key ERP lewat put/del masuk ke tabel domain, bukan kv
applyOps(db, [{ op: 'put', k: 'kalsara_erp_opex', v: JSON.stringify({ a: { id: 'a', amount: 1 }, b: { id: 'b', amount: 2 } }) }]);
eq(loadEntity(db, 'opex').map(([id]) => id), ['a', 'b'], 'put key ERP mengganti isi tabel');
eq(loadAll(db).kv.filter(([k]) => k.startsWith('kalsara_erp_')), [], 'key ERP domain tidak disimpan ganda di kv');
applyOps(db, [{ op: 'del', k: 'kalsara_erp_opex' }]);
eq(loadEntity(db, 'opex'), [], 'del key ERP mengosongkan tabel');

// Atomisitas: satu operasi gagal membatalkan seluruh batch
db = openNodeDb(); migrate(db);
applyOps(db, [{ op: 'put', k: 'keep', v: 'ya' }, { op: 'erp-put', entity: 'opex', rows: [{ id: 'o1', amount: 1 }] }]);
const before = JSON.stringify(loadAll(db));
for (const bad of [
  [{ op: 'put', k: 'baru', v: 'x' }, { op: 'put', k: 'kalsara_erp_opex', v: '[1,2]' }],
  [{ op: 'put', k: 'baru', v: 'x' }, { op: 'erp-put', entity: 'opex', rows: [{ amount: 5 }] }],
  [{ op: 'put', k: 'baru', v: 'x' }, { op: 'erp-clear', entity: 'bukan_entitas' }],
  [{ op: 'put', k: 'baru', v: 'x' }, { op: 'tidak-ada' }],
  [{ op: 'put', k: 'baru', v: 'x' }, { op: 'replace', snapshot: { kalsara_erp_opex: 'bukan json' } }]
]) { assert.throws(() => applyOps(db, bad)); eq(JSON.stringify(loadAll(db)), before, 'batch gagal tidak mengubah apa pun'); }

// replace (restore snapshot): hapus yang tidak ada di snapshot, pisahkan key ERP ke tabel
applyOps(db, [{ op: 'replace', snapshot: { k1: 'v1', kalsara_erp_opex: JSON.stringify({ z: { id: 'z', amount: 9 } }), kalsara_erp_products: '{"p":{"id":"p"}}' } }]);
const all = loadAll(db);
eq(all.kv, [['k1', 'v1'], ['kalsara_erp_products', '{"p":{"id":"p"}}']], 'replace menghapus key lama; products tetap kv');
eq(all.erp.opex, [['z', { id: 'z', amount: 9 }]], 'replace mengisi tabel domain');
ok(!isEmptyData(all) && isEmptyData(loadAll((() => { const d = openNodeDb(); migrate(d); return d; })())), 'isEmptyData');

// meta
applyOps(db, [{ op: 'meta', k: 'journal_imported_at', v: 't' }]);
eq(loadAll(db).meta, { journal_imported_at: 't' }, 'meta tersimpan');

// Durabilitas lintas koneksi (file sungguhan)
const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kls-')), 'k.sqlite3');
let d1 = openNodeDb(file); migrate(d1);
applyOps(d1, [{ op: 'put', k: 'persist', v: 'ok' }, { op: 'erp-put', entity: 'opex', rows: [{ id: 'p1', amount: 5 }] }]);
d1.close();
const d2 = openNodeDb(file); migrate(d2);
const reopened = loadAll(d2);
eq(reopened.kv, [['persist', 'ok']], 'kv bertahan setelah koneksi ditutup/dibuka ulang');
eq(reopened.erp.opex, [['p1', { id: 'p1', amount: 5 }]], 'baris ERP bertahan');
d2.close();

// Layanan pesan
const svc = createStoreService(async () => openNodeDb());
await assert.rejects(svc.handle('load'), /belum dibuka/); n++;
eq((await svc.handle('open')).schema, SCHEMA_VERSION, 'open');
await svc.handle('apply', { ops: [{ op: 'put', k: 'a', v: '1' }] });
eq((await svc.handle('load')).kv, [['a', '1']], 'load lewat layanan');
eq(await svc.handle('erp-load', { entity: 'opex' }), [], 'erp-load');
await assert.rejects(svc.handle('apply', { ops: [{ op: 'nope' }] }), /tidak dikenal/); n++;
await assert.rejects(svc.handle('apa-ini'), /tidak dikenal/); n++;
await svc.handle('close');
await assert.rejects(svc.handle('load'), /belum dibuka/); n++;
console.log(`SQLite engine (node:sqlite, SQLite nyata): ${n} assertions passed`);
