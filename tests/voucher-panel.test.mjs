import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createVoucherPanel} from '../js/voucher-panel.js';
import {createState} from '../js/state.js';
import {num, rp} from '../js/format.js';
/* Differential: panel "Cek pesanan nyata" + dialog peringatan tarif + dialog panduan v9.26 (js/legacy/40-voucher-panel.js, dibekukan di fixtures)
   vs modul baru js/voucher-panel.js. Kedua versi dijalankan dengan DOM tiruan dan dependensi IDENTIK (setiap penulisan properti, pendengar,
   panggilan metode elemen, panggilan toast/upd/fill/dst. dicatat) dan rangkaian operasi acak yang SAMA lewat titik masuk nyata (pendengar dan
   onclick), termasuk A/rows yang diganti utuh di tengah jalan seperti restore. Setelah tiap operasi dibandingkan: jejak, A, rows, dan dprev. */
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const J = x => JSON.stringify(x);

/* ---- sumber dibekukan + bukti "dipindah apa adanya" ---- */
const fixture = fs.readFileSync(new URL('./fixtures/voucher-panel.pre_v9_27.js.txt', import.meta.url), 'utf8');
const modSrc = fs.readFileSync(new URL('../js/voucher-panel.js', import.meta.url), 'utf8');
const m = /^export function createVoucherPanel\(\{[^}]*\}\)\{\n([\s\S]*)return \{vgSync:vgSync,vfKeep:vfKeep\};\n\}\n$/m.exec(modSrc.replace(/^\/\*[\s\S]*?\*\/\n/, ''));
ok(m, 'modul harus berbentuk satu factory dengan nilai kembalian {vgSync,vfKeep}');
const normalized = m[1].replace(/(?<![\w$.])st\.A(?=\.[a-z])/g, 'A').replace(/(?<![\w$.])st\.rows(?![\w$])/g, 'rows')
  .split('setDprev(document.activeElement);').join('dprev=document.activeElement;').split('var p=getDprev();setDprev(null);').join('var p=dprev;dprev=null;');
ok(normalized === fixture, 'isi modul, setelah menukar balik st.A/st.rows/getDprev/setDprev, harus SAMA persis dengan sumber v9.26 (dipindah apa adanya)');
ok((m[1].match(/(?<![\w$.])st\.A(?=\.[a-z])/g) || []).length === 26 && (m[1].match(/(?<![\w$.])st\.rows(?![\w$])/g) || []).length === 4, 'tepat 26 akses A dan 4 akses rows yang diganti');

/* ---- timer palsu bersama ---- */
let timers = [];
globalThis.setTimeout = fn => { timers.push(fn); return timers.length; };
function advance() { for (let i = 0; i < 5 && timers.length; i++) { const t = timers; timers = []; t.forEach(f => f()); } }

