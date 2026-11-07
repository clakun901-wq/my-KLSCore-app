import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createState, State, STATE_KEYS} from '../js/state.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const throwsT = (f, T, m) => { assert.throws(f, T, m); n++; };

const st = createState({A: {x: 1}, rows: [{id: 'p1'}], SALES: [], PRM: [], TS: 0});
eq([...STATE_KEYS], ['A', 'rows', 'SALES', 'PRM', 'TS'], 'kunci state inti');
ok(Object.isFrozen(STATE_KEYS), 'daftar kunci dibekukan');
eq(Object.keys(st), ['A', 'rows', 'SALES', 'PRM', 'TS'], 'hanya lima kunci data yang enumerable');
eq(Object.keys(st.snapshot()), ['A', 'rows', 'SALES', 'PRM', 'TS'], 'snapshot memuat kelima kunci');

// Nilai yang diganti utuh harus langsung terlihat oleh semua pemakai objek state yang sama.
const consumers = [st, st, st, st, st];
const restored = {A: {x: 2}, rows: [{id: 'restored'}], SALES: [{i: 's1'}], PRM: [{id: 'v1'}], TS: 77};
for (const key of STATE_KEYS) st[key] = restored[key];
for (let i = 0; i < STATE_KEYS.length; i++) ok(consumers[i][STATE_KEYS[i]] === restored[STATE_KEYS[i]], STATE_KEYS[i] + ' penggantian utuh terbaca lewat referensi state bersama');
eq(st.get('SALES'), [{i: 's1'}], 'get(key) membaca nilai terbaru');
const snap = st.snapshot(); st.SALES = [];
ok(snap.SALES.length === 1 && st.SALES.length === 0, 'snapshot dangkal, bukan tampilan hidup');

// Penulisan melalui API resmi mengganti nilai milik modul, bukan variabel pinjaman.
st.set('SALES', [{i: 'baru'}]); ok(st.SALES[0].i === 'baru', 'set(key,value) mengganti penyimpanan modul');
st.rows.push({id: 'push'}); ok(st.rows.length === 2, 'mutasi isi array terlihat langsung');
throwsT(() => createState(null), TypeError, 'nilai awal wajib berupa objek');
throwsT(() => createState({A: null}), TypeError, 'A null ditolak');
throwsT(() => createState({A: []}), TypeError, 'A array ditolak');
throwsT(() => createState({rows: 'x'}), TypeError, 'rows string ditolak');
throwsT(() => { st.SALES = null; }, TypeError, 'SALES null ditolak');
throwsT(() => { st.PRM = undefined; }, TypeError, 'PRM undefined ditolak');
throwsT(() => { st.TS = NaN; }, TypeError, 'TS NaN ditolak');
throwsT(() => st.get('XYZ'), RangeError, 'get kunci tak dikenal');
throwsT(() => st.set('XYZ', 1), RangeError, 'set kunci tak dikenal');
throwsT(() => { 'use strict'; st.baru = 1; }, TypeError, 'tidak boleh menambah properti baru');

// State aplikasi adalah satu penyimpanan modul yang dipakai semua bagian app-core.
ok(State.A && typeof State.A === 'object' && Array.isArray(State.rows) && Array.isArray(State.SALES) && State.PRM === undefined && State.TS === 0, 'singleton State mempertahankan PRM belum diinisialisasi sampai bagian 50');
const src = fs.readFileSync(new URL('../js/state.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/\bwindow\.|globalThis\.|document\.|KStore|localStorage/.test(src), 'state.js tidak membaca global tersembunyi atau storage');
console.log(`State module: ${n} assertions passed.`);
