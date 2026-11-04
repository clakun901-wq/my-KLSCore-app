import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createState, STATE_KEYS} from '../js/state.js';
/* v9.26: jembatan state inti. Variabel "legacy" disimulasikan sebagai variabel lokal yang ditugaskan ulang langsung
   (persis yang dilakukan applyState/impor di kode legacy); State harus selalu melihat nilai terbaru. */
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const throwsT = (f, T, m) => { assert.throws(f, T, m); n++; };

let A = {x: 1}, rows = [{id: 'p1'}], SALES = [], PRM = [], TS = 0;
const bindings = {
  A: {get: () => A, set: v => { A = v; }}, rows: {get: () => rows, set: v => { rows = v; }},
  SALES: {get: () => SALES, set: v => { SALES = v; }}, PRM: {get: () => PRM, set: v => { PRM = v; }},
  TS: {get: () => TS, set: v => { TS = v; }}
};
const st = createState(bindings);

eq([...STATE_KEYS], ['A', 'rows', 'SALES', 'PRM', 'TS'], 'kunci state inti');
ok(Object.isFrozen(STATE_KEYS), 'daftar kunci dibekukan');
eq(Object.keys(st), ['A', 'rows', 'SALES', 'PRM', 'TS'], 'hanya lima kunci data yang enumerable (metode tak ikut)');
eq(Object.keys(st.snapshot()), ['A', 'rows', 'SALES', 'PRM', 'TS'], 'snapshot memuat kelima kunci');

/* membaca: selalu nilai terbaru walau variabel legacy diganti utuh */
ok(st.A === A && st.rows === rows && st.SALES === SALES && st.PRM === PRM && st.TS === TS, 'membaca nilai awal (referensi sama, bukan salinan)');
SALES = [{i: 's1'}]; rows = [{id: 'a'}, {id: 'b'}]; PRM = [{id: 'q'}]; A = {x: 2}; TS = 77;
ok(st.SALES === SALES && st.rows === rows && st.PRM === PRM && st.A === A && st.TS === 77, 'penugasan ulang legacy terbaca segar');
eq(st.get('SALES'), [{i: 's1'}], 'get(key) membaca segar');
const snap = st.snapshot(); SALES = [];
ok(snap.SALES.length === 1 && st.SALES.length === 0, 'snapshot adalah salinan dangkal, bukan tampilan hidup');

/* menulis: menembus ke variabel legacy */
st.SALES = [{i: 'baru'}]; ok(SALES.length === 1 && SALES[0].i === 'baru', 'menulis SALES mengganti variabel legacy');
st.rows = []; ok(rows.length === 0, 'menulis rows');
st.PRM = [{id: 'z'}]; ok(PRM[0].id === 'z', 'menulis PRM');
st.A = {y: 9}; ok(A.y === 9, 'menulis A');
st.TS = 123; ok(TS === 123, 'menulis TS');
st.set('TS', 5); ok(TS === 5, 'set(key,value)');
st.SALES.push({i: 'dorong'}); ok(SALES.length === 2, 'mutasi di tempat (push/splice) langsung terlihat oleh legacy');

/* validasi bentuk */
throwsT(() => { st.SALES = null; }, TypeError, 'SALES null ditolak');
throwsT(() => { st.SALES = {}; }, TypeError, 'SALES objek ditolak');
throwsT(() => { st.rows = 'x'; }, TypeError, 'rows string ditolak');
throwsT(() => { st.PRM = undefined; }, TypeError, 'PRM undefined ditolak');
throwsT(() => { st.A = []; }, TypeError, 'A array ditolak');
throwsT(() => { st.A = null; }, TypeError, 'A null ditolak');
throwsT(() => { st.TS = NaN; }, TypeError, 'TS NaN ditolak');
throwsT(() => { st.TS = '1'; }, TypeError, 'TS string ditolak');
ok(Array.isArray(SALES) && TS === 5 && A.y === 9, 'penulisan yang ditolak tidak mengubah variabel legacy');

/* kunci tak dikenal dan objek tertutup */
throwsT(() => st.get('XYZ'), RangeError, 'get kunci tak dikenal');
throwsT(() => st.set('XYZ', 1), RangeError, 'set kunci tak dikenal');
throwsT(() => { 'use strict'; st.baru = 1; }, TypeError, 'tidak boleh menambah properti baru');

/* ikatan wajib lengkap */
throwsT(() => createState(), TypeError, 'tanpa bindings');
throwsT(() => createState({}), TypeError, 'bindings kosong');
for (const key of STATE_KEYS) {
  const b = {...bindings}; delete b[key];
  throwsT(() => createState(b), TypeError, 'ikatan ' + key + ' hilang');
  throwsT(() => createState({...bindings, [key]: {get: () => 1}}), TypeError, 'ikatan ' + key + ' tanpa set');
}

/* dua instans independen terhadap variabel yang sama tetap konsisten */
const st2 = createState(bindings); st.TS = 999; ok(st2.TS === 999, 'instans kedua melihat penulisan instans pertama');

/* modul tidak membaca global tersembunyi */
const src = fs.readFileSync(new URL('../js/state.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/\bwindow\.|globalThis\.|document\.|KStore|localStorage/.test(src), 'state.js tidak boleh membaca global tersembunyi atau storage');
console.log(`State bridge: ${n} assertions passed.`);
