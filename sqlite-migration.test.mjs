import assert from 'node:assert/strict';
import { migrate, applyOps, erpReports, loadAll, SCHEMA_VERSION } from '../js/sqlite-engine.js';
import { openNodeDb } from './helpers/node-sqlite.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; }; const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
// Skema v1 persis seperti yang dipakai v9.11 (sudah ada di perangkat pengguna)
const V1_DDL = [
  'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, rev INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS erp_marketplaces_raw (id TEXT PRIMARY KEY, order_id TEXT, sku TEXT, date TEXT, gross_revenue INTEGER, released_amount INTEGER, quantity INTEGER, payload TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_erp_market_date ON erp_marketplaces_raw(date)',
  'CREATE INDEX IF NOT EXISTS idx_erp_market_order ON erp_marketplaces_raw(order_id)',
  'CREATE TABLE IF NOT EXISTS erp_order_items (id TEXT PRIMARY KEY, order_id TEXT, sku TEXT, quantity INTEGER, price INTEGER, payload TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_erp_items_order ON erp_order_items(order_id)',
  'CREATE INDEX IF NOT EXISTS idx_erp_items_sku ON erp_order_items(sku)',
  'CREATE TABLE IF NOT EXISTS erp_opex (id TEXT PRIMARY KEY, date TEXT, category TEXT, amount INTEGER, notes TEXT, payload TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_erp_opex_date ON erp_opex(date)',
  'CREATE TABLE IF NOT EXISTS erp_settings (id TEXT PRIMARY KEY, payload TEXT NOT NULL)'
];
function v1db() {
  const db = openNodeDb();
  for (const sql of V1_DDL) db.exec(sql);
  db.exec('PRAGMA user_version = 1');
  return db;
}
const rows = [
  { id: 'a1', order_id: 'O1', sku: 'S1', date: '2026-10-03', gross_revenue: 100000, tp: 90000, qty: 2, fv: -5000, fs: 300, fa: 2000, fx: 1000, fp: 0, fr: 100, fk: 0, ft: 50, platform_fee: 6000 },
  { id: 'a2', order_id: 'O2', sku: 'S2', date: '2026-11-04', gross_revenue: 50000, tp: 45000, qty: 1, fv: null, platform_fee: 3000 },
  { id: 'a3', order_id: 'O3', sku: 'S3', date: '2026-11-05', gross_revenue: 70000, tp: 60000, qty: 1, fv: '777' },      // string: laporan lama melempar -> harus fallback
  { id: 'a4', order_id: 'O4', sku: 'S4', date: '2026-11-06', gross_revenue: 12.5, tp: 1, qty: 1 }                     // desimal: fallback
];
// Isi seperti jalur tulis v1: hanya kolom lama + payload
const ins = db => { for (const r of rows) db.run('INSERT INTO erp_marketplaces_raw(id,order_id,sku,date,gross_revenue,released_amount,quantity,payload) VALUES(?,?,?,?,?,?,?,?)',
  [r.id, r.order_id, r.sku, r.date, Number.isSafeInteger(r.gross_revenue) ? r.gross_revenue : null, Number.isSafeInteger(r.tp) ? r.tp : null, r.qty, JSON.stringify(r)]); };
const opexRows = [{ id: 'x1', date: '2026-11-02', amount: 7000, category: 'Sewa' }, { id: 'x2', date: '2026-10-02', amount: 3000 }];

// 1. Migrasi v1 -> v2 pada data yang sudah ada
const old = v1db(); ins(old);
for (const r of opexRows) old.run('INSERT INTO erp_opex(id,date,category,amount,notes,payload) VALUES(?,?,?,?,?,?)', [r.id, r.date, r.category || '', r.amount, '', JSON.stringify(r)]);
old.run("INSERT INTO erp_settings(id,payload) VALUES('hpp_snap',?)", [JSON.stringify({ id: 'hpp_snap', map: { a1: { hs: 20000 } } })]);
old.run("INSERT INTO kv(k,v,rev) VALUES('kunci','nilai',3)");
eq(migrate(old), { from: 1, to: SCHEMA_VERSION }, 'migrasi v1 -> terbaru');
eq(migrate(old), { from: SCHEMA_VERSION, to: SCHEMA_VERSION }, 'migrasi kedua tidak berbuat apa-apa');
eq(old.all('SELECT id,fv,fs,fa,fx,fp,fr,fk,ft,platform_fee,rpt_ok FROM erp_marketplaces_raw ORDER BY rowid'), [
  ['a1', -5000, 300, 2000, 1000, 0, 100, 0, 50, 6000, 1], ['a2', null, null, null, null, null, null, null, null, 3000, 1],
  ['a3', null, null, null, null, null, null, null, null, null, 0], ['a4', null, null, null, null, null, null, null, null, null, 0]], 'kolom uang terisi dari payload; baris tak valid ditandai');
