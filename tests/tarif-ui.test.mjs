import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTarifUI} from '../js/tarif-ui.js';
import {GO, GO2, AD} from '../js/tariff.js';
import {fmt} from '../js/format.js';
import {SGL, prodSig, createFeeSig} from '../js/helpers.js';
/* Differential: logika tarif v9.29 (tblSync, tbuild, fillT, tchk, verStale, ADN, refreshLabels, AD0/GO0; dibekukan di fixtures dari
   js/legacy/20-hitung-etalase.js) vs modul baru js/tarif-ui.js. Kode lama dijalankan dengan A/rows/AD/GO/DOM palsu yang SAMA dengan yang
   disuntikkan ke versi baru. Bagian kunci: setelah A/rows DITUGASKAN ULANG (restore backup), versi baru harus memakai nilai baru. */
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const fixture = fs.readFileSync(new URL('./fixtures/tarif-ui.pre_v9_30.js.txt', import.meta.url), 'utf8');
const modSrc = fs.readFileSync(new URL('../js/tarif-ui.js', import.meta.url), 'utf8');

/* ---- 1. isi modul == teks lama + tepat enam sisipan yang didokumentasikan ---- */
const SUBS = [
  ['function tblSync(){', 'function tblSync(){var A=getA();'],
  ["$('tbl').addEventListener('input',function(e){var t=e.target,", "$('tbl').addEventListener('input',function(e){var A=getA();var t=e.target,"],
  ["$('tr').onclick=function(){A.tbl=null;", "$('tr').onclick=function(){var A=getA();A.tbl=null;"],
  ["function tchk(){var w=$('tw');", "function tchk(){var A=getA();var w=$('tw');"],
  ['function verStale(){var v=A.ver;', 'function verStale(){var A=getA(),rows=getRows();var v=A.ver;'],
  ['function refreshLabels(root){root=root||document;', 'function refreshLabels(root){var A=getA();root=root||document;']
];
let expectBody = fixture;
for (const [o, w] of SUBS) { ok(expectBody.split(o).length === 2, 'sisipan harus tepat satu kali di teks lama: ' + o.slice(0, 40)); expectBody = expectBody.replace(o, w); }
const code = modSrc.replace(/^\/\*[\s\S]*?\*\/\n/, '');
const open = 'export function createTarifUI({getA,getRows,$,document,KDOM,AD,GO,GO2,fmt,today,SGL,prodSig,feeSig,calc,upd,fill,toast}){\n';
const close = 'return {tblSync:tblSync,tbuild:tbuild,fillT:fillT,tchk:tchk,verStale:verStale,refreshLabels:refreshLabels};\n}\n';
ok(code === open + expectBody + close, 'modul harus sama dengan teks lama kecuali enam sisipan var A=getA()/rows=getRows()');
ok(code.split('\n').filter(l => l.startsWith('export ')).length === 1, 'tepat satu ekspor');

/* ---- util ---- */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clone = v => JSON.parse(JSON.stringify(v));
const pick = (r, a) => a[Math.floor(r() * a.length)];
const CATS = 'ABCDEFGHI'.split('');

