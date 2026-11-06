/* Tes Tahap 0 (v9.36): pengaman data.
 * (a) restore tidak mengumumkan sukses sebelum data benar-benar tersimpan; gagal simpan = pesan gagal,
 * (b) pesan konfirmasi restore jujur soal jumlah yang benar-benar dimuat (batas produk/promo/penjualan),
 * (c) penyimpanan melaporkan penulisan yang masih antre (dasar peringatan saat halaman ditutup),
 * (d) bentuk kode: lsave tidak mengklaim "tersimpan", ada penjaga beforeunload, Wasm wajib di cache. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createBackup } from '../js/backup.js';
import { parseBackupText } from '../js/backup-format.js';
import { legacyPart } from './helpers/legacy-source.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; }; const eq = (a, b, m) => { assert.equal(a, b, m); n++; };
const tick = () => new Promise(r => setTimeout(r, 0));

/* ---------- (a) + (b): orkestrasi restore ---------- */
function harness({ flush, limits } = {}) {
  const log = [];
  let ask = null;
  const backup = createBackup({
    parseBackupText, snapshotState: () => ({ A: {}, rows: [], pr: [], sl: [], ts: 1 }),
    ERP: { dump: async () => ({}), check: () => ({ ok: true, n: {} }), restore: async () => true },
    getSales: () => [], applyState: () => log.push('apply'), persist: () => log.push('persist'),
    ask: (message, label, cb) => { ask = { message, cb }; },
    toast: t => log.push('toast:' + t), onFailure: m => log.push('fail:' + m), onRestored: () => log.push('restored'),
    ...(flush ? { flush } : {}), ...(limits ? { limits } : {})
  });
  return { backup, log, get ask() { return ask; } };
}
const mk = (nRows, nPr = 0, nSl) => JSON.stringify({ A: {}, rows: Array.from({ length: nRows }, (_, i) => ({ id: i })), pr: Array.from({ length: nPr }, (_, i) => ({ id: i })), ...(nSl === undefined ? {} : { sl: Array.from({ length: nSl }, (_, i) => ({ i })) }) });

// a1. Sukses hanya SETELAH flush selesai
{
  let release; const gate = new Promise(r => { release = r; });
  const h = harness({ flush: () => gate });
  h.backup.restoreText(mk(3));
  h.ask.cb();
  await tick();
  ok(h.log.some(x => x.startsWith('toast:Menyimpan')), 'tampil "Menyimpan..." selama penyimpanan berjalan');
  ok(!h.log.some(x => x.startsWith('toast:Data dipulihkan')), 'BELUM boleh ada pesan sukses sebelum flush selesai');
  ok(!h.log.includes('restored'), 'tampilan belum ditutup sebelum flush selesai');
  release(); await tick(); await tick();
  ok(h.log.some(x => x.startsWith('toast:Data dipulihkan: 3 produk')), 'pesan sukses muncul setelah flush selesai');
  ok(h.log.indexOf('toast:Menyimpan... jangan tutup aplikasi dulu.') < h.log.findIndex(x => x.startsWith('toast:Data dipulihkan')), 'urutan: Menyimpan dulu, sukses kemudian');
}
// a2. Flush gagal -> pesan gagal, bukan sukses
{
  const h = harness({ flush: () => Promise.reject(new Error('disk penuh')) });
  h.backup.restoreText(mk(2));
  h.ask.cb(); await tick(); await tick();
  ok(h.log.some(x => x.startsWith('fail:') && x.includes('BELUM tersimpan permanen') && x.includes('disk penuh')), 'kegagalan simpan dilaporkan jujur');
  ok(!h.log.some(x => x.startsWith('toast:Data dipulihkan')), 'tidak ada pesan sukses bila gagal simpan');
  ok(!h.log.includes('restored'), 'tampilan tidak ditutup bila gagal simpan');
}
// b1. Melebihi batas: pesan konfirmasi menyebut jumlah yang BENAR-BENAR dimuat dan yang terbuang
{
  const h = harness({ limits: { rows: 1000, promos: 300, sales: 5000 } });
  h.backup.restoreText(mk(1200, 10, 0));
  const m = h.ask.message;
  ok(m.includes('Pulihkan 1.000 produk'), 'konfirmasi menyebut 1.000 yang dimuat, bukan 1.200');
  ok(!m.includes('Pulihkan 1.200'), 'tidak lagi menyebut 1.200 sebagai yang dipulihkan');
  ok(/PERINGATAN/.test(m) && m.includes('200 produk'), 'konfirmasi memperingatkan 200 produk tidak dimuat');
  h.ask.cb(); await tick(); await tick();
  ok(h.log.some(x => x.startsWith('toast:Data dipulihkan: 1.000 produk') && x.includes('200 produk') && x.includes('tidak dimuat')), 'pesan akhir juga jujur soal 200 yang tidak dimuat');
}
// b2. Promo dan penjualan juga dibatasi
{
  const h = harness({ limits: { rows: 1000, promos: 300, sales: 5000 } });
  h.backup.restoreText(mk(5, 350, 5100));
  const m = h.ask.message;
  ok(m.includes('50 promo') && m.includes('100 catatan penjualan'), 'pemotongan promo dan penjualan juga diperingatkan');
}
// b3. Di bawah batas: tidak ada peringatan palsu
{
  const h = harness({ limits: { rows: 1000, promos: 300, sales: 5000 } });
  h.backup.restoreText(mk(78, 2, 10));
  ok(!/PERINGATAN/.test(h.ask.message), 'tanpa pemotongan, tidak ada peringatan');
  ok(h.ask.message.includes('Pulihkan 78 produk'), 'jumlah 78 benar');
}
// b4. Tanpa limits/flush (pemanggil lama) tetap bekerja
{
  const h = harness();
  h.backup.restoreText(mk(4));
  ok(!/PERINGATAN/.test(h.ask.message), 'bawaan: tanpa batas tidak ada peringatan');
  h.ask.cb(); await tick(); await tick();
  ok(h.log.some(x => x.startsWith('toast:Data dipulihkan: 4 produk')), 'bawaan tetap melaporkan sukses');
}

