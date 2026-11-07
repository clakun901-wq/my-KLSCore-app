/* Kalsara app-core (v9.43, Tahap 7a: panel/tampilan promosi pindah ke js/promosi-panel.js; Tahap 6: bagian 20 kini hanya pemasangan js/hitung-etalase.js; v9.41, Tahap 5: bagian 80 kini hanya pemasangan dua modul fitur. v9.39, Tahap 3: isi lama js/legacy/ disatukan menjadi SATU modul ES sungguhan.
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
import {createPromosiPanel} from './promosi-panel.js';
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

function migPt(q){if(q&&q.t=='pt'&&!Array.isArray(q.it)){q.it=q.p?[{p:q.p,h:q.a||0,d:0,l:0}]:[];q.a=0;q.p=''}if(q&&q.t=='kh'&&!Array.isArray(q.it)){q.mp=q.p?[q.p]:[];q.it=[q.p2,q.p3].filter(Boolean).map(function(id){return{p:id,d:0,h:0,l:0}});if(q.a>0)q.k=(q.k?q.k+' | ':'')+'Harga kombo lama Rp'+q.a;q.a=0;q.p=q.p2=q.p3=''}return q}
function ptp(p,z,M){var d=z.d>0?z.d:p.a,L=z.h>0?Math.round(z.h):(d>0?globalThis.KalsaraMoney.percentOfRupiah(M,100-d):0);return L>0?L:0}

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

function pcalc2(p,r,o){var c=CFG[p.t];
 if(c.c=='vi'){if(!(p.a>0))return pinfo('Isi nilai voucher untuk melihat hitungan untung.');
  var vf=function(L){return vdisc(p,L)},v0=vf(o.L),q=fwdV(o.L,v0,r,o.R),x=warns(q,true),mn=p.b||0,im=bis(function(L){for(var k=0;k<=5;k++)if(fwdV(L+k,vf(L+k),r,o.R).u<0)return false;return true});
  return '<div class="res">'+rw('Harga akhir produk',rp(o.L))+rw('Voucher ikuti toko'+(p.u=='pct'?' ('+fmt(p.a)+'%)':''),'- '+rp(v0))+rw('Harga setelah voucher',rp(q.P))+rw('Saldo masuk toko',rp(q.s))+rw('Modal + Management Partner + packing',rp(tmod(r)))+rw(q.u<0?'Rugi bersih':'Untung bersih',(q.u<0?'- ':'')+rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',pc1(x.m)+'%')+(im===null?'':rw('Harga akhir minimal agar tidak rugi',rp(im)))+WN(x)+(mn>0&&o.L<mn?pinfo('Harga 1 pcs di bawah minimal belanja ('+rp(mn)+'). Voucher baru terpakai jika pembeli membeli minimal '+Math.ceil(mn/o.L)+' pcs. Hitungan di atas untuk 1 pcs.'):'')+pinfo('Dihitung menggantikan voucher toko di panel Voucher.')+'</div>'}
 return''}
function actPromo(r,o){var pm=null;State.PRM.forEach(function(q){if(pst(q).k!='a'||!CFG[q.t])return;var a=0;if(CFG[q.t].c=='pr'&&q.p===r.id)a=q.a;else if(q.t=='pt'&&q.it){var iz=q.it.filter(function(z){return z.p===r.id})[0];if(iz)a=ptp(q,iz,o.M)}if(!(a>0))return;if(!pm||a<pm.a)pm={a:a,t:q.t}});return pm}












/*5.38: harga promo dan diskon (%) saling terisi otomatis di Promo Toko*/


















/* pencarian untuk daftar produk panjang di tab Promosi */







/*5.18: dulu bernama pf() dan bentrok dengan pembaca angka pf(s,pct) di atas, sehingga semua kolom angka Pengaturan tidak tersimpan*/
/* Tahap 7a: panel/tampilan dipindah ke js/promosi-panel.js; getter menjaga koneksi ke bagian lain tetap dinamis. */
var PromosiPanel=createPromosiPanel({
 get $(){return $},
 get CFG(){return CFG},
 get CalcCache(){return CalcCache},
 get Event(){return Event},
 get KDOM(){return KDOM},
 get PORD(){return PORD},
 get PSEL(){return PSEL},set PSEL(v){PSEL=v},
 get State(){return State},
 get VoucherRules(){return VoucherRules},
 get WN(){return WN},
 get actPromo(){return actPromo},
 get ask(){return ask},
 get bis(){return bis},
 get calc(){return calc},
 get cbc(){return cbc},
 get document(){return document},
 get esc(){return esc},
 get fk(){return fk},
 get fmt(){return fmt},
 get fwdL(){return fwdL},
 get fwdV(){return fwdV},
 get impas(){return impas},
 get num(){return num},
 get pc1(){return pc1},
 get pcalc2(){return pcalc2},
 get persist(){return persist},
 get pst(){return pst},
 get ptp(){return ptp},
 get rp(){return rp},
 get setTimeout(){return setTimeout},
 get tmod(){return tmod},
 get toast(){return toast},
 get today(){return today},
 get uid(){return uid},
 get vcEff(){return vcEff},
 get vcList(){return vcList},
 get vdisc(){return vdisc},
 get warns(){return warns},
});
function paSync(){return PromosiPanel.paSync.apply(null,arguments)}
function pinfo(){return PromosiPanel.pinfo.apply(null,arguments)}
function prRender(){return PromosiPanel.prRender.apply(null,arguments)}
function rw(){return PromosiPanel.rw.apply(null,arguments)}

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
