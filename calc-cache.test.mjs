import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCalcCache} from '../js/calc-cache.js';
/* Differential: cache kalkulator + pra-hitung Worker v9.23 (dibekukan; ditambah blok pra-hitung yang dulu ada di upd())
   harus menghasilkan jejak identik dengan modul baru pada urutan operasi yang sama. */
const fixture=fs.readFileSync(new URL('./fixtures/calc-cache.pre_v9_24.js.txt',import.meta.url),'utf8');
const oldFactory=new Function('ctx','with(ctx){'+fixture+'}');
import {today} from '../js/format.js'; // kedua sisi memakai today() yang sama (modul baru mengimpornya dari format.js)
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};
async function scenario(kind){
  const log=[];const pending=[];let mode='ok';
  const mkRows=n=>Array.from({length:n},(_,i)=>({id:'p'+i,m:10000+i,d:0,p:0,t:1000,q:1,o:null}));
  const ctx={A:{x:1},PRM:[{id:'v1'}],rows:mkRows(40),VNO:0,today,
    upd:(...a)=>log.push(['upd',...a]),
    calcSync:r=>{log.push(['sync',r.id]);return {id:r.id,from:'sync',n:log.length}}};
  globalThis.KalsaraWorker={compute:(type,payload)=>{log.push(['compute',type,payload.products.length,payload.today,payload.slim,JSON.stringify(payload.settings),payload.promos.length]);
    return new Promise((res,rej)=>pending.push(()=>mode==='ok'?res(payload.products.map(p=>({id:p.id,vq:null,from:'worker'}))):mode==='bad'?res('bukan-array'):rej(new Error('gagal'))))}};
  const warn=console.warn;console.warn=()=>log.push(['warn']);
  let C;
  if(kind==='old')C=oldFactory(ctx);
  else C=createCalcCache({getA:()=>ctx.A,getPRM:()=>ctx.PRM,getRows:()=>ctx.rows,getVNO:()=>ctx.VNO,getWorker:()=>globalThis.KalsaraWorker,calcSync:ctx.calcSync,onReady:()=>ctx.upd(false)});
  const run=async step=>{log.push(['step',step])};
  try{
    await run('calc dua kali (cache hit)');C.invalidate();const a=C.calc(ctx.rows[0]);const b=C.calc(ctx.rows[0]);log.push(['same',a===b,a.from]);
    log.push(['null',C.calc(null),C.calc({m:0})]);
    await run('prewarm dipicu');C.invalidate();log.push(['light1',C.prewarmStale(false)]);log.push(['light1b',C.prewarmStale(false)]);log.push(['light-only',C.prewarmStale(true)]);
    await run('batch selesai');pending.shift()();await flush();log.push(['after',C.calc(ctx.rows[3]).from,C.staleRows().length]);
    C.invalidate();log.push(['light2',C.prewarmStale(false)]);
    await run('A diganti');ctx.A={x:2};C.invalidate();log.push(['light3',C.prewarmStale(false)]);pending.shift()();await flush();log.push(['k',C.rkey(ctx.rows[1])]);
    await run('VNO=1 melewati cache');ctx.VNO=1;const c1=C.calc(ctx.rows[5]);const c2=C.calc(ctx.rows[5]);log.push(['vno',c1===c2,c1.from]);log.push(['light-vno',C.prewarmStale(false)]);ctx.VNO=0;
    await run('baris sedikit (<BATCH_MIN)');const keep=ctx.rows;ctx.rows=mkRows(10);C.invalidate();log.push(['light-few',C.prewarmStale(false)]);ctx.rows=keep;
    await run('batch gagal (reject)');mode='rej';ctx.A={x:3};C.invalidate();log.push(['light4',C.prewarmStale(false)]);pending.shift()();await flush();C.invalidate();log.push(['light5',C.prewarmStale(false)]);
    await run('hasil bukan array');mode='bad';ctx.A={x:4};C.invalidate();log.push(['light6',C.prewarmStale(false)]);pending.shift()();await flush();log.push(['stale',C.staleRows().length]);
    await run('PRM berganti');ctx.PRM=[{id:'v2'},{id:'v3'}];C.invalidate();log.push(['gv',typeof C.gver()]);
  }finally{console.warn=warn;delete globalThis.KalsaraWorker}
  return log;
}
const oldLog=await scenario('old'),newLog=await scenario('new');
assert.deepEqual(newLog,oldLog,'jejak modul baru harus identik dengan kode lama');
assert.ok(oldLog.some(x=>x[0]==='compute')&&oldLog.some(x=>x[0]==='upd')&&oldLog.some(x=>x[0]==='warn'),'skenario harus menjalankan batch, onReady, dan jalur gagal');
console.log(`Calc cache: ${oldLog.length} langkah/jejak identik dengan kode v9.23 (batch, onReady, VNO, gagal, penggantian A/PRM/rows).`);
