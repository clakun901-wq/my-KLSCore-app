import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as Money from '../js/money.js';
import {rp, fmt} from '../js/format.js';
import {createVoucherRules} from '../js/voucher-rules.js';
/* Differential: aturan voucher v9.24 (dibekukan di fixtures; PRM, today, pr, fmt, rp dan cache VCC sebagai variabel bebas)
   harus identik hasilnya dengan modul baru: pemilihan voucher terbaik, daftar berjalan, ambang min. belanja, jadwal,
   kuota, cache per tanggal, reset, dan PRM yang diganti utuh (restore). */
globalThis.KalsaraMoney = Money;
const fixture = fs.readFileSync(new URL('./fixtures/voucher-rules.pre_v9_25.js.txt', import.meta.url), 'utf8');
const names = ['vdisc', 'cbc', 'dd', 'pst', 'vcList', 'vcApply', 'vcLab', 'vcBest', 'vcBad', 'vcThr'];
const makeOld = new Function('today', 'pr', 'fmt', 'rp',
  'var PRM=[];' + fixture + 'return {' + names.map(n => n + ':' + n).join(',') + ',setPRM:function(v){PRM=v},reset:function(){VCC=null}};');
const pr = (r, P) => Money.percentOfRupiah(P, r);
const J = x => JSON.stringify(x);

let seed = 20261104;
const rnd = n => (seed = (seed * 1664525 + 1013904223) >>> 0) % n;
const pick = a => a[rnd(a.length)];
const dates = ['2026-10-20', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-10', '2026-12-01', ''];
const products = [{id: 'a'}, {id: 'b'}, {id: 'c'}, {id: 'x'}, {}, null, undefined, {id: ''}];
function genPromo(i) {
  const t = rnd(8) === 0 ? pick(['af', 'lv', 'pt', 'fs']) : 'vc';
  const q = {id: 'q' + i, t, jt: pick(['toko', 'produk', 'live', 'video', undefined]), u: pick(['pct', 'nom', 'cb', 'pct', 'nom']),
    a: pick([0, 1, 5, 10, 15.5, 50, 100, 120, 1000, 5000, 25000]), cp: pick([0, 0, 2000, 10000, 50000]),
    b: pick([0, 0, 50000, 100000, 250000]), x: pick([0, 0, 10, 100]), y: pick([0, 1, 10, 99, 100]),
    s: pick(dates), e: pick(dates), n: pick(['', 'Promo uji', 'Gajian'])};
  if (rnd(3) === 0) { q.p = pick(['a', 'b', '']); q.p2 = pick(['c', '']); q.p3 = pick(['x', 'a', '']); }
  return rnd(15) === 0 ? pick([null, undefined]) : q;
}
const amounts = [1, 999, 50000, 99999, 100000, 123456, 250000, 1000000];
let n = 0;
for (let sc = 0; sc < 400; sc++) {
  let day = pick(['2026-11-02', '2026-11-04', '2026-12-01']);
  const today = () => day;
  const o = makeOld(today, pr, fmt, rp);
  let PRM = Array.from({length: rnd(9)}, (_, i) => genPromo(i));
  const t = createVoucherRules({getPRM: () => PRM, today, pr, fmt, rp});
  o.setPRM(PRM);
  const compareAll = label => {
    assert.equal(J(t.vcList()), J(o.vcList()), label + ' vcList');
    for (const r of products) {
      for (const L of amounts) assert.equal(J(t.vcBest(L, r)), J(o.vcBest(L, r)), label + ' vcBest ' + L);
      assert.equal(t.vcBad(r), o.vcBad(r), label + ' vcBad');
      assert.equal(J(t.vcThr(r)), J(o.vcThr(r)), label + ' vcThr');
      n += amounts.length + 2;
    }
  };
  compareAll('awal sc' + sc);
  /* cache per tanggal: ganti hari tanpa reset harus menghasilkan daftar baru yang sama di kedua versi */
  day = day === '2026-12-01' ? '2026-11-02' : '2026-12-01'; compareAll('ganti tanggal sc' + sc);
  /* PRM diubah di tempat TANPA reset: cache usang harus berperilaku sama (tidak langsung terbaca) */
  PRM.push({id: 'qn', t: 'vc', jt: 'toko', u: 'pct', a: 20, b: 0, x: 0, y: 0, s: '', e: ''});
  compareAll('ubah tanpa reset sc' + sc);
  /* reset (pengganti VCC=null): perubahan harus terbaca */
  t.reset(); o.reset(); compareAll('setelah reset sc' + sc);
  /* PRM diganti utuh (restore) lalu reset */
  PRM = Array.from({length: rnd(6)}, (_, i) => genPromo(100 + i)); o.setPRM(PRM); t.reset(); o.reset(); compareAll('PRM baru sc' + sc);
  for (const q of PRM) {
    for (const L of amounts) { assert.equal(t.vdisc(q || {}, L), o.vdisc(q || {}, L)); assert.equal(t.cbc(q || {}, L), o.cbc(q || {}, L)); n += 2; }
    if (q) { assert.equal(J(t.pst(q)), J(o.pst(q))); assert.equal(t.vcLab(q), o.vcLab(q)); n += 2; }
    for (const r of products) { assert.equal(t.vcApply(q || {}, r), o.vcApply(q || {}, r)); n++; }
  }
  for (const a of dates.filter(Boolean)) for (const b of dates.filter(Boolean)) { assert.equal(t.dd(a, b), o.dd(a, b)); n++; }
}
/* fungsi harus tetap bernama sama (audit kompatibilitas dan jejak tumpukan) */
const probe = createVoucherRules({getPRM: () => [], today: () => '2026-11-04', pr, fmt, rp});
for (const name of names) assert.equal(typeof probe[name], 'function', name + ' harus diekspor');
assert.equal(typeof probe.reset, 'function');
/* PRM kosong/belum ada: daftar kosong tanpa error, sama seperti dulu */
assert.deepEqual(probe.vcList(), []); assert.equal(probe.vcBest(100000, {id: 'a'}), null); n += 2;
console.log(`Voucher rules module: ${n} assertions passed (differential vs kode v9.24 sebelum dipindah).`);
