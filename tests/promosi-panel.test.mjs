/* Tahap 7a (v9.43): kesetaraan panel/tampilan promosi terhadap fixture v9.42. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as acorn from '../scripts/vendor/acorn.mjs';
import {relabelV952} from './helpers/label-v9_52.mjs';
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const fixture=relabelV952(read('./fixtures/app-core.bagian50a.pre_v9_43.js.txt'),1,'fixture panel promosi'); /* v9.52: satu label placeholder pencarian */
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
/* v9.49 (kinerja, SATU penyimpangan yang disengaja dari v9.42): daftar "Ganti produk..." per baris promo diisi saat pertama disentuh (lazy).
   Pernyataan baru: function itswFill dan satu pemasang pendengar. Pernyataan pitems berbeda HANYA pada potongan daftar opsi itsw; tes menurunkan bentuk
   yang diharapkan dari fixture dengan satu penggantian teks, jadi perubahan lain apa pun tetap terdeteksi. */
const LAZY_NEW=['function itswFill(','[\'pointerdown\''];
const isNew=x=>LAZY_NEW.some(k=>x.startsWith(k));
const restored=moved.filter(x=>!isNew(x)).map(restore);
assert.equal(moved.filter(isNew).length,2,'tepat dua pernyataan baru (itswFill dan pemasang pendengar)');
assert.ok(moved.some(x=>x.startsWith('function itswFill(')&&x.includes("data-lz")),'itswFill mengisi daftar yang ditandai data-lz');
const ITSW_OLD=original.findIndex(x=>x.startsWith('function pitems('));
const origRaw=original.slice();
const oldPitems=origRaw[ITSW_OLD].replace(/D\./g,'D.');
const m0=oldPitems.match(/<select data-itsw aria-label="Ganti produk ini"><option value="">Ganti produk\.\.\.<\/option>'\+rows\.filter\(function\(r2\)\{[^]*?\}\)\.map\(function\(r2\)\{[^]*?\}\)\.join\(''\)/)||oldPitems.match(/<select data-itsw aria-label="Ganti produk ini"><option value="">Ganti produk\.\.\.<\/option>'\+State\.rows\.filter\(function\(r2\)\{[^]*?\}\)\.map\(function\(r2\)\{[^]*?\}\)\.join\(''\)/);
assert.ok(m0,'fixture harus memuat daftar opsi itsw yang diganti');
original[ITSW_OLD]=oldPitems.replace(m0[0],'<select data-itsw data-lz aria-label="Ganti produk ini"><option value="">Ganti produk...</option>\'');
assert.equal(original.length,47,'fixture harus berisi 47 pernyataan panel/tampilan yang dipindah');
assert.equal(restored.length,original.length,'jumlah pernyataan di factory (di luar dua yang baru) harus sama dengan fixture');
for(let i=0;i<original.length;i++)assert.equal(restored[i],original[i],`pernyataan panel/tampilan #${i+1} berubah`);
for(const name of connectorNames){
  assert.ok(mod.includes('D.'+name),`modul harus memakai sambungan D.${name}`);
  // v9.43a: setTimeout adalah fungsi bawaan peramban; getter-nya wajib berbentuk terikat (bind) ke window, diperiksa ketat di blok bawah.
  const bound = name==='setTimeout' && core.includes('get setTimeout(){return window.setTimeout.bind(window)}');
  assert.ok(bound||core.includes(`get ${name}(){return ${name}}`),`app-core harus menyediakan getter untuk ${name}`);
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

// v9.43a: fungsi bawaan peramban (setTimeout) yang diteruskan lewat objek sambungan HARUS diikat ke window,
// kalau tidak peramban melempar 'Illegal invocation' saat dipanggil sebagai D.setTimeout(...).
{
  const core = fs.readFileSync(new URL('../js/app-core.js', import.meta.url), 'utf8');
  const m = core.match(/var PromosiPanel=createPromosiPanel\(\{[\s\S]*?\}\);/);
  if (!m) throw new Error('blok sambungan PromosiPanel tidak ditemukan');
  const line = m[0].split('\n').find(l => /get setTimeout\(\)/.test(l)) || '';
  if (!/window\.setTimeout\.bind\(window\)/.test(line)) throw new Error('setTimeout pada sambungan PromosiPanel harus diikat ke window (bind)');
  console.log('Promosi panel: setTimeout sambungan terikat ke window.');
}
