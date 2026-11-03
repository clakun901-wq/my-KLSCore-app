/* Cache hasil kalkulator + pra-hitung batch di Worker (v9.9): CC/gver/rkey/staleRows/prewarm/pwKick/calc, plus invalidate() dan prewarmStale() yang
   menggantikan penulisan langsung GK=null dan blok pra-hitung di upd(). Dipindahkan dari js/legacy/10-calc.js (tahap 4d).
   State cache (CC, GK, PW, PWN, PWFAIL, ...) kini privat di closure; state aplikasi lewat getter (A/PRM/rows diganti utuh saat restore),
   getWorker dibaca saat dipanggil (Worker dipasang belakangan), onReady memicu upd(false) setelah batch selesai, calcSync dari pricing.js. */
import {today} from './format.js';
export function createCalcCache({getA,getPRM,getRows,getVNO,getWorker,calcSync,onReady}){
  /*v9.9: cache hasil kalkulator berkunci isi. Kunci = versi global (tanggal, A, PRM; dihitung sekali per tugas) + field yang dibaca rumus (id,m,d,p,t,q,o).
    Produk yang usang dihitung SEKALIGUS di Worker ('calculate-batch', satu kiriman, tanpa O(n^2)); selama itu upd() berjalan ringan (hanya kartu terbangun).
    Satu produk yang diedit dihitung sinkron (sekitar 0,2 ms). Jalur gagal/tanpa Worker tetap memakai hitungan sinkron v5.82.*/
  var CC=new Map(),GK=null,GKV=0,GKS='',PW=null,PWQ=false,PWN={},PWFAIL=-1,BATCH_MIN=30,BATCH_STALE=12;
  function gver(){if(GK===null){var s;try{s=JSON.stringify([today(),getA(),getPRM()])}catch(e){s='x'+Math.random()}if(s!==GKS){GKS=s;GKV++}GK=GKV;Promise.resolve().then(function(){GK=null})}return GK}
  function rkey(r){return gver()+'|'+r.id+'|'+r.m+'|'+r.d+'|'+r.p+'|'+r.t+'|'+r.q+'|'+JSON.stringify(r.o||null)}
  function staleRows(){var out=[];getRows().forEach(function(r){if(r&&r.m>0&&!CC.has(rkey(r)))out.push(r)});return out}
  function prewarm(list,gv){
   var W=getWorker();if(!W||PWFAIL===gv)return null;
   if(PW&&PW.gv===gv)return PW.p;
   PWN[gv]=(PWN[gv]||0)+1;
   var keys=list.map(rkey),byId={};getPRM().forEach(function(q){if(q&&q.id!==undefined)byId[q.id]=q});
   var p=W.compute('calculate-batch',{settings:getA(),promos:getPRM(),today:today(),slim:true,products:list.map(function(r){return{id:r.id,m:r.m,d:r.d,p:r.p,t:r.t,q:r.q,o:r.o}})}).then(function(res){
    if(gver()!==gv||!Array.isArray(res))return false;
    if(CC.size>getRows().length*3+200)CC.clear();
    res.forEach(function(o,i){if(o&&o.vq&&o.vq.id!==undefined&&byId[o.vq.id])o.vq=byId[o.vq.id];CC.set(keys[i],o)});return true
   }).catch(function(e){PWFAIL=gv;console.warn('Worker batch gagal; memakai hitungan sinkron.',e);return false}).finally(function(){if(PW&&PW.p===p)PW=null});
   PW={gv:gv,p:p};return p}
  function pwKick(p){if(PWQ)return;PWQ=true;var go=function(){PWQ=false;onReady()};p.then(go,go)}
  function calc(r){
   if(!r||!(r.m>0))return null;
   if(getVNO())return calcSync(r); // The legacy comparison panel deliberately disables vouchers.
   var k=rkey(r),h=CC.get(k);
   if(h!==undefined)return h;
   var o=calcSync(r);CC.set(k,o);return o
  }
  function invalidate(){GK=null}
  /* Logika "usang -> hitung sekaligus di Worker" yang dulu menempel di upd() (20-hitung-etalase.js); mengembalikan light (true bila batch sedang berjalan). */
  function prewarmStale(only){var light=false;
   if(!only&&getRows().length>=BATCH_MIN&&getWorker()&&!getVNO()){var gv=gver(),st=staleRows();
    if(!st.length)PWN={};
    else if(st.length>=BATCH_STALE&&PWFAIL!==gv&&(PWN[gv]||0)<3){var pp=(PW&&PW.gv!==gv)?PW.p:prewarm(st,gv);if(pp){light=true;pwKick(pp)}}}
   return light}

  return {calc,gver,rkey,staleRows,prewarm,pwKick,invalidate,prewarmStale};
}
