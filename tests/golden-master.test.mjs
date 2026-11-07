import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as KalsaraMoney from '../js/money.js';
import { calculateProduct as workerCalculateProduct } from '../workers/calculator-engine.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = new URL('../', import.meta.url);
const originalHTML = fs.readFileSync(new URL('../source/Kalsara-v5_82.html', import.meta.url), 'utf8');
const originalBlock = [...originalHTML.matchAll(/<script>([\s\S]*?)<\/script>/g)][1]?.[1];
assert.ok(originalBlock, 'Skrip bisnis utama v5.82 harus tersedia');
import {readLegacySource} from './helpers/legacy-source.mjs';
const migratedSource = readLegacySource();
const promoPanelSource = fs.readFileSync(new URL('../js/promosi-panel.js', import.meta.url), 'utf8').replace(/^export /gm, '');
const movedPromoFunctions = new Set(['ppd','pkombo','phm','rw','pinfo']);
const promoDataSource = fs.readFileSync(new URL('../js/promosi-data.js', import.meta.url), 'utf8');
const promoDataBaseline = fs.readFileSync(new URL('./fixtures/app-core.bagian50-data.pre_v9_44.js.txt', import.meta.url), 'utf8');

function fixedDate(iso) {
  return class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [iso])); }
    static now() { return new Date(iso).valueOf(); }
  };
}
const FixedDate = fixedDate('2026-11-02T12:00:00+07:00');
function executablePrefix(source) {
  const end = source.indexOf('/*END*/');
  assert.ok(end >= 0, 'Batas kalkulator kompatibilitas harus ditemukan');
  return source.slice(0, end);
}
function extractFunction(source, name) {
  if (name === 'actPromo') { const at=source.indexOf('function actPromo('); const end=source.indexOf('\n',at); assert.ok(at>=0&&end>at,'Fungsi actPromo harus ditemukan'); return source.slice(at,end); }
  const match = source.match(new RegExp('function ' + name + '\\([\\s\\S]*?(?=\\nfunction )'));
  assert.ok(match, `Fungsi ${name} harus ditemukan`);
  return match[0];
}
/* v9.20: pembaca angka/tanggal kini modul ES (js/format.js); sumber legacy yang dimigrasi memakainya lewat import loader, jadi harness vm menyediakannya tanpa kata kunci export. Sumber v5.82 asli sudah memuatnya sendiri. */
function formatPrelude(source) {
  if (/^function pf\(/m.test(source)) return '';
  const strip = f => fs.readFileSync(new URL('../js/' + f, import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace(/^export /gm, '') + '\n';
  return strip('format.js') + strip('tariff.js') + strip('pricing.js') + strip('calc-cache.js') + strip('voucher-rules.js') + strip('state.js');
}
function createCalc(source, useIntegerMoney, DateImpl = FixedDate) {
  const context = vm.createContext({ Date: DateImpl, console, KalsaraMoney, document: { addEventListener() {} } });
  const promoSource = source === migratedSource ? promoDataBaseline : source;
  const promoStart = Math.max(promoSource.indexOf('var PRM=[],PSEL='), promoSource.indexOf('State.PRM=[];'));
  const promoEnd = promoSource.indexOf('function vscT', promoStart);
  assert.ok(promoStart >= 0 && promoEnd > promoStart, 'Blok rule engine voucher harus ditemukan');
  const voucherBlock = promoSource.slice(promoStart, promoEnd);
  const stateAdapter = source.includes('State.A')
    ? 'var A=State.A,PRM=State.PRM,rows=State.rows;\n'
    : 'var State={};Object.defineProperties(State,{A:{get:function(){return A},set:function(v){A=v}},rows:{get:function(){return rows},set:function(v){rows=v}},PRM:{get:function(){return PRM},set:function(v){PRM=v}},SALES:{get:function(){return []},set:function(v){}},TS:{get:function(){return 0},set:function(v){}}});\n';
  /* v9.25: pst kini di js/voucher-rules.js (dipasang lewat 10-calc.js); sumber v5.82 asli masih memilikinya sebagai fungsi legacy. */
  const movedPromoDataFunctions = new Set(['ptp','actPromo','bis']);
const promoFunctions = ['ptp','pst','actPromo','ppd','pkombo','phm','warns','WN','bis','pc1','rw','pinfo','esc'].filter(name => !(formatPrelude(source) !== '' && name === 'pst')).map(name => (movedPromoFunctions.has(name) ? extractFunction(promoPanelSource, name).replace(/\bD\./g, '') : movedPromoDataFunctions.has(name) && source === migratedSource ? extractFunction(promoDataSource, name) : extractFunction(source, name))).join('\n');
  /* v9.31: warns/pc1/WN kini ada di js/warnings.js dan membaca A lewat getA() (tahap 6d); harness vm menyediakan getA yang membaca A global. Sumber v5.82 asli tidak memanggilnya. */
  vm.runInContext(formatPrelude(source) + executablePrefix(source) + stateAdapter + voucherBlock + 'function getA(){return State.A}\n' + promoFunctions + `
    var __rvc=function(){if(typeof VoucherRules!=='undefined')VoucherRules.reset();else VCC=null};
    var CFG={pt:{n:'Promo Toko',c:'pt'},fs:{n:'Flash Sale Toko Saya',c:'pr'},kh:{n:'Kombo Hemat',c:'kh'},hm:{n:'Hadiah Min. Belanja',c:'hm'}};
    globalThis.__runPromo=(settings,promos,product,offer)=>{
      A=Object.assign({},DEF,settings);PRM=promos;State.A=A;State.PRM=PRM;__rvc();
      const o=calc(product);
      const active=actPromo(product,o);
      const packageHtml=ppd(offer,product,o);
      return {active:active?{a:active.a,t:active.t}:null,packageHtml};
    };
    globalThis.__runPromoPrice=(promo,detail,marketPrice)=>ptp(promo,detail,marketPrice);
    globalThis.__runCombo=(settings,promos,products,combo,gift)=>{A=Object.assign({},DEF,settings);PRM=promos;rows=products;State.A=A;State.PRM=PRM;State.rows=rows;__rvc();return {comboHtml:pkombo(combo),giftHtml:phm(gift)}};
    globalThis.__runCalc=(settings,product)=>{A=Object.assign({},DEF,settings);State.A=A;return calc(product)};
    globalThis.__runCalcPromo=(settings,promos,product)=>{A=Object.assign({},DEF,settings);PRM=promos;State.A=A;State.PRM=PRM;__rvc();VNO=0;return calc(product)};
    globalThis.__runVoucher=(settings,promos,product,price)=>{
      A=Object.assign({},DEF,settings);PRM=promos;State.A=A;State.PRM=PRM;__rvc();VNO=0;
      const list=vcList().map(q=>({id:q.id,t:q.t,jt:q.jt||'toko',u:q.u,a:q.a,cp:q.cp||0,b:q.b||0,x:q.x||0,y:q.y||0,p:q.p||'',p2:q.p2||'',p3:q.p3||'',s:q.s||'',e:q.e||''}));
      const best=vcBest(price,product);
      return {list,best:best?{v:best.v,s:best.s,q:{id:best.q.id,t:best.q.t,jt:best.q.jt||'toko',u:best.q.u,a:best.q.a,b:best.q.b||0,x:best.q.x||0,y:best.q.y||0}}:null,thresholds:vcThr(product),invalid:vcBad(product)};
    };`, context);
  return {calc:context.__runCalc,calcPromo:context.__runCalcPromo,voucher:context.__runVoucher,promo:context.__runPromo,promoPrice:context.__runPromoPrice,combo:context.__runCombo};
}
const legacy = createCalc(originalBlock, false);
const migrated = createCalc(migratedSource, true);
const legacyCalc = legacy.calc;
const migratedCalc = migrated.calc;

function stable(value) { return JSON.stringify(value); }
const curated = [
  [{}, {id:'a',m:50000,q:1,d:0,p:0,t:10000}],
  [{}, {id:'b',m:123456,q:2,d:1200,p:800,t:15000,o:{gc:'D',sz:'b'}}],
  [{dm:'nom',dv:1000,vm:'pct',vv:10,vc:5000}, {id:'c',m:25000,q:1,d:1000,p:0,t:3000}],
  [{ad:8.25,px:4.5,vx:3.2,lv:2.1,pm:1.5,pj:0.5,ads:2,rt:1.25,cg:30000,cp:40000,cvx:20000,clv:10000}, {id:'d',m:99999,q:3,d:0,p:200,t:20000}],
  [{re:1000,rd:1000,dm:'pct',dv:15,fb:'yes',fl:1250}, {id:'e',m:1000000,q:1,d:0,p:0,t:150000}],
];
let assertions = 0;
for (const [settings, product] of curated) {
  const expected = legacyCalc(settings, product);
  assert.equal(stable(migratedCalc(settings, product)), stable(expected), 'Kasus kalkulator terpilih harus sama dengan v5.82');
  const workerResult = workerCalculateProduct({settings, promos:[], product, today:'2026-11-02'});
  if (workerResult && !workerResult.err) delete workerResult.forwardAtIdeal;
  assert.equal(stable(workerResult), stable(expected), 'Kalkulator Worker harus identik dengan v5.82 pada kasus terpilih');
  assertions += 2;
}

// Deterministic differential test: varied fees, caps, quantities, vouchers, discounts and profit targets.
let seed = 123456789;
const rnd = n => (seed = (seed * 1664525 + 1013904223) >>> 0) % n;
for (let i=0; i<1000; i++) {
  const settings = {
    tp:rnd(2)?'ns':'ml', fb:rnd(2)?'yes':'no', fl:rnd(5000), pb:rnd(4), pbc:rnd(100000),
    ad:[2.5,5,6.5,8.25,10][rnd(5)], ac:'ABCDEFGHI'[rnd(9)], gc:'ABCDEFGH'[rnd(8)], sz:rnd(2)?'b':'k',
    gf:80+rnd(41), gad:rnd(100)/100, gm:rnd(1000)/100, px:rnd(1000)/100, vx:rnd(1000)/100,
    lv:rnd(1000)/100, pm:rnd(300)/100, pj:rnd(100)/100, og:rnd(1000), ads:rnd(500)/100,
    rt:rnd(300)/100, pa:rnd(2)?'yes':'no', dm:rnd(2)?'pct':'nom', dv:rnd(40),
    vm:rnd(3)===0?'pct':(rnd(2)?'nom':'none'), vv:rnd(2000), vc:rnd(50000),
    re:rnd(2)?0:1000, rd:[1,10,100,500][rnd(4)]
  };
  const product = {
    id:'golden-'+i, m:1000+rnd(1000000), q:1+rnd(5), d:rnd(1000), p:rnd(1000), t:rnd(50000),
    o:{gc:'ABCDEFGH'[rnd(8)], sz:rnd(2)?'b':'k'}
  };
  const expected = legacyCalc(settings, product);
  const actual = migratedCalc(settings, product);
  assert.equal(stable(actual), stable(expected), `Hasil kalkulator berbeda dari v5.82 pada fixture #${i}`);
  const workerResult = workerCalculateProduct({settings, promos:[], product, today:'2026-11-02'});
  if (workerResult && !workerResult.err) delete workerResult.forwardAtIdeal;
  assert.equal(stable(workerResult), stable(expected), `Kalkulator Worker berbeda dari v5.82 pada fixture #${i}`);
  assertions += 2;
}
console.log(`Golden-master calculator: ${assertions} differential assertions passed against embedded Kalsara v5.82.`);


// Differential tests for automatic store/product vouchers, date windows, quotas,
// minimum-spend thresholds, cashback/Live/Video exclusions, and manual-voucher competition.
const voucherCases = [
  {a:{vm:'none'},p:[{id:'store-pct',t:'vc',jt:'toko',u:'pct',a:15,cp:5000,b:20000,x:100,y:2,s:'2026-11-01',e:'2026-11-10'}],r:{id:'sku-a'},L:50000},
  {a:{vm:'none'},p:[{id:'product-nom',t:'vc',jt:'produk',u:'rp',a:3500,b:10000,p:'sku-a',s:'2026-11-01'}],r:{id:'sku-a'},L:20000},
  {a:{vm:'none'},p:[{id:'wrong-product',t:'vc',jt:'produk',u:'rp',a:9000,p:'sku-b'}],r:{id:'sku-a'},L:50000},
  {a:{vm:'none'},p:[{id:'min-spend',t:'vc',jt:'toko',u:'rp',a:10000,b:60000}],r:{id:'sku-a'},L:50000},
  {a:{vm:'none'},p:[{id:'quota-full',t:'vc',jt:'toko',u:'rp',a:10000,x:5,y:5}],r:{id:'sku-a'},L:50000},
  {a:{vm:'none'},p:[{id:'future',t:'vc',jt:'toko',u:'rp',a:10000,s:'2026-11-05'}],r:{id:'sku-a'},L:50000},
  {a:{vm:'none'},p:[{id:'expired',t:'vc',jt:'toko',u:'rp',a:10000,e:'2026-11-01'}],r:{id:'sku-a'},L:50000},
  {a:{vm:'none'},p:[{id:'cashback',t:'vc',jt:'toko',u:'cb',a:20}],r:{id:'sku-a'},L:50000},
  {a:{vm:'none'},p:[{id:'live',t:'vc',jt:'live',u:'pct',a:50}],r:{id:'sku-a'},L:50000},
  {a:{vm:'pct',vv:10,vc:8000},p:[{id:'auto-better',t:'vc',jt:'toko',u:'rp',a:7000}],r:{id:'sku-a'},L:50000},
  {a:{vm:'pct',vv:10,vc:8000},p:[{id:'auto-worse',t:'vc',jt:'toko',u:'rp',a:2000}],r:{id:'sku-a'},L:50000},
  {a:{vm:'none'},p:[{id:'invalid-100',t:'vc',jt:'toko',u:'pct',a:100}],r:{id:'sku-a'},L:50000}
];
let voucherAssertions=0;
for(const c of voucherCases){
  const expected=legacy.voucher(c.a,c.p,c.r,c.L);
  const actual=migrated.voucher(c.a,c.p,c.r,c.L);
  assert.equal(stable(actual),stable(expected),`Rule engine voucher berbeda dari v5.82 pada kasus ${c.p[0].id}`);
  voucherAssertions++;
}
// Deterministic mixed rules ensure the eligibility filters remain aligned.
for(let i=0;i<100;i++){
  const types=['toko','produk','live','video'], kinds=['pct','rp','cb'];
  const product={id:'sku-'+(rnd(4)),m:10000+rnd(90000),q:1+rnd(3)};
  const promos=Array.from({length:1+rnd(6)},(_,j)=>({id:`vc-${i}-${j}`,t:'vc',jt:types[rnd(types.length)],u:kinds[rnd(kinds.length)],a:1+rnd(100),cp:rnd(15000),b:rnd(80000),x:rnd(20),y:rnd(25),p:'sku-'+rnd(4),p2:'sku-'+rnd(4),p3:'',s:['','2026-11-01','2026-11-05'][rnd(3)],e:['','2026-11-01','2026-11-10'][rnd(3)]}));
  const settings={vm:['none','pct','nom'][rnd(3)],vv:rnd(35),vc:rnd(15000)};
  const price=1000+rnd(150000);
  assert.equal(stable(migrated.voucher(settings,promos,product,price)),stable(legacy.voucher(settings,promos,product,price)),`Rule engine voucher berbeda dari v5.82 pada fixture #${i}`);
  voucherAssertions++;
}
console.log(`Golden-master voucher rules: ${voucherAssertions} differential assertions passed against embedded Kalsara v5.82.`);

// Differential tests for promo selection and Paket Diskon calculations/rendered results.
const promoCases = [
  {a:{},p:[{id:'store-promo',t:'pt',a:10,it:[{p:'sku-a',d:15,h:0}]}],r:{id:'sku-a',m:25000,q:1,d:0,p:0,t:3000},offer:{t:'pd',a:2,b:10,tp:'pct',x:3}},
  {a:{},p:[{id:'flash-sale',t:'fs',a:18000,p:'sku-a',s:'2026-11-01',e:'2026-11-10'}],r:{id:'sku-a',m:25000,q:1,d:0,p:0,t:3000},offer:{t:'pd',a:3,b:5000,tp:'nom',x:2}},
  {a:{},p:[{id:'future-promo',t:'pt',a:10,it:[{p:'sku-a',d:5} ],s:'2026-11-05'}],r:{id:'sku-a',m:80000,q:2,d:1000,p:500,t:10000},offer:{t:'pd',a:2,b:30,tp:'pct',x:0}},
  {a:{},p:[{id:'expired-promo',t:'fs',a:12000,p:'sku-a',e:'2026-11-01'}],r:{id:'sku-a',m:80000,q:2,d:1000,p:500,t:10000},offer:{t:'pd',a:2,b:15000,tp:'hrg',x:1}},
  {a:{fb:'yes',fl:1250,og:200},p:[{id:'pt-product-b',t:'pt',a:20,it:[{p:'sku-b',d:20}]}],r:{id:'sku-a',m:100000,q:1,d:0,p:0,t:15000},offer:{t:'pd',a:1,b:0,tp:'pct',x:0}}
];
let promoAssertions=0;
for(const c of promoCases){
  assert.equal(stable(migrated.promo(c.a,c.p,c.r,c.offer)),stable(legacy.promo(c.a,c.p,c.r,c.offer)),`Promo/Paket Diskon berbeda dari v5.82 pada kasus ${c.p[0]?.id||'tanpa promo'}`);
  promoAssertions++;
}
for(let i=0;i<200;i++){
  const product={id:'sku-'+rnd(5),m:1000+rnd(500000),q:1+rnd(4),d:rnd(5000),p:rnd(2000),t:rnd(80000)};
  const details=Array.from({length:1+rnd(4)},()=>({p:'sku-'+rnd(5),d:rnd(75),h:rnd(2)?0:1000+rnd(300000),l:rnd(5)}));
  const promos=Array.from({length:rnd(5)},(_,j)=>({id:`promo-${i}-${j}`,t:rnd(2)?'pt':'fs',a:1+rnd(70),p:product.id,it:details,s:['','2026-11-01','2026-11-05'][rnd(3)],e:['','2026-11-01','2026-11-10'][rnd(3)]}));
  const settings={fb:rnd(2)?'yes':'no',fl:rnd(3000),og:rnd(1000),ad:[2.5,5,6.5,8.25][rnd(4)],px:rnd(800)/100,vx:rnd(800)/100,pm:rnd(200)/100,pj:rnd(200)/100};
  const offer={t:'pd',a:1+rnd(5),b:1+rnd(80),tp:['pct','nom','hrg'][rnd(3)],x:rnd(5)};
  assert.equal(stable(migrated.promo(settings,promos,product,offer)),stable(legacy.promo(settings,promos,product,offer)),`Promo/Paket Diskon berbeda dari v5.82 pada fixture #${i}`);
  promoAssertions++;
}
let promoPriceAssertions=0;
for(let i=0;i<200;i++){
  const marketPrice=1+rnd(1000000),d={d:rnd(100),h:rnd(2)?0:rnd(1000000)};
  const promo={a:rnd(100),it:[d]};
  assert.equal(migrated.promoPrice(promo,d,marketPrice),legacy.promoPrice(promo,d,marketPrice),`Harga promo produk berbeda dari v5.82 pada fixture #${i}`);
  promoPriceAssertions++;
}
console.log(`Golden-master promo/Paket Diskon: ${promoAssertions} differential assertions passed against embedded Kalsara v5.82.`);
console.log(`Golden-master promo price rules: ${promoPriceAssertions} differential assertions passed against embedded Kalsara v5.82.`);

// Differential tests for Kombo Hemat and Hadiah Minimum Belanja rendering/calculations.
let comboAssertions=0;
for(let i=0;i<100;i++){
  const main={id:'main-'+i,n:'Produk utama '+i,m:5000+rnd(100000),q:1+rnd(3),d:rnd(1000),p:rnd(1000),t:rnd(15000)};
  const add1={id:'add1-'+i,n:'Produk tambahan A '+i,m:3000+rnd(80000),q:1+rnd(3),d:rnd(1000),p:rnd(1000),t:rnd(10000)};
  const add2={id:'add2-'+i,n:'Produk tambahan B '+i,m:2000+rnd(50000),q:1+rnd(3),d:rnd(1000),p:rnd(1000),t:rnd(8000)};
  const gift={id:'gift-'+i,n:'Produk hadiah '+i,m:1000+rnd(30000),q:1,d:rnd(500),p:rnd(500),t:0};
  const products=[main,add1,add2,gift];
  const promos=[{id:'pt-'+i,t:'pt',a:5+rnd(20),it:[{p:main.id,d:5+rnd(25),h:0}]},{id:'fs-'+i,t:'fs',a:10000+rnd(20000),p:main.id,s:['','2026-11-01'][rnd(2)],e:'2026-11-10'}];
  const settings={fb:rnd(2)?'yes':'no',fl:500+rnd(2000),og:rnd(500),ad:[2.5,5,6.5,8.25][rnd(4)],px:rnd(600)/100,vx:rnd(600)/100,pm:rnd(200)/100,pj:rnd(200)/100};
  const combo={t:'kh',mp:[main.id],it:[{p:add1.id,d:rnd(60),h:rnd(2)?0:5000+rnd(50000),l:rnd(4)},{p:add2.id,d:rnd(60),h:rnd(2)?0:3000+rnd(40000),l:rnd(4)}]};
  const giftPromo={t:'hm',mp:[main.id],gf:[gift.id],b:10000+rnd(150000),x:rnd(20)};
  assert.equal(stable(migrated.combo(settings,promos,products,combo,giftPromo)),stable(legacy.combo(settings,promos,products,combo,giftPromo)),`Kombo/Hadiah berbeda dari v5.82 pada fixture #${i}`);
  comboAssertions++;
}
console.log(`Golden-master Kombo Hemat/Hadiah Minimum Belanja: ${comboAssertions} differential assertions passed against embedded Kalsara v5.82.`);

// Pipa Chain of Responsibility (sen) vs v5.82: voucher otomatis/manual, kuota, min. belanja, dan tarif sebelum/sesudah 1 Des 2026.
{
  const legacyDec = createCalc(originalBlock, false, fixedDate('2026-12-05T12:00:00+07:00'));
  const types = ['toko', 'produk', 'live', 'video'], kinds = ['pct', 'rp', 'cb'];
  let pipeAssertions = 0;
  for (let i = 0; i < 1500; i++) {
    const dec = i % 3 === 0, oracle = dec ? legacyDec : legacy, today = dec ? '2026-12-05' : '2026-11-02';
    const settings = {
      tp: rnd(2) ? 'ns' : 'ml', fb: rnd(2) ? 'yes' : 'no', fl: rnd(5000), pb: rnd(4), pbc: rnd(100000),
      ad: [2.5, 5, 6.5, 8.25, 10][rnd(5)], ac: 'ABCDEFGHI'[rnd(9)], gc: 'ABCDEFGH'[rnd(8)], sz: rnd(2) ? 'b' : 'k',
      gf: 80 + rnd(41), gad: rnd(100) / 100, gm: rnd(1000) / 100, px: rnd(1000) / 100, vx: rnd(1000) / 100,
      lv: rnd(1000) / 100, pm: rnd(300) / 100, pj: rnd(100) / 100, og: rnd(1000), ads: rnd(500) / 100, rt: rnd(300) / 100,
      pa: rnd(2) ? 'yes' : 'no', dm: rnd(2) ? 'pct' : 'nom', dv: rnd(40),
      vm: rnd(3) === 0 ? 'pct' : (rnd(2) ? 'nom' : 'none'), vv: rnd(2000), vc: rnd(50000),
      re: rnd(2) ? 0 : 1000, rd: [1, 10, 100, 500][rnd(4)]
    };
    const product = {id: 'sku-' + rnd(4), m: 1000 + rnd(1000000), q: 1 + rnd(5), d: rnd(1000), p: rnd(1000), t: rnd(50000), o: {gc: 'ABCDEFGH'[rnd(8)], sz: rnd(2) ? 'b' : 'k'}};
    const promos = Array.from({length: rnd(4)}, (_, j) => ({
      id: `v-${i}-${j}`, t: 'vc', jt: types[rnd(types.length)], u: kinds[rnd(kinds.length)], a: 1 + rnd(40), cp: rnd(15000), b: rnd(80000),
      x: rnd(20), y: rnd(25), p: 'sku-' + rnd(4), s: ['', '2026-11-01', '2026-12-01'][rnd(3)], e: ['', '2026-11-10', '2026-12-31'][rnd(3)]
    }));
    const expected = oracle.calcPromo(settings, promos, product);
    const actual = workerCalculateProduct({settings, promos, product, today});
    if (actual && !actual.err) delete actual.forwardAtIdeal;
    assert.deepStrictEqual(JSON.parse(stable(actual)), JSON.parse(stable(expected)), `Pipa kalkulator berbeda dari v5.82 pada fixture voucher #${i}`);
    pipeAssertions++;
  }
  console.log(`Golden-master pipa Chain of Responsibility (sen): ${pipeAssertions} differential assertions passed against embedded Kalsara v5.82.`);
}