/* ---- generator acak berbenih ---- */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---- lingkungan tiruan (satu per versi) ---- */
const TODAY = '2026-11-04';
function makeEnv(cfg) {
  const log = [], reg = {}, dh = {}, created = []; let seq = 0, active = null;
  const ser = v => typeof v === 'function' ? 'fn' : (v && typeof v === 'object' ? J(v) : String(v));
  const opts = html => [...String(html).matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)].map(x => ({value: x[1], text: x[2]}));
  function mk(id, init) {
    const store = Object.assign({value: '', checked: false, hidden: false, textContent: '', className: '', open: false, scrollTop: 0, children: [], options: [], selectedIndex: 0, firstChild: null, tabIndex: 0, html: ''}, init);
    const mkProxy = (name, o) => new Proxy(o, {set(t, p, v) { log.push([name, id, String(p), ser(v)]); t[p] = v; return true; }});
    store.style = mkProxy('style', {}); store.dataset = mkProxy('dataset', {});
    const handlers = {}, memo = {}; let parent = null;
    const e = new Proxy({}, {
      get(_, p) {
        if (p === '__id') return id; if (p === '__store') return store; if (p === '__handlers') return handlers;
        if (p in store) return store[p];
        switch (p) {
          case 'addEventListener': return (t, f) => { log.push(['listen', id, t]); (handlers[t] ||= []).push(f); };
          case 'classList': return {toggle: (c, f) => log.push(['cl.toggle', id, c, String(f)]), add: c => log.push(['cl.add', id, c]), remove: c => log.push(['cl.remove', id, c])};
          case 'querySelector': return s => { log.push(['qs', id, s]); if (/^option\[/.test(s) && !cfg.optionExists) return null; if (/^li\[/.test(s)) return null; /* stub tidak merender <li>; di browser nyata Enter tanpa hasil juga tidak memilih apa pun */ return memo[s] ||= mk(id + '>' + s, /\.vq/.test(s) ? {value: '1'} : {}); };
          case 'querySelectorAll': return s => { log.push(['qsa', id, s]); return [0, 1, 2].map(i => memo[s + i] ||= mk(id + '>' + s + i, {})); };
          case 'appendChild': return c => { log.push(['append', id, c.__id]); store.children.push(c); return c; };
          case 'insertBefore': return (c, r) => { log.push(['insBefore', id, c.__id, r && r.__id]); return c; };
          case 'parentNode': return parent ||= mk(id + '^', {});
          case 'remove': return () => { log.push(['remove', id]); const i = reg.vfxl.__store.children.indexOf(e); if (i >= 0) reg.vfxl.__store.children.splice(i, 1); };
          case 'click': return () => { log.push(['click', id]); if (store.onclick) store.onclick.call(e); };
          case 'focus': case 'blur': case 'select': case 'scrollIntoView': return (...a) => log.push([String(p), id, ...a.map(ser)]);
          case 'dispatchEvent': return ev => log.push(['dispatch', id, ev.type]);
          case 'setAttribute': return (k, v) => log.push(['attr', id, k, String(v)]);
        }
        return undefined;
      },
      set(_, p, v) { if (p === 'value' || p === 'textContent') v = String(v); /* DOM nyata: selalu string */ log.push(['set', id, String(p), ser(v)]); store[p] = v; return true; }
    });
    return e;
  }
  const $ = id => reg[id] ||= mk(id, cfg.init && cfg.init[id]);
  active = mk('active', {});
  const document = {
    get activeElement() { return active; },
    createElement: tag => { const e = mk(tag + '#' + (++seq), {}); created.push(e); return e; },
    addEventListener: (t, f) => { log.push(['dlisten', t]); (dh[t] ||= []).push(f); },
    querySelectorAll: s => { log.push(['dqsa', s]);
      if (s === '#vfxl select') return $('vfxl').__store.children.map(c => c.querySelector('select'));
      if (s === '#vfxl .vt') return $('vfxl').__store.children.map(c => c.querySelector('.vt'));
      if (s === '#vfxl .vfxr') return $('vfxl').__store.children.slice();
      if (s === '[data-vgq]') return [0, 1].map(i => { const b = mk('vgq' + i, {}); b.__store.dataset.vgq = 'alasan ' + i; return b; });
      return []; }
  };
  const KDOM = {setHTML: (el, h) => { log.push(['setHTML', el.__id, h]); el.__store.html = h; const o = opts(h); if (o.length) el.__store.options = o; }, copyChildren: (el, src) => { log.push(['copyChildren', el.__id, src.__id]); el.__store.firstChild = {}; }};
  const calls = (name, f) => (...a) => { log.push(['call', name, ...a.map(ser)]); return f ? f(...a) : undefined; };
  const rate = r => Object.assign({ad: 8 + (r.m % 5), gx: 4, px: 2.5, vx: 1, lv: 1, pm: 0.5, cg: 40000, cp: 60000, cvx: 20000, clv: 20000, cpb: 50000}, r.o || {});
  const deps = {$, document, KDOM,
    esc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    num, rp, today: () => TODAY, pr: (r, P) => Math.round(P * r / 100), dtx: d => 'D(' + d + ')',
    KStore: {getItem: k => { log.push(['kget', k]); return cfg.vfauto === undefined ? null : cfg.vfauto; }, setItem: (k, v) => log.push(['kset', k, v])},
    calc: r => { log.push(['call', 'calc', r && r.id]); if (!r || r.n === 'NIL') return null; if (r.n === 'ERR') return {err: 1}; return {L: Math.round(r.m * 1.35 / 100) * 100, R: rate(r)}; },
    volt: (L, r) => { log.push(['call', 'volt', L, r.id]); return r.n === 'NOV' ? 0 : Math.round(L * 0.1); },
    fees: (P, Q) => { log.push(['call', 'fees', P, J(Q)]); const b = {fx: 1250, ad: Math.round(P * Q.ad / 100), gx: Math.round(P * Q.gx / 100), px: Math.round(P * Q.px / 100), vx: Math.round(P * Q.vx / 100), lv: Math.round(P * Q.lv / 100), pay: Math.round(P * 0.7 / 100)};
      const pm = Math.round(P * Q.pm / 100), tax = Math.round(P * 0.5 / 100); return {b, pm, tax, sh: b.fx + b.ad + b.gx + b.px + b.vx + b.lv + b.pay}; },
    gfac: calls('gfac', () => cfg.gfac), toast: calls('toast'), upd: calls('upd'), fill: calls('fill'), syncVL: calls('syncVL'), inertBg: calls('inertBg'), tlRender: calls('tlRender'),
    prodSig: R => { log.push(['call', 'prodSig']); return 'S' + (R.ad); }, feeSig: calls('feeSig', () => 'F'), tlOk: x => !!x && typeof x.t === 'string'};
  const fire = (id, type, evt) => ($(id).__handlers[type] || []).forEach(f => f.call($(id), evt));
  const dfire = (type, evt) => (dh[type] || []).forEach(f => f.call(document, evt));
  return {log, deps, $, fire, dfire, created, document, mk};
}

/* ---- dua versi: lama (dibekukan) dan baru (modul), berbagi cara akses state ---- */
const names = ['$', 'esc', 'num', 'rp', 'today', 'pr', 'KDOM', 'KStore', 'document', 'calc', 'volt', 'fees', 'gfac', 'toast', 'upd', 'fill', 'syncVL', 'prodSig', 'feeSig', 'tlOk', 'tlRender', 'dtx', 'inertBg'];
const makeOld = new Function('E', "'use strict';var {" + names.join(',') + '}=E.deps;var A=E.S.A,rows=E.S.rows,dprev=null;' + fixture +
  '\nreturn {vgSync:vgSync,vfKeep:vfKeep,setA:function(v){A=v},getA:function(){return A},setRows:function(v){rows=v},getRows:function(){return rows},getDprev:function(){return dprev},setDprev:function(v){dprev=v}};');
function makeNew(E) {
  const cur = {A: E.S.A, rows: E.S.rows, SALES: [], PRM: [], TS: 0, dprev: null};
  const bind = k => ({get: () => cur[k], set: v => { cur[k] = v; }});
  const st = createState({A: bind('A'), rows: bind('rows'), SALES: bind('SALES'), PRM: bind('PRM'), TS: bind('TS')});
  const api = createVoucherPanel(Object.assign({st, getDprev: () => cur.dprev, setDprev: v => { cur.dprev = v; }}, E.deps));
  return {vgSync: api.vgSync, vfKeep: api.vfKeep, setA: v => { cur.A = v; }, getA: () => cur.A, setRows: v => { cur.rows = v; }, getRows: () => cur.rows, getDprev: () => cur.dprev, setDprev: v => { cur.dprev = v; }, keys: Object.keys(api)};
}

/* ---- skenario acak: produk, A, operasi ---- */
function mkRows(R) {
  const k = Math.floor(R() * 6), out = [];
  for (let i = 0; i < k; i++) out.push({id: 'p' + i, n: ['Kaos <Polos> & "Baju"', 'NIL', 'ERR', 'NOV', 'Rak Buku', 'Sepatu'][Math.floor(R() * 6)] + (R() < 0.5 ? ' ' + i : ''), m: R() < 0.15 ? 0 : 5000 + Math.floor(R() * 90) * 1000 + Math.floor(R() * 900), o: R() < 0.2 ? {ad: 5} : null, k1: 'sku' + i});
  return out;
}
function mkA(R) {
  const vers = [undefined, {ok: true, d: '2026-10-01', n: 'x'}, {ok: false, d: '2026-11-01', bad: ['Biaya administrasi', 'Promo XTRA']}, {ok: false, d: '2026-11-01', bad: ['Premi'], ig: {d: '2026-11-02', w: 'tarif promo toko'}}];
  const A = {pb: [0, 1.8, 3][Math.floor(R() * 3)], pj: [0, 0.5, 1][Math.floor(R() * 3)], ac: 'F', ad: 6.5};
  const v = vers[Math.floor(R() * vers.length)]; if (v) A.ver = JSON.parse(J(v));
  if (R() < 0.6) A.tlog = Array.from({length: Math.floor(R() * 52)}, (_, i) => R() < 0.9 ? {d: '2026-10-' + String(1 + (i % 28)).padStart(2, '0'), t: 'catatan ' + i} : {bad: 1});
  return A;
}
const BTN = ['ad|12.5', 'ad|0', 'gx|0', 'gx|3', 'px|0', 'px|4', 'pay|2', 'pm|1.5', 'tx|11', 'zz|1', 'ad|101', 'ad|-1', 'ad|abc', 'gx|100'];
let sawCocok = 0, sawMeleset = 0, sawTotal = 0, sawSv = 0, sawMulti = 0, sawCapD = 0, sawOvr = 0, sawBtn = 0, sawIgnore = 0, sawToastPick = 0;

function mkOps(R) {
  const ops = [], pick = a => a[Math.floor(R() * a.length)];
  const steps = 14 + Math.floor(R() * 10);
  for (let s = 0; s < steps; s++) {
    const t = pick(['rows', 'A', 'keep', 'sync', 'toggle', 'select', 'qty', 'auto', 'multi', 'addrow', 'rowset', 'vfg', 'vfg', 'vfg', 'btn', 'btn', 'vg', 'vg', 'gd', 'combo', 'inputs', 'del']);
    ops.push({t, v: R(), w: R(), x: R(), y: R(), z: R(), a: Math.floor(R() * 7), rows: t === 'rows' ? mkRows(R) : null, A: t === 'A' ? mkA(R) : null, b: pick(BTN), c: pick(['ok', 'ok', 'short', 'long'])});
  }
  return ops;
}
function apply(E, impl, op) {
  const {$} = E, S = $('vfp').__store; const rowsNow = impl.getRows();
  const setv = (id, v) => { $(id).__store.value = v; };
  switch (op.t) {
    case 'rows': impl.setRows(JSON.parse(J(op.rows))); /* browser nyata: pilihan yang opsinya hilang direset */ $('vfp').__store.value = ''; $('vfxl').__store.children.forEach(c => { c.querySelector('select').__store.value = ''; }); break;
    case 'A': impl.setA(JSON.parse(J(op.A))); break;
    case 'keep': impl.vfKeep(); break;
    case 'sync': impl.vgSync(); break;
    case 'toggle': $('vfd').__store.open = op.v < 0.7; E.fire('vfd', 'toggle'); break;
    case 'select': setv('vfp', op.v < 0.2 || !rowsNow.length ? '' : String(Math.floor(op.w * rowsNow.length))); ($('vfp').onchange || (() => {}))(); break;
    case 'qty': setv('vf_n', pickQty(op)); E.fire('vf_n', 'input'); break;
    case 'auto': $('vfa').__store.checked = op.v < 0.6; E.fire('vfa', 'change'); break;
    case 'multi': $('vfm').__store.checked = op.v < 0.7; E.fire('vfm', 'change'); break;
    case 'addrow': $('vfxa').onclick(); break;
    case 'rowset': { const rs = $('vfxl').__store.children; if (!rs.length) break; const r = rs[Math.floor(op.v * rs.length)], se = r.querySelector('select'), q = r.querySelector('input.vq');
      se.__store.value = op.w < 0.15 || !rowsNow.length ? '' : String(Math.floor(op.x * rowsNow.length)); q.__store.value = pickQty(op); (se.onchange || (() => {}))(); (q.__handlers.input || []).forEach(f => f.call(q)); if (op.y < 0.3 && r.querySelector('button').onclick) r.querySelector('button').onclick(); break; }
    case 'del': { const rs = $('vfxl').__store.children; if (rs.length) { const b = rs[0].querySelector('button'); if (b.onclick) b.onclick(); } break; }
    case 'combo': { const inp = E.created.filter(c => c.__id.startsWith('input#'))[Math.floor(op.v * 3) % Math.max(1, E.created.filter(c => c.__id.startsWith('input#')).length)]; if (!inp) break;
      const ul = E.created.filter(c => c.__id.startsWith('ul#'))[0]; inp.__store.value = op.w < 0.5 ? '' : 'kaos'; const evt = {key: op.x < 0.4 ? 'Enter' : (op.x < 0.7 ? 'Escape' : 'a'), preventDefault() { E.log.push(['pd']); }};
      ['focus', 'input', 'keydown', 'blur'].forEach(t => (inp.__handlers[t] || []).forEach(f => f.call(inp, evt)));
      if (ul && (ul.__handlers.click || []).length && impl.getRows().length) { const li = {dataset: {v: String(Math.floor(op.y * impl.getRows().length))}}; (ul.__handlers.click).forEach(f => f({target: {closest: () => op.z < 0.7 ? li : null}})); } break; }
    case 'inputs': setv('vf_L', op.v < 0.3 ? '' : String(1000 + Math.floor(op.w * 400000))); setv('vf_v', op.x < 0.3 ? '' : String(Math.floor(op.y * 30000))); E.fire('vf_L', 'input'); E.fire('vf_v', 'input'); break;
    case 'btn': { const btn = {dataset: {vfa: op.b}}; E.fire('vfr', 'click', {target: {closest: s => s === '[data-vfa]' ? (op.v < 0.85 ? btn : null) : null}}); break; }
    case 'vfg': prepVfg(E, impl, op); $('vfg').onclick(); break;
    case 'vg': { const k = op.a;
      if (k === 0) $('vig').onclick(); else if (k === 1) { setv('vgr', op.c === 'short' ? 'a ' : (op.c === 'long' ? 'x'.repeat(150) : 'alasan yang cukup')); $('vgy').onclick(); }
      else if (k === 2) $('vgn').onclick(); else if (k === 3) { E.fire('vgd', 'keydown', {key: 'Escape', preventDefault() { E.log.push(['pd']); }}); E.fire('vgd', 'keydown', {key: 'Tab', shiftKey: op.v < 0.5, preventDefault() { E.log.push(['pd']); }}); E.fire('vgd', 'keydown', {key: 'a'}); }
      else if (k === 4) E.fire('vgd', 'click', {target: op.v < 0.5 ? $('vgd') : {}}); else { const d = E.document.querySelectorAll('[data-vgq]'); d.forEach(b => (b.__handlers.click || []).forEach(f => f.call(b))); }
      break; }
    case 'gd': { const n = [0, 1, 2, 5][Math.floor(op.v * 4)];
      E.dfire('click', {target: {closest: () => op.w < 0.85 ? {dataset: {gd: String(n)}} : null}, preventDefault() { E.log.push(['pd']); }});
      E.dfire('keydown', {key: op.x < 0.5 ? 'Escape' : 'a'}); if (op.y < 0.4) $('gdx').onclick(); break; }
  }
  void S;
}
const pickQty = op => ['', '1', '3', '0', '2000', 'abc', '7'][Math.floor(op.v * 7)];
/* vfg: isi kolom aktual dari perkiraan aplikasi (cocok), atau dengan selisih, supaya cabang Cocok/meleset/kena batas semuanya terpakai */
function prepVfg(E, impl, op) {
  const {$} = E, setv = (id, v) => { $(id).__store.value = v; }, rowsNow = impl.getRows();
  setv('vfp', rowsNow.length ? String(Math.floor(op.v * rowsNow.length)) : ''); setv('vf_n', op.w < 0.5 ? '1' : String(1 + Math.floor(op.x * 4)));
  $('vfm').__store.checked = op.y < 0.3; $('vfa').__store.checked = op.z < 0.5;
  for (const id of ['vfog', 'vfop', 'vfov']) setv(id, op.a % 3 === 0 && id === 'vfog' ? '0' : (op.a % 4 === 1 && id !== 'vfog' ? '0' : '1'));
  const r = rowsNow[+$('vfp').__store.value], Lc = r ? Math.round(r.m * 1.35 / 100) * 100 : 50000, L = op.v < 0.2 ? 0 : Lc * (1 + Math.floor(op.x * 3)) * (op.a === 6 ? 25 : 1) /* harga besar: memicu batas biaya */, v = Math.round(L * 0.1 * (op.y < 0.5 ? 1 : 0));
  setv('vf_L', String(L)); setv('vf_v', String(v));
  const P = L - v, rt = r ? Object.assign({ad: 8 + (r.m % 5), gx: 4, px: 2.5, vx: 1, lv: 1, pm: 0.5}, r.o || {}) : {ad: 8, gx: 4, px: 2.5, vx: 1, lv: 1, pm: 0.5};
  const pc = k => Math.round(P * k / 100), exp = {fx: 1250, ad: pc(rt.ad), gx: pc(rt.gx), px: pc(rt.px), vl: pc(rt.vx) + pc(rt.lv), pay: pc(0.7), pm: pc(rt.pm), tx: pc(0.5)};
  const delta = [0, 0, 1, 500, -500, 5000, 90000][Math.floor(op.z * 7)]; let sa = 0;
  for (const k of Object.keys(exp)) { const a = Math.max(0, exp[k] + (op.a % 2 === 0 || k === 'ad' ? delta : 0)); sa += a; setv('vf_' + k, String(a)); }
  setv('vf_t', op.v < 0.15 ? '' : String(Math.round(P - sa - [0, 0, 80, 4000][op.a % 4])));
}

/* ---- jalankan N skenario dalam lockstep ---- */
const SC = 160;
for (let seed = 1; seed <= SC; seed++) {
  const R = rng(seed * 7919), cfg = {optionExists: seed % 3 === 0, vfauto: [undefined, '0', '1'][seed % 3], gfac: [100, 0, 80][seed % 3]};
  const base = {A: mkA(R), rows: mkRows(R)};
  const Eo = makeEnv(cfg), En = makeEnv(cfg); Eo.S = {A: JSON.parse(J(base.A)), rows: JSON.parse(J(base.rows))}; En.S = {A: JSON.parse(J(base.A)), rows: JSON.parse(J(base.rows))};
  const O = makeOld(Eo), Nw = makeNew(En); advance();
  eq(Eo.log, En.log, 'seed ' + seed + ': jejak pemasangan awal harus identik'); ok(Eo.log.length > 40, 'pemasangan awal memasang banyak pendengar/isi');
  if (seed === 1) { eq(Nw.keys.sort(), ['vfKeep', 'vgSync'], 'modul hanya mengekspos vgSync dan vfKeep'); }
  let prevO = Eo.log.length, prevN = En.log.length;
  for (const [i, op] of mkOps(R).entries()) {
    apply(Eo, O, op); apply(En, Nw, op); advance();
    const lo = Eo.log.slice(prevO), ln = En.log.slice(prevN); prevO = Eo.log.length; prevN = En.log.length;
    eq(lo, ln, 'seed ' + seed + ' langkah ' + i + ' (' + op.t + '): jejak harus identik');
    eq(O.getA(), Nw.getA(), 'seed ' + seed + ' langkah ' + i + ' (' + op.t + '): A harus identik');
    eq(O.getRows(), Nw.getRows(), 'seed ' + seed + ' langkah ' + i + ': rows harus identik');
    eq(O.getDprev() && O.getDprev().__id, Nw.getDprev() && Nw.getDprev().__id, 'seed ' + seed + ' langkah ' + i + ': dprev harus identik');
    const txt = ln.map(x => x.join(' ')).join('\n');
    if (op.t === 'vfg') { sawCocok += /Cocok/.test(txt); sawMeleset += /meleset/.test(txt); sawTotal += /Total penghasilan tidak cocok/.test(txt); sawSv += /Tanggal cek tarif diperbarui/.test(txt); sawMulti += /pesanan campuran/.test(txt); sawCapD += /dibatasi Rp/.test(txt); sawOvr += /Dikecualikan di pesanan ini/.test(txt); }
    if (op.t === 'btn') sawBtn += /call tlPush|Premi|PPh|Administrasi|Gratis Ongkir|Promo XTRA|Biaya pembayaran/.test(txt) && /call upd true/.test(txt);
    if (op.t === 'vg' && op.a === 1) sawIgnore += /Peringatan diabaikan dan dicatat/.test(txt);
    if (op.t === 'combo') sawToastPick += /dispatch .* change/.test(txt);
  }
}
/* cakupan: setiap cabang penting benar-benar terpakai oleh skenario acak */
for (const [nm, v] of [['Cocok', sawCocok], ['meleset', sawMeleset], ['total penghasilan tidak cocok', sawTotal], ['tanggal cek diperbarui', sawSv], ['pesanan campuran', sawMulti], ['batas biaya', sawCapD], ['pengecualian', sawOvr], ['tombol pakai tarif', sawBtn], ['abaikan peringatan', sawIgnore], ['pilih produk dari combo', sawToastPick]]) ok(v > 0, 'skenario acak harus menjangkau cabang: ' + nm);

/* ---- kontrak modul: state segar, dprev lewat getter/setter, penulisan menembus ---- */
{
  const E = makeEnv({}); E.S = {A: {pb: 1, pj: 0.5, ver: {ok: false, d: '2026-11-01', bad: ['Premi']}}, rows: [{id: 'p0', n: 'Kaos', m: 20000}]};
  const impl = makeNew(E); const $ = E.$;
  impl.vgSync(); eq($('vig').__store.hidden, false, 'peringatan selisih tampil bila ver tidak ok dan belum diabaikan');
  /* A diganti utuh (restore): modul harus membaca A baru, bukan salinan lama */
  impl.setA({pb: 0, pj: 0, ver: {ok: true, d: '2026-11-02'}}); impl.vgSync(); eq($('vig').__store.hidden, true, 'setelah A diganti utuh, peringatan hilang (A segar)');
  impl.setA({pb: 0, pj: 0, ver: {ok: false, d: '2026-11-03', bad: ['Promo XTRA']}}); impl.vgSync(); $('vig').onclick();
  ok(impl.getDprev() && impl.getDprev().__id === 'active', 'vgOpen menyimpan elemen pemicu lewat setDprev'); eq($('vgd').__store.hidden, false, 'dialog peringatan terbuka');
  $('vgr').__store.value = 'tarif promo'; $('vgy').onclick();
  const A2 = impl.getA(); ok(A2.ver.ig && A2.ver.ig.w === 'tarif promo' && A2.tlog.length === 1 && /Peringatan selisih tarif diabaikan \(Promo XTRA\)/.test(A2.tlog[0].t), 'penulisan ig dan tlog menembus ke A yang SEKARANG (bukan A lama)');
  eq(impl.getDprev(), null, 'vgClose mengosongkan dprev lewat setDprev'); ok(E.log.some(x => x[0] === 'focus' && x[1] === 'active'), 'fokus dikembalikan ke elemen pemicu');
  /* rows diganti utuh: pilihan produk dibangun dari rows terbaru */
  impl.setRows([{id: 'z', n: 'Baru <b>', m: 5000}, {id: 'y', n: 'Tanpa modal', m: 0}]); impl.vfKeep();
  const h = $('vfp').__store.html; ok(/Baru &lt;b&gt;/.test(h) && !/Tanpa modal/.test(h) && !/Kaos/.test(h), 'vfKeep membangun opsi dari rows yang baru dan membuang modal 0');
}
console.log(`Voucher panel module: ${n} assertions passed (differential vs kode v9.26 sebelum dipindah, ${SC} skenario acak).`);
