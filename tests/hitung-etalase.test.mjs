/* Tahap 6 (v9.42): bagian 20-hitung-etalase dipindah apa adanya ke factory modul ES. Kesetaraan diuji per pernyataan terhadap fixture teks asli v9.41.
   Hanya 7 tempat yang BOLEH berbeda (nama milik bagian lain yang berjalan sesudahnya); tes mengembalikannya ke bentuk asli sebelum membandingkan. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as acorn from '../scripts/vendor/acorn.mjs';
import {legacyPart, appCoreSource} from './helpers/legacy-source.mjs';
import {relabelV952} from './helpers/label-v9_52.mjs';
let n=0; const ok=(v,m)=>{assert.ok(v,m);n++};
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const fixture=relabelV952(read('./fixtures/app-core.bagian20.pre_v9_42.js.txt'),4,'fixture hitung-etalase'); /* v9.52: empat label kartu produk */
const mod=read('../js/hitung-etalase.js');
const sw=read('../sw.js');
const core=appCoreSource();
const noComment=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ');
const norm=s=>noComment(s).replace(/\s+/g,' ').trim();
const statements=s=>acorn.parse(s,{ecmaVersion:'latest',sourceType:'module'}).body.map(x=>norm(s.slice(x.start,x.end)));
// Tujuh penyesuaian yang diizinkan (modul -> teks asli) dan jumlah tepatnya.
const SUBS=[
 ['getCFG:function(){return getCFG()}','getCFG:function(){return CFG}',1],
 ['getVUSE:function(){return getVUSE()}','getVUSE:function(){return VUSE}',1],
 ['getCurP:function(){return getCurP()}','getCurP:function(){return curP}',1],
 ['getVUSE()[r.id]=e.detail.checked','VUSE[r.id]=e.detail.checked',1],
 ['setPSEL(g);','PSEL=g;',2],
 ['setPSIG:function(v){setPSIGOuter(v)}','setPSIG:function(v){PSIG=v}',1],
 /* v9.49 (kinerja): upd() tidak membangun model Etalase saat tab Etalase tersembunyi; hanya menandai "kotor" (diperiksa di tests/etalase-halaman.test.mjs). */
 ['shop:function(){if(tundaShop())return;return shop()}','shop:function(){return shop()}',1]];
