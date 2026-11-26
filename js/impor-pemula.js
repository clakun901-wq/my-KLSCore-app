/* v9.58: impor massal yang mudah untuk pengguna baru. Dua jalan masuk tambahan di kartu sambutan:
   (1) pilih file Excel (.xlsx) atau CSV langsung, tanpa harus "Simpan sebagai CSV";
   (2) tempel (Ctrl+V) tabel yang disalin dari Excel atau Google Sheet.
   Kedua jalan DIUBAH menjadi teks CSV lalu diserahkan ke alur impor yang sudah ada (tombol "Impor dari file CSV" = input #xf), sehingga
   semua aturan lama tetap berlaku: kolom dikenali dari judul, SKU yang sudah ada tidak dobel, batas produk, dialog konfirmasi.
   Modul ini tidak menyentuh tab-impor-sinkron.js (dibekukan oleh tes kesetaraan) dan tidak memakai DOMParser, supaya bagian murninya bisa diuji di Node. */
import {petaJudul} from './impor-csv.js';

var BATAS_BERKAS=10*1024*1024,BATAS_BARIS=5000;

/* ---------- pembaca XLSX minimal (zip + XML lewat regex) ---------- */
function u16(b,o){return b[o]|b[o+1]<<8}
function u32(b,o){return(b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0}
function bukaZip(buf){
 var b=new Uint8Array(buf),e=-1,i;
 for(i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(u32(b,i)===0x06054b50){e=i;break}
 if(e<0)throw new Error('bukan zip');
 var n=u16(b,e+10),p=u32(b,e+16),F={};
 for(i=0;i<n;i++){
  if(u32(b,p)!==0x02014b50)throw new Error('zip rusak');
  var nl=u16(b,p+28),el=u16(b,p+30),cl=u16(b,p+32);
  F[new TextDecoder().decode(b.subarray(p+46,p+46+nl))]={me:u16(b,p+10),cs:u32(b,p+20),lo:u32(b,p+42)};
  p+=46+nl+el+cl}
 return{b:b,F:F}}
function ambil(z,nama){
 var f=z.F[nama];if(!f)return Promise.resolve(null);
 var b=z.b,o=f.lo+30+u16(b,f.lo+26)+u16(b,f.lo+28),d=b.subarray(o,o+f.cs);
 if(f.me===0)return Promise.resolve(new TextDecoder().decode(d));
 if(f.me!==8)return Promise.reject(new Error('kompresi tidak didukung'));
 return new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(x){return new TextDecoder().decode(x)})}
function bukaXml(s){return String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,function(m,k){
 k=k.toLowerCase();if(k==='amp')return'&';if(k==='lt')return'<';if(k==='gt')return'>';if(k==='quot')return'"';if(k==='apos')return"'";
 var c=k.charAt(1)==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return isFinite(c)&&c>0&&c<0x110000?String.fromCodePoint(c):''})}
function teksT(xml){var o='',re=/<t\b[^>]*>([\s\S]*?)<\/t>/g,m;xml=xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g,'');while((m=re.exec(xml)))o+=m[1];return bukaXml(o)}
function atribut(tag,nama){var m=new RegExp('(?:^|\\s)'+nama+'="([^"]*)"').exec(tag);return m?bukaXml(m[1]):null}
function kolomKe(ref){var m=/^([A-Z]+)/.exec(ref||'');if(!m)return -1;var x=0;for(var k=0;k<m[1].length;k++)x=x*26+m[1].charCodeAt(k)-64;return x-1}
/* Sel angka dari Excel disimpan dengan titik desimal ("25000.5"). Aplikasi membaca angka gaya Indonesia (koma desimal), jadi diubah ke koma. */
export function angkaXlsx(v){var s=String(v==null?'':v).trim();if(s==='')return'';var n=Number(s);if(!isFinite(n))return s;return String(parseFloat(n.toPrecision(12))).replace('.',',')}

