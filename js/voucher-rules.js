/* Aturan voucher Kalsara (v9.25, tahap 5a): pemilihan voucher otomatis, potongan, jadwal, dan ambang belanja.
 * Dipindah apa adanya dari js/legacy/50-promosi.js menjadi factory dengan dependensi eksplisit.
 * Inilah tempat yang diubah bila aturan voucher Shopee berubah; kodenya murni (tanpa DOM, tanpa global, tanpa penyimpanan).
 * - getPRM(): daftar promosi SEGAR tiap dipanggil (PRM diganti utuh saat restore).
 * - today(): tanggal "YYYY-MM-DD" (disuntikkan agar tes bisa membekukan waktu).
 * - pr(persen, nominal), fmt(angka), rp(rupiah): pembantu angka/teks dari legacy.
 * reset(): kosongkan cache voucher berjalan (pengganti penulisan langsung `VCC=null` di legacy). */
export function createVoucherRules({getPRM,today,pr,fmt,rp}){
var VCC=null;
function PRMnow(){return getPRM()}
function vdisc(p,L){if(p.u=='cb')return 0;if(p.u=='pct'){var v=pr(p.a,L);return p.cp>0?Math.min(v,Math.round(p.cp)):v}return Math.min(Math.round(p.a),L)}
function cbc(p,L){var v=pr(p.a,L);return p.cp>0?Math.min(v,Math.round(p.cp)):v}
function dd(a,b){return Math.round((new Date(b+'T00:00')-new Date(a+'T00:00'))/864e5)}
function pst(p){var t=today();if(!p.s&&!p.e)return{k:'a',t:'Berjalan (tanpa jadwal)'};
 if(p.e&&t>p.e)return{k:'e',t:'Berakhir'};
 if(p.s&&t<p.s){var d=dd(t,p.s);return{k:'u',t:d==1?'Mulai besok':'Mulai '+d+' hari lagi'}}
 var d2=p.e?dd(t,p.e):null;return{k:'a',t:d2===null?'Berjalan':d2===0?'Berakhir hari ini':'Berjalan, sisa '+d2+' hari'}}
function vcList(){var d=today();if(!VCC||VCC.d!==d){VCC={d:d,a:[]};PRMnow().forEach(function(q){if(!q||q.t!='vc')return;var jt=q.jt||'toko';if(jt=='live'||jt=='video'||q.u=='cb'||!(q.a>0))return;if(pst(q).k!='a')return;if(q.x>0&&(q.y||0)>=q.x)return;VCC.a.push(q)})}return VCC.a}
function vcApply(q,r){if((q.jt||'toko')=='toko')return true;return !!(r&&r.id)&&[q.p,q.p2,q.p3].indexOf(r.id)>=0}
function vcLab(q){return((q.jt||'toko')=='produk'?'Voucher Produk ':'Voucher Toko ')+(q.u=='pct'?fmt(q.a)+'%':rp(q.a))+(q.n?' ('+q.n+')':'')}
function vcBest(L,r){var b=null;vcList().forEach(function(q){if(!vcApply(q,r))return;if(q.b>0&&L<q.b)return;var d=vdisc(q,L);if(d>0&&(!b||d>b.v))b={v:d,s:vcLab(q),q:q}});return b}
function vcBad(r){return vcList().some(function(q){return vcApply(q,r)&&q.u=='pct'&&q.a>=100})}
function vcThr(r){var t=[];vcList().forEach(function(q){if(vcApply(q,r)&&q.b>0&&t.indexOf(q.b)<0)t.push(q.b)});return t.sort(function(x,y){return x-y})}
function reset(){VCC=null}
return {vdisc:vdisc,cbc:cbc,dd:dd,pst:pst,vcList:vcList,vcApply:vcApply,vcLab:vcLab,vcBest:vcBest,vcBad:vcBad,vcThr:vcThr,reset:reset};
}
