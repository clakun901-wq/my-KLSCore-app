/* Tahap 5: bagian 60 dipindah apa adanya ke factory modul ES. Kesetaraan diuji per pernyataan terhadap fixture asli. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as acorn from '../scripts/vendor/acorn.mjs';
import {relabelV952} from './helpers/label-v9_52.mjs';
let n=0; const ok=(v,m)=>{assert.ok(v,m);n++};
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
import {renameWulfeg} from './helpers/nama-wulfeg.mjs';
const fixture=renameWulfeg(relabelV952(read('./fixtures/app-core.bagian60.pre_v9_41.js.txt'),5,'fixture tab impor/sinkron'),2,'fixture tab impor/sinkron (nama)'); /* v9.52: header CSV ekspor/templat dan satu teks info */
const mod=read('../js/tab-impor-sinkron.js');
const sw=read('../sw.js');
const noComment=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ');
const norm=s=>noComment(s).replace(/\s+/g,' ').trim();
const statements=s=>acorn.parse(s,{ecmaVersion:'latest',sourceType:'module'}).body.map(x=>norm(s.slice(x.start,x.end)));
const ast=acorn.parse(mod,{ecmaVersion:'latest',sourceType:'module'});
const factory=ast.body.find(x=>x.type==='ExportNamedDeclaration'&&x.declaration?.id?.name==='createTabImporSinkron').declaration;
const original=statements(fixture.slice(fixture.indexOf('\n')+1));
// v9.48: SATU penyesuaian yang diizinkan: PSIG dibaca lewat getPSIG() (bukan salinan beku). Dikembalikan ke teks asli sebelum membandingkan.
const SUB_PSIG=['psig()!==getPSIG()','psig()!==PSIG'];
let nSub=0;
const moved=factory.body.body.slice(0,-1).map(x=>norm(mod.slice(x.start,x.end))).map(t=>{const c=t.split(SUB_PSIG[0]).length-1;nSub+=c;return t.split(SUB_PSIG[0]).join(SUB_PSIG[1])});
ok(nSub===1,'tepat satu pembacaan PSIG diganti getPSIG()');
ok(/createTabImporSinkron\(\{[^}]*psig,getPSIG,/.test(mod.slice(0,mod.indexOf('{',mod.indexOf('createTabImporSinkron'))+400)),'dependensi getPSIG dideklarasikan');
ok(!/\bPSIG\b/.test(norm(mod).replace(/getPSIG/g,'').replace('psig()!==','')),'tidak ada rujukan telanjang ke PSIG di modul');
// v9.54: SATU pernyataan boleh berbeda dari fixture beku: function imp(t) (impor CSV dikenali dari judul kolom, lihat js/impor-csv.js). Pernyataan lain tetap harus identik.
const IMP='function imp(t){';
const iO=original.findIndex(x=>x.startsWith(IMP)),iM=moved.findIndex(x=>x.startsWith(IMP));
ok(iO>=0&&iM>=0&&original.filter(x=>x.startsWith(IMP)).length===1&&moved.filter(x=>x.startsWith(IMP)).length===1,'tepat satu imp() di fixture dan di modul');
ok(/bacaImpor\(d,num\)/.test(moved[iM])&&/pisahKembar\(/.test(moved[iM])&&/susunDialogImpor\(/.test(moved[iM])&&moved[iM].includes('Tidak ada baris valid.'),'imp() baru memakai modul impor-csv dan tetap menahan baris tak valid');
ok(/^import \{bacaImpor,pisahKembar,susunDialogImpor\} from '\.\/impor-csv\.js';$/m.test(mod),'impor-csv.js diimpor secara eksplisit');
original[iO]=moved[iM];
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
