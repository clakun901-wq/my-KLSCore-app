import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKartuUpdate} from '../js/kartu-update.js';
import {relabelV952} from './helpers/label-v9_52.mjs';
const fixture=relabelV952(fs.readFileSync(new URL('./fixtures/kartu-update.pre_v9_33.js.txt',import.meta.url),'utf8'),3,'fixture kartu-update'); /* v9.52: link sumber barang + dua teks jalur kosong */
const source=fs.readFileSync(new URL('../js/kartu-update.js',import.meta.url),'utf8');
let n=0; const ok=(v,m)=>{assert.ok(v,m);n++}; const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const expected=fixture.replace('function updRow(r){var H=','function updRow(r){var A=getA();var H=');
ok(source==='/* v9.33 tahap 6f: updRow dipindah apa adanya dari js/legacy/20-hitung-etalase.js. */\nexport function createKartuUpdate({getA,KDOM,fmt,gfac,goRate,adRate,esc,dtx,rp,pc1,stk,calc,impas,warns,mchg,CR,sp,revHtml,errH,pr,tmod,acH,bdH,vnote,vscn,WN}){\n'+expected+'\nreturn {updRow:updRow};\n}\n','modul harus identik dengan fixture lama + satu sisipan getA');
ok(/function updRow\(r\)/.test(source),'updRow tetap deklarasi function di modul');
ok(!/\b(?:window|globalThis|document|localStorage)\b/.test(source),'modul tidak membaca global browser tersembunyi');
function env(A){
 let current=A; const calls=[];
 const KDOM={setHTML:(el,html)=>{calls.push(['html',el,html]);}};
 const fmt=x=>String(x??''); const rp=x=>'Rp'+String(x); const esc=x=>String(x??'').replace(/</g,'&lt;');
 const deps={getA:()=>current,setA:v=>{current=v},KDOM,fmt,gfac:()=>80,goRate:()=>3.5,adRate:()=>6.5,esc,dtx:x=>'T'+x,rp,pc1:x=>String(x),stk:r=>({lv:r.stockWarn||'',h:'STOCK'}),
  calc:r=>r.calcCase==='none'?null:r.calcCase==='err'?{err:'ERR'}:{M:50000,L:60000,u:r.profit??5000,R:{ad:6.5,gx:3,px:0,vx:0,lv:0,ads:0,rt:0},b:{ad:3000,gx:1000,px:0,vx:0,lv:0,pay:0,fx:0},P:60000,s:54000,sh:4000,pm:0,tax:0,ads:0,rt:0,v:0,vs:'',vq:1,pm:0},
  impas:()=>45000,warns:()=>({lv:risk(),m:10,sh:['margin']}),mchg:()=>({lv:'',h:''}),CR:(...x)=>'CR'+x[0],sp:()=>'SP',revHtml:()=>'REV',errH:()=>'<ERR>',pr:()=>0,tmod:()=>20000,
  acH:()=>'<AC>',bdH:()=>'<BD>',vnote:()=>'NOTE',vscn:()=>({lv:'',h:''}),WN:()=>'<WN>'};
 function risk(){return ''}
 return {deps,calls};
}
function row({hy=false,calcCase='ok',...x}={}){
 const html=[]; const box={querySelector:s=>s==='[data-lv]'?{classList:{toggle(){}},setAttribute(){},textContent:''}:null,querySelectorAll:()=>[],};
 return Object.assign({hy,box,live:false,o:{},lkx:'lkx',mh:[],mhl:'mhl',sk:'sk',cxr:'cxr',ac:'ac',bg:'bg',el:'el',cs:'cs',cx:0,n:'Produk',lnk:'',mb:0,m:20000,q:1,d:0,p:0,t:1000,ro:false,calcCase},x);
}
function oldFactory(E){
 const names=Object.keys(E.deps), vals=Object.values(E.deps);
 const fn=new Function(...names,'A','"use strict";'+fixture+';return {updRow:updRow,setA:function(v){A=v}};');
 return fn(...vals,E.deps.getA());
}
function newFactory(E){return createKartuUpdate(E.deps).updRow}
const cases=[
 {hy:false,calcCase:'none'}, {hy:true,calcCase:'none'}, {hy:false,calcCase:'err'}, {hy:true,calcCase:'err'},
 {hy:false,calcCase:'ok',profit:-1}, {hy:true,calcCase:'ok',profit:0}, {hy:true,calcCase:'ok',profit:5000,stockWarn:'r'}
];
for(let i=0;i<cases.length;i++){
 const A={pa:'yes',dm:'pct',og:i%2?5000:0,pb:1,wu:2000,wm:1};
 const a=env(A),b=env(A),ra=row(cases[i]),rb=row(cases[i]);
 const old=oldFactory(a),fresh=newFactory(b); old.updRow(ra);fresh(rb);
 eq(JSON.parse(JSON.stringify(rb)),JSON.parse(JSON.stringify(ra)),'baris/data hasil harus sama untuk skenario '+i);
 eq(b.calls,a.calls,'perubahan DOM harus sama untuk skenario '+i);
}
// Pembacaan A harus late-bound: pemulihan mengganti objek A, bukan sekadar mengubah propertinya.
{
 const a=env({pa:'yes',dm:'pct',og:0,pb:1}),old=oldFactory(a); const b=env({pa:'yes',dm:'pct',og:0,pb:1}),fresh=newFactory(b);
 const A2={pa:'no',dm:'nom',og:7000,pb:2}; a.deps.setA(A2); b.deps.setA(A2); old.setA(A2);
 const ra=row({hy:true}),rb=row({hy:true}); old.updRow(ra);fresh(rb);eq(JSON.parse(JSON.stringify(rb)),JSON.parse(JSON.stringify(ra)),'A pengganti harus dibaca saat updRow dipanggil');
}
// Sabotase: perubahan pada setiap kelompok perilaku utama harus mengubah sumber yang dibandingkan.
const mutations=[
 ['status tombol live',"lbn.textContent=r.live?", "lbn.textContent=!r.live?"],
 ['placeholder tarif',"k=='gx'?fmt", "k=='gx'?String"],
 ['label tarif',"Dipakai sekarang: admin ","Tarif dipakai: admin "],
 ['riwayat supplier',"Riwayat modal","Riwayat harga"],
 ['stok',"var kk=stk(r);", "var kk={lv:'',h:''};"],
 ['reset untung',"r.u=undefined;r.lv='';", "r.u=0;r.lv='';"],
 ['hasil kalkulasi',"var o=calc(r);", "var o=null;"],
 ['jalur kosong',"Isi modal per pcs, hasil muncul otomatis di sini.","Lengkapi modal supplier."] ,
 ['jalur galat',"var eh=errH(o.err);","var eh='';"],
 ['agregat',"g.n++;g.sm+=o.M;g.su+=o.u;", "g.n++;g.sm+=o.M;g.su+=0;"],
 ['peringatan',"var wx=warns(o,false),im=impas(r,o.R);", "var wx={lv:'',m:0,sh:[]},im=impas(r,o.R);"],
 ['perubahan modal',"var mc=mchg(r,o),vsn=vscn(r,o);", "var mc=null,vsn={lv:'',h:''};"],
 ['ringkasan',"Harga listing awal<b>","Harga listing<b>"],
 ['hasil dan rincian',"Lihat rincian biaya","Rincian biaya"],
 ['harga cek',"revHtml(r,o,im)","''"]
];
for(const [label,a,b] of mutations){ok(fixture.includes(a),'kontrol sabotase '+label+' menemukan titik');ok(fixture.replace(a,b)!==fixture,'sabotase '+label+' mengubah perilaku sumber');}
console.log(`Kartu-update: ${n} assertions passed (diferensial ${cases.length+1} skenario; ${mutations.length} sabotase struktural).`);
