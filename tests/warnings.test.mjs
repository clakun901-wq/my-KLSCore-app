import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWarnings} from '../js/warnings.js';
import {rp, fmt} from '../js/format.js';
import {dtx} from '../js/helpers.js';
/* Differential: peringatan stok/margin v9.30 (pc1, skHi, stk, warns, WN, mchg; dibekukan di fixtures dari js/legacy/20-hitung-etalase.js baris 49-73)
   vs modul baru js/warnings.js. Kode lama dijalankan dengan A/calc/fwd palsu yang SAMA dengan yang disuntikkan ke versi baru.
   Bagian kunci: setelah A DITUGASKAN ULANG (restore backup), versi baru harus memakai ambang batas baru, bukan salinan lama.
   Bagian akhir = SABOTASE: tiap sisipan `var A=getA();` yang dirusak/dihapus, dan versi yang menyimpan salinan A, HARUS terdeteksi tes ini. */
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const fixture = fs.readFileSync(new URL('./fixtures/warnings.pre_v9_31.js.txt', import.meta.url), 'utf8');
const modSrc = fs.readFileSync(new URL('../js/warnings.js', import.meta.url), 'utf8');

/* ---- 1. isi modul == teks lama + tepat empat sisipan yang didokumentasikan ---- */
const SUBS = [
  ['function skHi(){var a=', 'function skHi(){var A=getA();var a='],
  ["function stk(r){if(!(r.m>0||r.n))return{lv:'',h:''};", "function stk(r){var A=getA();if(!(r.m>0||r.n))return{lv:'',h:''};"],
  ['function warns(o,rev){\n', 'function warns(o,rev){var A=getA();\n'],
  ['function mchg(r,o){var h=', 'function mchg(r,o){var A=getA();var h=']
];
let expectBody = fixture;
for (const [o, w] of SUBS) { ok(expectBody.split(o).length === 2, 'sisipan harus tepat satu kali di teks lama: ' + o.slice(0, 40)); expectBody = expectBody.replace(o, w); }
const code = modSrc.replace(/^\/\*[\s\S]*?\*\/\n/, '');
const open = 'export function createWarnings({getA,calc,fwd,rp,fmt,today,dtx}){\n';
const close = 'return {pc1:pc1,skHi:skHi,stk:stk,warns:warns,WN:WN,mchg:mchg};\n}\n';
ok(code === open + expectBody + close, 'modul harus sama dengan teks lama kecuali empat sisipan var A=getA()');
ok(code.split('\n').filter(l => l.startsWith('export ')).length === 1, 'tepat satu ekspor');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|\bsessionStorage\b|\bdocument\b/.test(code), 'warnings.js tidak boleh membaca global tersembunyi');
ok(fixture.split('\n').filter(l => /^function /.test(l)).length === 6, 'fixture lama berisi enam fungsi tingkat atas');

/* ---- util ---- */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clone = v => JSON.parse(JSON.stringify(v));
const pick = (r, a) => a[Math.floor(r() * a.length)];
const tol = f => { try { return JSON.stringify(f()); } catch (e) { return 'GALAT:' + e.constructor.name; } };

/* calc/fwd palsu deterministik; mencatat argumen supaya pemanggilan identik juga terverifikasi. */
function makeEnv(A) {
  const E = {A, todayStr: '2026-11-04', calls: [], rp, fmt, dtx};
  E.today = () => E.todayStr;
  E.calc = r => { E.calls.push(['calc', r && r.m]); if (r && r.__err) return {err: 'x'}; if (!r || !(r.m > 0)) return r && r.__null ? null : {err: 'x'}; return {err: null, M: Math.round(r.m * 1.4), R: r.R}; };
  E.fwd = (M, r, R) => { E.calls.push(['fwd', M, r && r.m, R]); return {u: Math.round(M * 0.12 - (r.m || 0) * 0.05 - 700 + (r.t || 0) * 0.1 - 600), P: M, sh: Math.round(M * 0.1), pm: Math.round(M * 0.02), tax: Math.round(M * 0.005)}; };
  return E;
}
function makeOld(E) {
  const f = new Function('E', "'use strict';var A=E.A,calc=E.calc,fwd=E.fwd,rp=E.rp,fmt=E.fmt,today=E.today,dtx=E.dtx;\n" + fixture +
    '\nreturn {pc1:pc1,skHi:skHi,stk:stk,warns:warns,WN:WN,mchg:mchg,setA:function(v){A=v}};');
  return f(E);
}
const makeNewWith = create => E => create({getA: () => E.A, calc: (...a) => E.calc(...a), fwd: (...a) => E.fwd(...a), rp: E.rp, fmt: E.fmt, today: E.today, dtx: E.dtx});
function pair(create, mkA) {
  const a = mkA(), eo = makeEnv(clone(a)), en = makeEnv(clone(a));
  const O = makeOld(eo), N = makeNewWith(create)(en);
  return {eo, en, O, N, setA(v) { eo.A = clone(v); en.A = clone(v); O.setA(eo.A); }};   // restore backup: A ditugaskan ulang di KEDUA sisi
}

