/* Kalsara app-core (v9.40, Tahap 4; bagian 80 kini hanya pemasangan dua modul fitur. v9.39, Tahap 3: isi lama js/legacy/ disatukan menjadi SATU modul ES sungguhan.
 * Dulu: 12 berkas di js/legacy/ diunduh, disambung menjadi teks, dibungkus Blob, lalu dijalankan oleh js/legacy-app.js.
 * Kini: berkas ini dimuat langsung oleh main.js (dynamic import) dan memakai import eksplisit di bawah.
 * Logika dan urutan bisnis dipertahankan; akses A/rows/SALES/PRM/TS dialihkan mekanis ke State. Urutan bagian tetap sama (parts.json).
 * Setiap bagian diawali SATU baris penanda berbentuk komentar "BAGIAN nn-nama" yang diapit tanda bintang dan garis miring; baris itu dipakai tes dan peta (scripts/peta-global.mjs). Jangan dihapus atau diubah tanpa memperbarui keduanya. */
import {createERP} from './erp.js';
import {createXlsxReader} from './xlsx-reader.js';
import {createPWA} from './pwa.js';
import {rp, pf, num, fmt, PCT, today} from './format.js';
import {GO, GO2, GO2D, AD, createTariff} from './tariff.js';
import {createPricing} from './pricing.js';
import {createCalcCache} from './calc-cache.js';
import {createVoucherRules} from './voucher-rules.js';
import {State} from './state.js';
import {createPenjualan} from './penjualan.js';
import {createVoucherPanel} from './voucher-panel.js';
import {createUI} from './ui.js';
import {esc, dtx, uid, prodSig, SGL, createFeeSig} from './helpers.js';
import {createTarifUI} from './tarif-ui.js';
import {createWarnings} from './warnings.js';
import {createHasilView} from './hasil-view.js';
import {createKartuUpdate} from './kartu-update.js';
import {createUpdater, createFiller} from './upd-fill.js';
import {createEtalaseView} from './etalase-view.js';
import {createPenyimpananCadangan} from './penyimpanan-cadangan.js';
import {createPengaturan} from './pengaturan.js';
/* ===== BAGIAN 00-core ===== */
/* Compatibility module preserving the original Kalsara v5.82 business logic. */
var DEF={tp:'ns',fb:'no',fl:1250,pb:0,pbc:50000,ad:6.5,ac:'F',gc:'D',sz:'b',gf:100,gfd:'',gad:0,re:0,pp:'no',cgk:60000,cvx:20000,clv:20000,px:0,vx:0,lv:0,vp:'no',lp:'no',gm:0,wu:2000,wm:1,wp:30,cg:40000,cp:60000,pa:'yes',dm:'pct',dv:30,vm:'none',vv:0,vc:0,pm:0.5,pj:0.5,og:0,rd:100,ads:0,rt:0,sl:10,sh:5,sdy:7,tbl:null,tchk:'',tcd:30};
var OK=['ad','gx','px','vx','lv','dv'];
var $=function(i){return document.getElementById(i)};
State.A=Object.assign({},DEF);
var pr=function(r,P){return globalThis.KalsaraMoney.percentOfRupiah(P,r)};
/* ===== BAGIAN 10-calc ===== */
/*CALC*/
var {gcOf,goT,capG,gfac,goRate,adRate,rate}=createTariff({getA:function(){return State.A}});
/*5.39: voucher otomatis. Voucher manual (panel) dan voucher berjalan di kartu Promosi bersaing; yang potongannya terbesar (harga pembeli paling rendah) dipakai.*/
var VNO=0;
var VoucherRules=createVoucherRules({getPRM:function(){return State.PRM},today:today,pr:pr,fmt:fmt,rp:rp});
var {vdisc,cbc,dd,pst,vcList,vcApply,vcLab,vcBest,vcBad,vcThr}=VoucherRules;
var {vbest,volt,fees,tmod,fwdL,fwd,impas,calcSync}=createPricing({getA:function(){return State.A},getVNO:function(){return VNO},pr:pr,Money:globalThis.KalsaraMoney,
 tariff:{adRate:adRate,goRate:goRate,capG:capG,rate:rate},
 hooks:{vcBest:function(){return typeof vcBest==='function'?vcBest:undefined},vcThr:function(){return typeof vcThr==='function'?vcThr:undefined},vcBad:function(){return typeof vcBad==='function'?vcBad:undefined}}});
var CalcCache=createCalcCache({getA:function(){return State.A},getPRM:function(){return State.PRM},getRows:function(){return State.rows},getVNO:function(){return VNO},
 getWorker:function(){return globalThis.KalsaraWorker},calcSync:calcSync,onReady:function(){upd(false)}});
var calc=CalcCache.calc;
/*END*/
/* ===== BAGIAN 20-hitung-etalase ===== */
/*v9.30 (tahap 6c): tblSync, tbuild, fillT, tchk, verStale, ADN, refreshLabels (+ AD0/GO0) kini modul ES (js/tarif-ui.js; diimpor oleh loader js/legacy-app.js). Dulu deklarasi function yang di-hoist; kini var yang baru ada setelah baris ini. Pemakai saat muat sebelum baris ini: tidak ada (00-core, 10-calc). feeSig/calc/upd/fill/toast dibungkus karena nilainya baru ada/ditentukan di tempat lain. tchk dibungkus ulang di 80-cadangan-tema.js (tetap var legacy); verStale dan ADN kini privat di modul.*/
var {tblSync,tbuild,fillT,tchk,refreshLabels}=createTarifUI({getA:function(){return State.A},getRows:function(){return State.rows},$:$,document:document,KDOM:KDOM,AD:AD,GO:GO,GO2:GO2,fmt:fmt,today:today,SGL:SGL,prodSig:prodSig,feeSig:function(){return feeSig()},calc:function(){return calc.apply(null,arguments)},upd:function(){return upd.apply(null,arguments)},fill:function(){return fill()},toast:function(m){return toast(m)}});
/*v9.29 (tahap 6b): esc, dtx, uid, prodSig, SGL dan pembuat feeSig kini modul ES (js/helpers.js; diimpor oleh loader js/legacy-app.js). feeSig dipasang di sini (A dan gfac disuntikkan); dulu deklarasi function yang di-hoist, kini baru ada setelah baris ini. Tidak ada pemakai saat muat sebelum baris ini (00-core, 10-calc).*/
var feeSig=createFeeSig({getA:function(){return State.A},gfac:gfac});
/*v9.31 (tahap 6d): pc1, skHi, stk, warns, WN, mchg (peringatan stok/margin) kini modul ES (js/warnings.js; createWarnings diimpor oleh loader js/legacy-app.js). Dulu deklarasi function yang di-hoist; kini var yang baru ada setelah baris ini. Pemakai saat muat sebelum baris ini: tidak ada (semua pemakaian ada di badan fungsi, dipanggil setelah boot). calc dan fwd dibungkus (late-bound) agar tetap membaca nilai legacy terkini; A dibaca lewat getA di dalam fungsi.*/
var {pc1,skHi,stk,warns,WN,mchg}=createWarnings({getA:function(){return State.A},calc:function(){return calc.apply(null,arguments)},fwd:function(){return fwd.apply(null,arguments)},rp:rp,fmt:fmt,today:today,dtx:dtx});
/*v9.32 (tahap 6e): revHtml, CR, sp, errH (tampilan hasil kartu Hitung) kini modul ES (js/hasil-view.js; createHasilView diimpor oleh loader js/legacy-app.js). Dulu deklarasi function yang di-hoist; kini var yang baru ada setelah baris ini. Pemakai saat muat sebelum baris ini: tidak ada (semua pemakaian ada di badan updRow dan actRin di 60-tab-impor-sinkron.js, dipanggil setelah boot). fmt, rp, esc, tmod, fwdL, warns, WN, pc1 sudah ada saat pemasangan (bagian 10 dan baris di atas) dan tidak pernah ditugaskan ulang, jadi disuntikkan langsung; A dibaca lewat getA di dalam fungsi.*/
var {CR,errH,sp,revHtml}=createHasilView({getA:function(){return State.A},fmt:fmt,rp:rp,esc:esc,tmod:tmod,fwdL:fwdL,warns:warns,WN:WN,pc1:pc1});
/*v9.35 (tahap 6h): model/tampilan Etalase dipindah ke js/etalase-view.js. A/rows/PRM/CFG/VUSE/curP dibaca lewat getter saat fungsi berjalan karena dapat diganti ketika restore; actL/ptp juga dibungkus untuk menjaga urutan bagian legacy. shop tetap global agar upd dan tab impor/sinkron tidak berubah kontraknya.*/
var {errModel,actNoteModel,shopChips,shopPrice,shop}=createEtalaseView({getRows:function(){return State.rows},getA:function(){return State.A},getPRM:function(){return State.PRM},getCFG:function(){return CFG},getVUSE:function(){return VUSE},getCurP:function(){return curP},getVbest:function(){return vbest},getActL:function(){return actL},pst:pst,ptp:function(){return ptp.apply(null,arguments)},fmt:fmt,rp:rp,fwdL:fwdL,pc1:pc1,calc:function(){return calc.apply(null,arguments)},skHi:function(){return skHi()},etUn:function(r){return etUn(r)},$: $,KShelf:globalThis.KShelf});
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
 e.querySelector('.x').onclick=function(){ask('Hapus '+(r.n?'produk "'+String(r.n).slice(0,40)+'"':'produk ini')+'? Data produk ini tidak bisa dikembalikan.','Ya, hapus',function(){var ix=State.rows.indexOf(r);if(ix<0)return;State.rows.splice(ix,1);e.remove();if(!State.rows.length)add();upd(true,r)})};
 e.addEventListener('toggle',function(ev){if(ev.target.classList.contains('rd'))r.ro=ev.target.open;if(ev.target.classList.contains('rd2'))r.ro2=ev.target.open},true);r.ac=e.querySelector('.ac');r.bg=e.querySelector('.bdg');var pd=e.querySelector('.pad');if(pd&&(r.ha>0||r.hd>0))pd.open=true;r.el=e.querySelector('.res');r.cs=e.querySelector('.cs');r.sk=e.querySelector('.sk');r.mhl=e.querySelector('.mhl');r.lkx=e.querySelector('.lkx');r.cxr=e.querySelector('.cxr');r.box=e;
 refreshLabels(e)}
