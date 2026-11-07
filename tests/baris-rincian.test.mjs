/* v9.50: baris rincian (teks + angka). Penjaga statis untuk perbaikan tampilan "teks panjang turun ke baris ke-2,
   angka tetap di kanan dan sejajar dengan baris TERAKHIR teks". Bukti ukur di browser nyata: tests/e2e/baris-rincian.e2e.py.
   Bila tes ini gagal, jangan melonggarkan tes: baca komentar "v9.50" di css/app.css lebih dulu. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('..',import.meta.url).pathname;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
let n=0;const ok=(v,m)=>{assert.ok(v,m);n++};
const css=read('css/app.css');
/* Ambil isi aturan dengan selektor persis (mis. ".rw"), bukan aturan lain yang kebetulan memuat teks itu. */
const rule=sel=>{const m=new RegExp('(?:^|\\})\\s*'+sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\{([^}]*)\\}','m').exec(css);return m&&m[1]};
const rw=rule('.rw'),rwb=rule('.rw b'),erw=rule('.erw'),erl=rule('.erl'),era=rule('.era');
for(const [nama,r] of [['.rw',rw],['.rw b',rwb],['.erw',erw],['.erl',erl],['.era',era]])ok(r,'aturan CSS '+nama+' harus ada');
/* 1) Wadah baris TIDAK boleh membungkus: kalau wrap, angka pindah ke baris sendiri (keluhan pemilik, 8 Nov 2026). */
ok(/flex-wrap:\s*nowrap/.test(rw)&&!/flex-wrap:\s*wrap/.test(rw),'.rw harus flex-wrap:nowrap');
ok(/flex-wrap:\s*nowrap/.test(erw)&&!/flex-wrap:\s*wrap/.test(erw),'.erw harus flex-wrap:nowrap');
/* 2) Angka rata dengan baris terakhir teks: "last baseline" bila didukung, dasar kotak (flex-end) sebagai cadangan. */
ok(/align-items:\s*flex-end/.test(rw)&&/align-items:\s*flex-end/.test(erw),'cadangan flex-end untuk browser lama');
ok(/@supports\s*\(align-items:\s*last baseline\)\s*\{\s*\.rw\s*\{\s*align-items:\s*last baseline/.test(css),'.rw memakai last baseline bila didukung');
ok(/@supports\s*\(align-items:\s*last baseline\)\s*\{\s*\.erw\s*\{\s*align-items:\s*last baseline/.test(css),'.erw memakai last baseline bila didukung');
/* 3) Angka tidak boleh menyusut atau patah; teks boleh menyusut dan patah. */
ok(/flex:\s*0 0 auto/.test(rwb)&&/white-space:\s*nowrap/.test(rwb)&&/margin-left:\s*auto/.test(rwb),'.rw b: angka tetap utuh di kanan');
ok(/flex:\s*0 0 auto/.test(era)&&/white-space:\s*nowrap/.test(era)&&/margin-left:\s*auto/.test(era),'.era: angka tetap utuh di kanan');
ok(/min-width:\s*0/.test(erl)&&/flex:\s*0 1 auto/.test(erl),'.erl boleh menyusut (teks turun ke baris ke-2)');
ok(/overflow-wrap:\s*anywhere/.test(rw)&&/overflow-wrap:\s*anywhere/.test(erl),'kata sangat panjang tetap patah, tidak membuat layar melebar');
/* 4) Struktur HTML yang dihasilkan kode harus tetap "teks + <b>" (rw) dan "span.erl + span.era" (ERP): CSS di atas bergantung padanya. */
const hv=read('js/hasil-view.js'),erp=read('js/erp.js'),kt=read('js/kartu-update.js');
ok(/<div class="rw">'\+l\+' \('\+fmt\(p\)\+'%\)<b>/.test(hv),'CR() di hasil-view.js: teks lalu <b> angka');
ok(/class="erw'[^]*?<span class="erl">'\+lab\+'<\/span><span class="era">'\+amt\+'<\/span>/.test(erp),'laporan ERP: span.erl lalu span.era');
ok(/<div class="rw">Saldo masuk toko<b>/.test(kt),'kartu-update.js: baris Saldo masuk toko memakai pola rw');
console.log(`Baris rincian (v9.50): ${n} pernyataan lulus.`);
