/* Compatibility module preserving the original Kalsara v5.82 business logic. */
var DEF={tp:'ns',fb:'no',fl:1250,pb:0,pbc:50000,ad:6.5,ac:'F',gc:'D',sz:'b',gf:100,gfd:'',gad:0,re:0,pp:'no',cgk:60000,cvx:20000,clv:20000,px:0,vx:0,lv:0,vp:'no',lp:'no',gm:0,wu:2000,wm:1,wp:30,cg:40000,cp:60000,pa:'yes',dm:'pct',dv:30,vm:'none',vv:0,vc:0,pm:0.5,pj:0.5,og:0,rd:100,ads:0,rt:0,sl:10,sh:5,sdy:7,tbl:null,tchk:'',tcd:30};
var A=Object.assign({},DEF),rows=[],TS=0,OK=['ad','gx','px','vx','lv','dv'];
var $=function(i){return document.getElementById(i)};
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
function calcSync(r){
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
/*v9.9: cache hasil kalkulator berkunci isi. Kunci = versi global (tanggal, A, PRM; dihitung sekali per tugas) + field yang dibaca rumus (id,m,d,p,t,q,o).
  Produk yang usang dihitung SEKALIGUS di Worker ('calculate-batch', satu kiriman, tanpa O(n^2)); selama itu upd() berjalan ringan (hanya kartu terbangun).
  Satu produk yang diedit dihitung sinkron (sekitar 0,2 ms). Jalur gagal/tanpa Worker tetap memakai hitungan sinkron v5.82.*/
var CC=new Map(),GK=null,GKV=0,GKS='',PW=null,PWQ=false,PWN={},PWFAIL=-1,BATCH_MIN=30,BATCH_STALE=12;
function gver(){if(GK===null){var s;try{s=JSON.stringify([today(),A,PRM])}catch(e){s='x'+Math.random()}if(s!==GKS){GKS=s;GKV++}GK=GKV;Promise.resolve().then(function(){GK=null})}return GK}
function rkey(r){return gver()+'|'+r.id+'|'+r.m+'|'+r.d+'|'+r.p+'|'+r.t+'|'+r.q+'|'+JSON.stringify(r.o||null)}
function staleRows(){var out=[];rows.forEach(function(r){if(r&&r.m>0&&!CC.has(rkey(r)))out.push(r)});return out}
function prewarm(list,gv){
 var W=globalThis.KalsaraWorker;if(!W||PWFAIL===gv)return null;
 if(PW&&PW.gv===gv)return PW.p;
 PWN[gv]=(PWN[gv]||0)+1;
 var keys=list.map(rkey),byId={};PRM.forEach(function(q){if(q&&q.id!==undefined)byId[q.id]=q});
 var p=W.compute('calculate-batch',{settings:A,promos:PRM,today:today(),slim:true,products:list.map(function(r){return{id:r.id,m:r.m,d:r.d,p:r.p,t:r.t,q:r.q,o:r.o}})}).then(function(res){
  if(gver()!==gv||!Array.isArray(res))return false;
  if(CC.size>rows.length*3+200)CC.clear();
  res.forEach(function(o,i){if(o&&o.vq&&o.vq.id!==undefined&&byId[o.vq.id])o.vq=byId[o.vq.id];CC.set(keys[i],o)});return true
 }).catch(function(e){PWFAIL=gv;console.warn('Worker batch gagal; memakai hitungan sinkron.',e);return false}).finally(function(){if(PW&&PW.p===p)PW=null});
 PW={gv:gv,p:p};return p}
function pwKick(p){if(PWQ)return;PWQ=true;var go=function(){PWQ=false;upd(false)};p.then(go,go)}
function calc(r){
 if(!r||!(r.m>0))return null;
 if(VNO)return calcSync(r); // The legacy comparison panel deliberately disables vouchers.
 var k=rkey(r),h=CC.get(k);
 if(h!==undefined)return h;
 var o=calcSync(r);CC.set(k,o);return o
}
/*END*/
var AD0=JSON.parse(JSON.stringify(AD)),GO0=JSON.parse(JSON.stringify(GO));
function tblSync(){Object.keys(AD0).forEach(function(k){AD[k]=(A.tbl&&A.tbl.AD&&A.tbl.AD[k])?A.tbl.AD[k].slice():AD0[k].slice()});Object.keys(GO0).forEach(function(k){GO[k]=(A.tbl&&A.tbl.GO&&A.tbl.GO[k])?A.tbl.GO[k].slice():GO0[k].slice()})}
function tbuild(){var h='',NM=['Admin','Admin Mall','Ongkir biasa','Ongkir khusus'];'ABCDEFGHI'.split('').forEach(function(c){h+='<div class="tb"><b>Kategori '+c+'</b>'+[['AD',0],['AD',1],['GO',0],['GO',1]].map(function(x,ix){if(x[0]=='GO'&&!GO0[c])return'';return'<label><span>'+NM[ix]+' (%)</span><input inputmode="decimal" aria-label="Kategori '+c+' '+NM[ix]+'" data-t="'+x[0]+'|'+x[1]+'|'+c+'"></label>'}).join('')+'</div>'});
 KDOM.setHTML($('tbl'), h);
 $('tbl').addEventListener('input',function(e){var t=e.target,p=(t.dataset.t||'').split('|');if(p.length<3)return;var v=(t.value.trim()===''?NaN:Number(t.value.replace(',','.')));if(isNaN(v)||v<0)return;if(v>100){v=100;t.value='100'}
  A.tbl=A.tbl||{AD:{},GO:{}};var src=p[0]=='AD'?AD:GO,arr=(A.tbl[p[0]][p[2]]||src[p[2]]).slice();arr[+p[1]]=v;A.tbl[p[0]][p[2]]=arr;upd(true)});
 $('tr').onclick=function(){A.tbl=null;fill();upd(true);toast('Tabel tarif dikembalikan')}}
function fillT(){document.querySelectorAll('[data-t]').forEach(function(t){var p=t.dataset.t.split('|'),a=(p[0]=='AD'?AD:GO)[p[2]];t.value=a?fmt(a[+p[1]]):''})}
function tchk(){var w=$('tw');if(A.ver&&!A.ver.ok&&!A.ver.ig){w.hidden=false;w.textContent='Cek pesanan nyata ('+A.ver.d+') menemukan selisih pada: '+A.ver.bad.join(', ')+'. Perbaiki di tab Tarif, lalu cek ulang.';return}var sd=verStale();if(sd){w.hidden=false;w.textContent='Tarif berubah sejak cek pesanan nyata ('+A.ver.d+'): '+sd.slice(0,4).join(', ')+(sd.length>4?', dan '+(sd.length-4)+' lainnya':'')+'. Cek ulang dengan pesanan nyata.';return}var d=A.tchk?Math.floor((new Date(today()+'T00:00')-new Date(A.tchk+'T00:00'))/864e5):null;
 if(d===null){w.hidden=false;w.textContent='Tanggal pengecekan tarif belum diisi. Cocokkan tabel tarif dengan Seller Centre di tab Tarif, lalu isi tanggalnya.'}
 else if(d>(A.tcd>0?A.tcd:30)){w.hidden=false;w.textContent='Tarif terakhir dicek '+d+' hari lalu. Cocokkan lagi dengan Seller Centre.'}else w.hidden=true}
var SGL={tp:'Tipe toko',fb:'Biaya proses pesanan',fl:'Nominal biaya proses',pb:'Biaya pembayaran (%)',pbc:'Batas biaya pembayaran',ad:'Admin manual (%)',ac:'Kategori administrasi',gc:'Kategori Gratis Ongkir XTRA',sz:'Ukuran Gratis Ongkir XTRA',gf:'Tarif Gratis Ongkir XTRA toko baru',gad:'Potongan tarif karena iklan',gm:'Gratis Ongkir XTRA manual (%)',px:'Promo XTRA (%)',vx:'Video XTRA (%)',lv:'Live XTRA (%)',pm:'Premi (%)',cg:'Batas Gratis Ongkir XTRA biasa',cgk:'Batas Gratis Ongkir XTRA khusus',cp:'Batas Promo XTRA',cvx:'Batas Video XTRA',clv:'Batas Live XTRA',tbl:'Tabel tarif'};
function feeSig(){var s={};Object.keys(SGL).forEach(function(k){s[k]=JSON.stringify(k=='gf'?gfac():(A[k]===undefined?null:A[k]))});return s}
function prodSig(R){return JSON.stringify([R.ad,R.gx,R.px,R.vx,R.lv,R.pm,R.cg,R.cp,R.cvx,R.clv,R.cpb])}
function verStale(){var v=A.ver;if(!v||!v.ok)return null;if(!v.sg)return['pengaturan tarif (cek lama belum mencatat pengaturan)'];
 var c=feeSig(),d=Object.keys(SGL).filter(function(k){return c[k]!==v.sg[k]}).map(function(k){return SGL[k]});if(d.length)return d;
 var ml=v.ml||(v.ps?[{pn:v.pn,ps:v.ps}]:[]);for(var mi=0;mi<ml.length;mi++){var r=rows.filter(function(x){return(x.n||'')===ml[mi].pn})[0],o=r&&calc(r);if(o&&!o.err&&prodSig(o.R)!==ml[mi].ps)return['tarif khusus produk '+(ml[mi].pn||'(tanpa nama)')]}
 return null}
var ADN={A:'Pakaian Muslim, Rumah Tangga, Mainan',B:'Peralatan RT, Buku, Olahraga',C:'Aksesoris Fashion, Ibu & Bayi, Makanan, Kecantikan',D:'Kesehatan, Komputer & Aksesoris',E:'Fotografi, Audio, Elektronik Besar',F:'Makanan Segar, Bahan Pokok',G:'Handphone & Tablet',H:'Logam Mulia, Emas, Perak',I:'Sepeda Motor, Mobil'};
function refreshLabels(root){root=root||document;
 var ix=A.tp=='ml'?1:0;
 root.querySelectorAll('#ac option,select[data-o="ac"] option').forEach(function(o){var t=AD[o.value];if(!t)return;var p=o.parentNode.id=='ac';o.textContent=p?o.value+' ('+fmt(t[ix])+'%): '+ADN[o.value]:'Kategori '+o.value+' ('+fmt(t[ix])+'%)'});
 root.querySelectorAll('select[data-o="g2"] option').forEach(function(o){var t=GO2[o.value];if(!t)return;o.textContent=o.value+' · '+fmt(t[0])+'%'});
 root.querySelectorAll('#gc option,select[data-o="gc"] option').forEach(function(o){var t=GO[o.value];if(!t)return;var p=o.parentNode.id=='gc';o.textContent=p?'Kategori '+o.value+': '+fmt(t[0])+'% biasa / '+fmt(t[1])+'% khusus':o.value+' · '+fmt(t[0])+'%'})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function strip(r){return{id:r.id||'',n:r.n,m:r.m,d:r.d,p:r.p,t:r.t,o:r.o,c:!!r.c,cx:r.cx||0,q:r.q||0,s:r.s==null?null:r.s,sd:r.sd||'',mb:r.mb||0,mh:r.mh||[],ack:!!r.ack,live:!!r.live,sup:r.sup||'',sku:r.sku||'',lnk:r.lnk||'',ha:r.ha||0,hd:r.hd||0}}
function fk(t,nv){var p=t.selectionStart||0,d=t.value.slice(0,p).replace(/\D/g,'').length;t.value=nv;var i=0,c=0;while(i<nv.length&&c<d){if(/\d/.test(nv[i]))c++;i++}try{t.setSelectionRange(i,i)}catch(e){}}
function cardBody(r,e){
 var F=[['m','Modal supplier'],['d','Biaya Management Partner'],['p','Biaya packing'],['t','Target untung'],['q','Isi paket (pcs)']];
 var O=[['ad','Admin manual (%)'],['gx','XTRA manual (% penuh)'],['pm','Premi (%)'],['ads','Biaya iklan (%)'],['rt','Cadangan retur (%)'],['px','Promo XTRA (%)'],['vx','Video XTRA (%)'],['lv','Live XTRA (%)'],['dv','Diskon coret']];var SEL='<div><label>Kategori admin</label><select data-o="ac"><option value="">Bawaan</option>'+'ABCDEFGHI'.split('').map(function(c){return '<option value="'+c+'">Kategori '+c+'</option>'}).join('')+'</select></div><div><label>XTRA sekarang</label><select data-o="gc"><option value="">Bawaan</option><option value="none">Tidak ikut</option>'+'ABCDEFGH'.split('').map(function(c){return '<option value="'+c+'">Kategori '+c+'</option>'}).join('')+'</select></div><div><label>XTRA mulai 1 Des 2026</label><select data-o="g2"><option value="">Sama seperti sekarang</option>'+'ABCDEFGH'.split('').map(function(c){return '<option value="'+c+'">Kategori '+c+'</option>'}).join('')+'</select></div><div><label>Ukuran produk</label><select data-o="sz"><option value="">Bawaan</option><option value="b">Biasa</option><option value="k">Khusus</option></select></div>';
 function OM(ks){return O.filter(function(f){return ks.indexOf(f[0])>=0}).map(function(f){return '<div><label>'+f[1]+'</label><input data-o="'+f[0]+'" inputmode="decimal"></div>'}).join('')}
 KDOM.setHTML(e, '<div class="ph"><input class="nm" placeholder="Nama produk" aria-label="Nama produk"><button class="tg" aria-label="Ciutkan atau buka produk"></button><button class="dp" aria-label="Duplikat produk" title="Duplikat">&#10697;</button><button class="x" aria-label="Hapus produk">&#10005;</button></div><div class="bdg"></div><div class="cs"></div><div class="sk"></div><div class="lvr"><button type="button" class="lvb" data-lv></button></div><div class="qs"><label>Stok di Shopee (pcs)</label><div class="stp"><button type="button" data-st="-1" aria-label="Kurangi stok 1">&#8722;</button><input data-f="s" inputmode="numeric" placeholder="Isi stok" aria-label="Jumlah stok"><button type="button" data-st="1" aria-label="Tambah stok 1">+</button></div></div><details class="det pad"><summary>Sudah tayang atau mau coba harga?</summary><p class="stk" style="margin:8px 2px">Produk baru? Kosongkan bagian ini. Isi kalau produk sudah tayang di Shopee, atau untuk mencoba harga tertentu.</p><div class="g"><div><label>Harga awal di Shopee</label><div class="mi"><input data-f="ha" inputmode="numeric" placeholder="0"></div></div><div><label>Harga diskon di Shopee / harga coba</label><div class="mi"><input data-f="hd" inputmode="numeric" placeholder="0"></div></div></div><button class="btn gh" type="button" data-hx="1" style="margin:10px 0 0">Impor harga / stok dari file (via SKU)</button><div class="ac"></div></details><div class="msec"><b>Modal dan biaya produk</b><small>Angka di bagian ini memengaruhi semua hasil di atas.</small></div><div class="g">'+
 F.map(function(f){return '<div><label>'+f[1]+'</label><div class="'+(f[0]=='q'||f[0]=='s'?'':'mi')+'"><input data-f="'+f[0]+'" inputmode="numeric" placeholder="'+(f[0]=='q'?'1':f[0]=='s'?'Cek di Seller Centre':'0')+'"></div>'+(f[0]=='t'?'<div class="chp"><button type="button" data-ad="1000" aria-label="Tambah target untung 1.000">+1.000</button><button type="button" data-ad="5000" aria-label="Tambah target untung 5.000">+5.000</button><button type="button" data-ad="0" aria-label="Kosongkan target untung">Reset</button></div>':'')+'</div>'}).join('')+'</div>'+
 '<details class="det"><summary>Tarif produk ini</summary><div class="tph" aria-live="polite"></div><div class="tps"><b>1. Kategori resmi Shopee</b><small>Pilih kategori produk ini. Bawaan = ikut Setelan. Persen di pilihan XTRA = ukuran biasa (ukuran khusus lebih tinggi).</small></div><div class="tp2">'+SEL+'</div><div class="tps"><b>2. Persen manual</b><small>Isi hanya jika ingin memakai persen sendiri. Kalau diisi, persen ini dipakai dan kategori di atas diabaikan.</small></div><div class="tp2">'+OM(['ad','gx'])+'</div><div class="tps"><b>3. Biaya lain</b><small>Kosong = ikut Setelan.</small></div><div class="tp2">'+OM(['pm','ads','rt','px','vx','lv','dv'])+'</div></details><details class="det cxd"><summary>Cek harga pesaing (hitung terbalik)</summary><div class="fl"><label>Harga jual yang ingin dicek<small>Harga diskon coret, mis. harga pesaing</small></label><input data-f="cx" inputmode="numeric" placeholder="0"></div><div class="cxr"></div></details><details class="det spd"><summary>Supplier dan riwayat modal</summary><div class="g3"><div><label>Nama supplier</label><input data-p="sup" placeholder="Nama toko supplier"></div><div><label>SKU</label><input data-p="sku" placeholder="Kode produk"></div><div style="grid-column:1/-1"><label>Link produk supplier</label><input data-p="lnk" inputmode="url" placeholder="https://"></div></div><div class="lkx"></div><div class="mhl"></div></details><div class="res"></div>');
 var ins=e.querySelectorAll('input[data-f]');
 e.querySelector('.nm').value=r.n||'';e.querySelectorAll('[data-p]').forEach(function(x){x.value=r[x.dataset.p]||''});
 ins.forEach(function(x){var k=x.dataset.f;x.value=(r[k]||(k=='s'&&r.s===0))?r[k].toLocaleString('id-ID'):''});
 e.querySelectorAll('[data-o]').forEach(function(x){var v=r.o&&r.o[x.dataset.o];x.value=(v===null||v===undefined)?'':fmt(v)});
 e.addEventListener('input',function(ev){
  var t=ev.target;
  if(t.dataset.f){var k=t.dataset.f,v=(k=='s'&&t.value.trim()==='')?null:num(t.value);r[k]=v;if(k=='s')r.sd=v==null?'':today();fk(t,(v||(k=='s'&&v===0))?v.toLocaleString('id-ID'):'')}
  else if(t.dataset.o&&t.tagName=='SELECT'){r.o=r.o||{};r.o[t.dataset.o]=t.value||null}
  else if(t.dataset.o){var v=pf(t.value,t.dataset.o!='dv');if(t.dataset.o!='dv'&&v>100){v=100;t.value='100'}r.o=r.o||{};r.o[t.dataset.o]=(t.value.trim()===''||isNaN(v)||v<0)?null:v}
  else if(t.dataset.p)r[t.dataset.p]=t.value.slice(0,300);else r.n=t.value;
  upd(true,r)});
 e.addEventListener('focusin',function(ev){var t=ev.target;if(t.tagName=='INPUT'&&t.dataset.f)setTimeout(function(){try{t.select()}catch(x){}},0)});
 e.addEventListener('change',function(ev){if(ev.target.dataset.f!='m')return;
  if(r.mb>0&&r.m>0&&r.m!==r.mb){r.mh=(r.mh||[]).concat([{d:today(),a:r.mb,b:r.m}]).slice(-10);r.ack=false}
  if(r.m>0)r.mb=r.m;upd(true,r)});
 e.addEventListener('click',function(ev){var lb=ev.target.closest&&ev.target.closest('[data-lv]');if(lb){r.live=!r.live;upd(true,r);toast(r.live?'Tampil di tab Etalase':'Dilepas dari tab Etalase');return}var sb=ev.target.closest&&ev.target.closest('[data-st]');if(sb){var dl=+sb.dataset.st;if(r.s==null&&dl<0){toast('Isi stok awal dulu');return}var ns=Math.min(Math.max(0,(r.s||0)+dl),999999999);r.s=ns;r.sd=today();e.querySelector('input[data-f="s"]').value=ns.toLocaleString('id-ID');try{if(navigator.vibrate)navigator.vibrate(8)}catch(x){}upd(true,r);return}if(ev.target.classList.contains('ak')){r.ack=true;upd(true,r);toast('Peringatan modal ditutup')}if(ev.target.classList.contains('ck')){r.sd=today();upd(true,r);toast('Stok ditandai sudah dicek')}});
 e.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('[data-ad]');if(!b)return;var a=+b.dataset.ad,i=e.querySelector('input[data-f="t"]');r.t=a?Math.min((r.t||0)+a,999999999):0;i.value=r.t?r.t.toLocaleString('id-ID'):'';upd(true,r)});
 e.querySelector('.tg').onclick=function(){r.c=!r.c;e.classList.toggle('cl',!!r.c);this.setAttribute('aria-expanded',!r.c);colL();persist()};
 e.querySelector('.dp').onclick=function(){dup(r)};
 e.classList.toggle('cl',!!r.c);e.querySelector('.tg').setAttribute('aria-expanded',!r.c);
 e.querySelector('.x').onclick=function(){ask('Hapus '+(r.n?'produk "'+String(r.n).slice(0,40)+'"':'produk ini')+'? Data produk ini tidak bisa dikembalikan.','Ya, hapus',function(){var ix=rows.indexOf(r);if(ix<0)return;rows.splice(ix,1);e.remove();if(!rows.length)add();upd(true,r)})};
 e.addEventListener('toggle',function(ev){if(ev.target.classList.contains('rd'))r.ro=ev.target.open;if(ev.target.classList.contains('rd2'))r.ro2=ev.target.open},true);r.ac=e.querySelector('.ac');r.bg=e.querySelector('.bdg');var pd=e.querySelector('.pad');if(pd&&(r.ha>0||r.hd>0))pd.open=true;r.el=e.querySelector('.res');r.cs=e.querySelector('.cs');r.sk=e.querySelector('.sk');r.mhl=e.querySelector('.mhl');r.lkx=e.querySelector('.lkx');r.cxr=e.querySelector('.cxr');r.box=e;
 refreshLabels(e)}
/*v9.8: hidrasi malas. card() hanya membuat cangkang ringan; isi formulir (cardBody) dibangun saat kartu mendekati layar, jadi ribuan produk tidak membangun ribuan formulir sekaligus.*/
var ROW_MAX=1000,HY_ALL=40,LZM=new Map(),LZ=null;
try{if(typeof IntersectionObserver=='function')LZ=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;var r=LZM.get(en.target);if(r)hyd(r)})},{rootMargin:'900px 0px'})}catch(x){LZ=null}
function card(r){var e=document.createElement('div');e.className='pc lz';e.classList.toggle('cl',!!r.c);r.box=e;r.hy=false;$('list').appendChild(e);
 if(!LZ||rows.length<=HY_ALL)hyd(r);else{LZM.set(e,r);LZ.observe(e)}}
function hyd(r){if(r.hy||!r.box)return;r.hy=true;var e=r.box;if(LZ){LZ.unobserve(e);LZM.delete(e)}cardBody(r,e);e.classList.remove('lz');updRow(r)}
function add(d){var r=Object.assign({n:'',m:0,d:0,p:0,t:0,o:{}},d||{});r.o=r.o||{};if(!r.id)r.id=uid();if(!(r.mb>0)&&r.m>0)r.mb=r.m;rows.push(r);card(r)}
function dup(r){
 if(rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}
 var nr=Object.assign({},strip(r),{id:uid(),s:null,sd:'',mh:[],ack:false,live:false,ha:0,hd:0,n:r.n?r.n+' (salinan)':'',o:Object.assign({},r.o||{}),c:false});
 rows.splice(rows.indexOf(r)+1,0,nr);card(nr);hyd(nr);$('list').insertBefore(nr.box,r.box.nextSibling);
 nr.box.scrollIntoView({block:'center'});upd(true);toast('Produk diduplikat')}
function pc1(x){return fmt(Math.round(x*10)/10)}
function skHi(){var a=Math.max(0,Math.floor(+A.sh)||0),b=Math.max(0,Math.floor(+A.sl)||0);return Math.min(a,b)}
function stk(r){if(!(r.m>0||r.n))return{lv:'',h:''};
 var d=r.sd?Math.floor((new Date(today()+'T00:00')-new Date(r.sd+'T00:00'))/864e5):null,b=' <button class="lk ck" type="button">Sudah dicek hari ini</button>',
 w=function(l,t,k){return{lv:l,h:'<div class="wn '+l+'">&#9888; '+t+(k?b:'')+'</div>'}};
 if(r.s==null)return w('y','Stok belum diisi. Cek jumlah stok asli di Seller Centre.',0);
 if(r.s<=0)return w('r','Stok habis. Nonaktifkan produk atau isi ulang stok di Shopee.',1);
 if(r.s<=skHi())return w('r','Stok hampir habis ('+r.s+' pcs). Segera isi ulang di supplier dan Shopee.',1); if(r.s<=A.sl)return w('y','Stok menipis ('+r.s+' pcs). Cek stok supplier dan Shopee.',1);
 if(A.sdy>0&&d!==null&&d>=A.sdy)return w('y','Stok terakhir dicek '+d+' hari lalu. Cek ulang jumlah asli di Shopee.',1);
 return{lv:'',h:'<div class="stk">Stok '+r.s.toLocaleString('id-ID')+' pcs, '+(d===null?'tanggal cek belum tercatat':d===0?'dicek hari ini':'dicek '+d+' hari lalu')+b+'</div>'}}
function warns(o,rev){
 var w=[],sh=[],lv='',m=o.P>0?o.u/o.P*100:0,pot=o.P>0?(o.sh+o.pm+o.tax)/o.P*100:0;
 if(o.u<0){lv='r';w.push(rev?'Rugi pada harga ini.':'Rugi. Naikkan harga atau target untung.');sh.push('Rugi')}
 else if(o.u==0){lv='r';w.push(rev?'Impas, tidak ada untung sama sekali.':'Untung nol. Tidak ada cadangan untuk risiko.');sh.push('Untung nol')}
 else if(o.u<A.wu||m<A.wm){lv='y';w.push('Untung tipis ('+rp(o.u)+', margin '+pc1(m)+'%). Batas aman: '+rp(A.wu)+' dan '+pc1(A.wm)+'%.');sh.push('Untung tipis')}
 if(pot>A.wp){lv=lv||'y';w.push('Total potongan tinggi ('+pc1(pot)+'% dari harga jual). Periksa tarif yang diisi.');sh.push('Potongan tinggi')}
 return{w:w,sh:sh,lv:lv,m:m,pot:pot}}