/*v9.8: hidrasi malas. card() hanya membuat cangkang ringan; isi formulir (cardBody) dibangun saat kartu mendekati layar, jadi ribuan produk tidak membangun ribuan formulir sekaligus.*/
var ROW_MAX=1000,HY_ALL=40,LZM=new Map(),LZ=null;
try{if(typeof IntersectionObserver=='function')LZ=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;var r=LZM.get(en.target);if(r)hyd(r)})},{rootMargin:'900px 0px'})}catch(x){LZ=null}
function card(r){var e=document.createElement('div');e.className='pc lz';e.classList.toggle('cl',!!r.c);r.box=e;r.hy=false;$('list').appendChild(e);
 if(!LZ||State.rows.length<=HY_ALL)hyd(r);else{LZM.set(e,r);LZ.observe(e)}}
function hyd(r){if(r.hy||!r.box)return;r.hy=true;var e=r.box;if(LZ){LZ.unobserve(e);LZM.delete(e)}cardBody(r,e);e.classList.remove('lz');updRow(r)}
function add(d){var r=Object.assign({n:'',m:0,d:0,p:0,t:0,o:{}},d||{});r.o=r.o||{};if(!r.id)r.id=uid();if(!(r.mb>0)&&r.m>0)r.mb=r.m;State.rows.push(r);card(r)}
function dup(r){
 if(State.rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}
 var nr=Object.assign({},strip(r),{id:uid(),s:null,sd:'',mh:[],ack:false,live:false,ha:0,hd:0,n:r.n?r.n+' (salinan)':'',o:Object.assign({},r.o||{}),c:false});
 State.rows.splice(State.rows.indexOf(r)+1,0,nr);card(nr);hyd(nr);$('list').insertBefore(nr.box,r.box.nextSibling);
 nr.box.scrollIntoView({block:'center'});upd(true);toast('Produk diduplikat')}
function colL(){var b=$('col');if(b)b.textContent=(State.rows.length&&State.rows.every(function(r){return r.c}))?'Buka semua':'Ciutkan semua'}
function dep(){var c={fl:State.A.fb=='yes',ad:State.A.ac=='man',gm:State.A.gc=='man',vv:State.A.vm!='none',vc:State.A.vm=='pct'};for(var k in c){var x=$(k);if(x)x.closest('.fl').hidden=!c[k]}colL()}
function gwarn(){var w=$('gw');if(State.A.gc!='none'&&State.A.gf<100&&!State.A.gfd){w.hidden=false;KDOM.setHTML(w, '&#9888; Gratis Ongkir XTRA dihitung '+fmt(State.A.gf)+'% dari tarif tabel tanpa tanggal berakhir. Jika Shopee sebenarnya menagih tarif penuh, harga jadi terlalu murah dan untung nyata di bawah target. <button class="lk" type="button" id="gwb">Pakai tarif penuh (100%)</button>')}else w.hidden=true}
$('gw').addEventListener('click',function(e){if(!e.target.closest('#gwb'))return;State.A.gf=100;fill();upd(true);toast('Tarif Gratis Ongkir XTRA: penuh (100%)')});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-go]');if(!b)return;var g=b.dataset.go;if(g=='set')tab(2);else{PSEL=g;tab(3)}});
/*v9.33 (tahap 6f): updRow (pembaruan isi kartu Hitung) kini modul ES (js/kartu-update.js; createKartuUpdate diimpor loader). Tetap function declaration di modul; wrapper global var mempertahankan pemakaian oleh upd. A dibaca segar lewat getA; acH/bdH/vnote/vscn late-bound karena didefinisikan pada bagian 50/60 setelah bagian 20.*/
var {updRow}=createKartuUpdate({getA:function(){return State.A},KDOM:KDOM,fmt:fmt,gfac:gfac,goRate:goRate,adRate:adRate,esc:esc,dtx:dtx,rp:rp,pc1:pc1,stk:stk,calc:function(){return calc.apply(null,arguments)},impas:impas,warns:warns,mchg:mchg,CR:CR,sp:sp,revHtml:revHtml,errH:errH,pr:pr,tmod:tmod,acH:function(){return acH.apply(null,arguments)},bdH:function(){return bdH.apply(null,arguments)},vnote:function(){return vnote.apply(null,arguments)},vscn:function(){return vscn.apply(null,arguments)},WN:WN});

/*v9.34 tahap 6g: upd dipindah ke js/upd-fill.js. Semua dependensi yang dapat berubah/baru didefinisikan di bagian lain dipanggil late-bound. PSIG ditulis melalui setter agar tetap memakai binding legacy asli.*/
var {upd}=createUpdater({getA:function(){return State.A},getRows:function(){return State.rows},CalcCache:CalcCache,tblSync:tblSync,refreshLabels:refreshLabels,tchk:function(){return tchk()},gwarn:function(){return gwarn()},vwarn:function(){return vwarn()},dep:function(){return dep()},$: $,fmt:fmt,goRate:goRate,adRate:adRate,rp:rp,updRow:updRow,flt:function(){return flt()},shop:function(){return shop()},psig:function(){return psig()},setPSIG:function(v){PSIG=v},persist:function(){return persist()}});
var {fill}=createFiller({tblSync:tblSync,paSync:function(){return paSync()},refreshLabels:refreshLabels,document:document,fmt:fmt,getA:function(){return State.A},fillT:fillT,tlRender:function(){return tlRender()}});

