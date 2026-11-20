/* v9.57: ikon \u24d8 penjelas istilah + footer dari version.js + header tanpa "Progressive Web App". Tes statis dan logika murni (DOM palsu). */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BY_ID,BY_TEXT,teksIstilah,penjelasan} from '../js/tips.js';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};
const html=read('index.html'),main=read('js/main.js'),css=read('css/app.css');
const corpus=html+fs.readdirSync(new URL('../js/',import.meta.url)).map(f=>read('js/'+f)).join('\n');

/* footer dan header */
ok(!/Progressive Web App/i.test(html),'tulisan "Progressive Web App" harus hilang dari index.html');
ok(!/class="pwa"|p\.pwa/.test(html+css),'sisa elemen/gaya .pwa harus hilang');
const foot=/<footer[^>]*>([^<]*)<\/footer>/.exec(html);
ok(foot&&/id="ver"/.test(foot[0]),'footer harus punya id="ver" untuk diisi dari version.js');
ok(!/\d/.test(foot[1]),'footer di index.html tidak boleh memuat nomor versi atau tanggal tertulis tangan: '+foot[1]);
ok(/getElementById\('ver'\)/.test(main)&&/KALSARA_VERSION\.paket/.test(main),'js/main.js mengisi footer dari KALSARA_VERSION.paket');
ok(main.indexOf("import './version.js'")<main.indexOf("KALSARA_VERSION.paket"),'version.js dimuat sebelum footer diisi');

/* label baru */
ok(!/Management Partner|Managemen\b/.test(corpus.replace(/management partner\|/g,'')),'label "Management Partner" tidak boleh tersisa di tampilan (selain pengenal kolom CSV lama)');
ok(corpus.includes('Biaya tambahan per pesanan (opsional)'),'label baru harus dipakai');
ok(/management partner\|tambahan/.test(read('js/impor-csv.js')),'impor CSV tetap menerima judul lama Management Partner');

/* kamus */
for(const [id,t] of Object.entries(BY_ID)){
 ok(new RegExp('<label[^>]*for="'+id+'"').test(html),'kunci BY_ID harus label for= di index.html: '+id);
 ok(/Contoh: /.test(t)&&/\d/.test(t)&&/^[A-Z]/.test(t),'penjelasan '+id+' harus satu kalimat dengan "Contoh:" berisi angka');
 ok(t.length<=260,'penjelasan '+id+' terlalu panjang ('+t.length+')');
}
for(const [k,t] of Object.entries(BY_TEXT)){
 ok(corpus.includes(k),'kunci BY_TEXT harus teks yang benar-benar ada di tampilan: '+k);
 ok(/Contoh: /.test(t)&&/\d/.test(t)&&/^[A-Z]/.test(t),'penjelasan "'+k+'" harus memuat "Contoh:" berisi angka');
 ok(t.length<=260,'penjelasan "'+k+'" terlalu panjang');
}
ok(Object.keys(BY_ID).length>=45&&Object.keys(BY_TEXT).length>=35,'cakupan istilah tidak boleh menyusut');

/* logika pencocokan dengan DOM palsu */
const T=v=>({nodeType:3,nodeValue:v}),E=()=>({nodeType:1});
const el=(tag,kids,attrs={})=>({tagName:tag,childNodes:kids,getAttribute:k=>attrs[k]||null});
ok(teksIstilah(el('LABEL',[T('Biaya packing'),E()]))==='Biaya packing','teks istilah mengabaikan <small>/tombol');
ok(teksIstilah(el('DIV',[T('Biaya iklan (5%)'),E()]))==='Biaya iklan','awalan persen di akhir dibuang');
ok(penjelasan(el('LABEL',[T('apa saja')],{for:'cg'}))===BY_ID.cg,'label for= memakai BY_ID');
ok(penjelasan(el('DIV',[T('Saldo masuk toko'),E()]))===BY_TEXT['Saldo masuk toko'],'baris hasil memakai BY_TEXT');
ok(penjelasan(el('LABEL',[T('Diskon coret (%) - Promo Toko nonaktif')]))===BY_TEXT['Diskon coret (%)'],'label diskon coret saat Promo Toko nonaktif tetap dikenali');
ok(penjelasan(el('LABEL',[T('Istilah tak dikenal')]))===null,'istilah tak dikenal tanpa ikon');
ok(penjelasan(el('LABEL',[T('Modal / HPP per pcs')]))===BY_TEXT['Modal / HPP per pcs'],'label kartu memakai BY_TEXT');

/* gaya */
ok(/\.ib\{/.test(css)&&/#tipb\{/.test(css)&&/\.ib::before\{content:"\\24D8"\}/.test(css),'CSS ikon dan popover harus ada');
console.log(`Ikon penjelas, footer versi, header (v9.57): ${n} pernyataan lulus.`);
