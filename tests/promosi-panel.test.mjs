/* Tahap 7a (v9.43): kesetaraan panel/tampilan promosi terhadap fixture v9.42. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as acorn from '../scripts/vendor/acorn.mjs';
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const fixture=read('./fixtures/app-core.bagian50a.pre_v9_43.js.txt');
const mod=read('../js/promosi-panel.js');
const core=read('../js/app-core.js');
const noComment=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ');
const norm=s=>noComment(s).replace(/\s+/g,' ').trim();
const statements=s=>acorn.parse(s,{ecmaVersion:'latest',sourceType:'module'}).body.map(x=>norm(s.slice(x.start,x.end)));
const connectorNames=['$','CFG','CalcCache','Event','KDOM','PORD','PSEL','State','VoucherRules','WN','actPromo','ask','bis','calc','cbc','document','esc','fk','fmt','fwdL','fwdV','impas','num','pc1','pcalc2','persist','pst','ptp','rp','setTimeout','tmod','toast','today','uid','vcEff','vcList','vdisc','warns'];
const ast=acorn.parse(mod,{ecmaVersion:'latest',sourceType:'module'});
const factory=ast.body.find(x=>x.type==='ExportNamedDeclaration'&&x.declaration?.id?.name==='createPromosiPanel')?.declaration;
assert.ok(factory,'factory createPromosiPanel harus diekspor');
const body=factory.body.body.slice(0,-1);
const moved=body.map(x=>norm(mod.slice(x.start,x.end)));
const original=statements(fixture);
const restore=s=>s.replace(/\bD\.([A-Za-z_$][\w$]*)(?![\w$])/g,(_,n)=>connectorNames.includes(n)?n:'D.'+n);
const restored=moved.map(restore);
assert.equal(original.length,47,'fixture harus berisi 47 pernyataan panel/tampilan yang dipindah');
assert.equal(restored.length,original.length,'jumlah pernyataan di factory harus sama dengan fixture');
for(let i=0;i<original.length;i++)assert.equal(restored[i],original[i],`pernyataan panel/tampilan #${i+1} berubah`);
for(const name of connectorNames){
  assert.ok(mod.includes('D.'+name),`modul harus memakai sambungan D.${name}`);
  assert.ok(core.includes(`get ${name}(){return ${name}}`)||core.includes(`get ${name}(){return ${name}}`),`app-core harus menyediakan getter untuk ${name}`);
}
assert.ok(/get PSEL\(\)\{return PSEL\},set PSEL\(v\)\{PSEL=v\}/.test(core),'PSEL harus dibaca dan ditulis lewat getter/setter karena bagian 20 dan 60 juga menggunakannya');
assert.ok(/function prRender\(\)\{return PromosiPanel\.prRender\.apply\(null,arguments\)\}/.test(core),'nama prRender tetap tersedia sebagai penerus untuk bagian lain');
for(const name of ['pfCard','pcalc','pdd','pdet','pitems','pkOpen','prTiles'])assert.ok(!new RegExp('^function '+name+'\\(', 'm').test(core),`${name} tidak boleh tertinggal sebagai definisi di app-core`);
assert.ok(/^State\.PRM=\[\];/m.test(core),'inisialisasi PRM tetap di posisi bagian 50');
assert.ok(/function migPt\(/.test(core)&&/function psig\(/.test(core)&&/function ptp\(/.test(core)&&/var CFG=/.test(core),'logika data/voucher yang ditunda ke 7b tetap berada di app-core');
// Sabotase nyata: merusak selector jenis promo pada salinan modul harus membuat pembanding gagal.
const sabotaged=mod.replace('data-pt','data-px');
assert.notEqual(sabotaged,mod,'sabotase harus benar-benar mengubah salinan modul');
const sabAst=acorn.parse(sabotaged,{ecmaVersion:'latest',sourceType:'module'});
const sabFactory=sabAst.body.find(x=>x.type==='ExportNamedDeclaration'&&x.declaration?.id?.name==='createPromosiPanel').declaration;
const sabBody=sabFactory.body.body.slice(0,-1).map(x=>restore(norm(sabotaged.slice(x.start,x.end))));
assert.throws(()=>{for(let i=0;i<original.length;i++)assert.equal(sabBody[i],original[i]);},'SABOTASE: perubahan selector harus tertangkap');
console.log(`Promosi panel (Tahap 7a): ${original.length} pernyataan identik vs fixture v9.42; ${connectorNames.length} sambungan eksplisit; sabotase selector tertangkap.`);
