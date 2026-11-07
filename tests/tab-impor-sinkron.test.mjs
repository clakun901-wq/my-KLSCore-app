/* Tahap 5: bagian 60 dipindah apa adanya ke factory modul ES. Kesetaraan diuji per pernyataan terhadap fixture asli. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as acorn from '../scripts/vendor/acorn.mjs';
let n=0; const ok=(v,m)=>{assert.ok(v,m);n++};
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const fixture=read('./fixtures/app-core.bagian60.pre_v9_41.js.txt');
const mod=read('../js/tab-impor-sinkron.js');
const sw=read('../sw.js');
const noComment=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ');
const norm=s=>noComment(s).replace(/\s+/g,' ').trim();
const statements=s=>acorn.parse(s,{ecmaVersion:'latest',sourceType:'module'}).body.map(x=>norm(s.slice(x.start,x.end)));
const ast=acorn.parse(mod,{ecmaVersion:'latest',sourceType:'module'});
const factory=ast.body.find(x=>x.type==='ExportNamedDeclaration'&&x.declaration?.id?.name==='createTabImporSinkron').declaration;
const original=statements(fixture.slice(fixture.indexOf('\n')+1));
const moved=factory.body.body.slice(0,-1).map(x=>norm(mod.slice(x.start,x.end)));
ok(original.length===moved.length,'jumlah pernyataan bagian 60 sama dengan isi factory');
const a=[...original].sort(),b=[...moved].sort();
for(let i=0;i<a.length;i++){assert.equal(b[i],a[i],'pernyataan berubah/hilang: '+a[i].slice(0,90));n++}
ok(moved.every((s,i)=>i===0||original.indexOf(s)>original.indexOf(moved[i-1])),'urutan pernyataan dipertahankan');
ok(/^import \{State\} from '\.\/state\.js';$/m.test(mod)&&/^import \{KStore\} from '\.\/storage\.js';$/m.test(mod),'State dan KStore diimpor secara eksplisit');
ok(/^export function createTabImporSinkron\(\{\$,ROW_MAX,/m.test(mod),'modul memakai factory dengan dependensi eksplisit');
ok(/return \{tab:function\(\)\{return tab\.apply\(null,arguments\)\},parseCsv:parseCsv,wrapTab:/.test(mod),'fungsi tab (penerus ke versi terbungkus terbaru), parser CSV, dan pembungkus tab diekspor');
ok(!/globalThis\.|localStorage|sessionStorage/.test(noComment(mod)),'modul tidak membaca global tersembunyi atau localStorage');
ok(sw.includes("'./js/tab-impor-sinkron.js'"),'modul terdaftar di cache offline');
execFileSync(process.execPath,['--check',new URL('../js/tab-impor-sinkron.js',import.meta.url).pathname]);n++;
// Uji sabotase: satu pernyataan hilang atau teks pesan berubah harus tertangkap pembanding.
ok(moved.slice(1).length!==original.length,'SABOTASE: pernyataan hilang terdeteksi');
const altered=moved.map(s=>s.replace('Tidak ada baris valid.','Tidak ada data valid.'));
ok(altered.join('|')!==moved.join('|'),'SABOTASE: perubahan pesan terdeteksi');
console.log(`Tab impor/sinkron (Tahap 5): ${n} assertions passed; ${original.length} pernyataan cocok dengan fixture v9.40.`);
