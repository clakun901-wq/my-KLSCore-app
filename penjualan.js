/* Tab Penjualan/Laporan Kalsara (v9.26, tahap 5b): dipindah APA ADANYA dari js/legacy/30-penjualan.js.
 * Perubahan hanya pada cara mengakses lingkup legacy: SALES, PRM, rows dibaca/ditulis lewat `st` (js/state.js),
 * dan fungsi/variabel legacy lain disuntikkan sebagai dependensi eksplisit. RM/RD/RO, MN/DN, RL*, SW dan
 * seluruh fungsi tampilan kini privat di closure; yang dipakai kode legacy lain hanya nilai kembalian di bawah.
 * Pendengar klik/ubah/geser di #v4 dan #rpv dipasang saat factory dipanggil (posisi sama dengan sebelumnya). */
export function createPenjualan({st,$,esc,today,rp,num,toast,ask,uid,KDOM,calc,fwdL,vbest,actL,ptp,getCFG,VoucherRules,CalcCache,setStock,persist,salesRows,copySales,showCpBox,dl,csv,getSalesMax}){
var RM='d',RD=today(),RO=today().slice(0,7),MN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],DN=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function curP(r,o){var CFG=getCFG(),m=0;st.PRM.forEach(function(q){if(VoucherRules.pst(q).k!='a'||!CFG[q.t])return;var a=0;if(CFG[q.t].c=='pr'&&q.p===r.id)a=q.a;else if(q.t=='pt'&&q.it){var z=q.it.filter(function(y){return y.p===r.id})[0];if(z)a=ptp(q,z,o.M)}if(a>0&&(!m||a<m))m=a});return m||o.L}
var VUSE={};
function sold(r){var o=calc(r);if(!o||o.err){toast('Stok dikurangi. Harga belum dihitung, penjualan tidak dicatat');return}
 var pm=curP(r,o),pa=(r.ha>0||r.hd>0)?actL(r,o.R):0,sr='ideal',p=pm;if(pm!=o.L)sr='promo';if(pa>0&&(sr!='promo'||pa<pm)){p=pa;sr='akt'}
 var u=fwdL(p,r,o.R).u,ui=fwdL(o.L,r,o.R).u,sl={i:uid(),t:Date.now(),d:today(),p:r.id,n:r.n||'(tanpa nama)',a:p,u:u,pi:o.L,ui:ui,sr:sr},vm='',vb=VUSE[r.id]?vbest(p,r):null;
 if(vb&&vb.q&&vb.q.x>0&&(vb.q.y||0)<vb.q.x){vb.q.y=(vb.q.y||0)+1;sl.vq=vb.q.id;VoucherRules.reset();CalcCache.invalidate();var sisa=vb.q.x-vb.q.y;vm=sisa>0?' Kuota voucher sisa '+sisa+'.':' Kuota voucher habis, harga di tab Hitung diperbarui.'}
 st.SALES.push(sl);if(st.SALES.length>getSalesMax())st.SALES.splice(0,st.SALES.length-getSalesMax());
 toast('Terjual 1'+(sr=='akt'?' (harga aktual)':'')+'. '+(u<0?'Rugi ':'Untung ')+rp(Math.abs(u))+vm)}
