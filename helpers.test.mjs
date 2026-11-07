import assert from 'node:assert/strict';
import fs from 'node:fs';
import {esc, dtx, uid, prodSig, SGL, createFeeSig} from '../js/helpers.js';
/* Differential: helper murni v9.28 (esc, dtx, uid, prodSig, SGL, feeSig; dibekukan di fixtures, diambil dari js/legacy/20-hitung-etalase.js)
   vs modul baru js/helpers.js. feeSig lama membaca `A` dan `gfac` sebagai global legacy; di sini kode lama dijalankan dengan A/gfac palsu
   yang sama dengan yang disuntikkan ke versi baru. */
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const fixture = fs.readFileSync(new URL('./fixtures/helpers.pre_v9_29.js.txt', import.meta.url), 'utf8');
const modSrc = fs.readFileSync(new URL('../js/helpers.js', import.meta.url), 'utf8');
const code = modSrc.replace(/^\/\*[\s\S]*?\*\/\n/, '');
const fx = fixture.split('\n'); // SGL, feeSig, prodSig, uid, esc, dtx
ok(fx.length === 7 && fx[6] === '', 'fixture berisi enam deklarasi, satu per baris');
const [fSGL, fFee, fProd, fUid, fEsc, fDtx] = fx;
for (const line of [fEsc, fDtx, fUid, fProd, fSGL]) ok(code.includes('export ' + line + '\n'), 'modul harus memuat baris lama persis: ' + line.slice(0, 30));
ok(code.includes('export function createFeeSig({getA,gfac}){\n' + fFee.replace('function feeSig(){', 'function feeSig(){var A=getA();') + '\nreturn feeSig;\n}\n'), 'feeSig sama dengan versi lama kecuali var A=getA() di awal');
ok(code.split('\n').filter(l => l.startsWith('export ')).length === 6, 'tepat enam ekspor');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|document\b/.test(code.replace(fEsc, '').replace(fSGL, '')), 'helpers.js tidak boleh membaca global tersembunyi');