function flt(){var s=($('q').value||'').toLowerCase().trim(),f=$('ff').value;$('qb').hidden=State.rows.length<6&&!s&&f=='all'&&$('so').value=='0';
 State.rows.forEach(function(r){var h=!!s&&((r.n||'')+' '+(r.sup||'')+' '+(r.sku||'')).toLowerCase().indexOf(s)<0;if(f=='chk')h=h||!r.lv;if(f=='bad')h=h||r.lv!='r';if(f=='stk')h=h||!r.sl;if(f=='new')h=h||!!(r.ha>0||r.hd>0);if(f=='live')h=h||!r.live;if(f=='nlive')h=h||!!r.live;if(f=='gap')h=h||!(r.ay>0);if(f=='ok')h=h||r.u===undefined||!!r.lv;if(r.box.contains(document.activeElement))h=false;r.box.hidden=h});document.querySelectorAll('#tt3 [data-ft]').forEach(function(d){d.classList.toggle('on',d.dataset.ft==f&&f!='all')})}
function srt(){var v=$('so').value,a=State.rows.slice(),K={us:function(r){return r.u},ub:function(r){return -r.u},mg:function(r){return r.mg},hl:function(r){return -r.M}};
 if(v!='0')a.sort(function(x,y){if(v=='sk')return(x.s==null?-1:x.s)-(y.s==null?-1:y.s);if(v=='nm')return(x.n||'~').localeCompare(y.n||'~','id');var hx=x.u===undefined,hy=y.u===undefined;if(hx||hy)return hx-hy;return K[v](x)-K[v](y)});
 var L=$('list');a.forEach(function(r,i){if(L.children[i]!==r.box)L.insertBefore(r.box,L.children[i]||null)})}
$('ff').onchange=flt;
document.querySelectorAll('#tt3 [data-ft]').forEach(function(d){function go(){var v=d.dataset.ft;$('ff').value=v;$('q').value='';flt();var n=State.rows.filter(function(r){return !r.box.hidden}).length;toast(v=='all'?'Menampilkan semua produk ('+n+')':'Menampilkan '+n+' produk '+(v=='live'?'sudah live':'belum live'));var b=$('qb');if(b&&b.scrollIntoView)b.scrollIntoView({block:'start'})}d.onclick=go;d.onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();go()}}});
$('so').onchange=function(){srt();flt();toast('Urutan diterapkan')};
$('q').addEventListener('input',flt);
/*v9.28 (tahap 6a): dialog konfirmasi (ask), inertBg, dan toast kini modul ES (js/ui.js; createUI diimpor oleh loader js/legacy-app.js).
 getDprev/setDprev meneruskan dprev bersama ke dialog di js/voucher-panel.js (bagian 40). Semua pemakai ask/toast/inertBg ada di badan fungsi atau
 di bagian setelah baris ini; tidak ada pemanggilan saat muat sebelum pemasangan ini.*/
var {inertBg,ask,toast,getDprev,setDprev}=createUI({$:$,document:document});

function setStock(r,v){r.s=v;if(v!=null)r.sd=today();else r.sd='';var i=r.box.querySelector('input[data-f="s"]');if(i)i.value=v==null?'':v.toLocaleString('id-ID');upd(true)}
var ETU={},ETT={};
function etUn(r){return !!(r&&ETU[r.id]>Date.now())}
function etSet(r,on){clearTimeout(ETT[r.id]);if(on){ETU[r.id]=Date.now()+10000;ETT[r.id]=setTimeout(function(){delete ETU[r.id];var a=document.activeElement;if(a&&$('shl').contains(a)){var ia=a.shadowRoot&&a.shadowRoot.activeElement,t=ia||a;if(t.blur)t.blur()}shop()},10100)}else delete ETU[r.id]}
function etAll(){for(var k in ETT)clearTimeout(ETT[k]);ETU={};ETT={}}
/*v9.8: Etalase = Web Component <kalsara-product-card> (Shadow DOM + Signals). shop() hanya menyusun MODEL data per produk; tampilan dibuat komponen tanpa innerHTML.*/
$('shl').addEventListener('kls-lock',function(e){var r0=State.rows[e.detail.index];if(!r0)return;var on=!etUn(r0);etSet(r0,on);shop();if(on)toast('Stok terbuka 10 detik')});
$('shl').addEventListener('kls-step',function(e){var r=State.rows[e.detail.index],d=e.detail.delta;if(!r)return;if(!etUn(r)){toast('Terkunci. Ketuk ikon gembok dulu');return}etSet(r,true);if(r.s==null&&d<0){toast('Isi stok awal dulu');return}if(d<0&&r.s>0)sold(r);setStock(r,Math.min(Math.max(0,(r.s||0)+d),999999999));try{if(navigator.vibrate)navigator.vibrate(8)}catch(x){}});
$('shl').addEventListener('kls-stock',function(e){var r=State.rows[e.detail.index];if(!r)return;if(!etUn(r)){shop();return}etSet(r,true);e.detail.blur();setStock(r,e.detail.value.trim()===''?null:num(e.detail.value))});
$('shl').addEventListener('kls-voucher',function(e){var r=State.rows[e.detail.index];if(r)VUSE[r.id]=e.detail.checked});
$('shl').addEventListener('kls-go',function(e){var g=e.detail.target;if(g=='set')tab(2);else{PSEL=g;tab(3)}});
$('shl').addEventListener('kls-open',function(e){goProd(e.detail.index)});
function clearMark(){State.rows.forEach(function(r){if(r.box)r.box.classList.remove('mk')})}
function goProd(i){var r=State.rows[i];if(!r)return;hyd(r);clearMark();$('q').value='';$('ff').value='all';document.body.classList.add('swp');tab(1);r.c=false;r.box.classList.remove('cl');var g=r.box.querySelector('.tg');if(g)g.setAttribute('aria-expanded','true');flt();colL();persist();
 var done=function(){document.body.classList.remove('swp')};setTimeout(done,500);
 requestAnimationFrame(function(){requestAnimationFrame(function(){r.box.scrollIntoView({block:'start',behavior:'auto'});r.box.setAttribute('tabindex','-1');try{r.box.focus({preventScroll:true})}catch(e){}r.box.classList.add('mk');done()})})}
