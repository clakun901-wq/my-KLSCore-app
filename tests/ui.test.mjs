import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createUI} from '../js/ui.js';
/* Differential: dialog konfirmasi (ask/dclose), inertBg, dan toast v9.27 (blok di js/legacy/20-hitung-etalase.js, dibekukan di fixtures)
   vs modul baru js/ui.js. Kedua versi dijalankan dengan DOM tiruan dan timer palsu IDENTIK dan rangkaian operasi acak yang SAMA
   (ask dengan/tanpa callback, klik Batal/Ya, Escape/Tab/Shift+Tab, klik latar, toast beruntun, waktu maju, dprev dibagikan). Setelah tiap
   operasi dibandingkan seluruh jejak (penulisan properti, pendengar, fokus, callback) dan nilai dprev. */
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const fixture = fs.readFileSync(new URL('./fixtures/ui.pre_v9_28.js.txt', import.meta.url), 'utf8');
const modSrc = fs.readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const m = /^export function createUI\(\{\$,document\}\)\{\n([\s\S]*)return \{inertBg:inertBg,ask:ask,toast:toast,getDprev:function\(\)\{return dprev\},setDprev:function\(v\)\{dprev=v\}\};\n\}\n$/m.exec(modSrc.replace(/^\/\*[\s\S]*?\*\/\n/, ''));
ok(m, 'modul harus berbentuk satu factory dengan nilai kembalian {inertBg,ask,toast,getDprev,setDprev}');
ok(m[1] === fixture, 'isi modul harus SAMA persis dengan blok v9.27 (dipindah apa adanya, tanpa penggantian)');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore/.test(modSrc.replace(/\/\*[\s\S]*?\*\//g, '')), 'ui.js tidak boleh membaca global tersembunyi (document dan $ disuntikkan)');

/* ---- timer palsu dengan clearTimeout ---- */
let now = 0, tid = 0, timers = new Map();
globalThis.setTimeout = (fn, ms) => { timers.set(++tid, {fn, at: now + ms}); return tid; };
globalThis.clearTimeout = id => { timers.delete(id); };
function advance(ms) { now += ms; for (const [id, t] of [...timers].sort((a, b) => a[1].at - b[1].at || a[0] - b[0])) if (t.at <= now && timers.has(id)) { timers.delete(id); t.fn(); } }
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function makeEnv(cfg) {
  const log = [], reg = {}, doc = {};
  function mk(id, o = {}) {
    const store = Object.assign({hidden: false, textContent: '', className: '', inert: undefined}, o), handlers = {};
    return new Proxy({}, {
      get(_, p) {
        if (p === '__id') return id; if (p === '__handlers') return handlers; if (p === '__store') return store;
        if (p in store) return store[p];
        if (p === 'addEventListener') return (t, f) => { log.push(['listen', id, t]); (handlers[t] ||= []).push(f); };
        if (p === 'focus') return () => { log.push(['focus', id]); if (store.throwOnFocus) throw new Error('focus gagal'); };
        return undefined;
      },
      set(_, p, v) { log.push(['set', id, String(p), typeof v === 'function' ? 'fn' : String(v)]); store[p] = v; return true; }
    });
  }
  const $ = id => reg[id] ||= mk(id);
  const els = {main: mk('main'), nav: cfg.noNav ? null : mk('nav'), header: mk('header')};
  let active = mk('active0');
  const document = {get activeElement() { return active; }, set activeElement(v) { active = v; }, querySelector: s => { log.push(['qs', s]); return els[s]; }};
  return {log, $, els, document, setActive: v => { active = v; }, fire: (id, t, e) => ($(id).__handlers[t] || []).forEach(f => f.call($(id), e))};
}
const makeOld = new Function('E', "'use strict';var {$,document}=E;" + fixture + '\nreturn {inertBg:inertBg,ask:ask,toast:toast,getDprev:function(){return dprev},setDprev:function(v){dprev=v}};');
const makeNew = E => createUI({$: E.$, document: E.document});

const SC = 120; let sawFn = 0, sawEsc = 0, sawTab = 0, sawBackdrop = 0, sawThrow = 0, sawToastReplace = 0;
for (let seed = 1; seed <= SC; seed++) {
  const R = rng(seed * 104729), cfg = {noNav: seed % 7 === 0};
  const Eo = makeEnv(cfg), En = makeEnv(cfg); const O = makeOld(Eo), N = makeNew(En);
  eq(Eo.log, En.log, 'seed ' + seed + ': jejak pemasangan awal identik'); ok(Eo.log.length >= 3, 'pemasangan memasang pendengar #dlg dsb.');
  let po = Eo.log.length, pn = En.log.length, cbO = [], cbN = [];
  const steps = 10 + Math.floor(R() * 14);
  for (let i = 0; i < steps; i++) {
    const t = ['ask', 'ask', 'dn', 'dy', 'esc', 'tab', 'backdrop', 'toast', 'toast', 'adv', 'inert', 'dprev', 'active', 'other'][Math.floor(R() * 14)], v = R(), w = R();
    const ev = (E, k) => ({key: k, shiftKey: w < 0.5, preventDefault() { E.log.push(['pd']); }});
    for (const [E, impl, cb] of [[Eo, O, cbO], [En, N, cbN]]) {
      switch (t) {
        case 'ask': impl.ask('Hapus produk "' + Math.floor(v * 99) + '"?', ['Hapus', 'Ya'][Math.floor(w * 2)], v < 0.7 ? () => { cb.push('fn'); E.log.push(['cb']); } : undefined); break;
        case 'dn': E.$('dn').onclick(); break;
        case 'dy': E.$('dy').onclick(); break;
        case 'esc': E.fire('dlg', 'keydown', ev(E, 'Escape')); break;
        case 'tab': E.fire('dlg', 'keydown', ev(E, 'Tab')); E.fire('dlg', 'keydown', ev(E, 'a')); break;
        case 'backdrop': { const dlg = E.$('dlg'); E.$('dlg').__handlers.click.forEach(f => f.call(dlg, {target: v < 0.5 ? dlg : {}})); break; }
        case 'toast': impl.toast('Pesan ' + Math.floor(v * 9)); break;
        case 'adv': advance(0); break;
        case 'inert': impl.inertBg(v < 0.5); break;
        case 'dprev': impl.setDprev(v < 0.3 ? null : E.$('x' + Math.floor(w * 3))); break;
        case 'active': E.setActive(v < 0.25 ? null : (v < 0.5 ? (() => { const a = E.$('thr'); a.__store.throwOnFocus = true; return a; })() : E.$('btn' + Math.floor(w * 3)))); break;
        case 'other': E.$('dlg').__store.hidden = v < 0.5; break;
      }
    }
    if (t === 'adv') { /* satu timer dunia untuk kedua versi: majukan waktu sesudah keduanya dipanggil */ }
    if (t === 'adv') advance(v < 0.5 ? 1000 : 1700);
    const lo = Eo.log.slice(po), ln = En.log.slice(pn); po = Eo.log.length; pn = En.log.length;
    eq(lo, ln, 'seed ' + seed + ' langkah ' + i + ' (' + t + '): jejak identik');
    eq(cbO, cbN, 'seed ' + seed + ' langkah ' + i + ': callback konfirmasi identik');
    eq(O.getDprev() && O.getDprev().__id, N.getDprev() && N.getDprev().__id, 'seed ' + seed + ' langkah ' + i + ': dprev identik');
    const tx = ln.map(x => x.join(' ')).join('\n');
    sawFn += /\ncb|^cb/.test(tx); sawEsc += t === 'esc' && /set dlg hidden true/.test(tx); sawTab += t === 'tab' && /pd/.test(tx); sawBackdrop += t === 'backdrop' && /set dlg hidden true/.test(tx);
    sawThrow += /focus thr/.test(tx); sawToastReplace += t === 'toast' && /set tt className toast on/.test(tx);
  }
  advance(5000); eq(Eo.log.slice(po), En.log.slice(pn), 'seed ' + seed + ': timer toast yang tersisa identik');
  eq(Eo.$('tt').__store.className, En.$('tt').__store.className, 'seed ' + seed + ': kelas toast akhir identik');
}
for (const [nm, v] of [['callback konfirmasi', sawFn], ['Escape menutup', sawEsc], ['Tab mengurung fokus', sawTab], ['klik latar menutup', sawBackdrop], ['fokus gagal (try/catch)', sawThrow], ['toast tampil', sawToastReplace]]) ok(v > 0, 'skenario acak harus menjangkau: ' + nm);

/* ---- kontrak: dprev dibagikan, toast menutup sendiri 1,6 dtk, toast beruntun mengganti timer ---- */
{
  const E = makeEnv({}), U = makeNew(E);
  E.setActive(E.$('pemicu')); U.ask('Yakin?', 'Ya', () => E.log.push(['dikonfirmasi']));
  eq(U.getDprev().__id, 'pemicu', 'ask menyimpan elemen pemicu di dprev bersama'); eq(E.$('dlg').__store.hidden, false, 'dialog terbuka');
  eq(E.els.main.__store.inert, true, 'latar di-inert saat dialog terbuka'); eq(E.$('dlgm').__store.textContent, 'Yakin?', 'pesan dialog terisi');
  E.$('dy').onclick(); ok(E.log.some(x => x[0] === 'dikonfirmasi'), 'Ya memanggil callback setelah dialog ditutup'); eq(U.getDprev(), null, 'dprev dikosongkan setelah ditutup');
  ok(E.log.some(x => x[0] === 'focus' && x[1] === 'pemicu'), 'fokus dikembalikan ke pemicu'); eq(E.els.main.__store.inert, false, 'inert dilepas');
  U.toast('A'); advance(1000); U.toast('B'); advance(1000); eq(E.$('tt').__store.className, 'toast on', 'toast kedua mereset timer (1,6 dtk dihitung ulang)'); advance(700); eq(E.$('tt').__store.className, 'toast', 'toast hilang 1,6 dtk setelah yang terakhir');
}
console.log(`UI module (dialog/toast): ${n} assertions passed (differential vs kode v9.27 sebelum dipindah, ${SC} skenario acak).`);
