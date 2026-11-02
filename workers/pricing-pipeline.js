/* Kalsara pricing pipeline — Chain of Responsibility.
   Seluruh nominal uang di dalam pipa adalah bilangan bulat SEN (Rupiah x 100).
   Persen dihitung dengan BigInt (tanpa float) lalu dibulatkan ke Rupiah penuh
   (setengah menjauhi nol), sehingga hasilnya identik dengan v5.82. Konversi ke
   Rupiah hanya terjadi di batas keluar (toLegacy). Modul ini murni: tanpa DOM,
   tanpa state global, aman dijalankan di Web Worker. */
import * as Money from '../js/money.js';

const SEN = 100;
const SEN_BIG = 100n;
const PCT_DIV = 1000000n * SEN_BIG; // satuan persen (4 desimal) x sen

/* ---------- Aritmetika sen ---------- */
function safe(n) {
  if (!Number.isSafeInteger(n)) throw new RangeError('Total Rupiah melebihi batas integer aman');
  return n;
}
export function toSen(rupiah) {
  if (!Number.isSafeInteger(rupiah)) throw new RangeError('Nominal Rupiah harus berupa integer aman');
  return safe(rupiah * SEN);
}
export const fromSen = sen => sen / SEN;
const sum = (...v) => safe(v.reduce((a, b) => a + b, 0));
/* persen dari nominal sen, dibulatkan ke Rupiah penuh; units = Money.percentUnits(rate) */
function pctOf(sen, units) {
  const p = BigInt(sen) * units;
  const r = p >= 0n ? (p + PCT_DIV / 2n) / PCT_DIV : (p - PCT_DIV / 2n) / PCT_DIV;
  return safe(Number(r) * SEN);
}
function discounted(sen, units) { // lantai ke Rupiah penuh, minimal 0
  const n = BigInt(sen) * (1000000n - units), d = 1000000n * SEN_BIG;
  let q = n / d;
  if (n < 0n && n % d !== 0n) q--;
  if (q < 0n) q = 0n;
  return safe(Number(q) * SEN);
}
function grossUp(sen, units) { // pembulatan ke atas ke Rupiah penuh
  const base = 1000000n - units;
  if (sen < 0) throw new RangeError('Harga setelah diskon tidak boleh negatif');
  if (units < 0n || base <= 0n) throw new RangeError('Diskon harus >= 0% dan < 100%');
  const n = BigInt(sen) * 1000000n, d = base * SEN_BIG;
  return safe((Number(n / d) + (n % d === 0n ? 0 : 1)) * SEN);
}

/* ---------- Pola Chain of Responsibility ---------- */
export class Handler {
  setNext(next) { this.next = next; return next; }
  handle(ctx) {
    this.process(ctx);
    if (ctx.halt || !this.next) return ctx;
    return this.next.handle(ctx);
  }
  process() {}
}
export function link(...handlers) {
  handlers.reduce((a, b) => { a.setNext(b); return b; });
  return handlers[0];
}

/* ---------- Konfigurasi & tarif (persentase, bukan uang) ---------- */
export const DEF = {tp:'ns',fb:'no',fl:1250,pb:0,pbc:50000,ad:6.5,ac:'F',gc:'D',sz:'b',gf:100,gfd:'',gad:0,re:0,pp:'no',cgk:60000,cvx:20000,clv:20000,px:0,vx:0,lv:0,vp:'no',lp:'no',gm:0,wu:2000,wm:1,wp:30,cg:40000,cp:60000,pa:'yes',dm:'pct',dv:30,vm:'none',vv:0,vc:0,pm:0.5,pj:0.5,og:0,rd:100,ads:0,rt:0,sl:10,sh:5,sdy:7,tbl:null,tchk:'',tcd:30};
const GO = {A:[1,2.5],B:[2,3.5],C:[3.5,5],D:[5.5,7],E:[6,7.5],F:[6.5,8],G:[7.5,9],H:[8,9.5]};
const GO2 = {A:[1.5,3.5],B:[5,7],C:[6.5,8.5],D:[8.5,10.5],E:[9,11],F:[9.5,11.5],G:[10.5,12],H:[11,13]};
const GO2_DATE = '2026-12-01';
const AD = {A:[10,11.7],B:[9.5,10.45],C:[9,10.2],D:[8.25,9.95],E:[6.75,7.7],F:[6.5,7.2],G:[5.25,6.2],H:[4.25,4.7],I:[2.5,2.5]};

