import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHasilView} from '../js/hasil-view.js';
import {createWarnings} from '../js/warnings.js';
import {rp, fmt} from '../js/format.js';
import {esc, dtx} from '../js/helpers.js';
/* Differential: tampilan hasil kartu Hitung v9.31 (revHtml, CR, sp, errH; dibekukan di fixtures dari js/legacy/20-hitung-etalase.js baris 51-60, 63, 66)
   vs modul baru js/hasil-view.js. Kode lama dijalankan dengan A/tmod/fwdL palsu yang SAMA dengan yang disuntikkan ke versi baru;
   warns/WN/pc1 memakai modul warnings sungguhan di kedua sisi (supaya perbedaan hanya berasal dari pemindahan ini).
   Bagian kunci: setelah A DITUGASKAN ULANG (restore backup), versi baru harus memakai nilai A baru, bukan salinan lama.
   Bagian akhir = SABOTASE: tiap sisipan `var A=getA();` yang dirusak/dihapus, versi yang menyimpan salinan A, dan perubahan teks keluaran, HARUS terdeteksi tes ini. */
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const fixture = fs.readFileSync(new URL('./fixtures/hasil-view.pre_v9_32.js.txt', import.meta.url), 'utf8');
const modSrc = fs.readFileSync(new URL('../js/hasil-view.js', import.meta.url), 'utf8');

/* ---- 1. isi modul == teks lama + tepat dua sisipan yang didokumentasikan ---- */
const SUBS = [
  ['function revHtml(r,o,im){\n', 'function revHtml(r,o,im){var A=getA();\n'],
  ['function sp(o,r){var c=tmod(r)', 'function sp(o,r){var A=getA();var c=tmod(r)']
];
let expectBody = fixture;
for (const [o, w] of SUBS) { ok(expectBody.split(o).length === 2, 'sisipan harus tepat satu kali di teks lama: ' + o.slice(0, 40)); expectBody = expectBody.replace(o, w); }
const code = modSrc.replace(/^\/\*[\s\S]*?\*\/\n/, '');
const open = 'export function createHasilView({getA,fmt,rp,esc,tmod,fwdL,warns,WN,pc1}){\n';
const close = 'return {CR:CR,errH:errH,sp:sp,revHtml:revHtml};\n}\n';
ok(code === open + expectBody + close, 'modul harus sama dengan teks lama kecuali dua sisipan var A=getA()');
ok(code.split('\n').filter(l => l.startsWith('export ')).length === 1, 'tepat satu ekspor');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|\bsessionStorage\b|\bdocument\b/.test(code), 'hasil-view.js tidak boleh membaca global tersembunyi');
ok(fixture.split('\n').filter(l => /^function /.test(l)).length === 4, 'fixture lama berisi empat fungsi tingkat atas');

/* ---- util ---- */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clone = v => JSON.parse(JSON.stringify(v));
const pick = (r, a) => a[Math.floor(r() * a.length)];
const tol = f => { try { return JSON.stringify(f()); } catch (e) { return 'GALAT:' + e.constructor.name; } };

/* tmod/fwdL palsu deterministik (mencatat argumen agar pemanggilan identik juga terverifikasi). Keluaran fwdL mengikuti bentuk fwdL asli (js/pricing.js). */
function makeEnv(A) {
  const E = {A, calls: []};
  E.tmod = r => { E.calls.push(['tmod', r && r.m, r && r.q]); return (r && r.m > 0 ? r.m : 0) * (r && r.q > 0 ? r.q : 1) + ((r && r.d) || 0) + ((r && r.p) || 0); };
  E.fwdL = (L, r, R) => {
    E.calls.push(['fwdL', L, r && r.m, R]);
    const v = L > 50000 ? 1000 : 0, P = Math.max(L - v, 0), sh = Math.round(P * 0.1), pm = Math.round(P * 0.02), tax = Math.round(P * 0.005), ads = Math.round(P * 0.01), rt = L % 3 === 0 ? 300 : 0;
    const s = P - sh - pm - tax - ads - rt - (E.A.og || 0);
    let u = s - E.tmod(r);
    if (L % 5 === 0) u = 0; else if (L % 7 === 0) u = E.A.wu;   // kasus tepi: untung persis nol dan persis di batas A.wu (agar sabotase < vs <= terdeteksi)
    return {L, v, vs: L % 2 ? 'Voucher Khusus <b>' : '', vq: 1, P, sh, b: {}, pm, tax, ads, rt, s, u};
  };
  E.W = createWarnings({getA: () => E.A, calc: () => ({err: 'x'}), fwd: () => ({u: 0}), rp, fmt, today: () => '2026-11-05', dtx});
  return E;
}
function makeOld(E) {
  const f = new Function('E', "'use strict';var A=E.A,fmt=E.fmt,rp=E.rp,esc=E.esc,tmod=E.tmod,fwdL=E.fwdL,warns=E.W.warns,WN=E.W.WN,pc1=E.W.pc1;\n" + fixture +
    '\nreturn {CR:CR,errH:errH,sp:sp,revHtml:revHtml,setA:function(v){A=v}};');
  return f(E);
}
const makeNewWith = create => E => create({getA: () => E.A, fmt, rp, esc, tmod: E.tmod, fwdL: E.fwdL, warns: E.W.warns, WN: E.W.WN, pc1: E.W.pc1});
function pair(create, mkA) {
  const a = mkA(), eo = makeEnv(clone(a)), en = makeEnv(clone(a));
  eo.esc = esc; eo.fmt = fmt; eo.rp = rp;
  const O = makeOld(eo), N = makeNewWith(create)(en);
  return {eo, en, O, N, setA(v) { eo.A = clone(v); en.A = clone(v); O.setA(eo.A); }};   // restore backup: A ditugaskan ulang di KEDUA sisi
}