const NUMS = [0, 1, -1, 0.04, 0.05, 0.06, 33.33, 99.95, 1234.56, -7.77, 1e6, NaN, Infinity];
const SETS = [undefined, null, '', 'abc', '3', '5', '5.9', 5, 5.9, 0, -2, 10, 10.5, 12, 3, 100];
const mkA = r => ({sl: pick(r, SETS), sh: pick(r, SETS), sdy: pick(r, [undefined, 0, 3, 7, 30]), wu: pick(r, [0, 500, 2000, 5000, -1]), wm: pick(r, [0, 1, 5, 12.5]), wp: pick(r, [10, 30, 45.5])});
const DATES = [undefined, null, '', '2026-11-04', '2026-11-03', '2026-10-28', '2026-10-01', '2025-01-01'];
const mkRow = r => ({n: pick(r, ['', 'Kopi', 'x']), m: pick(r, [0, -1, 5000, 12000, 80000]), s: pick(r, [null, undefined, -3, 0, 1, 5, 6, 9, 10, 11, 50, 12345]), sd: pick(r, DATES),
  t: pick(r, [0, 1000, 5000]), ack: pick(r, [false, false, true]), R: {id: Math.floor(r() * 9)}, __err: r() < 0.05, __null: r() < 0.05,
  mh: pick(r, [undefined, [], [{a: 10000, b: 12000, d: '2026-10-05'}], [{a: 20000, b: 15000, d: '2026-09-30'}], [{a: 5000, b: 5000, d: '2026-11-01'}], [{a: 1, b: 2, d: '2026-01-01'}, {a: 30000, b: 40000, d: '2026-11-02'}]])});
const mkW = r => ({u: pick(r, [-500, -1, 0, 1, 1999, 2000, 2001, 9000, 25000, 1e5]), P: pick(r, [0, -1, 50000, 100000, 12345]), sh: pick(r, [0, 5000, 20000]), pm: pick(r, [0, 800, 4000]), tax: pick(r, [0, 250, 1000, 40000])});

/* Satu putaran perbandingan lama-vs-baru. Mengembalikan daftar kegagalan (kosong = identik) dan jumlah perbandingan. */
function compareAll(create, seed, iters) {
  const r = rng(seed), fails = []; let cnt = 0;
  const cmp = (label, a, b) => { cnt++; if (a !== b) fails.push(label + ': baru=' + String(a).slice(0, 120) + ' lama=' + String(b).slice(0, 120)); };
  for (let i = 0; i < iters; i++) {
    const p = pair(create, () => mkA(r));
    for (const phase of [0, 1]) {
      if (phase === 1) p.setA(mkA(r));                                  // restore: ambang batas berganti utuh
      for (const x of NUMS) cmp('pc1 ' + x, tol(() => p.N.pc1(x)), tol(() => p.O.pc1(x)));
      cmp('skHi #' + i + '/' + phase, tol(() => p.N.skHi()), tol(() => p.O.skHi()));
      for (let k = 0; k < 4; k++) {
        const row = mkRow(r), td = pick(r, ['2026-11-04', '2026-12-31', '2027-03-01']); p.eo.todayStr = p.en.todayStr = td;
        cmp('stk #' + i + '/' + phase, tol(() => p.N.stk(clone(row))), tol(() => p.O.stk(clone(row))));
      }
      for (let k = 0; k < 4; k++) {
        const o = mkW(r), rev = pick(r, [true, false, undefined]);
        cmp('warns #' + i + '/' + phase, tol(() => p.N.warns(o, rev)), tol(() => p.O.warns(o, rev)));
        let wo, wn; try { wo = p.O.warns(o, rev); } catch (e) { wo = null; } try { wn = p.N.warns(o, rev); } catch (e) { wn = null; }
        cmp('WN', tol(() => p.N.WN(wn)), tol(() => p.O.WN(wo)));
      }
      for (let k = 0; k < 4; k++) {
        const row = mkRow(r), o = {M: pick(r, [0, 14000, 30000, 100000]), R: {z: 1}};
        p.eo.calls.length = 0; p.en.calls.length = 0;
        cmp('mchg #' + i + '/' + phase, tol(() => p.N.mchg(clone(row), o)), tol(() => p.O.mchg(clone(row), o)));
        cmp('mchg panggilan calc/fwd', JSON.stringify(p.en.calls), JSON.stringify(p.eo.calls));
      }
    }
  }
  return {fails, cnt};
}

