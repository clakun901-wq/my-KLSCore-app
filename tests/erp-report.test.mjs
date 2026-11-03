/* Paritas laporan ERP: hitungan lama (JS, aggregate-erp) vs jalur baru (SQL di SQLite nyata + finish-erp-reports).
   Data acak berbenih tetap, mencakup baris terkunci/tidak terkunci, nilai null/hilang, bulan kosong, dan nilai yang harus memicu fallback. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { migrate, applyOps, erpReport } from '../js/sqlite-engine.js';
import { openNodeDb } from './helpers/node-sqlite.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// Dua worker: BARU (kode sekarang) dan REFERENSI (salinan beku worker v9.11 sebelum refaktor; pembanding independen).
function loadWorker(file) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8').replace(/^import .*;\s*/, '');
  let out; const self = { onmessage: null, postMessage: v => { out = v; } };
  vm.runInNewContext(source, { self, BigInt, Number, String, Error, TextDecoder, Uint8Array, DataView, ArrayBuffer, Promise, URL, Response: class {}, DecompressionStream: class {} });
  // Hasil dinormalisasi lewat JSON: objek dari vm yang berbeda memiliki prototype berbeda dan tidak lolos deepStrictEqual.
  return async (type, payload) => { out = undefined; await self.onmessage({ data: { id: 1, type, payload } }); return JSON.parse(JSON.stringify(out)); };
}
const run = loadWorker('../workers/compute.worker.js'), runRef = loadWorker('./fixtures/compute.worker.v9_11.js');

let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; const pick = a => a[Math.floor(rnd() * a.length)];
function dataset(rows) {
  const products = Array.from({ length: 60 }, (_, i) => ({ sku: i % 7 === 0 ? 'sku' + (i - 1) : 'SKU' + i, n: pick(['Produk nomor ' + i + ' lengkap', 'Produk nomor ' + i, 'Ab']), lnk: pick(['https://x/SKU' + (i + 1) + '/y', 'https://x/' + i, '']), m: pick([0, 5000, 12000, 30000]) }));
  const items = {}, raw = [], snap = {};
  for (let i = 0; i < rows; i++) {
    const oid = 'ORD' + String(10000000 + Math.floor(i / 2)), p = pick(products), month = pick(['2026-09', '2026-10', '2026-11']);
    const x = { id: 'r' + i, order_id: oid, sku: pick([p.sku, '', 'ASING']), name: pick([p.n, 'Nama lain produk ' + i, '']), date: month + '-' + String(1 + Math.floor(rnd() * 28)).padStart(2, '0'),
      gross_revenue: pick([0, 10000, 25000, 99000]), qty: pick([1, 2, 3]) };
    for (const k of ['fv', 'fs', 'fa', 'fx', 'fp', 'fr', 'fk', 'ft', 'tp', 'platform_fee']) { const r = rnd(); if (r < 0.2) continue; x[k] = r < 0.25 ? null : pick([-3000, 0, 1500, 7000]); }
    raw.push(x);
    if (rnd() < 0.7) (items[oid] = items[oid] || []).push({ name: pick([x.name, p.n, 'lain']), sku: p.sku, qty: pick([1, 2]), q0: pick([1, 2]), price: pick([10000, 25000, 99000]) });
    const r = rnd(); if (r < 0.4) snap[x.id] = { hs: pick([0, 8000, 21000]) }; else if (r < 0.45) snap[x.id] = { hs: 'abc' }; else if (r < 0.48) snap[x.id] = { m: 1 }; else if (r < 0.5) snap[x.id] = 0;
  }
  const opex = Array.from({ length: 25 }, (_, i) => ({ id: 'o' + i, date: pick(['2026-09', '2026-10', '2026-11']) + '-05', amount: pick([0, 1000, 250000]), category: 'Sewa' }));
  return { raw, items, snap, opex, products };
}
function load(d) {
  const db = openNodeDb(); migrate(db);
  const itemRows = Object.values(d.items).flat().map((it, i) => ({ id: 'i' + i, order_id: 'x', ...it }));
  applyOps(db, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: d.raw }, { op: 'erp-put', entity: 'opex', rows: d.opex },
    { op: 'erp-put', entity: 'settings', rows: [{ id: 'hpp_snap', map: d.snap, upd: '2026-11-03' }] }]);
  return db;
}
async function viaSql(db, d, months) {
  const reports = months.map(m => erpReport(db, m));
  assert.ok(reports.every(r => !r.fallback), 'tidak boleh fallback pada data valid: ' + JSON.stringify(reports.find(r => r.fallback)));
  const r = await run('finish-erp-reports', { reports, items: d.items, products: d.products });
  assert.ok(r.ok, r.error); return r.result;
}

