/* Tahap 7b: memastikan aturan promosi/voucher dipindah tanpa mengubah isi bisnis. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as acorn from '../scripts/vendor/acorn.mjs';
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const baseline=read('./fixtures/app-core.bagian50-data.pre_v9_44.js.txt');
const mod=read('../js/promosi-data.js');
const norm=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\s+/g,' ').trim();
const fn=(s,name)=>{
 const ast=acorn.parse(s,{ecmaVersion:'latest',sourceType:'module'});
 let found;
 function visit(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id?.name===name)found=s.slice(n.start,n.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
 visit(ast);assert.ok(found,`fungsi ${name} harus ditemukan`);return found;
};
const names=['migPt','ptp','psig','vsc','vscT','vscn','vnote','vcSoon','vwarn','vcWhy','vcEff','fwdV','bis','pcalc2','actPromo'];
for(const name of names)assert.equal(norm(fn(mod,name)),norm(fn(baseline,name)),`isi fungsi ${name} harus tetap sama dengan baseline v9.43b`);
// Koreksi pasca-review: CFG (aturan semua jenis promosi) dan PORD (urutan) sebelumnya tidak dibandingkan dengan baseline v9.43b.
const decl=(s,re)=>{const m=s.match(re);assert.ok(m,'deklarasi harus ditemukan: '+re);return norm(m[0])};
assert.equal(decl(mod,/var CFG=\{[^\n]*\}\};?/),decl(baseline,/var CFG=\{[^\n]*\}\};?/),'isi CFG harus identik dengan baseline v9.43b');
assert.equal(decl(mod,/PORD=\[[^\]]*\]/),decl(baseline,/PORD=\[[^\]]*\]/),'isi PORD harus identik dengan baseline v9.43b');
assert.match(mod,/function calcNV\(r\)\{D\.setVNO\(1\);try\{return D\.calc\(r\)\}finally\{D\.setVNO\(0\)\}\}/,'calcNV hanya mengubah cara akses sambungan, bukan alur');
assert.match(mod,/var PORD=\['af','lv','pt','vc','fs','vi','pd','kh','hm'\]/,'urutan jenis promosi tetap');
assert.match(mod,/export function createPromosiData\(D\)/,'modul harus memakai ekspor ES dan sambungan D');
assert.doesNotMatch(mod,/\bwindow\.|localStorage|sessionStorage|(?<![\w$.])document\b/,'modul tidak boleh mengambil global peramban tersembunyi');

// Jalankan factory dengan sambungan kecil untuk memeriksa fungsi migrasi dan aturan harga.
const {createPromosiData}=await import('../js/promosi-data.js');
let invalidations=0,vno=0;
globalThis.KalsaraMoney={percentOfRupiah:(money,pct)=>Math.round(money*pct/100),safeMoneySum:arr=>arr.reduce((a,b)=>a+b,0)};
const State={A:{og:0},PRM:[]};
const D={State,CalcCache:{invalidate(){invalidations++}},today:()=> '2026-11-07',pr:()=>0,fmt:String,rp:String,dd:()=>0,
 esc:String,vcList:()=>[],vcApply:()=>false,vdisc:()=>0,vcLab:()=>'',pst:()=>({k:'a'}),fees:()=>({sh:0,pm:0,tax:0,ads:0,rt:0}),tmod:()=>0,warns:()=>({m:0}),WN:()=>'',pc1:()=>0,pinfo:()=>'',rw:()=>'',KDOM:{setHTML(){}},$:()=>null,dtx:String,calc:r=>r,setVNO:v=>{vno=v}};
const P=createPromosiData(D);
assert.equal(invalidations,1,'factory mempertahankan invalidasi cache saat bagian promosi dipasang');
const oldPt={t:'pt',p:'prod-1',a:15};
assert.equal(P.migPt(oldPt),oldPt);
assert.deepEqual(oldPt.it,[{p:'prod-1',h:15,d:0,l:0}]);
assert.equal(oldPt.a,0);assert.equal(oldPt.p,'');
assert.equal(P.ptp({a:10},{d:0,h:0},10000),9000);
assert.equal(P.psig(),'2026-11-07|[]');
assert.equal(P.bis(x=>x>=37),37);
assert.equal(P.calcNV({sample:1}).sample,1);assert.equal(vno,0,'VNO selalu dikembalikan ke 0 setelah kalkulasi simulasi');
console.log(`Promosi data (Tahap 7b): ${names.length} fungsi + CFG + PORD cocok baseline; calcNV terjaga; migrasi, harga promo, psig, bis, dan VNO teruji.`);