function tgl(){var d=new Date();$('tgl2').textContent=$('tgl').textContent=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()]+', '+d.getDate()+' '+['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()]+' '+d.getFullYear()}
document.addEventListener('visibilitychange',function(){if(!document.hidden){tgl();upd(false)}});
$('fab').onclick=function(){if(State.rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}tab(1);$('add').onclick()};

/* ===== BAGIAN 30-penjualan ===== */
/*v9.26 (tahap 5b): tab Penjualan/Laporan kini modul ES (js/penjualan.js; createPenjualan diimpor oleh loader js/legacy-app.js).
 Di sini hanya dipasang dependensi dari lingkup legacy. SALES dibaca lewat State; sold/curP/VUSE/rlAll/rpt/ymd dipakai bagian legacy lain.
 getCFG dan getSalesMax dibaca saat dipanggil karena CFG (50-promosi) dan SALES_MAX (80-cadangan-tema) didefinisikan setelah bagian ini.*/
var {rpt,sold,curP,VUSE,rlAll,ymd}=createPenjualan({st:State,$:$,esc:esc,today:today,rp:rp,num:num,toast:toast,ask:ask,uid:uid,KDOM:KDOM,calc:calc,fwdL:fwdL,vbest:vbest,actL:actL,ptp:ptp,
 getCFG:function(){return CFG},VoucherRules:VoucherRules,CalcCache:CalcCache,setStock:setStock,persist:persist,salesRows:salesRows,copySales:copySales,showCpBox:showCpBox,dl:dl,csv:csv,
 getSalesMax:function(){return SALES_MAX}});
/* ===== BAGIAN 40-voucher-panel ===== */
/*v9.27 (tahap 5c): panel "Cek pesanan nyata" dan dialog panduan/peringatan tarif kini modul ES (js/voucher-panel.js; createVoucherPanel diimpor oleh loader js/legacy-app.js).
 Di sini hanya dipasang dependensi dari lingkup legacy. A/rows dibaca lewat State; dprev (milik js/ui.js, dipakai bersama ask()) lewat getDprev/setDprev dari UI.
 Fungsi legacy yang didefinisikan bagian lain (upd, fill, syncVL, tlOk, tlRender, dtx, inertBg, prodSig, feeSig, toast, esc) adalah deklarasi function sehingga sudah tersedia saat bagian ini berjalan.
 Hanya vgSync dan vfKeep yang dipakai bagian lain (80-cadangan-tema.js, saat berpindah tab).*/
var {vgSync,vfKeep}=createVoucherPanel({st:State,$:$,esc:esc,num:num,rp:rp,today:today,pr:pr,KDOM:KDOM,KStore:KStore,document:document,calc:calc,volt:volt,fees:fees,gfac:gfac,toast:toast,upd:upd,
 fill:fill,syncVL:syncVL,prodSig:prodSig,feeSig:feeSig,tlOk:tlOk,tlRender:tlRender,dtx:dtx,inertBg:inertBg,getDprev:getDprev,setDprev:setDprev});
/* ===== BAGIAN 50-promosi ===== */
State.PRM=[];
var PSEL='',PORD=['af','lv','pt','vc','fs','vi','pd','kh','hm'];
var CFG={af:{n:'Affiliate Marketing',p:1,a:['Komisi affiliate (%)','%'],c:'af'},lv:{n:'Shopee Live & Video',p:1},pt:{n:'Promo Toko',a:['Diskon bawaan semua produk (%)','%'],x:['Batas pembelian bawaan (pcs, kosong = tanpa batas)','n'],c:'pt'},vc:{n:'Voucher',jt:1,u:1,a:['Nilai voucher','m'],cp:['Maksimum potongan (Rp)','m'],b:['Min. belanja (Rp)','m'],x:['Kuota pemakaian (pcs)','n'],m:['Jumlah maks. per pembeli (pcs)','n'],y:['Sudah digunakan (pcs)','n'],c:'vc'},fs:{n:'Flash Sale Toko Saya',p:1,a:['Harga flash sale (Rp)','m'],b:['Stok flash sale (pcs)','n'],c:'pr'},vi:{n:'Voucher Ikuti Toko',p:1,u:1,a:['Nilai voucher','m'],cp:['Maksimum potongan (Rp)','m'],b:['Minimal belanja (Rp)','m'],c:'vi'},pd:{n:'Paket Diskon',p:1,tp:1,a:['Beli (pcs)','n'],b:['Nilai diskon','%'],x:['Batas pembelian per pembeli (paket)','n'],c:'pd'},kh:{n:'Kombo Hemat',c:'kh'},hm:{n:'Hadiah Min. Belanja',b:['Minimal belanja (Rp)','m'],x:['Stok hadiah (pcs, kosong = tanpa batas)','n'],c:'hm'}};
var IC={af:'<circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M9.2 10.8l5.6-3.6M9.2 13.2l5.6 3.6"/>',lv:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M10.5 11v5l4-2.5zM8 3.5L12 7l4-3.5"/>',pt:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',vc:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',fs:'<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M5 4L3 6M19 4l2 2"/>',vi:'<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',pd:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',hm:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8h14v-8M8 8a2.5 2.5 0 0 1 0-5c2 0 4 2 4 5 0-3 2-5 4-5a2.5 2.5 0 0 1 0 5"/>',kh:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'};
function migPt(q){if(q&&q.t=='pt'&&!Array.isArray(q.it)){q.it=q.p?[{p:q.p,h:q.a||0,d:0,l:0}]:[];q.a=0;q.p=''}if(q&&q.t=='kh'&&!Array.isArray(q.it)){q.mp=q.p?[q.p]:[];q.it=[q.p2,q.p3].filter(Boolean).map(function(id){return{p:id,d:0,h:0,l:0}});if(q.a>0)q.k=(q.k?q.k+' | ':'')+'Harga kombo lama Rp'+q.a;q.a=0;q.p=q.p2=q.p3=''}return q}
function ptp(p,z,M){var d=z.d>0?z.d:p.a,L=z.h>0?Math.round(z.h):(d>0?globalThis.KalsaraMoney.percentOfRupiah(M,100-d):0);return L>0?L:0}
function rw(l,v,c){return '<div class="rw">'+l+'<b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div>'}
/*5.39: voucher otomatis. Hanya Voucher Toko dan Voucher Produk berjalan (bukan cashback, bukan Live/Video, kuota belum habis) yang ikut memengaruhi harga di tab Hitung.*/
CalcCache.invalidate();
/*5.68: Promosi tidak memicu hitung ulang tab Hitung. psig() = tanggal + isi semua promosi. upd() mencatatnya di PSIG; tab() menghitung ulang hanya bila psig() berbeda (promosi berubah, kuota voucher bertambah, atau tanggal berganti).*/
var PSIG='';
function psig(){try{return today()+'|'+JSON.stringify(State.PRM)}catch(e){return''}}
function calcNV(r){VNO=1;try{return calc(r)}finally{VNO=0}}
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


function fwdV(L,v,r,R){var P=Math.max(globalThis.KalsaraMoney.safeMoneySum([L,-v]),0),f=fees(P,R),s=globalThis.KalsaraMoney.safeMoneySum([P,-f.sh,-f.pm,-f.tax,-f.ads,-f.rt,-State.A.og]);return{L:L,v:v,P:P,sh:f.sh,pm:f.pm,tax:f.tax,ads:f.ads,rt:f.rt,s:s,u:globalThis.KalsaraMoney.safeMoneySum([s,-tmod(r)])}}
function bis(ok){var hi=1;while(!ok(hi)){hi*=2;if(hi>1e9)return null}var lo=0;while(hi-lo>1){var m=Math.floor((lo+hi)/2);if(ok(m))hi=m;else lo=m}return hi}
function pinfo(t){return'<div class="wn i">'+t+'</div>'}
function pcalc2(p,r,o){var c=CFG[p.t];
 if(c.c=='vi'){if(!(p.a>0))return pinfo('Isi nilai voucher untuk melihat hitungan untung.');
  var vf=function(L){return vdisc(p,L)},v0=vf(o.L),q=fwdV(o.L,v0,r,o.R),x=warns(q,true),mn=p.b||0,im=bis(function(L){for(var k=0;k<=5;k++)if(fwdV(L+k,vf(L+k),r,o.R).u<0)return false;return true});
  return '<div class="res">'+rw('Harga akhir produk',rp(o.L))+rw('Voucher ikuti toko'+(p.u=='pct'?' ('+fmt(p.a)+'%)':''),'- '+rp(v0))+rw('Harga setelah voucher',rp(q.P))+rw('Saldo masuk toko',rp(q.s))+rw('Modal + Management Partner + packing',rp(tmod(r)))+rw(q.u<0?'Rugi bersih':'Untung bersih',(q.u<0?'- ':'')+rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',pc1(x.m)+'%')+(im===null?'':rw('Harga akhir minimal agar tidak rugi',rp(im)))+WN(x)+(mn>0&&o.L<mn?pinfo('Harga 1 pcs di bawah minimal belanja ('+rp(mn)+'). Voucher baru terpakai jika pembeli membeli minimal '+Math.ceil(mn/o.L)+' pcs. Hitungan di atas untuk 1 pcs.'):'')+pinfo('Dihitung menggantikan voucher toko di panel Voucher.')+'</div>'}
 return''}
function actPromo(r,o){var pm=null;State.PRM.forEach(function(q){if(pst(q).k!='a'||!CFG[q.t])return;var a=0;if(CFG[q.t].c=='pr'&&q.p===r.id)a=q.a;else if(q.t=='pt'&&q.it){var iz=q.it.filter(function(z){return z.p===r.id})[0];if(iz)a=ptp(q,iz,o.M)}if(!(a>0))return;if(!pm||a<pm.a)pm={a:a,t:q.t}});return pm}
function pgm(p){var h='<div class="pit">'+pinfo('Pembeli yang belanja minimal nilai di atas dari produk utama mendapat 1 hadiah gratis. Biaya hadiah (modal + Management Partner + packing) ditanggung toko. Pembeli memilih salah satu produk hadiah.')+'<div class="pith">Produk utama</div>';
 (p.mp||[]).forEach(function(id,ix){var r=State.rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-mi="'+ix+'"><div class="pin"><span>'+esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-kmdel aria-label="Hapus produk utama">&#10005;</button></div></div>'});
 h+='<select data-kmadd aria-label="Tambah produk utama"><option value="">+ Tambah produk utama</option>'+State.rows.filter(function(r){return (p.mp||[]).indexOf(r.id)<0}).map(function(r){return '<option value="'+esc(r.id)+'">'+esc((r.n||'(tanpa nama)')+(r.live?' • live':''))+'</option>'}).join('')+'</select><div class="pith" style="margin-top:12px">Produk hadiah</div>';
 (p.gf||[]).forEach(function(id,ix){var r=State.rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-gi="'+ix+'"><div class="pin"><span>'+esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-gfdel aria-label="Hapus produk hadiah">&#10005;</button></div></div>'});
 return h+'<select data-gfadd aria-label="Tambah produk hadiah"><option value="">+ Tambah produk hadiah</option>'+State.rows.filter(function(r){return (p.gf||[]).indexOf(r.id)<0}).map(function(r){return '<option value="'+esc(r.id)+'">'+esc(r.n||'(tanpa nama)')+'</option>'}).join('')+'</select></div>'}
document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-gfadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.gf=x.p.gf||[]).push(t.value);persist();prRender()});
document.addEventListener('click',function(e){var d=e.target.closest&&e.target.closest('[data-gfdel]');if(!d)return;var x=ptc(e);if(!x)return;x.p.gf.splice(+d.closest('.pii').dataset.gi,1);persist();prRender()});
function phm(p){var gr=function(id){return State.rows.filter(function(x){return x.id===id})[0]},mains=(p.mp||[]).map(gr).filter(Boolean),gifts=(p.gf||[]).map(gr).filter(Boolean),mn=p.b||0;
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
function pkombo(p){var gr=function(id){return State.rows.filter(function(x){return x.id===id})[0]},mains=(p.mp||[]).map(gr).filter(Boolean),it=p.it||[];
 if(!mains.length)return pinfo('Pilih minimal 1 produk utama.');if(!it.length)return pinfo('Tambah produk tambahan dan atur diskonnya. Diskon tiap produk boleh berbeda.');
 var ex=State.A.og+(State.A.fb=='yes'?State.A.fl:0),h='',bad=0,thin=0,n=0,mu=mains.map(function(r){var o=calc(r);if(!o||o.err)return null;var pm=actPromo(r,o),L=pm?pm.a:o.L,q=fwdL(L,r,o.R);return{r:r,u:q.u,L:L,pn:pm?CFG[pm.t].n:''}}).filter(Boolean);
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
 var rs=jt=='toko'?State.rows.filter(function(r){return r.m>0}):[p.p,p.p2,p.p3].filter(Boolean).map(function(id){return State.rows.filter(function(x){return x.id===id})[0]}).filter(Boolean),h='<div class="res">',ks=p.x>0?p.x:0,us=p.y||0;
 if(ks){h+=rw('Kuota',ks.toLocaleString('id-ID')+' pcs')+rw('Sudah digunakan',us.toLocaleString('id-ID')+' pcs')+rw('Tersisa',Math.max(ks-us,0).toLocaleString('id-ID')+' pcs');var un=(p.u=='pct'||p.u=='cb')?(p.cp>0?p.cp:0):p.a;if(un>0)h+=rw('Estimasi pengeluaran maks. (kuota x '+((p.u=='pct'||p.u=='cb')?'maks. potongan':'nilai')+')',rp(ks*un))+rw('Pengeluaran terpakai (maks.)',rp(us*un))+(p.m>0?rw('Maks. per pembeli ('+p.m+' pcs)',rp(p.m*un)):'');else if(p.u=='pct'||p.u=='cb')h+=pinfo('Isi maksimum potongan untuk melihat estimasi pengeluaran.')}
 if(!rs.length)return h+pinfo(jt=='toko'?'Belum ada produk dengan modal terisi di tab Hitung.':'Pilih produk untuk melihat hitungan untung.')+'</div>';
 var bad=[],thin=0,n=0,ln='',win=0,los=0,nmn=0,act=vcList().indexOf(p)>=0;
 rs.forEach(function(r){var o=calc(r);if(!o||o.err)return;n++;if(act){if(o.vq===p)win++;else if(p.b>0&&o.L<p.b)nmn++;else if(o.v>0)los++}var v=vf(o.L),q=fwdV(o.L,v,r,o.R);if(p.u=='cb'){var cc=cbc(p,o.L);q.u-=cc;q.s-=cc}var x=warns(q,true);
  if(q.u<0)bad.push(r.n||'(tanpa nama)');else if(x.lv)thin++;
  if(jt!='toko')ln+=rw(esc(r.n||'(tanpa nama)'),(q.u<0?'Rugi ':'Untung ')+rp(Math.abs(q.u))+' ('+pc1(x.m)+'%)',q.u<0?'bad':(q.u<State.A.wu||x.m<State.A.wm)?'':'ok')+(p.b>0&&o.L<p.b?'<div class="stk" style="margin:0 2px">Min. belanja '+rp(p.b)+': perlu '+Math.ceil(p.b/o.L)+' pcs</div>':'')});
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
function pdet(p,z){var r=State.rows.filter(function(x){return x.id===z.p})[0];if(!r)return{h:''};var o=calc(r),nm=esc(r.n||'(tanpa nama)');
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
function pitM(z){var r=State.rows.filter(function(x){return x.id===z.p})[0],o=r?calc(r):null;return o&&!o.err&&o.M>0?o.M:0}
function pitH(M,d){return Math.round(M*(100-d)/100).toLocaleString('id-ID')}
function pitD(M,h){return fmt(Math.round(Math.max((M-h)/M*100,0)*10)/10)}
function pitPh(p,M){return{d:p.a>0?fmt(p.a):'0',h:(M>0&&p.a>0)?pitH(M,p.a):'otomatis'}}
function pds(d){return d.n?(d.u<0?'Rugi ':'Untung ')+rp(Math.abs(d.u)):'Belum dihitung'}
function pdd(p,z){var d=pdet(p,z);return '<details class="pdd"'+(z.ro?' open':'')+'><summary><span>Rincian hitungan</span><b class="pds '+(d.n?(d.bad?'bad':'ok'):'')+'">'+pds(d)+'</b></summary><div class="pdt">'+d.h+'</div></details>'}
function pitSync(c,p){c.querySelectorAll('.pii[data-ix]').forEach(function(ii){var z=(p.it||[])[+ii.dataset.ix];if(!z)return;var M=pitM(z),ph=pitPh(p,M),a=ii.querySelector('.pdt'),d=ii.querySelector('[data-it=d]'),h=ii.querySelector('[data-it=h]');if(a){var dd=pdet(p,z);KDOM.setHTML(a, dd.h);var sm=ii.querySelector('.pds');if(sm){sm.textContent=pds(dd);sm.className='pds '+(dd.n?(dd.bad?'bad':'ok'):'')}}if(d)d.placeholder=ph.d;if(h)h.placeholder=ph.h})}
function pitems(p){var kh=p.t=='kh',h='<div class="pit"><div class="pith">'+(kh?'Produk tambahan (dapat diskon, bisa berbeda tiap produk)':'Produk dalam promo (diskon bisa berbeda tiap produk)')+'</div>';
 (p.it||[]).forEach(function(z,ix){var r=State.rows.filter(function(x){return x.id===z.p})[0];
  var M=kh?0:pitM(z),ph=kh?{d:(p.a>0?fmt(p.a):'0'),h:'otomatis'}:pitPh(p,M),dv=z.d>0?fmt(z.d):(M>0&&z.h>0?pitD(M,z.h):''),hv=z.h>0?z.h.toLocaleString('id-ID'):(M>0&&z.d>0?pitH(M,z.d):'');
  h+='<div class="pii" data-ix="'+ix+'"><div class="pin"><span>'+esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-itdel aria-label="Hapus produk dari promo">&#10005;</button></div><div class="g3"><div><label>Diskon (%)</label><input data-it="d" inputmode="decimal" placeholder="'+ph.d+'" value="'+dv+'"></div><div><label>Harga promo (Rp)</label><input data-it="h" inputmode="numeric" placeholder="'+ph.h+'" value="'+hv+'"></div><div><label>Batas beli</label><input data-it="l" inputmode="numeric" placeholder="'+(p.x>0?p.x:'-')+'" value="'+(z.l>0?z.l:'')+'"></div></div><div class="pia"><select data-itsw aria-label="Ganti produk ini"><option value="">Ganti produk...</option>'+State.rows.filter(function(r2){return r2.id!==z.p&&!(p.it||[]).some(function(y){return y.p===r2.id})&&!(kh&&(p.mp||[]).indexOf(r2.id)>=0)}).map(function(r2){return '<option value="'+esc(r2.id)+'">'+esc((r2.n||'(tanpa nama)')+(r2.live?' \u2022 live':''))+'</option>'}).join('')+'</select><button class="lk" type="button" data-itrs>Kosongkan isian</button></div>'+(kh?'':pdd(p,z))+'</div>'});
 return h+'<select data-itadd aria-label="'+(kh?'Tambah produk tambahan':'Tambah produk ke promo')+'"><option value="">'+(kh?'+ Tambah produk tambahan':'+ Tambah produk ke promo')+'</option>'+State.rows.filter(function(r){return !(p.it||[]).some(function(z){return z.p===r.id})&&!(kh&&(p.mp||[]).indexOf(r.id)>=0)}).map(function(r){return '<option value="'+esc(r.id)+'">'+esc((r.n||'(tanpa nama)')+(r.live?' \u2022 live':''))+'</option>'}).join('')+'</select>'+(kh?'':'<button class="lk" type="button" data-itall>Masukkan semua produk live</button>')+'</div>'}
function pmain(p){var h='<div class="pit">'+pinfo('Aturan hadiah: pembeli membeli produk utama, lalu mendapat diskon untuk produk tambahan.')+'<div class="pith">Produk utama</div>';
 (p.mp||[]).forEach(function(id,ix){var r=State.rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-mi="'+ix+'"><div class="pin"><span>'+esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-kmdel aria-label="Hapus produk utama">&#10005;</button></div></div>'});
 return h+'<select data-kmadd aria-label="Tambah produk utama"><option value="">+ Tambah produk utama</option>'+State.rows.filter(function(r){return (p.mp||[]).indexOf(r.id)<0&&!(p.it||[]).some(function(z){return z.p===r.id})}).map(function(r){return '<option value="'+esc(r.id)+'">'+esc((r.n||'(tanpa nama)')+(r.live?' \u2022 live':''))+'</option>'}).join('')+'</select></div>'}
document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-kmadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.mp=x.p.mp||[]).push(t.value);persist();prRender()});
document.addEventListener('click',function(e){var d=e.target.closest&&e.target.closest('[data-kmdel]');if(!d)return;var x=ptc(e);if(!x)return;x.p.mp.splice(+d.closest('.pii').dataset.mi,1);persist();prRender()});
function ptc(e){var c=e.target.closest('.pe');return c&&State.PRM[+c.dataset.i]?{c:c,p:State.PRM[+c.dataset.i]}:null}
document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-itadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.it=x.p.it||[]).push({p:t.value,d:0,h:0,l:0});persist();prRender()});
document.addEventListener('click',function(e){var del=e.target.closest&&e.target.closest('[data-itdel]'),all=e.target.closest&&e.target.closest('[data-itall]');if(!del&&!all)return;var x=ptc(e);if(!x)return;if(del)x.p.it.splice(+del.closest('.pii').dataset.ix,1);else State.rows.forEach(function(r){if(r.live&&r.m>0&&!(x.p.it||[]).some(function(z){return z.p===r.id}))(x.p.it=x.p.it||[]).push({p:r.id,d:0,h:0,l:0})});persist();prRender()});
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
 hay=opts.map(function(o){var r=State.rows.filter(function(x){return x.id===o.value})[0];return(o.text+' '+(r?(r.sku||'')+' '+(r.sup||''):'')).toLowerCase()});
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
 var r=State.rows.filter(function(x){return x.id===p.p})[0];
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
 var optf=function(key){return '<option value="">Pilih produk</option>'+State.rows.map(function(r){return '<option value="'+esc(r.id)+'"'+(r.id===p[key]?' selected':'')+'>'+esc((r.n||'(tanpa nama)')+(r.live?' • live':''))+'</option>'}).join('')};
 var sel=function(key,lb){return '<div style="grid-column:1/-1"><label>'+lb+'</label><select data-pf="'+key+'">'+optf(key)+'</select></div>'};
 var jt0=p.jt||'toko',jsel=c.jt?'<div style="grid-column:1/-1"><label>Jenis voucher</label><select data-pf="jt">'+[['toko','Voucher Toko (semua produk)'],['produk','Voucher Produk (produk pilihan)'],['live','Voucher Live (hanya Shopee Live)'],['video','Voucher Video (hanya Shopee Video)']].map(function(o){return '<option value="'+o[0]+'"'+(o[0]==jt0?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>':'';
 var tsel=c.tp?'<div style="grid-column:1/-1"><label>Tipe paket diskon</label><select data-pf="tp">'+[['pct','Persentase diskon'],['nom','Nominal diskon'],['hrg','Harga paket diskon']].map(function(o){return '<option value="'+o[0]+'"'+(o[0]==(p.tp||'pct')?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>':'';
 var usel=c.u?'<div style="grid-column:1/-1"><label>Jenis diskon</label><select data-pf="u"><option value="rp"'+((p.u!='pct'&&p.u!='cb')?' selected':'')+'>Nominal Diskon (Rp)</option><option value="pct"'+(p.u=='pct'?' selected':'')+'>Persentase Diskon (%)</option>'+(p.t=='vc'?'<option value="cb"'+(p.u=='cb'?' selected':'')+'>Cashback Koin</option>':'')+'</select></div>':'';
 var dts='<div><label>Waktu mulai</label><input type="date" data-pf="s" value="'+esc(p.s||'')+'"></div><div><label>Waktu berakhir</label><input type="date" data-pf="e" value="'+esc(p.e||'')+'"></div>';
 return '<div class="pe" data-i="'+i+'"><div class="peh"><span class="pty">'+c.n+'</span><span class="pst"></span><button class="x" type="button" data-del aria-label="Hapus promo">&#10005;</button></div><input class="nm" data-pf="n"'+(p.t=='kh'?' maxlength="25"':'')+' placeholder="Nama promo atau kode" aria-label="Nama promo" value="'+esc(p.n||'')+'"><div class="g">'+(c.c=='vc'?'':dts)+''+(c.jt?jsel+(jt0!='toko'?sel('p','Produk 1')+sel('p2','Produk 2 (opsional)')+sel('p3','Produk 3 (opsional)'):''):c.ps?sel('p','Produk 1')+sel('p2','Produk 2')+sel('p3','Produk 3 (opsional)'):c.p?sel('p','Produk'):'')+usel+tsel+fld('a',c.a)+((p.u=='pct'||p.u=='cb')?fld('cp',c.cp):'')+fld('b',c.b)+fld('x',c.x)+fld('m',c.m)+fld('y',c.y)+(c.c=='vc'?dts:'')+'<div style="grid-column:1/-1"><label>Catatan</label><input data-pf="k" style="text-align:left" placeholder="Opsional" value="'+esc(p.k||'')+'"></div></div>'+(p.t=='pt'?pitems(p):p.t=='kh'?pmain(p)+pitems(p):p.t=='hm'?pgm(p):'')+'<div class="prc"></div></div>'}
function prRes(c,p){var s=pst(p),e=c.querySelector('.pst');e.className='pst '+s.k;e.textContent=s.t;KDOM.setHTML(c.querySelector('.prc'), pcalc(p));if(p.t=='pt')pitSync(c,p);prTiles()}
function paSync(){var off=State.A.pa=='no';document.querySelectorAll('[data-pa]').forEach(function(x){x.hidden=off});var e=$('pa');if(e&&e.value!=(off?'no':'yes'))e.value=off?'no':'yes'}
function prTiles(){var h='',cnt={},tot={a:0,u:0,e:0};
 State.PRM.forEach(function(p){var k=pst(p).k;if(k=='a'||k=='u'){cnt[p.t]=(cnt[p.t]||0)+1}if(tot[k]!==undefined)tot[k]++});
 PORD.forEach(function(k){h+='<button type="button" class="tl'+(PSEL==k?' on':'')+'" data-pt="'+k+'" aria-pressed="'+(PSEL==k)+'"><span class="tc"><svg viewBox="0 0 24 24">'+IC[k]+'</svg>'+(cnt[k]?'<i>'+cnt[k]+'</i>':'')+'</span><span class="tn">'+CFG[k].n+'</span></button>'});
 KDOM.setHTML($('prt'), h);$('prs').textContent=State.PRM.length?tot.a+' berjalan, '+tot.u+' akan datang, '+tot.e+' berakhir':'Pilih jenis promo, lalu tekan tombol Tambah.';
 $('vcs').hidden=PSEL!='vc';$('pts').hidden=PSEL!='pt';paSync();var b=$('pra');b.textContent=PSEL?'Tambah '+CFG[PSEL].n:'Pilih jenis promo di atas';b.className='btn'+(PSEL?'':' gh')}
function prRender(){VoucherRules.reset();CalcCache.invalidate();prTiles();var ix=[];State.PRM.forEach(function(p,i){if(!PSEL||p.t==PSEL)ix.push(i)});
 var ord={a:0,u:1,n:2,e:3};ix.sort(function(x,y){var a=ord[pst(State.PRM[x]).k],b=ord[pst(State.PRM[y]).k];return a-b||(State.PRM[x].s||'').localeCompare(State.PRM[y].s||'')});
 KDOM.setHTML($('prl'), ix.length?ix.map(function(i){return pfCard(i,State.PRM[i])}).join(''):'<div class="si"><div class="empty">'+(PSEL?'Belum ada '+CFG[PSEL].n+'. Tekan tombol Tambah di bawah.':'Belum ada promo.')+'</div></div>');
 document.querySelectorAll('#prl .pe').forEach(function(c){prRes(c,State.PRM[+c.dataset.i])})}
$('prt').addEventListener('click',function(e){var b=e.target.closest('[data-pt]');if(!b)return;PSEL=PSEL==b.dataset.pt?'':b.dataset.pt;prRender()});
$('pra').onclick=function(){if(!PSEL){toast('Pilih jenis promo dulu');return}if(State.PRM.length>=300){toast('Maksimal 300 promo');return}
 State.PRM.push({id:uid(),t:PSEL,n:'',s:today(),e:'',p:'',a:0,b:0,k:'',it:[],mp:[],gf:[]});prRender();persist();var c=$('prl').querySelector('.pe[data-i="'+(State.PRM.length-1)+'"]');if(c){c.scrollIntoView({block:'center'});c.querySelector('input').focus()}};
$('prl').addEventListener('click',function(e){if(!e.target.closest('[data-del]'))return;var c=e.target.closest('.pe'),p=State.PRM[+c.dataset.i];ask('Hapus promo ini?','Ya, hapus',function(){State.PRM.splice(State.PRM.indexOf(p),1);prRender();persist();toast('Promo dihapus')})});
$('prl').addEventListener('input',function(e){var t=e.target,c=t.closest('.pe');if(!c||!t.dataset.pf)return;var p=State.PRM[+c.dataset.i],k=t.dataset.pf;VoucherRules.reset();CalcCache.invalidate();
 if(k=='a'||k=='b'||k=='x'||k=='y'||k=='m'||k=='cp'){var u=pun(p,k);if(u=='%'){var v=(t.value.trim()===''?NaN:Number(t.value.replace(',','.')));p[k]=isNaN(v)||v<0?0:Math.min(v,100)}else{var n=num(t.value);p[k]=n;t.value=n?n.toLocaleString('id-ID'):''}}
 else if(k=='u'){p.u=t.value;p.a=0;prRender();persist();return}
 else if(k=='tp'){p.tp=t.value;p.b=0;prRender();persist();return}
 else if(k=='jt'){p.jt=t.value;prRender();persist();return}
 else p[k]=(k=='n'||k=='k')?t.value.slice(0,120):t.value;
 prRes(c,p);persist()});
/* ===== BAGIAN 60-tab-impor-sinkron ===== */
function tab(i){if(i==1&&psig()!==PSIG)upd(false);if(i!=0)etAll();rlAll();$('v4').hidden=i!=4;$('t4').setAttribute('aria-selected',i==4);if(i==4){rpt()}$('v3').hidden=i!=3;$('t3').setAttribute('aria-selected',i==3);if(i==3){tgl();prRender()}$('fab').hidden=i!=0;$('v0').hidden=i!=0;$('top').hidden=i!=1;$('v1').hidden=i!=1;$('v2').hidden=i!=2;$('t0').setAttribute('aria-selected',i==0);$('t1').setAttribute('aria-selected',i==1);$('t2').setAttribute('aria-selected',i==2);if(i==1)srt();if(i==0){tgl();shop()}window.scrollTo({top:0,left:0,behavior:'instant'})}
$('t0').onclick=function(){tab(0)};$('t1').onclick=function(){tab(1)};$('t2').onclick=function(){tab(2)};$('t3').onclick=function(){tab(3)};$('t4').onclick=function(){tab(4)};$('t5').onclick=function(){tab(5)};
$('add').onclick=function(){if(State.rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}$('q').value='';$('ff').value='all';$('so').value='0';add();var c=$('list').lastChild;c.scrollIntoView({block:'center'});c.querySelector('input').focus();upd(false)};
$('col').onclick=function(){var all=State.rows.length&&State.rows.every(function(r){return r.c});State.rows.forEach(function(r){r.c=!all;r.box.classList.toggle('cl',!all);var tg=r.box.querySelector('.tg');if(tg)tg.setAttribute('aria-expanded',all)});colL();persist()};
$('rst').onclick=function(){ask('Kosongkan semua produk? Semua data produk akan terhapus.','Ya, kosongkan',function(){State.rows=[];KDOM.setHTML($('list'), '');add();upd(true);toast('Semua produk dikosongkan')})};
var HD=['Produk','Isi paket','Stok Shopee','Tanggal cek stok','Supplier','SKU','Link supplier','Modal supplier','Biaya Management Partner','Biaya packing','Total modal','Target untung','Harga listing awal','Harga diskon coret','Voucher toko','Harga setelah voucher','Tarif administrasi (%)','Tarif Gratis Ongkir XTRA (%)','Tarif Promo XTRA (%)','Tarif Video XTRA (%)','Tarif Live XTRA (%)','Biaya administrasi','Biaya Gratis Ongkir XTRA','Biaya Promo XTRA','Biaya Video XTRA','Biaya Live XTRA','Biaya pembayaran','Biaya layanan pesanan','Total Biaya Shopee','Premi','PPh 22','Biaya iklan','Cadangan retur','Ongkir ditanggung','Saldo masuk','Untung bersih','Margin (%)','Harga impas (diskon coret)'];
function tbl(){var o=[HD];
 State.rows.forEach(function(r){var c=calc(r);if(c&&!c.err){var im=impas(r,c.R);o.push([(r.n||'-').replace(/[\t\r\n]+/g,' '),r.q>0?r.q:1,r.s==null?'':r.s,r.sd||'',r.sup||'',r.sku||'',r.lnk||'',r.m,r.d,r.p,tmod(r),r.t,c.M,c.L,c.v,c.P,fmt(c.R.ad),fmt(c.R.gx),fmt(c.R.px),fmt(c.R.vx),fmt(c.R.lv),c.b.ad,c.b.gx,c.b.px,c.b.vx,c.b.lv,c.b.pay,c.b.fx,c.sh,c.pm,c.tax,c.ads,c.rt,State.A.og,c.s,c.u,pc1(c.P>0?c.u/c.P*100:0),im===null?'':im])}});
 return o}
$('cpy').onclick=function(){var o=tbl();
 if(o.length<2){toast('Belum ada hasil untuk disalin');return}
 try{navigator.clipboard.writeText(o.map(function(x){return x.map(function(v){return typeof v=='string'?csvSafe(v.replace(/[\t\r\n]+/g,' ')):v}).join('\t')}).join('\n')).then(function(){toast('Hasil tersalin')},function(){toast('Gagal menyalin')})}catch(e){toast('Gagal menyalin')}};
function salesRows(){if(!State.SALES.length)return null;return [['Tanggal','Jam','Produk','Harga jual','Untung','Sumber harga','Harga ideal','Untung di harga ideal','Selisih untung']].concat(State.SALES.slice().sort(function(a,b){return a.t-b.t}).map(function(x){var t=new Date(x.t);return[x.d,String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0'),x.n,Math.round(x.a),Math.round(x.u),({akt:'Harga aktual',promo:'Promo',ideal:'Harga ideal'}[x.sr]||''),x.pi>0?Math.round(x.pi):'',x.pi>0?Math.round(x.ui):'',x.pi>0?Math.round(x.ui-x.u):'']}))}
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
function impGo(d){var old=State.rows.filter(function(r){return r.n||r.m||r.d||r.p||r.t}).map(strip);State.rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});
 var k=Math.min(ROW_MAX-State.rows.length,d.length);
 d.slice(0,k).forEach(function(x){add({n:String(x[0]||'').trim().slice(0,120),m:num(x[1]),d:num(x[2]),p:num(x[3]),t:num(x[4]),q:num(x[5]),s:(x[6]===undefined||String(x[6]).trim()==='')?null:num(x[6]),sd:(x[6]===undefined||String(x[6]).trim()==='')?'':today(),sup:String(x[7]||'').trim().slice(0,120),sku:String(x[8]||'').trim().slice(0,60),lnk:String(x[9]||'').trim().slice(0,300),o:impGxO(x[10])})});
 if(!State.rows.length)add();$('q').value='';upd(true);srt();toast(k+' produk diimpor'+(k<d.length?' (batas '+ROW_MAX+' produk)':''))}
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
 var old=State.rows.map(strip),by={},bn={};
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
  State.rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});upd(true);srt();toast('Disinkron: '+mc+' modal, '+sc+' stok')})}
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
 CR('Tarif administrasi',R.ad,b.ad,b.ad)+CR('Tarif Gratis Ongkir XTRA',R.gx,b.gx,Math.round(R.gx/100*a.P))+CR('Tarif Promo XTRA',R.px,b.px,Math.round(R.px/100*a.P))+CR('Tarif Video XTRA',R.vx,b.vx,Math.round(R.vx/100*a.P))+CR('Tarif Live XTRA',R.lv,b.lv,Math.round(R.lv/100*a.P))+CR('Biaya pembayaran',State.A.pb,b.pay,pr(State.A.pb,a.P))+(b.fx?'<div class="rw">Biaya layanan pesanan<b>'+rp(b.fx)+'</b></div>':'')+
 '<div class="rw">Total Biaya Shopee<b>'+rp(a.sh)+'</b></div><div class="rw">Premi<b>'+rp(a.pm)+'</b></div><div class="rw">PPh 22<b>'+rp(a.tax)+'</b></div>'+
 (a.ads?'<div class="rw">Biaya iklan ('+fmt(R.ads)+'%)<b>'+rp(a.ads)+'</b></div>':'')+(a.rt?'<div class="rw">Cadangan retur ('+fmt(R.rt)+'%)<b>'+rp(a.rt)+'</b></div>':'')+(State.A.og?'<div class="rw">Ongkir ditanggung<b>'+rp(State.A.og)+'</b></div>':'')+
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
 var old=State.rows.map(strip),by={},bn={};
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
  State.rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});upd(true);srt();toast('Harga aktual terisi di '+L.length+' produk')})}
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
/* ===== BAGIAN 70-xlsx-reader ===== */
createXlsxReader({$, today, toast, ask, upd, srt, add, strip, getRows:function(){return State.rows}, replaceRows:function(v){State.rows=v}, KDOM, num, parseCsv, KStore});
/* ===== BAGIAN 80-cadangan-tema ===== */
/*v9.40 (Tahap 4): seluruh isi bagian ini pindah ke dua modul fitur. js/penyimpanan-cadangan.js = penyimpanan, status, cadangan, pemulihan, pengingat.
 js/pengaturan.js = catatan tarif, kolom pengaturan, reset, tema, onboarding, pengikat tab/Cek tarif. Di sini hanya dipasang dependensinya.*/