const SETS = [0, 1500, 2000, 5000, 20000, -1, '3', undefined, null];
const mkA = r => ({og: pick(r, [0, 0, 1000, 2500, 12345]), wu: pick(r, [0, 500, 2000, 5000, -1]), wm: pick(r, [0, 1, 5, 12.5, 30]), wp: pick(r, [10, 30, 45.5]), sl: pick(r, SETS), sh: pick(r, SETS)});
const mkRow = r => ({n: pick(r, ['', 'Kopi', 'x']), m: pick(r, [0, -1, 5000, 12000, 80000]), q: pick(r, [undefined, 0, 1, 2, 5, 12]), d: pick(r, [0, 0, 1500, 3000]), p: pick(r, [0, 0, 700, 2000]), cx: pick(r, [0, 14000, 30000, 49999, 50001, 100000, 123456]), R: {id: Math.floor(r() * 9)}});
const mkO = r => { const L = pick(r, [0, 1, 7000, 14000, 30000, 50001, 99999, 123456, 1e6]), sh = Math.round(L * pick(r, [0, .05, .1, .3])); return {L, R: {z: Math.floor(r() * 5)}, sh, pm: Math.round(L * pick(r, [0, .02])), tax: Math.round(L * pick(r, [0, .005])), ads: pick(r, [0, 0, 400, 3000]), rt: pick(r, [0, 0, 250]), u: pick(r, [-5000, -1, 0, 1, 1999, 2000, 2001, 9000, 25000, 1e5]), M: L, P: L}; };
const LABELS = ['Tarif administrasi', 'Tarif Promo XTRA', 'Tarif Video XTRA', 'Premi <b>', '', 'Lainnya & "x"'];
const ERRS = ['Voucher 100% tidak valid', 'Diskon coret tidak valid', 'Total tarif 100% atau lebih', 'Target untung di luar batas pencarian harga', 'Galat lain', '<img src=x onerror=1>', '', 'constructor', 'toString', '__proto__'];

/* Satu putaran perbandingan lama-vs-baru. Mengembalikan daftar kegagalan (kosong = identik) dan jumlah perbandingan. */
function compareAll(create, seed, iters) {
  const r = rng(seed), fails = []; let cnt = 0;
  const cmp = (label, a, b) => { cnt++; if (a !== b) fails.push(label + ': baru=' + String(a).slice(0, 140) + ' lama=' + String(b).slice(0, 140)); };
  for (let i = 0; i < iters; i++) {
    const p = pair(create, () => mkA(r));
    for (const phase of [0, 1]) {
      if (phase === 1) p.setA(mkA(r));                                   // restore: A diganti utuh
      for (let k = 0; k < 4; k++) {
        const l = pick(r, LABELS), pp = pick(r, [0, 0.5, 2, 5.55, 100, -1, NaN]), v = pick(r, [0, 1, 800, 25000, -3]), raw = pick(r, [0, 1, 700, 25000, 25001, undefined]);
        cmp('CR #' + i + '/' + phase, tol(() => p.N.CR(l, pp, v, raw)), tol(() => p.O.CR(l, pp, v, raw)));
      }
      for (const e of ERRS) cmp('errH ' + e.slice(0, 20), tol(() => p.N.errH(e)), tol(() => p.O.errH(e)));
      for (let k = 0; k < 4; k++) {
        const o = mkO(r), row = mkRow(r);
        p.eo.calls.length = 0; p.en.calls.length = 0;
        cmp('sp #' + i + '/' + phase, tol(() => p.N.sp(o, clone(row))), tol(() => p.O.sp(o, clone(row))));
        cmp('sp panggilan', JSON.stringify(p.en.calls), JSON.stringify(p.eo.calls));
      }
      for (let k = 0; k < 6; k++) {
        const o = mkO(r), row = mkRow(r), im = pick(r, [null, undefined, 0, 9000, 14000, 30000, 123456, 200000]);
        p.eo.calls.length = 0; p.en.calls.length = 0;
        cmp('revHtml #' + i + '/' + phase, tol(() => p.N.revHtml(clone(row), o, im)), tol(() => p.O.revHtml(clone(row), o, im)));
        cmp('revHtml panggilan', JSON.stringify(p.en.calls), JSON.stringify(p.eo.calls));
      }
    }
  }
  return {fails, cnt};
}

