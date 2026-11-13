/* v9.54: pembaca impor CSV yang ramah pengguna. Modul MURNI (tanpa DOM, tanpa State, tanpa global).
   Masalah yang diperbaiki: impor dulu membaca kolom menurut URUTAN. File hasil unduhan aplikasi (38 kolom) terbaca salah:
   kolom "Isi paket" (1) dianggap modal (Rp 1) dan kolom "Total modal" dianggap tarif Gratis Ongkir XTRA (tidak terbaca).
   Sekarang kolom dikenali dari JUDUL-nya (urutan bebas). File tanpa judul yang dikenal tetap dibaca menurut urutan templat. */

/* Urutan kolom kanonik = urutan templat impor (dipakai impGo dan impGxStat di tab-impor-sinkron.js). */
var FIELDS=[
 {k:0,nama:'Nama produk',re:/^(nama produk|nama|produk|nama barang|barang)$/},
 {k:1,nama:'Modal / HPP per pcs',re:/^(modal hpp per pcs|modal supplier|modal per pcs|hpp per pcs|modal|hpp|harga modal)$/},
 {k:2,nama:'Biaya Management Partner',re:/^(biaya )?management partner$/},
 {k:3,nama:'Biaya packing',re:/^(biaya )?packing$/},
 {k:4,nama:'Target untung',re:/^target untung$/},
 {k:5,nama:'Isi paket',re:/^isi paket( opsional)?$/},
 {k:6,nama:'Stok Shopee',re:/^stok( shopee)?( opsional)?$/},
 {k:7,nama:'Sumber barang',re:/^(sumber barang|nama supplier|supplier)( opsional)?$/},
 {k:8,nama:'SKU',re:/^sku( opsional)?$/},
 {k:9,nama:'Link sumber barang',re:/^link (sumber barang|supplier|produk supplier|produk)( opsional)?$/},
 {k:10,nama:'Tarif Gratis Ongkir XTRA',re:/^(tarif )?gratis ongkir xtra( opsional)?$/}
];
function nh(s){return String(s==null?'':s).toLowerCase().replace(/[()%\/._\-]+/g,' ').replace(/\s+/g,' ').trim()}

/* Cocokkan judul baris pertama ke kolom kanonik. Hasil: {peta:[idx kolom file per kolom kanonik atau -1], cocok:n, hasil:bool}. */
export function petaJudul(head){
 var peta=FIELDS.map(function(){return -1}),cocok=0,hasil=false;
 var h=(head||[]).map(nh);
 h.forEach(function(x,i){
  if(x==='total modal'||x==='untung bersih'||x==='saldo masuk'||x==='total biaya shopee')hasil=true;
  for(var j=0;j<FIELDS.length;j++){if(peta[j]<0&&FIELDS[j].re.test(x)){peta[j]=i;cocok++;break}}});
 return{peta:peta,cocok:cocok,hasil:hasil}}

/* d = baris hasil parseCsv (baris pertama kemungkinan judul). num = pembaca angka aplikasi.
   Hasil: {rows:[11 kolom kanonik], format:'templat'|'hasil'|'urutan', salah:null|teks, kosong:teks petunjuk bila tak ada baris bermodal} */
export function bacaImpor(d,num){
 if(!d||!d.length)return{rows:[],format:'urutan',salah:'File kosong. Pilih file CSV yang berisi data produk.',kosong:''};
 var pj=petaJudul(d[0]);
 if(pj.cocok>=2){
  var perlu=[];if(pj.peta[0]<0)perlu.push('Nama produk');if(pj.peta[1]<0)perlu.push('Modal / HPP per pcs');
  if(perlu.length)return{rows:[],format:'templat',salah:'Kolom wajib tidak ditemukan di baris judul: '+perlu.join(' dan ')+'. Pakai tombol "Unduh template impor" lalu isi sesuai judul kolomnya.',kosong:''};
  /* Judul sebagian dikenal dan kolom yang dikenal duduk di posisi templatnya (contoh: nama;modal;mp;packing;target): sisanya dibaca menurut posisi, seperti perilaku lama. Urutan acak atau file hasil: tidak ditebak. */
  if(!pj.hasil&&pj.peta.every(function(ix,k){return ix<0||ix===k}))pj.peta=pj.peta.map(function(ix,k){return ix<0&&k<d[0].length?k:ix});
  var rows=d.slice(1).map(function(x){return pj.peta.map(function(ix,k){
   if(ix<0||(pj.hasil&&k===10))return '';
   return x[ix]==null?'':x[ix]})});
  return{rows:rows,format:pj.hasil?'hasil':'templat',salah:null,
   kosong:'Periksa isi kolom "Modal / HPP per pcs": semua barisnya kosong atau 0.'}}
 /* Tanpa judul yang dikenal: perilaku lama (urutan templat). Baris pertama dibuang bila kolom modalnya bukan angka. */
 var r=d.slice();
 if(r.length&&isNaN(Number(String(r[0][1]||'').replace(/\./g,'').replace(',','.'))))r.shift();
 return{rows:r,format:'urutan',salah:null,kosong:'Urutan kolom: nama, modal, Management Partner, packing, target. Atau pakai "Unduh template impor".'}}

/* Pisahkan baris yang SKU-nya sudah ada di aplikasi atau kembar di dalam file (SKU kosong tidak pernah dianggap kembar). */
export function pisahKembar(rows,skuAda){
 var ada=new Set(),lihat=new Set(),baru=[],sudahAda=0,kembarFile=0,k;
 (skuAda||[]).forEach(function(s){k=String(s||'').trim().toLowerCase();if(k)ada.add(k)});
 rows.forEach(function(x){k=String(x[8]||'').trim().toLowerCase();
  if(k){if(ada.has(k)){sudahAda++;return}if(lihat.has(k)){kembarFile++;return}lihat.add(k)}
  baru.push(x)});
 return{baru:baru,sudahAda:sudahAda,kembarFile:kembarFile}}

/* Teks dialog konfirmasi: ringkas di atas, catatan dengan bahasa awam di bawah. */
export function susunDialogImpor(o){
 var L=['Impor '+o.baru+' produk baru?'];
 if(o.contoh)L.push('Contoh: '+o.contoh+'.');
 var c=[];
 if(o.format==='hasil')c.push('File ini hasil unduhan aplikasi. Yang diambil hanya data produk (nama, modal, biaya, target, stok, SKU). Hasil hitungan dan tarif tidak diimpor; tarif ikut Setelan.');
 if(o.sudahAda>0)c.push(o.sudahAda+' produk sudah ada di aplikasi (SKU sama) dan dilewati supaya tidak dobel. Untuk memperbarui modal atau stok produk yang sudah ada, pakai "Sinkron modal dan stok" di bawah.');
 if(o.kembarFile>0)c.push(o.kembarFile+' baris di file memakai SKU kembar dan dilewati.');
 if(o.dilewati>0)c.push(o.dilewati+' baris dilewati karena modalnya kosong atau 0.');
 if(o.rendah>0)c.push(o.rendah+' baris bermodal di bawah Rp100. Periksa kolom modal sebelum melanjutkan.');
 if(o.gx&&String(o.gx).trim())c.push(String(o.gx).trim());
 if(o.melebihi>0)c.push('Batas '+o.max+' produk: hanya '+o.muat+' produk yang masuk.');
 if(o.ada>0)c.push('Produk yang sudah ada di aplikasi tidak diubah.');
 if(c.length){L.push('','Catatan:');c.forEach(function(x){L.push('- '+x)})}
 return L.join('\n')}
