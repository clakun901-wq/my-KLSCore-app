/*CALC*/
var {gcOf,goT,capG,gfac,goRate,adRate,rate}=createTariff({getA:function(){return A}});
/*5.39: voucher otomatis. Voucher manual (panel) dan voucher berjalan di kartu Promosi bersaing; yang potongannya terbesar (harga pembeli paling rendah) dipakai.*/
var VNO=0;
var {vbest,volt,fees,tmod,fwdL,fwd,impas,calcSync}=createPricing({getA:function(){return A},getVNO:function(){return VNO},pr:pr,Money:globalThis.KalsaraMoney,
 tariff:{adRate:adRate,goRate:goRate,capG:capG,rate:rate},
 hooks:{vcBest:function(){return typeof vcBest==='function'?vcBest:undefined},vcThr:function(){return typeof vcThr==='function'?vcThr:undefined},vcBad:function(){return typeof vcBad==='function'?vcBad:undefined}}});
/*v9.9: cache hasil kalkulator berkunci isi. Kunci = versi global (tanggal, A, PRM; dihitung sekali per tugas) + field yang dibaca rumus (id,m,d,p,t,q,o).
  Produk yang usang dihitung SEKALIGUS di Worker ('calculate-batch', satu kiriman, tanpa O(n^2)); selama itu upd() berjalan ringan (hanya kartu terbangun).
  Satu produk yang diedit dihitung sinkron (sekitar 0,2 ms). Jalur gagal/tanpa Worker tetap memakai hitungan sinkron v5.82.*/
var CC=new Map(),GK=null,GKV=0,GKS='',PW=null,PWQ=false,PWN={},PWFAIL=-1,BATCH_MIN=30,BATCH_STALE=12;
function gver(){if(GK===null){var s;try{s=JSON.stringify([today(),A,PRM])}catch(e){s='x'+Math.random()}if(s!==GKS){GKS=s;GKV++}GK=GKV;Promise.resolve().then(function(){GK=null})}return GK}
function rkey(r){return gver()+'|'+r.id+'|'+r.m+'|'+r.d+'|'+r.p+'|'+r.t+'|'+r.q+'|'+JSON.stringify(r.o||null)}
function staleRows(){var out=[];rows.forEach(function(r){if(r&&r.m>0&&!CC.has(rkey(r)))out.push(r)});return out}
function prewarm(list,gv){
 var W=globalThis.KalsaraWorker;if(!W||PWFAIL===gv)return null;
 if(PW&&PW.gv===gv)return PW.p;
 PWN[gv]=(PWN[gv]||0)+1;
 var keys=list.map(rkey),byId={};PRM.forEach(function(q){if(q&&q.id!==undefined)byId[q.id]=q});
 var p=W.compute('calculate-batch',{settings:A,promos:PRM,today:today(),slim:true,products:list.map(function(r){return{id:r.id,m:r.m,d:r.d,p:r.p,t:r.t,q:r.q,o:r.o}})}).then(function(res){
  if(gver()!==gv||!Array.isArray(res))return false;
  if(CC.size>rows.length*3+200)CC.clear();
  res.forEach(function(o,i){if(o&&o.vq&&o.vq.id!==undefined&&byId[o.vq.id])o.vq=byId[o.vq.id];CC.set(keys[i],o)});return true
 }).catch(function(e){PWFAIL=gv;console.warn('Worker batch gagal; memakai hitungan sinkron.',e);return false}).finally(function(){if(PW&&PW.p===p)PW=null});
 PW={gv:gv,p:p};return p}
function pwKick(p){if(PWQ)return;PWQ=true;var go=function(){PWQ=false;upd(false)};p.then(go,go)}
function calc(r){
 if(!r||!(r.m>0))return null;
 if(VNO)return calcSync(r); // The legacy comparison panel deliberately disables vouchers.
 var k=rkey(r),h=CC.get(k);
 if(h!==undefined)return h;
 var o=calcSync(r);CC.set(k,o);return o
}
/*END*/
