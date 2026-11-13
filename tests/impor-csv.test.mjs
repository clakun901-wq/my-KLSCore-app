/* v9.54: impor CSV dikenali dari judul kolom. Kasus nyata: file hasil unduhan aplikasi (38 kolom) dulu terbaca modal Rp 1 dan tarif tidak terbaca. */
import assert from 'node:assert/strict';
import {num} from '../js/format.js';
import {bacaImpor,pisahKembar,susunDialogImpor,petaJudul} from '../js/impor-csv.js';
let n=0;const ok=(v,m)=>{assert.ok(v,m);n++};const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};

/* parser sederhana pemisah titik koma, cukup untuk fixture di bawah (tidak ada tanda kutip) */
const csv=t=>t.trim().split(/\r?\n/).map(l=>l.split(';'));

/* 1. File hasil unduhan aplikasi (judul asli v9.53, baris asli dipotong) */
const HASIL_HEAD='Produk;Isi paket;Stok Shopee;Tanggal cek stok;Sumber barang;SKU;Link sumber barang;Modal / HPP per pcs;Biaya Management Partner;Biaya packing;Total modal;Target untung;Harga listing awal;Harga diskon coret;Voucher toko;Harga setelah voucher;Tarif administrasi (%);Tarif Gratis Ongkir XTRA (%);Tarif Promo XTRA (%);Tarif Video XTRA (%);Tarif Live XTRA (%);Biaya administrasi;Biaya Gratis Ongkir XTRA;Biaya Promo XTRA;Biaya Video XTRA;Biaya Live XTRA;Biaya pembayaran;Biaya layanan pesanan;Total Biaya Shopee;Premi;PPh 22;Biaya iklan;Cadangan retur;Ongkir ditanggung;Saldo masuk;Untung bersih;Margin (%);Harga impas (diskon coret)';
const HASIL_ROW='One Two Cups Cangkir Pemanas Air Elektrik Mobil Travel Mug 450ml - NJ88 - Silver;1;35;2026-10-31;;OMHZ5WSV;https://www.jakmall.com/x#1;39400;2200;720;42320;6000;77900;58425;2000;56425;6,5;1,75;4,5;0;0;3668;987;2539;0;0;0;0;7194;282;282;0;0;0;48667;6347;11,2;51066';
const HASIL_ROW2='TaffHOME Kain Lap Microfiber;1;50;2026-10-31;;7ROR2FBL;https://www.jakmall.com/y#2;2500;2200;720;5420;0;8900;6675;0;6675;6,5;1,75;4,5;0;0;434;117;300;0;0;0;0;851;33;33;0;0;0;5758;338;5,1;6283';
const rh=bacaImpor(csv(HASIL_HEAD+'\n'+HASIL_ROW+'\n'+HASIL_ROW2),num);
ok(rh.format==='hasil'&&!rh.salah,'file hasil unduhan dikenali sebagai hasil');
eq(rh.rows.length,2,'dua baris data (judul dibuang)');
ok(num(rh.rows[0][1])===39400,'modal diambil dari kolom Modal / HPP per pcs, bukan Isi paket (bug lama: Rp 1)');
eq([rh.rows[0][2],rh.rows[0][3],rh.rows[0][4]],['2200','720','6000'],'Management Partner, packing, target');
eq([rh.rows[0][5],rh.rows[0][6],rh.rows[0][8]],['1','35','OMHZ5WSV'],'isi paket, stok, SKU');
eq(rh.rows[0][10],'','tarif dari file hasil TIDAK diimpor (sudah tarif efektif; menghindari keringanan dihitung dua kali)');
ok(rh.rows.every(r=>r.length===11),'setiap baris dinormalkan ke 11 kolom templat');

/* 2. Templat resmi, urutan bebas, judul lama "Modal supplier" */
const T='Nama produk;Modal / HPP per pcs;Biaya Management Partner;Biaya packing;Target untung;Isi paket (opsional);Stok Shopee (opsional);Sumber barang (opsional);SKU (opsional);Link sumber barang (opsional);Tarif Gratis Ongkir XTRA % (opsional)';
const rt=bacaImpor(csv(T+'\nContoh A;25000;1000;500;5000;1;20;Toko;KAOS-01;https://c.com;2'),num);
ok(rt.format==='templat'&&rt.rows[0][10]==='2'&&rt.rows[0][8]==='KAOS-01','templat resmi dibaca penuh, tarif XTRA templat ikut terbaca');
const acak=bacaImpor(csv('SKU;Target untung;Modal supplier;Nama\nS1;3000;10.000;Barang Acak'),num);
ok(acak.format==='templat'&&acak.rows[0][0]==='Barang Acak'&&num(acak.rows[0][1])===10000&&acak.rows[0][4]==='3000'&&acak.rows[0][8]==='S1','urutan kolom bebas dan judul lama Modal supplier dikenali');

