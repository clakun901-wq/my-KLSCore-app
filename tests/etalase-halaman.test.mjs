/* Tahap 9B (v9.48): pembagian halaman Etalase + penanda data-berubah. Tes murni di Node, tanpa peramban. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {potongHalaman,installEtalaseHalaman,ukuranDariAlamat,UKURAN_HALAMAN,TTL_MS} from '../js/etalase-halaman.js';
let n=0; const ok=(v,m)=>{assert.ok(v,m);n++}; const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const cards=(k,from=0)=>Array.from({length:k},(_,i)=>({kind:'card',key:'c-'+(from+i),model:{index:from+i,stock:{unlocked:false}}}));
// 1) Tanpa pembagian bila muat satu halaman: hasil IDENTIK dengan daftar asli (perilaku lama tidak berubah).
{const items=[{kind:'heading',key:'h-att',text:'Perlu isi ulang (2)'},...cards(2),{kind:'heading',key:'h-rest',text:'Stok aman (3)'},...cards(3,2)];
 const r=potongHalaman(items,0,50); ok(r.out===items&&r.pages===1&&r.total===5,'satu halaman: daftar diteruskan apa adanya');}
// 2) 1.000 produk: setiap produk muncul tepat satu kali di tepat satu halaman, urutan terjaga, tidak ada yang hilang.
{const items=cards(1000),seen=[];const r0=potongHalaman(items,0,50);ok(r0.pages===20&&r0.total===1000,'1.000 produk = 20 halaman');
 for(let p=0;p<20;p++){const r=potongHalaman(items,p,50);ok(r.out.length===50,'halaman '+(p+1)+' berisi 50');for(const c of r.out)seen.push(c.model.index)}
 eq(seen,Array.from({length:1000},(_,i)=>i),'gabungan semua halaman = 1.000 produk, urutan sama');}
// 3) Judul grup: halaman yang dimulai di tengah grup tetap diberi judul grupnya; judul tidak dobel.
{const items=[{kind:'heading',key:'h-att',text:'Perlu isi ulang (60)'},...cards(60),{kind:'heading',key:'h-rest',text:'Stok aman (40)'},...cards(40,60)];
 const p1=potongHalaman(items,0,50),p2=potongHalaman(items,1,50),p3=potongHalaman(items,2,50);
 ok(p1.out[0].key==='h-att'&&p1.out.filter(x=>x.kind==='heading').length===1,'halaman 1: satu judul "Perlu isi ulang"');
 ok(p2.out[0].key==='h-att'&&p2.out.some(x=>x.key==='h-rest')&&p2.out.filter(x=>x.kind==='card').length===50,'halaman 2: lanjutan grup + judul "Stok aman", 50 kartu');
 ok(p3.pages===2&&p3.page===1,'100 produk dengan ukuran 50 = 2 halaman; indeks 2 dijepit ke halaman terakhir');
 ok(p1.out.filter(x=>x.kind==='card').length+p2.out.filter(x=>x.kind==='card').length===100,'100 kartu terbagi dua halaman');}
// 4) Batas halaman: indeks di luar rentang dijepit; nilai aneh tidak merusak.
{const items=cards(120);ok(potongHalaman(items,99,50).page===2,'terlalu besar -> halaman terakhir');ok(potongHalaman(items,-5,50).page===0,'negatif -> halaman pertama');ok(potongHalaman(items,NaN,50).page===0,'NaN -> halaman pertama');ok(potongHalaman(items,2,50).out.length===20,'halaman terakhir berisi sisa 20');}
// 5) Daftar kosong / pesan "belum ada produk live" diteruskan tanpa dipotong.
{const e=[{kind:'empty',key:'empty',text:'x'}];ok(potongHalaman(e,0,50).out===e,'item empty diteruskan');ok(potongHalaman([],0,50).pages===1,'daftar kosong = 1 halaman');}
// 6) Ukuran dari alamat: hanya 10..200 bulat, selain itu default 50.
{ok(ukuranDariAlamat('?hal=25')===25&&ukuranDariAlamat('?hal=100')===100,'?hal=25/100 diterima');ok(ukuranDariAlamat('?hal=5')===UKURAN_HALAMAN&&ukuranDariAlamat('?hal=999')===UKURAN_HALAMAN&&ukuranDariAlamat('?hal=abc')===UKURAN_HALAMAN&&ukuranDariAlamat('')===UKURAN_HALAMAN,'nilai di luar rentang -> 50');}
// 7) Pemasangan: perender asli hanya menerima potongan halaman; pindah halaman tidak memanggil ulang shop().
{let rendered=null,renders=0;const g={KShelf:{renderShelf:(c,i)=>{rendered=i;renders++},anyCardEditing:()=>false},scrollTo(){}};
 let key=[1,'a'],t=1000;const H=installEtalaseHalaman({global:g,doc:null,size:50,now:()=>t,getKey:()=>key});
 ok(g.KShelf!==H&&Object.isFrozen(g.KShelf),'KShelf diganti proxy beku');
 g.KShelf.renderShelf({},cards(1000));ok(rendered.length===50&&rendered[0].key==='c-0','render pertama: 50 kartu halaman 1');
 H.go(3);ok(rendered.length===50&&rendered[0].key==='c-150','loncat ke halaman 4 memotong ulang tanpa shop()');ok(renders===2,'dua kali render, keduanya hanya 50 kartu');
 H.go(999);ok(rendered[0].key==='c-950','loncat melewati batas dijepit ke halaman terakhir');
 g.KShelf.renderShelf({},cards(40));ok(rendered.length===40&&H.state.page===0,'daftar menyusut jadi satu halaman: halaman dijepit ke 0 dan semua tampil');
 // gate
 let calls=0;const run=H.gate(()=>{calls++;g.KShelf.renderShelf({},cards(1000))});
 run();ok(calls===0&&H.stats().skipped===1,'data tidak berubah: shop() dilewati');
 key=[2,'a'];run();ok(calls===1,'State.TS berubah: shop() dijalankan');
 run();ok(calls===1,'setelah render, tidak berubah lagi: dilewati');
 key=[2,{}];run();ok(calls===2,'rows/A/PRM diganti utuh (pemulihan): shop() dijalankan');
 t+=TTL_MS+1;run();ok(calls===3,'lebih dari 60 detik: shop() dijalankan (status promo bergantung waktu)');
 const lockedItems=cards(3);lockedItems[1].model.stock.unlocked=true;g.KShelf.renderShelf({},lockedItems);run();ok(calls===4,'ada kunci stok terbuka: shop() dijalankan agar gembok kembali terkunci');
 run();ok(calls===4,'sesudah dirender terkunci kembali: dilewati lagi');
 const fresh=installEtalaseHalaman({global:{KShelf:{renderShelf(){},anyCardEditing(){return false}}},doc:null,getKey:()=>[]});let c2=0;fresh.gate(()=>{c2++})();ok(c2===1,'belum pernah render: shop() wajib dijalankan');}
// 8) Tanpa KShelf (komponen belum termuat) pemasangan tidak melempar dan tidak mengubah apa pun.
ok(installEtalaseHalaman({global:{},doc:null})===null,'tanpa KShelf -> null');
// 9) Berkas terdaftar dan terhubung.
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),main=fs.readFileSync(new URL('../js/main.js',import.meta.url),'utf8'),core=fs.readFileSync(new URL('../js/app-core.js',import.meta.url),'utf8'),html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
ok(sw.includes("'./js/etalase-halaman.js'")&&sw.includes("'./js/kinerja.js'"),'dua modul baru terdaftar di cache offline');
ok(/installEtalaseHalaman\(/.test(main)&&main.indexOf('installEtalaseHalaman(')<main.indexOf("import('./app-core.js')"),'pembagian halaman dipasang SEBELUM app-core dimuat');
ok(core.includes('KH.gate(shop)'),'tab() memakai shop() berpenanda data-berubah');
ok(html.includes('id="shpt"')&&html.includes('id="shpg"'),'index.html punya penanda halaman atas dan bawah');
console.log(`Etalase berhalaman (Tahap 9B): ${n} pernyataan lulus.`);