eq(old.all('SELECT id,rpt_ok FROM erp_opex ORDER BY id'), [['x1', 1], ['x2', 1]], 'rpt_ok opex');
eq(old.all('SELECT k,v,rev FROM kv'), [['kunci', 'nilai', 3]], 'data kv tidak berubah oleh migrasi');
eq(old.all('SELECT COUNT(*) FROM erp_marketplaces_raw'), [[4]], 'tidak ada baris hilang');
ok(old.all("SELECT 1 FROM sqlite_master WHERE name IN ('idx_erp_market_month','idx_erp_opex_month')").length === 2, 'indeks bulan dibuat');

// 2. Laporan dari data hasil migrasi == laporan dari data yang ditulis langsung dengan skema baru (baris valid saja)
const valid = rows.filter(r => r.id === 'a1' || r.id === 'a2');
const oldValid = v1db(); for (const r of valid) oldValid.run('INSERT INTO erp_marketplaces_raw(id,order_id,sku,date,gross_revenue,released_amount,quantity,payload) VALUES(?,?,?,?,?,?,?,?)', [r.id, r.order_id, r.sku, r.date, r.gross_revenue, r.tp, r.qty, JSON.stringify(r)]);
oldValid.run("INSERT INTO erp_settings(id,payload) VALUES('hpp_snap',?)", [JSON.stringify({ id: 'hpp_snap', map: { a1: { hs: 20000 } } })]);
for (const r of opexRows) oldValid.run('INSERT INTO erp_opex(id,date,category,amount,notes,payload) VALUES(?,?,?,?,?,?)', [r.id, r.date, r.category || '', r.amount, '', JSON.stringify(r)]);
migrate(oldValid);
const fresh = openNodeDb(); migrate(fresh);
applyOps(fresh, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: valid }, { op: 'erp-put', entity: 'opex', rows: opexRows }, { op: 'erp-put', entity: 'settings', rows: [{ id: 'hpp_snap', map: { a1: { hs: 20000 } } }] }]);
const months = ['', '2026-10', '2026-11', '2099-01'];
eq(erpReports(oldValid, months), erpReports(fresh, months), 'laporan data hasil migrasi sama dengan data tulis langsung');
ok(erpReports(oldValid, ['2026-10'])[0].lockedHpp === 20000 && erpReports(oldValid, [''])[0].ox === 10000, 'angka laporan masuk akal (HPP terkunci, OpEx)');
// Baris tak valid memicu fallback hanya untuk bulan yang memuatnya
const mixed = erpReports(old, ['2026-10', '2026-11']);
ok(mixed[0].fallback === false && mixed[1].fallback === true, 'fallback hanya pada bulan yang memuat nilai tak valid');

// 3. Migrasi gagal di tengah jalan -> kembali ke v1 dengan data utuh (atomik)
const broken = v1db(); ins(broken); broken.exec('ALTER TABLE erp_marketplaces_raw ADD COLUMN fa INTEGER'); // memaksa ALTER duplikat gagal
assert.throws(() => migrate(broken)); n++;
eq(broken.all('PRAGMA user_version'), [[1]], 'versi tetap 1 setelah migrasi gagal');
eq(broken.all('SELECT COUNT(*) FROM erp_marketplaces_raw'), [[4]], 'data utuh setelah migrasi gagal');
eq(broken.all("SELECT COUNT(*) FROM pragma_table_info('erp_marketplaces_raw') WHERE name='fv'"), [[0]], 'kolom setengah jadi dibatalkan');

// 4. Penulisan baru mengisi kolom dan memperbarui saat upsert
const w = openNodeDb(); migrate(w);
applyOps(w, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: [{ id: 'n1', date: '2026-11-01', gross_revenue: 100, fv: -5 }] }]);
eq(w.all("SELECT fv,rpt_ok FROM erp_marketplaces_raw WHERE id='n1'"), [[-5, 1]], 'kolom terisi saat menulis');
applyOps(w, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: [{ id: 'n1', date: '2026-11-01', gross_revenue: 100, fv: 'x' }] }]);
eq(w.all("SELECT fv,rpt_ok FROM erp_marketplaces_raw WHERE id='n1'"), [[null, 0]], 'upsert memperbarui kolom dan penanda');
console.log(`SQLite migration v1->v2: ${n} assertions passed`);