/*ERP dipasang di bagian 90 (SESUDAH ini): fasad dibaca saat dipanggil, bukan disalin saat muat.*/
var ERPLate={dump:function(){return ERP.dump.apply(ERP,arguments)},check:function(){return ERP.check.apply(ERP,arguments)},restore:function(){return ERP.restore.apply(ERP,arguments)}};
var Simpan=createPenyimpananCadangan({$:$,DEF:DEF,ROW_MAX:ROW_MAX,CalcCache:CalcCache,VoucherRules:VoucherRules,ERP:ERPLate,add:add,fill:fill,upd:upd,ask:ask,toast:toast,dl:dl,migPt:migPt,prRender:prRender,strip:strip,ymd:ymd});
var Atur=createPengaturan({$:$,DEF:DEF,ask:ask,toast:toast,fill:fill,upd:upd,paSync:paSync,clearMark:clearMark,vfKeep:vfKeep,vgSync:vgSync,
 tab:function(){return tab.apply(null,arguments)},
 wrapTab:function(mk){tab=mk(tab)},
 wrapTchk:function(mk){tchk=mk(tchk)}});
/*Fungsi penerus: dulu nama-nama ini adalah deklarasi function di bagian ini (di-hoist, sudah ada sejak awal berkas). Bagian 30 dan 40 menyalin persist, syncVL, tlOk, tlRender SAAT MUAT,
 sebelum baris pemasangan di atas berjalan; deklarasi function tetap menjaga salinan itu valid. Dihapus bersama bagian 30/40/95 pada tahap berikutnya.*/