function fprod(id){return st.rows.filter(function(x){return x.id===id})[0]}
function sgrp(L){var M={},A2=[];L.forEach(function(s){var z=M[s.p];if(!z){z=M[s.p]={p:s.p,n:s.n,q:0,u:0};A2.push(z)}z.q++;z.u+=s.u;z.n=s.n});return A2}
var RLU={},RLT={};
function rlOn(id){return RLU[id]>Date.now()}
function rlSet(id,on){clearTimeout(RLT[id]);if(on){RLU[id]=Date.now()+10000;RLT[id]=setTimeout(function(){delete RLU[id];rlUi(id)},10100)}else delete RLU[id]}
function rlAll(){for(var k in RLT)clearTimeout(RLT[k]);RLU={};RLT={}}
function rlRow(id){var un=rlOn(id),e=esc(id);return '<div class="q4a"><button type="button" class="lkb'+(un?' on':'')+'" data-rl="'+e+'" aria-pressed="'+un+'" aria-label="'+(un?'Kunci tombol hapus':'Buka kunci tombol hapus')+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="'+(un?'M8 11V8a4 4 0 0 1 7.5-1.5':'M8 11V8a4 4 0 0 1 8 0v3')+'"/></svg></button><span class="q4h">'+(un?'Hapus terbuka 10 detik':'Hapus terkunci')+'</span><button type="button" class="btn gh q4d'+(un?'':' lkd')+'" data-del="'+e+'"'+(un?'':' aria-disabled="true"')+'>Hapus</button></div>'}
var RPL='';
function perS(){var m=RM=='m',k=m?RO:RD;return st.SALES.filter(function(s){return s.d.slice(0,k.length)==k})}
function bkHtml(){var un=rlOn('_bulk'),n=perS().length,t=st.SALES.length,dz=un?'':' lkd',ad=un?'':' aria-disabled="true"';
 return '<div class="q4l q4z"><div class="sn">Hapus data laporan</div><p class="tip" style="margin:0 0 8px">Terpisah dari kartu di atas. Buka gembok dulu, lalu pilih. Stok produk tidak dikembalikan. Ekspor CSV dulu bila perlu arsip.</p><div class="q4a" style="border:0;margin:0 0 8px;padding:0"><button type="button" class="lkb'+(un?' on':'')+'" data-rl="_bulk" aria-pressed="'+un+'" aria-label="'+(un?'Kunci hapus massal':'Buka kunci hapus massal')+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="'+(un?'M8 11V8a4 4 0 0 1 7.5-1.5':'M8 11V8a4 4 0 0 1 8 0v3')+'"/></svg></button><span class="q4h">'+(un?'Terbuka 10 detik':'Terkunci')+'</span></div><button type="button" class="btn gh q4d'+dz+'" data-bk="per"'+ad+' style="width:100%;margin:0 0 8px">Hapus penjualan periode ini ('+n.toLocaleString('id-ID')+')</button><div class="q4h" style="margin:-2px 0 10px">Periode: '+esc(RPL)+'</div><button type="button" class="btn gh q4d'+dz+'" data-bk="all"'+ad+' style="width:100%;margin:0">Hapus semua penjualan ('+t.toLocaleString('id-ID')+')</button></div>'}
function delSale(id){ask('Apakah yakin menghapus laporan ini? Stok produk dikembalikan 1 pcs.','Ya, hapus',function(){rlSet(id,false);var ix=st.SALES.map(function(s){return s.i}).indexOf(id);if(ix<0)return;var s=st.SALES.splice(ix,1)[0],r=fprod(s.p);if(s.vq){var pq=st.PRM.filter(function(x){return x.id===s.vq})[0];if(pq&&pq.y>0){pq.y--;VoucherRules.reset();CalcCache.invalidate()}}if(r&&r.s!=null)setStock(r,r.s+1);else persist();rpt();toast('Penjualan dihapus')})}
function rlUi(id){if(id=='_bulk'){var z=$('rpv').querySelector('.q4z');if(z)z.outerHTML=bkHtml();return}
 var w=$('rpv').querySelector('[data-sid="'+id+'"]');if(!w)return;var a=w.querySelector('.q4a');if(a)a.outerHTML=rlRow(id);if(!rlOn(id)){var sp=w.parentNode;if(sp&&sp.classList){sp.classList.remove('op');w.style.transform=''}}}
function rpt(){var m=RM=='m',k=m?RO:RD,td=today(),S=st.SALES.filter(function(s){return s.d.slice(0,k.length)==k}),om=0,un=0,h='';
 if(!st.SALES.length){KDOM.setHTML($('rpv'), '<div class="q4l"><div class="empty">Belum ada penjualan. Di tab Etalase, tekan − pada produk setiap ada pesanan terjual. Penjualan tercatat otomatis lengkap dengan tanggal, harga jual, dan untung.</div></div>');return}
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
 var cut=ymd(new Date(Date.now()-29*864e5)),fs=st.SALES.reduce(function(a,s){return s.d<a?s.d:a},'9999-99'),sp=Math.max(1,Math.min(30,Math.round((Date.now()-new Date(fs+'T12:00:00'))/864e5)+1)),F=sgrp(st.SALES.filter(function(s){return s.d>=cut})).sort(function(a,b){return b.q-a.q}).slice(0,5);
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
 if(D.bk){if(!rlOn('_bulk')){toast('Terkunci. Ketuk ikon gembok dulu');return}var all=D.bk=='all',pl=perS(),n=all?st.SALES.length:pl.length;if(!n){toast('Tidak ada penjualan untuk dihapus');return}
  ask(all?'Hapus SEMUA '+n.toLocaleString('id-ID')+' catatan penjualan? Stok produk tidak dikembalikan dan data tidak bisa dipulihkan. Ekspor CSV dulu bila perlu arsip.':'Hapus '+n.toLocaleString('id-ID')+' catatan penjualan periode '+RPL+'? Stok produk tidak dikembalikan.','Ya, hapus',function(){rlSet('_bulk',false);if(all)st.SALES=[];else{var ids={};pl.forEach(function(x){ids[x.i]=1});st.SALES=st.SALES.filter(function(x){return !ids[x.i]})}persist();rpt();toast(n.toLocaleString('id-ID')+' catatan penjualan dihapus')});return}
 if(D.del){var id=D.del;if(!rlOn(id)){toast('Terkunci. Ketuk ikon gembok dulu');return}delSale(id)}});
/* geser kartu ke kiri untuk menampilkan tombol Hapus */
var SW=null,swMoved=0;
function swClose(ex){var a=$('rpv').querySelectorAll('.q4s.op');for(var i=0;i<a.length;i++)if(a[i]!==ex){a[i].classList.remove('op');a[i].querySelector('.q4w').style.transform=''}}
$('rpv').addEventListener('pointerdown',function(e){if(e.target.closest('.q4x'))return;var c=e.target.closest('.q4w');if(!c){swClose();return}if(e.target.closest('input,button,textarea,select,label'))return;var w=c.parentNode;swClose(w);SW={c:c,w:w,x:e.clientX,y:e.clientY,b:w.classList.contains('op')?-96:0,t:0,mv:false,id:e.pointerId}});
$('rpv').addEventListener('pointermove',function(e){if(!SW||e.pointerId!=SW.id)return;var dx=e.clientX-SW.x,dy=e.clientY-SW.y;if(!SW.mv){if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy))return;if(!rlOn(SW.c.dataset.sid)){SW=null;swMoved=Date.now();toast('Terkunci. Ketuk ikon gembok dulu');return}SW.mv=true;SW.w.classList.add('dr');try{SW.c.setPointerCapture(e.pointerId)}catch(x){}}SW.t=Math.max(-96,Math.min(0,SW.b+dx));SW.c.style.transform='translateX('+SW.t+'px)'});
function swEnd(){if(!SW)return;var q=SW;SW=null;if(!q.mv)return;q.w.classList.remove('dr');var o=q.t<-48;q.w.classList.toggle('op',o);q.c.style.transform=o?'translateX(-96px)':'';swMoved=Date.now()}
$('rpv').addEventListener('pointerup',swEnd);$('rpv').addEventListener('pointercancel',swEnd);
$('rpv').addEventListener('click',function(e){if(Date.now()-swMoved<400&&e.target.closest('.q4w')){e.preventDefault();e.stopPropagation()}},true);
$('v4').addEventListener('change',function(e){var t=e.target,id=t.dataset.ep||t.dataset.ed;if(!id)return;var s=st.SALES.filter(function(x){return x.i===id})[0];if(!s)return;
 if(t.dataset.ep){var p=num(t.value),r=fprod(s.p),o=r&&calc(r);if(!(p>0)||!o||o.err){toast(o&&!o.err?'Harga tidak valid':'Produk tidak ditemukan, harga tidak bisa diubah');rpt();return}s.a=p;s.u=fwdL(p,r,o.R).u}
 else{if(!t.value||t.value>today()){toast('Tanggal tidak valid');rpt();return}s.d=t.value}
 persist();rpt();toast('Penjualan diperbarui')});
return {rpt:rpt,sold:sold,curP:curP,VUSE:VUSE,rlAll:rlAll,ymd:ymd};
}
