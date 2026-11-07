/* Pembaca/pemformat angka Indonesia dan tanggal lokal. Fungsi murni, tanpa state aplikasi dan tanpa global tersembunyi. Dipindahkan apa adanya dari js/legacy/00-core.js (tahap 4a). */
/* v9.49: satu pemformat Intl dipakai ulang (toLocaleString membuat pemformat baru tiap panggilan; teks hasil identik). */
const NF_ID=new Intl.NumberFormat('id-ID');
export const rp=function(n){return 'Rp '+NF_ID.format(Math.round(n))};
/*v5.14: pf() = pembaca angka desimal format Indonesia untuk kolom pengaturan/tarif (titik = ribuan, koma = desimal; "1,234.56" juga dikenali). pct=true: titik/koma selalu desimal (persentase).*/
export function pf(s,pct){s=String(s).trim().replace(/^rp\.?\s*/i,'').replace(/[^\d.,]/g,'');if(!/\d/.test(s))return NaN;
 var dt=(s.match(/\./g)||[]).length,cm=(s.match(/,/g)||[]).length;
 if(dt&&cm){var dc=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.',th=dc==','?'.':',';s=s.split(th).join('').replace(dc,'.')}
 else if(cm){if(!pct&&(cm>1||/^\d{1,3},\d{3}$/.test(s)))s=s.replace(/,/g,'');else s=s.replace(/,/g,'.')}
 else if(dt&&!pct&&(dt>1||/^[1-9]\d{0,2}\.\d{3}$/.test(s)))s=s.replace(/\./g,'');
 return Number(s)}
/*v5.14: num() = bilangan bulat Rupiah. Aturan titik TETAP seperti sebelumnya (kolom diformat ulang saat mengetik, titik = ribuan); yang berubah: koma desimal (mis. "12.500,75") kini dibulatkan, bukan dibuang.*/
export const num=function(s){s=String(s).trim().replace(/^rp\.?\s*/i,'').replace(/\s/g,'');var up=0;if(/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s))s=s.replace(/,/g,'').split('.')[0];else{if(/^\d+\.\d{1,2}$/.test(s))s=s.split('.')[0];var pp=s.split(',');s=pp[0];if(pp.length>1&&/^[5-9]/.test(pp[1]))up=1}return Math.min((parseInt(s.replace(/\D/g,''),10)||0)+up,999999999999)};
export const fmt=function(v){return String(v).replace('.',',')};
export const PCT=['gad','ads','rt','pb','ad','gm','gf','px','vx','lv','wm','wp','pm','pj'];
export function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
