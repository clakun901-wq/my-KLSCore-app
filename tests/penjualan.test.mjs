import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPenjualan} from '../js/penjualan.js';
import {createState} from '../js/state.js';
/* Differential: tab Penjualan v9.25 (js/legacy/30-penjualan.js, dibekukan di fixtures) vs modul baru js/penjualan.js.
   Kedua versi dijalankan dengan dependensi tiruan yang IDENTIK dan rangkaian operasi acak yang SAMA (catat penjualan,
   klik harian/bulanan, navigasi periode, gembok, hapus satu/massal, ubah harga/tanggal, ekspor/salin, ganti SALES utuh
   seperti restore, waktu maju). Setelah tiap langkah dibandingkan: HTML laporan, isi SALES, stok produk, kuota promo,
   dan seluruh jejak panggilan (toast, ask, persist, reset voucher, invalidasi cache, ekspor, DOM tak langsung). */
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.equal(a, b, m); n++; };
const J = x => JSON.stringify(x);

/* ---- jam dan timer palsu (dipakai bersama oleh kedua versi) ---- */
let T = Date.parse('2026-11-04T12:00:00+07:00');
class FixedDate extends Date { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } }
globalThis.Date = FixedDate;
let timers = new Map(), tid = 0;
globalThis.setTimeout = (fn, ms) => { timers.set(++tid, {fn, at: T + ms}); return tid; };
globalThis.clearTimeout = id => { timers.delete(id); };
function advance(ms) {
  T += ms;
  for (const [id, t] of [...timers].sort((a, b) => a[1].at - b[1].at || a[0] - b[0])) if (t.at <= T) { timers.delete(id); t.fn(); }
}
const TODAY = '2026-11-04';

/* ---- sumber legacy lama, dijalankan dengan variabel bebas dari E ---- */
import {renameWulfeg} from './helpers/nama-wulfeg.mjs';
const fixture = renameWulfeg(fs.readFileSync(new URL('./fixtures/penjualan.pre_v9_26.js.txt', import.meta.url), 'utf8'), 1, 'fixture penjualan'); /* nama berkas unduhan: kalsara -> wulfeg */
const names = ['$', 'esc', 'today', 'rp', 'num', 'toast', 'ask', 'uid', 'KDOM', 'calc', 'fwdL', 'vbest', 'actL', 'ptp', 'CFG', 'pst', 'VoucherRules', 'CalcCache', 'setStock', 'persist', 'salesRows', 'copySales', 'showCpBox', 'dl', 'csv', 'SALES_MAX'];
const makeOld = new Function('E', "'use strict';var {" + names.join(',') + '}=E;var PRM=[],rows=[];' + fixture +
  '\nreturn {rpt:rpt,sold:sold,curP:curP,VUSE:VUSE,rlAll:rlAll,ymd:ymd,getSales:function(){return SALES},setSales:function(v){SALES=v},getPRM:function(){return PRM},setPRM:function(v){PRM=v},getRows:function(){return rows},setRows:function(v){rows=v}};');