function persist(){return Simpan.persist.apply(null,arguments)}
function lflush(){return Simpan.lflush.apply(null,arguments)}
function applyState(){return Simpan.applyState.apply(null,arguments)}
function bkRemind(){return Simpan.bkRemind.apply(null,arguments)}
function syLocal(){return Simpan.syLocal.apply(null,arguments)}
function tlOk(){return Atur.tlOk.apply(null,arguments)}
function tlRender(){return Atur.tlRender.apply(null,arguments)}
function syncVL(){return Atur.syncVL.apply(null,arguments)}
function obInit(){return Atur.obInit.apply(null,arguments)}
var SALES_MAX=Simpan.SALES_MAX,TO=Atur.TO;
/* ===== BAGIAN 90-erp ===== */
/*v9.15 (tahap 2): modul ERP kini modul ES sungguhan di js/erp.js. Di sini hanya dipasang dependensi dari lingkup legacy; createERP diimpor oleh loader (js/legacy-app.js).*/
var ERP=createERP({$:$,today:today,toast:toast,getRows:function(){return State.rows}});
/* ===== BAGIAN 95-boot ===== */
var _tab6=tab;tab=function(i){_tab6(i);$('v6').hidden=i!=6;$('t6').setAttribute('aria-selected',i==6);TO.forEach(function(id){var b=$(id);b.tabIndex=b.getAttribute('aria-selected')=='true'?0:-1});if(i==6)ERP.show()};
$('t6').onclick=function(){tab(6)};
tbuild();
(function(){var d=null;try{d=JSON.parse(KStore.getItem('kalsara_v3')||'null')}catch(e){}
 if(d)applyState(d);else{fill();add();add();upd(false)}tab(0);obInit();syLocal();bkRemind()})();
/* ===== BAGIAN 99-pwa ===== */
createPWA({$, toast, lflush, APPV:'5.82'});