/* 3. Tanpa judul: perilaku lama (urutan templat), dan judul tak dikenal dibuang bila modal bukan angka */
const polos=bacaImpor(csv('Barang X;12000;500;300;2000'),num);
ok(polos.format==='urutan'&&polos.rows.length===1&&num(polos.rows[0][1])===12000,'tanpa judul dibaca menurut urutan');
const jdl=bacaImpor(csv('nama;modal;mp;pack;target\nBarang X;12000;500;300;2000'),num);
ok(jdl.rows.length===1&&jdl.rows[0][0]==='Barang X'&&num(jdl.rows[0][1])===12000&&jdl.rows[0][2]==='500'&&jdl.rows[0][3]==='300'&&jdl.rows[0][4]==='2000','judul sebagian dikenal di posisi templat: sisa kolom dibaca menurut posisi (perilaku lama terjaga)');
const asing=bacaImpor(csv('x;y;z\nBarang X;12000;500'),num);
ok(asing.format==='urutan'&&asing.rows.length===1&&asing.rows[0][0]==='x'===false&&asing.rows[0][0]==='Barang X','judul tak dikenal sama sekali dibuang seperti perilaku lama');
const acak2=bacaImpor(csv('Catatan 2;Nama;Modal\nxx;Barang Y;5000'),num);
ok(acak2.rows[0][2]===''&&acak2.rows[0][0]==='Barang Y','urutan tak sesuai templat: kolom asing TIDAK ditebak menjadi biaya');

/* 4. Judul ada tetapi kolom wajib hilang: pesan jelas, tidak mengimpor apa pun */
const hilang=bacaImpor(csv('Nama produk;SKU;Stok\nA;S1;5'),num);
ok(hilang.salah&&/Modal \/ HPP per pcs/.test(hilang.salah)&&/template/.test(hilang.salah)&&hilang.rows.length===0,'kolom modal hilang dilaporkan dengan petunjuk templat');
ok(bacaImpor([],num).salah,'file kosong dilaporkan');
eq(petaJudul(['Total modal','Modal']).peta[1],1,'"Total modal" tidak dianggap kolom modal');

/* 5. SKU kembar */
const rows=[['A','1000','','','','','','','S1'],['B','1000','','','','','','','s1 '],['C','1000','','','','','','','S2'],['D','1000','','','','','','',''],['E','1000','','','','','','','']];
const kv=pisahKembar(rows,['S2']);
eq([kv.baru.length,kv.sudahAda,kv.kembarFile],[3,1,1],'S2 sudah ada, s1 kembar dalam file; SKU kosong tidak pernah dianggap kembar');
eq(kv.baru.map(x=>x[0]),['A','D','E'],'baris yang masuk');
const kv2=pisahKembar(rows.slice(0,3),['S1','S2']);
eq([kv2.baru.length,kv2.sudahAda],[0,3],'impor ulang file yang sama: tidak ada yang masuk');

/* 6. Teks dialog: bahasa awam, tidak membingungkan */
const dlg=susunDialogImpor({format:'hasil',baru:3,contoh:'A modal Rp 1.000',sudahAda:75,kembarFile:0,dilewati:2,rendah:1,gx:' Tarif Gratis Ongkir XTRA per produk diisi di 3 produk.',melebihi:1,max:1000,muat:2,ada:10});
ok(dlg.startsWith('Impor 3 produk baru?'),'dialog dibuka dengan jumlah produk');
ok(/75 produk sudah ada di aplikasi \(SKU sama\) dan dilewati/.test(dlg)&&/Sinkron modal dan stok/.test(dlg),'dialog menjelaskan SKU sudah ada dan ke mana memperbarui');
ok(/hasil unduhan aplikasi/.test(dlg)&&/Batas 1000 produk: hanya 2/.test(dlg)&&/tidak diubah/.test(dlg),'dialog menjelaskan file hasil, batas produk, dan produk lama aman');
ok(!/periksa format angka/.test(dlg),'kalimat lama yang membingungkan sudah tidak dipakai');
const polosD=susunDialogImpor({format:'templat',baru:1,contoh:'A',sudahAda:0,kembarFile:0,dilewati:0,rendah:0,gx:'',melebihi:0,max:1000,muat:1,ada:0});
ok(polosD==='Impor 1 produk baru?\nContoh: A.','tanpa catatan: dialog singkat tanpa bagian Catatan');

/* 7. Kasus nyata pemilik: seluruh file hasil di-impor ke aplikasi yang sudah berisi produknya = tidak ada duplikat */
const skuHasil=csv(HASIL_HEAD+'\n'+HASIL_ROW+'\n'+HASIL_ROW2).slice(1).map(r=>r[5]);
const kv3=pisahKembar(rh.rows,skuHasil);
eq([kv3.baru.length,kv3.sudahAda],[0,2],'mengimpor ulang file hasil ke aplikasi yang sama tidak menggandakan produk');

/* 8. Sabotase: pembaca urutan lama pada file hasil memang salah (membuktikan tes ini menangkap bug aslinya) */
const lama=csv(HASIL_HEAD+'\n'+HASIL_ROW).slice(1)[0];
ok(num(lama[1])===1&&Number(lama[10])>100,'SABOTASE: urutan lama memberi modal Rp 1 dan tarif 42320 (di luar 0 sampai 100, tak terbaca)');

console.log(`Impor CSV (v9.54): ${n} pernyataan lulus.`);
