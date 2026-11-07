/* Benchmark: laporan ERP lama (kirim seluruh data ke worker, 1x tampilan + 6x grafik = 7 pemanggilan) vs jalur SQL.
   Dijalankan di Node (SQLite nyata). Angka browser berbeda, tetapi rasio kerja (volume data yang dikirim) sama.
   node scripts/bench-erp-report.mjs [jumlahBaris=50000] */
import fs from 'node:fs';
import vm from 'node:vm';
import { migrate, applyOps, erpReports } from '../js/sqlite-engine.js';
import { openNodeDb } from '../tests/helpers/node-sqlite.mjs';
const ROWS = Number(process.argv[2]) || 50000;
function loadWorker(file) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8').replace(/^import .*;\s*/, '');
  let out; const self = { onmessage: null, postMessage: v => { out = v; } };
  vm.runInNewContext(source, { self, BigInt, Number, String, Error, TextDecoder, Uint8Array, DataView, ArrayBuffer, Promise, URL, Response: class {}, DecompressionStream: class {} });
  return async (type, payload) => { await self.onmessage({ data: { id: 1, type, payload } }); if (!out.ok) throw new Error(out.error); return JSON.parse(JSON.stringify(out.result)); };
}
const run = loadWorker('../workers/compute.worker.js'), runOld = loadWorker('../tests/fixtures/compute.worker.v9_11.js'); // runOld = worker v9.11 asli (sebelum Tahap 3b)
let seed = 1; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
const products = Array.from({ length: 1500 }, (_, i) => ({ sku: 'SKU' + i, n: 'Produk nomor ' + i, lnk: '', m: 10000 + i }));
const raw = [], items = {}, snap = {};
for (let i = 0; i < ROWS; i++) {
  const oid = 'ORD' + (10000000 + i), p = products[Math.floor(rnd() * 1500)];
  raw.push({ id: 'r' + i, order_id: oid, sku: p.sku, name: p.n, date: months[i % 6] + '-10', gross_revenue: 50000, fv: -1000, fs: 500, fa: 2000, fx: 1500, fp: 0, fr: 100, fk: 0, ft: 0, tp: 45000, platform_fee: 6000, qty: 1 });
  items[oid] = [{ name: p.n, sku: p.sku, qty: 1, q0: 1, price: 50000 }];
  if (i % 10 < 9) snap[raw[i].id] = { hs: 10000 }; // 90% sudah dikunci (kondisi umum setelah "Kunci HPP")
}
const opex = Array.from({ length: 200 }, (_, i) => ({ id: 'o' + i, date: months[i % 6] + '-01', amount: 100000 }));
const db = openNodeDb(); migrate(db);
for (let i = 0; i < raw.length; i += 5000) applyOps(db, [{ op: 'erp-put', entity: 'marketplaces_raw', rows: raw.slice(i, i + 5000) }]);
applyOps(db, [{ op: 'erp-put', entity: 'opex', rows: opex }, { op: 'erp-put', entity: 'settings', rows: [{ id: 'hpp_snap', map: snap }] }]);
const ms = ['2026-11', ...months]; // satu tampilan + 6 bulan grafik = 7 hitungan
const t0 = performance.now(); let oldRes = [];
for (const m of ms) { structuredClone({ month: m, raw, opex, items, snapshot: snap, products }); oldRes.push(await runOld('aggregate-erp', { month: m, raw, opex, items, snapshot: snap, products })); }
const tOld = performance.now() - t0;
const t1 = performance.now();
const reports = erpReports(db, ms);
const tSql = performance.now() - t1;
const t2 = performance.now(); structuredClone({ reports, items, products }); const newRes = await run('finish-erp-reports', { reports, items, products });
const tFin = performance.now() - t2;
const same = JSON.stringify(newRes) === JSON.stringify(oldRes);
console.log(`Baris pesanan: ${ROWS} (90% HPP terkunci), 7 hitungan (1 tampilan + 6 grafik)`);
console.log(`Lama v9.11 (kirim semua data 7x + hitung di JS): ${tOld.toFixed(0)} ms`);
console.log(`Baru (SQL ${tSql.toFixed(0)} ms + pencocokan baris tak terkunci ${tFin.toFixed(0)} ms): ${(tSql + tFin).toFixed(0)} ms`);
console.log(`Hasil identik: ${same ? 'ya' : 'TIDAK'} | percepatan: ${(tOld / (tSql + tFin)).toFixed(1)}x`);
if (!same) process.exit(1);
