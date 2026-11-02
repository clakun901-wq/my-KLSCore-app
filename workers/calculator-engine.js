/* Worker-isolated calculator copied from the compatibility business logic. Keep behavior aligned with js/legacy-app.js and guard with golden-master tests. */
import * as Money from '../js/money.js';
globalThis.KalsaraMoney = Money;
/* Compatibility module preserving the original Kalsara v5.82 business logic. */
var DEF={tp:'ns',fb:'no',fl:1250,pb:0,pbc:50000,ad:6.5,ac:'F',gc:'D',sz:'b',gf:100,gfd:'',gad:0,re:0,pp:'no',cgk:60000,cvx:20000,clv:20000,px:0,vx:0,lv:0,vp:'no',lp:'no',gm:0,wu:2000,wm:1,wp:30,cg:40000,cp:60000,pa:'yes',dm:'pct',dv:30,vm:'none',vv:0,vc:0,pm:0.5,pj:0.5,og:0,rd:100,ads:0,rt:0,sl:10,sh:5,sdy:7,tbl:null,tchk:'',tcd:30};
var A=Object.assign({},DEF),rows=[],TS=0,OK=['ad','gx','px','vx','lv','dv'];
var $=function(i){return null};
var rp=function(n){return 'Rp '+Math.round(n).toLocaleString('id-ID')};
/*v5.14: pf() = pembaca angka desimal format Indonesia untuk kolom pengaturan/tarif (titik = ribuan, koma = desimal; "1,234.56" juga dikenali). pct=true: titik/koma selalu desimal (persentase).*/
function pf(s,pct){s=String(s).trim().replace(/^rp\.?\s*/i,'').replace(/[^\d.,]/g,'');if(!/\d/.test(s))return NaN;
 var dt=(s.match(/\./g)||[]).length,cm=(s.match(/,/g)||[]).length;
 if(dt&&cm){var dc=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.',th=dc==','?'.':',';s=s.split(th).join('').replace(dc,'.')}
 else if(cm){if(!pct&&(cm>1||/^\d{1,3},\d{3}$/.test(s)))s=s.replace(/,/g,'');else s=s.replace(/,/g,'.')}
 else if(dt&&!pct&&(dt>1||/^[1-9]\d{0,2}\.\d{3}$/.test(s)))s=s.replace(/\./g,'');
 return Number(s)}
/*v5.14: num() = bilangan bulat Rupiah. Aturan titik TETAP seperti sebelumnya (kolom diformat ulang saat mengetik, titik = ribuan); yang berubah: koma desimal (mis. "12.500,75") kini dibulatkan, bukan dibuang.*/
var num=function(s){s=String(s).trim().replace(/^rp\.?\s*/i,'').replace(/\s/g,'');var up=0;if(/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s))s=s.replace(/,/g,'').split('.')[0];else{if(/^\d+\.\d{1,2}$/.test(s))s=s.split('.')[0];var pp=s.split(',');s=pp[0];if(pp.length>1&&/^[5-9]/.test(pp[1]))up=1}return Math.min((parseInt(s.replace(/\D/g,''),10)||0)+up,999999999999)};
var fmt=function(v){return String(v).replace('.',',')};
var pr=function(r,P){return globalThis.KalsaraMoney.percentOfRupiah(P,r)};
var PCT=['gad','ads','rt','pb','ad','gm','gf','px','vx','lv','wm','wp','pm','pj'];
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
/*CALC*/
var GO={A:[1,2.5],B:[2,3.5],C:[3.5,5],D:[5.5,7],E:[6,7.5],F:[6.5,8],G:[7.5,9],H:[8,9.5]};
var GO2={A:[1.5,3.5],B:[5,7],C:[6.5,8.5],D:[8.5,10.5],E:[9,11],F:[9.5,11.5],G:[10.5,12],H:[11,13]},GO2D='2026-12-01';
function gcOf(r){var o=r.o||{};if(today()>=GO2D&&o.g2)return o.g2;return o.gc||A.gc}
function goT(c){if(today()>=GO2D&&!(A.tbl&&A.tbl.GO&&A.tbl.GO[c])&&GO2[c])return GO2[c];return GO[c]}
function capG(sk){if(today()>=GO2D&&(sk?A.cgk===60000:A.cg===40000))return sk?80000:60000;return sk?A.cgk:A.cg}
function gfac(){if(A.gfd&&today()>A.gfd)return 100;return A.gf}
function goRate(r){var ov=r.o&&r.o.gx;if(ov!==null&&ov!==undefined)return Math.round(ov*gfac()*100)/10000;var c=gcOf(r),s=(r.o&&r.o.sz)||A.sz;if(c=='man')return Math.round(A.gm*gfac()*100)/10000;var t=goT(c);return t?Math.max(Math.round((Math.round(t[s=='k'?1:0]*gfac()*100)/10000-(A.gad||0))*10000)/10000,0):0}
var AD={A:[10,11.7],B:[9.5,10.45],C:[9,10.2],D:[8.25,9.95],E:[6.75,7.7],F:[6.5,7.2],G:[5.25,6.2],H:[4.25,4.7],I:[2.5,2.5]};
function adRate(r){if(r.o&&r.o.ad!==null&&r.o.ad!==undefined)return r.o.ad;var t=AD[(r.o&&r.o.ac)||A.ac];return t?t[A.tp=='ml'?1:0]:A.ad}
function rate(r,k){var v=r.o&&r.o[k];return(v===null||v===undefined)?A[k]:v}
/*5.39: voucher otomatis. Voucher manual (panel) dan voucher berjalan di kartu Promosi bersaing; yang potongannya terbesar (harga pembeli paling rendah) dipakai.*/
var VNO=0;
function vbest(L,r){
 if(VNO)return{v:0,s:'',q:null};
 var m=0;
 if(A.vm=='pct')m=Math.min(pr(A.vv,L),A.vc>0?A.vc:1e12);
 else if(A.vm=='nom')m=Math.min(Math.round(A.vv),L);
 var b={v:m,s:m>0?'Voucher toko manual':'',q:null};
 if(typeof vcBest==='function'){var x=vcBest(L,r);if(x&&x.v>b.v)b=x}
 return b}