function WN(x){return x.w.map(function(t){return '<div class="wn '+(x.lv=='r'&&x.w[0]==t?'r':'y')+'">&#9888; '+t+'</div>'}).join('')}
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function dtx(d){var p=String(d).split('-');return(+p[2])+' '+['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][p[1]-1]}
function mchg(r,o){var h=r.mh&&r.mh.length&&r.mh[r.mh.length-1];if(!h||r.ack)return null;
 var old=calc(Object.assign({},r,{m:h.a}));if(!old||old.err)return null;
 var q=fwd(old.M,r,o.R),x=warns(q,true),up=h.b>h.a,lv='',t;
 if(up){lv=q.u<0?'r':(q.u<r.t||x.m<A.wm||q.u<A.wu)?'y':'';
  t='Modal naik '+rp(h.b-h.a)+' ('+dtx(h.d)+'). Harga listing perlu naik dari '+rp(old.M)+' ke '+rp(o.M)+'. Jika harga lama dipertahankan, untung jadi '+rp(q.u)+' (margin '+pc1(x.m)+'%).'}
 else t='Modal turun '+rp(h.a-h.b)+' ('+dtx(h.d)+'). Harga listing bisa turun dari '+rp(old.M)+' ke '+rp(o.M)+'.';
 return{lv:lv,h:'<div class="wn '+(lv||'i')+'">'+(lv?'&#9888; ':'')+t+' <button class="lk ak" type="button">Sudah update harga di Shopee</button></div>'}}
function revHtml(r,o,im){
 var q=fwdL(r.cx,r,o.R),x=warns(q,true),d=im===null?null:r.cx-im,tm=tmod(r);
 return '<div class="rw">Harga jual yang dicek<b>'+rp(q.L)+'</b></div>'+
 (q.v?'<div class="rw">'+esc(q.vs||'Voucher toko')+'<b>- '+rp(q.v)+'</b></div><div class="rw">Harga setelah voucher<b>'+rp(q.P)+'</b></div>':'')+
 '<div class="rw">Total Biaya Shopee<b>'+rp(q.sh)+'</b></div><div class="rw">Premi + PPh 22<b>'+rp(q.pm+q.tax)+'</b></div>'+(q.ads?'<div class="rw">Biaya iklan<b>'+rp(q.ads)+'</b></div>':'')+(q.rt?'<div class="rw">Cadangan retur<b>'+rp(q.rt)+'</b></div>':'')+(A.og?'<div class="rw">Ongkir ditanggung<b>'+rp(A.og)+'</b></div>':'')+
 '<div class="rw">Saldo masuk toko<b>'+rp(q.s)+'</b></div><div class="rw">Modal + Management Partner + packing<b>'+rp(tm)+'</b></div>'+
 '<div class="rw">'+(q.u<0?'Rugi bersih':'Untung bersih')+'<b class="'+(q.u<0?'bad':q.u<A.wu||x.m<A.wm?'':'ok')+'">'+(q.u<0?'- ':'')+rp(Math.abs(q.u))+'</b></div>'+
 '<div class="rw">Margin (dari harga jual)<b>'+pc1(x.m)+'%</b></div>'+
 (d===null?'':'<div class="rw">Selisih dari harga impas<b>'+(d>=0?rp(d)+' di atas':rp(-d)+' di bawah')+'</b></div>')+WN(x)}
function CR(l,p,v,raw){return p>0||l=='Tarif administrasi'?'<div class="rw">'+l+' ('+fmt(p)+'%)<b>'+rp(v)+(raw>v?' (kena batas)':'')+'</b></div>':''}
function colL(){var b=$('col');if(b)b.textContent=(rows.length&&rows.every(function(r){return r.c}))?'Buka semua':'Ciutkan semua'}
function dep(){var c={fl:A.fb=='yes',ad:A.ac=='man',gm:A.gc=='man',vv:A.vm!='none',vc:A.vm=='pct'};for(var k in c){var x=$(k);if(x)x.closest('.fl').hidden=!c[k]}colL()}
function sp(o,r){var c=tmod(r),f=o.sh+o.pm+o.tax+o.ads+o.rt+A.og,u=Math.max(o.u,0),t=c+f+u;if(t<=0)return'';var w=function(v){return(v/t*100).toFixed(1)},q=function(v){return Math.round(v/t*100)};return'<div class="pg"><div class="pgh">Ke mana harga jual pergi</div><div class="bar"><i class="c1" style="width:'+w(c)+'%"></i><i class="c2" style="width:'+w(f)+'%"></i><i class="c3" style="width:'+w(u)+'%"></i></div><div class="lg"><span><s class="c1"></s>Modal '+q(c)+'%</span><span><s class="c2"></s>Potongan '+q(f)+'%</span><span><s class="c3"></s>Untung '+q(u)+'%</span></div></div>'}
function gwarn(){var w=$('gw');if(A.gc!='none'&&A.gf<100&&!A.gfd){w.hidden=false;KDOM.setHTML(w, '&#9888; Gratis Ongkir XTRA dihitung '+fmt(A.gf)+'% dari tarif tabel tanpa tanggal berakhir. Jika Shopee sebenarnya menagih tarif penuh, harga jadi terlalu murah dan untung nyata di bawah target. <button class="lk" type="button" id="gwb">Pakai tarif penuh (100%)</button>')}else w.hidden=true}
$('gw').addEventListener('click',function(e){if(!e.target.closest('#gwb'))return;A.gf=100;fill();upd(true);toast('Tarif Gratis Ongkir XTRA: penuh (100%)')});
function errH(e){var m={'Voucher 100% tidak valid':['Voucher toko 100% membuat harga jadi nol. Turunkan nilainya.','vc','Buka Voucher'],'Diskon coret tidak valid':['Diskon coret 100% atau lebih tidak masuk akal. Turunkan nilainya.','pt','Buka Promosi'],'Total tarif 100% atau lebih':['Total tarif (admin, iklan, premi, dan lainnya) mencapai 100%. Periksa persen iklan dan tarif.','set','Buka Pengaturan'],'Target untung di luar batas pencarian harga':['Target untung belum tercapai dalam batas pencarian harga. Periksa target untung, modal, biaya, dan tarif; turunkan target atau periksa input biaya.','','']}[e];if(!m)return'<div class="empty">'+esc(e)+'</div>';return'<div class="wn r">&#9888; '+m[0]+(m[2]?' <button class="lk" type="button" data-go="'+m[1]+'">'+m[2]+'</button>':'')+'</div>'}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-go]');if(!b)return;var g=b.dataset.go;if(g=='set')tab(2);else{PSEL=g;tab(3)}});
function updRow(r){var H=!!r.hy,g=r._ag={n:0,sm:0,su:0,nw:0,ns:0};
 if(H){
  var lbn=r.box.querySelector('[data-lv]');if(lbn){lbn.classList.toggle('on',!!r.live);lbn.setAttribute('aria-pressed',!!r.live);lbn.textContent=r.live?'✓ Live di toko (ketuk untuk lepas)':'Tandai sudah listing / live di Shopee'}
  r.box.querySelectorAll('input[data-o]').forEach(function(x){var k=x.dataset.o;x.placeholder=k=='gx'?fmt(gfac()>0?Math.round(goRate({o:Object.assign({},r.o,{gx:null})})*10000/gfac())/100:goRate({o:Object.assign({},r.o,{gx:null})})):k=='ad'?fmt(adRate({o:Object.assign({},r.o,{ad:null})})):k=='dv'&&A.pa=='no'?'Nonaktif':fmt(A[k])});
  var th=r.box.querySelector('.tph');if(th){try{var gmn=r.o&&r.o.gx!==null&&r.o.gx!==undefined,amn=r.o&&r.o.ad!==null&&r.o.ad!==undefined;th.textContent='Dipakai sekarang: admin '+fmt(adRate(r))+'%'+(amn?' (manual)':'')+', Gratis Ongkir XTRA '+fmt(goRate(r))+'%'+(gmn?' (manual)':'')+(gfac()<100?' (sudah dikali keringanan '+fmt(gfac())+'%)':'')+'.'}catch(e){}}
  var dl=r.box.querySelector('input[data-o="dv"]');if(dl&&dl.previousElementSibling)dl.previousElementSibling.textContent=(A.dm=='nom'?'Diskon coret (Rp)':'Diskon coret (%)')+(A.pa=='no'?' - Promo Toko nonaktif':'');
  KDOM.setHTML(r.lkx, /^https?:\/\//i.test(r.lnk||'')?'<a href="'+esc(r.lnk)+'" target="_blank" rel="noopener noreferrer">Buka link supplier</a>':'');
  KDOM.setHTML(r.mhl, (r.mh&&r.mh.length)?'<div class="stk">Riwayat modal</div>'+r.mh.slice().reverse().map(function(h){return'<div class="stk">'+dtx(h.d)+': '+rp(h.a)+' ke '+rp(h.b)+' ('+(h.b>=h.a?'+':'')+pc1((h.b-h.a)/h.a*100)+'%)</div>'}).join(''):'');
 }
  var kk=stk(r);r.sl=kk.lv;if(kk.lv)g.ns++;H&&KDOM.setHTML(r.sk, kk.h);r.u=undefined;r.lv='';var o=calc(r);H&&KDOM.setHTML(r.cxr, '');if(!o||o.err){H&&KDOM.setHTML(r.ac, acH(r,null));H&&KDOM.setHTML(r.bg, bdH(r,null))}
  if(!o){H&&KDOM.setHTML(r.el, '<div class="empty">Isi modal supplier, hasil muncul otomatis di sini.</div>');H&&KDOM.setHTML(r.cs, '<div class="em">Isi modal supplier, hasil muncul otomatis di sini.</div>');if(r.cx>0)H&&KDOM.setHTML(r.cxr, '<div class="empty">Isi modal supplier dulu.</div>');return}
  if(o.err){var eh=errH(o.err);H&&KDOM.setHTML(r.el, eh);H&&KDOM.setHTML(r.cs, '<div class="em">'+eh+'</div>');if(r.cx>0)H&&KDOM.setHTML(r.cxr, eh);return}
  g.n++;g.sm+=o.M;g.su+=o.u;H&&KDOM.setHTML(r.ac, acH(r,o));H&&KDOM.setHTML(r.bg, bdH(r,o));
  var okc=o.u>=r.t?'ok':'bad';
  var wx=warns(o,false),im=impas(r,o.R);if(wx.lv)g.nw++;r.u=o.u;r.mg=wx.m;r.M=o.M;r.lv=wx.lv;var mc=mchg(r,o),vsn=vscn(r,o);H&&KDOM.setHTML(r.sk, kk.h+(mc?mc.h:'')+vsn.h);if(mc&&mc.lv&&!r.lv){r.lv=mc.lv;g.nw++}if(vsn.lv&&!r.lv){r.lv=vsn.lv;g.nw++}
  H&&KDOM.setHTML(r.cs, '<div>Harga listing awal<b>'+rp(o.M)+'</b></div><div>Untung bersih<b class="'+okc+'">'+rp(o.u)+' ('+pc1(wx.m)+'%)</b></div>'+(wx.lv?'<div class="em wn '+wx.lv+'">&#9888; '+wx.sh.join(', ')+'</div>':''));
  H&&KDOM.setHTML(r.el, '<div class="big"><div><span>Harga listing awal</span><b>'+rp(o.M)+'</b></div><div><span>Harga diskon coret</span><b>'+rp(o.L)+'</b></div></div><div class="pf '+okc+'"><span>Untung bersih<small>Margin '+pc1(wx.m)+'%</small></span><b>'+rp(o.u)+'</b></div>'+sp(o,r)+vnote(o,r)+WN(wx)+'<details class="det rd"'+(r.ro?' open':'')+'><summary>Lihat rincian biaya</summary>'+
  (o.v?'<div class="rw">'+esc(o.vs||'Voucher toko')+'<b>- '+rp(o.v)+'</b></div><div class="rw">Harga setelah voucher<b>'+rp(o.P)+'</b></div>':'')+
  CR('Tarif administrasi',o.R.ad,o.b.ad,o.b.ad)+CR('Tarif Gratis Ongkir XTRA',o.R.gx,o.b.gx,Math.round(o.R.gx/100*o.P))+CR('Tarif Promo XTRA',o.R.px,o.b.px,Math.round(o.R.px/100*o.P))+CR('Tarif Video XTRA',o.R.vx,o.b.vx,Math.round(o.R.vx/100*o.P))+CR('Tarif Live XTRA',o.R.lv,o.b.lv,Math.round(o.R.lv/100*o.P))+CR('Biaya pembayaran',A.pb,o.b.pay,pr(A.pb,o.P))+(o.b.fx?'<div class="rw">Biaya layanan pesanan<b>'+rp(o.b.fx)+'</b></div>':'')+'<div class="rw">Total Biaya Shopee<b>'+rp(o.sh)+'</b></div><div class="rw">Premi<b>'+rp(o.pm)+'</b></div><div class="rw">PPh 22<b>'+rp(o.tax)+'</b></div>'+(o.ads?'<div class="rw">Biaya iklan ('+fmt(o.R.ads)+'%)<b>'+rp(o.ads)+'</b></div>':'')+(o.rt?'<div class="rw">Cadangan retur ('+fmt(o.R.rt)+'%)<b>'+rp(o.rt)+'</b></div>':'')+(A.og?'<div class="rw">Ongkir ditanggung<b>'+rp(A.og)+'</b></div>':'')+
  '<div class="rw">Saldo masuk toko<b>'+rp(o.s)+'</b></div><div class="rw">Modal + Management Partner + packing<b>'+rp(tmod(r))+'</b></div><div class="rw">Untung bersih<b class="'+okc+'">'+rp(o.u)+'</b></div><div class="rw">Margin (dari harga jual)<b>'+pc1(wx.m)+'%</b></div>'+(im===null?'':'<div class="rw">Harga impas (harga diskon coret)<b>'+rp(im)+'</b></div>')+'</details>');
  if(r.cx>0)H&&KDOM.setHTML(r.cxr, revHtml(r,o,im))}
function upd(save,only){GK=null;var light=false;
 if(!only&&rows.length>=BATCH_MIN&&globalThis.KalsaraWorker&&!VNO){var gv=gver(),st=staleRows();
  if(!st.length)PWN={};
  else if(st.length>=BATCH_STALE&&PWFAIL!==gv&&(PWN[gv]||0)<3){var pp=(PW&&PW.gv!==gv)?PW.p:prewarm(st,gv);if(pp){light=true;pwKick(pp)}}}
 tblSync();refreshLabels();tchk();gwarn();vwarn();dep();
 $('gci').textContent=A.gc=='none'?'Tidak ikut Gratis Ongkir XTRA':'Tarif berlaku sekarang: '+fmt(goRate({o:{}}))+'% (ukuran '+(A.sz=='k'?'khusus':'biasa')+')';
 $('aci').textContent='Tarif berlaku sekarang: '+fmt(adRate({o:{}}))+'%';
 /*v9.8: upd(save,only) menghitung ulang HANYA produk 'only' (edit di kartu); produk lain memakai hasil tersimpan r._ag.*/
 if(light)rows.forEach(function(r){if(r.hy)updRow(r)});else if(only)updRow(only);else rows.forEach(updRow);
 var g={n:0,sm:0,su:0,nw:0,ns:0};rows.forEach(function(r){var q=r._ag;if(q){g.n+=q.n;g.sm+=q.sm;g.su+=q.su;g.nw+=q.nw;g.ns+=q.ns}});
 var n=g.n,sm=g.sm,su=g.su,nw=g.nw,ns=g.ns;
 $('s1').textContent=n;$('s2').textContent=n?rp(sm/n):'-';$('s3').textContent=n?rp(su):'-';$('s3').className=su<0?'neg':'';$('s4').textContent=nw;$('s5').textContent=ns;var tl=rows.filter(function(r){return r.live}).length;$('tp1').textContent=rows.length;$('tp2').textContent=tl;$('tp3').textContent=rows.length-tl;if(!light){flt();shop()}
 PSIG=psig();
 if(save)persist()}
function flt(){var s=($('q').value||'').toLowerCase().trim(),f=$('ff').value;$('qb').hidden=rows.length<6&&!s&&f=='all'&&$('so').value=='0';
 rows.forEach(function(r){var h=!!s&&((r.n||'')+' '+(r.sup||'')+' '+(r.sku||'')).toLowerCase().indexOf(s)<0;if(f=='chk')h=h||!r.lv;if(f=='bad')h=h||r.lv!='r';if(f=='stk')h=h||!r.sl;if(f=='new')h=h||!!(r.ha>0||r.hd>0);if(f=='live')h=h||!r.live;if(f=='nlive')h=h||!!r.live;if(f=='gap')h=h||!(r.ay>0);if(f=='ok')h=h||r.u===undefined||!!r.lv;if(r.box.contains(document.activeElement))h=false;r.box.hidden=h});document.querySelectorAll('#tt3 [data-ft]').forEach(function(d){d.classList.toggle('on',d.dataset.ft==f&&f!='all')})}
function srt(){var v=$('so').value,a=rows.slice(),K={us:function(r){return r.u},ub:function(r){return -r.u},mg:function(r){return r.mg},hl:function(r){return -r.M}};
 if(v!='0')a.sort(function(x,y){if(v=='sk')return(x.s==null?-1:x.s)-(y.s==null?-1:y.s);if(v=='nm')return(x.n||'~').localeCompare(y.n||'~','id');var hx=x.u===undefined,hy=y.u===undefined;if(hx||hy)return hx-hy;return K[v](x)-K[v](y)});
 var L=$('list');a.forEach(function(r,i){if(L.children[i]!==r.box)L.insertBefore(r.box,L.children[i]||null)})}
$('ff').onchange=flt;
document.querySelectorAll('#tt3 [data-ft]').forEach(function(d){function go(){var v=d.dataset.ft;$('ff').value=v;$('q').value='';flt();var n=rows.filter(function(r){return !r.box.hidden}).length;toast(v=='all'?'Menampilkan semua produk ('+n+')':'Menampilkan '+n+' produk '+(v=='live'?'sudah live':'belum live'));var b=$('qb');if(b&&b.scrollIntoView)b.scrollIntoView({block:'start'})}d.onclick=go;d.onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();go()}}});
$('so').onchange=function(){srt();flt();toast('Urutan diterapkan')};
$('q').addEventListener('input',flt);
var dfn=null,dprev=null;
function inertBg(on){[document.querySelector('main'),document.querySelector('nav'),document.querySelector('header'),$('fab')].forEach(function(x){if(x)x.inert=on})}
function ask(m,ok,fn){dprev=document.activeElement;$('dlgm').textContent=m;$('dy').textContent=ok;dfn=fn;$('dlg').hidden=false;inertBg(true);$('dn').focus()}
function dclose(){$('dlg').hidden=true;dfn=null;inertBg(false);var p=dprev;dprev=null;if(p&&p.focus)try{p.focus()}catch(e){}}
$('dn').onclick=dclose;$('dy').onclick=function(){var f=dfn;dclose();if(f)f()};
$('dlg').addEventListener('keydown',function(e){if(e.key=='Escape')dclose();else if(e.key=='Tab'){var f=[$('dn'),$('dy')],i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+2)%2].focus()}});$('dlg').addEventListener('click',function(e){if(e.target===this)dclose()});
var toastT=null;function toast(m){var t=$('tt');t.textContent=m;t.className='toast on';clearTimeout(toastT);toastT=setTimeout(function(){t.className='toast'},1600)}

function setStock(r,v){r.s=v;if(v!=null)r.sd=today();else r.sd='';var i=r.box.querySelector('input[data-f="s"]');if(i)i.value=v==null?'':v.toLocaleString('id-ID');upd(true)}
var ETU={},ETT={};
function etUn(r){return !!(r&&ETU[r.id]>Date.now())}
function etSet(r,on){clearTimeout(ETT[r.id]);if(on){ETU[r.id]=Date.now()+10000;ETT[r.id]=setTimeout(function(){delete ETU[r.id];var a=document.activeElement;if(a&&$('shl').contains(a)){var ia=a.shadowRoot&&a.shadowRoot.activeElement,t=ia||a;if(t.blur)t.blur()}shop()},10100)}else delete ETU[r.id]}
function etAll(){for(var k in ETT)clearTimeout(ETT[k]);ETU={};ETT={}}
/*v9.8: Etalase = Web Component <kalsara-product-card> (Shadow DOM + Signals). shop() hanya menyusun MODEL data per produk; tampilan dibuat komponen tanpa innerHTML.*/
function shopChips(r,o){var out=[];PRM.forEach(function(q){if(!CFG[q.t])return;var tk=q.t=='vc'&&(q.jt||'toko')=='toko';var iz=(q.t=='pt'||q.t=='kh')&&q.it?q.it.filter(function(y){return y.p===r.id})[0]:null,ik=(q.t=='kh'||q.t=='hm')&&(q.mp||[]).indexOf(r.id)>=0;if(!tk&&!iz&&!ik&&[q.p,q.p2,q.p3].indexOf(r.id)<0)return;var z=pst(q);if(z.k!='a'&&z.k!='u')return;
 var t=CFG[q.t].n+(q.t=='vc'?' '+{toko:'Toko',produk:'Produk',live:'Live',video:'Video'}[q.jt||'toko']:'')+((CFG[q.t].c=='vi'||CFG[q.t].c=='vc')&&q.a>0?' '+(q.u=='pct'||q.u=='cb'?fmt(q.a)+'%'+(q.u=='cb'?' cashback':''):rp(q.a)):'')+(iz&&o&&!o.err&&ptp(q,iz,o.M)>0?' '+rp(ptp(q,iz,o.M)):CFG[q.t].c=='pr'&&q.a>0?' '+rp(q.a):CFG[q.t].c=='hm'&&q.b>0?' min '+rp(q.b):CFG[q.t].c=='pd'&&q.b>0?' beli '+(q.a||1)+' '+((q.tp||'pct')=='pct'?'-'+fmt(q.b)+'%':(q.tp=='nom'?'-':'')+rp(q.b)):'')+' \u00b7 '+z.t+(q.t=='vc'&&o&&!o.err&&o.vq===q?' \u00b7 dipakai di harga':'');
 out.push({kind:z.k,text:t})});return out}
function errModel(e){var m={'Voucher 100% tidak valid':['Voucher toko 100% membuat harga jadi nol. Turunkan nilainya.','vc','Buka Voucher'],'Diskon coret tidak valid':['Diskon coret 100% atau lebih tidak masuk akal. Turunkan nilainya.','pt','Buka Promosi'],'Total tarif 100% atau lebih':['Total tarif (admin, iklan, premi, dan lainnya) mencapai 100%. Periksa persen iklan dan tarif.','set','Buka Pengaturan'],'Target untung di luar batas pencarian harga':['Target untung belum tercapai dalam batas pencarian harga. Periksa target untung, modal, biaya, dan tarif; turunkan target atau periksa input biaya.','','']}[e];if(!m)return{kind:'error',plain:true,message:String(e)};return{kind:'error',message:m[0],goTarget:m[1],goLabel:m[2]}}
function actNoteModel(r,o,pr){var al=(r.ha>0||r.hd>0)?actL(r,o.R):0;
 if(!(al>0))return pr?null:[{text:'Belum ada harga aktual. Penjualan dicatat di harga ideal '+rp(o.L)+'.'}];
 if(pr&&al>=pr)return null;
 var aq=fwdL(al,r,o.R).u;return [{text:'Penjualan dicatat di harga aktual '+rp(al)+(al==o.L?' (sama dengan ideal).':' (ideal '+rp(o.L)+').')+' '},{text:(aq<0?'Rugi ':'Untung ')+rp(Math.abs(aq)),tone:aq<0?'bad':'ok',bold:true}]}
function shopPrice(r,o){
 if(!o)return{kind:'empty'};if(o.err)return errModel(o.err);
 var pm=null;PRM.forEach(function(q){if(pst(q).k!='a'||!CFG[q.t])return;var a=0;if(CFG[q.t].c=='pr'&&q.p===r.id)a=q.a;else if(q.t=='pt'&&q.it){var iz=q.it.filter(function(z){return z.p===r.id})[0];if(iz)a=ptp(q,iz,o.M)}if(!(a>0))return;if(!pm||a<pm.a)pm={a:a,t:q.t}});
 var ac=(r.ha>0||r.hd>0)?actL(r,o.R):0;
 if(ac>0){var aq=fwdL(ac,r,o.R),am=aq.P>0?aq.u/aq.P*100:0,ad=r.ha>ac?Math.round((r.ha-ac)/r.ha*100):0;
  return{kind:'priced',main:rp(ac),strike:ad>0?rp(r.ha):'',pct:ad>0?'-'+ad+'%':'',label:'Harga aktual',actual:true,
   notes:[[{text:(pm?CFG[pm.t].n+' berjalan. ':'')+(r.ha>0?'Harga awal Shopee '+rp(r.ha)+'. ':'')},{text:(aq.u<0?'Rugi ':'Untung ')+rp(Math.abs(aq.u)),tone:aq.u<0?'bad':'ok',bold:true},{text:' \u00b7 margin '+pc1(am)+'%'}]],
   warn:aq.u<r.t?{text:'Di bawah target (kurang '+rp(r.t-aq.u)+')',bad:aq.u<0}:null}}
 if(pm){var qq=fwdL(pm.a,r,o.R),dp=o.M>pm.a?Math.round((o.M-pm.a)/o.M*100):0,notes=[[{text:CFG[pm.t].n+' berjalan. Harga ideal '+rp(o.L)+'. '},{text:(qq.u<0?'Rugi ':'Untung ')+rp(Math.abs(qq.u)),tone:qq.u<0?'bad':'ok',bold:true},{text:' \u00b7 margin '+pc1(qq.P>0?qq.u/qq.P*100:0)+'%'}]],an=actNoteModel(r,o,pm.a);if(an)notes.push(an);
  return{kind:'priced',main:rp(pm.a),strike:dp>0?rp(o.M):'',pct:dp>0?'-'+dp+'%':'',label:'Estimasi / Produk baru',notes:notes}}
 var d=o.M>o.L?Math.round((o.M-o.L)/o.M*100):0,an2=actNoteModel(r,o,0);
 return{kind:'priced',main:rp(o.L),strike:d>0?rp(o.M):'',pct:d>0?'-'+d+'%':'',label:'Estimasi / Produk baru',notes:an2?[an2]:[]}}
function shop(){var L=rows.filter(function(r){return r.live}),lo=function(r){return r.s!=null&&r.s<=A.sl},att=L.filter(lo).sort(function(a,b){return a.s-b.s});if(att.length)L=att.concat(L.filter(function(r){return !lo(r)}));var rest=L.length-att.length;
 $('shn').textContent=L.length?L.length+' produk live'+(att.length?', '+att.length+' perlu isi ulang':''):'';$('shn').classList.toggle('w',att.length>0);
 if(!L.length){KShelf.renderShelf($('shl'),[{kind:'empty',key:'empty',text:'Belum ada produk yang live. Buka tab Hitung, lalu tekan "Tandai sudah listing / live di Shopee" pada produk yang sudah tayang.'}]);return}
 if(KShelf.anyCardEditing($('shl')))return;
 var items=[];
 L.forEach(function(r,ix){if(att.length&&ix==0)items.push({kind:'heading',key:'h-att',text:'Perlu isi ulang ('+att.length+')'});if(att.length&&rest&&ix==att.length)items.push({kind:'heading',key:'h-rest',text:'Stok aman ('+rest+')'});
  var i=rows.indexOf(r),o=calc(r);
  var vuse=null;try{var vb0=(o&&!o.err)?vbest(curP(r,o),r):null;if(vb0&&vb0.q&&vb0.q.x>0)vuse={checked:!!VUSE[r.id],remaining:Math.max(vb0.q.x-(vb0.q.y||0),0)}}catch(x){}
  var st=r.s==null?'':(r.s<=0?'bad':r.s<=skHi()?'bad':r.s<=A.sl?'low':''),lb=r.s==null?'':(r.s<=0?'Habis':r.s<=skHi()?'Hampir habis':r.s<=A.sl?'Menipis':''),un=etUn(r);
  items.push({kind:'card',key:'c-'+r.id,model:{index:i,name:r.n||'(tanpa nama)',rawName:r.n||'produk',chips:shopChips(r,o),price:shopPrice(r,o),voucher:vuse,stock:{value:r.s==null?'':r.s.toLocaleString('id-ID'),label:lb,tone:st,unlocked:un}}})});
 KShelf.renderShelf($('shl'),items)}
$('shl').addEventListener('kls-lock',function(e){var r0=rows[e.detail.index];if(!r0)return;var on=!etUn(r0);etSet(r0,on);shop();if(on)toast('Stok terbuka 10 detik')});
$('shl').addEventListener('kls-step',function(e){var r=rows[e.detail.index],d=e.detail.delta;if(!r)return;if(!etUn(r)){toast('Terkunci. Ketuk ikon gembok dulu');return}etSet(r,true);if(r.s==null&&d<0){toast('Isi stok awal dulu');return}if(d<0&&r.s>0)sold(r);setStock(r,Math.min(Math.max(0,(r.s||0)+d),999999999));try{if(navigator.vibrate)navigator.vibrate(8)}catch(x){}});
$('shl').addEventListener('kls-stock',function(e){var r=rows[e.detail.index];if(!r)return;if(!etUn(r)){shop();return}etSet(r,true);e.detail.blur();setStock(r,e.detail.value.trim()===''?null:num(e.detail.value))});
$('shl').addEventListener('kls-voucher',function(e){var r=rows[e.detail.index];if(r)VUSE[r.id]=e.detail.checked});
$('shl').addEventListener('kls-go',function(e){var g=e.detail.target;if(g=='set')tab(2);else{PSEL=g;tab(3)}});
$('shl').addEventListener('kls-open',function(e){goProd(e.detail.index)});
function clearMark(){rows.forEach(function(r){if(r.box)r.box.classList.remove('mk')})}
function goProd(i){var r=rows[i];if(!r)return;hyd(r);clearMark();$('q').value='';$('ff').value='all';document.body.classList.add('swp');tab(1);r.c=false;r.box.classList.remove('cl');var g=r.box.querySelector('.tg');if(g)g.setAttribute('aria-expanded','true');flt();colL();persist();
 var done=function(){document.body.classList.remove('swp')};setTimeout(done,500);
 requestAnimationFrame(function(){requestAnimationFrame(function(){r.box.scrollIntoView({block:'start',behavior:'auto'});r.box.setAttribute('tabindex','-1');try{r.box.focus({preventScroll:true})}catch(e){}r.box.classList.add('mk');done()})})}
function tgl(){var d=new Date();$('tgl2').textContent=$('tgl').textContent=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()]+', '+d.getDate()+' '+['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()]+' '+d.getFullYear()}
document.addEventListener('visibilitychange',function(){if(!document.hidden){tgl();upd(false)}});
$('fab').onclick=function(){if(rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}tab(1);$('add').onclick()};

var SALES=[],RM='d',RD=today(),RO=today().slice(0,7),MN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],DN=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function curP(r,o){var m=0;PRM.forEach(function(q){if(pst(q).k!='a'||!CFG[q.t])return;var a=0;if(CFG[q.t].c=='pr'&&q.p===r.id)a=q.a;else if(q.t=='pt'&&q.it){var z=q.it.filter(function(y){return y.p===r.id})[0];if(z)a=ptp(q,z,o.M)}if(a>0&&(!m||a<m))m=a});return m||o.L}
var VUSE={};
function sold(r){var o=calc(r);if(!o||o.err){toast('Stok dikurangi. Harga belum dihitung, penjualan tidak dicatat');return}
 var pm=curP(r,o),pa=(r.ha>0||r.hd>0)?actL(r,o.R):0,sr='ideal',p=pm;if(pm!=o.L)sr='promo';if(pa>0&&(sr!='promo'||pa<pm)){p=pa;sr='akt'}
 var u=fwdL(p,r,o.R).u,ui=fwdL(o.L,r,o.R).u,sl={i:uid(),t:Date.now(),d:today(),p:r.id,n:r.n||'(tanpa nama)',a:p,u:u,pi:o.L,ui:ui,sr:sr},vm='',vb=VUSE[r.id]?vbest(p,r):null;
 if(vb&&vb.q&&vb.q.x>0&&(vb.q.y||0)<vb.q.x){vb.q.y=(vb.q.y||0)+1;sl.vq=vb.q.id;VCC=null;GK=null;var sisa=vb.q.x-vb.q.y;vm=sisa>0?' Kuota voucher sisa '+sisa+'.':' Kuota voucher habis, harga di tab Hitung diperbarui.'}
 SALES.push(sl);if(SALES.length>SALES_MAX)SALES.splice(0,SALES.length-SALES_MAX);
 toast('Terjual 1'+(sr=='akt'?' (harga aktual)':'')+'. '+(u<0?'Rugi ':'Untung ')+rp(Math.abs(u))+vm)}