/* buf = ArrayBuffer isi .xlsx. Hasil: Promise<baris[][]> dari lembar PERTAMA, semua sel berupa teks. */
export function bacaXlsxBaris(buf){
 if(!buf||buf.byteLength>BATAS_BERKAS)return Promise.reject(new Error('berkas terlalu besar'));
 var z;try{z=bukaZip(buf)}catch(e){return Promise.reject(e)}
 return Promise.all([ambil(z,'xl/sharedStrings.xml'),ambil(z,'xl/workbook.xml'),ambil(z,'xl/_rels/workbook.xml.rels')]).then(function(a){
  var ss=[],m,re=/<si\b[^>]*>([\s\S]*?)<\/si>/g;
  if(a[0])while((m=re.exec(a[0])))ss.push(teksT(m[1]));
  var path=null;
  if(a[1]&&a[2]){var sh=/<sheet\b[^>]*>/.exec(a[1]),rid=sh?atribut(sh[0],'r:id'):null;
   if(rid){var rr=/<Relationship\b[^>]*>/g,t;while((t=rr.exec(a[2])))if(atribut(t[0],'Id')===rid){path=atribut(t[0],'Target');break}}}
  if(path){path=path.replace(/^\//,'');if(path.indexOf('xl/')!==0)path='xl/'+path}
  if(!path||!z.F[path])path=Object.keys(z.F).filter(function(n){return/^xl\/worksheets\/sheet\d+\.xml$/.test(n)}).sort()[0];
  if(!path)throw new Error('lembar tidak ditemukan');
  return ambil(z,path).then(function(xml){
   var out=[],rw=/<row\b[^>]*>([\s\S]*?)<\/row>/g,r;
   while((r=rw.exec(xml))&&out.length<BATAS_BARIS){
    var baris=[],cr=/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,c;
    while((c=cr.exec(r[1]))){
     var tag=c[1],isi=c[2]||'',tipe=atribut(tag,'t'),ix=kolomKe(atribut(tag,'r')),v=/<v\b[^>]*>([\s\S]*?)<\/v>/.exec(isi),val='';
     if(ix<0)ix=baris.length;
     if(tipe==='inlineStr')val=teksT(isi);
     else if(v){val=bukaXml(v[1]);
      if(tipe==='s')val=ss[+val]||'';
      else if(tipe==='b')val=val==='1'?'TRUE':'FALSE';
      else if(tipe==='e')val='';
      else if(tipe!=='str')val=angkaXlsx(val)}
     baris[ix]=val}
    for(var j=0;j<baris.length;j++)if(baris[j]===undefined)baris[j]='';
    out.push(baris)}
   return out})})}

/* ---------- baris -> CSV, dan pembersihan sebelum diserahkan ke impor ---------- */
export function bersih(s){return String(s==null?'':s).replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\u00a0/g,' ').trim()}

/* Buang baris di atas judul (judul file, petunjuk). Judul = baris pertama (dalam 15 baris awal) yang cocok dengan >= 2 judul kolom templat.
   Tidak ada baris judul yang dikenal: baris dikembalikan apa adanya (alur lama membaca menurut urutan templat). */
export function buangSebelumJudul(rows){
 for(var i=0;i<Math.min(rows.length,15);i++)if(petaJudul(rows[i]).cocok>=2)return rows.slice(i);
 return rows}

export function barisKeCsv(rows){
 return rows.map(function(r){return r.map(function(v){var s=bersih(v);return/[";\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}).join(';')}).join('\r\n')}

/* ---------- serahkan teks CSV ke alur impor lama (input #xf) ---------- */
export function kirimKeImpor(win,doc,teks,nama){
 var xf=doc.getElementById('xf');
 if(!xf||!win.DataTransfer||!win.File)throw new Error('browser tidak mendukung');
 var dt=new win.DataTransfer();dt.items.add(new win.File(['\ufeff'+teks],nama||'impor.csv',{type:'text/csv'}));
 xf.files=dt.files;xf.dispatchEvent(new win.Event('change',{bubbles:true}))}

/* ---------- penulis XLSX minimal untuk template (zip tanpa kompresi, teks inline) ---------- */
/* Judul kolom = persis templat CSV di tab-impor-sinkron.js (dicek tes), supaya pembaca impor mengenalinya. */
export var JUDUL=['Nama produk','Modal / HPP per pcs','Biaya tambahan per pesanan (opsional)','Biaya packing','Target untung','Isi paket (opsional)','Stok Shopee (opsional)','Sumber barang (opsional)','SKU (opsional)','Link sumber barang (opsional)','Tarif Gratis Ongkir XTRA % (opsional)'];
var CONTOH=['CONTOH - GANTI DENGAN PRODUK ANDA',25000,1000,500,5000,1,20,'Nama sumber barang','SKU-001','https://contoh.com/produk',2];
var PETUNJUK=[
 'Cara mengisi template',
 '1. Isi produk Anda di lembar "Produk", satu produk per baris, mulai dari baris di bawah baris contoh. Baris contoh (CONTOH - ...) boleh dihapus; kalaupun dibiarkan, tidak ikut diimpor.',
 '2. Yang wajib hanya dua kolom: Nama produk dan Modal / HPP per pcs. Kolom lain boleh dikosongkan.',
 '3. Isi angka tanpa "Rp" dan tanpa teks. Contoh: 25000 atau 25.000.',
 '4. Modal / HPP per pcs: modal untuk 1 pcs. Untuk paket bundel, isi modal per 1 pcs dan jumlahnya di kolom Isi paket.',
 '5. Biaya tambahan per pesanan, Biaya packing, dan Target untung: dalam rupiah. Kosong dianggap 0.',
 '6. SKU: kode unik tiap produk. Isi bila Anda ingin memperbarui modal/stok nanti atau mencocokkan harga Shopee. Produk dengan SKU yang sudah ada di aplikasi tidak ditambahkan dua kali.',
 '7. Tarif Gratis Ongkir XTRA %: persen per produk (tulis 2 untuk 2%). Kosong = ikut Setelan.',
 '8. Simpan file ini (tetap .xlsx), lalu di aplikasi pilih "Pilih file Excel atau CSV". Aplikasi menampilkan ringkasan dan meminta konfirmasi sebelum produk dimasukkan.',
 'Aplikasi hanya membaca lembar PERTAMA ("Produk"). Lembar ini hanya petunjuk dan tidak diimpor.'];

var CRC=(function(){var t=[],c,n,k;for(n=0;n<256;n++){c=n;for(k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function w16(a,v){a.push(v&255,v>>>8&255)}
function w32(a,v){a.push(v&255,v>>>8&255,v>>>16&255,v>>>24&255)}
/* files = [[nama, teks]]. Hasil: Uint8Array zip (metode simpan, nama UTF-8). */
export function buatZip(files){
 var enc=new TextEncoder(),out=[],cen=[],off=0,i,j;
 var tgl=((2026-1980)<<9)|(1<<5)|1;
 for(i=0;i<files.length;i++){
  var nm=enc.encode(files[i][0]),d=enc.encode(files[i][1]),crc=crc32(d),h=[];
  w32(h,0x04034b50);w16(h,20);w16(h,0x0800);w16(h,0);w16(h,0);w16(h,tgl);w32(h,crc);w32(h,d.length);w32(h,d.length);w16(h,nm.length);w16(h,0);
  var c=[];w32(c,0x02014b50);w16(c,20);w16(c,20);w16(c,0x0800);w16(c,0);w16(c,0);w16(c,tgl);w32(c,crc);w32(c,d.length);w32(c,d.length);w16(c,nm.length);w16(c,0);w16(c,0);w16(c,0);w16(c,0);w32(c,0);w32(c,off);
  out.push(Uint8Array.from(h),nm,d);cen.push(Uint8Array.from(c),nm);off+=h.length+nm.length+d.length}
 var cd=0;for(i=0;i<cen.length;i++)cd+=cen[i].length;
 var e=[];w32(e,0x06054b50);w16(e,0);w16(e,0);w16(e,files.length);w16(e,files.length);w32(e,cd);w32(e,off);w16(e,0);
 var all=out.concat(cen,[Uint8Array.from(e)]),tot=0;for(i=0;i<all.length;i++)tot+=all[i].length;
 var r=new Uint8Array(tot),p=0;for(i=0;i<all.length;i++){r.set(all[i],p);p+=all[i].length}
 return r}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function kol(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
function sel(ref,v,gaya){var g=gaya?' s="'+gaya+'"':'';
 if(typeof v==='number')return'<c r="'+ref+'"'+g+'><v>'+v+'</v></c>';
 return'<c r="'+ref+'"'+g+' t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is></c>'}
var XH='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
var NS='xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';

/* Gaya: 1 = judul kolom (tebal, putih di atas biru tua, teks dibungkus), 2 = baris contoh (miring abu-abu), 3 = format teks (SKU dan nama: kode seperti 00123 tidak diubah jadi angka), 4 = petunjuk (bungkus teks), 5 = judul petunjuk (tebal). */
function stylesXml(){return XH+'<styleSheet '+NS+'><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF7F7F7F"/><name val="Calibri"/></font><font><b/><sz val="12"/><name val="Calibri"/></font></fonts>'+
 '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F3A5F"/><bgColor indexed="64"/></patternFill></fill></fills>'+
 '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
 '<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
 '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'+
 '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+
 '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'+
 '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'+
 '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'+
 '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'}

function lembarProduk(){
 var lebar=[38,16,20,14,14,12,12,22,16,32,18],cols='<cols>',i;
 for(i=0;i<JUDUL.length;i++)cols+='<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+lebar[i]+'" customWidth="1"'+(i===0||i===8?' style="3"':'')+'/>';
 cols+='</cols>';
 var r1='<row r="1" ht="45" customHeight="1">',r2='<row r="2">';
 JUDUL.forEach(function(j,k){r1+=sel(kol(k)+'1',j,1)});
 CONTOH.forEach(function(v,k){r2+=sel(kol(k)+'2',v,2)});
 return XH+'<worksheet '+NS+'><sheetViews><sheetView workbookViewId="0" tabSelected="1"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A3" sqref="A3"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>'+cols+'<sheetData>'+r1+'</row>'+r2+'</row></sheetData></worksheet>'}
function lembarPetunjuk(){
 var rows=PETUNJUK.map(function(t,i){return'<row r="'+(i+1)+'">'+sel('A'+(i+1),t,i===0?5:4)+'</row>'}).join('');
 return XH+'<worksheet '+NS+'><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="110" customWidth="1"/></cols><sheetData>'+rows+'</sheetData></worksheet>'}

/* Template impor .xlsx: lembar "Produk" (judul + satu baris contoh) dan lembar "Petunjuk". Hasil: Uint8Array. */
export function buatTemplateXlsx(){
 return buatZip([
  ['[Content_Types].xml',XH+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
  ['_rels/.rels',XH+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml',XH+'<workbook '+NS+' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Produk" sheetId="1" r:id="rId1"/><sheet name="Petunjuk" sheetId="2" r:id="rId2"/></sheets></workbook>'],
  ['xl/_rels/workbook.xml.rels',XH+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
  ['xl/styles.xml',stylesXml()],
  ['xl/worksheets/sheet1.xml',lembarProduk()],
  ['xl/worksheets/sheet2.xml',lembarPetunjuk()]])}

export var NAMA_TEMPLATE_XLSX='template-produk-wulfeg.xlsx';
export var MIME_XLSX='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/* ---------- pemasangan di kartu sambutan ---------- */
export function pasangImporPemula({doc,win}){
 var kartu=doc.getElementById('sm'),xp=doc.getElementById('xp');if(!kartu||!xp)return null;
 var st=doc.getElementById('smst'),pn=doc.getElementById('smtw'),ta=doc.getElementById('smt');
 function info(t,galat){if(!st)return;st.textContent=t||'';st.hidden=!t;st.setAttribute('data-galat',galat?'1':'0')}
 function serah(teks,nama){
  if(!bersih(teks)){info('Tidak ada isi yang bisa dibaca.',true);return false}
  try{kirimKeImpor(win,doc,teks,nama);info('');return true}
  catch(e){info('Browser ini belum bisa meneruskan file otomatis. Pakai tombol "Impor dari file CSV" di bagian Impor dan ekspor CSV.',true);return false}}
 function dariBerkas(f){
  var nm=(f.name||'').toLowerCase();info('');
  if(/\.xlsx$/.test(nm)){
   if(!win.DecompressionStream){info('Browser ini belum bisa membaca Excel. Simpan sebagai CSV lalu pilih lagi.',true);return}
   if(f.size>BATAS_BERKAS){info('File terlalu besar (maksimal 10 MB). Pecah menjadi beberapa file.',true);return}
   info('Membaca file Excel...');
   f.arrayBuffer().then(bacaXlsxBaris).then(function(rows){
    rows=buangSebelumJudul(rows.filter(function(r){return r.some(function(v){return bersih(v)!==''})}));
    if(!rows.length){info('Lembar pertama di file Excel kosong. Isi produk di lembar pertama.',true);return}
    serah(barisKeCsv(rows),'impor.csv')
   }).catch(function(){info('File Excel tidak terbaca. Pastikan formatnya .xlsx (bukan .xls lama), atau simpan sebagai CSV.',true)});
   return}
  if(/\.xls$/.test(nm)){info('Format .xls lama tidak didukung. Simpan ulang sebagai .xlsx atau CSV.',true);return}
  f.text().then(function(t){if(/^\s*</.test(t)){info('Isi file tidak terbaca. Pastikan formatnya CSV atau Excel (.xlsx).',true);return}serah(t,'impor.csv')},
   function(){info('File tidak bisa dibaca.',true)})}
 doc.getElementById('smi').addEventListener('click',function(){xp.click()});
 xp.addEventListener('change',function(){var f=xp.files&&xp.files[0];xp.value='';if(f)dariBerkas(f)});
 var bt=doc.getElementById('smtb');
 if(bt&&pn)bt.addEventListener('click',function(){var buka=pn.hidden;pn.hidden=!buka;bt.setAttribute('aria-expanded',buka?'true':'false');if(buka&&ta)ta.focus()});
 var go=doc.getElementById('smtg');
 if(go&&ta)go.addEventListener('click',function(){if(serah(ta.value,'tempel.csv'))ta.value=''});
 /* Tombol mana pun bertanda data-templat-xlsx mengunduh template Excel (kartu sambutan dan bagian Impor dan ekspor CSV). */
 doc.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-templat-xlsx]');if(!t)return;
  try{var blob=new win.Blob([buatTemplateXlsx()],{type:MIME_XLSX}),u=win.URL.createObjectURL(blob),a=doc.createElement('a');
   a.href=u;a.download=NAMA_TEMPLATE_XLSX;a.rel='noopener';a.style.display='none';doc.body.appendChild(a);a.click();
   win.setTimeout(function(){a.remove();win.URL.revokeObjectURL(u)},4000);info('')}
  catch(x){info('Template Excel gagal dibuat di browser ini. Pakai template CSV.',true)}});
 return{dariBerkas:dariBerkas}}
