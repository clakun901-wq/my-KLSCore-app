/* v9.58: impor massal untuk pengguna baru: pembaca .xlsx, tempel, baris contoh, nomor baris bermasalah. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {num} from '../js/format.js';
import {bacaImpor,barisContoh,barisModalKosong,susunDialogImpor} from '../js/impor-csv.js';
import {bacaXlsxBaris,angkaXlsx,bersih,buangSebelumJudul,barisKeCsv,kirimKeImpor,pasangImporPemula,buatTemplateXlsx,buatZip,JUDUL} from '../js/impor-pemula.js';
import zlib from 'node:zlib';
let n=0;const ok=(v,m)=>{assert.ok(v,m);n++};const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const buf=f=>{const b=fs.readFileSync(new URL('./fixtures/'+f,import.meta.url));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};

/* 1. Baris contoh bawaan templat tidak diimpor */
ok(barisContoh('CONTOH - GANTI DENGAN PRODUK ANDA')&&barisContoh('Contoh produk A')&&barisContoh(' contoh: kaos'),'pola contoh dikenali');
ok(!barisContoh('Contoh A')&&!barisContoh('Kaos Contoh')&&!barisContoh('Contohnya Lucu')&&!barisContoh(''),'nama biasa tidak dianggap contoh');
const T='Nama produk;Modal / HPP per pcs;Biaya tambahan per pesanan (opsional);Biaya packing;Target untung;Isi paket (opsional);Stok Shopee (opsional);Sumber barang (opsional);SKU (opsional);Link sumber barang (opsional);Tarif Gratis Ongkir XTRA % (opsional)';
const csv=t=>t.trim().split(/\r?\n/).map(l=>l.split(';'));
const rt=bacaImpor(csv(T+'\nCONTOH - GANTI DENGAN PRODUK ANDA;25000;1000;500;5000;1;20;S;SKU-001;https://c.com;2\nKaos;30000;0;500;5000;1;;;K1;;\nTanpa modal;;;;;;;;K2;;\nGelas;8000;0;300;1500;1;;;K3;;'),num);
eq([rt.rows.length,rt.contoh],[3,1],'baris contoh dibuang dan dihitung');
eq(rt.rows.map(r=>r[0]),['Kaos','Tanpa modal','Gelas'],'sisanya utuh dan berurutan');
eq(rt.baris,[3,4,5],'nomor baris asli di file (judul = baris 1)');
eq(barisModalKosong(rt,num),[4],'baris bermodal kosong: baris 4 di file');
const rp=bacaImpor(csv('Barang X;12000;500;300;2000\nBarang Y;;;;'),num);
eq([rp.baris,barisModalKosong(rp,num)],[[1,2],[2]],'tanpa judul: baris pertama = baris 1');
const rj=bacaImpor(csv('nama;modal\nBarang X;\nBarang Y;5000'),num);
eq(barisModalKosong(rj,num),[2],'judul sebagian dikenal: baris data pertama = baris 2');