/* ---- lingkungan tiruan (satu per versi) ---- */
function makeEnv() {
  const log = [], handlers = {}, el = {};
  let uidN = 0, impl = null;
  const logEl = label => ({set outerHTML(v) { log.push('outer ' + label + ' ' + v); }});
  const mk = id => {
    const e = {id, html: '', hidden: false, value: '', addEventListener(t, f, c) { (handlers[id] ||= {})[t] = f; log.push('listen ' + id + ' ' + t + (c ? ' capture' : '')); },
      querySelector: sel => {
        if (sel === '.q4z') return logEl('q4z');
        const m = /^\[data-sid="(.+)"\]$/.exec(sel);
        if (m) return {style: {}, parentNode: {classList: {remove(c) { log.push('rm ' + c); }}}, querySelector: s2 => (s2 === '.q4a' ? logEl('q4a:' + m[1]) : null)};
        return null;
      },
      querySelectorAll: () => [], focus() { log.push('focus ' + id); }, select() { log.push('select ' + id); }};
    return e;
  };
  const $ = id => (el[id] ||= mk(id));
  const E = {
    $, log, handlers, el,
    esc: t => String(t).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])),
    today: () => TODAY,
    rp: v => 'Rp' + Math.round(v).toLocaleString('id-ID'),
    num: v => { const x = Number(String(v).replace(/\./g, '').replace(',', '.')); return Number.isFinite(x) ? x : 0; },
    toast: m => { log.push('toast ' + m); },
    confirm: true,
    ask(m, okLabel, fn) { log.push('ask ' + m + ' | ' + okLabel); if (E.confirm) fn(); },
    uid: () => 'u' + (++uidN),
    KDOM: {setHTML(e, h) { e.html = h; log.push('html ' + e.id + ' ' + h.length); }},
    calc: r => (r.bad ? {err: 1} : {L: Math.round(r.m * 1.5), M: Math.round(r.m * 1.7), R: {k: 1}}),
    fwdL: (p, r) => ({u: Math.round(p - r.m * 1.1)}),
    vbest: (p, r) => { if (!r.vq) return null; const q = impl.getPRM().filter(x => x.id === r.vq)[0]; return q ? {q, v: 1} : null; },
    actL: (r) => (r.hd > 0 ? r.hd : r.ha > 0 ? r.ha - 500 : 0),
    ptp: (q, z, M) => (z.h > 0 ? z.h : q.a > 0 ? Math.round(M * (100 - q.a) / 100) : 0),
    CFG: {fs: {n: 'Flash Sale', c: 'pr'}, pt: {n: 'Promo Toko', c: 'pt'}, kh: {n: 'Kombo', c: 'kh'}},
    pst: q => ({k: q.st || 'a'}),
    VoucherRules: null,
    CalcCache: {invalidate() { log.push('cache.invalidate'); }},
    setStock(r, v) { log.push('setStock ' + r.id + ' ' + v); r.s = v; r.sd = TODAY; },
    persist() { log.push('persist'); },
    salesRows: () => (impl.getSales().length ? impl.getSales().map(s => [s.i, s.a]) : null),
    copySales() { log.push('copySales'); },
    showCpBox(t) { log.push('showCpBox ' + t); },
    dl(name, text, mime, alt, onFail) { log.push('dl ' + name + ' ' + text.length + ' ' + mime + ' ' + alt); onFail && onFail(); },
    csv: o => '\ufeff' + J(o),
    SALES_MAX: 6,
    setImpl(i) { impl = i; }
  };
  E.VoucherRules = {pst: E.pst, reset() { log.push('voucher.reset'); }};
  return E;
}
function buildOld() { const E = makeEnv(); const i = makeOld(E); E.setImpl(i); return {E, impl: i}; }
function buildNew() {
  const E = makeEnv();
  const st = createState({A: {}, rows: [], SALES: [], PRM: [], TS: 0});
  const p = createPenjualan({st, $: E.$, esc: E.esc, today: E.today, rp: E.rp, num: E.num, toast: E.toast, ask: E.ask, uid: E.uid, KDOM: E.KDOM, calc: E.calc, fwdL: E.fwdL,
    vbest: E.vbest, actL: E.actL, ptp: E.ptp, getCFG: () => E.CFG, VoucherRules: E.VoucherRules, CalcCache: E.CalcCache, setStock: E.setStock, persist: E.persist,
    salesRows: E.salesRows, copySales: E.copySales, showCpBox: E.showCpBox, dl: E.dl, csv: E.csv, getSalesMax: () => E.SALES_MAX});
  const impl = {...p, getSales: () => st.SALES, setSales: v => { st.SALES = v; }, getPRM: () => st.PRM, setPRM: v => { st.PRM = v; }, getRows: () => st.rows, setRows: v => { st.rows = v; }};
  E.setImpl(impl);
  return {E, impl};
}

/* ---- data acak ---- */
let seed = 20261104;
const rnd = k => (seed = (seed * 1664525 + 1013904223) >>> 0) % k;
const pick = a => a[rnd(a.length)];
const days = [TODAY, TODAY, TODAY, '2026-11-03', '2026-11-01', '2026-10-31', '2026-10-15', '2026-09-30', '2026-08-02'];
const pid = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'pX'];
const nm = ['Kaos', 'Celana <b>', 'Tas & Dompet', 'Topi "Keren"', "Sepatu 'A'", ''];
let sn = 0;
function genSale() {
  const d = pick(days), a = pick([10000, 25500, 99999, 150000, 1]), pi = pick([0, a, a, a + 5000, a - 3000]);
  const u = pick([-5000, 0, 1234, 20000, 45000]);
  return {i: 's' + (++sn), t: Date.parse(d + 'T' + String(rnd(24)).padStart(2, '0') + ':' + String(rnd(60)).padStart(2, '0') + ':00'), d, p: pick(pid), n: pick(nm), a, u, pi, ui: u + (pi - a), sr: pick(['ideal', 'promo', 'akt', 'xx']),
    ...(rnd(5) === 0 ? {vq: pick(['v1', 'v2', 'vNo'])} : {})};
}
const genRows = () => Array.from({length: 6}, (_, i) => ({id: 'p' + i, n: nm[i], m: 10000 + i * 7919, s: pick([null, 0, 3, 50]), sd: '', bad: i === 5,
  ha: pick([0, 0, 30000, 99999]), hd: pick([0, 0, 0, 20000]), vq: pick([null, null, 'v1', 'v2', 'vNo'])}));