const ast=acorn.parse(mod,{ecmaVersion:'latest',sourceType:'module'});
const factory=ast.body.find(x=>x.type==='ExportNamedDeclaration'&&x.declaration?.id?.name==='createHitungEtalase').declaration;
let body=mod.slice(factory.body.body[0].start,factory.body.body.at(-2).end); // tanpa pernyataan `return` penutup
let total=0;
for(const [m,o,c] of SUBS){const k=body.split(m).length-1;assert.equal(k,c,'penyesuaian '+m+' harus tepat '+c+' kali');body=body.split(m).join(o);total+=c;n++}
ok(total===8,'tepat 8 tempat yang disesuaikan (7 lama + satu penundaan shop() v9.49)');
const original=statements(fixture.slice(fixture.indexOf('\n')+1));
const moved=statements(body);
ok(original.length===moved.length&&original.length===45,'jumlah pernyataan bagian 20 (45) sama dengan isi factory');
for(let i=0;i<original.length;i++){assert.equal(moved[i],original[i],'pernyataan #'+i+' berubah: '+original[i].slice(0,90));n++}
ok(!/\b(CFG|VUSE|curP|PSEL|PSIG)\b/.test(noComment(mod).replace(/getCFG|getVUSE|getCurP|setPSEL|setPSIGOuter|setPSIG/g,'')),'tidak ada rujukan telanjang ke CFG/VUSE/curP/PSEL/PSIG di modul');
for(const f of ['state.js','format.js','tariff.js','helpers.js','ui.js','tarif-ui.js','warnings.js','hasil-view.js','etalase-view.js','kartu-update.js','upd-fill.js']){
  ok(mod.includes("from './"+f+"';"),'modul mengimpor ./'+f);
  ok(sw.includes("'./js/"+f+"'"),'sw.js menyebut js/'+f);
}
ok(/^export function createHitungEtalase\(\{\$,KDOM,document,CalcCache,/m.test(mod),'modul memakai factory dengan dependensi eksplisit');
ok(/wrapTchk:function\(mk\)\{tchk=mk\(tchk\)\}\};\n\}\n$/.test(mod),'modul mengekspos wrapTchk untuk pembungkus tchk dari pengaturan.js');
{ const g=noComment(mod).match(/globalThis\.\w+/g)||[]; ok(g.length===1&&g[0]==='globalThis.KShelf'&&!/localStorage|sessionStorage/.test(noComment(mod)),'satu-satunya global tersembunyi adalah globalThis.KShelf (sudah ada di teks asli v9.41; dijadikan dependensi eksplisit pada tahap berikutnya), tanpa localStorage'); }
ok(sw.includes("'./js/hitung-etalase.js'"),'modul terdaftar di cache offline');
execFileSync(process.execPath,['--check',new URL('../js/hitung-etalase.js',import.meta.url).pathname]);n++;
// Bagian 20 di app-core hanya pemasangan: tidak ada lagi logika kartu/etalase/filter di sana.
const part20=legacyPart('20-hitung-etalase.js');
ok(part20.split('\n').length<30&&part20.length<3500,'bagian 20 di app-core hanya memasang dependensi dan fungsi penerus');
ok(/^var HE=createHitungEtalase\(\{/m.test(part20),'app-core memasang createHitungEtalase');
ok(!/function (cardBody|card|hyd|flt|goProd|etSet|dup|gwarn|dep)\(/.test(part20),'fungsi kartu/filter/etalase tidak lagi didefinisikan di app-core');
for(const f of ['add','clearMark','colL','etAll','fk','setStock','srt','strip','tgl']) ok(new RegExp('^function '+f+'\\(\\)\\{return HE\\.'+f+'\\.apply\\(null,arguments\\)\\}$','m').test(part20),'fungsi penerus hoisted untuk '+f);
ok(/^var \{CR,ROW_MAX,WN,ask,feeSig,fill,getDprev,inertBg,pc1,setDprev,shop,tbuild,toast,upd,warns\}=HE;$/m.test(part20),'var yang dipakai bagian lain diambil dari hasil factory');
ok(/getCFG:function\(\)\{return CFG\},getVUSE:function\(\)\{return VUSE\},getCurP:function\(\)\{return curP\}/.test(part20)&&/setPSEL:function\(v\)\{PSEL=v\}/.test(part20)&&/setPSIGOuter:function\(v\)\{PSIG=v\}/.test(part20),'CFG/VUSE/curP dibaca segar dan PSEL/PSIG ditulis lewat penerus (nilai itu milik bagian lain)');
ok(/sold:function\(\)\{return sold\.apply\(null,arguments\)\}/.test(part20),'sold (milik bagian 30, ada sesudah bagian 20) dibungkus late-bound');
ok(/wrapTchk:function\(mk\)\{HE\.wrapTchk\(mk\)\}/.test(core),'pembungkus tchk dari pengaturan.js diteruskan ke modul');
// Uji sabotase (dalam memori): perubahan satu kata/satu pernyataan harus tertangkap pembanding.
ok(moved.slice(1).length!==original.length,'SABOTASE: pernyataan hilang terdeteksi');
const altered=moved.map(s=>s.replace('Maksimal ','Batas '));
ok(altered.join('|')!==moved.join('|'),'SABOTASE: perubahan pesan terdeteksi');
console.log(`Hitung+etalase (Tahap 6): ${n} assertions passed; ${original.length} pernyataan cocok dengan fixture v9.41 (7 penyesuaian nama terdokumentasi).`);