/* 2. Dialog menyebut baris dan contoh */
const dlg=susunDialogImpor({format:'templat',baru:2,contoh:'A',contohFile:1,barisLewat:[4,9],sudahAda:0,kembarFile:0,dilewati:2,rendah:0,gx:'',melebihi:0,max:1000,muat:2,ada:0});
ok(/1 baris contoh dari template dilewati/.test(dlg)&&/2 baris dilewati karena modalnya kosong atau 0 \(baris 4, 9, baris judul dihitung 1; baris kosong tidak dihitung\)/.test(dlg),'dialog menyebut nomor baris dan baris contoh');
ok(/\(baris 2; baris kosong tidak dihitung\)/.test(susunDialogImpor({format:'urutan',baru:1,contoh:'A',barisLewat:[2],dilewati:1,sudahAda:0,kembarFile:0,rendah:0,gx:'',melebihi:0,max:1000,muat:1,ada:0})),'tanpa judul: tidak menyebut baris judul');
const dlg2=susunDialogImpor({format:'templat',baru:1,contoh:'A',barisLewat:Array.from({length:12},(_,i)=>i+2),dilewati:12,sudahAda:0,kembarFile:0,rendah:0,gx:'',melebihi:0,max:1000,muat:1,ada:0});
ok(/\(baris 2, 3, 4, 5, 6, 7, 8, 9, \.\.\., baris judul/.test(dlg2),'daftar baris dipotong 8 nomor');
ok(!/contoh dari template/.test(susunDialogImpor({format:'templat',baru:1,contoh:'A',sudahAda:0,kembarFile:0,dilewati:1,rendah:0,gx:'',melebihi:0,max:1000,muat:1,ada:0})),'tanpa contohFile: kalimat tidak muncul');

/* 3. Pembaca .xlsx asli (dibuat dengan openpyxl): judul file di atas, baris contoh, angka desimal, entitas XML, SKU angka, lembar kedua diabaikan */
const rows=await bacaXlsxBaris(buf('template-impor-pemula.xlsx'));
eq(rows[0],['Daftar produk toko saya'],'baris judul file terbaca apa adanya');
eq(rows.length,7,'7 baris di lembar pertama (lembar kedua tidak ikut)');
const k=buangSebelumJudul(rows);
eq(k[0][0],'Nama produk','baris di atas judul kolom dibuang');
eq(k[2][0],'Kaos Polos Hitam','nama teks terbaca');
eq(k[2][1],'35000','angka bulat tanpa titik');
eq(k[2][2],'1500,5','desimal Excel (titik) diubah ke koma gaya Indonesia');
eq(k[3][0],'Tas & Dompet <Mini>','entitas XML (&amp; &lt; &gt;) dibuka');
eq(k[5][8],'8991234','SKU berupa angka terbaca sebagai teks angka');
eq(k[5][10],'1,75','sel teks "1,75" tidak diubah');
eq(k[3].slice(5,8),['1','',''],'sel kosong di tengah baris jadi teks kosong, kolom tetap sejajar');
const rx=bacaImpor(k,num);
eq([rx.format,rx.salah,rx.contoh],['templat',null,1],'alur impor lama mengenali hasil Excel sebagai templat; contoh dibuang');
eq(rx.rows.map(r=>r[0]),['Kaos Polos Hitam','Tas & Dompet <Mini>','Tanpa Modal','Gelas Kopi'],'empat produk, contoh dibuang');
eq(num(rx.rows[0][2]),1501,'biaya tambahan "1500,5" dibaca num() seperti CSV buatan aplikasi sendiri (rupiah dibulatkan)');
eq(barisModalKosong(rx,num),[5],'Tanpa Modal = baris ke-5 dihitung dari judul kolom (judul 1, contoh 2, Kaos 3, Tas 4); sejajar dengan urutan di lembar');

/* 4. File Shopee asli tetap terbaca (tidak error) */
const sp=await bacaXlsxBaris(buf('shopee-informasi-penjualan.xlsx'));
ok(sp.length>50&&sp.some(r=>r.some(v=>/sku/i.test(v))),'xlsx Shopee asli terbaca: '+sp.length+' baris');

/* 5. Berkas rusak ditolak dengan jelas */
await assert.rejects(()=>bacaXlsxBaris(new TextEncoder().encode('bukan zip sama sekali, hanya teks biasa').buffer),'berkas bukan zip ditolak');n++;
await assert.rejects(()=>bacaXlsxBaris(new ArrayBuffer(11*1024*1024)),'berkas > 10 MB ditolak');n++;

/* 6. Fungsi kecil */
eq([angkaXlsx('25000'),angkaXlsx('1500.5'),angkaXlsx('0.1'),angkaXlsx('1.0000000000000002'),angkaXlsx(''),angkaXlsx('abc')],['25000','1500,5','0,1','1','','abc'],'angkaXlsx');
eq(bersih('\u00a0 a\u200b b \ufeff'),'a b','bersih: spasi keras dan karakter tak terlihat');
eq(buangSebelumJudul([['x','y'],['1','2']]),[['x','y'],['1','2']],'tanpa judul dikenal: apa adanya');
eq(barisKeCsv([['A;B','"q"','biasa'],['1','','2']]),'"A;B";"""q""";biasa\r\n1;;2','CSV: kutip untuk ; dan tanda kutip');

/* 7. Penyerahan ke alur impor lama lewat input #xf */
let kejadian=null,files=null,dibuat=null;
const xf={files:null,dispatchEvent(e){kejadian=e.type;files=this.files;return true}};
const doc={getElementById:id=>id==='xf'?xf:null};
class DT{constructor(){this.items={add:f=>{this._f=f;dibuat=f}};}get files(){return[this._f]}}
class FL{constructor(p,nama,o){this.p=p;this.name=nama;this.type=o.type}}
class EV{constructor(t){this.type=t}}
kirimKeImpor({DataTransfer:DT,File:FL,Event:EV},doc,'a;b','tempel.csv');
ok(kejadian==='change'&&files[0].name==='tempel.csv'&&files[0].p[0]==='\ufeffa;b'&&files[0].type==='text/csv','file CSV dipasang di #xf lalu event change dikirim');
assert.throws(()=>kirimKeImpor({},doc,'a'),/tidak mendukung/);n++;
ok(pasangImporPemula({doc:{getElementById:()=>null},win:{}})===null,'tanpa kartu sambutan: tidak memasang apa pun');


/* 8. Template .xlsx buatan aplikasi */
const tpl=buatTemplateXlsx();
ok(tpl instanceof Uint8Array&&tpl[0]===0x50&&tpl[1]===0x4b,'template berupa zip (PK)');
const tplBuf=tpl.buffer.slice(tpl.byteOffset,tpl.byteOffset+tpl.byteLength);
const tr=await bacaXlsxBaris(tplBuf);
eq(tr[0],JUDUL,'lembar pertama: baris 1 = judul kolom');
eq(tr.length,2,'lembar pertama hanya judul + satu baris contoh (lembar Petunjuk tidak ikut)');
eq(tr[1].slice(0,3),['CONTOH - GANTI DENGAN PRODUK ANDA','25000','1000'],'baris contoh terbaca; angka tetap angka');
const tb=bacaImpor(buangSebelumJudul(tr),num);
eq([tb.format,tb.salah,tb.contoh,tb.rows.length],['templat',null,1,0],'template kosong: dikenali sebagai templat, contoh dibuang, tidak ada produk terimpor');
const srcTab=fs.readFileSync(new URL('../js/tab-impor-sinkron.js',import.meta.url),'utf8');
ok(JUDUL.length===11&&JUDUL.every(j=>srcTab.includes("'"+j+"'")),'11 judul kolom sama persis dengan template CSV di tab-impor-sinkron.js');
/* CRC dan struktur zip dicek dengan implementasi Node sendiri */
const zf=buatZip([['a.txt','halo \u00e9'],['b/c.xml','<x/>']]);
const dv=new DataView(zf.buffer,zf.byteOffset,zf.byteLength);
eq([dv.getUint32(0,true),dv.getUint32(14,true)],[0x04034b50,zlib.crc32(Buffer.from('halo \u00e9'))],'zip: tanda berkas lokal dan CRC32 sama dengan zlib.crc32');
const eocd=zf.length-22;
eq([dv.getUint32(eocd,true),dv.getUint16(eocd+10,true)],[0x06054b50,2],'zip: akhir direktori sah dan memuat 2 berkas');
/* Isi pengguna yang ditambahkan di Excel (simulasi: tambah baris lewat penulis yang sama tidak ada; cukup pastikan pembaca xlsx nyata sudah diuji di bagian 3) */

console.log(`Impor pemula (v9.58): ${n} pernyataan lulus.`);