const genPRM = () => [
  {id: 'f1', t: 'fs', p: 'p1', a: pick([5000, 14000, 22000]), st: pick(['a', 'a', 'b'])},
  {id: 'f2', t: 'fs', p: 'p0', a: pick([0, 9000]), st: 'a'},
  {id: 't1', t: 'pt', a: pick([0, 10, 25]), st: 'a', it: [{p: 'p2', h: pick([0, 12000]), d: pick([0, 15])}, {p: 'p3', h: 0, d: 0}, {p: 'p1', h: pick([0, 16000]), d: pick([0, 40])}]},
  {id: 'f3', t: 'fs', p: pick(['p1', 'p0']), a: pick([6000, 18000, 30000]), st: pick(['a', 'a', 'b'])}, /* promo kedua pada produk yang sama: harus dipilih yang TERENDAH */
  {id: 'k1', t: 'kh', st: 'a'},
  {id: 'v1', t: 'vc', x: pick([0, 3, 100]), y: pick([0, 1, 2, 3]), st: 'a'},
  {id: 'v2', t: 'vc', x: 2, y: 0, st: 'a'}
];
const snapshot = ({E, impl}) => J([impl.getSales(), impl.getRows().map(r => [r.id, r.s, r.sd]), impl.getPRM().map(q => [q.id, q.y]), E.log, E.$('rpv').html]);

const clickBtn = (E, id, data) => E.handlers[id].click({target: {closest: s => (s === 'button' ? {dataset: data} : null)}});
const capture = (E, x) => E.handlers.rpv.click({target: {closest: () => x || null}, preventDefault() { E.log.push('preventDefault'); }, stopPropagation() { E.log.push('stopPropagation'); }});

for (let sc = 0; sc < 300; sc++) {
  T = Date.parse('2026-11-04T12:00:00+07:00'); timers = new Map();
  const O = buildOld(), N = buildNew();
  const rowsSeed = genRows(), prmSeed = genPRM(), salesSeed = Array.from({length: rnd(14)}, genSale);
  const sS = sn;
  for (const X of [O, N]) {
    X.impl.setRows(JSON.parse(J(rowsSeed))); X.impl.setPRM(JSON.parse(J(prmSeed))); X.impl.setSales(JSON.parse(J(salesSeed)));
    X.E.confirm = sc % 7 !== 0;
  }
  eq(J(Object.keys(N.impl).filter(k => ['rpt', 'sold', 'curP', 'VUSE', 'rlAll', 'ymd'].includes(k))), J(['rpt', 'sold', 'curP', 'VUSE', 'rlAll', 'ymd']), 'nilai kembalian createPenjualan');
  eq(J(O.E.log), J(N.E.log), 'pendengar terpasang sama (jenis, elemen, urutan) sc' + sc);
  O.E.log.length = 0; N.E.log.length = 0;
  const both = (label, f) => {
    sn = sS + 100000; /* id penjualan baru identik di kedua versi */
    const a = f(O), b = f(N);
    eq(J(a), J(b), label + ' nilai kembalian sc' + sc);
    eq(snapshot(O), snapshot(N), label + ' keadaan sc' + sc);
  };
  both('rpt awal', X => X.impl.rpt());
  for (let step = 0; step < 36; step++) {
    /* SEMUA nilai acak diundi di sini, sekali, lalu diberikan identik ke kedua versi */
    const op = rnd(17), sales = O.impl.getSales(), someId = sales.length ? pick(sales).i : 'tak-ada', row = pick(O.impl.getRows());
    const flag = rnd(2) === 1, rmV = pick(['d', 'm']), rnV = pick(['-1', '1']), rlV = pick([someId, '_bulk']), bkV = pick(['per', 'all']);
    const epV = pick(['5.000', '0', '', '123456', 'abc']), edV = pick(['2026-11-01', '2026-12-31', '', TODAY]), exV = pick([{exp: ''}, {excp: ''}, {cpsel: ''}, {}]);
    const advV = pick([1000, 9000, 11000]), fresh = Array.from({length: rnd(8)}, genSale), ymdV = rnd(500), curRow = pick(O.impl.getRows());
    const label = 'op' + op + ' langkah' + step;
    switch (op) {
      case 0: case 1: case 2: both(label, X => { const r = X.impl.getRows().filter(x => x.id === row.id)[0]; if (flag) X.impl.VUSE[r.id] = true; return X.impl.sold(r); }); break;
      case 3: both(label, X => clickBtn(X.E, 'v4', {rm: rmV})); break;
      case 4: both(label, X => clickBtn(X.E, 'v4', {rn: rnV})); break;
      case 5: both(label, X => clickBtn(X.E, 'v4', {rl: rlV})); break;
      case 6: both(label, X => clickBtn(X.E, 'v4', {sw: someId})); break;
      case 7: both(label, X => clickBtn(X.E, 'v4', {del: someId})); break;
      case 8: both(label, X => clickBtn(X.E, 'v4', {bk: bkV})); break;
      case 9: both(label, X => X.E.handlers.v4.change({target: {dataset: {ep: someId}, value: epV}})); break;
      case 10: both(label, X => X.E.handlers.v4.change({target: {dataset: {ed: someId}, value: edV}})); break;
      case 11: both(label, X => clickBtn(X.E, 'v4', exV)); break;
      case 12: both(label, () => advance(advV)); break;
      case 13: both(label, X => X.impl.rlAll()); break;
      case 14: both(label, X => X.impl.setSales(JSON.parse(J(fresh)))); break;
      case 15: both(label, X => { X.E.handlers.rpv.pointerdown({target: {closest: () => null}}); capture(X.E); return X.impl.rpt(); }); break;
      case 16: both(label, X => [J(X.impl.ymd(new Date(Date.now() - ymdV * 864e5))), J(X.impl.curP(X.impl.getRows().filter(x => x.id === curRow.id)[0], {L: 7777, M: 9999}))]); break;
    }
  }
  both('rpt akhir', X => X.impl.rpt());
  ok(O.E.log.length > 0, 'ada jejak panggilan');
}

