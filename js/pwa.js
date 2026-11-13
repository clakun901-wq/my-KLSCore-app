export function createPWA({ $, toast, lflush, APPV }) {

/*5.71: filter Hitung memakai tanda live yang sama dengan kartu atas (Sudah live, Belum live); kartu Total produk, Sudah live, Belum live bisa diketuk untuk menyaring daftar. Produk baru diberi keterangan (harga Shopee kosong). Hanya tampilan dan penyaringan; rumus tidak berubah.*/
/*5.70: panel Tarif produk ini dirapikan: tiga bagian (kategori resmi, persen manual, biaya lain), label diperjelas, ringkasan Dipakai sekarang. Hanya tampilan; data-o dan rumus tidak berubah.*/
/*5.69: tarif Gratis Ongkir XTRA resmi mulai 1 Des 2026: tabel GO2 (A sampai H), batas Rp60.000 biasa dan Rp80.000 khusus, kategori per produk 'g2' (huruf mulai 1 Des), impor kolom XTRA menerima huruf A sampai H atau pasangan G/H (sekarang/1 Des).*/
/*5.68: perbaikan: tab Hitung kini dihitung ulang saat dibuka bila isi Promosi atau tanggal berubah (sebelumnya baru terbaca setelah refresh).*/
/*5.67: perbaikan: id kartu Total produk diganti tp1 sampai tp3 karena bentrok dengan id tombol menu t1 sampai t3.*/
/*5.66: kartu Total produk, Sudah live, Belum live di tab Hitung.*/
/*5.64: dapat dipasang ke layar utama, jalan tanpa internet, dan tombol muat versi terbaru. APPV kini dari js/version.js (satu sumber, sama dengan nama cache sw.js).*/
var dip=null,swReg=null,swHad=false;
function swOK(){return !!(navigator.serviceWorker&&navigator.serviceWorker.controller)}
function isSA(){try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}}
function pwSt(){var t='Versi '+APPV+'. ';
 t+=swOK()?'Siap dipakai tanpa internet. ':(location.protocol=='file:'?'Mode offline aktif setelah aplikasi dibuka dari alamat https (GitHub). ':'Mode offline belum aktif, buka lagi saat ada internet. ');
 t+=isSA()?'Terpasang di layar utama.':'Belum dipasang di layar utama.';
 $('pws').textContent=t;if(isSA())$('pwi').hidden=true}
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
 swHad=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',function(){if(swHad)$('nvb').hidden=false;swHad=true;pwSt()});
 navigator.serviceWorker.register('sw.js').then(function(r){swReg=r;pwSt()},function(){pwSt()});
 document.addEventListener('visibilitychange',function(){if(!document.hidden&&swReg)swReg.update().catch(function(){})})}
$('nvg').onclick=function(){try{lflush()}catch(e){}location.reload()};
$('pwu').onclick=function(){if(!swReg){toast('Pembaruan hanya bisa dicek dari alamat https (GitHub)');return}
 toast('Memeriksa pembaruan...');
 swReg.update().then(function(){setTimeout(function(){if($('nvb').hidden)toast('Sudah versi terbaru ('+APPV+')')},1500)},function(){toast('Tidak bisa memeriksa. Cek koneksi internet')})};
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dip=e;if(!isSA())$('pwi').hidden=false});
window.addEventListener('appinstalled',function(){dip=null;$('pwi').hidden=true;pwSt();toast('Wulfeg terpasang')});
$('pwi').onclick=function(){if(!dip)return;dip.prompt();dip.userChoice.then(function(){dip=null;$('pwi').hidden=true},function(){})};
pwSt();

}