function fprod(id){return rows.filter(function(x){return x.id===id})[0]}
function sgrp(L){var M={},A2=[];L.forEach(function(s){var z=M[s.p];if(!z){z=M[s.p]={p:s.p,n:s.n,q:0,u:0};A2.push(z)}z.q++;z.u+=s.u;z.n=s.n});return A2}
var RLU={},RLT={};
function rlOn(id){return RLU[id]>Date.now()}
function rlSet(id,on){clearTimeout(RLT[id]);if(on){RLU[id]=Date.now()+10000;RLT[id]=setTimeout(function(){delete RLU[id];rlUi(id)},10100)}else delete RLU[id]}
function rlAll(){for(var k in RLT)clearTimeout(RLT[k]);RLU={};RLT={}}
function rlRow(id){var un=rlOn(id),e=esc(id);return '<div class="q4a"><button type="button" class="lkb'+(un?' on':'')+'" data-rl="'+e+'" aria-pressed="'+un+'" aria-label="'+(un?'Kunci tombol hapus':'Buka kunci tombol hapus')+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="'+(un?'M8 11V8a4 4 0 0 1 7.5-1.5':'M8 11V8a4 4 0 0 1 8 0v3')+'"/></svg></button><span class="q4h">'+(un?'Hapus terbuka 10 detik':'Hapus terkunci')+'</span><button type="button" class="btn gh q4d'+(un?'':' lkd')+'" data-del="'+e+'"'+(un?'':' aria-disabled="true"')+'>Hapus</button></div>'}
var RPL='';
function perS(){var m=RM=='m',k=m?RO:RD;return SALES.filter(function(s){return s.d.slice(0,k.length)==k})}
function bkHtml(){var un=rlOn('_bulk'),n=perS().length,t=SALES.length,dz=un?'':' lkd',ad=un?'':' aria-disabled="true"';
 return '<div class="q4l q4z"><div class="sn">Hapus data laporan</div><p class="tip" style="margin:0 0 8px">Terpisah dari kartu di atas. Buka gembok dulu, lalu pilih. Stok produk tidak dikembalikan. Ekspor CSV dulu bila perlu arsip.</p><div class="q4a" style="border:0;margin:0 0 8px;padding:0"><button type="button" class="lkb'+(un?' on':'')+'" data-rl="_bulk" aria-pressed="'+un+'" aria-label="'+(un?'Kunci hapus massal':'Buka kunci hapus massal')+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="'+(un?'M8 11V8a4 4 0 0 1 7.5-1.5':'M8 11V8a4 4 0 0 1 8 0v3')+'"/></svg></button><span class="q4h">'+(un?'Terbuka 10 detik':'Terkunci')+'</span></div><button type="button" class="btn gh q4d'+dz+'" data-bk="per"'+ad+' style="width:100%;margin:0 0 8px">Hapus penjualan periode ini ('+n.toLocaleString('id-ID')+')</button><div class="q4h" style="margin:-2px 0 10px">Periode: '+esc(RPL)+'</div><button type="button" class="btn gh q4d'+dz+'" data-bk="all"'+ad+' style="width:100%;margin:0">Hapus semua penjualan ('+t.toLocaleString('id-ID')+')</button></div>'}
function delSale(id){ask('Apakah yakin menghapus laporan ini? Stok produk dikembalikan 1 pcs.','Ya, hapus',function(){rlSet(id,false);var ix=SALES.map(function(s){return s.i}).indexOf(id);if(ix<0)return;var s=SALES.splice(ix,1)[0],r=fprod(s.p);if(s.vq){var pq=PRM.filter(function(x){return x.id===s.vq})[0];if(pq&&pq.y>0){pq.y--;VCC=null;GK=null}}if(r&&r.s!=null)setStock(r,r.s+1);else persist();rpt();toast('Penjualan dihapus')})}
function rlUi(id){if(id=='_bulk'){var z=$('rpv').querySelector('.q4z');if(z)z.outerHTML=bkHtml();return}
 var w=$('rpv').querySelector('[data-sid="'+id+'"]');if(!w)return;var a=w.querySelector('.q4a');if(a)a.outerHTML=rlRow(id);if(!rlOn(id)){var sp=w.parentNode;if(sp&&sp.classList){sp.classList.remove('op');w.style.transform=''}}}
function rpt(){var m=RM=='m',k=m?RO:RD,td=today(),S=SALES.filter(function(s){return s.d.slice(0,k.length)==k}),om=0,un=0,h='';
 if(!SALES.length){KDOM.setHTML($('rpv'), '<div class="q4l"><div class="empty">Belum ada penjualan. Di tab Etalase, tekan − pada produk setiap ada pesanan terjual. Penjualan tercatat otomatis lengkap dengan tanggal, harga jual, dan untung.</div></div>');return}
 S.forEach(function(s){om+=s.a;un+=s.u});
 var d0=new Date((m?k+'-15':k)+'T12:00:00'),lb=m?MN[d0.getMonth()]+' '+d0.getFullYear():(k==td?'Hari ini, ':'')+DN[d0.getDay()]+' '+d0.getDate()+' '+MN[d0.getMonth()].slice(0,3)+' '+d0.getFullYear(),nx=m?k>=td.slice(0,7):k>=td;
 RPL=lb;h+='<div class="seg"><button type="button" data-rm="d" aria-pressed="'+!m+'">Harian</button><button type="button" data-rm="m" aria-pressed="'+m+'">Bulanan</button></div>';
 h+='<div class="q4n"><button type="button" data-rn="-1" aria-label="Sebelumnya">&#8249;</button><b>'+lb+'</b><button type="button" data-rn="1" aria-label="Berikutnya"'+(nx?' disabled':'')+'>&#8250;</button></div>';
 h+='<div class="q4g"><div><span>Omzet</span><b>'+rp(om)+'</b></div><div><span>Untung aktual</span><b class="'+(un<0?'bad':'ok')+'">'+rp(un)+'</b></div><div><span>Terjual</span><b>'+S.length.toLocaleString('id-ID')+' pcs</b></div><div><span>Margin</span><b>'+(om>0?(un/om*100).toFixed(1).replace('.',','):'0')+'%</b></div></div>';
 var gs=0,gn=0;S.forEach(function(x){if(x.pi>0&&Math.round(x.pi)!=Math.round(x.a)){gs+=x.ui-x.u;gn++}});
 if(gn>0&&Math.round(gs)!=0)h+='<div class="q4l"><div class="rw" style="padding:0"><span>'+(gs>0?'Untung hilang karena harga di bawah ideal':'Untung lebih tinggi dari harga ideal')+' ('+gn+' penjualan)</span><b class="'+(gs>0?'bad':'ok')+'">'+rp(Math.abs(Math.round(gs)))+'</b></div></div>';
 if(!S.length)h+='<div class="q4l"><div class="empty">Tidak ada penjualan di periode ini.</div></div>';
 else if(!m){h+='<h2>Daftar penjualan</h2>';S.slice().sort(function(a,b){return b.t-a.t}).forEach(function(s){var t=new Date(s.t);
  var gp=(s.pi>0&&Math.round(s.pi)!=Math.round(s.a))?Math.round(s.ui-s.u):0,cm='';
  if(s.pi>0&&Math.round(s.pi)!=Math.round(s.a))cm='<div class="rw q4c" style="padding:4px 0 0"><span>'+({akt:'Harga aktual',promo:'Harga promo',ideal:'Harga'}[s.sr]||'Harga')+' '+rp(s.a)+' &middot; ideal '+rp(s.pi)+' ('+(s.ui<0?'rugi ':'untung ')+rp(Math.abs(s.ui))+')</span><b class="'+(gp>0?'bad':'ok')+'">'+(gp>0?'Selisih -'+rp(gp):gp<0?'Lebih +'+rp(-gp):'Selisih 0')+'</b></div>';
  h+='<div class="q4s"><button type="button" class="q4x" data-sw="'+esc(s.i)+'" aria-label="Hapus penjualan ini">Hapus</button><div class="q4l q4w" data-sid="'+esc(s.i)+'"><details><summary><div class="sn">'+esc(s.n)+'</div><div class="rw" style="padding:0"><span>'+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0')+' &middot; '+rp(s.a)+'</span><b class="'+(s.u<0?'bad':'ok')+'">'+(s.u<0?'Rugi ':'Untung ')+rp(Math.abs(s.u))+'</b></div>'+cm+'</summary>'
  +'<div class="fl"><label>Harga jual<small>Rp per pcs. Untung dihitung ulang</small></label><input data-ep="'+esc(s.i)+'" inputmode="numeric" value="'+Math.round(s.a)+'"></div><div class="fl"><label>Tanggal</label><input type="date" data-ed="'+esc(s.i)+'" value="'+esc(s.d)+'" max="'+td+'"></div></details>'+rlRow(s.i)+'</div></div>'})}
 else{var DY={},mx=1;S.forEach(function(s){var z=DY[s.d]||(DY[s.d]={q:0,u:0});z.q++;z.u+=s.u});Object.keys(DY).forEach(function(x){mx=Math.max(mx,Math.abs(DY[x].u))});
  h+='<h2>Per hari</h2>';Object.keys(DY).sort().reverse().forEach(function(x){var z=DY[x];h+='<div class="q4l"><div class="rw" style="padding:0"><span>'+(+x.slice(8))+' '+MN[+x.slice(5,7)-1].slice(0,3)+' &middot; '+z.q+' pcs</span><b class="'+(z.u<0?'bad':'ok')+'">'+rp(z.u)+'</b></div><div class="q4b" style="width:'+Math.max(3,Math.round(Math.abs(z.u)/mx*100))+'%"></div></div>'})}
 var T=sgrp(S).sort(function(a,b){return b.u-a.u}).slice(0,5);
 if(T.length){h+='<h2>Produk paling untung</h2>';T.forEach(function(z,ix){h+='<div class="q4l"><div class="sn">'+(ix+1)+'. '+esc(z.n)+'</div><div class="rw" style="padding:0"><span>'+z.q+' pcs &middot; rata-rata '+rp(z.u/z.q)+'/pcs</span><b class="'+(z.u<0?'bad':'ok')+'">'+rp(z.u)+'</b></div></div>'})}
 var cut=ymd(new Date(Date.now()-29*864e5)),fs=SALES.reduce(function(a,s){return s.d<a?s.d:a},'9999-99'),sp=Math.max(1,Math.min(30,Math.round((Date.now()-new Date(fs+'T12:00:00'))/864e5)+1)),F=sgrp(SALES.filter(function(s){return s.d>=cut})).sort(function(a,b){return b.q-a.q}).slice(0,5);
 if(F.length){h+='<h2>Stok cepat laku</h2><p class="tip" style="margin:0 0 8px">Berdasarkan '+sp+' hari terakhir.</p>';F.forEach(function(z){var r=fprod(z.p),rt=z.q/sp,note='',cl='';if(r&&r.s!=null){if(r.s<=0){note='Stok habis';cl='bad'}else{var dd=Math.floor(r.s/rt);note='Stok cukup &plusmn;'+dd+' hari';if(dd<7)cl='bad'}}
  h+='<div class="q4l"><div class="sn">'+esc(z.n)+'</div><div class="rw" style="padding:0"><span>'+z.q+' pcs &middot; '+rt.toFixed(1).replace('.',',')+'/hari</span><b class="'+cl+'">'+note+'</b></div></div>'})}
 h+='<div style="display:flex;gap:10px;margin-top:6px"><button type="button" class="btn gh" data-exp style="margin:0;flex:1">Unduh CSV Penjualan</button><button type="button" class="btn gh" data-excp style="margin:0;flex:1">Salin CSV</button></div><div id="cpbox" hidden style="margin-top:10px"><p class="tip" style="margin:0 0 6px">Browser memblokir akses clipboard. Teks CSV sudah dipilih di kotak di bawah: tekan Ctrl+C (atau tahan lalu pilih Salin di HP).</p><textarea id="cptx" readonly rows="6" aria-label="Teks CSV penjualan"></textarea><button type="button" class="btn gh" data-cpsel>Pilih semua teks</button></div><p class="tip" style="margin-top:10px">Untung dihitung dari tarif toko saat penjualan dicatat, bukan dari dana cair Shopee. Cocokkan dengan Rincian Penghasilan di Seller Centre.</p>';
 h+=bkHtml();
 KDOM.setHTML($('rpv'), h)}
$('v4').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var D=b.dataset;
 if(D.rm){RM=D.rm;rpt();return}
 if(D.rn){var n=+D.rn;if(RM=='m'){var d=new Date(RO+'-15T12:00:00');d.setMonth(d.getMonth()+n);RO=ymd(d).slice(0,7)}else{var d2=new Date(RD+'T12:00:00');d2.setDate(d2.getDate()+n);RD=ymd(d2)}rpt();return}
 if(D.exp!==undefined){var sr=salesRows();if(!sr){toast('Belum ada penjualan untuk diekspor');return}dl('penjualan-kalsara-'+today()+'.csv',csv(sr),'text/csv;charset=utf-8','Salin CSV',function(){showCpBox(csv(sr).replace(/^\ufeff/,''))});return}
 if(D.excp!==undefined){copySales();return}
 if(D.cpsel!==undefined){var ct=$('cptx');if(ct){ct.focus();ct.select()}return}
 if(D.rl){var on=!rlOn(D.rl);rlSet(D.rl,on);rlUi(D.rl);if(on)toast('Tombol hapus terbuka 10 detik');return}
 if(D.sw){if(!rlOn(D.sw)){toast('Terkunci. Ketuk ikon gembok dulu');return}delSale(D.sw);return}
 if(D.bk){if(!rlOn('_bulk')){toast('Terkunci. Ketuk ikon gembok dulu');return}var all=D.bk=='all',pl=perS(),n=all?SALES.length:pl.length;if(!n){toast('Tidak ada penjualan untuk dihapus');return}
  ask(all?'Hapus SEMUA '+n.toLocaleString('id-ID')+' catatan penjualan? Stok produk tidak dikembalikan dan data tidak bisa dipulihkan. Ekspor CSV dulu bila perlu arsip.':'Hapus '+n.toLocaleString('id-ID')+' catatan penjualan periode '+RPL+'? Stok produk tidak dikembalikan.','Ya, hapus',function(){rlSet('_bulk',false);if(all)SALES=[];else{var ids={};pl.forEach(function(x){ids[x.i]=1});SALES=SALES.filter(function(x){return !ids[x.i]})}persist();rpt();toast(n.toLocaleString('id-ID')+' catatan penjualan dihapus')});return}
 if(D.del){var id=D.del;if(!rlOn(id)){toast('Terkunci. Ketuk ikon gembok dulu');return}delSale(id)}});
/* geser kartu ke kiri untuk menampilkan tombol Hapus */
var SW=null,swMoved=0;
function swClose(ex){var a=$('rpv').querySelectorAll('.q4s.op');for(var i=0;i<a.length;i++)if(a[i]!==ex){a[i].classList.remove('op');a[i].querySelector('.q4w').style.transform=''}}
$('rpv').addEventListener('pointerdown',function(e){if(e.target.closest('.q4x'))return;var c=e.target.closest('.q4w');if(!c){swClose();return}if(e.target.closest('input,button,textarea,select,label'))return;var w=c.parentNode;swClose(w);SW={c:c,w:w,x:e.clientX,y:e.clientY,b:w.classList.contains('op')?-96:0,t:0,mv:false,id:e.pointerId}});
$('rpv').addEventListener('pointermove',function(e){if(!SW||e.pointerId!=SW.id)return;var dx=e.clientX-SW.x,dy=e.clientY-SW.y;if(!SW.mv){if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy))return;if(!rlOn(SW.c.dataset.sid)){SW=null;swMoved=Date.now();toast('Terkunci. Ketuk ikon gembok dulu');return}SW.mv=true;SW.w.classList.add('dr');try{SW.c.setPointerCapture(e.pointerId)}catch(x){}}SW.t=Math.max(-96,Math.min(0,SW.b+dx));SW.c.style.transform='translateX('+SW.t+'px)'});
function swEnd(){if(!SW)return;var q=SW;SW=null;if(!q.mv)return;q.w.classList.remove('dr');var o=q.t<-48;q.w.classList.toggle('op',o);q.c.style.transform=o?'translateX(-96px)':'';swMoved=Date.now()}
$('rpv').addEventListener('pointerup',swEnd);$('rpv').addEventListener('pointercancel',swEnd);
$('rpv').addEventListener('click',function(e){if(Date.now()-swMoved<400&&e.target.closest('.q4w')){e.preventDefault();e.stopPropagation()}},true);
$('v4').addEventListener('change',function(e){var t=e.target,id=t.dataset.ep||t.dataset.ed;if(!id)return;var s=SALES.filter(function(x){return x.i===id})[0];if(!s)return;
 if(t.dataset.ep){var p=num(t.value),r=fprod(s.p),o=r&&calc(r);if(!(p>0)||!o||o.err){toast(o&&!o.err?'Harga tidak valid':'Produk tidak ditemukan, harga tidak bisa diubah');rpt();return}s.a=p;s.u=fwdL(p,r,o.R).u}
 else{if(!t.value||t.value>today()){toast('Tanggal tidak valid');rpt();return}s.d=t.value}
 persist();rpt();toast('Penjualan diperbarui')});

var VF=[['fx','Biaya proses pesanan','Biaya proses pesanan'],['ad','Biaya administrasi','Kategori administrasi atau Tabel tarif'],['gx','Gratis Ongkir XTRA','Kategori Gratis Ongkir XTRA, tarif atau batas Rp'],['px','Promo XTRA','Promo XTRA (%) atau batas Rp'],['vl','Video/Live XTRA','Video XTRA atau Live XTRA'],['pay','Biaya pembayaran/layanan lain','Tipe toko dan biaya pembayaran'],['pm','Premi','Premi (%)'],['tx','PPh 22 (Pajak)','PPh 22 (%), atau 0 jika bebas']];
KDOM.setHTML($('vfi'), [['n','Jumlah barang dalam pesanan','Angka 1 atau lebih. Mengubahnya mengisi ulang harga produk dan voucher di bawah'],['L','Harga produk','Total semua barang, setelah diskon, sebelum voucher. Rp'],['v','Voucher dari penjual','Rp, isi 0 jika tidak ada']].concat(VF.map(function(x){return[x[0],x[1],'Rp']})).concat([['t','Total penghasilan','Dana yang diterima di Rincian Penghasilan. Rp']]).map(function(x){return'<div class="fl"><label for="vf_'+x[0]+'">'+x[1]+'<small>'+x[2]+'</small></label><input id="vf_'+x[0]+'" inputmode="numeric"></div>'}).join(''));
function vfOpt(){var h='<option value="">Pilih produk</option>';rows.forEach(function(r,i){if(r.m>0)h+='<option value="'+i+'">'+esc(r.n||'(tanpa nama)')+'</option>'});return h}
function vfFill(){var h=vfOpt();KDOM.setHTML($('vfp'), h);document.querySelectorAll('#vfxl select').forEach(function(e){var c=e.value;KDOM.setHTML(e, h);if(c&&e.querySelector('option[value="'+c+'"]'))e.value=c;if(e._sync)e._sync()});if($('vfp')._sync)$('vfp')._sync()}
function vfKeep(){var c=$('vfp').value;vfFill();if(c&&$('vfp').querySelector('option[value="'+c+'"]'))$('vfp').value=c;if($('vfp')._sync)$('vfp')._sync()}
$('vfd').addEventListener('toggle',function(){if(this.open)vfKeep()});
function vfN(){var n=Math.floor(num($('vf_n').value));return Math.min(Math.max(n,1),999)}
$('vf_n').value='1';
function vfLines(){var out=[],v=$('vfp').value;if(v!=='')out.push({r:rows[+v],n:vfN()});
 if($('vfm').checked)document.querySelectorAll('#vfxl .vfxr').forEach(function(d){var q=d.querySelector('select').value,n=Math.min(Math.max(Math.floor(num(d.querySelector('input.vq').value))||1,1),999);if(q!=='')out.push({r:rows[+q],n:n})});
 return out}
function vfAuto(){if(!$('vfa').checked)return;var ls=vfLines(),L=0,bad=!ls.length;ls.forEach(function(x){var o=calc(x.r);if(!o||o.err){bad=true;return}L+=o.L*x.n});if(bad)return;var vv=volt(L,ls[0].r)||0;$('vf_L').value=L;$('vf_v').value=vv;var w=$('vfn');w.hidden=false;
 w.textContent=ls.length>1?'Terisi otomatis dari harga '+ls.length+' produk sekarang (harga '+rp(L)+', voucher '+rp(vv)+'). Voucher diperkirakan dari total harga. Jika pesanan terjadi di harga lain, ganti angkanya atau matikan isi otomatis.':'Terisi otomatis dari harga produk sekarang (harga '+rp(L)+', voucher '+rp(vv)+'). Jika pesanan terjadi di harga lain, ganti angkanya atau matikan isi otomatis.'}
function vfCombo(sel,ph){
 var w=document.createElement('div');w.className='vfc';
 var inp=document.createElement('input');inp.type='text';inp.placeholder=ph||'Ketik untuk cari produk';inp.setAttribute('autocomplete','off');inp.setAttribute('autocapitalize','off');inp.setAttribute('spellcheck','false');inp.setAttribute('aria-label','Cari produk');
 var ul=document.createElement('ul');ul.className='vfcl';ul.hidden=true;
 sel.style.display='none';sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');sel.parentNode.insertBefore(w,sel);w.appendChild(inp);w.appendChild(ul);
 function hay(i){var r=rows[i],t=[];if(!r)return'';for(var k in r){var x=r[k];if(typeof x==='string'||typeof x==='number')t.push(x)}return t.join(' ').toLowerCase()}
 function sync(){inp.value=sel.selectedIndex>0?sel.options[sel.selectedIndex].text:''}
 function render(q){KDOM.setHTML(ul, '');var qs=q.toLowerCase().split(/\s+/).filter(Boolean),n=0;
  for(var i=1;i<sel.options.length;i++){var o=sel.options[i],h=hay(+o.value);if(qs.every(function(t){return h.indexOf(t)>=0})){var li=document.createElement('li');li.textContent=o.text;li.dataset.v=o.value;if(o.value===sel.value)li.className='on';ul.appendChild(li);n++}}
  if(!n){var e=document.createElement('li');e.className='em';e.textContent=q?'Tidak ada produk yang cocok':'Belum ada produk';ul.appendChild(e)}
  ul.hidden=false}
 function pick(v){sel.value=v;sync();ul.hidden=true;inp.blur();sel.dispatchEvent(new Event('change'))}
 inp.addEventListener('focus',function(){try{inp.select()}catch(e){}render('')});
 inp.addEventListener('input',function(){render(inp.value)});
 inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var f=ul.querySelector('li[data-v]');if(f)pick(f.dataset.v)}else if(e.key==='Escape'){ul.hidden=true;sync();inp.blur()}});
 inp.addEventListener('blur',function(){setTimeout(function(){ul.hidden=true;sync()},250)});
 ul.addEventListener('click',function(e){var li=e.target.closest('li');if(li&&li.dataset.v)pick(li.dataset.v)});
 sel._sync=sync;sync()}
function vfNum(){document.querySelectorAll('#vfxl .vt').forEach(function(e,i){e.textContent='Produk tambahan '+(i+1)})}
function vfAddRow(){var d=document.createElement('div');d.className='vfxr';
 KDOM.setHTML(d, '<div class="vt">Produk tambahan</div><select aria-label="Produk tambahan">'+vfOpt()+'</select><div class="vb"><label>Jumlah</label><input class="vq" inputmode="numeric" value="1" aria-label="Jumlah produk tambahan"><button class="btn gh" type="button" aria-label="Hapus produk ini">Hapus</button></div>');
 d.querySelector('button').onclick=function(){d.remove();vfNum();vfAuto()};
 var se=d.querySelector('select');se.onchange=vfAuto;d.querySelector('input.vq').addEventListener('input',vfAuto);
 $('vfxl').appendChild(d);vfCombo(se,'Ketik untuk cari produk');vfNum()}
function vfaState(){var c=$('vfa').checked,e=$('vfas');e.textContent=c?'Aktif':'Mati';e.classList.toggle('off',!c)}
try{$('vfa').checked=KStore.getItem('kalsara_vfauto')!=='0'}catch(e){}
vfaState();
$('vfa').addEventListener('change',function(){vfaState();try{KStore.setItem('kalsara_vfauto',this.checked?'1':'0')}catch(e){}if(this.checked){vfAuto()}else{$('vf_L').value='';$('vf_v').value='';$('vfn').hidden=true;toast('Isi sendiri harga dan voucher dari pesanan')}});
['vf_L','vf_v'].forEach(function(id){$(id).addEventListener('input',function(){$('vfn').hidden=true})});
$('vfp').onchange=vfAuto;$('vf_n').addEventListener('input',vfAuto);
$('vfm').addEventListener('change',function(){var on=this.checked;$('vfx').hidden=!on;$('vfmp').hidden=on;$('vfms').textContent=on?'Aktif':'Mati';$('vfms').classList.toggle('off',!on);if(on&&!$('vfxl').children.length)vfAddRow();vfAuto()});
vfCombo($('vfp'),'Ketik untuk cari produk');
$('vfxa').onclick=function(){if($('vfxl').children.length>=9){toast('Maksimal 10 produk per pesanan');return}vfAddRow()};
function vfRate(x){return x.toFixed(2).replace('.',',')+'%'}
function tlPush(t){var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk).slice();L.unshift({d:today(),t:String(t).slice(0,200)});A.tlog=L.slice(0,50);tlRender()}
function vgSync(){var v=A.ver,bad=!!(v&&!v.ok);$('vig').hidden=!(bad&&!v.ig);var gi=$('vigi');if(bad&&v.ig){gi.hidden=false;gi.textContent='Peringatan selisih ('+v.bad.join(', ')+') diabaikan pada '+dtx(v.ig.d)+'. Alasan: '+v.ig.w+'. Cek ulang dengan pesanan nyata untuk memastikan tarif sudah benar.'}else gi.hidden=true}
function vgOpen(){var v=A.ver;if(!v||v.ok||v.ig)return;dprev=document.activeElement;$('vgc').textContent='Selisih pada: '+v.bad.join(', ')+' (cek '+dtx(v.d)+').';$('vgr').value='';$('vge').hidden=true;$('vgd').hidden=false;inertBg(true);$('vgr').focus()}
function vgClose(){$('vgd').hidden=true;inertBg(false);var p=dprev;dprev=null;if(p&&p.focus)try{p.focus()}catch(e){}}
$('vig').onclick=vgOpen;$('vgn').onclick=vgClose;
$('vgy').onclick=function(){var v=A.ver;if(!v||v.ok||v.ig){vgClose();return}var t=$('vgr').value.trim();if(t.length<3){$('vge').hidden=false;$('vgr').focus();return}t=t.slice(0,120);v.ig={d:today(),w:t};tlPush('Peringatan selisih tarif diabaikan ('+v.bad.join(', ')+'). Alasan: '+t);vgClose();upd(true);toast('Peringatan diabaikan dan dicatat')};
document.querySelectorAll('[data-vgq]').forEach(function(b){b.addEventListener('click',function(){$('vgr').value=this.dataset.vgq;$('vge').hidden=true;$('vgr').focus()})});
$('vgd').addEventListener('keydown',function(e){if(e.key=='Escape')vgClose();else if(e.key=='Tab'){var f=[].slice.call($('vgd').querySelectorAll('textarea,button')),i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus()}});
$('vgd').addEventListener('click',function(e){if(e.target===this)vgClose()});

function gdOpen(n){var g=$('gd'),b=$('gdb');if(!b.firstChild)KDOM.copyChildren(b, $('gdtp'));if(g.hidden){dprev=document.activeElement;g.hidden=false;inertBg(true);g.scrollTop=0}
 b.querySelectorAll('details[data-ch]').forEach(function(d){d.open=false});
 if(n){var d=b.querySelector('details[data-ch="'+n+'"]');if(d){d.open=true;setTimeout(function(){d.scrollIntoView({block:'start'})},40)}}else g.scrollTop=0;
 if(n===0||g.dataset.f!=='1'){g.dataset.f='1';$('gdx').focus()}}
function gdClose(){var g=$('gd');if(g.hidden)return;g.hidden=true;g.dataset.f='';inertBg(false);var p=dprev;dprev=null;if(p&&p.focus)try{p.focus()}catch(e){}}
$('gdx').onclick=gdClose;
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-gd]');if(!b)return;e.preventDefault();gdOpen(+b.dataset.gd||0)});
document.addEventListener('keydown',function(e){if(e.key=='Escape'&&!$('gd').hidden)gdClose()});
function vfSrc(r,N,L,v,P,RT,ovr){
 var src=$('vfn').hidden?'diisi manual':'terisi otomatis dari produk';
 var T=[['Administrasi',RT.ad],['Gratis Ongkir XTRA',RT.gx],['Promo XTRA',RT.px],['Video/Live XTRA',RT.vl],['Pembayaran',RT.pay],['Premi',RT.pm],['PPh 22',RT.tx]].map(function(x){return x[0]+' '+vfRate(x[1])}).join(', ');
 return'<div class="stk" style="margin-top:8px"><b>Dasar hitungan aplikasi</b><br>Produk: '+esc(r.n||'(tanpa nama)')+' &middot; '+N+' barang<br>Harga '+rp(L)+' ('+src+'), voucher '+rp(v)+', harga setelah voucher '+rp(P)+'<br>Tarif yang dipakai (pengaturan toko sekarang): '+T+(ovr.length?'<br>Dikecualikan di pesanan ini (0%): '+ovr.join(', '):'')+'</div>'}
function vfSrc2(ls,N,L,v,P,RT,ovr){
 if(ls.length<2)return vfSrc(ls[0].r,N,L,v,P,RT,ovr);
 var src=$('vfn').hidden?'diisi manual':'terisi otomatis dari produk';
 var h='<div class="stk" style="margin-top:8px"><b>Dasar hitungan aplikasi (pesanan campuran)</b><br>Total '+N+' barang dari '+ls.length+' produk. Harga '+rp(L)+' ('+src+'), voucher '+rp(v)+', harga setelah voucher '+rp(P)+'. Harga dan voucher dibagi ke tiap produk sesuai proporsi harganya.';
 ls.forEach(function(x){var Q=x.Q;h+='<br>&bull; '+esc(x.r.n||'(tanpa nama)')+' &times;'+x.n+': harga '+rp(x.Li)+', Administrasi '+vfRate(Q.ad)+', Gratis Ongkir XTRA '+vfRate(Q.gx)+', Promo XTRA '+vfRate(Q.px)+', Video/Live XTRA '+vfRate(Q.vx+Q.lv)+', Premi '+vfRate(Q.pm)});
 h+='<br>Berlaku untuk semua: Pembayaran '+vfRate(A.pb)+', PPh 22 '+vfRate(A.pj)+(ovr.length?'<br>Dikecualikan di pesanan ini (0%): '+ovr.join(', '):'')+'</div>';return h}