export function localToday(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Kebijakan tarif yang bergantung tanggal & pengaturan. */
class RatePolicy {
  constructor(A, today) { this.A = A; this.today = today; }
  gcOf(r) { const o = r.o || {}; if (this.today >= GO2_DATE && o.g2) return o.g2; return o.gc || this.A.gc; }
  goT(c) { const A = this.A; if (this.today >= GO2_DATE && !(A.tbl && A.tbl.GO && A.tbl.GO[c]) && GO2[c]) return GO2[c]; return GO[c]; }
  capG(sk) { const A = this.A; if (this.today >= GO2_DATE && (sk ? A.cgk === 60000 : A.cg === 40000)) return sk ? 80000 : 60000; return sk ? A.cgk : A.cg; }
  gfac() { const A = this.A; if (A.gfd && this.today > A.gfd) return 100; return A.gf; }
  goRate(r) {
    const A = this.A, ov = r.o && r.o.gx;
    if (ov !== null && ov !== undefined) return Math.round(ov * this.gfac() * 100) / 10000;
    const c = this.gcOf(r), s = (r.o && r.o.sz) || A.sz;
    if (c == 'man') return Math.round(A.gm * this.gfac() * 100) / 10000;
    const t = this.goT(c);
    return t ? Math.max(Math.round((Math.round(t[s == 'k' ? 1 : 0] * this.gfac() * 100) / 10000 - (A.gad || 0)) * 10000) / 10000, 0) : 0;
  }
  adRate(r) {
    if (r.o && r.o.ad !== null && r.o.ad !== undefined) return r.o.ad;
    const t = AD[(r.o && r.o.ac) || this.A.ac];
    return t ? t[this.A.tp == 'ml' ? 1 : 0] : this.A.ad;
  }
  rate(r, k) { const v = r.o && r.o[k]; return (v === null || v === undefined) ? this.A[k] : v; }
}

/* Kebijakan voucher (manual + otomatis dari kartu Promosi). */
class VoucherPolicy {
  constructor(A, promos, today) {
    this.A = A; this.today = today; this.disabled = false;
    this.list = [];
    for (const q of promos) {
      if (!q || q.t != 'vc') continue;
      const jt = q.jt || 'toko';
      if (jt == 'live' || jt == 'video' || q.u == 'cb' || !(q.a > 0)) continue;
      if (!this.active(q)) continue;
      if (q.x > 0 && (q.y || 0) >= q.x) continue;
      this.list.push(q);
    }
    this.manualPctUnits = A.vm == 'pct' ? Money.percentUnits(A.vv) : 0n;
  }
  active(p) {
    const t = this.today;
    if (!p.s && !p.e) return true;
    if (p.e && t > p.e) return false;
    if (p.s && t < p.s) return false;
    return true;
  }
  applies(q, r) { if ((q.jt || 'toko') == 'toko') return true; return !!(r && r.id) && [q.p, q.p2, q.p3].indexOf(r.id) >= 0; }
  label(q) {
    const fmt = v => String(v).replace('.', ',');
    const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
    return ((q.jt || 'toko') == 'produk' ? 'Voucher Produk ' : 'Voucher Toko ') + (q.u == 'pct' ? fmt(q.a) + '%' : rp(q.a)) + (q.n ? ' (' + q.n + ')' : '');
  }
  discount(q, L) {
    if (q.u == 'cb') return 0;
    if (q.u == 'pct') { const v = pctOf(L, Money.percentUnits(q.a)); return q.cp > 0 ? Math.min(v, toSen(Math.round(q.cp))) : v; }
    return Math.min(toSen(Math.round(q.a)), L);
  }
  best(L, r) {
    if (this.disabled) return {v: 0, s: '', q: null};
    const A = this.A;
    let m = 0;
    if (A.vm == 'pct') m = Math.min(pctOf(L, this.manualPctUnits), A.vc > 0 ? toSen(A.vc) : toSen(1e12));
    else if (A.vm == 'nom') m = Math.min(toSen(Math.round(A.vv)), L);
    let b = {v: m, s: m > 0 ? 'Voucher toko manual' : '', q: null};
    let auto = null;
    for (const q of this.list) {
      if (!this.applies(q, r)) continue;
      if (q.b > 0 && L < toSen(q.b)) continue;
      const d = this.discount(q, L);
      if (d > 0 && (!auto || d > auto.v)) auto = {v: d, s: this.label(q), q};
    }
    if (auto && auto.v > b.v) b = auto;
    return b;
  }
  invalid(r) { return this.list.some(q => this.applies(q, r) && q.u == 'pct' && q.a >= 100); }
  thresholds(r) {
    const t = [];
    for (const q of this.list) if (this.applies(q, r) && q.b > 0 && t.indexOf(q.b) < 0) t.push(q.b);
    return t.sort((x, y) => x - y).map(toSen);
  }
}

/* ---------- Rantai 1: evaluasi satu harga tayang (listing) ---------- */
class VoucherHandler extends Handler {
  process(c) { const b = c.vouchers.best(c.L, c.product); c.v = b.v; c.vs = b.s; c.vq = b.q; c.P = sum(c.L, -c.v); }
}
class PlatformFeeHandler extends Handler {
  process(c) {
    const R = c.R, P = c.P, U = R.u;
    const b = {
      fx: c.A.fb == 'yes' ? toSen(c.A.fl) : 0,
      ad: pctOf(P, U.ad),
      gx: Math.min(pctOf(P, U.gx), R.cg),
      px: Math.min(pctOf(P, U.px), R.cp),
      vx: Math.min(pctOf(P, U.vx), R.cvx),
      lv: Math.min(pctOf(P, U.lv), R.clv),
      pay: Math.min(pctOf(P, U.pb), R.cpb)
    };
    c.b = b; c.sh = sum(b.fx, b.ad, b.gx, b.px, b.vx, b.lv, b.pay);
  }
}
class DeductionHandler extends Handler {
  process(c) {
    const P = c.P, U = c.R.u;
    c.pm = pctOf(P, U.pm); c.tax = pctOf(P, U.pj); c.ads = pctOf(P, U.ads); c.rt = pctOf(P, U.rt);
  }
}
class SettlementHandler extends Handler {
  process(c) { c.s = sum(c.P, -c.sh, -c.pm, -c.tax, -c.ads, -c.rt, -c.og); }
}
class ProfitHandler extends Handler {
  process(c) { c.u = sum(c.s, -c.cost); }
}

/* ---------- Rantai 2: cari harga awal (dengan diskon coret) ---------- */
class ValidateInputHandler extends Handler {
  process(c) { if (!(c.product.m > 0)) { c.result = null; c.halt = true; } }
}
class RateResolverHandler extends Handler {
  process(c) {
    const {A, product: r, rates: pol} = c;
    const Q = r.q > 0 ? r.q : 1, sk = ((r.o && r.o.sz) || A.sz) == 'k';
    const R = {
      ad: pol.adRate(r), gx: pol.goRate(r),
      cg: pol.capG(sk) * Q, cp: A.cp * Q, cvx: A.cvx * Q, clv: A.clv * Q, cpb: A.pbc * Q,
      px: pol.rate(r, 'px'), vx: pol.rate(r, 'vx'), lv: pol.rate(r, 'lv'), pm: pol.rate(r, 'pm'),
      ads: pol.rate(r, 'ads'), rt: pol.rate(r, 'rt'),
      dv: (A.pa == 'no' && !(r.o && r.o.dv !== null && r.o.dv !== undefined) ? 0 : pol.rate(r, 'dv')),
      dm: A.dm
    };
    c.Rr = R; // tarif dalam Rupiah (untuk keluaran)
    c.R = {
      cg: toSen(R.cg), cp: toSen(R.cp), cvx: toSen(R.cvx), clv: toSen(R.clv), cpb: toSen(R.cpb),
      u: {ad: Money.percentUnits(R.ad), gx: Money.percentUnits(R.gx), px: Money.percentUnits(R.px), vx: Money.percentUnits(R.vx),
          lv: Money.percentUnits(R.lv), pm: Money.percentUnits(R.pm), ads: Money.percentUnits(R.ads), rt: Money.percentUnits(R.rt),
          pb: Money.percentUnits(A.pb), pj: Money.percentUnits(A.pj)}
    };
    c.Q = Q;
  }
}
class BreakEvenEstimateHandler extends Handler {
  process(c) {
    const {A, product: r, Rr} = c;
    c.cost = sum(multiplySen(r.m, c.Q), toSen(r.d), toSen(r.p));
    const K = sum(c.cost, toSen(r.t), c.og), fx = A.fb == 'yes' ? toSen(A.fl) : 0;
    const CP = [[Rr.gx, Rr.cg], [Rr.px, Rr.cp], [A.pb, Rr.cpb], [Rr.vx, Rr.cvx], [Rr.lv, Rr.clv]];
    const est = Money.estimateGrossPrice(fromSen(sum(K, fx)), [Rr.ad, Rr.pm, A.pj, Rr.ads, Rr.rt], CP.map(x => ({rate: x[0], cap: x[1]})));
    if (est === null) { c.result = {err: 'Total tarif 100% atau lebih'}; c.halt = true; return; }
    c.P0 = toSen(est);
  }
}
function multiplySen(rupiah, q) {
  if (!Number.isSafeInteger(q)) throw new RangeError('Kuantitas harus berupa integer aman');
  return safe(toSen(rupiah) * q);
}
class VoucherFixedPointHandler extends Handler {
  process(c) {
    const {A, product: r, vouchers: V} = c;
    if (A.vm == 'pct' && Money.percentUnits(A.vv || 0) >= 1000000n) { c.result = {err: 'Voucher 100% tidak valid'}; c.halt = true; return; }
    if (V.invalid(r)) { c.result = {err: 'Voucher 100% tidak valid'}; c.halt = true; return; }
    const P = c.P0; let L = P;
    for (let i = 0; i < 400; i++) { const L2 = sum(P, V.best(L, r).v); if (L2 <= L) break; L = L2; }
    c.Lideal = L;
  }
}
class ListingGrossUpHandler extends Handler {
  process(c) {
    const R = c.Rr;
    if (R.dm == 'nom') c.M0 = sum(c.Lideal, toSen(Math.round(R.dv)));
    else {
      const u = Money.percentUnits(R.dv);
      if (u >= 1000000n) { c.result = {err: 'Diskon coret tidak valid'}; c.halt = true; return; }
      c.M0 = grossUp(c.Lideal, u);
    }
    if (!Number.isSafeInteger(c.M0)) { c.result = {err: 'Harga awal melebihi batas integer aman'}; c.halt = true; }
  }
}
class SearchSeedHandler extends Handler {
  process(c) {
    const A = c.A, re = +A.re || 0, st = re > 0 ? 1000 : (A.rd > 0 ? A.rd : 1), lb = re > 0 ? re : st;
    const stS = st * SEN, lbS = lb * SEN, reS = re * SEN, M0 = c.M0;
    c.step = stS; c.floor = lbS;
    c.M = re > 0
      ? Math.max(reS, Math.ceil((M0 - reS) / (1000 * SEN)) * 1000 * SEN + reS - 3000 * SEN)
      : Math.max(stS, Math.ceil(M0 / stS) * stS - 3 * stS);
  }
}
class PriceSearchHandler extends Handler {
  process(c) {
    const st = c.step, t = toSen(c.product.t), M0s = c.M;
    let M = M0s, o, hit = false, k = 0;
    for (; k < 64; k++) { o = c.evaluate(M); if (o.u >= t) { hit = true; break; } M += st; }
    if (!hit) {
      let lo = 63, hi = -1, g = 64;
      while (hi < 0) {
        if (g > 19999) g = 19999;
        const q0 = c.evaluate(M0s + g * st);
        if (q0.u >= t) { hi = g; o = q0; } else { lo = g; if (g >= 19999) break; g *= 2; }
      }
      if (hi < 0) { c.result = {err: 'Target untung di luar batas pencarian harga'}; c.halt = true; return; }
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1, qm = c.evaluate(M0s + mid * st);
        if (qm.u >= t) { hi = mid; o = qm; } else lo = mid;
      }
      for (let j = Math.max(64, hi - 24); j < hi; j++) { const qj = c.evaluate(M0s + j * st); if (qj.u >= t) { hi = j; break; } }
      M = M0s + hi * st; o = c.evaluate(M);
    }
    c.M = M; c.o = o;
  }
}
class TightenHandler extends Handler {
  process(c) {
    const st = c.step, t = toSen(c.product.t);
    let M = c.M, o = c.o;
    for (let z = 0; z < 50 && M - st >= c.floor; z++) {
      const q = c.evaluate(M - st);
      if (q.u >= t) { M -= st; o = q; } else break;
    }
    c.M = M; c.o = o;
  }
}