/* ---- 2. differensial utama: modul asli identik dengan teks lama ---- */
{
  const {fails, cnt} = compareAll(createWarnings, 77, 250);
  eq(fails.slice(0, 5), [], 'differensial: tidak ada selisih lama vs baru');
  ok(cnt > 15000, 'differensial: cukup banyak perbandingan (' + cnt + ')');
  n += cnt;
}

/* ---- 3. kebenaran absolut (bukan hanya "sama dengan lama") ---- */
{
  const A = {sl: 10, sh: 5, sdy: 7, wu: 2000, wm: 1, wp: 30}, E = makeEnv(A), W = makeNewWith(createWarnings)(E);
  ok(W.pc1(12.34) === fmt(12.3) && W.pc1(0.04) === fmt(0), 'pc1 membulatkan ke satu desimal');
  ok(W.skHi() === 5, 'skHi = min(sh, sl) = 5'); E.A = {sl: 3, sh: 8}; ok(W.skHi() === 3, 'skHi memakai A hasil restore (min)'); E.A = A;
  const base = {m: 10000, n: 'x', sd: '2026-11-04'};
  ok(/Stok belum diisi/.test(W.stk({...base, s: null}).h) && W.stk({...base, s: null}).lv === 'y', 'stok kosong: kuning');
  ok(/Stok habis/.test(W.stk({...base, s: 0}).h) && W.stk({...base, s: 0}).lv === 'r', 'stok 0: merah habis');
  ok(/Stok hampir habis \(5 pcs\)/.test(W.stk({...base, s: 5}).h) && W.stk({...base, s: 5}).lv === 'r', 'stok 5 (<= batas atas 5): merah hampir habis');
  ok(/Stok menipis \(10 pcs\)/.test(W.stk({...base, s: 10}).h) && W.stk({...base, s: 10}).lv === 'y', 'stok 10 (<= batas bawah 10): kuning menipis');
  ok(W.stk({...base, s: 11}).lv === '' && /Stok 11 pcs, dicek hari ini/.test(W.stk({...base, s: 11}).h), 'stok 11: aman, dicek hari ini');
  ok(/Stok terakhir dicek 10 hari lalu/.test(W.stk({...base, s: 50, sd: '2026-10-25'}).h), 'dicek 10 hari lalu >= 7 hari: kuning, minta cek ulang');
  ok(W.stk({m: 0, n: '', s: 1}).lv === '' && W.stk({m: 0, n: '', s: 1}).h === '', 'baris kosong tanpa modal dan nama: tanpa peringatan');
  eq(W.warns({u: -1, P: 100, sh: 0, pm: 0, tax: 0}, false).sh, ['Rugi'], 'rugi');
  ok(W.warns({u: -1, P: 100, sh: 0, pm: 0, tax: 0}, true).w[0] === 'Rugi pada harga ini.', 'rugi (mode cek harga)');
  eq(W.warns({u: 0, P: 100, sh: 0, pm: 0, tax: 0}, false).sh, ['Untung nol'], 'untung nol');
  eq(W.warns({u: 1000, P: 100000, sh: 0, pm: 0, tax: 0}, false).sh, ['Untung tipis'], 'untung tipis di bawah batas rupiah (1000 < 2000)');
  eq(W.warns({u: 5000, P: 100000, sh: 20000, pm: 8000, tax: 5000}, false).sh, ['Potongan tinggi'], 'potongan 33% > 30%');
  ok(W.warns({u: 9000, P: 100000, sh: 1000, pm: 0, tax: 0}, false).lv === '', 'sehat: tanpa peringatan');
  ok(W.warns({u: 9000, P: 0, sh: 0, pm: 0, tax: 0}, false).m === 0, 'P=0: margin 0, tanpa pembagian nol');
  const x = W.warns({u: -1, P: 100, sh: 90, pm: 5, tax: 5}, false);
  ok(/class="wn r"/.test(W.WN(x)) && /class="wn y"/.test(W.WN(x)), 'WN: peringatan pertama merah bila lv r, berikutnya kuning');
  E.A = {...A, wu: 20000}; ok(W.warns({u: 9000, P: 100000, sh: 0, pm: 0, tax: 0}, false).sh[0] === 'Untung tipis', 'warns memakai A hasil restore (wu 20000)'); E.A = A;
  const row = {m: 10000, t: 0, ack: false, R: 1, mh: [{a: 10000, b: 12000, d: '2026-10-05'}]};
  const up = W.mchg(row, {M: 16800, R: 1});
  ok(up && /Modal naik/.test(up.h), 'mchg: modal naik menghasilkan peringatan');
  ok(up && /Sudah update harga di Shopee/.test(up.h) && /5 Okt/.test(up.h), 'mchg: tombol dan tanggal (dtx) muncul');
  const dn = W.mchg({...row, mh: [{a: 12000, b: 10000, d: '2026-10-05'}]}, {M: 14000, R: 1});
  ok(dn && dn.lv === '' && /Modal turun/.test(dn.h) && /class="wn i"/.test(dn.h), 'mchg: modal turun = info (lv kosong)');
  ok(W.mchg({...row, ack: true}, {M: 16800, R: 1}) === null && W.mchg({...row, mh: []}, {M: 1, R: 1}) === null, 'mchg: null bila sudah dikonfirmasi atau tanpa riwayat');
}