function vfBtn(k,a,P,d,RT,r){
 if(!({ad:1,gx:1,px:1,pay:1,pm:1,tx:1})[k]||!(P>0))return'';
 if((k=='gx'&&$('vfog').value==='0')||(k=='px'&&$('vfop').value==='0'))return'';
 var pk={ad:'ad',gx:'gx',px:'px',pm:'pm'}[k];
 if(pk&&r&&r.o&&r.o[pk]!==null&&r.o[pk]!==undefined)return'<br>Produk ini punya tarif khusus. Ubah di "Tarif produk ini", bukan di pengaturan toko.';
 if(d<0&&({gx:1,px:1,pay:1})[k]&&RT[k]>0&&a>0)return'';
 if(k=='ad'&&a===0)return'';
 var v=Math.round(a/P*10000)/100;if(v>100)return'';
 var lb=a===0?(k=='px'||k=='gx'?'Set tidak ikut (0%)':'Set ke 0%'):'Pakai '+vfRate(v)+' dari pesanan ini';
 return'<br><button class="lk" type="button" data-vfa="'+k+'|'+v+'" style="margin-top:6px">'+lb+'</button> <small>(dihitung dari harga setelah voucher '+rp(P)+(!$('vfn').hidden?'; angka harga terisi otomatis, pastikan sama dengan pesanan':'')+')</small>'}
$('vfr').addEventListener('click',function(e){var b=e.target.closest('[data-vfa]');if(!b)return;var p=b.dataset.vfa.split('|'),k=p[0],v=Number(p[1]);if(isNaN(v)||v<0||v>100)return;
 var g=gfac()>0?gfac():100,nm;
 if(k=='ad'){A.ac='man';A.ad=v;nm='Administrasi'}
 else if(k=='gx'){if(v===0)A.gc='none';else{A.gc='man';A.gm=Math.min(100,Math.round(v*10000/g)/100)}nm='Gratis Ongkir XTRA'}
 else if(k=='px'){A.px=v;A.pp=v>0?'man':'no';syncVL();nm='Promo XTRA'}
 else if(k=='pay'){A.pb=v;nm='Biaya pembayaran'}
 else if(k=='pm'){A.pm=v;nm='Premi'}
 else if(k=='tx'){A.pj=v;nm='PPh 22'}
 else return;
 tlPush(nm+(v===0?' diatur tidak ikut (0%)':' diubah ke '+vfRate(v))+' mengikuti pesanan nyata');
 fill();upd(true);toast(nm+' diperbarui dari pesanan ini, mengecek ulang');$('vfg').click()});
$('vfg').onclick=function(){var ls=vfLines();if(!ls.length){toast('Pilih produk dulu');return}
 for(var q=0;q<ls.length;q++){var oo=calc(ls[q].r);if(!oo||oo.err){toast('Harga produk belum bisa dihitung'+(ls.length>1?': '+(ls[q].r.n||'(tanpa nama)'):''));return}ls[q].o=oo}
 var multi=ls.length>1,r=ls[0].r,o=ls[0].o;
 var g=function(k){var v=$('vf_'+k).value;return v.trim()===''?0:Math.max(0,num(v)||0)},L=g('L'),v=g('v'),T=g('t');if(!(L>0)){toast('Isi harga produk');return}
 var N=0,W=0,ovr=[],ovg=$('vfog').value==='0',ovp=$('vfop').value==='0',ovv=$('vfov').value==='0';
 if(ovg)ovr.push('Gratis Ongkir XTRA');if(ovp)ovr.push('Promo XTRA');if(ovv)ovr.push('Video/Live XTRA');
 ls.forEach(function(x){N+=x.n;x.w=x.o.L*x.n;W+=x.w});
 var Ls=0,Vs=0,P=0,sh=0,pmS=0,txS=0,E={fx:0,ad:0,gx:0,px:0,vl:0,pay:0,pm:0,tx:0},CAPD={gx:0,px:0,pay:0,vl:0},CAPK={gx:1,px:1,vl:1,pay:1};
 var cf=function(r,c,P2){return pr(r,P2)>c?c:0};
 ls.forEach(function(x,i){var last=i==ls.length-1;x.Li=last?L-Ls:Math.round(L*x.w/W);x.vi=last?v-Vs:Math.round(v*x.w/W);Ls+=x.Li;Vs+=x.vi;
  var Q=Object.assign({},x.o.R);['cg','cp','cvx','clv','cpb'].forEach(function(k){Q[k]=x.o.R[k]*x.n});if(ovg)Q.gx=0;if(ovp)Q.px=0;if(ovv){Q.vx=0;Q.lv=0}
  x.Q=Q;x.P=x.Li-x.vi;x.f=fees(x.P,Q);var b=x.f.b;
  P+=x.P;E.fx+=i==0?b.fx:0;E.ad+=b.ad;E.gx+=b.gx;E.px+=b.px;E.vl+=b.vx+b.lv;E.pay+=b.pay;E.pm+=x.f.pm;E.tx+=x.f.tax;
  sh+=x.f.sh-(i==0?0:b.fx);pmS+=x.f.pm;txS+=x.f.tax;
  CAPD.gx+=cf(Q.gx,Q.cg,x.P);CAPD.px+=cf(Q.px,Q.cp,x.P);CAPD.pay+=cf(A.pb,Q.cpb,x.P);CAPD.vl+=cf(Q.vx,Q.cvx,x.P)||cf(Q.lv,Q.clv,x.P)});
 var same=function(fn){var a=fn(ls[0].Q);return ls.every(function(x){return fn(x.Q)===a})?a:undefined};
 var RT={ad:same(function(Q){return Q.ad}),gx:same(function(Q){return Q.gx}),px:same(function(Q){return Q.px}),vl:same(function(Q){return Q.vx+Q.lv}),pay:A.pb,pm:same(function(Q){return Q.pm}),tx:A.pj},bad=[],h='',sa=0;
 VF.forEach(function(x){var k=x[0],e=E[k],a=g(k),d=a-e,wr=Math.abs(d)>Math.max(100,e*0.02);sa+=a;
  if(!wr){h+='<div class="rw"><span>'+x[1]+'</span><b class="ok">Cocok &middot; '+rp(a)+'</b></div>';return}
  bad.push(x[1]);var ra=P>0?a/P*100:0;
  h+='<div class="wn r"><b>'+x[1]+' meleset '+(d>0?'+':'-')+rp(Math.abs(d))+'</b><br>Aplikasi '+rp(e)+(RT[k]!==undefined?' ('+vfRate(RT[k])+')':'')+', aktual '+rp(a)+(RT[k]!==undefined?' (sekitar '+vfRate(ra)+' dari harga setelah voucher)':'')+'. Periksa: '+x[2]+'.'+(CAPD[k]?' Perkiraan aplikasi sudah dibatasi '+rp(CAPD[k])+' untuk '+N+' barang.':'')+(d<0&&RT[k]>0?' Jika biaya aktual lebih kecil, mungkin kena batas maksimum.':'')+(N>1&&CAPK[k]?' Pastikan jumlah barang ('+N+') benar, karena batas dihitung per barang.':'')+(multi?(({pay:1,tx:1})[k]?vfBtn(k,a,P,d,RT,null):(({ad:1,gx:1,px:1,pm:1})[k]?'<br><small>Pesanan campuran: tombol "Pakai ... dari pesanan ini" tidak tersedia karena tiap produk punya tarif sendiri. Cek produk yang dicurigai dengan pesanan satu jenis.</small>':'')):vfBtn(k,a,P,d,RT,r))+'</div>'});
 var et=P-sh-pmS-txS,tw=false;
 if(T>0){var un=(P-sa)-T;if(Math.abs(un)>Math.max(100,et*0.02)){tw=true;bad.push('Total penghasilan');
  h+='<div class="wn r"><b>Total penghasilan tidak cocok</b><br>Aplikasi memperkirakan '+rp(et)+', aktual '+rp(T)+'. '+(bad.length==1?'Semua komponen di atas cocok, jadi ada potongan lain di Rincian Penghasilan yang belum ada di aplikasi ('+rp(un)+').':'Selisih ini ikut dari komponen yang meleset.')+'</div>'}else h+='<div class="rw"><span>Total penghasilan</span><b class="ok">Cocok &middot; '+rp(T)+'</b></div>'}
 var ok=!bad.length,sv=ok&&!ovr.length;
 if(sv){A.ver={ok:true,d:today(),n:r.n||'',q:N,pn:r.n||'',ps:prodSig(o.R),sg:feeSig()};if(multi)A.ver.ml=ls.map(function(x){return{pn:x.r.n||'',ps:prodSig(x.o.R)}});A.tchk=today();$('tchk').value=A.tchk}
 else if(!ok&&!ovr.length)A.ver={ok:false,d:today(),bad:bad};
 h='<div class="wn '+(ok?'y':'r')+'" style="margin-top:12px">'+(ok?'Semua komponen cocok'+(N>1?' (untuk '+N+' barang'+(multi?' dari '+ls.length+' produk':'')+')':'')+'. '+(sv?'Tanggal cek tarif diperbarui ke hari ini. Hasil ini berlaku selama tarif toko tidak berubah.':'Pesanan ini dihitung tanpa '+ovr.join(' dan ')+', jadi tanggal cek tarif tidak diperbarui. Untuk memvalidasi pengaturan sekarang, cek satu pesanan yang benar-benar memakainya.'):'Ada '+bad.length+' selisih. Perbaiki lalu cek ulang dengan pesanan yang sama. '+(ovr.length?' Karena memakai pengecualian ('+ovr.join(', ')+'), hasil ini tidak disimpan sebagai peringatan di tab lain.':' Peringatan tampil di tab lain sampai kamu memperbaiki dan cek ulang berhasil, atau menekan "Abaikan peringatan ini" di bagian atas tab ini dan menulis alasannya.'))+'</div>'+vfSrc2(ls,N,L,v,P,RT,ovr)+'<div style="margin-top:6px">'+h+'</div>';
 KDOM.setHTML($('vfr'), h);upd(true)};

var PRM=[],PSEL='',PORD=['af','lv','pt','vc','fs','vi','pd','kh','hm'];
var CFG={af:{n:'Affiliate Marketing',p:1,a:['Komisi affiliate (%)','%'],c:'af'},lv:{n:'Shopee Live & Video',p:1},pt:{n:'Promo Toko',a:['Diskon bawaan semua produk (%)','%'],x:['Batas pembelian bawaan (pcs, kosong = tanpa batas)','n'],c:'pt'},vc:{n:'Voucher',jt:1,u:1,a:['Nilai voucher','m'],cp:['Maksimum potongan (Rp)','m'],b:['Min. belanja (Rp)','m'],x:['Kuota pemakaian (pcs)','n'],m:['Jumlah maks. per pembeli (pcs)','n'],y:['Sudah digunakan (pcs)','n'],c:'vc'},fs:{n:'Flash Sale Toko Saya',p:1,a:['Harga flash sale (Rp)','m'],b:['Stok flash sale (pcs)','n'],c:'pr'},vi:{n:'Voucher Ikuti Toko',p:1,u:1,a:['Nilai voucher','m'],cp:['Maksimum potongan (Rp)','m'],b:['Minimal belanja (Rp)','m'],c:'vi'},pd:{n:'Paket Diskon',p:1,tp:1,a:['Beli (pcs)','n'],b:['Nilai diskon','%'],x:['Batas pembelian per pembeli (paket)','n'],c:'pd'},kh:{n:'Kombo Hemat',c:'kh'},hm:{n:'Hadiah Min. Belanja',b:['Minimal belanja (Rp)','m'],x:['Stok hadiah (pcs, kosong = tanpa batas)','n'],c:'hm'}};
var IC={af:'<circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M9.2 10.8l5.6-3.6M9.2 13.2l5.6 3.6"/>',lv:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M10.5 11v5l4-2.5zM8 3.5L12 7l4-3.5"/>',pt:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',vc:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',fs:'<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M5 4L3 6M19 4l2 2"/>',vi:'<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',pd:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',hm:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8h14v-8M8 8a2.5 2.5 0 0 1 0-5c2 0 4 2 4 5 0-3 2-5 4-5a2.5 2.5 0 0 1 0 5"/>',kh:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'};
function migPt(q){if(q&&q.t=='pt'&&!Array.isArray(q.it)){q.it=q.p?[{p:q.p,h:q.a||0,d:0,l:0}]:[];q.a=0;q.p=''}if(q&&q.t=='kh'&&!Array.isArray(q.it)){q.mp=q.p?[q.p]:[];q.it=[q.p2,q.p3].filter(Boolean).map(function(id){return{p:id,d:0,h:0,l:0}});if(q.a>0)q.k=(q.k?q.k+' | ':'')+'Harga kombo lama Rp'+q.a;q.a=0;q.p=q.p2=q.p3=''}return q}
function ptp(p,z,M){var d=z.d>0?z.d:p.a,L=z.h>0?Math.round(z.h):(d>0?globalThis.KalsaraMoney.percentOfRupiah(M,100-d):0);return L>0?L:0}
function vdisc(p,L){if(p.u=='cb')return 0;if(p.u=='pct'){var v=pr(p.a,L);return p.cp>0?Math.min(v,Math.round(p.cp)):v}return Math.min(Math.round(p.a),L)}
function cbc(p,L){var v=pr(p.a,L);return p.cp>0?Math.min(v,Math.round(p.cp)):v}
function dd(a,b){return Math.round((new Date(b+'T00:00')-new Date(a+'T00:00'))/864e5)}
function pst(p){var t=today();if(!p.s&&!p.e)return{k:'a',t:'Berjalan (tanpa jadwal)'};
 if(p.e&&t>p.e)return{k:'e',t:'Berakhir'};
 if(p.s&&t<p.s){var d=dd(t,p.s);return{k:'u',t:d==1?'Mulai besok':'Mulai '+d+' hari lagi'}}
 var d2=p.e?dd(t,p.e):null;return{k:'a',t:d2===null?'Berjalan':d2===0?'Berakhir hari ini':'Berjalan, sisa '+d2+' hari'}}
function rw(l,v,c){return '<div class="rw">'+l+'<b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div>'}
/*5.39: voucher otomatis. Hanya Voucher Toko dan Voucher Produk berjalan (bukan cashback, bukan Live/Video, kuota belum habis) yang ikut memengaruhi harga di tab Hitung.*/
var VCC=null;GK=null;
/*5.68: Promosi tidak memicu hitung ulang tab Hitung. psig() = tanggal + isi semua promosi. upd() mencatatnya di PSIG; tab() menghitung ulang hanya bila psig() berbeda (promosi berubah, kuota voucher bertambah, atau tanggal berganti).*/
var PSIG='';
function psig(){try{return today()+'|'+JSON.stringify(PRM)}catch(e){return''}}
function vcList(){var d=today();if(!VCC||VCC.d!==d){VCC={d:d,a:[]};PRM.forEach(function(q){if(!q||q.t!='vc')return;var jt=q.jt||'toko';if(jt=='live'||jt=='video'||q.u=='cb'||!(q.a>0))return;if(pst(q).k!='a')return;if(q.x>0&&(q.y||0)>=q.x)return;VCC.a.push(q)})}return VCC.a}
function vcApply(q,r){if((q.jt||'toko')=='toko')return true;return !!(r&&r.id)&&[q.p,q.p2,q.p3].indexOf(r.id)>=0}
function vcLab(q){return((q.jt||'toko')=='produk'?'Voucher Produk ':'Voucher Toko ')+(q.u=='pct'?fmt(q.a)+'%':rp(q.a))+(q.n?' ('+q.n+')':'')}
function vcBest(L,r){var b=null;vcList().forEach(function(q){if(!vcApply(q,r))return;if(q.b>0&&L<q.b)return;var d=vdisc(q,L);if(d>0&&(!b||d>b.v))b={v:d,s:vcLab(q),q:q}});return b}
function vcBad(r){return vcList().some(function(q){return vcApply(q,r)&&q.u=='pct'&&q.a>=100})}
function calcNV(r){VNO=1;try{return calc(r)}finally{VNO=0}}
function vcThr(r){var t=[];vcList().forEach(function(q){if(vcApply(q,r)&&q.b>0&&t.indexOf(q.b)<0)t.push(q.b)});return t.sort(function(x,y){return x-y})}
function vsc(r,o){var out=[];if(!o||o.err||!(o.L>0))return out;
 vcList().forEach(function(q){if(!vcApply(q,r)||!(q.b>0)||o.L>=q.b)return;
  var N=Math.max(Math.ceil(q.b/o.L),1),r2=Object.assign({},r,{q:(r.q>0?r.q:1)*N}),R2=Object.assign({},o.R,{cg:o.R.cg*N,cp:o.R.cp*N,cvx:o.R.cvx*N,clv:o.R.clv*N,cpb:o.R.cpb*N}),Lt=o.L*N,f=fwdV(Lt,vdisc(q,Lt),r2,R2),tg=(r.t||0)*N;
  out.push({q:q,N:N,u:f.u,tg:tg,lv:f.u<0?'r':f.u<tg?'y':''})});
 return out}
function vscT(x,o){return esc(vcLab(x.q))+' belum terpakai di 1 pcs (harga '+rp(o.L)+', min. belanja '+rp(x.q.b)+'). Jika pembeli beli '+x.N+' pcs agar voucher terpakai: '+(x.u<0?'rugi '+rp(-x.u):'untung '+rp(x.u))+' per pesanan'+(x.lv=='y'?' (di bawah target '+rp(x.tg)+')':'')+'.'}
function vscn(r,o){var lv='',h='';vsc(r,o).filter(function(x){return x.lv}).forEach(function(x){if(x.lv=='r')lv='r';else if(!lv)lv='y';h+='<div class="wn '+x.lv+'">&#9888; '+vscT(x,o)+'</div>'});return{lv:lv,h:h}}
function vnote(o,r){var h='',ls=[];try{ls=vcList().filter(function(q){return vcApply(q,r)})}catch(e){}
 if(o&&o.v>0){h+='<div class="stk" style="margin:6px 2px">Voucher dihitung: '+esc(o.vs||'Voucher toko')+(ls.length>1?'. Pembeli otomatis memakai yang paling hemat dari '+ls.length+' voucher berjalan.':'.')+'</div>';
  var nv=calcNV(r);if(nv&&!nv.err&&nv.L<o.L)h+='<div class="stk" style="margin:6px 2px">Harga jual tanpa voucher '+rp(nv.L)+', dengan voucher '+rp(o.L)+' (naik '+rp(o.L-nv.L)+').'+(o.vq&&o.vq.e?' Voucher berakhir '+dtx(o.vq.e)+', setelah itu harga bisa diturunkan.':'')+'</div>'}
 vsc(r,o).slice(0,3).forEach(function(x){h+='<div class="stk" style="margin:6px 2px">'+vscT(x,o)+'</div>'});
 return h}
function vcSoon(q){var m=[];if(q.e){var d=dd(today(),q.e);if(d<=2)m.push('Berakhir '+(d<=0?'hari ini':d==1?'besok':'2 hari lagi')+'.')}
 if(q.x>0){var sisa=q.x-(q.y||0);if(sisa>0&&sisa<=Math.ceil(q.x*0.2))m.push('Sisa kuota '+sisa+' dari '+q.x+'.')}return m}
function vwarn(){var w=$('vw');if(!w)return;var m=[];
 vcList().forEach(function(q){var t=vcSoon(q);if(t.length)m.push(esc(vcLab(q))+': '+t.join(' '))});
 if(!m.length){w.hidden=true;return}
 w.hidden=false;KDOM.setHTML(w, '&#9888; Voucher hampir selesai. '+m.join(' ')+' Siap-siap turunkan harga di Shopee setelahnya (lihat &quot;Harga jual tanpa voucher&quot; di tiap produk). <button class="lk" type="button" data-go="vc">Buka Voucher</button>')}
function vcWhy(p){var jt=p.jt||'toko';
 if(jt=='live')return 'Voucher Live hanya berlaku di Shopee Live, jadi tidak mengubah harga utama di tab Hitung.';
 if(jt=='video')return 'Voucher Video hanya berlaku di Shopee Video, jadi tidak mengubah harga utama di tab Hitung.';
 if(p.u=='cb')return 'Cashback koin tidak menurunkan harga yang dibayar pembeli, jadi tidak ikut dipilih otomatis di tab Hitung.';
 var s=pst(p);
 if(s.k=='u')return 'Voucher ini belum dimulai, jadi belum dipakai di tab Hitung. Hitungan di atas hanya simulasi.';
 if(s.k=='e')return 'Voucher ini sudah berakhir, jadi tidak dipakai di tab Hitung.';
 if(p.x>0&&(p.y||0)>=p.x)return 'Kuota habis (sudah digunakan sama dengan kuota), jadi tidak dipakai di tab Hitung.';
 if(jt=='produk'&&![p.p,p.p2,p.p3].some(Boolean))return 'Pilih produk agar voucher ini berlaku di tab Hitung.';
 return ''}
function vcEff(p,n,win,los,nmn){var w=vcWhy(p);if(w)return pinfo(w);
 return rw('Dipakai otomatis di tab Hitung',win+' dari '+n+' produk',win?'ok':'')+(los?rw('Kalah dari voucher yang lebih hemat',los+' produk'):'')+(nmn?rw('Min. belanja belum terpenuhi (1 pcs)',nmn+' produk'):'')+(vcSoon(p).length?pinfo(vcSoon(p).join(' ')+' Siap-siap turunkan harga produk di Shopee setelah voucher selesai.'):'')}


function fwdV(L,v,r,R){var P=Math.max(globalThis.KalsaraMoney.safeMoneySum([L,-v]),0),f=fees(P,R),s=globalThis.KalsaraMoney.safeMoneySum([P,-f.sh,-f.pm,-f.tax,-f.ads,-f.rt,-A.og]);return{L:L,v:v,P:P,sh:f.sh,pm:f.pm,tax:f.tax,ads:f.ads,rt:f.rt,s:s,u:globalThis.KalsaraMoney.safeMoneySum([s,-tmod(r)])}}
function bis(ok){var hi=1;while(!ok(hi)){hi*=2;if(hi>1e9)return null}var lo=0;while(hi-lo>1){var m=Math.floor((lo+hi)/2);if(ok(m))hi=m;else lo=m}return hi}
function pinfo(t){return'<div class="wn i">'+t+'</div>'}
function pcalc2(p,r,o){var c=CFG[p.t];
 if(c.c=='vi'){if(!(p.a>0))return pinfo('Isi nilai voucher untuk melihat hitungan untung.');
  var vf=function(L){return vdisc(p,L)},v0=vf(o.L),q=fwdV(o.L,v0,r,o.R),x=warns(q,true),mn=p.b||0,im=bis(function(L){for(var k=0;k<=5;k++)if(fwdV(L+k,vf(L+k),r,o.R).u<0)return false;return true});
  return '<div class="res">'+rw('Harga akhir produk',rp(o.L))+rw('Voucher ikuti toko'+(p.u=='pct'?' ('+fmt(p.a)+'%)':''),'- '+rp(v0))+rw('Harga setelah voucher',rp(q.P))+rw('Saldo masuk toko',rp(q.s))+rw('Modal + Management Partner + packing',rp(tmod(r)))+rw(q.u<0?'Rugi bersih':'Untung bersih',(q.u<0?'- ':'')+rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',pc1(x.m)+'%')+(im===null?'':rw('Harga akhir minimal agar tidak rugi',rp(im)))+WN(x)+(mn>0&&o.L<mn?pinfo('Harga 1 pcs di bawah minimal belanja ('+rp(mn)+'). Voucher baru terpakai jika pembeli membeli minimal '+Math.ceil(mn/o.L)+' pcs. Hitungan di atas untuk 1 pcs.'):'')+pinfo('Dihitung menggantikan voucher toko di panel Voucher.')+'</div>'}
 return''}
function actPromo(r,o){var pm=null;PRM.forEach(function(q){if(pst(q).k!='a'||!CFG[q.t])return;var a=0;if(CFG[q.t].c=='pr'&&q.p===r.id)a=q.a;else if(q.t=='pt'&&q.it){var iz=q.it.filter(function(z){return z.p===r.id})[0];if(iz)a=ptp(q,iz,o.M)}if(!(a>0))return;if(!pm||a<pm.a)pm={a:a,t:q.t}});return pm}
function pgm(p){var h='<div class="pit">'+pinfo('Pembeli yang belanja minimal nilai di atas dari produk utama mendapat 1 hadiah gratis. Biaya hadiah (modal + Management Partner + packing) ditanggung toko. Pembeli memilih salah satu produk hadiah.')+'<div class="pith">Produk utama</div>';
 (p.mp||[]).forEach(function(id,ix){var r=rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-mi="'+ix+'"><div class="pin"><span>'+esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-kmdel aria-label="Hapus produk utama">&#10005;</button></div></div>'});
 h+='<select data-kmadd aria-label="Tambah produk utama"><option value="">+ Tambah produk utama</option>'+rows.filter(function(r){return (p.mp||[]).indexOf(r.id)<0}).map(function(r){return '<option value="'+esc(r.id)+'">'+esc((r.n||'(tanpa nama)')+(r.live?' • live':''))+'</option>'}).join('')+'</select><div class="pith" style="margin-top:12px">Produk hadiah</div>';
 (p.gf||[]).forEach(function(id,ix){var r=rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-gi="'+ix+'"><div class="pin"><span>'+esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-gfdel aria-label="Hapus produk hadiah">&#10005;</button></div></div>'});
 return h+'<select data-gfadd aria-label="Tambah produk hadiah"><option value="">+ Tambah produk hadiah</option>'+rows.filter(function(r){return (p.gf||[]).indexOf(r.id)<0}).map(function(r){return '<option value="'+esc(r.id)+'">'+esc(r.n||'(tanpa nama)')+'</option>'}).join('')+'</select></div>'}
document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-gfadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.gf=x.p.gf||[]).push(t.value);persist();prRender()});
document.addEventListener('click',function(e){var d=e.target.closest&&e.target.closest('[data-gfdel]');if(!d)return;var x=ptc(e);if(!x)return;x.p.gf.splice(+d.closest('.pii').dataset.gi,1);persist();prRender()});
function phm(p){var gr=function(id){return rows.filter(function(x){return x.id===id})[0]},mains=(p.mp||[]).map(gr).filter(Boolean),gifts=(p.gf||[]).map(gr).filter(Boolean),mn=p.b||0;
 if(!mains.length)return pinfo('Pilih minimal 1 produk utama.');
 if(!(mn>0))return pinfo('Isi minimal belanja untuk melihat hitungan untung.');
 if(!gifts.length)return pinfo('Pilih minimal 1 produk hadiah. Biaya hadiah ditanggung toko.');
 var gc=gifts.map(function(g){return{r:g,c:tmod(g)}}),nog=gc.filter(function(g){return !(g.c>0)}).length,mx=Math.max.apply(null,gc.map(function(g){return g.c})),h='',bad=0,thin=0,n=0;
 mains.forEach(function(r){var o=calc(r),nm=esc(r.n||'(tanpa nama)');
  if(!o||o.err){h+='<div class="stk" style="margin:6px 2px">'+nm+': '+(o&&o.err?'harga belum bisa dihitung, periksa tab Hitung.':'modal belum diisi di tab Hitung.')+'</div>';return}
  var pm=actPromo(r,o),L=pm?pm.a:o.L;if(!(L>0))return;
  var N=Math.max(Math.ceil(mn/L),1),r2=Object.assign({},r,{q:(r.q>0?r.q:1)*N}),R2=Object.assign({},o.R,{cg:o.R.cg*N,cp:o.R.cp*N,cvx:o.R.cvx*N,clv:o.R.clv*N,cpb:o.R.cpb*N}),
  q=fwdL(L*N,r2,R2),ut=q.u-mx,x=warns({u:ut,P:q.P,sh:q.sh,pm:q.pm,tax:q.tax},true);
  n++;if(ut<0)bad++;else if(x.lv)thin++;
  h+='<div class="pit2"><b>'+nm+'</b>'+rw('Dijual di harga',rp(L)+(pm?' ('+esc(CFG[pm.t].n)+' berjalan)':''))+rw('Pembeli perlu beli',N+' pcs (total '+rp(L*N)+')')+rw('Untung sebelum hadiah',(q.u<0?'- ':'')+rp(Math.abs(q.u)),q.u<0?'bad':'')
   +gc.map(function(g){var u=q.u-g.c;return rw('Untung jika hadiah: '+esc((g.r.n||'(tanpa nama)').slice(0,24)),(u<0?'- ':'')+rp(Math.abs(u)),u<0?'bad':'ok')}).join('')
   +rw('Margin (hadiah termahal)',pc1(x.m)+'%')+WN(x)+'</div>'});
 if(!n)return pinfo('Modal produk utama belum diisi di tab Hitung.');
 return '<div class="res">'+rw('Produk utama dihitung',n)+rw('Rugi dengan hadiah termahal',bad,bad?'bad':'ok')+rw('Untung tipis',thin)+h
  +(p.x>0?rw('Estimasi biaya hadiah maks. (stok '+p.x.toLocaleString('id-ID')+' x hadiah termahal)',rp(p.x*mx)):'')
  +(nog?pinfo(nog+' produk hadiah belum diisi modalnya di tab Hitung, jadi biayanya dihitung Rp0.'):'')
  +pinfo('Hitungan per 1 pesanan: pembeli membeli produk utama sebanyak yang dibutuhkan untuk mencapai minimal belanja (harga promo berjalan dipakai jika ada), lalu mendapat 1 hadiah. Hadiah gratis, jadi hanya biaya modal, Management Partner, dan packing hadiah yang dihitung. Cocokkan aturan terbaru di Seller Centre.')+'</div>'}