/* DOM palsu minimal: elemen berdasarkan id, plus querySelectorAll berdasarkan pemilih yang dipakai kode. */
function makeDom(log) {
  const els = {};
  const mk = id => (els[id] = els[id] || {id, hidden: true, textContent: '', value: '', handlers: {}, onclick: null, classList: {toggle() {}},
    addEventListener(ev, fn) { this.handlers[ev] = fn; }});
  const lists = {inputs: [], acOpts: [], g2Opts: [], gcOpts: []};
  const document = {
    querySelectorAll(sel) {
      if (sel === '[data-t]') return lists.inputs;
      if (sel === '#ac option,select[data-o="ac"] option') return lists.acOpts;
      if (sel === 'select[data-o="g2"] option') return lists.g2Opts;
      if (sel === '#gc option,select[data-o="gc"] option') return lists.gcOpts;
      throw new Error('pemilih tak terduga: ' + sel);
    }
  };
  const KDOM = {setHTML(el, h) { log.push(['setHTML', el.id, h]); }};
  return {els, lists, $: mk, document, KDOM};
}
function fillLists(L, r) {
  L.inputs.length = 0; L.acOpts.length = 0; L.g2Opts.length = 0; L.gcOpts.length = 0;
  for (const c of CATS) for (const [k, i] of [['AD', 0], ['AD', 1], ['GO', 0], ['GO', 1]]) L.inputs.push({dataset: {t: k + '|' + i + '|' + c}, value: 'x'});
  L.inputs.push({dataset: {t: 'AD|0|Z'}, value: 'x'});
  for (const c of CATS) { L.acOpts.push({value: c, textContent: '', parentNode: {id: 'ac'}}, {value: c, textContent: '', parentNode: {id: 'x'}}); }
  for (const c of 'ABCDEFGHZ'.split('')) { L.g2Opts.push({value: c, textContent: ''}); L.gcOpts.push({value: c, textContent: '', parentNode: {id: 'gc'}}, {value: c, textContent: '', parentNode: {id: 'q'}}); }
}
const snapLists = L => clone([L.inputs.map(e => e.value), L.acOpts.map(e => e.textContent), L.g2Opts.map(e => e.textContent), L.gcOpts.map(e => e.textContent)]);

/* Satu lingkungan: A, rows, AD, GO milik sendiri; fungsi palsu mencatat panggilan. */
function makeEnv(seed) {
  const log = [];
  const E = {log, A: null, rows: [], AD: clone(AD), GO: clone(GO), GO2: clone(GO2), g: 100, dom: makeDom(log), todayStr: '2026-11-04', calls: []};
  E.fmt = fmt; E.SGL = SGL; E.prodSig = prodSig;
  E.today = () => E.todayStr;
  E.upd = (...a) => { E.calls.push(['upd', ...a]); };
  E.fill = (...a) => { E.calls.push(['fill', ...a]); };
  E.toast = (...a) => { E.calls.push(['toast', ...a]); };
  E.feeSig = createFeeSig({getA: () => E.A, gfac: () => E.g});
  E.calc = r => r && r.__err ? {err: 'x'} : {err: null, R: r && r.R};
  return E;
}
function makeOld(E) {
  const f = new Function('E', "'use strict';var A=E.A,rows=E.rows,AD=E.AD,GO=E.GO,GO2=E.GO2,fmt=E.fmt,today=E.today,SGL=E.SGL,prodSig=E.prodSig,feeSig=E.feeSig,calc=E.calc,upd=E.upd,fill=E.fill,toast=E.toast,$=E.dom.$,document=E.dom.document,KDOM=E.dom.KDOM;\n" + fixture +
    '\nreturn {tblSync:tblSync,tbuild:tbuild,fillT:fillT,tchk:tchk,verStale:verStale,refreshLabels:refreshLabels,setA:function(v){A=v},setRows:function(v){rows=v}};');
  return f(E);
}
function makeNew(E) {
  return createTarifUI({getA: () => E.A, getRows: () => E.rows, $: E.dom.$, document: E.dom.document, KDOM: E.dom.KDOM, AD: E.AD, GO: E.GO, GO2: E.GO2, fmt: E.fmt, today: E.today,
    SGL: E.SGL, prodSig: E.prodSig, feeSig: () => E.feeSig(), calc: (...a) => E.calc(...a), upd: (...a) => E.upd(...a), fill: (...a) => E.fill(...a), toast: m => E.toast(m)});
}
/* Pasangan lama/baru dengan keadaan identik; setiap sisi punya lingkungan sendiri. */
function pair(seed, mkA) {
  const eo = makeEnv(seed), en = makeEnv(seed);
  const a = mkA(); eo.A = clone(a); en.A = clone(a);
  const O = makeOld(eo), N = makeNew(en);
  return {eo, en, O, N,
    setA(v) { eo.A = clone(v); en.A = clone(v); O.setA(eo.A); },       // restore backup: A ditugaskan ulang di KEDUA sisi
    setRows(v) { eo.rows = clone(v); en.rows = clone(v); O.setRows(eo.rows); }};
}
const mkTbl = r => { if (r() < 0.3) return null; const t = {AD: {}, GO: {}}; for (const c of CATS) { if (r() < 0.5) t.AD[c] = [Math.round(r() * 200) / 10, Math.round(r() * 200) / 10]; if (c !== 'I' && r() < 0.5) t.GO[c] = [Math.round(r() * 100) / 10, Math.round(r() * 100) / 10]; } if (r() < 0.2) delete t.AD; return t; };

