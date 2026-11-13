/* v9.55: pembaca file Mass Update Shopee (Informasi Penjualan atau Informasi Dasar) untuk MENAMBAH produk baru.
   Modul MURNI (tanpa DOM, tanpa State, tanpa global). Masukan: baris-baris tabel (array of array) dari xlsx/CSV.
   Satu variasi Shopee = satu produk di aplikasi (harga, stok, dan SKU memang per variasi). Modal tidak ada di file Shopee, jadi 0. */

var NAMA_MAKS=120;

function nh(s){return String(s==null?'':s).replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\u00a0/g,' ').toLowerCase().replace(/[()%\/._\-]+/g,' ').replace(/\s+/g,' ').trim()}
function tx(s){return String(s==null?'':s).replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\u00a0/g,' ').trim()}

/* Cari baris judul (baris 3 di file Shopee; baris 1 berisi kode teknis et_title_*, dilewati). */
export function cariJudul(d){
 for(var i=0;i<Math.min((d||[]).length,15);i++){
  var h=d[i].map(nh);
  if(h.some(function(x){return /^(et title |ps )/.test(x)}))continue;
  var c={kode:-1,nama:-1,kv:-1,nv:-1,par:-1,sku:-1,harga:-1,stok:-1};
  h.forEach(function(x,j){
   if(x==='kode produk'||x==='product id'){if(c.kode<0)c.kode=j}
   else if(x==='nama produk'||x==='product name'){if(c.nama<0)c.nama=j}
   else if(x==='kode variasi'||x==='variation id'){if(c.kv<0)c.kv=j}
   else if(x==='nama variasi'||x==='variation name'){if(c.nv<0)c.nv=j}
   else if(x==='sku induk'||x==='parent sku'){if(c.par<0)c.par=j}
   else if(x==='sku'||x==='variation sku'){if(c.sku<0)c.sku=j}
   else if(x==='harga'||x==='price'){if(c.harga<0)c.harga=j}
   else if(x==='stok'||x==='stock'){if(c.stok<0)c.stok=j}});
  if(c.kode>=0&&c.nama>=0&&(c.par>=0||c.sku>=0))return{c:c,h:i}}
 return null}

function angka(v){var s=tx(v);if(s==='')return null;var n=Number(s.replace(/[^0-9.\-]/g,''));return isFinite(n)?n:null}

/* Nama di aplikasi dibatasi 120 huruf. Nama Shopee bisa sampai 190: potong bagian produk, pertahankan nama variasi supaya tidak kembar. */
export function susunNama(nama,variasi){
 nama=tx(nama);variasi=tx(variasi).replace(/\s*,\s*/g,', ');
 if(!variasi)return nama.slice(0,NAMA_MAKS).trim();
 var suf=' - '+variasi;if(suf.length>NAMA_MAKS-20)suf=suf.slice(0,NAMA_MAKS-20).trim();
 var mx=NAMA_MAKS-suf.length,ps=nama.slice(0,mx);if(nama.length>mx){var sp=ps.lastIndexOf(' ');if(sp>mx*0.6)ps=ps.slice(0,sp)}
 return ps.trim()+suf}

/* Hasil: {salah:null|teks, items:[{kode,kodeVar,n,sku,ha,s}], punyaHarga:bool, produk:jumlah listing, tanpaSku:n} */
export function bacaShopee(d){
 var f=cariJudul(d);
 if(!f)return{salah:'File ini tidak terbaca sebagai file Mass Update Shopee. Di Seller Centre pilih Produk Saya, Pembaruan Massal, lalu unduh "Informasi Penjualan" (paling lengkap) atau "Informasi Dasar".',items:[],punyaHarga:false,produk:0,tanpaSku:0};
 var c=f.c,items=[],listing={};
 d.slice(f.h+1).forEach(function(x){
  var kode=tx(x[c.kode]);if(!/^\d+$/.test(kode))return; /* baris catatan/petunjuk dilewati */
  var nama=tx(x[c.nama]);if(!nama)return;
  var vr=c.nv>=0?tx(x[c.nv]):'',sku=(c.sku>=0?tx(x[c.sku]):'')||(c.par>=0?tx(x[c.par]):'');
  listing[kode]=1;
  items.push({kode:kode,kodeVar:c.kv>=0?tx(x[c.kv]):'',n:susunNama(nama,vr),sku:sku.slice(0,60),ha:c.harga>=0?angka(x[c.harga]):null,s:c.stok>=0?angka(x[c.stok]):null})});
 if(!items.length)return{salah:'Tidak ada baris produk di file ini. Pastikan file belum dikosongkan.',items:[],punyaHarga:false,produk:0,tanpaSku:0};
 return{salah:null,items:items,punyaHarga:c.harga>=0,punyaStok:c.stok>=0,produk:Object.keys(listing).length,tanpaSku:items.filter(function(i){return !i.sku}).length}}

/* Pisahkan item yang sudah ada di aplikasi atau kembar di dalam file.
   Kunci: SKU bila ada; bila SKU kosong, nama persis sama (huruf besar/kecil diabaikan). */
export function pisahBaru(items,rowsAda){
 var sku=new Set(),nama=new Set(),lihatS=new Set(),lihatN=new Set(),baru=[],sudahAda=0,kembarFile=0;
 (rowsAda||[]).forEach(function(r){var s=tx(r.sku).toLowerCase(),n=tx(r.n).toLowerCase();if(s)sku.add(s);if(n)nama.add(n)});
 items.forEach(function(i){
  var s=i.sku.toLowerCase(),n=i.n.toLowerCase();
  if(s){if(sku.has(s)){sudahAda++;return}if(lihatS.has(s)){kembarFile++;return}lihatS.add(s)}
  else{if(nama.has(n)){sudahAda++;return}if(lihatN.has(n)){kembarFile++;return}lihatN.add(n)}
  baru.push(i)});
 return{baru:baru,sudahAda:sudahAda,kembarFile:kembarFile}}

/* Teks dialog konfirmasi dalam bahasa awam. */
export function susunDialogShopee(o){
 var L=['Impor '+o.baru+' produk dari Shopee?'];
 if(o.contoh)L.push('Contoh: '+o.contoh+'.');
 var c=['Modal belum ada di file Shopee, jadi produk masuk dengan modal kosong. Isi modal di tab Hitung supaya untung bisa dihitung.'];
 if(o.punyaHarga)c.push('Harga dari Shopee masuk ke "Harga listing awal" dan stok ke "Stok Shopee".');
 if(o.variasi>0)c.push('Produk yang punya variasi dipecah: satu variasi menjadi satu produk, namanya "Nama produk - Nama variasi".');
 if(o.sudahAda>0)c.push(o.sudahAda+' produk sudah ada di aplikasi (SKU atau nama sama) dan dilewati supaya tidak dobel. Produk lama tidak diubah.');
 if(o.kembarFile>0)c.push(o.kembarFile+' baris di file kembar (SKU atau nama sama) dan dilewati.');
 if(o.tanpaSku>0)c.push(o.tanpaSku+' produk belum punya SKU di Shopee. Beri SKU di Seller Centre bila nanti ingin sinkron lewat SKU.');
 if(o.melebihi>0)c.push('Batas '+o.max+' produk: hanya '+o.muat+' produk yang masuk.');
 L.push('','Catatan:');c.forEach(function(x){L.push('- '+x)});
 return L.join('\n')}