function pkombo(p){var gr=function(id){return rows.filter(function(x){return x.id===id})[0]},mains=(p.mp||[]).map(gr).filter(Boolean),it=p.it||[];
 if(!mains.length)return pinfo('Pilih minimal 1 produk utama.');if(!it.length)return pinfo('Tambah produk tambahan dan atur diskonnya. Diskon tiap produk boleh berbeda.');
 var ex=A.og+(A.fb=='yes'?A.fl:0),h='',bad=0,thin=0,n=0,mu=mains.map(function(r){var o=calc(r);if(!o||o.err)return null;var pm=actPromo(r,o),L=pm?pm.a:o.L,q=fwdL(L,r,o.R);return{r:r,u:q.u,L:L,pn:pm?CFG[pm.t].n:''}}).filter(Boolean);
 it.forEach(function(z){var r=gr(z.p);if(!r)return;var o=calc(r),nm=esc(r.n||'(tanpa nama)');
  if(!o||o.err){h+='<div class="stk" style="margin:6px 2px">'+nm+': '+(o&&o.err?'harga belum bisa dihitung, periksa tab Hitung.':'modal belum diisi di tab Hitung.')+'</div>';return}
  var M=o.M,Lp=ptp(p,z,M);if(!(Lp>0)){h+='<div class="stk" style="margin:6px 2px">'+nm+': isi diskon atau harga kombo.</div>';return}
  n++;var q=fwdL(Lp,r,o.R),ui=q.u+ex,x=warns({u:ui,P:Lp,sh:q.sh,pm:q.pm,tax:q.tax},true),dp=Math.floor((M-Lp)/M*1000)/10,
  mT=bis(function(L){for(var k=0;k<=5;k++)if(fwdL(L+k,r,o.R).u+ex<r.t)return false;return true}),
  mI=bis(function(L){for(var k=0;k<=5;k++)if(fwdL(L+k,r,o.R).u+ex<0)return false;return true}),
  dt=function(m){return m===null?'tidak bisa dihitung':(m>=M?0:Math.floor((M-m)/M*100))+'% (harga '+rp(m)+')'};
  if(ui<0)bad++;else if(x.lv)thin++;
  h+='<div class="pit2"><b>'+nm+'</b>'+rw('Harga asli (listing)',rp(M))+rw('Harga kombo',rp(Lp)+(dp>0?' (-'+fmt(dp)+'%)':''))+rw(ui<0?'Rugi dari produk tambahan':'Untung dari produk tambahan',(ui<0?'- ':'')+rp(Math.abs(ui)),ui<0?'bad':'ok')+rw('Margin',pc1(x.m)+'%')
   +mu.map(function(m){var t=m.u+ui;return rw('Untung paket dengan '+esc((m.r.n||'(tanpa nama)').slice(0,22))+' (utama dijual '+rp(m.L)+(m.pn?', '+m.pn+' berjalan':'')+')',(t<0?'- ':'')+rp(Math.abs(t)),t<0?'bad':'ok')}).join('')
   +rw('Diskon maks. agar target tercapai',dt(mT))+rw('Diskon maks. agar tidak rugi',dt(mI))+(z.l>0?rw('Batas pembelian',z.l+' pcs'):'')
   +(Lp>=o.L?pinfo('Harga kombo tidak lebih murah dari harga akhir produk ini saat ini ('+rp(o.L)+'), jadi pembeli tidak terdorong membeli paket.'):'')+WN(x)+'</div>'});
 return '<div class="res">'+rw('Produk tambahan dihitung',n)+rw('Rugi dari produk tambahan',bad,bad?'bad':'ok')+rw('Untung tipis',thin)+h+pinfo('Perkiraan untuk 1 produk utama + 1 produk tambahan dalam satu pesanan. Ongkir dan biaya proses pesanan dihitung sekali. Produk utama dijual di harga yang sedang berlaku: harga Promo Toko atau Flash Sale yang berjalan, atau harga akhir biasa (harga coret setelah diskon) jika tidak ada promo aktif. Bukan harga asli.')+'</div>'}

function pvoucher(p){var jt=p.jt||'toko',vf=function(L){return vdisc(p,L)};
 if(!(p.a>0))return pinfo('Isi nilai voucher untuk melihat hitungan untung.');
 var rs=jt=='toko'?rows.filter(function(r){return r.m>0}):[p.p,p.p2,p.p3].filter(Boolean).map(function(id){return rows.filter(function(x){return x.id===id})[0]}).filter(Boolean),h='<div class="res">',ks=p.x>0?p.x:0,us=p.y||0;
 if(ks){h+=rw('Kuota',ks.toLocaleString('id-ID')+' pcs')+rw('Sudah digunakan',us.toLocaleString('id-ID')+' pcs')+rw('Tersisa',Math.max(ks-us,0).toLocaleString('id-ID')+' pcs');var un=(p.u=='pct'||p.u=='cb')?(p.cp>0?p.cp:0):p.a;if(un>0)h+=rw('Estimasi pengeluaran maks. (kuota x '+((p.u=='pct'||p.u=='cb')?'maks. potongan':'nilai')+')',rp(ks*un))+rw('Pengeluaran terpakai (maks.)',rp(us*un))+(p.m>0?rw('Maks. per pembeli ('+p.m+' pcs)',rp(p.m*un)):'');else if(p.u=='pct'||p.u=='cb')h+=pinfo('Isi maksimum potongan untuk melihat estimasi pengeluaran.')}
 if(!rs.length)return h+pinfo(jt=='toko'?'Belum ada produk dengan modal terisi di tab Hitung.':'Pilih produk untuk melihat hitungan untung.')+'</div>';
 var bad=[],thin=0,n=0,ln='',win=0,los=0,nmn=0,act=vcList().indexOf(p)>=0;
 rs.forEach(function(r){var o=calc(r);if(!o||o.err)return;n++;if(act){if(o.vq===p)win++;else if(p.b>0&&o.L<p.b)nmn++;else if(o.v>0)los++}var v=vf(o.L),q=fwdV(o.L,v,r,o.R);if(p.u=='cb'){var cc=cbc(p,o.L);q.u-=cc;q.s-=cc}var x=warns(q,true);
  if(q.u<0)bad.push(r.n||'(tanpa nama)');else if(x.lv)thin++;
  if(jt!='toko')ln+=rw(esc(r.n||'(tanpa nama)'),(q.u<0?'Rugi ':'Untung ')+rp(Math.abs(q.u))+' ('+pc1(x.m)+'%)',q.u<0?'bad':(q.u<A.wu||x.m<A.wm)?'':'ok')+(p.b>0&&o.L<p.b?'<div class="stk" style="margin:0 2px">Min. belanja '+rp(p.b)+': perlu '+Math.ceil(p.b/o.L)+' pcs</div>':'')});
 if(!n)return h+pinfo('Modal produk belum diisi di tab Hitung.')+'</div>';
 if(jt=='toko')h+=rw('Produk dihitung',n)+rw('Rugi dengan voucher ini',bad.length,bad.length?'bad':'ok')+(bad.length?'<div class="stk" style="margin:0 2px">'+bad.slice(0,5).map(esc).join(', ')+(bad.length>5?' dan '+(bad.length-5)+' lainnya':'')+'</div>':'')+rw('Untung tipis',thin);else h+=ln;
 return h+vcEff(p,n,win,los,nmn)+pinfo((p.u=='cb'?'Cashback koin: harga pembeli tidak berubah, biaya cashback ditanggung toko dan dikurangkan dari untung (perkiraan, cocokkan dengan aturan Shopee). ':'')+'Voucher Toko dan Voucher Produk yang berjalan otomatis dipakai di tab Hitung bila paling hemat bagi pembeli (diasumsikan satu voucher per pesanan). Hitungan di atas mengandaikan pembeli memakai voucher ini.')+'</div>'}

function pun(p,k){var c=CFG[p.t];if(c.u&&k=='a')return(p.u=='pct'||p.u=='cb')?'%':'m';if(c.c=='pd'&&k=='b')return (p.tp||'pct')=='pct'?'%':'m';return c[k][1]}
function ppd(p,r,o){var N=Math.max(Math.round(p.a||0),1),tp=p.tp||'pct',v=p.b||0;
 if(!(p.a>0))return pinfo('Isi jumlah beli untuk melihat hitungan untung.');
 if(!(v>0))return pinfo(tp=='hrg'?'Isi harga paket diskon.':'Isi nilai diskon.');
 var base=o.L*N,Lp=Math.max(tp=='pct'?Math.floor(base*(100-v)/100+1e-7):tp=='nom'?base-v:v,0),
 r2=Object.assign({},r,{q:(r.q>0?r.q:1)*N}),R2=Object.assign({},o.R,{cg:o.R.cg*N,cp:o.R.cp*N,cvx:o.R.cvx*N,clv:o.R.clv*N,cpb:o.R.cpb*N}),
 q=fwdL(Lp,r2,R2),x=warns(q,true),hm=base-Lp,im=bis(function(L){for(var k=0;k<=5;k++)if(fwdL(L+k,r2,R2).u<0)return false;return true});
 return '<div class="res">'+rw('Beli',N+' pcs')+rw('Harga normal ('+N+' pcs)',rp(base))+rw('Harga paket',rp(Lp))+rw('Harga per pcs',rp(Math.round(Lp/N)))+rw('Hemat untuk pembeli',hm>0?rp(hm)+' ('+pc1(hm/base*100)+'%)':'tidak ada')+(q.v?rw('Voucher toko','- '+rp(q.v)):'')+rw('Saldo masuk toko',rp(q.s))+rw('Modal ('+N+' pcs + Management Partner + packing)',rp(tmod(r2)))+rw(q.u<0?'Rugi bersih per paket':'Untung bersih per paket',(q.u<0?'- ':'')+rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',pc1(x.m)+'%')+(im===null?'':rw('Harga paket minimal agar tidak rugi',rp(im)))+(p.x>0?rw('Untung per pembeli (batas '+p.x+' paket)',(q.u<0?'- ':'')+rp(Math.abs(q.u)*p.x),q.u<0?'bad':''):'')+WN(x)+pinfo('Modal dihitung per pesanan: modal x '+N+' pcs, ditambah biaya Management Partner dan packing sekali.')+'</div>'}
function pdet(p,z){var r=rows.filter(function(x){return x.id===z.p})[0];if(!r)return{h:''};var o=calc(r),nm=esc(r.n||'(tanpa nama)');
 if(!o||o.err)return{h:'<div class="stk" style="margin:6px 2px">'+(o&&o.err?'Harga belum bisa dihitung, periksa tab Hitung.':'Modal belum diisi di tab Hitung.')+'</div>'};
 var M=o.M,Lp=ptp(p,z,M);if(!(Lp>0))return{h:'<div class="stk" style="margin:6px 2px">Isi diskon atau harga promo.</div>'};
 var q=fwdL(Lp,r,o.R),x=warns(q,true),dp=Math.floor((M-Lp)/M*1000)/10,lim=z.l>0?z.l:(p.x>0?p.x:0),
 mT=bis(function(L){for(var k=0;k<=5;k++)if(fwdL(L+k,r,o.R).u<r.t)return false;return true}),
 mI=bis(function(L){for(var k=0;k<=5;k++)if(fwdL(L+k,r,o.R).u<0)return false;return true}),
 dt=function(m){return m===null?'tidak bisa dihitung':(m>=M?0:Math.floor((M-m)/M*100))+'% (harga '+rp(m)+')'};
 return{n:1,u:q.u,bad:q.u<0?1:0,thin:(q.u>=0&&x.lv)?1:0,h:'<div class="pit2"><b>'+nm+'</b>'+rw('Harga asli (listing)',rp(M))+rw('Harga promo',rp(Lp)+(dp>0?' (-'+fmt(dp)+'%)':''))+rw(q.u<0?'Rugi bersih':'Untung bersih',(q.u<0?'- ':'')+rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',pc1(x.m)+'%')+rw('Diskon maks. agar target tercapai',dt(mT))+rw('Diskon maks. agar tidak rugi',dt(mI))+(lim?rw('Batas pembelian',lim+' pcs'):'')+WN(x)+'</div>'}}
function ppt(p){var it=p.it||[];if(!it.length)return pinfo('Tambah produk ke promo ini. Isi diskon atau harga promo (cukup salah satu, yang lain terisi otomatis). Kosongkan untuk memakai diskon bawaan ('+(p.a>0?fmt(p.a)+'%':'belum diisi')+').');
 var bad=0,thin=0,n=0;
 it.forEach(function(z){var d=pdet(p,z);n+=d.n||0;bad+=d.bad||0;thin+=d.thin||0});
 return '<div class="res">'+rw('Produk dihitung',n)+rw('Rugi dengan diskon ini',bad,bad?'bad':'ok')+rw('Untung tipis',thin)+pinfo('Rincian tiap produk ada di kartu produknya. Harga asli = harga listing hasil hitung di tab Hitung. Voucher toko ikut dihitung.')+'</div>'}
/*5.38: harga promo dan diskon (%) saling terisi otomatis di Promo Toko*/
function pitM(z){var r=rows.filter(function(x){return x.id===z.p})[0],o=r?calc(r):null;return o&&!o.err&&o.M>0?o.M:0}
function pitH(M,d){return Math.round(M*(100-d)/100).toLocaleString('id-ID')}
function pitD(M,h){return fmt(Math.round(Math.max((M-h)/M*100,0)*10)/10)}
function pitPh(p,M){return{d:p.a>0?fmt(p.a):'0',h:(M>0&&p.a>0)?pitH(M,p.a):'otomatis'}}
function pds(d){return d.n?(d.u<0?'Rugi ':'Untung ')+rp(Math.abs(d.u)):'Belum dihitung'}
function pdd(p,z){var d=pdet(p,z);return '<details class="pdd"'+(z.ro?' open':'')+'><summary><span>Rincian hitungan</span><b class="pds '+(d.n?(d.bad?'bad':'ok'):'')+'">'+pds(d)+'</b></summary><div class="pdt">'+d.h+'</div></details>'}
function pitSync(c,p){c.querySelectorAll('.pii[data-ix]').forEach(function(ii){var z=(p.it||[])[+ii.dataset.ix];if(!z)return;var M=pitM(z),ph=pitPh(p,M),a=ii.querySelector('.pdt'),d=ii.querySelector('[data-it=d]'),h=ii.querySelector('[data-it=h]');if(a){var dd=pdet(p,z);KDOM.setHTML(a, dd.h);var sm=ii.querySelector('.pds');if(sm){sm.textContent=pds(dd);sm.className='pds '+(dd.n?(dd.bad?'bad':'ok'):'')}}if(d)d.placeholder=ph.d;if(h)h.placeholder=ph.h})}
function pitems(p){var kh=p.t=='kh',h='<div class="pit"><div class="pith">'+(kh?'Produk tambahan (dapat diskon, bisa berbeda tiap produk)':'Produk dalam promo (diskon bisa berbeda tiap produk)')+'</div>';
 (p.it||[]).forEach(function(z,ix){var r=rows.filter(function(x){return x.id===z.p})[0];
  var M=kh?0:pitM(z),ph=kh?{d:(p.a>0?fmt(p.a):'0'),h:'otomatis'}:pitPh(p,M),dv=z.d>0?fmt(z.d):(M>0&&z.h>0?pitD(M,z.h):''),hv=z.h>0?z.h.toLocaleString('id-ID'):(M>0&&z.d>0?pitH(M,z.d):'');
  h+='<div class="pii" data-ix="'+ix+'"><div class="pin"><span>'+esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-itdel aria-label="Hapus produk dari promo">&#10005;</button></div><div class="g3"><div><label>Diskon (%)</label><input data-it="d" inputmode="decimal" placeholder="'+ph.d+'" value="'+dv+'"></div><div><label>Harga promo (Rp)</label><input data-it="h" inputmode="numeric" placeholder="'+ph.h+'" value="'+hv+'"></div><div><label>Batas beli</label><input data-it="l" inputmode="numeric" placeholder="'+(p.x>0?p.x:'-')+'" value="'+(z.l>0?z.l:'')+'"></div></div><div class="pia"><select data-itsw aria-label="Ganti produk ini"><option value="">Ganti produk...</option>'+rows.filter(function(r2){return r2.id!==z.p&&!(p.it||[]).some(function(y){return y.p===r2.id})&&!(kh&&(p.mp||[]).indexOf(r2.id)>=0)}).map(function(r2){return '<option value="'+esc(r2.id)+'">'+esc((r2.n||'(tanpa nama)')+(r2.live?' \u2022 live':''))+'</option>'}).join('')+'</select><button class="lk" type="button" data-itrs>Kosongkan isian</button></div>'+(kh?'':pdd(p,z))+'</div>'});
 return h+'<select data-itadd aria-label="'+(kh?'Tambah produk tambahan':'Tambah produk ke promo')+'"><option value="">'+(kh?'+ Tambah produk tambahan':'+ Tambah produk ke promo')+'</option>'+rows.filter(function(r){return !(p.it||[]).some(function(z){return z.p===r.id})&&!(kh&&(p.mp||[]).indexOf(r.id)>=0)}).map(function(r){return '<option value="'+esc(r.id)+'">'+esc((r.n||'(tanpa nama)')+(r.live?' \u2022 live':''))+'</option>'}).join('')+'</select>'+(kh?'':'<button class="lk" type="button" data-itall>Masukkan semua produk live</button>')+'</div>'}
function pmain(p){var h='<div class="pit">'+pinfo('Aturan hadiah: pembeli membeli produk utama, lalu mendapat diskon untuk produk tambahan.')+'<div class="pith">Produk utama</div>';
 (p.mp||[]).forEach(function(id,ix){var r=rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-mi="'+ix+'"><div class="pin"><span>'+esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-kmdel aria-label="Hapus produk utama">&#10005;</button></div></div>'});
 return h+'<select data-kmadd aria-label="Tambah produk utama"><option value="">+ Tambah produk utama</option>'+rows.filter(function(r){return (p.mp||[]).indexOf(r.id)<0&&!(p.it||[]).some(function(z){return z.p===r.id})}).map(function(r){return '<option value="'+esc(r.id)+'">'+esc((r.n||'(tanpa nama)')+(r.live?' \u2022 live':''))+'</option>'}).join('')+'</select></div>'}
document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-kmadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.mp=x.p.mp||[]).push(t.value);persist();prRender()});
document.addEventListener('click',function(e){var d=e.target.closest&&e.target.closest('[data-kmdel]');if(!d)return;var x=ptc(e);if(!x)return;x.p.mp.splice(+d.closest('.pii').dataset.mi,1);persist();prRender()});
function ptc(e){var c=e.target.closest('.pe');return c&&PRM[+c.dataset.i]?{c:c,p:PRM[+c.dataset.i]}:null}
document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-itadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.it=x.p.it||[]).push({p:t.value,d:0,h:0,l:0});persist();prRender()});
document.addEventListener('click',function(e){var del=e.target.closest&&e.target.closest('[data-itdel]'),all=e.target.closest&&e.target.closest('[data-itall]');if(!del&&!all)return;var x=ptc(e);if(!x)return;if(del)x.p.it.splice(+del.closest('.pii').dataset.ix,1);else rows.forEach(function(r){if(r.live&&r.m>0&&!(x.p.it||[]).some(function(z){return z.p===r.id}))(x.p.it=x.p.it||[]).push({p:r.id,d:0,h:0,l:0})});persist();prRender()});
document.addEventListener('input',function(e){var t=e.target,k=t.dataset&&t.dataset.it;if(!k)return;var x=ptc(e);if(!x)return;var ii=t.closest('.pii'),z=x.p.it[+ii.dataset.ix];if(!z)return;var pt=x.p.t=='pt',M=pt?pitM(z):0;
 if(k=='d'){z.d=Math.min(Math.max((String(t.value).trim()===''?NaN:Number(String(t.value).replace(',','.')))||0,0),99.9);if(z.d>0){z.h=0;ii.querySelector('[data-it=h]').value=(pt&&M>0)?pitH(M,z.d):''}else if(pt){z.h=0;ii.querySelector('[data-it=h]').value=''}}
 else if(k=='h'){z.h=num(t.value);fk(t,z.h?z.h.toLocaleString('id-ID'):'');if(z.h>0){z.d=0;ii.querySelector('[data-it=d]').value=(pt&&M>0)?pitD(M,z.h):''}else if(pt){z.d=0;ii.querySelector('[data-it=d]').value=''}}
 else{z.l=num(t.value)}
 persist();prRes(x.c,x.p)});
document.addEventListener('change',function(e){var t=e.target;if(!t.dataset||t.dataset.itsw===undefined||!t.value)return;var x=ptc(e);if(!x)return;var ii=t.closest('.pii'),z=x.p.it[+ii.dataset.ix];if(!z)return;z.p=t.value;if(z.h>0){z.h=0;toast('Produk diganti. Harga promo (Rp) dikosongkan karena harga produk berbeda')}else toast('Produk diganti');persist();prRender()});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-itrs]');if(!b)return;var x=ptc(e);if(!x)return;var z=x.p.it[+b.closest('.pii').dataset.ix];if(!z)return;z.d=0;z.h=0;z.l=0;persist();prRender();toast('Isian dikosongkan, kembali ke diskon bawaan')});
document.addEventListener('toggle',function(e){var t=e.target;if(!t.classList||!t.classList.contains('pdd'))return;var x=ptc(e);if(!x)return;var ii=t.closest('.pii'),z=ii&&x.p.it[+ii.dataset.ix];if(z)z.ro=t.open},true);
/* pencarian untuk daftar produk panjang di tab Promosi */
var PKS=null,PKT=null;
function pkOk(s){return !!s&&s.tagName=='SELECT'&&s.options.length>=8&&!s.disabled}
function pkClose(){var b=$('pkb');if(b)b.remove();document.removeEventListener('keydown',pkKey,true);PKS=null}
function pkKey(e){if(e.key=='Escape'){e.preventDefault();pkClose()}}
function pkOpen(sel){if(PKS)return;PKS=sel;
 var opts=Array.prototype.filter.call(sel.options,function(o){return o.value!==''}),ph=sel.options[0]?sel.options[0].text:'Pilih produk',
 hay=opts.map(function(o){var r=rows.filter(function(x){return x.id===o.value})[0];return(o.text+' '+(r?(r.sku||'')+' '+(r.sup||''):'')).toLowerCase()});
 var b=document.createElement('div');b.id='pkb';b.className='pkb';
 KDOM.setHTML(b, '<div class="pks" role="dialog" aria-modal="true" aria-label="'+esc(ph)+'"><div class="pkt">'+esc(ph.replace(/^\+\s*/,''))+'</div><div class="pkh"><input id="pki" type="search" placeholder="Cari produk, SKU, atau supplier" aria-label="Cari produk" autocomplete="off"><button type="button" id="pkx" aria-label="Tutup">&#10005;</button></div><div class="pkn" id="pkn"></div><div id="pkl"></div></div>');
 document.body.appendChild(b);
 var inp=$('pki'),lst=$('pkl'),cnt=$('pkn');
 function draw(){var q=inp.value.toLowerCase().split(/\s+/).filter(Boolean),h='',n=0;opts.forEach(function(o,i){if(q.every(function(w){return hay[i].indexOf(w)>=0})){n++;h+='<button type="button" class="pkr" data-v="'+esc(o.value)+'">'+esc(o.text)+'</button>'}});cnt.textContent=n?n+' produk':'';KDOM.setHTML(lst, h||'<div class="pke">Tidak ada produk yang cocok.</div>')}
 inp.addEventListener('input',draw);draw();
 b.addEventListener('click',function(e){var r=e.target.closest('.pkr');if(r){var v=r.dataset.v,s=PKS;pkClose();if(s){s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}))}return}if(e.target===b||e.target.closest('#pkx'))pkClose()});
 document.addEventListener('keydown',pkKey,true);setTimeout(function(){try{inp.focus()}catch(x){}},30)}
(function(){var v=$('v3');if(!v)return;
 v.addEventListener('mousedown',function(e){var s=e.target.closest&&e.target.closest('select');if(pkOk(s)){e.preventDefault();pkOpen(s)}},true);
 v.addEventListener('touchstart',function(e){var t=e.touches[0];PKT=t?{x:t.clientX,y:t.clientY}:null},{passive:true,capture:true});
 v.addEventListener('touchend',function(e){var s=e.target.closest&&e.target.closest('select'),t=e.changedTouches[0];if(!pkOk(s)||!PKT||!t)return;var mv=Math.abs(t.clientX-PKT.x)+Math.abs(t.clientY-PKT.y);PKT=null;if(mv>10)return;if(e.cancelable)e.preventDefault();pkOpen(s)},{passive:false,capture:true});
 v.addEventListener('keydown',function(e){var s=e.target;if(pkOk(s)&&(e.key=='Enter'||e.key==' ')){e.preventDefault();pkOpen(s)}},true)})();