/* ---- 2. tblSync: AD/GO diubah di tempat dan identik; A.tbl berubah ke null mengembalikan bawaan ---- */
{
  const r = rng(11);
  for (let i = 0; i < 150; i++) {
    const p = pair(i, () => ({tbl: mkTbl(r), tp: 'ml'}));
    p.O.tblSync(); p.N.tblSync();
    eq(p.en.AD, p.eo.AD, 'tblSync: AD sama #' + i); eq(p.en.GO, p.eo.GO, 'tblSync: GO sama #' + i);
    p.setA({tbl: mkTbl(r)});                                           // A diganti utuh (restore)
    p.O.tblSync(); p.N.tblSync();
    eq(p.en.AD, p.eo.AD, 'tblSync setelah A diganti: AD sama #' + i); eq(p.en.GO, p.eo.GO, 'tblSync setelah A diganti: GO sama #' + i);
    p.setA({tbl: null}); p.O.tblSync(); p.N.tblSync();
    eq(p.en.AD, AD, 'tblSync dengan tbl=null mengembalikan AD bawaan'); eq(p.en.GO, GO, 'tblSync dengan tbl=null mengembalikan GO bawaan');
    eq(p.en.AD, p.eo.AD, 'tblSync tbl=null sama dengan lama');
  }
}

/* ---- 3. tbuild: HTML identik, pendengar input/reset identik, dan menulis ke A TERBARU ---- */
{
  const r = rng(22);
  const VALS = ['', '  ', 'abc', '-1', '0', '5', '5,5', '12.25', '100', '101', '999', '1e2', ' 7 '];
  for (let i = 0; i < 60; i++) {
    const base = {tbl: mkTbl(r)};
    const p = pair(i, () => base);
    p.O.tbuild(); p.N.tbuild();
    eq(p.en.log, p.eo.log, 'tbuild: HTML tbl sama #' + i);
    ok(p.en.log.length === 1 && /Kategori A/.test(p.en.log[0][2]) && /data-t="GO\|1\|H"/.test(p.en.log[0][2]) && !/data-t="GO\|0\|I"/.test(p.en.log[0][2]), 'tbuild: kategori I tanpa Ongkir');
    for (let step = 0; step < 12; step++) {
      if (step === 6) { const nw = {tbl: mkTbl(r), ver: {ok: true}}; p.setA(nw); }   // restore di tengah jalan
      const key = pick(r, ['AD|0|A', 'AD|1|C', 'GO|0|H', 'GO|1|B', 'AD|0|I', 'X|1', 'AD|0|Z']);
      const v = pick(r, VALS);
      const to = {dataset: {t: key}, value: v}, tn = {dataset: {t: key}, value: v};
      p.O.tblSync(); p.N.tblSync();
      const tolerate = f => { try { f(); return 'ok'; } catch (e) { return e.constructor.name; } };
      const ro = tolerate(() => p.eo.dom.els.tbl.handlers.input({target: to})), rn = tolerate(() => p.en.dom.els.tbl.handlers.input({target: tn}));
      eq(rn, ro, 'tbuild input: hasil/jenis galat sama #' + i + ' ' + key + '=' + v);
      eq(p.en.A, p.eo.A, 'tbuild input: A.tbl sama #' + i + ' ' + key + '=' + v); eq(tn.value, to.value, 'tbuild input: nilai kotak sama');
      eq(p.en.calls, p.eo.calls, 'tbuild input: panggilan upd sama');
    }
    // reset ("Kembalikan tarif"): A.tbl=null di A TERBARU, lalu fill/upd/toast
    const aBefore = clone(p.en.A);
    p.eo.dom.els.tr.onclick(); p.en.dom.els.tr.onclick();
    eq(p.en.A, p.eo.A, 'reset: A sama'); ok(p.en.A.tbl === null, 'reset: A.tbl null di A terbaru');
    eq(p.en.calls, p.eo.calls, 'reset: panggilan fill/upd/toast sama'); eq(p.en.calls.slice(-3), [['fill'], ['upd', true], ['toast', 'Tabel tarif dikembalikan']], 'reset: urutan fill, upd(true), toast');
    ok(aBefore !== p.en.A, 'sanity');
  }
  // inti tahap ini: pendengar dibuat SEBELUM restore tetap menulis ke objek A yang baru
  const p = pair(1, () => ({tbl: null})); p.N.tbuild();
  const oldA = p.en.A; const newA = {tbl: null, marker: 'baru'}; p.en.A = newA;
  p.en.dom.els.tbl.handlers.input({target: {dataset: {t: 'AD|0|A'}, value: '8'}});
  ok(newA.tbl && newA.tbl.AD.A[0] === 8, 'input menulis ke A hasil restore'); ok(oldA.tbl === null, 'A lama tidak disentuh');
  const newA2 = {tbl: {AD: {A: [1, 2]}, GO: {}}}; p.en.A = newA2; p.en.dom.els.tr.onclick();
  ok(newA2.tbl === null, 'reset menulis ke A hasil restore');
}

