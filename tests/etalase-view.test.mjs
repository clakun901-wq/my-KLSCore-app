import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEtalaseView} from '../js/etalase-view.js';
const fixture=fs.readFileSync(new URL('./fixtures/etalase-view.pre_v9_35.js.txt',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../js/etalase-view.js',import.meta.url),'utf8');
let n=0; const ok=(v,m)=>{assert.ok(v,m);n++}; const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const names=['errModel','actNoteModel','shopChips','shopPrice','shop'];
for(const name of names) ok(new RegExp('function '+name+'\\(').test(fixture),'fixture memuat '+name);
ok(source.includes('var PRM=getPRM(),CFG=getCFG()'),'PRM dan CFG dibaca saat fungsi berjalan');
ok(source.includes('var rows=getRows(),A=getA(),VUSE=getVUSE(),curP=getCurP(),vbest=getVbest()'),'state Etalase dibaca ulang saat shop berjalan');
const expected=fixture.replace('function actNoteModel(r,o,pr){','function actNoteModel(r,o,pr){var actL=getActL();').replace('function shopChips(r,o){','function shopChips(r,o){var PRM=getPRM(),CFG=getCFG();').replace('function shopPrice(r,o){','function shopPrice(r,o){var PRM=getPRM(),CFG=getCFG(),actL=getActL();').replace('function shop(){','function shop(){var rows=getRows(),A=getA(),VUSE=getVUSE(),curP=getCurP(),vbest=getVbest();');
const exact='export function createEtalaseView({getRows,getA,getPRM,getCFG,getVUSE,getCurP,getVbest,getActL,\n  pst,ptp,fmt,rp,fwdL,pc1,calc,skHi,etUn,$,KShelf}){\n'+expected+'return {errModel:errModel,actNoteModel:actNoteModel,shopChips:shopChips,shopPrice:shopPrice,shop:shop};\n}\n';
ok(source.replace(/^\/\*[\s\S]*?\*\/\n/,'')===exact,'modul sama dengan teks legacy v9.34 selain getter late-bound yang didokumentasikan');
ok(!/\bwindow\.|localStorage|sessionStorage|document\./.test(source),'modul tidak membaca global tersembunyi/DOM');
function env(){
 const E={A:{sl:3},rows:[{id:'a',n:'Produk A',live:true,s:2,ha:50,hd:0,t:10}],PRM:[{t:'vc',jt:'toko',active:true,a:100}],CFG:{vc:{n:'Voucher',c:'vi'}},VUSE:{},curP:()=>80,
  actL:(r,R)=>r.hd||r.ha||0,pst:q=>({k:q.active?'a':'n',t:'Aktif'}),ptp:(q,z,M)=>z.p||q.a||0,
  fmt:v=>String(v),rp:v=>'Rp '+String(v),fwdL:(L)=>({u:L-20,P:L}),pc1:v=>Number(v).toFixed(1),calc:()=>({err:null,M:100,L:80,R:{},vq:null}),skHi:()=>3,etUn:()=>false,vbest:()=>null,
  shelf:[],shn:{textContent:'',classList:{toggle(){}}},shl:{},
 };
 E.$=id=>id==='shn'?E.shn:E.shl;
 E.KShelf={anyCardEditing:()=>false,renderShelf:(el,items)=>{E.shelf=items}};
 E.make=()=>createEtalaseView({getRows:()=>E.rows,getA:()=>E.A,getPRM:()=>E.PRM,getCFG:()=>E.CFG,getVUSE:()=>E.VUSE,getCurP:()=>E.curP,getVbest:()=>E.vbest,getActL:()=>E.actL,pst:E.pst,ptp:E.ptp,fmt:E.fmt,rp:E.rp,fwdL:E.fwdL,pc1:E.pc1,calc:E.calc,skHi:E.skHi,etUn:E.etUn,$:E.$,KShelf:E.KShelf});
 E.old=()=>new Function('E','var A=E.A,rows=E.rows,PRM=E.PRM,CFG=E.CFG,VUSE=E.VUSE,curP=E.curP,vbest=E.vbest,actL=E.actL,pst=E.pst,ptp=E.ptp,fmt=E.fmt,rp=E.rp,fwdL=E.fwdL,pc1=E.pc1,calc=E.calc,skHi=E.skHi,etUn=E.etUn,$=E.$,KShelf=E.KShelf;'+fixture+';return {errModel,actNoteModel,shopChips,shopPrice,shop,set(v){A=v.A;rows=v.rows;PRM=v.PRM;CFG=v.CFG;VUSE=v.VUSE;curP=v.curP;vbest=v.vbest;actL=v.actL;}}')(E);
 return E;
}
{
 const E=env(),N=E.make(),O=E.old();
 eq(N.errModel('Voucher 100% tidak valid'),O.errModel('Voucher 100% tidak valid'),'model error sama');
 eq(N.errModel('<b>tak dikenal</b>'),O.errModel('<b>tak dikenal</b>'),'error tak dikenal sama');
 const row=E.rows[0],o={R:{},M:100,L:80};
 eq(N.actNoteModel(row,o,0),O.actNoteModel(row,o,0),'catatan harga aktual kosong sama');
 eq(N.shopChips(row,o),O.shopChips(row,o),'chip promo sama');
 eq(N.shopPrice(row,o),O.shopPrice(row,o),'model harga sama');
 N.shop(); const newShelf=structuredClone(E.shelf); O.shop(); const oldShelf=structuredClone(E.shelf); eq(newShelf,oldShelf,'model shelf lama dan baru identik');
 const card=newShelf.find(x=>x.kind==='card'); ok(!!card,'shop menghasilkan kartu');
 ok(card.model.stock.label==='Hampir habis','label stok ambang skHi');
 // Ganti utuh state (simulasi restore): getter modul harus membaca A/rows/PRM/VUSE baru.
 E.rows=[{id:'b',n:'Produk B',live:true,s:20,ha:0,hd:0,t:0}]; E.A={sl:25}; E.PRM=[]; E.VUSE={b:true};
 N.shop(); const replacedCard=E.shelf.find(x=>x.kind==='card'); ok(replacedCard.model.index===0&&replacedCard.model.name==='Produk B','shop membaca rows pengganti');
 ok(replacedCard.model.stock.label==='Menipis','shop membaca A.sl pengganti');
}
// Sabotase implementasi: perubahan getter yang mengabaikan rows atau PRM harus mengubah hasil dan ditangkap.
{
 const E=env(),good=E.make(); good.shop(); const baseline=JSON.stringify(E.shelf);
 const badSource=source.replace('var rows=getRows(),A=getA(),VUSE=getVUSE(),curP=getCurP(),vbest=getVbest();','var rows=[],A=getA(),VUSE=getVUSE(),curP=getCurP(),vbest=getVbest();');
 const badFactory=new Function(badSource.replace('export function createEtalaseView','function createEtalaseView')+';return createEtalaseView')();
 const bad=badFactory({getRows:()=>E.rows,getA:()=>E.A,getPRM:()=>E.PRM,getCFG:()=>E.CFG,getVUSE:()=>E.VUSE,getCurP:()=>E.curP,getVbest:()=>E.vbest,getActL:()=>E.actL,pst:E.pst,ptp:E.ptp,fmt:E.fmt,rp:E.rp,fwdL:E.fwdL,pc1:E.pc1,calc:E.calc,skHi:E.skHi,etUn:E.etUn,$:E.$,KShelf:E.KShelf});
 bad.shop(); ok(JSON.stringify(E.shelf)!==baseline,'sabotase rows harus terdeteksi');
}
// Sabotase tambahan: PRM yang tidak diambil lewat getter, A yang membeku, dan actL yang tidak dibungkus harus gagal.
{
 const E=env(),row=E.rows[0],o={R:{},M:100,L:80};
 const compile=src=>new Function(src.replace('export function createEtalaseView','function createEtalaseView')+';return createEtalaseView')();
 const mk=src=>compile(src)({getRows:()=>E.rows,getA:()=>E.A,getPRM:()=>E.PRM,getCFG:()=>E.CFG,getVUSE:()=>E.VUSE,getCurP:()=>E.curP,getVbest:()=>E.vbest,getActL:()=>E.actL,pst:E.pst,ptp:E.ptp,fmt:E.fmt,rp:E.rp,fwdL:E.fwdL,pc1:E.pc1,calc:E.calc,skHi:E.skHi,etUn:E.etUn,$:E.$,KShelf:E.KShelf});
 const good=E.make();
 const badPromo=mk(source.replace('var PRM=getPRM(),CFG=getCFG();','var PRM=[],CFG=getCFG();'));
 ok(JSON.stringify(badPromo.shopChips(row,o))!==JSON.stringify(good.shopChips(row,o)),'sabotase PRM beku harus terdeteksi');
 const badA=mk(source.replace('var rows=getRows(),A=getA(),VUSE=getVUSE(),curP=getCurP(),vbest=getVbest();','var rows=getRows(),A={sl:-1},VUSE=getVUSE(),curP=getCurP(),vbest=getVbest();'));
 good.shop(); const expectedShelf=JSON.stringify(E.shelf); badA.shop(); ok(JSON.stringify(E.shelf)!==expectedShelf,'sabotase A beku harus terdeteksi');
 const badAct=mk(source.replace('var PRM=getPRM(),CFG=getCFG(),actL=getActL();','var PRM=getPRM(),CFG=getCFG();'));
 assert.throws(()=>badAct.shopPrice(row,o),ReferenceError); n++;
}
console.log(`Etalase view: ${n} assertions passed`);