/* ---- sanity: tes diferensial tidak boleh kosong ---- */
{
  const {E, impl} = buildNew();
  impl.setRows([{id: 'p0', n: 'Kaos', m: 10000, s: 5, ha: 0, hd: 0}]); impl.setPRM([]);
  impl.sold(impl.getRows()[0]); impl.sold(impl.getRows()[0]); impl.rpt();
  const h = E.$('rpv').html;
  ok(impl.getSales().length === 2 && impl.getRows()[0].id === 'p0', 'sold mencatat penjualan lewat state');
  ok(/Omzet/.test(h) && /Untung aktual/.test(h) && /Daftar penjualan/.test(h) && /Hapus data laporan/.test(h), 'laporan harian terisi');
  ok(/Terjual 1\./.test(E.log.filter(l => l.startsWith('toast')).join('|')), 'toast "Terjual 1"');
  clickBtn(E, 'v4', {rm: 'm'}); ok(/Per hari/.test(E.$('rpv').html), 'tampilan bulanan');
  clickBtn(E, 'v4', {rl: '_bulk'}); clickBtn(E, 'v4', {bk: 'all'});
  ok(impl.getSales().length === 0 && /Belum ada penjualan/.test((impl.rpt(), E.$('rpv').html)), 'hapus massal menugaskan ulang SALES lewat state');
  /* batas SALES_MAX dibaca saat dipanggil */
  E.SALES_MAX = 3; impl.setRows([{id: 'p0', n: 'Kaos', m: 10000, s: 5}]);
  for (let i = 0; i < 7; i++) impl.sold(impl.getRows()[0]);
  ok(impl.getSales().length === 3, 'SALES dipangkas ke SALES_MAX terbaru');
  /* ganti SALES utuh di luar modul (restore): modul harus membaca yang baru */
  impl.setSales([{i: 'z1', t: T, d: TODAY, p: 'p0', n: 'Baru', a: 1000, u: 100, pi: 1000, ui: 100, sr: 'ideal'}]); impl.rpt();
  ok(/Baru/.test(E.$('rpv').html) && !/Kaos/.test(E.$('rpv').html), 'penggantian SALES utuh langsung terbaca');
}
console.log(`Penjualan module: ${n} assertions passed (differential vs kode v9.25 sebelum dipindah).`);