/* ---------- Mesin ---------- */
export class PricingEngine {
  constructor({settings = {}, promos = [], today} = {}) {
    this.A = Object.assign({}, DEF, settings);
    this.today = today || localToday();
    this.rates = new RatePolicy(this.A, this.today);
    this.vouchers = new VoucherPolicy(this.A, Array.isArray(promos) ? promos : [], this.today);
    this.og = toSen(this.A.og);
    this.forwardChain = link(new VoucherHandler(), new PlatformFeeHandler(), new DeductionHandler(), new SettlementHandler(), new ProfitHandler());
    this.searchChain = link(new ValidateInputHandler(), new RateResolverHandler(), new BreakEvenEstimateHandler(), new VoucherFixedPointHandler(),
      new ListingGrossUpHandler(), new SearchSeedHandler(), new PriceSearchHandler(), new TightenHandler());
  }
  /* evaluasi satu harga tayang L (sen) — rantai 1 */
  evaluateListing(L, product, R, cost) {
    const c = {A: this.A, vouchers: this.vouchers, product, R, cost, og: this.og, L};
    this.forwardChain.handle(c);
    return c;
  }
  /* hasil kalkulasi untuk satu produk, bentuk keluaran sama dengan v5.82 (Rupiah) */
  calculate(product) {
    const c = {A: this.A, product, rates: this.rates, vouchers: this.vouchers, og: this.og, halt: false, result: undefined};
    c.evaluate = M => {
      const R = c.Rr;
      const L = Math.max(R.dm == 'nom' ? sum(M, -toSen(Math.round(R.dv))) : discounted(M, Money.percentUnits(R.dv)), 0);
      const o = this.evaluateListing(L, product, c.R, c.cost);
      o.M = M;
      return o;
    };
    this.searchChain.handle(c);
    if (c.result !== undefined) return c.result;
    return toLegacy(c.o, c.Rr, c.R, c);
  }
}