const d = dataset(600), db = load(d), months = ['', '2026-09', '2026-10', '2026-11', '2099-01'];
const mine = await viaSql(db, d, months);
for (let i = 0; i < months.length; i++) {
  const old = await runRef('aggregate-erp', { month: months[i], raw: d.raw, opex: d.opex, items: d.items, snapshot: d.snap, products: d.products });
  assert.ok(old.ok, old.error);
  assert.deepEqual(mine[i], old.result, 'bulan "' + months[i] + '": SQL harus sama persis dengan hitungan lama'); n++;
}
for (const m of months) { const a = await run('aggregate-erp', { month: m, raw: d.raw, opex: d.opex, items: d.items, snapshot: d.snap, products: d.products }), b = await runRef('aggregate-erp', { month: m, raw: d.raw, opex: d.opex, items: d.items, snapshot: d.snap, products: d.products }); assert.deepEqual(a.result, b.result, 'aggregate-erp baru == referensi v9.11 (' + m + ')'); n++; }
ok(mine[0].n === 600 && mine[0].nl > 100 && mine[0].nr > 0 && Object.keys(mine[0].miss).length > 0, 'data uji memang mengenai baris terkunci, tak bercocok, dan modal hilang');
ok(mine[4].n === 0 && mine[4].om === 0 && mine[4].nb === 0, 'bulan tanpa data menghasilkan nol');
// Beberapa benih lain, ukuran berbeda
for (const [sd, rows] of [[7, 50], [99, 300], [2026, 1000]]) {
  seed = sd; const e = dataset(rows), edb = load(e), got = await viaSql(edb, e, ['', '2026-10']);
  for (const [i, m] of ['', '2026-10'].entries()) assert.deepEqual(got[i], (await runRef('aggregate-erp', { month: m, raw: e.raw, opex: e.opex, items: e.items, snapshot: e.snap, products: e.products })).result); n++;
}
// Tanpa baris pesanan sama sekali / tanpa snapshot
const empty = openNodeDb(); migrate(empty);
assert.deepEqual((await run('finish-erp-reports', { reports: [erpReport(empty, '')], items: {}, products: [] })).result[0],
  (await runRef('aggregate-erp', { month: '', raw: [], opex: [], items: {}, snapshot: {}, products: [] })).result); n++;

// Nilai yang membuat hitungan lama melempar RangeError harus memicu fallback (bukan hasil diam-diam berbeda)
for (const bad of ['5000', 12.5, 2 ** 60, '']) {
  const x = openNodeDb(); migrate(x);
  applyOps(x, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: [{ id: 'b1', date: '2026-10-01', gross_revenue: 1000, fv: bad }] }]);
  const rep = erpReport(x, '2026-10');
  const old = await runRef('aggregate-erp', { month: '2026-10', raw: [{ id: 'b1', date: '2026-10-01', gross_revenue: 1000, fv: bad }], opex: [], items: {}, snapshot: {}, products: [] });
  if (!old.ok) ok(rep.fallback === true, 'nilai ' + JSON.stringify(bad) + ' membuat hitungan lama gagal; jalur SQL harus fallback');
  else ok(rep.fallback === true || JSON.stringify((await run('finish-erp-reports', { reports: [rep], items: {}, products: [] })).result[0]) === JSON.stringify(old.result), 'nilai ' + JSON.stringify(bad) + ' harus fallback atau sama persis');
}
// JSON hasil tulisan manual/impor bisa memuat "5.0": JS membacanya sebagai integer 5 (terkunci), SQLite sebagai real. Harus fallback.
const y = openNodeDb(); migrate(y);
applyOps(y, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: [{ id: 's1', date: '2026-10-01', gross_revenue: 1000 }] }]);
y.run("INSERT INTO erp_settings(id,payload) VALUES('hpp_snap','{\"id\":\"hpp_snap\",\"map\":{\"s1\":{\"hs\":5.0}}}')");
ok(JSON.parse('{"hs":5.0}').hs === 5 && erpReport(y, '').fallback === true, 'hs desimal bulat memicu fallback');
console.log(`ERP report SQL parity (SQLite nyata vs hitungan lama): ${n} assertions passed`);