function volt(L,r){return vbest(L,r).v}
function fees(P,R){
 var b={fx:A.fb=='yes'?A.fl:0,ad:pr(R.ad,P),gx:Math.min(pr(R.gx,P),R.cg),px:Math.min(pr(R.px,P),R.cp),vx:Math.min(pr(R.vx,P),R.cvx),lv:Math.min(pr(R.lv,P),R.clv),pay:Math.min(pr(A.pb,P),R.cpb)};
 var f=globalThis.KalsaraMoney.safeMoneySum([b.fx,b.ad,b.gx,b.px,b.vx,b.lv,b.pay]);
 return{sh:f,b:b,pm:pr(R.pm,P),tax:pr(A.pj,P),ads:pr(R.ads,P),rt:pr(R.rt,P)}}
function tmod(r){var q=r.q>0?r.q:1;return globalThis.KalsaraMoney.safeMoneySum([globalThis.KalsaraMoney.multiplyRupiah(r.m,q),r.d,r.p])}
function fwdL(L,r,R){
 var vb=vbest(L,r),v=vb.v,P=globalThis.KalsaraMoney.safeMoneySum([L,-v]),f=fees(P,R),s=globalThis.KalsaraMoney.safeMoneySum([P,-f.sh,-f.pm,-f.tax,-f.ads,-f.rt,-A.og]);
 return{L:L,v:v,vs:vb.s,vq:vb.q,P:P,sh:f.sh,b:f.b,pm:f.pm,tax:f.tax,ads:f.ads,rt:f.rt,s:s,u:globalThis.KalsaraMoney.safeMoneySum([s,-tmod(r)])}}
function fwd(M,r,R){
 var L=R.dm=='nom'?globalThis.KalsaraMoney.safeMoneySum([M,-Math.round(R.dv)]):globalThis.KalsaraMoney.discountedPrice(M,R.dv);L=Math.max(L,0);
 var o=fwdL(L,r,R);o.M=M;return o}