/* ---- kode lama dengan A/gfac palsu ---- */
let curA = {}, curG = 100;
const Old = new Function('E', "'use strict';var A=E.A(),gfac=function(){return E.g()};" + fixture + '\nreturn {SGL:SGL,feeSig:feeSig,prodSig:prodSig,uid:uid,esc:esc,dtx:dtx,setA:function(v){A=v}};')({A: () => curA, g: () => curG});
const getA = () => curA;                      // selalu A terbaru (restore menugaskan ulang A)
const feeNew = createFeeSig({getA, gfac: () => curG});
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* esc: semua karakter khusus, non-string, string panjang acak */
const escIn = ['', 'abc', '&', '<', '>', '"', "'", '&amp;', '<script>alert("x")</script>', "O'Reilly & \"Sons\" <b>", 0, 1.5, null, undefined, true, [], [1, '<'], {}, '\u00e9&\u4e2d', 'a\nb\t<'];
for (const v of escIn) { eq(esc(v), Old.esc(v), 'esc(' + JSON.stringify(v) + ')'); }
eq(esc('&<>"\''), '&amp;&lt;&gt;&quot;&#39;', 'kelima karakter dilepas'); eq(esc("'"), '&#39;', 'apostrof dilepas (beda dari esc milik erp.js)');
{ const R = rng(7), al = '&<>"\'ab c1\u00e9'; for (let i = 0; i < 400; i++) { let s = ''; const L = Math.floor(R() * 20); for (let j = 0; j < L; j++) s += al[Math.floor(R() * al.length)]; eq(esc(s), Old.esc(s), 'esc acak ' + i); ok(!/[<>"']/.test(esc(s)), 'tak ada karakter mentah sisa'); } }

/* dtx: 12 bulan, hari 1-31, tanggal rusak/non-string/angka */
for (let m = 1; m <= 12; m++) for (const d of [1, 9, 10, 28, 31]) { const s = '2026-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); eq(dtx(s), Old.dtx(s), 'dtx ' + s); }
eq(dtx('2026-11-04'), '4 Nov', 'contoh: 4 Nov'); eq(dtx('2026-05-30'), '30 Mei', 'contoh: 30 Mei'); eq(dtx('2026-08-17'), '17 Agu', 'contoh: 17 Agu');
for (const v of ['', 'x', '2026', '2026-13-01', '2026-00-01', '2026-1-5', 20261104, null, undefined, '--', '2026-02-', '-', 'a-b-c', '2026-12-31T10:00']) eq(dtx(v), Old.dtx(v), 'dtx(' + JSON.stringify(v) + ')');

/* prodSig: semua 11 kolom berpengaruh, urutan tetap, nilai aneh */
const PK = ['ad', 'gx', 'px', 'vx', 'lv', 'pm', 'cg', 'cp', 'cvx', 'clv', 'cpb'];
{ const R = rng(11); const pick = () => [0, 1, 6.5, 0.5, 40000, 60000, 100, null, undefined, NaN, '5', -1][Math.floor(R() * 12)];
  for (let i = 0; i < 300; i++) { const o = {}; for (const k of PK) o[k] = pick(); eq(prodSig(o), Old.prodSig(o), 'prodSig acak ' + i); }
  const base = {}; PK.forEach((k, i) => base[k] = i + 1); const bs = prodSig(base);
  eq(bs, '[1,2,3,4,5,6,7,8,9,10,11]', 'urutan kolom tetap'); eq(prodSig(Object.assign({}, base, {zz: 9})), bs, 'kolom lain diabaikan');
  for (const k of PK) ok(prodSig(Object.assign({}, base, {[k]: 99})) !== bs, 'kolom ' + k + ' mempengaruhi tanda tangan'); }

/* uid: Date.now dan Math.random dikendalikan */
{ const dn = Date.now, mr = Math.random;
  try { for (const [t, r] of [[0, 0], [1, 0.5], [1762200000000, 0.123456789], [1762200000001, 0.999999999], [123456789, 0.000001], [9e12, 0.5]]) { Date.now = () => t; Math.random = () => r; eq(uid(), Old.uid(), 'uid t=' + t + ' r=' + r); }
    Date.now = () => 1762200000000; Math.random = () => 0.5; eq(uid(), Date.now().toString(36) + (0.5).toString(36).slice(2, 7), 'uid = waktu base36 + sampai 5 digit acak base36'); }
  finally { Date.now = dn; Math.random = mr; }
  const seen = new Set(); for (let i = 0; i < 2000; i++) seen.add(uid()); ok(seen.size > 1990, 'uid nyata hampir selalu unik'); ok(/^[0-9a-z]+$/.test(uid()), 'uid hanya base36'); }

/* SGL: tabel label identik, 22 kunci, gf termasuk */
eq(SGL, Old.SGL, 'SGL identik'); eq(Object.keys(SGL).length, 22, '22 kunci SGL'); ok('gf' in SGL && 'tbl' in SGL, 'gf dan tbl ada');

/* feeSig: A acak dengan nilai undefined/null/objek (tbl), gfac acak, A diganti di tengah jalan */
{ const R = rng(23); let sawU = 0, sawGf = 0, sawTbl = 0, sawSwap = 0;
  const val = () => [0, 1, 6.5, 'F', 'ns', 'no', 'yes', null, undefined, '', 1250, 50000, {AD: {A: [1, 2]}, GO: {}}, [1, 2, 3], false, true, NaN][Math.floor(R() * 17)];
  for (let i = 0; i < 300; i++) {
    const A = {}; for (const k of Object.keys(SGL)) if (R() < 0.8) A[k] = val(); curA = A; Old.setA(A); curG = [0, 50, 100, 75.5][Math.floor(R() * 4)];
    const so = Old.feeSig(), sn = feeNew(); eq(sn, so, 'feeSig acak ' + i); eq(Object.keys(sn), Object.keys(SGL), 'kunci = kunci SGL');
    Object.keys(SGL).forEach(k => { if (A[k] === undefined) { sawU++; eq(sn[k], k === 'gf' ? JSON.stringify(curG) : 'null', 'undefined menjadi null'); } });
    sawGf += k_gf(sn); if (A.tbl && typeof A.tbl === 'object') sawTbl++;
    if (i % 5 === 0) { const A2 = Object.assign({}, A, {ac: 'Z', ad: 12.5}); curA = A2; Old.setA(A2); eq(feeNew(), Old.feeSig(), 'A diganti: versi baru membaca A terbaru ' + i); eq(feeNew().ac, JSON.stringify('Z'), 'A baru terbaca'); sawSwap++; curA = A; Old.setA(A); }
  }
  function k_gf(s) { return s.gf === JSON.stringify(curG) ? 1 : 0; }
  ok(sawU > 100 && sawGf === 300 && sawTbl > 15 && sawSwap >= 60, 'cabang tercakup (undefined, gf dari gfac, tbl objek, A diganti)');
  curA = {gf: 40, gfd: '2000-01-01'}; curG = 100; eq(feeNew().gf, '100', 'gf dari gfac, bukan A.gf'); curA = {gf: 40}; curG = 40; eq(feeNew().gf, '40', 'gf = nilai gfac'); }
console.log(`Helpers module: ${n} assertions passed (differential vs kode v9.28 sebelum dipindah).`);
