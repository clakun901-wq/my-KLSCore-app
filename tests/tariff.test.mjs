import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GO,GO2,GO2D,AD,createTariff} from '../js/tariff.js';
/* Differential: kode tarif v9.20 (dibekukan di fixtures) harus identik hasilnya dengan modul baru, termasuk sebelum/sesudah 2026-12-01. */
const RealDate=Date;
const fixed=iso=>{globalThis.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[iso]))}static now(){return new RealDate(iso).valueOf()}}};
const fixture=fs.readFileSync(new URL('./fixtures/tariff.pre_v9_21.js.txt',import.meta.url),'utf8');
let n=0;
const base={tp:'ns',fb:'no',fl:1250,ad:6.5,ac:'F',gc:'D',sz:'b',gf:100,gfd:'',gad:0,cgk:60000,cg:40000,gm:0,pm:0,ads:0,rt:0,px:0,vx:0,lv:0,dv:0};
const As=[base,{...base,gc:'man',gm:5.5},{...base,sz:'k',gad:1.5},{...base,gf:80,gfd:'2026-11-01'},{...base,gf:80,gfd:'2027-01-01'},{...base,cgk:80000,cg:60000},{...base,tp:'ml',ac:'C'},{...base,tbl:{GO:{D:[1,2]},AD:{}}},{...base,gc:'none'},{...base,px:4.5,vx:3}];
const rs=[{o:{}},{},{o:{gx:3}},{o:{gx:0}},{o:{g2:'B'}},{o:{gc:'H',sz:'k'}},{o:{ad:7.7}},{o:{ac:'A'}},{o:{ac:'I'}},{o:{ac:'Z'}},{o:{px:2.2,sz:'k'}},{o:{gc:'man'}}];
for(const today of ['2026-11-02T12:00:00+07:00','2026-12-01T12:00:00+07:00','2026-12-05T12:00:00+07:00','2027-03-01T12:00:00+07:00']){
  for(const A of As){
    fixed(today);
    // fixture memakai global A dan today(); sediakan lewat closure
    const origFactory=new Function('A','today',fixture+'');
    const o=origFactory(A,()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')});
    const t=createTariff({getA:()=>A});
    for(const r of rs){
      for(const k of ['goRate','adRate']){assert.ok(Object.is(o[k](r),t[k](r)),`${k} ${today} ${JSON.stringify(A)} ${JSON.stringify(r)}`);n++}
      assert.deepEqual(o.gcOf(r),t.gcOf(r));assert.deepEqual(o.rate(r,'px'),t.rate(r,'px'));assert.deepEqual(o.rate(r,'ads'),t.rate(r,'ads'));n+=3;
    }
    for(const c of 'ABCDEFGHXN'){assert.deepEqual(o.goT(c),t.goT(c),`goT ${c}`);n++}
    for(const sk of [true,false]){assert.equal(o.capG(sk),t.capG(sk));n++}
    assert.equal(o.gfac(),t.gfac());n++;
  }
}
globalThis.Date=RealDate;
assert.deepEqual(GO,{A:[1,2.5],B:[2,3.5],C:[3.5,5],D:[5.5,7],E:[6,7.5],F:[6.5,8],G:[7.5,9],H:[8,9.5]});assert.equal(GO2D,'2026-12-01');assert.equal(Object.keys(GO2).length,8);assert.equal(Object.keys(AD).length,9);n+=4;
/* tabel adalah objek bersama yang boleh dimutasi di tempat (tblSync) dan fungsi tarif ikut melihatnya */
const A2={...base,tbl:undefined};const t2=createTariff({getA:()=>A2});const before=t2.adRate({o:{ac:'F'}});AD.F=[1,1];assert.equal(t2.adRate({o:{ac:'F'}}),1);AD.F=[6.5,7.2];assert.equal(t2.adRate({o:{ac:'F'}}),before);n+=3;
/* A diganti utuh (restore/reset) harus terbaca terbaru */
let cur={...base,ad:1,ac:'ZZ'};const t3=createTariff({getA:()=>cur});assert.equal(t3.adRate({o:{}}),1);cur={...base,ad:9,ac:'ZZ'};assert.equal(t3.adRate({o:{}}),9);n+=2;
console.log(`Tariff module: ${n} assertions passed (differential vs kode v9.20 sebelum dipindah).`);