/*5.40: harga impas konservatif. Bila ada voucher dengan min. belanja, untung bisa turun mendadak saat voucher mulai berlaku, jadi impas = harga terendah yang aman untuk semua harga di atasnya (dicek per segmen antar batas min. belanja).*/
function impas(r,R){
 var okL=function(L){for(var k=0;k<=5;k++)if(fwdL(L+k,r,R).u<0)return false;return true};
 var th=typeof vcThr==='function'?vcThr(r):[];
 if(!th.length){
  var hi=1;while(!okL(hi)){hi*=2;if(hi>1e9)return null}
  var lo=0;while(hi-lo>1){var mid=Math.floor((lo+hi)/2);if(okL(mid))hi=mid;else lo=mid}
  while(hi>1&&okL(hi-1))hi--;
  return hi}
 var seg=[0].concat(th),n=seg.length,Lc=null;
 var fo=function(a0,h0){var h;if(h0===Infinity){h=Math.max(a0,1);while(!okL(h)){h*=2;if(h>1e9)return null}}else{if(!okL(h0-1))return h0;h=h0-1}
  var a=a0,b=h;while(a<b){var m=Math.floor((a+b)/2);if(okL(m))b=m;else a=m+1}return a};
 for(var i=n-1;i>=0;i--){var sl=seg[i],sh=i==n-1?Infinity:seg[i+1],mm=fo(sl,sh);if(mm===null)return null;
  if(i==n-1)Lc=mm;else if(mm<sh)Lc=mm;else break;
  if(mm>sl)break}
 return Math.max(Lc,1)}
function calc(r){
 if(!(r.m>0))return null;
 var Q=r.q>0?r.q:1,sk=((r.o&&r.o.sz)||A.sz)=='k',R={ad:adRate(r),gx:goRate(r),cg:capG(sk)*Q,cp:A.cp*Q,cvx:A.cvx*Q,clv:A.clv*Q,cpb:A.pbc*Q,px:rate(r,'px'),vx:rate(r,'vx'),lv:rate(r,'lv'),pm:rate(r,'pm'),ads:rate(r,'ads'),rt:rate(r,'rt'),dv:(A.pa=='no'&&!(r.o&&r.o.dv!==null&&r.o.dv!==undefined)?0:rate(r,'dv')),dm:A.dm};
 var K=globalThis.KalsaraMoney.safeMoneySum([tmod(r),r.t,A.og]),fx=A.fb=='yes'?A.fl:0,CP=[[R.gx,R.cg],[R.px,R.cp],[A.pb,R.cpb],[R.vx,R.cvx],[R.lv,R.clv]];
 var best=globalThis.KalsaraMoney.estimateGrossPrice(globalThis.KalsaraMoney.safeMoneySum([K,fx]),[R.ad,R.pm,A.pj,R.ads,R.rt],CP.map(function(c){return{rate:c[0],cap:c[1]}}));
 if(best===null)return{err:'Total tarif 100% atau lebih'};
 var P=best,L=P;
 if(A.vm=='pct'&&globalThis.KalsaraMoney.percentUnits(A.vv||0)>=1000000n)return{err:'Voucher 100% tidak valid'};
 if(typeof vcBad==='function'&&vcBad(r))return{err:'Voucher 100% tidak valid'};
 for(var vz=0;vz<400;vz++){var L2=globalThis.KalsaraMoney.safeMoneySum([P,volt(L,r)]);if(L2<=L)break;L=L2}
 var M0;
 if(R.dm=='nom')M0=globalThis.KalsaraMoney.safeMoneySum([L,Math.round(R.dv)]);else{if(globalThis.KalsaraMoney.percentUnits(R.dv)>=1000000n)return{err:'Diskon coret tidak valid'};M0=globalThis.KalsaraMoney.grossUpDiscount(L,R.dv)}
 var re=+A.re||0,st=re>0?1000:(A.rd>0?A.rd:1),lb=re>0?re:st,M=re>0?Math.max(re,Math.ceil((M0-re)/1000)*1000+re-3000):Math.max(st,Math.ceil(M0/st)*st-3*st),o;
 /*v5.14: 64 langkah pertama dipindai linear (kasus normal, hasil identik dengan sebelumnya); bila belum ketemu, lompat eksponensial + binary search (±40 evaluasi, bukan hingga 20.000)*/
 if(!Number.isSafeInteger(M0))return{err:'Harga awal melebihi batas integer aman'};var M0s=M,k=0,hit=false;
 for(;k<64;k++){o=fwd(M,r,R);if(o.u>=r.t){hit=true;break}M+=st}
 if(!hit){var lo=63,hi=-1,g=64;
  while(hi<0){if(g>19999)g=19999;var q0=fwd(M0s+g*st,r,R);if(q0.u>=r.t){hi=g;o=q0}else{lo=g;if(g>=19999)break;g*=2}}
  if(hi<0)return{err:'Target untung di luar batas pencarian harga'}
  else{while(hi-lo>1){var mid=(lo+hi)>>1,qm=fwd(M0s+mid*st,r,R);if(qm.u>=r.t){hi=mid;o=qm}else lo=mid}
   for(var j=Math.max(64,hi-24);j<hi;j++){var qj=fwd(M0s+j*st,r,R);if(qj.u>=r.t){hi=j;break}}
   M=M0s+hi*st;o=fwd(M,r,R)}}
 for(var z=0;z<50&&M-st>=lb;z++){var q=fwd(M-st,r,R);if(q.u>=r.t){M-=st;o=q}else break}
 o.R=R;return o}