/* ---- 2. differensial utama: modul asli identik dengan teks lama ---- */
{
  const {fails, cnt} = compareAll(createHasilView, 91, 250);
  eq(fails.slice(0, 5), [], 'differensial: tidak ada selisih lama vs baru');
  ok(cnt > 15000, 'differensial: cukup banyak perbandingan (' + cnt + ')');
  n += cnt;
}

/* ---- 3. kebenaran absolut (bukan hanya "sama dengan lama") ---- */
{
  const A = {og: 1000, wu: 2000, wm: 5, wp: 30}, E = makeEnv(A), H = makeNewWith(createHasilView)(E);
  ok(H.CR('Tarif administrasi', 0, 0, 0) === '<div class="rw">Tarif administrasi (0%)<b>Rp 0</b></div>'.replace('Rp 0', rp(0)), 'CR: Tarif administrasi tampil walau persen 0');
  ok(H.CR('Tarif Video XTRA', 0, 0, 0) === '' && H.CR('Tarif Video XTRA', -1, 5, 5) === '', 'CR: persen 0 atau negatif (bukan admin) tidak tampil');
  ok(/\(kena batas\)/.test(H.CR('Tarif Promo XTRA', 4, 100, 101)) && !/kena batas/.test(H.CR('Tarif Promo XTRA', 4, 100, 100)), 'CR: "(kena batas)" hanya bila raw > v');
  ok(/Total tarif \(admin, iklan, premi, dan lainnya\) mencapai 100%/.test(H.errH('Total tarif 100% atau lebih')) && /data-go="set"/.test(H.errH('Total tarif 100% atau lebih')) && />Buka Pengaturan</.test(H.errH('Total tarif 100% atau lebih')), 'errH: tarif 100% menunjuk ke Pengaturan');
  ok(/data-go="vc"/.test(H.errH('Voucher 100% tidak valid')) && /data-go="pt"/.test(H.errH('Diskon coret tidak valid')), 'errH: voucher -> vc, diskon coret -> pt');
  ok(!/<button/.test(H.errH('Target untung di luar batas pencarian harga')), 'errH: target untung tanpa tombol');
  ok(H.errH('<b>x</b>') === '<div class="empty">&lt;b&gt;x&lt;/b&gt;</div>', 'errH: pesan tak dikenal di-escape');
  E.A = {...A, og: 0}; ok(H.sp({sh: 0, pm: 0, tax: 0, ads: 0, rt: 0, u: 0}, {m: 0, d: 0, p: 0}) === '', 'sp: total nol (tanpa ongkir) -> kosong'); E.A = A;
  ok(H.sp({sh: 0, pm: 0, tax: 0, ads: 0, rt: 0, u: 0}, {m: 0, d: 0, p: 0}) !== '', 'sp: ongkir saja (A.og) sudah membuat total > 0');
  const s = H.sp({sh: 100, pm: 0, tax: 0, ads: 0, rt: 0, u: 400}, {m: 500, q: 1, d: 0, p: 0}); // modal 500, potongan 100+og 1000, untung 400
  ok(/Modal 25%/.test(s) && /Potongan 55%/.test(s) && /Untung 20%/.test(s), 'sp: persentase memakai A.og (1000) dalam potongan');
  E.A = {...A, og: 0}; ok(/Potongan 10%/.test(H.sp({sh: 100, pm: 0, tax: 0, ads: 0, rt: 0, u: 400}, {m: 500, q: 1, d: 0, p: 0})), 'sp memakai A hasil restore (og 0)'); E.A = A;
  const o = {L: 30000, R: {}, sh: 3000, pm: 600, tax: 150, ads: 0, rt: 0, u: 9000, M: 30000, P: 30000};
  const rv = H.revHtml({m: 10000, q: 1, d: 0, p: 0, cx: 30000}, o, 20000);
  ok(/Harga jual yang dicek<b>/.test(rv) && /Selisih dari harga impas<b>.*di atas/.test(rv) && /Ongkir ditanggung<b>/.test(rv), 'revHtml: judul, selisih di atas impas, dan ongkir ditanggung (A.og)');
  ok(/di bawah/.test(H.revHtml({m: 10000, q: 1, d: 0, p: 0, cx: 30000}, o, 40000)) && !/Selisih dari harga impas/.test(H.revHtml({m: 10000, q: 1, d: 0, p: 0, cx: 30000}, o, null)), 'revHtml: di bawah impas; tanpa selisih bila impas null');
  E.A = {...A, og: 0}; ok(!/Ongkir ditanggung/.test(H.revHtml({m: 10000, q: 1, d: 0, p: 0, cx: 30000}, o, 20000)), 'revHtml memakai A hasil restore (og 0: baris ongkir hilang)'); E.A = A;
}