/* ---------- (c) penyimpanan melaporkan penulisan antre ---------- */
const files = new Map(); let gate = null;
const root = { async getFileHandle(name) { return {
  async getFile() { const c = files.get(name) || ''; return { size: new TextEncoder().encode(c).length, async text() { return c; } }; },
  async createWritable() { let c = files.get(name) || '', cur = 0; return {
    async seek(x) { cur = x; },
    async write(d) { if (gate) await gate; const s = typeof d === 'string' ? d : new TextDecoder().decode(d); c = c.slice(0, cur) + s + c.slice(cur + s.length); cur += s.length; },
    async close() { files.set(name, c); }, async abort() {} }; } }; } };
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { storage: { async getDirectory() { return root; }, async persist() { return true; } } } });
globalThis.window = { dispatchEvent() {} };
const ow = console.warn, oe = console.error; console.warn = () => {}; console.error = () => {};
const { initStorage, KStore } = await import('../js/storage.js?tahap0');
await initStorage({ backendFactory: async () => { throw new Error('tanpa sqlite'); } });
eq(KStore.backend, 'journal', 'harness memakai jalur jurnal');
eq(KStore.hasPending(), false, 'awalnya tidak ada penulisan antre');
let release; gate = new Promise(r => { release = r; });
KStore.setItem('k', 'v');
eq(KStore.hasPending(), true, 'penulisan yang belum selesai terdeteksi (halaman tidak boleh ditutup)');
const flushing = KStore.flush();
release(); gate = null; await flushing;
eq(KStore.hasPending(), false, 'setelah flush tidak ada yang antre');
// penulisan gagal juga menurunkan penghitung (tidak macet "antre" selamanya)
gate = Promise.reject(new Error('gagal tulis')); gate.catch(() => {});
KStore.setItem('k2', 'v2');
await assert.rejects(KStore.flush(), e => { n++; return /gagal tulis/.test(e.message) && e.cause?.message === 'gagal tulis'; });
eq(KStore.hasPending(), false, 'penulisan gagal tidak membuat penghitung macet');
gate = null;
// importSnapshot juga dihitung sebagai antre
let release2; gate = new Promise(r => { release2 = r; });
const imp = KStore.importSnapshot('{"z":"1"}');
await tick();
eq(KStore.hasPending(), true, 'restore sedang berjalan terdeteksi sebagai antre');
release2(); gate = null; await imp;
eq(KStore.hasPending(), false, 'selesai restore tidak antre');
console.warn = ow; console.error = oe;

/* ---------- (d) bentuk kode ---------- */
const leg = legacyPart('80-cadangan-tema.js');
ok(/function lflushDurable\(\)\{lflush\(\);return KStore\.flush\(\)\}/.test(leg), 'ada lflushDurable yang menunggu penyimpanan nyata');
ok(/flush:lflushDurable/.test(leg), 'restore memakai lflushDurable');
ok(/addEventListener\('beforeunload'[^]*KStore\.hasPending\(\)[^]*preventDefault/.test(leg), 'ada penjaga beforeunload');
ok(/limits:\{get rows\(\)\{return ROW_MAX\}/.test(leg), 'batas dibaca dari konstanta nyata (getter), bukan angka salinan');
ok(!/slice\(0,300\)/.test(leg), 'angka 300 promo tidak lagi tersebar; memakai PRM_MAX');
ok(/function saveWarn\(/.test(leg) && /saveWarn\(e\);return false/.test(leg), 'galat sinkron penyimpanan tidak lagi ditelan diam-diam');
ok(/BUKAN 'sudah tersimpan'/.test(leg), 'lsave mendokumentasikan bahwa true = diterima antrean');
console.log(`Tahap 0 (pengaman data): ${n} assertions passed.`);
