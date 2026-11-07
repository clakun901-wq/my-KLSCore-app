/* Kalsara app-core (v9.42, Tahap 6; bagian 20 kini hanya pemasangan js/hitung-etalase.js; v9.41, Tahap 5: bagian 80 kini hanya pemasangan dua modul fitur. v9.39, Tahap 3: isi lama js/legacy/ disatukan menjadi SATU modul ES sungguhan.
 * Dulu: 12 berkas di js/legacy/ diunduh, disambung menjadi teks, dibungkus Blob, lalu dijalankan oleh js/legacy-app.js.
 * Kini: berkas ini dimuat langsung oleh main.js (dynamic import) dan memakai import eksplisit di bawah.
 * Logika dan urutan bisnis dipertahankan; akses A/rows/SALES/PRM/TS dialihkan mekanis ke State. Urutan bagian tetap sama (parts.json).
 * Setiap bagian diawali SATU baris penanda berbentuk komentar "BAGIAN nn-nama" yang diapit tanda bintang dan garis miring; baris itu dipakai tes dan peta (scripts/peta-global.mjs). Jangan dihapus atau diubah tanpa memperbarui keduanya. */
import {createERP} from './erp.js';
import {createXlsxReader} from './xlsx-reader.js';
import {createPWA} from './pwa.js';
import {rp, pf, num, fmt, PCT, today} from './format.js';
import {GO2D, createTariff} from './tariff.js';
import {createPricing} from './pricing.js';
import {createCalcCache} from './calc-cache.js';
import {createVoucherRules} from './voucher-rules.js';
import {State} from './state.js';
import {createPenjualan} from './penjualan.js';
import {createVoucherPanel} from './voucher-panel.js';
import {esc, dtx, uid, prodSig} from './helpers.js';
import {createPenyimpananCadangan} from './penyimpanan-cadangan.js';
import {createPengaturan} from './pengaturan.js';
import {createTabImporSinkron} from './tab-impor-sinkron.js';
import {createHitungEtalase} from './hitung-etalase.js';
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
/*v9.42 (Tahap 6): seluruh isi bagian ini pindah ke js/hitung-etalase.js (createHitungEtalase). Di sini hanya dipasang dependensinya.
 Nama dari bagian yang berjalan SESUDAH bagian ini (CFG, VUSE, curP, sold, PSEL, PSIG) diteruskan lewat getter/setter/pembungkus, bukan disalin.
 Fungsi penerus di bawah menjaga nama lama yang dipakai bagian lain (di-hoist seperti dulu); var-nya tersedia setelah baris pemasangan, seperti dulu.*/
var HE=createHitungEtalase({$:$,KDOM:KDOM,document:document,CalcCache:CalcCache,calc:calc,impas:impas,tmod:tmod,fwd:fwd,fwdL:fwdL,gfac:gfac,goRate:goRate,adRate:adRate,pr:pr,pst:pst,vbest:vbest,persist:persist,tab:tab,tlRender:tlRender,paSync:paSync,psig:psig,ptp:ptp,vnote:vnote,vscn:vscn,vwarn:vwarn,acH:acH,actL:actL,bdH:bdH,
 sold:function(){return sold.apply(null,arguments)},
 getCFG:function(){return CFG},getVUSE:function(){return VUSE},getCurP:function(){return curP},
 setPSEL:function(v){PSEL=v},setPSIGOuter:function(v){PSIG=v}});
var {CR,ROW_MAX,WN,ask,feeSig,fill,getDprev,inertBg,pc1,setDprev,shop,tbuild,toast,upd,warns}=HE;
function add(){return HE.add.apply(null,arguments)}
function clearMark(){return HE.clearMark.apply(null,arguments)}
function colL(){return HE.colL.apply(null,arguments)}
function etAll(){return HE.etAll.apply(null,arguments)}
function fk(){return HE.fk.apply(null,arguments)}
function setStock(){return HE.setStock.apply(null,arguments)}
function srt(){return HE.srt.apply(null,arguments)}
function strip(){return HE.strip.apply(null,arguments)}
function tgl(){return HE.tgl.apply(null,arguments)}
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
var TabImpor=createTabImporSinkron({$: $,ROW_MAX:ROW_MAX,toast:toast,ask:ask,KDOM:KDOM,add:add,upd:upd,colL:colL,persist:persist,calc:calc,impas:impas,tmod:tmod,fmt:fmt,pc1:pc1,navigator:navigator,document:document,window:window,Blob:window.Blob,URL:window.URL,setTimeout:window.setTimeout.bind(window),FileReader:window.FileReader,fetch:window.fetch?window.fetch.bind(window):undefined,today:today,num:num,rp:rp,strip:strip,etAll:etAll,rlAll:rlAll,psig:psig,PSIG:PSIG,rpt:rpt,tgl:tgl,prRender:prRender,srt:srt,shop:shop,CR:CR,fees:fees,warns:warns,fwdL:fwdL,esc:esc,pr:pr,pf:pf});
function tab(){return TabImpor.tab.apply(null,arguments)}
tab.wrap=function(mk){TabImpor.wrapTab(mk)}
function parseCsv(){return TabImpor.parseCsv.apply(null,arguments)}
Object.defineProperty(parseCsv,'bad',{get:function(){return TabImpor.parseCsv.bad},set:function(v){TabImpor.parseCsv.bad=v}})
function salesRows(){return TabImpor.salesRows.apply(null,arguments)}
function copySales(){return TabImpor.copySales.apply(null,arguments)}
function showCpBox(){return TabImpor.showCpBox.apply(null,arguments)}
function dl(){return TabImpor.dl.apply(null,arguments)}
function csv(){return TabImpor.csv.apply(null,arguments)}
function actNote(){return TabImpor.actNote.apply(null,arguments)}
function actL(){return TabImpor.actL.apply(null,arguments)}
function bdH(){return TabImpor.bdH.apply(null,arguments)}
function acH(){return TabImpor.acH.apply(null,arguments)}
function actRin(){return TabImpor.actRin.apply(null,arguments)}
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
 wrapTab:function(mk){tab.wrap(mk)},
 wrapTchk:function(mk){HE.wrapTchk(mk)}});
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
