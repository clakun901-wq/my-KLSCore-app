import assert from 'node:assert/strict';
import fs from 'node:fs';
import './../js/money.js';
import {createTariff} from '../js/tariff.js';
import {createPricing} from '../js/pricing.js';
/* Differential: pipa harga sinkron v9.21 (dibekukan di fixtures; memakai A/pr/VNO/vcBest/... sebagai variabel bebas)
   harus identik hasilnya dengan modul baru, termasuk flag VNO, voucher berjalan, ambang min. belanja, dan A yang diganti utuh. */
const fixture=fs.readFileSync(new URL('./fixtures/pricing.pre_v9_22.js.txt',import.meta.url),'utf8');
const origFactory=new Function('A','pr','VNO','adRate','goRate','capG','rate','vcBest','vcThr','vcBad',fixture);
const pr=(r,P)=>globalThis.KalsaraMoney.percentOfRupiah(P,r);
const base={tp:'ns',fb:'no',fl:1250,pb:0,pbc:50000,ad:6.5,ac:'F',gc:'D',sz:'b',gf:100,gfd:'',gad:0,re:0,pp:'no',cgk:60000,cg:40000,cp:60000,cvx:20000,clv:20000,px:0,vx:0,lv:0,gm:0,wu:2000,pm:0,ads:0,rt:0,dv:0,dm:'pct',og:0,pj:0,vm:'no',vv:0,vc:0};
const settings=[base,{...base,fb:'yes',pb:1.8,pj:1.1,og:1500},{...base,vm:'pct',vv:5,vc:15000},{...base,vm:'nom',vv:7000,re:5000,sz:'k'},{...base,px:4,vx:3,lv:2,ads:2,rt:1,dv:10,rd:500},{...base,vm:'pct',vv:100},{...base,dm:'nom',dv:3000,pm:3},{...base,pj:99,ads:5}];
let seed=12345;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
const rows=[{id:'a',m:50000,d:0,p:0,t:5000,q:1,o:{}},{id:'b',m:12500,d:1000,p:500,t:2000,q:3,o:null},{id:'c',m:999,d:0,p:0,t:10000,q:1},{id:'d',m:250000,d:0,p:0,t:0,q:2,o:{sz:'k',gx:2.5,ad:7,px:2}},{id:'e',m:0,t:1},{id:'f',m:80000,d:0,p:0,t:99999999,q:1,o:{}}];
for(let i=0;i<30;i++)rows.push({id:'r'+i,m:Math.floor(rnd()*400000)+500,d:Math.floor(rnd()*3)*500,p:Math.floor(rnd()*2)*300,t:Math.floor(rnd()*30000),q:1+Math.floor(rnd()*4),o:rnd()<.3?{sz:rnd()<.5?'k':'b',gc:'ABCDEFGH'[Math.floor(rnd()*8)]}:{}});
const vouchers={none:{},best:{vcBest:(L,r)=>L>=100000?{v:Math.min(10000,Math.floor(L*0.1)),s:'Voucher uji',q:{id:'q1'}}:null,vcThr:()=>[100000,250000],vcBad:()=>false},bad:{vcBest:()=>null,vcThr:()=>[],vcBad:r=>r.id==='b'}};
let n=0;const J=x=>JSON.stringify(x,(k,v)=>typeof v==='bigint'?'#'+v:v);
for(const [vn,vh] of Object.entries(vouchers))for(const VNO of [0,1])for(const base0 of settings){
  let A=base0;
  const tariff=createTariff({getA:()=>A});
  const o=origFactory(A,pr,VNO,tariff.adRate,tariff.goRate,tariff.capG,tariff.rate,vh.vcBest,vh.vcThr,vh.vcBad);
  const t=createPricing({getA:()=>A,getVNO:()=>VNO,pr,Money:globalThis.KalsaraMoney,tariff,hooks:{vcBest:()=>vh.vcBest,vcThr:()=>vh.vcThr,vcBad:()=>vh.vcBad}});
  for(const r of rows){
    assert.equal(J(t.calcSync(r)),J(o.calcSync(r)),`calcSync ${vn} VNO=${VNO} ${r.id}`);n++;
    if(r.m>0){const R=(o.calcSync(r)||{}).R;
      assert.equal(J(t.tmod(r)),J(o.tmod(r)));
      assert.equal(J(t.vbest(60000,r)),J(o.vbest(60000,r)));assert.equal(J(t.vbest(150000,r)),J(o.vbest(150000,r)));assert.equal(t.volt(300000,r),o.volt(300000,r));n+=4;
      if(R){for(const L of [1000,50000,123456,300000]){assert.equal(J(t.fwdL(L,r,R)),J(o.fwdL(L,r,R)));assert.equal(J(t.fees(L,R)),J(o.fees(L,R)));n+=2}
        assert.equal(J(t.fwd(r.m,r,R)),J(o.fwd(r.m,r,R)));assert.equal(t.impas(r,R),o.impas(r,R));n+=2}}
  }
}
/* A diganti utuh (restore/reset) harus terbaca terbaru; hook yang belum terpasang diperlakukan seperti typeof!=='function' */
let A2={...base};const tar=createTariff({getA:()=>A2});let hv;
const p2=createPricing({getA:()=>A2,getVNO:()=>0,pr,Money:globalThis.KalsaraMoney,tariff:tar,hooks:{vcBest:()=>hv,vcThr:()=>undefined,vcBad:()=>undefined}});
const r0=rows[0];const c1=p2.calcSync(r0);A2={...base,fb:'yes',fl:9000};const c2=p2.calcSync(r0);assert.notEqual(c1.P,c2.P);
hv=()=>({v:5000,s:'x',q:null});assert.equal(p2.vbest(100000,r0).v,5000);hv=undefined;assert.equal(p2.vbest(100000,r0).v,0);n+=3;
console.log(`Pricing module: ${n} assertions passed (differential vs kode v9.21 sebelum dipindah).`);
