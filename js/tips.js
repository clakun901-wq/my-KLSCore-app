/* v9.57: ikon \u24d8 penjelas istilah. Modul mandiri (tanpa State, tanpa global lintas berkas).
   Setiap istilah punya SATU kalimat penjelasan + contoh angka. Penjelasan diambil dari kamus di bawah:
   - BY_ID   : label statis di index.html, kunci = nilai atribut for (id kolom).
   - BY_TEXT : label/baris hasil yang dibuat JS (kartu produk, panel, rincian), kunci = teks label.
   Ikon dipasang oleh MutationObserver (kartu dibuat ulang tiap hitung) dan isinya tampil di satu popover melayang
   yang ditempel ke body, jadi susunan DOM label/kolom/baris rincian (dan kode yang membaca previousElementSibling) tidak berubah.
   Contoh angka memakai harga setelah voucher Rp100.000 dan memakai rumus aplikasi (persen dari harga setelah voucher). */
const E='Contoh: ';
export const BY_ID={
 obt:'Star/Star+/Mall menentukan biaya pembayaran otomatis. '+E+'toko Mall memakai biaya pembayaran 1,8% dari harga jual.',
 obc:'Kategori resmi produk di Shopee menentukan persen biaya administrasi. '+E+'bila tarif kategori Anda 8%, biayanya Rp8.000 dari harga Rp100.000.',
 obg:'Pilih program Gratis Ongkir XTRA yang diikuti toko. '+E+'tarif 4% memotong Rp4.000 dari harga Rp100.000, maksimal sebesar batas Rp.',
 tp:'Jenis toko Anda di Shopee; dipakai mengatur biaya pembayaran otomatis. '+E+'Mall otomatis 1,8%, Non-Star tanpa biaya pembayaran.',
 fb:'Biaya proses pesanan yang dipotong Shopee tiap pesanan. '+E+'Rp1.250 per pesanan mengurangi saldo masuk dari Rp90.000 menjadi Rp88.750.',
 fl:'Nominal Rp yang dipotong per pesanan bila biaya proses pesanan aktif. '+E+'isi 1250 berarti tiap pesanan dipotong Rp1.250.',
 pb:'Persen biaya pembayaran dari harga setelah voucher. '+E+'1,8% dari Rp100.000 = Rp1.800.',
 pbc:'Batas Rp biaya pembayaran per produk, dikali isi paket. '+E+'batas Rp50.000 berarti 1,8% dari harga Rp5.000.000 tetap dipotong Rp50.000, bukan Rp90.000.',
 ac:'Kategori administrasi bawaan untuk semua produk (bisa diubah per produk). '+E+'kategori bertarif 8% memotong Rp8.000 dari Rp100.000.',
 ad:'Persen administrasi yang Anda isi sendiri bila kategori bawaan = manual. '+E+'6,5% dari Rp100.000 = Rp6.500.',
 gc:'Kategori tarif Gratis Ongkir XTRA bawaan menurut tabel Shopee. '+E+'kategori bertarif 4% memotong Rp4.000 dari Rp100.000.',
 gm:'Persen XTRA penuh yang diisi sendiri, sebelum keringanan toko baru. '+E+'4% penuh dengan keringanan 50% menjadi 2%, yaitu Rp2.000 dari Rp100.000.',
 sz:'Ukuran Biasa atau Khusus menentukan tarif dan batas Gratis Ongkir XTRA. '+E+'batas bawaan Biasa Rp40.000 dan Khusus Rp60.000 per kuantitas.',
 gf:'Keringanan tarif XTRA untuk toko baru dalam persen dari tarif tabel. '+E+'tarif tabel 4% dengan isian 50 menjadi 2%.',
 gfd:'Tanggal terakhir keringanan XTRA toko baru berlaku, setelahnya otomatis tarif penuh. '+E+'isi 31 Des 2026 berarti 1 Jan 2027 tarif kembali 100%.',
 gai:'Pilih Ya bila biaya iklan bersih toko minimal 4% dari penjualan 30 hari terakhir agar tarif XTRA turun. '+E+'penjualan Rp10.000.000 dan iklan Rp400.000 = 4%, memenuhi syarat.',
 gad:'Potongan tarif XTRA (poin persen) karena iklan, hanya untuk tarif lama sebelum 1 Des 2026. '+E+'tarif 4% dengan potongan 1 poin menjadi 3%.',
 cg:'Batas Rp biaya Gratis Ongkir XTRA biasa per kuantitas. '+E+'batas Rp40.000 membuat biaya paling besar Rp40.000, walau 4% dari Rp2.000.000 = Rp80.000.',
 cgk:'Batas Rp biaya Gratis Ongkir XTRA ukuran khusus per kuantitas. '+E+'batas Rp60.000 membatasi biaya walau 6% dari Rp2.000.000 = Rp120.000.',
 pp:'Program Promo XTRA yang diikuti toko, atau isi manual untuk tarif sendiri. '+E+'program 3% memotong Rp3.000 dari Rp100.000.',
 px:'Persen Promo XTRA dari harga setelah voucher. '+E+'3% dari Rp100.000 = Rp3.000.',
 cp:'Batas Rp biaya Promo XTRA per kuantitas. '+E+'batas Rp60.000 membuat biaya tidak pernah lebih dari Rp60.000 per pcs dalam paket.',
 vp:'Program Video XTRA; tidak ikut berarti 0%. '+E+'otomatis 3% memotong Rp3.000 dari Rp100.000.',
 vx:'Persen Video XTRA dari harga setelah voucher. '+E+'3% dari Rp100.000 = Rp3.000.',
 cvx:'Batas Rp biaya Video XTRA per kuantitas. '+E+'batas Rp20.000 membuat 3% dari Rp1.000.000 tetap Rp20.000, bukan Rp30.000.',
 lp:'Program Live XTRA; tidak ikut berarti 0%. '+E+'otomatis 3% memotong Rp3.000 dari Rp100.000.',
 lv:'Persen Live XTRA dari harga setelah voucher. '+E+'3% dari Rp100.000 = Rp3.000.',
 clv:'Batas Rp biaya Live XTRA per kuantitas. '+E+'batas Rp20.000 membuat 3% dari Rp1.000.000 tetap Rp20.000, bukan Rp30.000.',
 ads:'Persen harga jual yang disisihkan untuk iklan (target ACOS). '+E+'5% dari Rp100.000 = Rp5.000 dianggap biaya.',
 rt:'Dana cadangan persen untuk risiko retur dan batal. '+E+'1% dari Rp100.000 = Rp1.000 dianggap biaya tiap penjualan.',
 pm:'Premi bawaan: potongan persen yang hanya dikenakan pada sebagian produk. '+E+'0,5% dari Rp100.000 = Rp500.',
 pj:'PPh 22 dipotong persen dari harga setelah voucher; isi 0 bila bebas dengan surat pernyataan. '+E+'0,5% dari Rp100.000 = Rp500.',
 og:'Ongkir yang ditanggung penjual per pesanan, mengurangi saldo masuk. '+E+'isi 5000 membuat saldo Rp90.000 menjadi Rp85.000.',
 skh:'Stok sampai angka ini ditandai merah (hampir habis); stok 0 ditandai habis. '+E+'isi 5 berarti stok 1 sampai 5 berwarna merah.',
 sl:'Stok di atas batas hampir habis sampai angka ini ditandai kuning (menipis). '+E+'hampir habis 5 dan menipis 10 berarti stok 6 sampai 10 kuning.',
 sdy:'Setiap berapa hari aplikasi mengingatkan Anda mengecek ulang stok. '+E+'isi 7 berarti diingatkan seminggu setelah stok terakhir dicek.',
 wu:'Untung bersih per pesanan di bawah angka ini memunculkan peringatan kuning. '+E+'isi 2000 dan untung Rp1.500 memunculkan peringatan.',
 wm:'Margin adalah untung dibagi harga setelah voucher; di bawah batas ini muncul peringatan. '+E+'untung Rp1.000 dari Rp100.000 = 1%.',
 wp:'Batas total potongan (biaya Shopee + premi + PPh) dalam persen dari harga. '+E+'potongan Rp32.000 dari Rp100.000 = 32% melewati batas 30%.',
 rd:'Harga listing dibulatkan ke atas ke kelipatan angka ini. '+E+'isi 1000 mengubah Rp104.300 menjadi Rp105.000.',
 re:'Harga listing dinaikkan sampai berakhir dengan angka pilihan. '+E+'akhiran 900 mengubah Rp104.300 menjadi Rp104.900.',
 vm:'Voucher toko ditanggung penjual dan mengurangi harga yang dibayar pembeli. '+E+'voucher 5% memotong harga Rp100.000 menjadi Rp95.000.',
 vv:'Nilai voucher sesuai jenisnya, persen atau Rp. '+E+'isi 5 untuk 5% atau 5000 untuk Rp5.000.',
 vc:'Batas Rp potongan voucher persen; 0 berarti tanpa batas. '+E+'voucher 10% dengan batas Rp5.000 memotong Rp5.000, bukan Rp10.000 dari Rp100.000.',
 pa:'Promo Toko mengaktifkan diskon coret; nonaktif berarti harga awal sama dengan harga diskon. '+E+'diskon 20% menampilkan Rp100.000 dicoret jadi Rp80.000.',
 dm:'Pilih satuan diskon coret: persen atau Rp dari harga listing awal. '+E+'persen 20 atau nominal Rp20.000 dari harga awal Rp100.000.',
 dv:'Besar diskon coret sesuai satuan yang dipilih. '+E+'20% dari harga awal Rp100.000 menjadi harga jual Rp80.000.',
 tchk:'Tanggal terakhir tarif aplikasi dicocokkan dengan pesanan nyata. '+E+'dicek 1 Nov 2026 dan pengingat 30 hari berarti diingatkan 1 Des 2026.',
 tcd:'Setiap berapa hari aplikasi mengingatkan cek tarif. '+E+'isi 30 berarti peringatan muncul sebulan setelah pengecekan terakhir.'
};
export const BY_TEXT={
 'Modal / HPP per pcs':'Harga beli satu pcs barang (HPP), belum termasuk biaya lain. '+E+'Rp20.000 per pcs dengan isi paket 3 berarti modal Rp60.000.',
 'Biaya tambahan per pesanan (opsional)':'Biaya lain di luar modal dan packing yang keluar sekali tiap produk ini terjual, tidak dikali isi paket. '+E+'modal Rp10.000 x isi 3 + tambahan Rp1.000 + packing Rp500 = total modal Rp31.500.',
 'Biaya packing':'Biaya bungkus (kardus, lakban, plastik) satu pesanan, dihitung sekali. '+E+'modal Rp10.000 + packing Rp1.500 = total modal Rp11.500.',
 'Target untung':'Untung bersih per pesanan yang Anda inginkan, dipakai untuk mencari harga listing. '+E+'target Rp5.000 berarti harga dicari agar sisa bersih minimal Rp5.000 setelah semua biaya.',
 'Isi paket (pcs)':'Jumlah pcs dalam satu listing (bundle), mengalikan modal per pcs. '+E+'isi 3 dengan modal Rp10.000 per pcs menjadi modal barang Rp30.000.',
 'Stok di Shopee (pcs)':'Stok yang tercatat di Shopee, dipakai untuk penanda stok menipis. '+E+'stok 4 dengan batas hampir habis 5 ditandai merah.',
 'Admin manual (%)':'Persen administrasi yang Anda isi sendiri untuk produk ini, menggantikan kategori. '+E+'6,5% dari Rp100.000 = Rp6.500.',
 'XTRA manual (% penuh)':'Persen Gratis Ongkir XTRA penuh yang diisi sendiri, sebelum keringanan toko baru. '+E+'4% dari Rp100.000 = Rp4.000, tidak lebih dari batas Rp.',
 'Premi (%)':'Potongan persen tambahan yang hanya dikenakan pada sebagian produk. '+E+'0,5% dari Rp100.000 = Rp500.',
 'Biaya iklan (%)':'Persen harga jual yang disisihkan untuk iklan (target ACOS). '+E+'5% dari Rp100.000 = Rp5.000.',
 'Cadangan retur (%)':'Dana cadangan persen untuk risiko retur dan batal. '+E+'1% dari Rp100.000 = Rp1.000 dianggap biaya.',
 'Promo XTRA (%)':'Persen Promo XTRA dari harga setelah voucher. '+E+'3% dari Rp100.000 = Rp3.000, tidak lebih dari batas Rp.',
 'Video XTRA (%)':'Persen Video XTRA dari harga setelah voucher. '+E+'3% dari Rp100.000 = Rp3.000, tidak lebih dari batas Rp.',
 'Live XTRA (%)':'Persen Live XTRA dari harga setelah voucher. '+E+'3% dari Rp100.000 = Rp3.000, tidak lebih dari batas Rp.',
 'Diskon coret (%)':'Persen potongan harga coret dari harga listing awal. '+E+'20% membuat harga awal Rp100.000 tampil jadi Rp80.000.',
 'Diskon coret (Rp)':'Nominal potongan harga coret dari harga listing awal. '+E+'Rp20.000 membuat harga awal Rp100.000 tampil jadi Rp80.000.',
 'Kategori admin':'Kategori resmi Shopee produk ini yang menentukan persen administrasi; Bawaan = ikut Setelan. '+E+'kategori bertarif 8% memotong Rp8.000 dari Rp100.000.',
 'XTRA sekarang':'Kategori tarif Gratis Ongkir XTRA produk ini untuk saat ini. '+E+'kategori bertarif 4% memotong Rp4.000 dari Rp100.000.',
 'XTRA mulai 1 Des 2026':'Kategori tarif Gratis Ongkir XTRA produk ini setelah tarif baru 1 Des 2026. '+E+'bila tarif naik dari 4% ke 5%, biaya naik dari Rp4.000 ke Rp5.000 per Rp100.000.',
 'Ukuran produk':'Ukuran Biasa atau Khusus menentukan tarif dan batas XTRA produk ini. '+E+'batas bawaan Biasa Rp40.000 dan Khusus Rp60.000.',
 'Harga awal di Shopee':'Harga coret yang tampil sekarang di Shopee, hanya diisi bila produk sudah tayang. '+E+'Rp100.000.',
 'Harga diskon di Shopee / harga coba':'Harga jual setelah diskon di Shopee, atau harga yang ingin Anda coba. '+E+'harga coba Rp80.000 untuk melihat untungnya.',
 'Harga jual yang ingin dicek':'Harga diskon coret (mis. harga pesaing) untuk dihitung balik untung dan marginnya. '+E+'pesaing menjual Rp80.000, aplikasi menunjukkan sisa untungnya.',
 'Batas beli':'Jumlah pcs maksimal yang boleh dibeli pembeli dengan harga promo. '+E+'isi 2 berarti pembelian ke-3 memakai harga normal.',
 'Saldo masuk toko':'Uang yang masuk ke saldo toko setelah semua potongan, sebelum dikurangi modal. '+E+'harga Rp100.000 dikurangi potongan Rp15.000 = Rp85.000.',
 'Total Biaya Shopee':'Jumlah biaya administrasi, XTRA, pembayaran, dan proses pesanan. '+E+'Rp6.500 + Rp4.000 + Rp1.800 = Rp12.300.',
 'Premi + PPh 22':'Gabungan potongan premi dan PPh 22. '+E+'premi Rp500 + PPh 22 Rp500 = Rp1.000.',
 'Premi':'Potongan persen tambahan pada sebagian produk. '+E+'0,5% dari Rp100.000 = Rp500.',
 'PPh 22':'Pajak yang dipotong persen dari harga setelah voucher. '+E+'0,5% dari Rp100.000 = Rp500.',
 'Biaya iklan':'Dana iklan yang dianggap biaya tiap penjualan. '+E+'5% dari Rp100.000 = Rp5.000.',
 'Cadangan retur':'Dana yang disisihkan untuk risiko retur dan batal. '+E+'1% dari Rp100.000 = Rp1.000.',
 'Ongkir ditanggung':'Ongkir yang ditanggung penjual per pesanan. '+E+'Rp5.000 mengurangi saldo masuk sebesar Rp5.000.',
 'Modal + biaya tambahan + packing':'Total modal satu penjualan: modal x isi paket + biaya tambahan + packing. '+E+'Rp10.000 x 3 + Rp1.000 + Rp500 = Rp31.500.',
 'Untung bersih':'Sisa uang setelah saldo masuk dikurangi total modal. '+E+'saldo Rp85.000 dikurangi modal Rp31.500 = Rp53.500.',
 'Rugi bersih':'Kekurangan uang bila saldo masuk lebih kecil dari total modal. '+E+'saldo Rp28.000 dengan modal Rp31.500 = rugi Rp3.500.',
 'Margin (dari harga jual)':'Untung bersih dibagi harga setelah voucher dalam persen. '+E+'untung Rp15.000 dari harga Rp100.000 = 15%.',
 'Harga impas (harga diskon coret)':'Harga jual terendah yang masih untung nol, di bawahnya rugi. '+E+'impas Rp40.000 berarti harga Rp39.000 sudah rugi.',
 'Selisih dari harga impas':'Seberapa jauh harga yang dicek dari harga impas. '+E+'harga Rp50.000 dan impas Rp40.000 = Rp10.000 di atas.',
 'Harga setelah voucher':'Harga jual dikurangi voucher toko; dasar hitungan persen biaya. '+E+'Rp100.000 dengan voucher Rp5.000 menjadi Rp95.000.',
 'Harga listing awal':'Harga coret yang dipasang di listing Shopee sebelum diskon. '+E+'harga jual Rp80.000 dengan diskon coret 20% berarti listing Rp100.000.',
 'Harga diskon coret':'Harga jual setelah diskon coret, yang dibayar pembeli sebelum voucher. '+E+'listing Rp100.000 diskon 20% = Rp80.000.'
};
const POT=/\s*\((?:[\d.,]+%|Rp[\d.,]+|kena batas)\)\s*$/;
export function normal(t){return String(t==null?'':t).replace(/\s+/g,' ').trim()}
/* Teks label = hanya simpul teks langsung (tanpa small, tombol ikon, dan angka <b>). Awalan persen di akhir (mis. "Biaya iklan (5%)") dibuang. */
export function teksIstilah(el){let s='';for(const n of el.childNodes)if(n.nodeType===3)s+=n.nodeValue;return normal(s).replace(POT,'')}
export function penjelasan(el){
 if(el.tagName==='LABEL'){const f=el.getAttribute('for');if(f&&BY_ID[f])return BY_ID[f]}
 const t=teksIstilah(el);return BY_TEXT[t]||(t.indexOf(' - Promo Toko nonaktif')>0?BY_TEXT[t.split(' - ')[0]]:null)||null}
