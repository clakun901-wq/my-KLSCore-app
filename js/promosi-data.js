/* Tahap 7b: logika data promosi dan voucher dipindah mekanis dari app-core.js.
 * Dependensi diterima lewat D; perilaku dan urutan hitung tetap mengikuti versi sebelumnya. */
export function createPromosiData(D){
var State=D.State,CalcCache=D.CalcCache,today=D.today,pr=D.pr,fmt=D.fmt,rp=D.rp,dd=D.dd,
 esc=D.esc,vcList=D.vcList,vcApply=D.vcApply,vdisc=D.vdisc,vcLab=D.vcLab,pst=D.pst,
 fees=D.fees,tmod=D.tmod,warns=D.warns,WN=D.WN,pc1=D.pc1,pinfo=D.pinfo,rw=D.rw,
 KDOM=D.KDOM,$=D.$,dtx=D.dtx,calc=D.calc;
var PORD=['af','lv','pt','vc','fs','vi','pd','kh','hm'];
var CFG={af:{n:'Affiliate Marketing',p:1,a:['Komisi affiliate (%)','%'],c:'af'},lv:{n:'Shopee Live & Video',p:1},pt:{n:'Promo Toko',a:['Diskon bawaan semua produk (%)','%'],x:['Batas pembelian bawaan (pcs, kosong = tanpa batas)','n'],c:'pt'},vc:{n:'Voucher',jt:1,u:1,a:['Nilai voucher','m'],cp:['Maksimum potongan (Rp)','m'],b:['Min. belanja (Rp)','m'],x:['Kuota pemakaian (pcs)','n'],m:['Jumlah maks. per pembeli (pcs)','n'],y:['Sudah digunakan (pcs)','n'],c:'vc'},fs:{n:'Flash Sale Toko Saya',p:1,a:['Harga flash sale (Rp)','m'],b:['Stok flash sale (pcs)','n'],c:'pr'},vi:{n:'Voucher Ikuti Toko',p:1,u:1,a:['Nilai voucher','m'],cp:['Maksimum potongan (Rp)','m'],b:['Minimal belanja (Rp)','m'],c:'vi'},pd:{n:'Paket Diskon',p:1,tp:1,a:['Beli (pcs)','n'],b:['Nilai diskon','%'],x:['Batas pembelian per pembeli (paket)','n'],c:'pd'},kh:{n:'Kombo Hemat',c:'kh'},hm:{n:'Hadiah Min. Belanja',b:['Minimal belanja (Rp)','m'],x:['Stok hadiah (pcs, kosong = tanpa batas)','n'],c:'hm'}};

function migPt(q){if(q&&q.t=='pt'&&!Array.isArray(q.it)){q.it=q.p?[{p:q.p,h:q.a||0,d:0,l:0}]:[];q.a=0;q.p=''}if(q&&q.t=='kh'&&!Array.isArray(q.it)){q.mp=q.p?[q.p]:[];q.it=[q.p2,q.p3].filter(Boolean).map(function(id){return{p:id,d:0,h:0,l:0}});if(q.a>0)q.k=(q.k?q.k+' | ':'')+'Harga kombo lama Rp'+q.a;q.a=0;q.p=q.p2=q.p3=''}return q}
function ptp(p,z,M){var d=z.d>0?z.d:p.a,L=z.h>0?Math.round(z.h):(d>0?globalThis.KalsaraMoney.percentOfRupiah(M,100-d):0);return L>0?L:0}

/*5.39: voucher otomatis. Hanya Voucher Toko dan Voucher Produk berjalan (bukan cashback, bukan Live/Video, kuota belum habis) yang ikut memengaruhi harga di tab Hitung.*/
CalcCache.invalidate();
/*5.68: Promosi tidak memicu hitung ulang tab Hitung. psig() = tanggal + isi semua promosi. upd() mencatatnya di PSIG; tab() menghitung ulang hanya bila psig() berbeda (promosi berubah, kuota voucher bertambah, atau tanggal berganti).*/
function psig(){try{return today()+'|'+JSON.stringify(State.PRM)}catch(e){return''}}
function calcNV(r){D.setVNO(1);try{return D.calc(r)}finally{D.setVNO(0)}}
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













return {CFG:CFG,PORD:PORD,migPt:migPt,ptp:ptp,psig:psig,calcNV:calcNV,vsc:vsc,vscT:vscT,vscn:vscn,vnote:vnote,vcSoon:vcSoon,vwarn:vwarn,vcWhy:vcWhy,vcEff:vcEff,fwdV:fwdV,bis:bis,pcalc2:pcalc2,actPromo:actPromo};
}
