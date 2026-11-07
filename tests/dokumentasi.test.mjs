/* Dokumentasi tidak boleh usang: CHANGELOG punya entri versi saat ini, dan panduan perawatan menyebut SETIAP berkas runtime, fixture, dan skrip. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('..',import.meta.url).pathname;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
let n=0;const ok=(v,m)=>{assert.ok(v,m);n++};
const ver=/paket:'([^']+)'/.exec(read('js/version.js'))[1];
const log=read('CHANGELOG.md'),guide=read('docs/PANDUAN-PERAWATAN.md'),next=read('LANJUT-DI-SINI.md');
const first=/^## v([\d.]+[a-z]?)/m.exec(log);
ok(first&&first[1]===ver,'entri CHANGELOG paling atas harus versi saat ini v'+ver+' (ditemukan: '+(first&&first[1])+')');
ok(next.includes('v'+ver),'LANJUT-DI-SINI.md harus menyebut v'+ver);
ok(read('state_tracker.txt').includes('v'+ver),'state_tracker.txt harus menyebut v'+ver);
const ls=d=>fs.readdirSync(path.join(root,d),{withFileTypes:true}).filter(e=>e.isFile()).map(e=>e.name);
for(const d of ['js','workers','components'])for(const f of ls(d)){ok(guide.includes(d+'/'+f)||guide.includes(f),'PANDUAN-PERAWATAN.md harus menyebut '+d+'/'+f)}
for(const f of ls('scripts'))ok(guide.includes('scripts/'+f),'PANDUAN-PERAWATAN.md harus menyebut scripts/'+f);
// Fixture disebut lewat awalan (tanpa ekstensi .js.txt) di tabel.
for(const f of ls('tests/fixtures')){const stem=f.replace(/\.js\.txt$|\.js$|\.txt$/,'');ok(guide.includes(stem),'PANDUAN-PERAWATAN.md harus menyebut fixture '+f)}
console.log(`Dokumentasi (CHANGELOG + panduan perawatan): ${n} pernyataan lulus.`);