const SEL='label,.rw,.pf>span,.big>div>span';
function pasangSatu(el){
 if(el.nodeType!==1||el.querySelector(':scope>.ib'))return;
 const t=penjelasan(el);if(!t)return;
 const b=el.ownerDocument.createElement('button');b.type='button';b.className='ib';b.setAttribute('aria-label','Penjelasan: '+teksIstilah(el));b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','tipb');b.dataset.tip=t;
 /* sebelum <small>/<b> pertama agar teks tetap berurutan: label+ikon+penjelasan kecil, atau teks+ikon+angka */
 let ref=null;for(const n of el.childNodes)if(n.nodeType===1){ref=n;break}
 el.insertBefore(b,ref);
}
export function pasangTips(root){
 const doc=(root&&root.ownerDocument)||document;root=root||doc.body;
 if(root.nodeType===1&&root.matches&&root.matches(SEL))pasangSatu(root);
 if(root.querySelectorAll)root.querySelectorAll(SEL).forEach(pasangSatu);
 if(!pasangTips.siap&&doc.defaultView){pasangTips.siap=true;siapkan(doc)}
}
function siapkan(doc){
 const w=doc.defaultView;let pop=null,aktif=null;
 const tutup=()=>{if(pop)pop.hidden=true;if(aktif){aktif.setAttribute('aria-expanded','false');aktif=null}};
 const buka=b=>{
  if(!pop){pop=doc.createElement('div');pop.id='tipb';pop.setAttribute('role','note');pop.hidden=true;doc.body.appendChild(pop)}
  pop.textContent=b.dataset.tip;pop.hidden=false;aktif=b;b.setAttribute('aria-expanded','true');
  const r=b.getBoundingClientRect(),pw=pop.offsetWidth,ph=pop.offsetHeight,W=w.innerWidth,H=w.innerHeight;
  let x=Math.min(Math.max(8,r.left+r.width/2-pw/2),W-pw-8),y=r.bottom+6;if(y+ph>H-8&&r.top-ph-6>8)y=r.top-ph-6;
  pop.style.left=x+'px';pop.style.top=y+'px'};
 doc.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('button.ib');
  if(!b){if(pop&&!pop.hidden&&!pop.contains(e.target))tutup();return}
  e.preventDefault();e.stopPropagation();
  if(aktif===b){tutup();return}tutup();buka(b)},true);
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')tutup()});
 w.addEventListener('scroll',tutup,true);w.addEventListener('resize',tutup);
 /* Kartu/rincian dibuat ulang lewat innerHTML tiap hitung: pasang ikon untuk simpul baru saja (bukan seluruh dokumen). */
 new w.MutationObserver(recs=>{for(const r of recs){
  if(r.target.nodeType===1&&r.target.matches&&r.target.matches(SEL))pasangSatu(r.target);
  for(const n of r.addedNodes)if(n.nodeType===1&&!(n.classList&&n.classList.contains('ib'))&&n.id!=='tipb')pasangTips(n)}}).observe(doc.body,{childList:true,subtree:true});
}