function pcalc(p){var c=CFG[p.t];if(!c||!c.c)return'';if(c.c=='pt')return ppt(p);if(c.c=='kh')return pkombo(p);if(c.c=='hm')return phm(p);if(c.c=='vc')return pvoucher(p);
 var r=rows.filter(function(x){return x.id===p.p})[0];
 if(!r)return'<div class="wn i">Pilih produk untuk melihat hitungan untung.</div>';
 var o=calc(r);if(!o||o.err)return'<div class="wn i">'+(o&&o.err?'Harga produk belum bisa dihitung, periksa tab Hitung.':'Modal produk belum diisi di tab Hitung.')+'</div>';
 var h,q,x,im;
 if(c.c=='vi')return pcalc2(p,r,o);
 if(c.c=='pd')return ppd(p,r,o);
 if(c.c=='af'){var k=p.a||0,fee=Math.round(o.L*k/100),u=o.u-fee;q=Object.assign({},o,{u:u});x=warns(q,true);
  return '<div class="res">'+rw('Harga akhir saat ini',rp(o.L))+rw('Untung sebelum komisi',rp(o.u))+rw('Komisi affiliate ('+fmt(k)+'%)','- '+rp(fee))+rw(u<0?'Rugi bersih':'Untung bersih',(u<0?'- ':'')+rp(Math.abs(u)),u<0?'bad':'ok')+rw('Margin',pc1(x.m)+'%')+WN(x)+'</div>'}
 var L=c.c=='pd'?Math.floor(o.L*(100-(p.b||0))/100+1e-7):(p.a||0);
 if(!(L>0))return'<div class="wn i">Isi harga promo untuk melihat hitungan untung.</div>';
 q=fwdL(L,r,o.R);x=warns(q,true);im=impas(r,o.R);
 return '<div class="res">'+rw(c.c=='pd'?'Harga per pcs setelah diskon':'Harga promo',rp(q.L))+(q.v?rw('Voucher toko','- '+rp(q.v)):'')+rw('Saldo masuk toko',rp(q.s))+rw('Modal + Management Partner + packing',rp(tmod(r)))+rw(q.u<0?'Rugi bersih':'Untung bersih',(q.u<0?'- ':'')+rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',pc1(x.m)+'%')+(im===null?'':rw('Harga promo minimal (impas)',rp(im)))+WN(x)+'</div>'}
/*5.18: dulu bernama pf() dan bentrok dengan pembaca angka pf(s,pct) di atas, sehingga semua kolom angka Pengaturan tidak tersimpan*/
function pfCard(i,p){var c=CFG[p.t],h='';
 var fld=function(k,d){if(!d)return'';var un=pun(p,k),v=p[k]||0,val=!v?'':un=='%'?fmt(v):v.toLocaleString('id-ID');return '<div><label>'+((c.c=='pd'&&k=='b')?{pct:'Dan dapatkan (% diskon)',nom:'Dan dapatkan potongan (Rp)',hrg:'Harga paket diskon (Rp)'}[p.tp||'pct']:(k=='cp'&&p.u=='cb'?'Maksimum cashback (Rp)':d[0])+(c.u&&k=='a'?(p.u=='pct'?' (%)':p.u=='cb'?' (% cashback)':' (Rp)'):''))+'</label><input data-pf="'+k+'" inputmode="'+(un=='%'?'decimal':'numeric')+'" value="'+val+'" placeholder="0"></div>'};
 var optf=function(key){return '<option value="">Pilih produk</option>'+rows.map(function(r){return '<option value="'+esc(r.id)+'"'+(r.id===p[key]?' selected':'')+'>'+esc((r.n||'(tanpa nama)')+(r.live?' • live':''))+'</option>'}).join('')};
 var sel=function(key,lb){return '<div style="grid-column:1/-1"><label>'+lb+'</label><select data-pf="'+key+'">'+optf(key)+'</select></div>'};
 var jt0=p.jt||'toko',jsel=c.jt?'<div style="grid-column:1/-1"><label>Jenis voucher</label><select data-pf="jt">'+[['toko','Voucher Toko (semua produk)'],['produk','Voucher Produk (produk pilihan)'],['live','Voucher Live (hanya Shopee Live)'],['video','Voucher Video (hanya Shopee Video)']].map(function(o){return '<option value="'+o[0]+'"'+(o[0]==jt0?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>':'';
 var tsel=c.tp?'<div style="grid-column:1/-1"><label>Tipe paket diskon</label><select data-pf="tp">'+[['pct','Persentase diskon'],['nom','Nominal diskon'],['hrg','Harga paket diskon']].map(function(o){return '<option value="'+o[0]+'"'+(o[0]==(p.tp||'pct')?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>':'';
 var usel=c.u?'<div style="grid-column:1/-1"><label>Jenis diskon</label><select data-pf="u"><option value="rp"'+((p.u!='pct'&&p.u!='cb')?' selected':'')+'>Nominal Diskon (Rp)</option><option value="pct"'+(p.u=='pct'?' selected':'')+'>Persentase Diskon (%)</option>'+(p.t=='vc'?'<option value="cb"'+(p.u=='cb'?' selected':'')+'>Cashback Koin</option>':'')+'</select></div>':'';
 var dts='<div><label>Waktu mulai</label><input type="date" data-pf="s" value="'+esc(p.s||'')+'"></div><div><label>Waktu berakhir</label><input type="date" data-pf="e" value="'+esc(p.e||'')+'"></div>';
 return '<div class="pe" data-i="'+i+'"><div class="peh"><span class="pty">'+c.n+'</span><span class="pst"></span><button class="x" type="button" data-del aria-label="Hapus promo">&#10005;</button></div><input class="nm" data-pf="n"'+(p.t=='kh'?' maxlength="25"':'')+' placeholder="Nama promo atau kode" aria-label="Nama promo" value="'+esc(p.n||'')+'"><div class="g">'+(c.c=='vc'?'':dts)+''+(c.jt?jsel+(jt0!='toko'?sel('p','Produk 1')+sel('p2','Produk 2 (opsional)')+sel('p3','Produk 3 (opsional)'):''):c.ps?sel('p','Produk 1')+sel('p2','Produk 2')+sel('p3','Produk 3 (opsional)'):c.p?sel('p','Produk'):'')+usel+tsel+fld('a',c.a)+((p.u=='pct'||p.u=='cb')?fld('cp',c.cp):'')+fld('b',c.b)+fld('x',c.x)+fld('m',c.m)+fld('y',c.y)+(c.c=='vc'?dts:'')+'<div style="grid-column:1/-1"><label>Catatan</label><input data-pf="k" style="text-align:left" placeholder="Opsional" value="'+esc(p.k||'')+'"></div></div>'+(p.t=='pt'?pitems(p):p.t=='kh'?pmain(p)+pitems(p):p.t=='hm'?pgm(p):'')+'<div class="prc"></div></div>'}
function prRes(c,p){var s=pst(p),e=c.querySelector('.pst');e.className='pst '+s.k;e.textContent=s.t;KDOM.setHTML(c.querySelector('.prc'), pcalc(p));if(p.t=='pt')pitSync(c,p);prTiles()}
function paSync(){var off=A.pa=='no';document.querySelectorAll('[data-pa]').forEach(function(x){x.hidden=off});var e=$('pa');if(e&&e.value!=(off?'no':'yes'))e.value=off?'no':'yes'}
function prTiles(){var h='',cnt={},tot={a:0,u:0,e:0};
 PRM.forEach(function(p){var k=pst(p).k;if(k=='a'||k=='u'){cnt[p.t]=(cnt[p.t]||0)+1}if(tot[k]!==undefined)tot[k]++});
 PORD.forEach(function(k){h+='<button type="button" class="tl'+(PSEL==k?' on':'')+'" data-pt="'+k+'" aria-pressed="'+(PSEL==k)+'"><span class="tc"><svg viewBox="0 0 24 24">'+IC[k]+'</svg>'+(cnt[k]?'<i>'+cnt[k]+'</i>':'')+'</span><span class="tn">'+CFG[k].n+'</span></button>'});
 KDOM.setHTML($('prt'), h);$('prs').textContent=PRM.length?tot.a+' berjalan, '+tot.u+' akan datang, '+tot.e+' berakhir':'Pilih jenis promo, lalu tekan tombol Tambah.';
 $('vcs').hidden=PSEL!='vc';$('pts').hidden=PSEL!='pt';paSync();var b=$('pra');b.textContent=PSEL?'Tambah '+CFG[PSEL].n:'Pilih jenis promo di atas';b.className='btn'+(PSEL?'':' gh')}
function prRender(){VCC=null;GK=null;prTiles();var ix=[];PRM.forEach(function(p,i){if(!PSEL||p.t==PSEL)ix.push(i)});
 var ord={a:0,u:1,n:2,e:3};ix.sort(function(x,y){var a=ord[pst(PRM[x]).k],b=ord[pst(PRM[y]).k];return a-b||(PRM[x].s||'').localeCompare(PRM[y].s||'')});
 KDOM.setHTML($('prl'), ix.length?ix.map(function(i){return pfCard(i,PRM[i])}).join(''):'<div class="si"><div class="empty">'+(PSEL?'Belum ada '+CFG[PSEL].n+'. Tekan tombol Tambah di bawah.':'Belum ada promo.')+'</div></div>');
 document.querySelectorAll('#prl .pe').forEach(function(c){prRes(c,PRM[+c.dataset.i])})}
$('prt').addEventListener('click',function(e){var b=e.target.closest('[data-pt]');if(!b)return;PSEL=PSEL==b.dataset.pt?'':b.dataset.pt;prRender()});
$('pra').onclick=function(){if(!PSEL){toast('Pilih jenis promo dulu');return}if(PRM.length>=300){toast('Maksimal 300 promo');return}
 PRM.push({id:uid(),t:PSEL,n:'',s:today(),e:'',p:'',a:0,b:0,k:'',it:[],mp:[],gf:[]});prRender();persist();var c=$('prl').querySelector('.pe[data-i="'+(PRM.length-1)+'"]');if(c){c.scrollIntoView({block:'center'});c.querySelector('input').focus()}};
$('prl').addEventListener('click',function(e){if(!e.target.closest('[data-del]'))return;var c=e.target.closest('.pe'),p=PRM[+c.dataset.i];ask('Hapus promo ini?','Ya, hapus',function(){PRM.splice(PRM.indexOf(p),1);prRender();persist();toast('Promo dihapus')})});
$('prl').addEventListener('input',function(e){var t=e.target,c=t.closest('.pe');if(!c||!t.dataset.pf)return;var p=PRM[+c.dataset.i],k=t.dataset.pf;VCC=null;GK=null;
 if(k=='a'||k=='b'||k=='x'||k=='y'||k=='m'||k=='cp'){var u=pun(p,k);if(u=='%'){var v=(t.value.trim()===''?NaN:Number(t.value.replace(',','.')));p[k]=isNaN(v)||v<0?0:Math.min(v,100)}else{var n=num(t.value);p[k]=n;t.value=n?n.toLocaleString('id-ID'):''}}
 else if(k=='u'){p.u=t.value;p.a=0;prRender();persist();return}
 else if(k=='tp'){p.tp=t.value;p.b=0;prRender();persist();return}
 else if(k=='jt'){p.jt=t.value;prRender();persist();return}
 else p[k]=(k=='n'||k=='k')?t.value.slice(0,120):t.value;
 prRes(c,p);persist()});
function tab(i){if(i==1&&psig()!==PSIG)upd(false);if(i!=0)etAll();rlAll();$('v4').hidden=i!=4;$('t4').setAttribute('aria-selected',i==4);if(i==4){rpt()}$('v3').hidden=i!=3;$('t3').setAttribute('aria-selected',i==3);if(i==3){tgl();prRender()}$('fab').hidden=i!=0;$('v0').hidden=i!=0;$('top').hidden=i!=1;$('v1').hidden=i!=1;$('v2').hidden=i!=2;$('t0').setAttribute('aria-selected',i==0);$('t1').setAttribute('aria-selected',i==1);$('t2').setAttribute('aria-selected',i==2);if(i==1)srt();if(i==0){tgl();shop()}window.scrollTo({top:0,left:0,behavior:'instant'})}
$('t0').onclick=function(){tab(0)};$('t1').onclick=function(){tab(1)};$('t2').onclick=function(){tab(2)};$('t3').onclick=function(){tab(3)};$('t4').onclick=function(){tab(4)};$('t5').onclick=function(){tab(5)};
$('add').onclick=function(){if(rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}$('q').value='';$('ff').value='all';$('so').value='0';add();var c=$('list').lastChild;c.scrollIntoView({block:'center'});c.querySelector('input').focus();upd(false)};
$('col').onclick=function(){var all=rows.length&&rows.every(function(r){return r.c});rows.forEach(function(r){r.c=!all;r.box.classList.toggle('cl',!all);var tg=r.box.querySelector('.tg');if(tg)tg.setAttribute('aria-expanded',all)});colL();persist()};
$('rst').onclick=function(){ask('Kosongkan semua produk? Semua data produk akan terhapus.','Ya, kosongkan',function(){rows=[];KDOM.setHTML($('list'), '');add();upd(true);toast('Semua produk dikosongkan')})};
var HD=['Produk','Isi paket','Stok Shopee','Tanggal cek stok','Supplier','SKU','Link supplier','Modal supplier','Biaya Management Partner','Biaya packing','Total modal','Target untung','Harga listing awal','Harga diskon coret','Voucher toko','Harga setelah voucher','Tarif administrasi (%)','Tarif Gratis Ongkir XTRA (%)','Tarif Promo XTRA (%)','Tarif Video XTRA (%)','Tarif Live XTRA (%)','Biaya administrasi','Biaya Gratis Ongkir XTRA','Biaya Promo XTRA','Biaya Video XTRA','Biaya Live XTRA','Biaya pembayaran','Biaya layanan pesanan','Total Biaya Shopee','Premi','PPh 22','Biaya iklan','Cadangan retur','Ongkir ditanggung','Saldo masuk','Untung bersih','Margin (%)','Harga impas (diskon coret)'];
function tbl(){var o=[HD];
 rows.forEach(function(r){var c=calc(r);if(c&&!c.err){var im=impas(r,c.R);o.push([(r.n||'-').replace(/[\t\r\n]+/g,' '),r.q>0?r.q:1,r.s==null?'':r.s,r.sd||'',r.sup||'',r.sku||'',r.lnk||'',r.m,r.d,r.p,tmod(r),r.t,c.M,c.L,c.v,c.P,fmt(c.R.ad),fmt(c.R.gx),fmt(c.R.px),fmt(c.R.vx),fmt(c.R.lv),c.b.ad,c.b.gx,c.b.px,c.b.vx,c.b.lv,c.b.pay,c.b.fx,c.sh,c.pm,c.tax,c.ads,c.rt,A.og,c.s,c.u,pc1(c.P>0?c.u/c.P*100:0),im===null?'':im])}});
 return o}
$('cpy').onclick=function(){var o=tbl();
 if(o.length<2){toast('Belum ada hasil untuk disalin');return}
 try{navigator.clipboard.writeText(o.map(function(x){return x.map(function(v){return typeof v=='string'?csvSafe(v.replace(/[\t\r\n]+/g,' ')):v}).join('\t')}).join('\n')).then(function(){toast('Hasil tersalin')},function(){toast('Gagal menyalin')})}catch(e){toast('Gagal menyalin')}};
function salesRows(){if(!SALES.length)return null;return [['Tanggal','Jam','Produk','Harga jual','Untung','Sumber harga','Harga ideal','Untung di harga ideal','Selisih untung']].concat(SALES.slice().sort(function(a,b){return a.t-b.t}).map(function(x){var t=new Date(x.t);return[x.d,String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0'),x.n,Math.round(x.a),Math.round(x.u),({akt:'Harga aktual',promo:'Promo',ideal:'Harga ideal'}[x.sr]||''),x.pi>0?Math.round(x.pi):'',x.pi>0?Math.round(x.ui):'',x.pi>0?Math.round(x.ui-x.u):'']}))}
function showCpBox(text){var b=$('cpbox'),t=$('cptx');if(!b||!t)return;b.hidden=false;t.value=text;try{t.focus();t.select();t.setSelectionRange(0,text.length);b.scrollIntoView({block:'nearest'})}catch(e){}}
function copySales(){var d=salesRows();if(!d){toast('Belum ada penjualan untuk disalin');return}
 var text=csv(d).replace(/^\ufeff/,''),bx=$('cpbox');
 var done=function(){if(bx)bx.hidden=true;toast('CSV tersalin ke clipboard')};
 var manual=function(){showCpBox(text);toast('Salin manual dari kotak teks')};
 var legacy=function(){var ok=false,t;try{t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(t);t.focus();t.select();t.setSelectionRange(0,text.length);ok=document.execCommand('copy')}catch(e){ok=false}try{if(t)t.remove()}catch(e){}return ok};
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){legacy()?done():manual()})}else{legacy()?done():manual()}}catch(e){legacy()?done():manual()}}
function csvSafe(v){if(typeof v!='string')return v;if(/^[=+\-@\t\r]/.test(v)&&v!=='-'&&!/^[+-]?\d[\d.,]*%?$/.test(v))return "'"+v;return v}
function csv(o){return '\ufeff'+o.map(function(x){return x.map(function(v){v=String(csvSafe(v));return /[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')}).join('\r\n')}
function anchorDl(name,text,mime){try{var b=new Blob([text],{type:mime||'text/csv'});if(navigator.msSaveOrOpenBlob){navigator.msSaveOrOpenBlob(b,name);return true}var u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(u)},4000);return true}catch(e){return false}}
function dl(name,text,mime,alt,onFail){
 var ok=anchorDl(name,text,mime);
 if(!ok&&onFail)onFail();
 var h=alt?'gunakan tombol '+alt:'buka aplikasi lewat browser biasa';
 toast(ok?'Unduhan dimulai. Jika file tidak muncul, '+h+'.':'Unduhan tidak tersedia. '+h.charAt(0).toUpperCase()+h.slice(1)+'.');
}
$('xr').onclick=function(){var o=tbl();if(o.length<2){toast('Belum ada hasil untuk diunduh');return}dl('hasil-kalsara.csv',csv(o),'text/csv;charset=utf-8','Salin hasil')};
$('xt').onclick=function(){dl('template-produk-kalsara.csv',(csv([['Nama produk','Modal supplier','Biaya Management Partner','Biaya packing','Target untung','Isi paket (opsional)','Stok Shopee (opsional)','Supplier (opsional)','SKU (opsional)','Link supplier (opsional)','Tarif Gratis Ongkir XTRA % (opsional)'],['Contoh produk A',25000,1000,500,5000,1,20,'Toko ABC','KAOS-01','https://contoh.com/produk',2]])),'text/csv;charset=utf-8','')};
function parseCsv(t){
 parseCsv.bad=false;t=String(t||'').replace(/^\ufeff/,'');
 var l1=t.split(/\r?\n/,1)[0]||'',ds=[';','\t',','],counts=ds.map(function(d){
  var n=0,q=false;
  for(var j=0;j<l1.length;j++){var ch=l1[j];
   if(ch=='"'){if(q&&l1[j+1]=='"')j++;else q=!q}
   else if(!q&&ch==d)n++}
  return[d,n]});
 counts.sort(function(a,b){return b[1]-a[1]});
 var dm=counts[0][1]>0?counts[0][0]:';';
 var out=[],row=[],c='',q=false;
 for(var i=0;i<t.length;i++){var ch=t[i];
  if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch=='"'&&c.trim()===''){q=true;c=''}
  else if(ch==dm){row.push(c);c=''}
  else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;row.push(c);c='';if(row.some(function(v){return String(v).trim()!==''}))out.push(row);row=[]}
  else c+=ch}
 if(q){parseCsv.bad=true;return []}
 row.push(c);if(row.some(function(v){return String(v).trim()!==''}))out.push(row);
 return out}
/*kolom ke-11 opsional pada impor CSV = tarif penuh Gratis Ongkir XTRA per produk (%), dikali faktor keringanan toko. Kosong = ikut Setelan.*/
function impGx(v){if(v===undefined||v===null)return null;var s=String(v).trim();if(s==='')return null;if(!/^\d+([.,]\d+)?\s*%?$/.test(s))return NaN;var g=pf(s,true);if(!isFinite(g)||g<0||g>100)return NaN;return Math.round(g*10000)/10000}
function impGxK(v){var s=String(v==null?'':v).trim().toUpperCase(),m=s.match(/^([A-H])(?:\s*[\/>-]\s*([A-H]))?$/);return m?{gc:m[1],g2:m[2]||null}:null}
function impGxO(v){var k=impGxK(v);if(k)return k.g2?{gc:k.gc,g2:k.g2}:{gc:k.gc};var g=impGx(v);return(g===null||isNaN(g))?{}:{gx:g}}
function impGxStat(d){var n=0,bad=0,low=0;d.forEach(function(x){if(impGxK(x[10])){n++;return}var g=impGx(x[10]);if(g===null)return;if(isNaN(g)){bad++;return}n++;if(g>0&&g<1&&String(x[10]).indexOf('%')<0)low++});
 var m='';if(n>0)m+=' Tarif Gratis Ongkir XTRA per produk diisi di '+n+' produk.';if(bad>0)m+=' '+bad+' tarif Gratis Ongkir XTRA tidak terbaca (harus angka 0 sampai 100) dan diabaikan.';if(low>0)m+=' Perhatian: '+low+' tarif Gratis Ongkir XTRA di bawah 1 tanpa tanda %. Pastikan itu persen (2 berarti 2%), bukan pecahan (0,02).';return m}
function imp(t){var d=parseCsv(t);if(parseCsv.bad){toast('Ada tanda kutip (") yang tidak ditutup di file. Periksa file lalu coba lagi');return}if(d.length&&isNaN(Number(String(d[0][1]||'').replace(/\./g,'').replace(',','.'))))d.shift();
 var all=d.length;d=d.filter(function(x){return num(x[1])>0});
 if(!d.length){toast('Tidak ada baris valid. Kolom: nama, modal, Management Partner, packing, target');return}
 var sk=all-d.length,lo=d.filter(function(x){return num(x[1])<100}).length,
 pv=d.slice(0,3).map(function(x){return (String(x[0]||'').trim().slice(0,25)||'(tanpa nama)')+' modal '+rp(num(x[1]))}).join('; ');
 ask('Impor '+d.length+' produk? Contoh: '+pv+'.'+(sk>0?' '+sk+' baris dilewati (modal kosong atau 0).':'')+(lo>0?' Perhatian: '+lo+' baris bermodal di bawah Rp100, periksa format angka.':'')+impGxStat(d),'Ya, impor',function(){impGo(d)})}
function impGo(d){var old=rows.filter(function(r){return r.n||r.m||r.d||r.p||r.t}).map(strip);rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});
 var k=Math.min(ROW_MAX-rows.length,d.length);
 d.slice(0,k).forEach(function(x){add({n:String(x[0]||'').trim().slice(0,120),m:num(x[1]),d:num(x[2]),p:num(x[3]),t:num(x[4]),q:num(x[5]),s:(x[6]===undefined||String(x[6]).trim()==='')?null:num(x[6]),sd:(x[6]===undefined||String(x[6]).trim()==='')?'':today(),sup:String(x[7]||'').trim().slice(0,120),sku:String(x[8]||'').trim().slice(0,60),lnk:String(x[9]||'').trim().slice(0,300),o:impGxO(x[10])})});
 if(!rows.length)add();$('q').value='';upd(true);srt();toast(k+' produk diimpor'+(k<d.length?' (batas '+ROW_MAX+' produk)':''))}
$('xi').onclick=function(){$('xf').click()};
$('xf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){imp(String(fr.result))};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};

/* 5.15: sinkron modal dan stok dari spreadsheet supplier. Cocok lewat SKU, lalu nama. Tidak menambah produk baru. */
var SYK='kalsara_sync_url';
function syUrl(u){u=String(u||'').trim();var m=u.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/i),g=u.match(/[?#&]gid=(\d+)/);
 if(!m)return u;
 if(m[1]==='e'){var pm=u.match(/\/d\/e\/([\w-]+)/);return pm?'https://docs.google.com/spreadsheets/d/e/'+pm[1]+'/pub?output=csv'+(g?'&gid='+g[1]:''):u}
 return 'https://docs.google.com/spreadsheets/d/'+m[1]+'/gviz/tq?tqx=out:csv'+(g?'&gid='+g[1]:'')}
function syCol(h){var c={sku:-1,n:-1,m:-1,s:-1};h=h.map(function(x){return String(x).trim().toLowerCase()});
 h.forEach(function(x,i){if(c.sku<0&&/^(sku|kode|kode produk|kode barang)$/.test(x))c.sku=i;else if(c.n<0&&/^(nama|nama produk|produk|nama barang|barang)$/.test(x))c.n=i;else if(c.s<0&&/(stok|stock|qty)/.test(x))c.s=i});
 h.forEach(function(x,i){if(c.m<0&&/modal/.test(x))c.m=i});
 h.forEach(function(x,i){if(c.m<0&&/^harga/.test(x)&&!/(jual|awal|diskon|promo)/.test(x))c.m=i});return c}
function sySync(t){var d=parseCsv(t);if(parseCsv.bad){toast('Ada tanda kutip (") yang tidak ditutup di file. Periksa file lalu coba lagi');return}
 if(/^\s*</.test(t)||d.length<2){toast('Isi sheet tidak terbaca. Pastikan dibagikan ke siapa saja yang memiliki link');return}
 var c=syCol(d[0]);
 if((c.m<0&&c.s<0)||(c.sku<0&&c.n<0)){toast('Baris pertama harus judul: SKU atau Nama, serta Modal dan/atau Stok');return}
 var old=rows.map(strip),by={},bn={};
 old.forEach(function(r){var k=(r.sku||'').trim().toLowerCase(),n=(r.n||'').trim().toLowerCase();if(k){if(Object.prototype.hasOwnProperty.call(by,k))by[k]=null;else by[k]=r}if(n){if(Object.prototype.hasOwnProperty.call(bn,n))bn[n]=null;else bn[n]=r}});
 var up={},miss=0;
 d.slice(1).forEach(function(x){var k=c.sku>=0?String(x[c.sku]||'').trim().toLowerCase():'',n=c.n>=0?String(x[c.n]||'').trim().toLowerCase():'',r=k?(by[k]||null):(n?(bn[n]||null):null);
  if(!r){if(k||n)miss++;return}
  var m=c.m>=0?num(x[c.m]==null?'':x[c.m]):0,hs=c.s>=0&&String(x[c.s]==null?'':x[c.s]).trim()!=='',s=hs?num(x[c.s]):null;
  up[r.id]={r:r,m:(m>0&&m!==r.m)?m:0,s:(hs&&s!==r.s)?s:null}});
 var L=Object.keys(up).map(function(k){return up[k]}),mc=L.filter(function(u){return u.m>0}).length,sc=L.filter(function(u){return u.s!=null}).length;
 if(!mc&&!sc){toast(L.length?'Semua sudah sama dengan sheet':'Tidak ada produk yang cocok. Cek SKU atau nama di sheet');return}
 ask('Sinkron dari supplier: modal berubah di '+mc+' produk, stok berubah di '+sc+' produk.'+(miss>0?' '+miss+' baris sheet tidak cocok dengan produk Anda dan dilewati.':'')+' Lanjutkan?','Ya, sinkronkan',function(){
  L.forEach(function(u){var r=u.r;
   if(u.m>0){var a=r.m;if(a>0)r.mh=(r.mh||[]).concat([{d:today(),a:a,b:u.m}]).slice(-10);r.ack=false;r.m=u.m;r.mb=u.m}
   if(u.s!=null){r.s=u.s;r.sd=today()}});
  rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});upd(true);srt();toast('Disinkron: '+mc+' modal, '+sc+' stok')})}
function syGo(){var u=$('syu').value.trim(),b=$('syb');
 if(!/^https?:\/\//i.test(u)){toast('Isi link Google Sheet atau CSV, diawali https://');return}
 if(!window.fetch){toast('Browser tidak mendukung. Pakai sinkron dari file CSV');return}
 try{KStore.setItem(SYK,u)}catch(e){}
 b.disabled=true;b.textContent='Mengambil data...';
 var done=function(){b.disabled=false;b.textContent='Ambil dan sinkronkan'};
 fetch(syUrl(u),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){done();sySync(t)},function(){done();toast('Gagal mengambil. Cek link, koneksi, dan izin akses sheet')})}
$('syb').onclick=syGo;
$('syc').onclick=function(){$('syf').click()};
$('syf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){sySync(String(fr.result))};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};
try{$('syu').value=KStore.getItem(SYK)||''}catch(e){}

/* 5.16: harga aktual di Shopee (awal + diskon) per produk, penilaian untung, dan impor dari file atau link sheet */

/* 5.17: penanda Produk baru / Sudah tayang + saringan */
function actNote(r,o,pr){var al=(r.ha>0||r.hd>0)?actL(r,o.R):0,st='<div class="stk" style="margin:4px 0 0">';
 if(!(al>0))return pr?'':st+'Belum ada harga aktual. Penjualan dicatat di harga ideal '+rp(o.L)+'.</div>';
 if(pr&&al>=pr)return '';
 var aq=fwdL(al,r,o.R).u;return st+'Penjualan dicatat di harga aktual '+rp(al)+(al==o.L?' (sama dengan ideal).':' (ideal '+rp(o.L)+').')+' <b style="color:var(--'+(aq<0?'bad':'ok')+')">'+(aq<0?'Rugi ':'Untung ')+rp(Math.abs(aq))+'</b></div>'}
function actL(r,R){var L=r.hd>0?r.hd:(R.dm=='nom'?r.ha-Math.round(R.dv):Math.floor(r.ha*(100-R.dv)/100+1e-7));return Math.max(L,0)}
function bdH(r,o){r.ay=0;if(!(r.ha>0||r.hd>0))return '<span class="bd">Produk baru</span>';
 var t='Sudah tayang';
 if(o&&!o.err){var u=fwdL(actL(r,o.R),r,o.R).u;r.ay=u<r.t?1:0;t+=' \u2022 '+(u<0?'rugi':u<r.t?'di bawah target':'sesuai target')}
 return '<span class="bd tz'+(r.ay>0?' bad':'')+'">'+t+'</span>'}
function acH(r,o){
 if(!(r.ha>0)&&!(r.hd>0))return '';
 if(!o||o.err)return '<div class="stk">'+(o&&o.err?'Harga produk belum bisa dihitung, periksa tab Hitung.':'Isi modal supplier dulu untuk menilai harga aktual.')+'</div>';
 var R=o.R,L=actL(r,R);
 var a=fwdL(L,r,R),mg=a.P>0?a.u/a.P*100:0,st=a.u<0?'RUGI':(a.u<r.t?'Di bawah target':'Sesuai target'),ok=a.u>=r.t,h='';
 h+='<div class="pf '+(ok?'ok':'bad')+'"><span>Untung di harga aktual<small>'+st+' &bull; margin '+pc1(mg)+'%</small></span><b>'+rp(a.u)+'</b></div>';
 if(r.ha>0&&r.hd>0){h+=r.hd>r.ha?'<div class="stk" style="margin-top:8px">Periksa input: harga diskon lebih tinggi dari harga awal.</div>':'<div class="stk" style="margin-top:8px">Diskon aktual '+pc1((r.ha-r.hd)/r.ha*100)+'%</div>'}
 else if(r.ha>0)h+='<div class="stk" style="margin-top:8px">Harga diskon dihitung dari pengaturan diskon coret Anda.</div>';
 h+='<div class="stk">Harga diskon ideal '+rp(o.L)+(L<o.L?' (kurang '+rp(o.L-L)+')':' (aktual sudah di atas ideal)')+'</div>';
 if(R.dv>0)h+='<div class="stk">Harga awal ideal '+rp(o.M)+(r.ha>0?(r.ha<o.M?' (kurang '+rp(o.M-r.ha)+')':' (aktual sudah di atas ideal)'):'')+'</div>';
 else h+='<div class="stk">Diskon coret Promo Toko belum aktif, jadi harga awal ideal sama dengan harga diskon ideal ('+rp(o.M)+'). Harga awal di atas itu tetap aman, tapi hasilnya hanya menilai harga diskon. <button class="lk" type="button" data-go="pt">Buka Promosi</button></div>';
 if(!ok)h+='<div class="stk">Kurang '+rp(r.t-a.u)+' dari target untung.</div>';
 h+=actRin(r,o,a,L);
 return h}
/*5.19: rincian biaya untuk harga aktual (harga yang terpasang di Shopee), sama dengan Rincian Penghasilan*/
function actRin(r,o,a,L){var R=o.R,b=fees(a.P,R).b,x=warns(a,true),im=impas(r,R);
 return '<details class="det rd2"'+(r.ro2?' open':'')+'><summary>Lihat rincian biaya harga aktual</summary>'+
 '<div class="rw">Harga produk (harga diskon aktual)<b>'+rp(a.L)+'</b></div>'+
 (a.v?'<div class="rw">'+esc(a.vs||'Voucher toko')+'<b>- '+rp(a.v)+'</b></div><div class="rw">Harga setelah voucher<b>'+rp(a.P)+'</b></div>':'')+
 CR('Tarif administrasi',R.ad,b.ad,b.ad)+CR('Tarif Gratis Ongkir XTRA',R.gx,b.gx,Math.round(R.gx/100*a.P))+CR('Tarif Promo XTRA',R.px,b.px,Math.round(R.px/100*a.P))+CR('Tarif Video XTRA',R.vx,b.vx,Math.round(R.vx/100*a.P))+CR('Tarif Live XTRA',R.lv,b.lv,Math.round(R.lv/100*a.P))+CR('Biaya pembayaran',A.pb,b.pay,pr(A.pb,a.P))+(b.fx?'<div class="rw">Biaya layanan pesanan<b>'+rp(b.fx)+'</b></div>':'')+
 '<div class="rw">Total Biaya Shopee<b>'+rp(a.sh)+'</b></div><div class="rw">Premi<b>'+rp(a.pm)+'</b></div><div class="rw">PPh 22<b>'+rp(a.tax)+'</b></div>'+
 (a.ads?'<div class="rw">Biaya iklan ('+fmt(R.ads)+'%)<b>'+rp(a.ads)+'</b></div>':'')+(a.rt?'<div class="rw">Cadangan retur ('+fmt(R.rt)+'%)<b>'+rp(a.rt)+'</b></div>':'')+(A.og?'<div class="rw">Ongkir ditanggung<b>'+rp(A.og)+'</b></div>':'')+
 '<div class="rw">Saldo masuk toko<b>'+rp(a.s)+'</b></div><div class="rw">Modal + Management Partner + packing<b>'+rp(tmod(r))+'</b></div>'+
 '<div class="rw">'+(a.u<0?'Rugi bersih':'Untung bersih')+'<b class="'+(a.u<0?'bad':'ok')+'">'+(a.u<0?'- ':'')+rp(Math.abs(a.u))+'</b></div>'+
 '<div class="rw">Margin (dari harga jual)<b>'+pc1(x.m)+'%</b></div>'+(im===null?'':'<div class="rw">Harga impas (harga diskon coret)<b>'+rp(im)+'</b></div>')+
 '<div class="stk" style="margin-top:8px">Saldo masuk toko sama dengan Penghasilan Akhir di Rincian Penghasilan Shopee jika tarif cocok. Ongkir subsidi Shopee tidak dihitung.</div></details>'}
function hrCol(h){var c={sku:-1,n:-1,ha:-1,hd:-1};h=h.map(function(x){return String(x).trim().toLowerCase()});
 h.forEach(function(x,i){if(c.sku<0&&/^sku$/.test(x))c.sku=i});h.forEach(function(x,i){if(c.sku<0&&/^(kode|kode produk|sku)/.test(x))c.sku=i});
 h.forEach(function(x,i){if(c.n<0&&/^(nama|nama produk|produk)$/.test(x))c.n=i});
 h.forEach(function(x,i){if(c.hd<0&&/(harga diskon|harga promo|harga akhir|discount|promo price)/.test(x))c.hd=i});
 h.forEach(function(x,i){if(c.ha<0&&/(harga awal|harga normal|harga asli|original)/.test(x))c.ha=i});
 h.forEach(function(x,i){if(c.ha<0&&c.hd!==i&&/^(harga|price)$/.test(x))c.ha=i});return c}
function hrSync(t){var d=parseCsv(t);if(parseCsv.bad){toast('Ada tanda kutip (") yang tidak ditutup di file. Periksa file lalu coba lagi');return}
 if(/^\s*</.test(t)||d.length<2){toast('Isi file tidak terbaca. Pastikan formatnya CSV');return}
 var c=hrCol(d[0]);
 if((c.ha<0&&c.hd<0)||(c.sku<0&&c.n<0)){toast('Baris pertama harus judul: SKU atau Nama, serta Harga awal dan/atau Harga diskon');return}
 var old=rows.map(strip),by={},bn={};
 old.forEach(function(r){var k=(r.sku||'').trim().toLowerCase(),n=(r.n||'').trim().toLowerCase();if(k&&!by[k])by[k]=r;if(n&&!bn[n])bn[n]=r});
 var up={},miss=0;
 d.slice(1).forEach(function(x){var k=c.sku>=0?String(x[c.sku]||'').trim().toLowerCase():'',n=c.n>=0?String(x[c.n]||'').trim().toLowerCase():'',r=(k&&by[k])||(n&&bn[n]);
  if(!r){if(k||n)miss++;return}
  var ha=c.ha>=0?num(x[c.ha]==null?'':x[c.ha]):0,hd=c.hd>=0?num(x[c.hd]==null?'':x[c.hd]):0;
  if(ha>0||hd>0)up[r.id]={r:r,ha:ha,hd:hd}});
 var L=Object.keys(up).map(function(k){return up[k]});
 if(!L.length){toast('Tidak ada produk yang cocok. Cek SKU atau nama di file');return}
 ask('Isi harga aktual Shopee di '+L.length+' produk.'+(miss>0?' '+miss+' baris file tidak cocok dengan produk Anda dan dilewati.':'')+' Lanjutkan?','Ya, isi harga',function(){
  L.forEach(function(u){if(u.ha>0)u.r.ha=u.ha;if(u.hd>0)u.r.hd=u.hd});
  rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});upd(true);srt();toast('Harga aktual terisi di '+L.length+' produk')})}
function hrGo(){var u=$('hru').value.trim(),b=$('hrb');
 if(!/^https?:\/\//i.test(u)){toast('Isi link Google Sheet atau CSV, diawali https://');return}
 if(!window.fetch){toast('Browser tidak mendukung. Pakai file CSV');return}
 try{KStore.setItem('kalsara_hr_url',u)}catch(e){}
 b.disabled=true;b.textContent='Mengambil data...';
 var done=function(){b.disabled=false;b.textContent='Ambil harga aktual'};
 fetch(syUrl(u),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){done();hrSync(t)},function(){done();toast('Gagal mengambil. Cek link, koneksi, dan izin akses sheet')})}
$('hrb').onclick=hrGo;
$('hrc').onclick=function(){$('hrf').click()};
$('hrf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){hrSync(String(fr.result))};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};
/*5.62: impor harga dan stok dari xlsx/CSV, dicocokkan lewat SKU*/
function hxN(s){return String(s==null?'':s).replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\u00a0/g,' ').trim()}
function hxK(s){return hxN(s).replace(/\s+/g,'').toLowerCase()}
function hxP(v){var s=hxN(v).replace(/^rp\.?\s*/i,'').replace(/\s/g,'');if(/^\d+(\.\d+)?$/.test(s)&&!/^\d{1,3}\.\d{3}$/.test(s))return globalThis.KalsaraMoney.parseIDR(s);return num(s)}
function hxU16(b,o){return b[o]|b[o+1]<<8}
function hxU32(b,o){return(b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0}
function hxZip(buf){var b=new Uint8Array(buf),e=-1,i;for(i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(hxU32(b,i)==0x06054b50){e=i;break}
 if(e<0)throw 0;var n=hxU16(b,e+10),p=hxU32(b,e+16),F={};
 for(i=0;i<n;i++){if(hxU32(b,p)!=0x02014b50)throw 0;var nl=hxU16(b,p+28),el=hxU16(b,p+30),cl=hxU16(b,p+32);F[new TextDecoder().decode(b.subarray(p+46,p+46+nl))]={me:hxU16(b,p+10),cs:hxU32(b,p+20),lo:hxU32(b,p+42)};p+=46+nl+el+cl}
 return{b:b,F:F}}
function hxGet(z,nm){var f=z.F[nm];if(!f)return Promise.resolve(null);var b=z.b,o=f.lo+30+hxU16(b,f.lo+26)+hxU16(b,f.lo+28),d=b.subarray(o,o+f.cs);
 if(f.me==0)return Promise.resolve(new TextDecoder().decode(d));
 if(f.me!=8)return Promise.reject(0);
 return new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(x){return new TextDecoder().decode(x)})}
function hxXlsx(buf){var z=hxZip(buf),X=function(t){return new DOMParser().parseFromString(t,'application/xml')};
 return Promise.all([hxGet(z,'xl/sharedStrings.xml'),hxGet(z,'xl/workbook.xml'),hxGet(z,'xl/_rels/workbook.xml.rels')]).then(function(a){
  var ss=[],i,j,pth=null;
  if(a[0]){var si=X(a[0]).getElementsByTagName('si');for(i=0;i<si.length;i++){var t=si[i].getElementsByTagName('t'),q='';for(j=0;j<t.length;j++)q+=t[j].textContent;ss.push(q)}}
  try{var sh=X(a[1]).getElementsByTagName('sheet')[0],rid=sh.getAttribute('r:id'),rl=X(a[2]).getElementsByTagName('Relationship');for(i=0;i<rl.length;i++)if(rl[i].getAttribute('Id')==rid){pth=rl[i].getAttribute('Target');break}}catch(e){}
  if(pth){pth=pth.replace(/^\//,'');if(pth.indexOf('xl/')!=0)pth='xl/'+pth}
  if(!pth||!z.F[pth])pth=Object.keys(z.F).filter(function(n){return/^xl\/worksheets\/sheet\d+\.xml$/.test(n)}).sort()[0];
  if(!pth)throw 0;
  return hxGet(z,pth).then(function(tx){var out=[],rw=X(tx).getElementsByTagName('row');
   for(i=0;i<rw.length;i++){var cs=rw[i].getElementsByTagName('c'),r=[];
    for(j=0;j<cs.length;j++){var c=cs[j],m=/^([A-Z]+)/.exec(c.getAttribute('r')||''),ix=j,ty=c.getAttribute('t'),v=c.getElementsByTagName('v')[0],val='';
     if(m){ix=0;for(var k=0;k<m[1].length;k++)ix=ix*26+m[1].charCodeAt(k)-64;ix--}
     if(ty=='inlineStr'){var tt=c.getElementsByTagName('t');for(var w=0;w<tt.length;w++)val+=tt[w].textContent}
     else if(v){val=v.textContent;if(ty=='s')val=ss[+val]||''}
     r[ix]=val}
    for(j=0;j<r.length;j++)if(r[j]===undefined)r[j]='';out.push(r)}
   return out})})}
function hxFind(d){for(var i=0;i<Math.min(d.length,15);i++){var c={sku:-1,par:-1,ha:-1,hd:-1,s:-1};
 if(d[i].some(function(x){return/^(et_title_|ps_)/.test(hxN(x).toLowerCase())}))continue;
 d[i].forEach(function(x,j){x=hxN(x).toLowerCase();
  if(/(parent|induk)/.test(x)&&/sku/.test(x)){if(c.par<0)c.par=j}
  else if(/sku/.test(x)){if(c.sku<0)c.sku=j}
  else if(/harga diskon|harga promo|discount|promo price/.test(x)){if(c.hd<0)c.hd=j}
  else if(/harga awal|harga normal|harga asli|original/.test(x)){if(c.ha<0)c.ha=j}
  else if(/^(stok|stock)( .*)?$/.test(x)){if(c.s<0)c.s=j}});
 if((c.sku>=0||c.par>=0)&&(c.ha>=0||c.hd>=0||c.s>=0))return{c:c,h:i}}return null}
function hxRun(d){var f=hxFind(d);if(!f){toast('Kolom SKU dan Harga Awal / Harga diskon / Stok tidak ditemukan di file');return}
 var c=f.c,old=rows.map(strip),by={},noSku=0;
 old.forEach(function(r){var k=hxK(r.sku);if(!k){noSku++;return}if(!by[k])by[k]=r});
 var up={},miss=[],dup=0,tot=0;
 d.slice(f.h+1).forEach(function(x){var k1=c.sku>=0?hxK(x[c.sku]):'',k2=c.par>=0?hxK(x[c.par]):'';if(!k1&&!k2)return;tot++;
  var r=(k1&&by[k1])||(k2&&by[k2]);
  if(!r){miss.push(hxN(k1?x[c.sku]:x[c.par]));return}
  var ha=c.ha>=0?hxP(x[c.ha]):0,hd=c.hd>=0?hxP(x[c.hd]):0,sr=c.s>=0?hxN(x[c.s]):'',st=sr===''?null:hxP(sr);if(!(ha>0||hd>0||st!=null))return;
  if(up[r.id]){dup++;return}
  up[r.id]={r:r,ha:ha,hd:hd,s:st}});
 var L=Object.keys(up).map(function(k){return up[k]});
 if(!L.length){toast(noSku==old.length?'SKU di produk masih kosong. Isi SKU produk dulu, sama dengan SKU Ref. No. di file':'Tidak ada SKU yang cocok dengan produk di aplikasi');return}
 var np=L.filter(function(u){return u.ha>0||u.hd>0}).length,ns=L.filter(function(u){return u.s!=null}).length;
 ask('Cocok '+L.length+' produk dari '+tot+' SKU di file ('+(np?'harga di '+np+' produk':'')+(np&&ns?', ':'')+(ns?'stok Shopee di '+ns+' produk':'')+').'+(miss.length?' '+miss.length+' SKU tidak ada di aplikasi dan dilewati ('+miss.slice(0,4).join(', ')+(miss.length>4?', ...':'')+').':'')+(dup?' '+dup+' baris SKU ganda dilewati (dipakai baris pertama).':'')+(noSku?' '+noSku+' produk di aplikasi belum punya SKU.':'')+' Lanjutkan impor? Modal tidak berubah.','Ya, impor',function(){
  L.forEach(function(u){if(u.ha>0)u.r.ha=u.ha;if(u.hd>0)u.r.hd=u.hd;if(u.s!=null){u.r.s=u.s;u.r.sd=today()}});
  rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});upd(true);srt();toast('Data tayang terisi di '+L.length+' produk')})}
function hxFile(f){var nm=(f.name||'').toLowerCase(),fr=new FileReader();fr.onerror=function(){toast('File tidak bisa dibaca')};
 if(/\.xlsx$/.test(nm)){
  if(!window.DecompressionStream){toast('Browser belum bisa membaca Excel. Simpan sebagai CSV lalu pilih lagi');return}
  fr.onload=function(){try{hxXlsx(fr.result).then(hxRun,function(){toast('File Excel tidak terbaca. Pakai file .xlsx dari Shopee atau simpan sebagai CSV')})}catch(e){toast('File Excel tidak terbaca. Pakai file .xlsx dari Shopee atau simpan sebagai CSV')}};
  fr.readAsArrayBuffer(f)}
 else if(/\.xls$/.test(nm)){toast('Format .xls lama tidak didukung. Simpan ulang sebagai .xlsx atau CSV')}
 else{fr.onload=function(){var t=String(fr.result),d=parseCsv(t);if(parseCsv.bad||/^\s*</.test(t)||d.length<2){toast('Isi file tidak terbaca. Pastikan formatnya CSV');return}hxRun(d)};fr.readAsText(f)}}
$('hxb').onclick=function(){$('hxf').click()};
$('hxf').onchange=function(){var f=this.files[0];this.value='';if(f)hxFile(f)};
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-hx]'))$('hxf').click()});
try{$('hru').value=KStore.getItem('kalsara_hr_url')||''}catch(e){}
function fill(){tblSync();paSync();refreshLabels();document.querySelectorAll('[data-k]').forEach(function(el){el.value=fmt(A[el.dataset.k])});fillT();tlRender()}
/*5.23: catatan perubahan tarif (disimpan di pengaturan dan ikut cadangan)*/
function tlOk(x){return x&&/^\d{4}-\d{2}-\d{2}$/.test(x.d||'')&&typeof x.t=='string'&&x.t}
function tlRender(){var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk),e=$('tll');if(!e)return;
 KDOM.setHTML(e, L.length?L.map(function(x,i){return '<div class="rw" style="align-items:center;border-bottom:1px solid var(--line);padding:8px 2px"><span style="min-width:0;word-break:break-word">'+dtx(x.d)+' '+x.d.slice(0,4)+': '+esc(x.t)+'</span><button class="x" type="button" data-tld="'+i+'" aria-label="Hapus catatan" style="flex:0 0 40px;height:40px">&#10005;</button></div>'}).join(''):'<div class="stk" style="margin:12px 2px 0">Belum ada catatan perubahan tarif.</div>')}
function tlLast(){var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk);return L[0]||null}
$('tla').onclick=function(){var t=$('tlt').value.trim().slice(0,200),d=$('tld').value||today();if(!t){toast('Tulis isi perubahan dulu');return}
 var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk).slice();L.push({d:d,t:t});L.sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0});A.tlog=L.slice(0,50);$('tlt').value='';upd(true);tlRender();toast('Perubahan tarif dicatat')};
$('tll').addEventListener('click',function(e){var b=e.target.closest('[data-tld]');if(!b)return;var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk);L.splice(+b.dataset.tld,1);A.tlog=L;upd(true);tlRender();toast('Catatan dihapus')});
document.querySelectorAll('[data-k]').forEach(function(el){
 el.addEventListener('input',function(){
  var k=el.dataset.k;
  if(el.tagName=='SELECT'){A[k]=el.value;if(k=='pa')paSync();if(k=='tp'){A.pb=el.value=='ml'?1.8:0;fill()}if(k=='pp'){if(el.value!='man'){A.px=el.value=='no'?0:el.value=='x'?4.5:6.5;A.cp=el.value=='xp'?80000:60000}syncVL();fill()}if(k=='vp'||k=='lp'){syncVL();fill()}}
  else if(el.type=='date'){A[k]=el.value;if(k=='tchk'&&A.ver&&A.ver.ok)A.ver=null}else{var v=pf(el.value,PCT.indexOf(k)>=0);A[k]=isNaN(v)||v<0?0:v;if(PCT.indexOf(k)>=0&&A[k]>100){A[k]=100;el.value='100'}}
  if(k=='px'){A.pp=A.px>0?'man':'no';$('pp').value=A.pp;syncVL(1)}else if(k=='cp'){if(A.pp!='no'){A.pp='man';$('pp').value='man'}syncVL(1)}if(k=='vx'){A.vp='man';$('vp').value='man'}if(k=='lv'){A.lp='man';$('lp').value='man'}
  upd(true)})});
function syncVL(u){if(A.vp=='no')A.vx=0;else if(A.vp=='auto')A.vx=A.pp=='no'?3:2;if(A.lp=='no')A.lv=0;else if(A.lp=='auto')A.lv=A.pp=='no'?3:2;if(u)['vx','lv'].forEach(function(i){if(document.activeElement!==$(i))$(i).value=fmt(A[i])})}
$('def').onclick=function(){ask('Kembalikan semua pengaturan toko dan tarif ke bawaan? Tabel tarif kustom dan status cek tarif ikut direset, jadi harga jual produk bisa berubah. Data produk dan catatan perubahan tarif tidak terhapus.','Ya, kembalikan',function(){A=Object.assign({},DEF,{tlog:A.tlog});fill();upd(true);toast('Pengaturan dikembalikan')})};
function bkText(lt){try{var sn=snapState();if(lt)delete sn.sl;return JSON.stringify(sn)}catch(e){return null}}
/*5.81: cadangan lengkap = data utama + data ERP dalam satu file. Cadangan ringan tidak memuat ERP*/
function bkFull(lt){var sn;try{sn=snapState();if(lt)delete sn.sl}catch(e){return Promise.resolve({t:null})}
 if(lt)return Promise.resolve({t:JSON.stringify(sn),erp:false});
 return ERP.dump().then(function(e){try{sn.erp=e;sn.bv=2;return{t:JSON.stringify(sn),erp:true,n:e.n}}catch(x){return{t:null}}},function(err){var t=null;try{t=JSON.stringify(sn)}catch(x){}return{t:t,erp:false,err:(err&&err.message)||'gagal dibaca'}})}
function bkDo(lt,use){bkFull(lt).then(function(r){if(!r.t){toast('Gagal membuat cadangan');return}
 if(r.err){ask('Data ERP tidak bisa dibaca ('+r.err+'). Cadangan ini HANYA memuat data utama (produk, promo, penjualan), bukan data ERP. Lanjutkan?','Ya, tanpa ERP',function(){use(r)});return}
 use(r)})}
$('bk').onclick=function(){bkDo(false,function(r){dl('cadangan-kalsara-'+today()+'.txt',r.t,'text/plain;charset=utf-8','Salin cadangan');bkMark()})};
function bpInfo(){var n=$('bpt').value.length;$('bpm').textContent=n?n.toLocaleString('id-ID')+' karakter di kotak.':''}
/*5.22: bagikan cadangan lewat menu bagikan HP; jika tidak tersedia, jatuh ke unduhan biasa*/
$('bsh').onclick=function(){bkDo(false,function(r){var t=r.t,
 nm='cadangan-kalsara-'+today()+'.txt',fb=function(){toast('Menu bagikan tidak tersedia di sini. Cadangan diunduh sebagai gantinya.');dl(nm,t,'text/plain;charset=utf-8','Salin cadangan');bkMark()};
 try{var f=new File([t],nm,{type:'text/plain'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Cadangan Kalsara'}).then(function(){bkMark();toast('Cadangan dibagikan')},function(e){if(e&&e.name=='AbortError')toast('Dibatalkan');else fb()});return}}catch(e){}
 fb()})};
function showBp(txt){$('bpw').hidden=false;if(txt!==undefined)$('bpt').value=txt;bpInfo();$('bpt').focus()}
$('bpt').addEventListener('input',bpInfo);
function copyBk(lt){bkDo(lt,function(r){var t=r.t;
 var man=function(){showBp(t);toast('Salin manual dari kotak teks')};
 try{navigator.clipboard.writeText(t).then(function(){bkMark();showBp(t);$('bpm').textContent=t.length.toLocaleString('id-ID')+' karakter tersalin. Setelah menempel, jumlah karakter di kotak harus sama.';toast('Cadangan tersalin ('+Math.round(t.length/1000)+' rb karakter)')},man)}catch(e){man()}})}
$('bc').onclick=function(){copyBk(false)};
$('bkrn').onclick=function(){$('bsh').onclick()};
$('bkrl').onclick=function(){try{KStore.setItem(BK_SNZ,String(Date.now()+864e5))}catch(e){}$('bkr').hidden=true;toast('Diingatkan lagi besok')};
document.addEventListener('visibilitychange',function(){if(!document.hidden)bkRemind()});
$('bcl').onclick=function(){copyBk(true)};
$('bp').onclick=function(){showBp('')};
$('bpg').onclick=function(){var v=$('bpt').value.trim();if(!v){toast('Tempel teks cadangan dulu');return}restoreText(v)};
/*5.20: toleran BOM dan teks tambahan di sekitar cadangan, mendeteksi teks terpotong, menampilkan ringkasan sebelum memulihkan, dan mempertahankan penjualan jika cadangan ringan*/
function bpFail(m){if(!$('bpw').hidden)$('bpm').textContent=m;toast(m)}
function restoreText(txt){var raw=String(txt).replace(/^\ufeff/,'').trim(),i=raw.indexOf('{'),j=raw.lastIndexOf('}'),d;
 if(i<0){bpFail('Cadangan tidak valid: tidak ada data.');return}
 var body=j>i?raw.slice(i,j+1):raw.slice(i);
 try{d=JSON.parse(body)}catch(e){bpFail(j>i&&/\}\s*$/.test(raw)?'Cadangan tidak valid atau rusak.':'Teks cadangan tampak terpotong ('+raw.length.toLocaleString('id-ID')+' karakter). Salin ulang dari awal sampai akhir, atau pakai file cadangan.');return}
 if(!d||!d.A||!Array.isArray(d.rows)){bpFail('Cadangan tidak valid: bukan data Kalsara.');return}
 var np=d.rows.length,nm=Array.isArray(d.pr)?d.pr.length:0,ns=Array.isArray(d.sl)?d.sl.length:null,ec=null;
 if(d.erp!==undefined&&d.erp!==null){ec=ERP.check(d.erp);if(!ec.ok){bpFail('Cadangan tidak bisa dipulihkan: '+ec.msg+'. Data Anda tidak diubah.');return}}
 var et=ec?', beserta data ERP ('+(ec.n.marketplaces_raw||0)+' baris laporan, '+(ec.n.order_items||0)+' detail pesanan, '+(ec.n.opex||0)+' OpEx)':'. Data ERP saat ini tidak diubah';
 ask('Pulihkan '+np+' produk dan '+nm+' promo'+(ns===null?', penjualan saat ini dipertahankan':', '+ns.toLocaleString('id-ID')+' catatan penjualan')+et+'? Data saat ini akan diganti.','Ya, pulihkan',function(){
  var fin=function(){if(d.sl===undefined)d.sl=SALES.slice();applyState(d);persist();$('bpw').hidden=true;$('bpt').value='';$('bpm').textContent='';toast('Data dipulihkan: '+np+' produk'+(ec?' dan data ERP':''))};
  if(!ec){fin();return}
  toast('Memulihkan data ERP...');
  ERP.restore(d.erp).then(fin,function(err){bpFail('Pemulihan ERP gagal: '+((err&&err.message)||'tidak diketahui')+'. Data produk dan promo belum diubah.')})})}
$('rs').onclick=function(){$('bf').click()};
$('bf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){restoreText(fr.result)};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};
function snapState(){return{A:A,rows:rows.map(strip),pr:PRM,sl:SALES,ts:TS}}
/*v5.14: manajemen kuota. SALES_DAYS = usia maksimum riwayat penjualan (hari; 0 = nonaktif). Bila browser menolak simpan (QuotaExceededError), 10% riwayat terlama dibuang lalu simpan diulang.*/
var SALES_MAX=5000,SALES_DAYS=730,qWarn=0;
function isQuota(e){return !!e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22||e.code===1014)}
function pruneAge(){if(!(SALES_DAYS>0)||!SALES.length)return 0;var cut=ymd(new Date(Date.now()-SALES_DAYS*864e5)),n=SALES.length;SALES=SALES.filter(function(s){return !s.d||s.d>=cut});return n-SALES.length}
function lsave(){var K='kalsara_v3';
 try{KStore.setItem(K,JSON.stringify(snapState()));return true}catch(e){if(!isQuota(e))return false}
 /*kuota penuh: coba simpan dengan riwayat terpangkas (10% terlama per putaran); SALES asli baru dipangkas bila penyimpanan terbukti berhasil*/
 var keep=SALES.length;
 for(var t=0;t<12&&keep>0;t++){keep=Math.max(0,keep-Math.max(200,Math.ceil(keep*.1)));
  try{var sn=snapState();sn.sl=SALES.slice(SALES.length-keep);KStore.setItem(K,JSON.stringify(sn));
   var gone=SALES.length-keep;SALES.splice(0,gone);if(typeof toast=='function')toast(gone+' catatan penjualan terlama dihapus karena penyimpanan perangkat penuh. Ekspor CSV di tab Laporan untuk arsip.');return true}
  catch(e){if(!isQuota(e))return false}}
 if(Date.now()-qWarn>30000){qWarn=Date.now();if(typeof toast=='function')toast('Penyimpanan perangkat penuh, perubahan belum tersimpan. Ekspor cadangan sekarang.')}
 return false}
/*5.63: pencatat waktu cadangan, status penyimpanan yang jelas, dan pengingat cadangan berkala. Kunci terpisah dari data utama.*/
var BK_KEY='kalsara_lastbk',BK_SNZ='kalsara_bksnooze',BK_DAYS=7;
function bkLast(){try{return +KStore.getItem(BK_KEY)||0}catch(e){return 0}}
function bkMark(){try{KStore.setItem(BK_KEY,String(Date.now()));KStore.removeItem(BK_SNZ)}catch(e){}syLocal();bkRemind()}
function bkAgo(t){var d=Math.floor((Date.now()-t)/864e5);return d<=0?'hari ini':d==1?'kemarin':d+' hari lalu'}
function hasData(){return rows.some(function(r){return r.m>0})||SALES.length>0||PRM.length>0}
function syLocal(){var t=bkLast();sy('Tersimpan di perangkat ini. '+(t?'Cadangan terakhir: '+bkAgo(t)+'.':'Belum pernah dicadangkan.'))}
function bkRemind(){var b=$('bkr');if(!b)return;var t=bkLast(),age=t?(Date.now()-t)/864e5:1e9,snz=0;try{snz=+KStore.getItem(BK_SNZ)||0}catch(e){}
 var need=hasData()&&age>=BK_DAYS&&Date.now()>snz;
 b.hidden=!need;if(need)$('bkrt').textContent=t?'Cadangan terakhir '+bkAgo(t)+'. Data hanya ada di HP ini, jadi simpan cadangan sekarang agar aman jika browser dibersihkan atau HP diganti.':'Data Anda belum pernah dicadangkan. Data hanya ada di HP ini, jadi simpan cadangan sekarang agar aman jika browser dibersihkan atau HP diganti.'}
function sy(t){$('sy').textContent=t}
var ref=null,tm=null;
var lt=null;function lflush(){if(lt!==null){clearTimeout(lt);lt=null;lsave()}}
function persist(){VCC=null;GK=null;TS=Date.now();clearTimeout(lt);lt=setTimeout(lflush,350);clearTimeout(tm);tm=setTimeout(push,700)}
document.addEventListener('visibilitychange',function(){if(document.hidden)lflush()});window.addEventListener('pagehide',lflush);
function push(){if(!ref)return;sy('Menyimpan...');ref.set({json:JSON.stringify(snapState())}).then(function(){sy('Tersinkron ke akun Anda')},function(){syLocal()})}
function applyState(d){
 var a=d.A||{};if(a.vx===undefined&&a.vd!==undefined){a.vx=a.vd;a.lv=0}if(a.cvx===undefined&&a.cv!==undefined){a.cvx=a.cv;a.clv=a.cv}delete a.vd;delete a.cv;
 (d.rows||[]).forEach(function(x){if(x.o&&x.o.vd!==undefined){if(x.o.vx===undefined)x.o.vx=x.o.vd;delete x.o.vd}});
 if(a.vp===undefined)a.vp=a.vx>0?'man':'no';if(a.lp===undefined)a.lp=a.lv>0?'man':'no';if(a.pp==='no'&&a.px>0)a.pp='man';if(a.sh===undefined){a.sh=5;if(!(a.sl>=10))a.sl=10}A=Object.assign({},DEF,a);TS=d.ts||0;SALES=Array.isArray(d.sl)?d.sl.slice(-SALES_MAX):[];var pa=pruneAge();if(pa&&typeof toast=='function')setTimeout(function(){toast(pa+' catatan penjualan lebih dari '+Math.round(SALES_DAYS/365)+' tahun dibersihkan otomatis')},1200);VCC=null;GK=null;PRM=(Array.isArray(d.pr)?d.pr.slice(0,300):[]).map(migPt);rows=[];KDOM.setHTML($('list'), '');
 (d.rows||[]).slice(0,ROW_MAX).forEach(function(x){add(x)});if(!rows.length)add();
 fill();upd(false);prRender();lsave()}
var TH=['auto','light','dark'],THN={auto:'Otomatis',light:'Terang',dark:'Gelap'},THI={
 auto:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
 light:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>',
 dark:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>'};
function thm(v,save){var h=document.documentElement;if(v=='auto')h.removeAttribute('data-theme');else h.setAttribute('data-theme',v);
 var b=$('thm');KDOM.setHTML(b, THI[v]);b.setAttribute('aria-label','Tema: '+THN[v]+'. Ketuk untuk ganti');
 if(save){try{KStore.setItem('kalsara_theme',v)}catch(e){}}}
$('thm').onclick=function(){var c=document.documentElement.getAttribute('data-theme')||'auto',n=TH[(TH.indexOf(c)+1)%3];thm(n,true);toast('Tema: '+THN[n])};
$('hp').onclick=function(){var p=$('hpt');p.hidden=!p.hidden;this.setAttribute('aria-expanded',String(!p.hidden))};
var t0='auto';try{t0=KStore.getItem('kalsara_theme')||'auto'}catch(e){}thm(TH.indexOf(t0)<0?'auto':t0,false);
function setMode(m,save){document.body.classList.toggle('fast',m=='fast');document.querySelectorAll('#mseg button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.m==m)});if(save){try{KStore.setItem('kalsara_mode',m)}catch(e){}}}
$('mseg').onclick=function(e){var b=e.target.closest('button');if(b){setMode(b.dataset.m,true);toast(b.dataset.m=='fast'?'Mode Cepat: isian penting saja':'Mode Lengkap: semua isian')}};
var m0='fast';try{m0=KStore.getItem('kalsara_mode')||'fast'}catch(e){}setMode(m0=='full'?'full':'fast',false);
function obDone(){$('ob').hidden=true;try{KStore.setItem('kalsara_ob','1')}catch(e){}}
function obInit(){var ok=null;try{ok=KStore.getItem('kalsara_ob')}catch(e){}if(ok||rows.some(function(r){return r.m>0}))return;
 [['obc','ac'],['obg','gc']].forEach(function(x){var e=$(x[0]);KDOM.copyChildren(e, $(x[1]));e.querySelectorAll('option[value="man"]').forEach(function(o){o.remove()});e.value=A[x[1]]});
 $('obt').value=A.tp;$('ob').hidden=false}
$('obs').onclick=function(){A.tp=$('obt').value;A.pb=A.tp=='ml'?1.8:0;A.ac=$('obc').value;A.gc=$('obg').value;fill();upd(true);obDone();toast('Pengaturan toko tersimpan')};
$('obx').onclick=obDone;
var _tchk=tchk;
tchk=function(){_tchk();var w=$('tw'),m=$('tw0'),lg=tlLast();if(!w.hidden){if(lg)w.textContent+=' Perubahan tarif terakhir dicatat '+dtx(lg.d)+': '+lg.t+'.';w.textContent+=' Ketuk untuk membuka Cek tarif.'}m.hidden=w.hidden;m.textContent=w.textContent;$('t5').classList.toggle('dot',!w.hidden);vgSync();if(!$('v5').hidden){var m5=$('tw5');m5.hidden=w.hidden;m5.textContent=w.textContent.replace(' Ketuk untuk membuka Cek tarif.','').replace('Perbaiki di tab Tarif','Perbaiki di bawah').replace('di tab Tarif','di bawah')}};
function openVerify(){tab(5);var d=$('vfd');d.open=true;vfKeep();setTimeout(function(){d.scrollIntoView({behavior:'smooth',block:'start'})},60)}
['tw','tw0'].forEach(function(id){var e=$(id);e.setAttribute('role','button');e.tabIndex=0;e.addEventListener('click',openVerify);e.addEventListener('keydown',function(ev){if(ev.key=='Enter'||ev.key==' '){ev.preventDefault();openVerify()}})});
var _tab=tab,TI={t0:'v0',t1:'v1',t3:'v3',t4:'v4',t5:'v5',t6:'v6',t2:'v2'},TO=['t0','t1','t3','t4','t5','t6','t2'];
tab=function(i){if(i!=1)clearMark();_tab(i);$('v5').hidden=i!=5;$('t5').setAttribute('aria-selected',i==5);if(i==5){vgSync();vfKeep();if(!$('tld').value)$('tld').value=today();var w=$('tw'),m=$('tw5');m.hidden=w.hidden;m.textContent=w.textContent.replace(' Ketuk untuk membuka Cek tarif.','').replace('Perbaiki di tab Tarif','Perbaiki di bawah').replace('di tab Tarif','di bawah')}TO.forEach(function(id){var b=$(id);b.tabIndex=b.getAttribute('aria-selected')=='true'?0:-1})};
TO.forEach(function(id){$(id).setAttribute('aria-controls',TI[id]);$(TI[id]).setAttribute('role','tabpanel');$(TI[id]).setAttribute('aria-labelledby',id)});
$('t0').parentNode.addEventListener('keydown',function(e){var c=TO.indexOf(document.activeElement.id);if(c<0)return;var n=e.key=='ArrowRight'?(c+1)%7:e.key=='ArrowLeft'?(c+6)%7:e.key=='Home'?0:e.key=='End'?6:-1;if(n<0)return;e.preventDefault();$(TO[n]).click();$(TO[n]).focus()});
/*5.73 (khusus Shopee): modul Micro-ERP (tab ERP): impor CSV Shopee, OpEx, Laba Rugi makro. Data di IndexedDB KalsaraERP, terpisah dari data lama (KStore). HPP diambil dari modal produk (SKU cocok).*/
var ERP=(function(){
var RAW=[],ITM={},OPX=[],SNAP={},CAT=['Gaji Karyawan / Admin','Sewa Tempat','Utilitas (Listrik, Air, Internet)','Pemasaran Eksternal','Perlengkapan Packing & Lain-lain'];
var ST=['products','inventory_logs','marketplaces_raw','opex','settings','order_items'];
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function rp(n){return(n<0?'-':'')+'Rp'+Math.round(Math.abs(n)).toLocaleString('id-ID')}
var MEM={};
function fbGet(s){
 if(MEM[s])return MEM[s];
 var o={};try{o=JSON.parse(KStore.getItem('kalsara_erp_'+s)||'{}')}catch(e){}
 return MEM[s]=o;
}
function fbSave(s){
 KStore.setItem('kalsara_erp_'+s,JSON.stringify(MEM[s]));
 return KStore.flush();
}
var FBERR='Penyimpanan ERP gagal. Periksa ruang penyimpanan perangkat dan buat cadangan data.';
function open(){return Promise.resolve(null)}
function all(s){if(typeof KStore.erpAll==='function')return KStore.erpAll(s);var m=fbGet(s);return Promise.resolve(Object.keys(m).map(function(k){return m[k]}))}
function put(s,list){
 var old=Object.assign({},fbGet(s)),m=Object.assign({},old);
 list.forEach(function(x){m[x.id]=x});
 MEM[s]=m;
 var save=typeof KStore.erpPut==='function'?KStore.erpPut(s,list):fbSave(s);
 return save.catch(function(e){MEM[s]=old;KStore.setItem('kalsara_erp_'+s,JSON.stringify(old));throw e});
}
function del(s,id){
 var old=Object.assign({},fbGet(s)),m=Object.assign({},old);delete m[id];MEM[s]=m;
 var save=typeof KStore.erpDelete==='function'?KStore.erpDelete(s,id):fbSave(s);
 return save.catch(function(e){MEM[s]=old;KStore.setItem('kalsara_erp_'+s,JSON.stringify(old));throw e});
}
function clr(names){
 var old={};
 names.forEach(function(s){old[s]=Object.assign({},fbGet(s));MEM[s]={};});
 return Promise.all(names.map(function(s){return typeof KStore.erpClear==='function'?KStore.erpClear(s):fbSave(s)})).catch(function(e){
  names.forEach(function(s){MEM[s]=old[s];KStore.setItem('kalsara_erp_'+s,JSON.stringify(old[s]));});
  throw e;
 });
}
function csv(t){return globalThis.KalsaraWorker.compute('parse-csv',{text:t})}
function num(v){return globalThis.KalsaraMoney.parseIDR(v)}
function dt(v){v=String(v||'');if(/^\d{5}(\.\d+)?$/.test(v))return new Date(Math.round((+v-25569)*864e5)).toISOString().slice(0,10);var m=v.match(/(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];m=v.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);return m?m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2):''}
function ix(h,n){for(var a=0;a<n.length;a++){var i=h.indexOf(n[a]);if(i>=0)return i}return -1}
function ixs(h,p){var o=[];h.forEach(function(x,i){for(var k=0;k<p.length;k++)if(x.indexOf(p[k])==0){o.push(i);return}});return o}
function sm(r,c){return globalThis.KalsaraMoney.toSafeNumber(globalThis.KalsaraMoney.sumRupiah(c.map(function(i){return num(r[i])})))}
var G={fa:['biaya administrasi'],fr:['biaya proses pesanan'],fx:['biaya spesial gratis ongkir','biaya gratis ongkir','biaya layanan'],fp:['biaya kampanye','biaya komisi ams','biaya isi saldo otomatis','fbs fee'],fk:['premi'],ft:['pph 22'],fv:['voucher disponsor oleh penjual','cashback koin disponsori penjual','voucher co-fund','cashback koin co-fund','diskon produk dari shopee','jumlah pengembalian dana ke pembeli'],fs:['ongkir dibayar pembeli','ongkos kirim yang dibayarkan','potongan ongkos kirim','gratis ongkir dari shopee','ongkos kirim pengembalian','return to seller fee','pengembalian biaya kirim']};
var SUMK=['gross_revenue','tp','fv','fs','fa','fr','fx','fp','fk','ft','platform_fee'];
function parse(R){return globalThis.KalsaraWorker.compute('parse-shopee-report',{rows:R})}
function xlsx(buf){return globalThis.KalsaraWorker.compute('parse-xlsx',{buffer:buf},[buf])}
function kind(R){for(var i=0;i<Math.min(R.length,12);i++){var l=R[i].map(function(x){return String(x==null?'':x).trim().toLowerCase()});if(l.indexOf('no. pesanan')>=0){if(l.indexOf('harga produk')>=0)return'inc';if(l.indexOf('nomor referensi sku')>=0&&l.indexOf('jumlah')>=0)return'ord'}}return''}
function parseOrders(R){return globalThis.KalsaraWorker.compute('parse-shopee-orders',{rows:R})}
function res(x){var L=ITM[x.order_id];if(!L||!L.length)return null;var nm=(x.name||'').toLowerCase().trim(),c=L.filter(function(it){var n=(it.name||'').toLowerCase().trim();return nm&&n&&(n==nm||n.slice(0,30)==nm.slice(0,30))});
if(!c.length&&L.length==1)c=L;if(c.length>1){var p=c.filter(function(it){return Math.abs(it.price*it.q0-x.gross_revenue)<2});if(p.length)c=p}return c.length===1?c[0]:null}
function mt(x){var P=window.rows||rows,sk=String(x.sku||''),rk=String(x.rsku||'').toLowerCase(),nm=(x.name||'').toLowerCase().trim();
if(rk)for(var a=0;a<P.length;a++){if(+P[a].m>0&&(P[a].sku||'').toLowerCase()==rk)return+P[a].m}
if(sk)for(var i=0;i<P.length;i++){var r=P[i];if(+r.m>0&&((r.sku||'').toLowerCase()==sk.toLowerCase()||(r.lnk||'').indexOf(sk)>=0))return+r.m}
if(nm.length>=8)for(var j=0;j<P.length;j++){var q=P[j],n2=(q.n||'').toLowerCase().trim();if(+q.m>0&&n2.length>=8&&(n2==nm||nm.indexOf(n2)==0||n2.indexOf(nm)==0))return+q.m}return null}
function calc(mo){return globalThis.KalsaraWorker.compute('aggregate-erp',{month:mo||'',raw:RAW,opex:OPX,items:ITM,snapshot:SNAP,products:(window.rows||rows).map(function(p){return{m:p.m,sku:p.sku,lnk:p.lnk,n:p.n}})})}
/*5.82: HPP dikunci. Snapshot = nilai HPP yang sama dengan hitungan saat ini, jadi mengunci tidak mengubah angka yang tampil. Hanya baris yang punya detail pesanan dan modal yang dikunci*/
function lockHpp(mo){var add={},n=0;RAW.forEach(function(x){if(mo&&x.date.slice(0,7)!=mo)return;if(SNAP[x.id])return;var it=res(x);if(!it)return;var h=mt({sku:x.sku,rsku:it.sku,name:x.name});if(h==null)return;var q=it.qty;add[x.id]={hs:h*q,m:h,q:q,d:today()};n++});
 if(!n)return Promise.resolve(0);var nm=Object.assign({},SNAP,add);return put('settings',[{id:'hpp_snap',map:nm,upd:today()}]).then(function(){SNAP=nm;return n})}
function unlockHpp(mo){var nm=Object.assign({},SNAP),n=0;RAW.forEach(function(x){if((!mo||x.date.slice(0,7)==mo)&&nm[x.id]){delete nm[x.id];n++}});
 if(!n)return Promise.resolve(0);return put('settings',[{id:'hpp_snap',map:nm,upd:today()}]).then(function(){SNAP=nm;return n})}
function months(){var m={};RAW.concat(OPX).forEach(function(x){if(x.date)m[x.date.slice(0,7)]=1});return Object.keys(m).sort().reverse()}
async function render(){var el=$('erpm'),cur=el.value;KDOM.setHTML(el, '<option value="">Semua periode</option>'+months().map(function(m){return'<option value="'+m+'">'+m+'</option>'}).join(''));el.value=months().indexOf(cur)>=0?cur:(months()[0]||'');
var T=await calc(el.value),mk=Object.keys(T.miss),L=[['Omzet (harga produk)',T.om,1],['Voucher, diskon & pengembalian dana',T.fv],['Total HPP (modal)',-T.hpp],['Ongkir ditanggung penjual (bersih)',T.fs],['Biaya administrasi',-T.fa],['Biaya Gratis Ongkir XTRA / layanan',-T.fx],['Biaya proses pesanan',-T.fr],['Iklan, kampanye & lainnya',-T.fp],['Premi',-T.fk],['PPh 22',-T.ft],['Laba kotor',T.lk,1],['Biaya operasional (OpEx)',-T.ox],['Laba bersih korporat',T.nb,1]];
var mg=T.om>0?(T.nb/T.om*100).toFixed(1)+'%':'-';
KDOM.setHTML($('erpr'), (T.n?'':'<p class="tip">Belum ada data. Impor laporan CSV di bawah, lalu isi OpEx.</p>')+L.map(function(l){return'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);'+(l[2]?'font-weight:800':'')+'"><span>'+l[0]+'</span><span style="color:'+(l[1]<0?'var(--bad)':'inherit')+'">'+rp(l[1])+'</span></div>'}).join('')+'<p class="tip" style="margin-top:8px">Margin bersih: <b>'+mg+'</b> &middot; '+T.n+' baris produk &middot; dana dilepas Shopee '+rp(T.tp)+'</p>'+(T.n?'<p class="tip" style="margin:0">HPP: '+T.nl+' dari '+T.n+' baris memakai modal yang dikunci saat impor, sisanya memakai modal saat ini.</p>':'')+(mk.length?'<div class="nt" style="margin-top:8px">'+mk.length+' produk belum cocok dengan modal produk di Kalsara, jadi HPP-nya dihitung 0: '+esc(mk.slice(0,8).join(', '))+(mk.length>8?' ...':'')+'. Isi kolom SKU di tab Hitung dengan ID Produk Shopee (atau samakan nama produknya) dan isi modalnya, agar laba tidak terlalu tinggi.</div>':''));
if(T.nr)KDOM.insertHTML($('erpr'), 'beforeend', '<div class="nt" style="margin-top:8px">'+T.nr+' baris produk belum punya detail pesanan (SKU dan jumlah asli). Impor laporan Pesanan Selesai (Order completed) untuk periode itu agar HPP akurat.</div>');if(MODE=='fb')KDOM.insertHTML($('erpr'), 'beforeend', '<div class="nt" style="margin-top:8px">Penyimpanan permanen ERP tidak tersedia di alamat ini (aplikasi dibuka dari file lokal). Data memakai penyimpanan cadangan yang bisa hilang. Buka Kalsara lewat alamat https (GitHub Pages) agar data tersimpan aman dan tidak terpisah dari data produkmu.</div>');var mo=el.value;KDOM.setHTML($('erpo'), OPX.filter(function(x){return!mo||x.date.slice(0,7)==mo}).sort(function(a,b){return a.date<b.date?1:-1}).map(function(x){return'<div style="display:flex;gap:8px;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)"><span style="min-width:0"><b>'+esc(x.category)+'</b><br><small style="color:var(--mute)">'+x.date+(x.notes?' &middot; '+esc(x.notes):'')+'</small></span><span>'+rp(x.amount)+' <button type="button" class="gh" data-d="'+x.id+'" aria-label="Hapus" style="border:0;background:none;color:var(--bad);font-weight:700;padding:6px">Hapus</button></span></div>'}).join('')||'<p class="tip">Belum ada biaya operasional untuk periode ini.</p>')}
async function chart(){var ms=months().slice(0,6).reverse(),vals=await Promise.all(ms.map(function(m){return calc(m)})),D=ms.map(function(m,i){var T=vals[i];return[m,T.om,T.hpp,T.ox,T.nb]}),mx=1;D.forEach(function(d){for(var i=1;i<5;i++)mx=Math.max(mx,Math.abs(d[i]))});
if(!D.length){KDOM.setHTML($('erpg'), '');return}var C=['var(--accent)','var(--mute)','var(--warn)',''];
KDOM.setHTML($('erpg'), '<div style="margin-bottom:8px;font-weight:700">Kesehatan keuangan bulanan</div><div style="display:flex;gap:10px;align-items:flex-end;overflow-x:auto;padding-bottom:4px">'+D.map(function(d){return'<div style="text-align:center;flex:1;min-width:64px"><div style="display:flex;gap:3px;align-items:flex-end;height:80px;justify-content:center">'+[1,2,3,4].map(function(i){var h=Math.max(Math.abs(d[i])/mx*78,d[i]?2:0);return'<i title="'+rp(d[i])+'" style="width:9px;height:'+h+'px;border-radius:3px 3px 0 0;background:'+(i==4?(d[i]<0?'var(--bad)':'var(--ok)'):C[i-1])+'"></i>'}).join('')+'</div><small style="color:var(--mute)">'+d[0].slice(2)+'</small></div>'}).join('')+'</div><div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-top:6px"><span>Omzet</span><span>HPP</span><span>OpEx</span><span>Laba bersih</span></div>')}
function reload(){return Promise.all([all('marketplaces_raw'),all('opex'),all('order_items'),all('settings')]).then(function(r){RAW=r[0];OPX=r[1];ITM={};r[2].forEach(function(o){(ITM[o.order_id]=ITM[o.order_id]||[]).push(o)});var sd=r[3].filter(function(o){return o&&o.id=='hpp_snap'})[0];SNAP=sd&&sd.map&&typeof sd.map==='object'&&!Array.isArray(sd.map)?sd.map:{};return Promise.all([render(),chart()])})}
async function txt(){var T=await calc($('erpm').value),z=function(v){return Math.round(v)};return'LAPORAN LABA RUGI MAKRO SHOPEE - '+($('erpm').value||'Semua periode')+'\nOmzet (harga produk)\t'+z(T.om)+'\nVoucher, diskon & pengembalian\t'+z(T.fv)+'\nTotal HPP\t'+z(-T.hpp)+'\nOngkir ditanggung penjual\t'+z(T.fs)+'\nBiaya administrasi\t'+z(-T.fa)+'\nBiaya Gratis Ongkir XTRA / layanan\t'+z(-T.fx)+'\nBiaya proses pesanan\t'+z(-T.fr)+'\nIklan, kampanye & lainnya\t'+z(-T.fp)+'\nPremi\t'+z(-T.fk)+'\nPPh 22\t'+z(-T.ft)+'\nLaba kotor\t'+z(T.lk)+'\nOpEx\t'+z(-T.ox)+'\nLaba bersih\t'+z(T.nb)}
function init(){KDOM.setHTML($('erpc'), CAT.map(function(c){return'<option>'+esc(c)+'</option>'}).join(''));$('erpd').value=today();
$('erpf').onchange=function(){var inp=this,fs=[].slice.call(inp.files),msg=[],say=function(){KDOM.setHTML($('erpi'), msg.map(esc).join('<br>'))},cur=function(t){KDOM.setHTML($('erpi'), msg.map(esc).join('<br>')+(msg.length?'<br>':'')+esc(t))};if(!fs.length)return;msg.push('Membaca '+fs.length+' file...');say();
var rb=function(f,t){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=function(){no(new Error('File tidak bisa dibaca. Salin dulu ke penyimpanan HP lalu pilih lagi'))};if(t)r.readAsText(f);else r.readAsArrayBuffer(f)})};
fs.reduce(function(pm,f){return pm.then(function(){cur(f.name+': membaca file...');var pr=/\.xlsx$/i.test(f.name)?rb(f).then(xlsx):/\.xls$/i.test(f.name)?Promise.reject(new Error('Format .xls lama tidak didukung. Unduh ulang sebagai .xlsx')):rb(f,1).then(function(tx){if(/^\s*\{\s*"A"\s*:/.test(String(tx).replace(/^\uFEFF/,'')))throw new Error('Ini file cadangan Kalsara, bukan laporan Shopee. Pulihkan lewat Setelan, Cadangan data, Pulihkan dari cadangan.');return csv(tx)});
return pr.then(function(R){cur(f.name+': mengurai isi...');var k=kind(R);if(k=='inc'){return parse(R).then(function(p){cur(f.name+': menyimpan...');return put('marketplaces_raw',p.rows).then(function(){msg.push(f.name+': laporan penghasilan, '+p.rows.length+' baris produk dari '+p.orders+' pesanan, dana dilepas '+rp(p.tp)+' (cocokkan dengan Total yang Dilepas di Ringkasan)')})})}
if(k=='ord'){return parseOrders(R).then(function(o){cur(f.name+': menyimpan...');return put('order_items',o.rows).then(function(){msg.push(f.name+': detail pesanan, '+o.rows.length+' baris untuk '+o.orders+' pesanan')})})}
throw new Error('Jenis file tidak dikenali (butuh Laporan Penghasilan atau Order completed)')}).catch(function(e){msg.push(f.name+': GAGAL, '+(e&&e.message||e))}).then(say)})},Promise.resolve())
.then(reload).then(function(){return lockHpp('').catch(function(e){msg.push('HPP belum bisa dikunci: '+(e&&e.message||e));return 0})}).then(function(n){if(n){msg.push('HPP dikunci untuk '+n+' baris (memakai modal saat ini, angka laporan tidak berubah)');return reload()}}).then(function(){msg.push('Selesai');say();toast('Impor selesai')}).catch(function(e){msg.push('Gagal: '+(e&&e.message||e));say()}).then(function(){inp.value=''})};
$('erpa').onclick=function(){var a=num($('erpn').value);if(!(a>0)||!$('erpd').value){toast('Isi tanggal dan nominal');return}put('opex',[{id:'o'+Date.now(),date:$('erpd').value,category:$('erpc').value,amount:a,notes:$('erpt').value.trim()}]).then(reload).then(function(){$('erpn').value='';$('erpt').value='';toast('OpEx tersimpan')}).catch(function(e){toast('OpEx gagal disimpan: '+(e&&e.message||e))})};
$('erpo').onclick=function(e){var d=e.target.getAttribute&&e.target.getAttribute('data-d');if(d&&confirm('Hapus biaya ini?'))del('opex',d).then(reload).catch(function(e){toast('Gagal menghapus: '+(e&&e.message||e))})};
$('erpm').onchange=function(){render().catch(function(e){toast('Laporan gagal dihitung: '+e.message)})};
$('erpk').onclick=function(){var mo=$('erpm').value;lockHpp(mo).then(function(n){return reload().then(function(){toast(n?'HPP dikunci untuk '+n+' baris':'Tidak ada baris baru yang bisa dikunci. Baris tanpa detail pesanan atau tanpa modal belum bisa dikunci')})}).catch(function(e){toast('Gagal mengunci HPP: '+(e&&e.message||e))})};
$('erpu').onclick=function(){var mo=$('erpm').value;if(!confirm('Hitung ulang HPP '+(mo||'semua periode')+' memakai modal produk saat ini? Laba periode itu akan berubah mengikuti modal terbaru.'))return;unlockHpp(mo).then(function(n){return reload().then(function(){toast(n?'HPP dihitung ulang untuk '+n+' baris':'Tidak ada HPP terkunci di periode ini')})}).catch(function(e){toast('Gagal menghitung ulang: '+(e&&e.message||e))})};
$('erpy').onclick=function(){txt().then(function(t){if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){toast('Laporan disalin')},function(){toast('Gagal menyalin')});else toast('Salin tidak didukung')}).catch(function(e){toast('Laporan gagal dihitung: '+e.message)})};
$('erpw').onclick=function(){window.print()};$('erpx').onclick=function(){txt().then(function(t){var b=new Blob(['\uFEFF'+t.replace(/\t/g,',')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='laba-rugi-'+($('erpm').value||'semua')+'.csv';document.body.appendChild(a);a.click();a.remove()}).catch(function(e){toast('Ekspor gagal: '+e.message)})};
$('erpz').onclick=function(){if(confirm('Hapus semua data impor marketplace di modul ERP? OpEx tidak ikut terhapus. HPP yang sudah dikunci tetap disimpan, jadi kalau file yang sama diimpor lagi, HPP lama dipakai.'))clr(['marketplaces_raw','order_items']).then(function(){reload();toast('Data impor dihapus')}).catch(function(e){toast('Gagal menghapus: '+(e&&e.message||e))})}}

/*5.81: cadangan lengkap ERP. Hanya field olahan yang disimpan; kolom data pribadi pembeli disaring lagi sebagai pengaman*/
var PIIK=/^(username|user_name|nama_penerima|penerima|telepon|no_telepon|phone|alamat|address|pembeli|buyer|kode_pos|kota|provinsi)/i;
function cln(o){if(!o||typeof o!=='object'||Array.isArray(o))return o;var r={};Object.keys(o).forEach(function(k){if(!PIIK.test(k))r[k]=o[k]});return r}
function dump(){return Promise.all(ST.map(function(s){return all(s)})).then(function(a){var st={},n={};ST.forEach(function(s,i){st[s]=a[i].map(cln);n[s]=st[s].length});return{v:1,mode:MODE||'idb',n:n,st:st}})}
function check(e){if(!e||typeof e!=='object'||!e.st||typeof e.st!=='object'||Array.isArray(e.st))return{ok:false,msg:'bagian data ERP di cadangan tidak valid'};var n={};
 for(var i=0;i<ST.length;i++){var s=ST[i],a=e.st[s];if(a===undefined)a=[];if(!Array.isArray(a))return{ok:false,msg:'data ERP rusak pada bagian '+s};var seen={};
  for(var j=0;j<a.length;j++){var x=a[j];if(!x||typeof x!=='object'||Array.isArray(x)||(typeof x.id!=='string'&&typeof x.id!=='number'))return{ok:false,msg:'data ERP rusak pada bagian '+s+' (baris '+(j+1)+' tidak punya ID)'};if(seen[x.id])return{ok:false,msg:'data ERP rusak pada bagian '+s+' (ID ganda)'};seen[x.id]=1}
  n[s]=a.length}
 return{ok:true,n:n}}
function restore(e){var c=check(e);if(!c.ok)return Promise.reject(new Error(c.msg));
 return open().then(function(d){
  if(!d){var old={};ST.forEach(function(s){old[s]=Object.assign({},fbGet(s))});
   var bad=false;ST.forEach(function(s){var m={};(e.st[s]||[]).forEach(function(x){m[x.id]=cln(x)});MEM[s]=m;if(!fbSave(s))bad=true});
   if(bad){ST.forEach(function(s){MEM[s]=old[s];fbSave(s)});throw new Error(FBERR+'. Data ERP lama dipertahankan')}return}
  return new Promise(function(ok,no){var t=d.transaction(ST,'readwrite');ST.forEach(function(s){var o=t.objectStore(s);o.clear();(e.st[s]||[]).forEach(function(x){o.put(cln(x))})});
   t.oncomplete=ok;t.onerror=function(){no(t.error||new Error('gagal menulis data ERP'))};t.onabort=function(){no(t.error||new Error('penulisan data ERP dibatalkan, data lama dipertahankan'))}})})
 .then(function(){return Promise.all(ST.map(function(s){return all(s)}))})
 .then(function(a){var bad=ST.filter(function(s,i){return a[i].length!==c.n[s]});if(bad.length)throw new Error('pemeriksaan setelah pemulihan gagal pada '+bad.join(', ')+'. Coba pulihkan lagi');return(ready?reload():Promise.resolve()).then(function(){return c.n})})}
var ready=false;function show(){if(!ready){ready=true;init()}reload().catch(function(e){KDOM.setHTML($('erpr'), '<div class="nt">Penyimpanan ERP tidak bisa dibuka: '+esc(e.message)+'</div>')})}
return{show:show,dump:dump,check:check,restore:restore}})();
var _tab6=tab;tab=function(i){_tab6(i);$('v6').hidden=i!=6;$('t6').setAttribute('aria-selected',i==6);TO.forEach(function(id){var b=$(id);b.tabIndex=b.getAttribute('aria-selected')=='true'?0:-1});if(i==6)ERP.show()};
$('t6').onclick=function(){tab(6)};
tbuild();
(function(){var d=null;try{d=JSON.parse(KStore.getItem('kalsara_v3')||'null')}catch(e){}
 if(d)applyState(d);else{fill();add();add();upd(false)}tab(0);obInit();syLocal();bkRemind()})();

/*5.71: filter Hitung memakai tanda live yang sama dengan kartu atas (Sudah live, Belum live); kartu Total produk, Sudah live, Belum live bisa diketuk untuk menyaring daftar. Produk baru diberi keterangan (harga Shopee kosong). Hanya tampilan dan penyaringan; rumus tidak berubah.*/
/*5.70: panel Tarif produk ini dirapikan: tiga bagian (kategori resmi, persen manual, biaya lain), label diperjelas, ringkasan Dipakai sekarang. Hanya tampilan; data-o dan rumus tidak berubah.*/
/*5.69: tarif Gratis Ongkir XTRA resmi mulai 1 Des 2026: tabel GO2 (A sampai H), batas Rp60.000 biasa dan Rp80.000 khusus, kategori per produk 'g2' (huruf mulai 1 Des), impor kolom XTRA menerima huruf A sampai H atau pasangan G/H (sekarang/1 Des).*/
/*5.68: perbaikan: tab Hitung kini dihitung ulang saat dibuka bila isi Promosi atau tanggal berubah (sebelumnya baru terbaca setelah refresh).*/
/*5.67: perbaikan: id kartu Total produk diganti tp1 sampai tp3 karena bentrok dengan id tombol menu t1 sampai t3.*/
/*5.66: kartu Total produk, Sudah live, Belum live di tab Hitung.*/
/*5.64: dapat dipasang ke layar utama, jalan tanpa internet, dan tombol muat versi terbaru. APPV harus sama dengan VERSI di sw.js.*/
var APPV='5.82',dip=null,swReg=null,swHad=false;
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
window.addEventListener('appinstalled',function(){dip=null;$('pwi').hidden=true;pwSt();toast('Kalsara terpasang')});
$('pwi').onclick=function(){if(!dip)return;dip.prompt();dip.userChoice.then(function(){dip=null;$('pwi').hidden=true},function(){})};
pwSt();