/* ---- 4. SABOTASE: tes ini harus MENOLAK versi yang dirusak ---- */
async function mutant(transform) {
  const src = transform(modSrc);
  assert.notEqual(src, modSrc, 'sabotase harus benar-benar mengubah teks'); n++;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
  return mod.createWarnings;
}
const sabotase = [
  ['hapus var A=getA() di skHi', s => s.replace('function skHi(){var A=getA();', 'function skHi(){')],
  ['hapus var A=getA() di stk', s => s.replace("function stk(r){var A=getA();", 'function stk(r){')],
  ['hapus var A=getA() di warns', s => s.replace('function warns(o,rev){var A=getA();', 'function warns(o,rev){')],
  ['hapus var A=getA() di mchg', s => s.replace('function mchg(r,o){var A=getA();', 'function mchg(r,o){')],
  ['simpan salinan A saat pembuatan (bug restore)', s => s.replace('export function createWarnings({getA,calc,fwd,rp,fmt,today,dtx}){\n', 'export function createWarnings({getA,calc,fwd,rp,fmt,today,dtx}){\nvar __A0=getA();getA=function(){return __A0};\n')],
  ['ubah batas hampir habis (<= jadi <)', s => s.replace('if(r.s<=skHi())return w(', 'if(r.s<skHi())return w(')],
  ['ubah batas untung tipis (< jadi <=)', s => s.replace('else if(o.u<A.wu||m<A.wm)', 'else if(o.u<=A.wu||m<A.wm)')],
  ['hilangkan dtx dari mchg', s => s.replace("' ('+dtx(h.d)+'). Harga listing perlu naik", "'. Harga listing perlu naik")],
  ['balik arah modal naik (> jadi <)', s => s.replace('up=h.b>h.a', 'up=h.b<h.a')],
  ['pc1 tanpa pembulatan', s => s.replace('fmt(Math.round(x*10)/10)', 'fmt(x)')]
];
for (const [nama, t] of sabotase) {
  const create = await mutant(t);
  const {fails} = compareAll(create, 77, 120);
  ok(fails.length > 0, 'SABOTASE harus terdeteksi: ' + nama);
}
{ // kontrol: versi asli yang sama dijalankan lewat jalur data: tetap lolos (memastikan sabotase gagal karena rusak, bukan karena jalur impor)
  const create = await mutant(s => s + '\n//kontrol');
  ok(compareAll(create, 77, 120).fails.length === 0, 'kontrol: salinan utuh tanpa perubahan fungsi tetap identik');
}

console.log(`Warnings differential (v9.31): ${n} assertions passed (modul createWarnings == teks peringatan v9.30 + empat sisipan; A diganti utuh tetap benar; 10 sabotase terdeteksi).`);
