/* Tampilan/model Etalase Kalsara (v9.35, tahap 6h).
 * Fungsi dipindah apa adanya dari legacy 20-hitung-etalase.js; fixture menyimpan teks sumber v9.34.
 * CFG/PRM/A/rows/VUSE/curP/vbest dapat diganti saat restore, sehingga dibaca lewat getter
 * pada setiap pemanggilan fungsi yang memerlukannya. Dependensi fungsi yang sudah stabil
 * dipasang langsung; dependensi lintas-bagian yang belum tersedia dibungkus di titik pemasangan.
 */
export function createEtalaseView({getRows,getA,getPRM,getCFG,getVUSE,getCurP,getVbest,getActL,
  pst,ptp,fmt,rp,fwdL,pc1,calc,skHi,etUn,$,KShelf}){
function errModel(e){var m={'Voucher 100% tidak valid':['Voucher toko 100% membuat harga jadi nol. Turunkan nilainya.','vc','Buka Voucher'],'Diskon coret tidak valid':['Diskon coret 100% atau lebih tidak masuk akal. Turunkan nilainya.','pt','Buka Promosi'],'Total tarif 100% atau lebih':['Total tarif (admin, iklan, premi, dan lainnya) mencapai 100%. Periksa persen iklan dan tarif.','set','Buka Pengaturan'],'Target untung di luar batas pencarian harga':['Target untung belum tercapai dalam batas pencarian harga. Periksa target untung, modal, biaya, dan tarif; turunkan target atau periksa input biaya.','','']}[e];if(!m)return{kind:'error',plain:true,message:String(e)};return{kind:'error',message:m[0],goTarget:m[1],goLabel:m[2]}}
function actNoteModel(r,o,pr){var actL=getActL();var al=(r.ha>0||r.hd>0)?actL(r,o.R):0;
 if(!(al>0))return pr?null:[{text:'Belum ada harga aktual. Penjualan dicatat di harga ideal '+rp(o.L)+'.'}];
 if(pr&&al>=pr)return null;
 var aq=fwdL(al,r,o.R).u;return [{text:'Penjualan dicatat di harga aktual '+rp(al)+(al==o.L?' (sama dengan ideal).':' (ideal '+rp(o.L)+').')+' '},{text:(aq<0?'Rugi ':'Untung ')+rp(Math.abs(aq)),tone:aq<0?'bad':'ok',bold:true}]}
function shopChips(r,o){var PRM=getPRM(),CFG=getCFG();var out=[];PRM.forEach(function(q){if(!CFG[q.t])return;var tk=q.t=='vc'&&(q.jt||'toko')=='toko';var iz=(q.t=='pt'||q.t=='kh')&&q.it?q.it.filter(function(y){return y.p===r.id})[0]:null,ik=(q.t=='kh'||q.t=='hm')&&(q.mp||[]).indexOf(r.id)>=0;if(!tk&&!iz&&!ik&&[q.p,q.p2,q.p3].indexOf(r.id)<0)return;var z=pst(q);if(z.k!='a'&&z.k!='u')return;
 var t=CFG[q.t].n+(q.t=='vc'?' '+{toko:'Toko',produk:'Produk',live:'Live',video:'Video'}[q.jt||'toko']:'')+((CFG[q.t].c=='vi'||CFG[q.t].c=='vc')&&q.a>0?' '+(q.u=='pct'||q.u=='cb'?fmt(q.a)+'%'+(q.u=='cb'?' cashback':''):rp(q.a)):'')+(iz&&o&&!o.err&&ptp(q,iz,o.M)>0?' '+rp(ptp(q,iz,o.M)):CFG[q.t].c=='pr'&&q.a>0?' '+rp(q.a):CFG[q.t].c=='hm'&&q.b>0?' min '+rp(q.b):CFG[q.t].c=='pd'&&q.b>0?' beli '+(q.a||1)+' '+((q.tp||'pct')=='pct'?'-'+fmt(q.b)+'%':(q.tp=='nom'?'-':'')+rp(q.b)):'')+' \u00b7 '+z.t+(q.t=='vc'&&o&&!o.err&&o.vq===q?' \u00b7 dipakai di harga':'');
 out.push({kind:z.k,text:t})});return out}
function shopPrice(r,o){var PRM=getPRM(),CFG=getCFG(),actL=getActL();
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
function shop(){var rows=getRows(),A=getA(),VUSE=getVUSE(),curP=getCurP(),vbest=getVbest();var L=rows.filter(function(r){return r.live}),lo=function(r){return r.s!=null&&r.s<=A.sl},att=L.filter(lo).sort(function(a,b){return a.s-b.s});if(att.length)L=att.concat(L.filter(function(r){return !lo(r)}));var rest=L.length-att.length;
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
return {errModel:errModel,actNoteModel:actNoteModel,shopChips:shopChips,shopPrice:shopPrice,shop:shop};
}