/* ---- 4. fillT ---- */
{
  const r = rng(33);
  for (let i = 0; i < 120; i++) {
    const p = pair(i, () => ({tbl: mkTbl(r)}));
    for (const e of [p.eo, p.en]) fillLists(e.dom.lists, r);
    p.O.tblSync(); p.N.tblSync(); p.O.fillT(); p.N.fillT();
    eq(snapLists(p.en.dom.lists), snapLists(p.eo.dom.lists), 'fillT: nilai kotak sama #' + i);
  }
}

/* ---- 5. refreshLabels: dengan root bawaan (document) dan root khusus ---- */
{
  const r = rng(44);
  for (let i = 0; i < 100; i++) {
    const p = pair(i, () => ({tbl: mkTbl(r), tp: pick(r, ['ml', 'nm', undefined])}));
    for (const e of [p.eo, p.en]) fillLists(e.dom.lists, r);
    p.O.tblSync(); p.N.tblSync();
    const useRoot = r() < 0.5;
    p.O.refreshLabels(useRoot ? p.eo.dom.document : undefined); p.N.refreshLabels(useRoot ? p.en.dom.document : undefined);
    eq(snapLists(p.en.dom.lists), snapLists(p.eo.dom.lists), 'refreshLabels: label sama #' + i);
    if (i === 0) ok(p.en.dom.lists.acOpts[0].textContent.startsWith('A ('), 'label opsi #ac berformat "A (…%): …"');
    p.setA({tbl: mkTbl(r), tp: p.eo.A.tp === 'ml' ? 'nm' : 'ml'}); p.O.tblSync(); p.N.tblSync();      // A diganti: tp berubah
    p.O.refreshLabels(); p.N.refreshLabels();
    eq(snapLists(p.en.dom.lists), snapLists(p.eo.dom.lists), 'refreshLabels setelah A diganti sama #' + i);
  }
}

