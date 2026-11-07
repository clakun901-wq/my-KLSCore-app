/* Helper murni Kalsara (v9.29, tahap 6b): esc, dtx, uid, prodSig, tabel label SGL, dan pembuat feeSig. Dipindah APA ADANYA dari js/legacy/20-hitung-etalase.js.
 * Satu-satunya perubahan teks: feeSig tidak lagi membaca variabel legacy `A` dan fungsi `gfac` sebagai global; keduanya disuntikkan (getA, gfac),
 * dan A dibaca ulang di dalam feeSig() karena kode legacy menugaskan ulang A saat restore. esc/dtx/prodSig murni; uid memakai Date.now() dan Math.random().
 * Dipakai bagian legacy lain serta js/penjualan.js dan js/voucher-panel.js lewat nama yang sama. */
export function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
export function dtx(d){var p=String(d).split('-');return(+p[2])+' '+['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][p[1]-1]}
export function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
export function prodSig(R){return JSON.stringify([R.ad,R.gx,R.px,R.vx,R.lv,R.pm,R.cg,R.cp,R.cvx,R.clv,R.cpb])}
export var SGL={tp:'Tipe toko',fb:'Biaya proses pesanan',fl:'Nominal biaya proses',pb:'Biaya pembayaran (%)',pbc:'Batas biaya pembayaran',ad:'Admin manual (%)',ac:'Kategori administrasi',gc:'Kategori Gratis Ongkir XTRA',sz:'Ukuran Gratis Ongkir XTRA',gf:'Tarif Gratis Ongkir XTRA toko baru',gad:'Potongan tarif karena iklan',gm:'Gratis Ongkir XTRA manual (%)',px:'Promo XTRA (%)',vx:'Video XTRA (%)',lv:'Live XTRA (%)',pm:'Premi (%)',cg:'Batas Gratis Ongkir XTRA biasa',cgk:'Batas Gratis Ongkir XTRA khusus',cp:'Batas Promo XTRA',cvx:'Batas Video XTRA',clv:'Batas Live XTRA',tbl:'Tabel tarif'};
export function createFeeSig({getA,gfac}){
function feeSig(){var A=getA();var s={};Object.keys(SGL).forEach(function(k){s[k]=JSON.stringify(k=='gf'?gfac():(A[k]===undefined?null:A[k]))});return s}
return feeSig;
}
