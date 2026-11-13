/* Tes v9.55: pembaca file Mass Update Shopee + kartu sambutan (logika murni). Data uji: baris dari dua file contoh pemilik. */
import assert from 'node:assert/strict';
import {bacaShopee,pisahBaru,susunDialogShopee,susunNama} from '../js/impor-shopee.js';
import {perluSambutan,barisTerisi} from '../js/kartu-sambutan.js';
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};
const J=['et_title_product_id','et_title_product_name','et_title_variation_id','et_title_variation_name','et_title_parent_sku','et_title_variation_sku','et_title_variation_price','ps_gtin_code','et_title_variation_stock'];
const H=['Kode Produk','Nama Produk','Kode Variasi','Nama Variasi','SKU Induk','SKU','Harga','GTIN','Stok'];
const meta=['sales_info','abc','0','0','{}'];
const cat=['','','','','','','Mohon masukkan 99 sampai 150000000','','Min'];
const mk=(...isi)=>[J,meta,H,['','','','','','','Wajib','','Wajib'],cat,...isi];
const d=mk(
 ['57966557544','Produk Contoh A','321408991469','Hitam','','SKUA0001','45000','','36'],
 ['57966557544','Produk Contoh A','321408991468','Putih','','SKUA0002','45000','','32'],
 ['12716736827','T-SHIRT','','','','','60000','','0'],
 ['49117638277','Produk Contoh C','1','Gold,8 Inch','','','57600','','0'],
 ['49117638277','Produk Contoh C','2','Gold,10 Inch','','','66200','','0']);
const r=bacaShopee(d);
ok(r.salah===null&&r.items.length===5,'lima baris variasi terbaca; baris judul/catatan dilewati');
ok(r.produk===3,'tiga listing berbeda');
ok(r.items[0].n==='Produk Contoh A - Hitam'&&r.items[0].sku==='SKUA0001'&&r.items[0].ha===45000&&r.items[0].s===36,'nama + variasi, SKU, harga, stok');
ok(r.items[2].n==='T-SHIRT'&&r.items[2].s===0&&r.tanpaSku===3,'tanpa variasi tidak diberi akhiran; stok 0 tetap 0; tiga tanpa SKU');
ok(r.items[3].n==='Produk Contoh C - Gold, 8 Inch','koma variasi dirapikan');
const p=pisahBaru(r.items,[]);ok(p.baru.length===5&&p.sudahAda===0,'semua baru');
const p2=pisahBaru(r.items,p.baru.map(i=>({n:i.n,sku:i.sku})));ok(p2.baru.length===0&&p2.sudahAda===5,'impor ulang: tidak ada yang dobel, termasuk yang tanpa SKU (cocok lewat nama)');
const p3=pisahBaru(r.items,[{n:'lain',sku:'skua0001'}]);ok(p3.baru.length===4&&p3.sudahAda===1,'SKU sama beda huruf besar/kecil dianggap sudah ada');
const kembar=bacaShopee(mk(['1','A','','','','S1','100','','1'],['2','B','','','','s1','100','','1']));ok(pisahBaru(kembar.items,[]).kembarFile===1,'SKU kembar di dalam file dilewati');
const panjang='X'.repeat(60)+' '+'Y'.repeat(130);ok(susunNama(panjang,'Hitam').length<=120&&susunNama(panjang,'Hitam').endsWith(' - Hitam'),'nama panjang dipotong, nama variasi tetap');
const b=bacaShopee([['et_title_product_id','et_title_parent_sku','et_title_product_name'],['basic_info','x','0'],['Kode Produk','SKU Induk','Nama Produk','Deskripsi Produk','Alasan Gagal'],['','','','',''],['1','AB1','Barang X','deskripsi panjang','']]);
ok(b.salah===null&&b.items.length===1&&b.items[0].sku==='AB1'&&b.items[0].ha===null&&!b.punyaHarga,'Informasi Dasar: nama + SKU induk, tanpa harga');
ok(bacaShopee([['a','b'],['1','2']]).salah.includes('Mass Update'),'file asing ditolak dengan pesan jelas');
ok(bacaShopee(mk()).salah!==null,'file tanpa baris produk ditolak');
const t=susunDialogShopee({baru:5,contoh:'A; B',punyaHarga:true,variasi:2,sudahAda:1,kembarFile:0,tanpaSku:3,melebihi:0,max:1000,muat:5});
ok(t.startsWith('Impor 5 produk dari Shopee?')&&t.includes('Modal belum ada')&&t.includes('satu variasi menjadi satu produk')&&t.includes('1 produk sudah ada'),'dialog bahasa awam');
ok(perluSambutan([])&&perluSambutan([{n:'',m:0},{n:'',m:0}]),'dua baris kosong = aplikasi kosong');
ok(!perluSambutan([{n:'Kaos',m:0}])&&!perluSambutan([{n:'',m:5000}])&&!perluSambutan([{n:'',sku:'A'}]),'ada isian = kartu tidak tampil');
ok(barisTerisi([{n:'a'},{}])===1,'hitung baris terisi');
console.log('Impor Shopee + kartu sambutan: '+n+' pernyataan lulus');