/* ---- 6. verStale + tchk ---- */
const mkVer = (r, e) => {
  const v = r();
  if (v < 0.15) return null;
  const sg = e.feeSig();                                   // tanda tangan tarif yang cocok dengan A saat ini
  const ver = {ok: r() < 0.8, ig: r() < 0.1, d: '2026-10-' + String(1 + Math.floor(r() * 28)).padStart(2, '0'), bad: pick(r, [['Admin'], ['Admin', 'Ongkir', 'Premi'], []])};
  const k = r();
  if (k < 0.2) { /* tanpa sg */ } else { ver.sg = clone(sg); if (r() < 0.4) { const keys = Object.keys(SGL); const kk = pick(r, keys); ver.sg[kk] = ver.sg[kk] + '!'; } }
  const m = r();
  if (m < 0.3) ver.ml = [{pn: 'P1', ps: 'x'}, {pn: '', ps: 'y'}]; else if (m < 0.5) { ver.ps = 'z'; ver.pn = 'P2'; } else if (m < 0.7) ver.ml = [{pn: 'P1', ps: prodSig({ad: 1})}];
  return ver;
};
const mkRows = r => [{n: 'P1', R: {ad: 1}}, {n: 'P2', R: {ad: r() < 0.5 ? 2 : 3}}, {n: '', R: {px: 5}}, {n: 'Err', __err: true}].filter(() => r() < 0.85);
{
  const r = rng(55);
  const DATES = [null, '', '2026-11-04', '2026-11-01', '2026-10-05', '2026-09-01', '2025-01-01'];
  for (let i = 0; i < 600; i++) {
    const p = pair(i, () => ({tp: pick(r, ['ml', 'nm']), ad: pick(r, [0, 1.5, 3]), tcd: pick(r, [undefined, 0, 7, 30, 45]), tchk: pick(r, DATES) || ''}));
    { const g = pick(r, [100, 90, 50]); p.eo.g = g; p.en.g = g; }
    p.setRows(mkRows(r));
    const ver = mkVer(r, p.eo); p.eo.A.ver = clone(ver); p.en.A.ver = clone(ver);
    eq(p.N.verStale(), p.O.verStale(), 'verStale sama #' + i);
    p.O.tchk(); p.N.tchk();
    const ho = p.eo.dom.els.tw, hn = p.en.dom.els.tw;
    eq([hn.hidden, hn.textContent], [ho.hidden, ho.textContent], 'tchk: peringatan sama #' + i + ' ' + JSON.stringify(p.eo.A.ver));
    // setelah restore: A dan rows diganti utuh; fungsi baru memakai A/rows baru
    const nv = mkVer(r, p.eo);
    p.setA({tp: 'nm', ad: 0, tchk: pick(r, DATES) || '', ver: nv}); p.setRows(mkRows(r));
    p.en.dom.els.tw.hidden = true; p.eo.dom.els.tw.hidden = true; p.en.dom.els.tw.textContent = ''; p.eo.dom.els.tw.textContent = '';
    eq(p.N.verStale(), p.O.verStale(), 'verStale setelah restore sama #' + i);
    p.O.tchk(); p.N.tchk();
    eq([p.en.dom.els.tw.hidden, p.en.dom.els.tw.textContent], [p.eo.dom.els.tw.hidden, p.eo.dom.els.tw.textContent], 'tchk setelah restore sama #' + i);
    // tanggal berubah (waktu maju) -> hasil tetap sama
    p.eo.todayStr = p.en.todayStr = '2027-02-01'; p.O.tchk(); p.N.tchk();
    eq([p.en.dom.els.tw.hidden, p.en.dom.els.tw.textContent], [p.eo.dom.els.tw.hidden, p.eo.dom.els.tw.textContent], 'tchk dengan tanggal maju sama #' + i);
  }
  // kasus tetap (kebenaran absolut, bukan hanya sama dengan lama)
  const e = pair(0, () => ({tp: 'ml', tchk: '2026-11-04', tcd: 30}));
  e.setRows([]); e.en.A.ver = null; e.N.tchk(); ok(e.en.dom.els.tw.hidden === true, 'tarif dicek hari ini: tanpa peringatan');
  e.en.A.tchk = ''; e.N.tchk(); ok(e.en.dom.els.tw.hidden === false && /belum diisi/.test(e.en.dom.els.tw.textContent), 'tanggal kosong: peringatan belum diisi');
  e.en.A.tchk = '2026-09-01'; e.N.tchk(); ok(/Tarif terakhir dicek 64 hari lalu/.test(e.en.dom.els.tw.textContent), 'tanggal lama: 64 hari');
  e.en.A.ver = {ok: false, ig: false, d: '2026-11-01', bad: ['Admin', 'Premi']}; e.N.tchk(); ok(/menemukan selisih pada: Admin, Premi/.test(e.en.dom.els.tw.textContent), 'cek pesanan nyata gagal: selisih disebut');
  ok(e.N.verStale() === null, 'verStale null bila ver tidak ok');
}

console.log(`Tarif UI differential (v9.30): ${n} assertions passed (modul createTarifUI == teks tarif v9.29 + enam sisipan; A/rows diganti utuh tetap benar).`);