function toLegacy(o, Rr, Rs, c) {
  const b = o.b;
  const out = {
    L: fromSen(o.L), v: fromSen(o.v), vs: o.vs, vq: o.vq, P: fromSen(o.P), sh: fromSen(o.sh),
    b: {fx: fromSen(b.fx), ad: fromSen(b.ad), gx: fromSen(b.gx), px: fromSen(b.px), vx: fromSen(b.vx), lv: fromSen(b.lv), pay: fromSen(b.pay)},
    pm: fromSen(o.pm), tax: fromSen(o.tax), ads: fromSen(o.ads), rt: fromSen(o.rt), s: fromSen(o.s), u: fromSen(o.u),
    M: fromSen(o.M), R: Rr
  };
  Object.defineProperty(out, '__sen', {value: {R: Rs, cost: c.cost}, enumerable: false});
  return out;
}

/* API untuk Worker */
export function calculateProduct(payload = {}) {
  const engine = new PricingEngine({settings: payload.settings, promos: payload.promos, today: payload.today});
  return calculateWith(engine, payload.product || {});
}
export function calculateBatch(payload = {}) {
  const engine = new PricingEngine({settings: payload.settings, promos: payload.promos, today: payload.today});
  return (payload.products || []).map(p => {
    try { return calculateWith(engine, p); } catch (e) { return {err: e.message}; }
  });
}
function calculateWith(engine, product) {
  const result = engine.calculate(product);
  if (!result || result.err) return result;
  const L = toSen(result.L);
  const f = engine.evaluateListing(L, product, result.__sen.R, result.__sen.cost);
  const b = f.b;
  return {...result, forwardAtIdeal: {
    L: fromSen(f.L), v: fromSen(f.v), vs: f.vs, vq: f.vq, P: fromSen(f.P), sh: fromSen(f.sh),
    b: {fx: fromSen(b.fx), ad: fromSen(b.ad), gx: fromSen(b.gx), px: fromSen(b.px), vx: fromSen(b.vx), lv: fromSen(b.lv), pay: fromSen(b.pay)},
    pm: fromSen(f.pm), tax: fromSen(f.tax), ads: fromSen(f.ads), rt: fromSen(f.rt), s: fromSen(f.s), u: fromSen(f.u)
  }};
}