var PRM=[],VCC=null,VNO=0,rows=[];
function vdisc(p,L){if(p.u=='cb')return 0;if(p.u=='pct'){var v=pr(p.a,L);return p.cp>0?Math.min(v,Math.round(p.cp)):v}return Math.min(Math.round(p.a),L)}
function dd(a,b){return Math.round((new Date(b+'T00:00')-new Date(a+'T00:00'))/864e5)}
function pst(p){var t=today();if(!p.s&&!p.e)return{k:'a',t:'Berjalan (tanpa jadwal)'};
 if(p.e&&t>p.e)return{k:'e',t:'Berakhir'};
 if(p.s&&t<p.s){var d=dd(t,p.s);return{k:'u',t:d==1?'Mulai besok':'Mulai '+d+' hari lagi'}}
 var d2=p.e?dd(t,p.e):null;return{k:'a',t:d2===null?'Berjalan':d2===0?'Berakhir hari ini':'Berjalan, sisa '+d2+' hari'}}
function vcList(){var d=today();if(!VCC||VCC.d!==d){VCC={d:d,a:[]};PRM.forEach(function(q){if(!q||q.t!='vc')return;var jt=q.jt||'toko';if(jt=='live'||jt=='video'||q.u=='cb'||!(q.a>0))return;if(pst(q).k!='a')return;if(q.x>0&&(q.y||0)>=q.x)return;VCC.a.push(q)})}return VCC.a}
function vcApply(q,r){if((q.jt||'toko')=='toko')return true;return !!(r&&r.id)&&[q.p,q.p2,q.p3].indexOf(r.id)>=0}
function vcLab(q){return((q.jt||'toko')=='produk'?'Voucher Produk ':'Voucher Toko ')+(q.u=='pct'?fmt(q.a)+'%':rp(q.a))+(q.n?' ('+q.n+')':'')}
function vcBest(L,r){var b=null;vcList().forEach(function(q){if(!vcApply(q,r))return;if(q.b>0&&L<q.b)return;var d=vdisc(q,L);if(d>0&&(!b||d>b.v))b={v:d,s:vcLab(q),q:q}});return b}
function vcBad(r){return vcList().some(function(q){return vcApply(q,r)&&q.u=='pct'&&q.a>=100})}
function vcThr(r){var t=[];vcList().forEach(function(q){if(vcApply(q,r)&&q.b>0&&t.indexOf(q.b)<0)t.push(q.b)});return t.sort(function(x,y){return x-y})}
export function calculateProduct(payload) {
  A = Object.assign({}, DEF, payload.settings || {});
  PRM = Array.isArray(payload.promos) ? payload.promos : [];
  VCC = null; VNO = 0;
  rows = Array.isArray(payload.products) ? payload.products : [];
  const product = payload.product || {};
  const result = calc(product);
  if (!result || result.err) return result;
  const forward = fwdL(result.L, product, result.R);
  return { ...result, forwardAtIdeal: forward };
}
