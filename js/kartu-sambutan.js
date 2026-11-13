/* v9.55: kartu sambutan untuk aplikasi kosong (tab Hitung). Tidak menyentuh app-core.js: dipasang dari main.js. */

/* Produk "kosong" = belum ada isian berarti (aplikasi baru membuat dua baris kosong). */
export function barisTerisi(rows){return (rows||[]).filter(function(r){return r&&(r.n||r.m||r.d||r.p||r.t||r.sku)}).length}
export function perluSambutan(rows){return barisTerisi(rows)===0}

export function pasangKartuSambutan({doc,getRows}){
 var kartu=doc.getElementById('sm');if(!kartu)return null;
 var jadwal=0;
 function segarkan(){jadwal=0;var perlu=perluSambutan(getRows());if(kartu.hidden===perlu)kartu.hidden=!perlu}
 function tunda(){if(jadwal)return;jadwal=1;(doc.defaultView&&doc.defaultView.requestAnimationFrame||setTimeout)(segarkan)}
 ['input','change','click'].forEach(function(e){doc.addEventListener(e,tunda,true)});
 var list=doc.getElementById('list');if(list&&doc.defaultView&&doc.defaultView.MutationObserver)new doc.defaultView.MutationObserver(tunda).observe(list,{childList:true});
 kartu.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-sm]');if(!b)return;var k=b.getAttribute('data-sm');
  if(k==='xt'){var t=doc.getElementById('xt');if(t)t.click()}
  else if(k==='xf'){var f=doc.getElementById('xf');if(f)f.click()}
  else if(k==='satu'){var n=doc.querySelector('#list .nm');if(n){n.scrollIntoView&&n.scrollIntoView({block:'center'});n.focus()}}});
 segarkan();return{segarkan:segarkan}}