/* ---- 4. SABOTASE: tes ini harus MENOLAK versi yang dirusak ---- */
async function mutant(transform) {
  const src = transform(modSrc);
  assert.notEqual(src, modSrc, 'sabotase harus benar-benar mengubah teks'); n++;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
  return mod.createHasilView;
}
const sabotase = [
  ['hapus var A=getA() di revHtml', s => s.replace('function revHtml(r,o,im){var A=getA();', 'function revHtml(r,o,im){var A=(globalThis.__nope||{});')],
  ['hapus var A=getA() di sp', s => s.replace('function sp(o,r){var A=getA();', 'function sp(o,r){var A={og:0};')],
  ['simpan salinan A saat pembuatan (bug restore)', s => s.replace('export function createHasilView({getA,fmt,rp,esc,tmod,fwdL,warns,WN,pc1}){\n', 'export function createHasilView({getA,fmt,rp,esc,tmod,fwdL,warns,WN,pc1}){\nvar __A0=getA();getA=function(){return __A0};\n')],
  ['balik tanda rugi/untung di revHtml (q.u<0 jadi q.u<=0)', s => s.replace("(q.u<0?'Rugi bersih':'Untung bersih')", "(q.u<=0?'Rugi bersih':'Untung bersih')")],
  ['ubah batas warna margin (q.u<A.wu jadi <=)', s => s.replace('q.u<A.wu||x.m<A.wm', 'q.u<=A.wu||x.m<A.wm')],
  ['hilangkan baris ongkir di revHtml', s => s.replace("(A.og?'<div class=\"rw\">Ongkir ditanggung<b>'+rp(A.og)+'</b></div>':'')", "''")],
  ['ubah arah selisih impas (d>=0 jadi d>0)', s => s.replace("(d>=0?rp(d)+' di atas'", "(d>0?rp(d)+' di atas'")],
  ['CR: kena batas tanpa syarat (raw>v jadi raw>=v)', s => s.replace('(raw>v?', '(raw>=v?')],
  ['CR: hilangkan pengecualian Tarif administrasi', s => s.replace("p>0||l=='Tarif administrasi'", 'p>0')],
  ['errH: salah tombol (set jadi vc)', s => s.replace("'set','Buka Pengaturan'", "'vc','Buka Pengaturan'")],
  ['errH: lupa escape pesan tak dikenal', s => s.replace("'<div class=\"empty\">'+esc(e)+'</div>'", "'<div class=\"empty\">'+e+'</div>'")],
  ['sp: ongkir tidak dihitung (A.og dibuang)', s => s.replace('+o.rt+A.og,u=', '+o.rt,u=')],
  ['sp: persen tanpa pembulatan', s => s.replace('Math.round(v/t*100)', 'Math.floor(v/t*100)')],
  ['sp: lebar bar satu desimal jadi dua', s => s.replace('(v/t*100).toFixed(1)', '(v/t*100).toFixed(2)')]
];
for (const [nama, t] of sabotase) {
  const create = await mutant(t);
  const {fails} = compareAll(create, 91, 120);
  ok(fails.length > 0, 'SABOTASE harus terdeteksi: ' + nama);
}
{ // kontrol: versi asli yang sama dijalankan lewat jalur data: tetap lolos (memastikan sabotase gagal karena rusak, bukan karena jalur impor)
  const create = await mutant(s => s + '\n//kontrol');
  ok(compareAll(create, 91, 120).fails.length === 0, 'kontrol: salinan utuh tanpa perubahan fungsi tetap identik');
}

console.log(`Hasil-view differential (v9.32): ${n} assertions passed (modul createHasilView == teks tampilan hasil v9.31 + dua sisipan; A diganti utuh tetap benar; ${sabotase.length} sabotase terdeteksi).`);
