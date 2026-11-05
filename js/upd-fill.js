/* v9.34 tahap 6g: orkestrasi pembaruan Hitung dan pengisian Setelan dipisahkan dari legacy. */
export function createUpdater({getA,getRows,CalcCache,tblSync,refreshLabels,tchk,gwarn,vwarn,dep,$,fmt,goRate,adRate,rp,updRow,flt,shop,psig,setPSIG,persist}){
 function upd(save,only){var A=getA(),rows=getRows();CalcCache.invalidate();var light=CalcCache.prewarmStale(only);
  tblSync();refreshLabels();tchk();gwarn();vwarn();dep();
  $('gci').textContent=A.gc=='none'?'Tidak ikut Gratis Ongkir XTRA':'Tarif berlaku sekarang: '+fmt(goRate({o:{}}))+'% (ukuran '+(A.sz=='k'?'khusus':'biasa')+')';
  $('aci').textContent='Tarif berlaku sekarang: '+fmt(adRate({o:{}}))+'%';
  if(light)rows.forEach(function(r){if(r.hy)updRow(r)});else if(only)updRow(only);else rows.forEach(updRow);
  var g={n:0,sm:0,su:0,nw:0,ns:0};rows.forEach(function(r){var q=r._ag;if(q){g.n+=q.n;g.sm+=q.sm;g.su+=q.su;g.nw+=q.nw;g.ns+=q.ns}});
  var n=g.n,sm=g.sm,su=g.su,nw=g.nw,ns=g.ns;
  $('s1').textContent=n;$('s2').textContent=n?rp(sm/n):'-';$('s3').textContent=n?rp(su):'-';$('s3').className=su<0?'neg':'';$('s4').textContent=nw;$('s5').textContent=ns;var tl=rows.filter(function(r){return r.live}).length;$('tp1').textContent=rows.length;$('tp2').textContent=tl;$('tp3').textContent=rows.length-tl;if(!light){flt();shop()}
  setPSIG(psig());if(save)persist()}
 return {upd:upd};
}
export function createFiller({tblSync,paSync,refreshLabels,document,fmt,getA,fillT,tlRender}){
 function fill(){var A=getA();tblSync();paSync();refreshLabels();document.querySelectorAll('[data-k]').forEach(function(el){el.value=fmt(A[el.dataset.k])});fillT();tlRender()}
 return {fill:fill};
}
