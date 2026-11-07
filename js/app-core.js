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
import {createPromosiData} from './promosi-data.js';
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
var PSEL='';
var PSIG='';
var PromosiData=createPromosiData({
 State:State,CalcCache:CalcCache,today:today,pr:pr,fmt:fmt,rp:rp,dd:dd,esc:esc,
 vcList:vcList,vcApply:vcApply,vdisc:vdisc,vcLab:vcLab,pst:pst,fees:fees,tmod:tmod,
 warns:warns,WN:WN,pc1:pc1,pinfo:pinfo,rw:rw,KDOM:KDOM,$:$,dtx:dtx,calc:calc,
 setVNO:function(v){VNO=v}
});
var CFG=PromosiData.CFG,PORD=PromosiData.PORD;
function migPt(){return PromosiData.migPt.apply(null,arguments)}
function ptp(){return PromosiData.ptp.apply(null,arguments)}
function psig(){return PromosiData.psig.apply(null,arguments)}
function calcNV(){return PromosiData.calcNV.apply(null,arguments)}
function vsc(){return PromosiData.vsc.apply(null,arguments)}
function vscT(){return PromosiData.vscT.apply(null,arguments)}
function vscn(){return PromosiData.vscn.apply(null,arguments)}
function vnote(){return PromosiData.vnote.apply(null,arguments)}
function vcSoon(){return PromosiData.vcSoon.apply(null,arguments)}
function vwarn(){return PromosiData.vwarn.apply(null,arguments)}
function vcWhy(){return PromosiData.vcWhy.apply(null,arguments)}
function vcEff(){return PromosiData.vcEff.apply(null,arguments)}
function fwdV(){return PromosiData.fwdV.apply(null,arguments)}
function bis(){return PromosiData.bis.apply(null,arguments)}
function pcalc2(){return PromosiData.pcalc2.apply(null,arguments)}
function actPromo(){return PromosiData.actPromo.apply(null,arguments)}
/*5.38: harga promo dan diskon (%) saling terisi otomatis di Promo Toko*/
/* pencarian untuk daftar produk panjang di tab Promosi */
/*5.18: dulu bernama pf() dan bentrok dengan pembaca angka pf(s,pct) di atas, sehingga semua kolom angka Pengaturan tidak tersimpan*/
/* Tahap 7a: panel/tampilan dipindah ke js/promosi-panel.js; getter menjaga koneksi ke bagian lain tetap dinamis. */
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
 get setTimeout(){return window.setTimeout.bind(window)},/* harus diikat ke window: dipanggil lewat objek sambungan (D.setTimeout) fungsi bawaan peramban melempar 'Illegal invocation' */
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
/*v9.48 (Tahap 9): KK = pengukur kinerja (js/kinerja.js; fungsi asli bila ?perf=1 tidak aktif), KH = pembagian halaman + penanda data-berubah Etalase (js/etalase-halaman.js). Keduanya dipasang oleh js/main.js sebelum berkas ini dimuat.*/
var KK=globalThis.KalsaraKinerja||{t:function(n,f){return f},tabWrap:function(f){return f}},KH=globalThis.KEtalaseHalaman||null;
var TabImpor=createTabImporSinkron({$: $,ROW_MAX:ROW_MAX,toast:toast,ask:ask,KDOM:KDOM,add:add,upd:KK.t('upd',upd),colL:colL,persist:persist,calc:calc,impas:impas,tmod:tmod,fmt:fmt,pc1:pc1,navigator:navigator,document:document,window:window,Blob:window.Blob,URL:window.URL,setTimeout:window.setTimeout.bind(window),FileReader:window.FileReader,fetch:window.fetch?window.fetch.bind(window):undefined,today:today,num:num,rp:rp,strip:strip,etAll:etAll,rlAll:rlAll,psig:psig,getPSIG:function(){return PSIG},rpt:KK.t('rpt',rpt),tgl:tgl,prRender:KK.t('prRender',prRender),srt:KK.t('srt',srt),shop:KK.t('shop',KH?KH.gate(shop):shop),CR:CR,fees:fees,warns:warns,fwdL:fwdL,esc:esc,pr:pr,pf:pf});
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
tab.wrap(function(_tab6){return function(i){_tab6(i);$('v6').hidden=i!=6;$('t6').setAttribute('aria-selected',i==6);TO.forEach(function(id){var b=$(id);b.tabIndex=b.getAttribute('aria-selected')=='true'?0:-1});if(i==6)ERP.show()}});
$('t6').onclick=function(){tab(6)};
tab.wrap(KK.tabWrap);
tbuild();
(function(){var d=null;try{d=JSON.parse(KStore.getItem('kalsara_v3')||'null')}catch(e){}
 if(d)applyState(d);else{fill();add();add();upd(false)}tab(0);obInit();syLocal();bkRemind()})();
/* ===== BAGIAN 99-pwa ===== */
createPWA({$, toast, lflush, APPV:globalThis.KALSARA_VERSION.app});
