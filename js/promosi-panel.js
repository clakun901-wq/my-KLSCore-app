/* Tahap 7a: panel dan tampilan promosi. Isi pernyataan dipindah mekanis dari app-core.js v9.42. */
export function createPromosiPanel(D){
var IC={af:'<circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M9.2 10.8l5.6-3.6M9.2 13.2l5.6 3.6"/>',lv:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M10.5 11v5l4-2.5zM8 3.5L12 7l4-3.5"/>',pt:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',vc:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',fs:'<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M5 4L3 6M19 4l2 2"/>',vi:'<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',pd:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',hm:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8h14v-8M8 8a2.5 2.5 0 0 1 0-5c2 0 4 2 4 5 0-3 2-5 4-5a2.5 2.5 0 0 1 0 5"/>',kh:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'};
function rw(l,v,c){return '<div class="rw">'+l+'<b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div>'}
function pinfo(t){return'<div class="wn i">'+t+'</div>'}
function pgm(p){var h='<div class="pit">'+pinfo('Pembeli yang belanja minimal nilai di atas dari produk utama mendapat 1 hadiah gratis. Biaya hadiah (modal + Management Partner + packing) ditanggung toko. Pembeli memilih salah satu produk hadiah.')+'<div class="pith">Produk utama</div>';
 (p.mp||[]).forEach(function(id,ix){var r=D.State.rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-mi="'+ix+'"><div class="pin"><span>'+D.esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-kmdel aria-label="Hapus produk utama">&#10005;</button></div></div>'});
 h+='<select data-kmadd aria-label="Tambah produk utama"><option value="">+ Tambah produk utama</option>'+D.State.rows.filter(function(r){return (p.mp||[]).indexOf(r.id)<0}).map(function(r){return '<option value="'+D.esc(r.id)+'">'+D.esc((r.n||'(tanpa nama)')+(r.live?' • live':''))+'</option>'}).join('')+'</select><div class="pith" style="margin-top:12px">Produk hadiah</div>';
 (p.gf||[]).forEach(function(id,ix){var r=D.State.rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-gi="'+ix+'"><div class="pin"><span>'+D.esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-gfdel aria-label="Hapus produk hadiah">&#10005;</button></div></div>'});
 return h+'<select data-gfadd aria-label="Tambah produk hadiah"><option value="">+ Tambah produk hadiah</option>'+D.State.rows.filter(function(r){return (p.gf||[]).indexOf(r.id)<0}).map(function(r){return '<option value="'+D.esc(r.id)+'">'+D.esc(r.n||'(tanpa nama)')+'</option>'}).join('')+'</select></div>'}
D.document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-gfadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.gf=x.p.gf||[]).push(t.value);D.persist();prRender()});
D.document.addEventListener('click',function(e){var d=e.target.closest&&e.target.closest('[data-gfdel]');if(!d)return;var x=ptc(e);if(!x)return;x.p.gf.splice(+d.closest('.pii').dataset.gi,1);D.persist();prRender()});
function phm(p){var gr=function(id){return D.State.rows.filter(function(x){return x.id===id})[0]},mains=(p.mp||[]).map(gr).filter(Boolean),gifts=(p.gf||[]).map(gr).filter(Boolean),mn=p.b||0;
 if(!mains.length)return pinfo('Pilih minimal 1 produk utama.');
 if(!(mn>0))return pinfo('Isi minimal belanja untuk melihat hitungan untung.');
 if(!gifts.length)return pinfo('Pilih minimal 1 produk hadiah. Biaya hadiah ditanggung toko.');
 var gc=gifts.map(function(g){return{r:g,c:D.tmod(g)}}),nog=gc.filter(function(g){return !(g.c>0)}).length,mx=Math.max.apply(null,gc.map(function(g){return g.c})),h='',bad=0,thin=0,n=0;
 mains.forEach(function(r){var o=D.calc(r),nm=D.esc(r.n||'(tanpa nama)');
  if(!o||o.err){h+='<div class="stk" style="margin:6px 2px">'+nm+': '+(o&&o.err?'harga belum bisa dihitung, periksa tab Hitung.':'modal belum diisi di tab Hitung.')+'</div>';return}
  var pm=D.actPromo(r,o),L=pm?pm.a:o.L;if(!(L>0))return;
  var N=Math.max(Math.ceil(mn/L),1),r2=Object.assign({},r,{q:(r.q>0?r.q:1)*N}),R2=Object.assign({},o.R,{cg:o.R.cg*N,cp:o.R.cp*N,cvx:o.R.cvx*N,clv:o.R.clv*N,cpb:o.R.cpb*N}),
  q=D.fwdL(L*N,r2,R2),ut=q.u-mx,x=D.warns({u:ut,P:q.P,sh:q.sh,pm:q.pm,tax:q.tax},true);
  n++;if(ut<0)bad++;else if(x.lv)thin++;
  h+='<div class="pit2"><b>'+nm+'</b>'+rw('Dijual di harga',D.rp(L)+(pm?' ('+D.esc(D.CFG[pm.t].n)+' berjalan)':''))+rw('Pembeli perlu beli',N+' pcs (total '+D.rp(L*N)+')')+rw('Untung sebelum hadiah',(q.u<0?'- ':'')+D.rp(Math.abs(q.u)),q.u<0?'bad':'')
   +gc.map(function(g){var u=q.u-g.c;return rw('Untung jika hadiah: '+D.esc((g.r.n||'(tanpa nama)').slice(0,24)),(u<0?'- ':'')+D.rp(Math.abs(u)),u<0?'bad':'ok')}).join('')
   +rw('Margin (hadiah termahal)',D.pc1(x.m)+'%')+D.WN(x)+'</div>'});
 if(!n)return pinfo('Modal produk utama belum diisi di tab Hitung.');
 return '<div class="res">'+rw('Produk utama dihitung',n)+rw('Rugi dengan hadiah termahal',bad,bad?'bad':'ok')+rw('Untung tipis',thin)+h
  +(p.x>0?rw('Estimasi biaya hadiah maks. (stok '+p.x.toLocaleString('id-ID')+' x hadiah termahal)',D.rp(p.x*mx)):'')
  +(nog?pinfo(nog+' produk hadiah belum diisi modalnya di tab Hitung, jadi biayanya dihitung Rp0.'):'')
  +pinfo('Hitungan per 1 pesanan: pembeli membeli produk utama sebanyak yang dibutuhkan untuk mencapai minimal belanja (harga promo berjalan dipakai jika ada), lalu mendapat 1 hadiah. Hadiah gratis, jadi hanya biaya modal, Management Partner, dan packing hadiah yang dihitung. Cocokkan aturan terbaru di Seller Centre.')+'</div>'}
function pkombo(p){var gr=function(id){return D.State.rows.filter(function(x){return x.id===id})[0]},mains=(p.mp||[]).map(gr).filter(Boolean),it=p.it||[];
 if(!mains.length)return pinfo('Pilih minimal 1 produk utama.');if(!it.length)return pinfo('Tambah produk tambahan dan atur diskonnya. Diskon tiap produk boleh berbeda.');
 var ex=D.State.A.og+(D.State.A.fb=='yes'?D.State.A.fl:0),h='',bad=0,thin=0,n=0,mu=mains.map(function(r){var o=D.calc(r);if(!o||o.err)return null;var pm=D.actPromo(r,o),L=pm?pm.a:o.L,q=D.fwdL(L,r,o.R);return{r:r,u:q.u,L:L,pn:pm?D.CFG[pm.t].n:''}}).filter(Boolean);
 it.forEach(function(z){var r=gr(z.p);if(!r)return;var o=D.calc(r),nm=D.esc(r.n||'(tanpa nama)');
  if(!o||o.err){h+='<div class="stk" style="margin:6px 2px">'+nm+': '+(o&&o.err?'harga belum bisa dihitung, periksa tab Hitung.':'modal belum diisi di tab Hitung.')+'</div>';return}
  var M=o.M,Lp=D.ptp(p,z,M);if(!(Lp>0)){h+='<div class="stk" style="margin:6px 2px">'+nm+': isi diskon atau harga kombo.</div>';return}
  n++;var q=D.fwdL(Lp,r,o.R),ui=q.u+ex,x=D.warns({u:ui,P:Lp,sh:q.sh,pm:q.pm,tax:q.tax},true),dp=Math.floor((M-Lp)/M*1000)/10,
  mT=D.bis(function(L){for(var k=0;k<=5;k++)if(D.fwdL(L+k,r,o.R).u+ex<r.t)return false;return true}),
  mI=D.bis(function(L){for(var k=0;k<=5;k++)if(D.fwdL(L+k,r,o.R).u+ex<0)return false;return true}),
  dt=function(m){return m===null?'tidak bisa dihitung':(m>=M?0:Math.floor((M-m)/M*100))+'% (harga '+D.rp(m)+')'};
  if(ui<0)bad++;else if(x.lv)thin++;
  h+='<div class="pit2"><b>'+nm+'</b>'+rw('Harga asli (listing)',D.rp(M))+rw('Harga kombo',D.rp(Lp)+(dp>0?' (-'+D.fmt(dp)+'%)':''))+rw(ui<0?'Rugi dari produk tambahan':'Untung dari produk tambahan',(ui<0?'- ':'')+D.rp(Math.abs(ui)),ui<0?'bad':'ok')+rw('Margin',D.pc1(x.m)+'%')
   +mu.map(function(m){var t=m.u+ui;return rw('Untung paket dengan '+D.esc((m.r.n||'(tanpa nama)').slice(0,22))+' (utama dijual '+D.rp(m.L)+(m.pn?', '+m.pn+' berjalan':'')+')',(t<0?'- ':'')+D.rp(Math.abs(t)),t<0?'bad':'ok')}).join('')
   +rw('Diskon maks. agar target tercapai',dt(mT))+rw('Diskon maks. agar tidak rugi',dt(mI))+(z.l>0?rw('Batas pembelian',z.l+' pcs'):'')
   +(Lp>=o.L?pinfo('Harga kombo tidak lebih murah dari harga akhir produk ini saat ini ('+D.rp(o.L)+'), jadi pembeli tidak terdorong membeli paket.'):'')+D.WN(x)+'</div>'});
 return '<div class="res">'+rw('Produk tambahan dihitung',n)+rw('Rugi dari produk tambahan',bad,bad?'bad':'ok')+rw('Untung tipis',thin)+h+pinfo('Perkiraan untuk 1 produk utama + 1 produk tambahan dalam satu pesanan. Ongkir dan biaya proses pesanan dihitung sekali. Produk utama dijual di harga yang sedang berlaku: harga Promo Toko atau Flash Sale yang berjalan, atau harga akhir biasa (harga coret setelah diskon) jika tidak ada promo aktif. Bukan harga asli.')+'</div>'}
function pvoucher(p){var jt=p.jt||'toko',vf=function(L){return D.vdisc(p,L)};
 if(!(p.a>0))return pinfo('Isi nilai voucher untuk melihat hitungan untung.');
 var rs=jt=='toko'?D.State.rows.filter(function(r){return r.m>0}):[p.p,p.p2,p.p3].filter(Boolean).map(function(id){return D.State.rows.filter(function(x){return x.id===id})[0]}).filter(Boolean),h='<div class="res">',ks=p.x>0?p.x:0,us=p.y||0;
 if(ks){h+=rw('Kuota',ks.toLocaleString('id-ID')+' pcs')+rw('Sudah digunakan',us.toLocaleString('id-ID')+' pcs')+rw('Tersisa',Math.max(ks-us,0).toLocaleString('id-ID')+' pcs');var un=(p.u=='pct'||p.u=='cb')?(p.cp>0?p.cp:0):p.a;if(un>0)h+=rw('Estimasi pengeluaran maks. (kuota x '+((p.u=='pct'||p.u=='cb')?'maks. potongan':'nilai')+')',D.rp(ks*un))+rw('Pengeluaran terpakai (maks.)',D.rp(us*un))+(p.m>0?rw('Maks. per pembeli ('+p.m+' pcs)',D.rp(p.m*un)):'');else if(p.u=='pct'||p.u=='cb')h+=pinfo('Isi maksimum potongan untuk melihat estimasi pengeluaran.')}
 if(!rs.length)return h+pinfo(jt=='toko'?'Belum ada produk dengan modal terisi di tab Hitung.':'Pilih produk untuk melihat hitungan untung.')+'</div>';
 var bad=[],thin=0,n=0,ln='',win=0,los=0,nmn=0,act=D.vcList().indexOf(p)>=0;
 rs.forEach(function(r){var o=D.calc(r);if(!o||o.err)return;n++;if(act){if(o.vq===p)win++;else if(p.b>0&&o.L<p.b)nmn++;else if(o.v>0)los++}var v=vf(o.L),q=D.fwdV(o.L,v,r,o.R);if(p.u=='cb'){var cc=D.cbc(p,o.L);q.u-=cc;q.s-=cc}var x=D.warns(q,true);
  if(q.u<0)bad.push(r.n||'(tanpa nama)');else if(x.lv)thin++;
  if(jt!='toko')ln+=rw(D.esc(r.n||'(tanpa nama)'),(q.u<0?'Rugi ':'Untung ')+D.rp(Math.abs(q.u))+' ('+D.pc1(x.m)+'%)',q.u<0?'bad':(q.u<D.State.A.wu||x.m<D.State.A.wm)?'':'ok')+(p.b>0&&o.L<p.b?'<div class="stk" style="margin:0 2px">Min. belanja '+D.rp(p.b)+': perlu '+Math.ceil(p.b/o.L)+' pcs</div>':'')});
 if(!n)return h+pinfo('Modal produk belum diisi di tab Hitung.')+'</div>';
 if(jt=='toko')h+=rw('Produk dihitung',n)+rw('Rugi dengan voucher ini',bad.length,bad.length?'bad':'ok')+(bad.length?'<div class="stk" style="margin:0 2px">'+bad.slice(0,5).map(D.esc).join(', ')+(bad.length>5?' dan '+(bad.length-5)+' lainnya':'')+'</div>':'')+rw('Untung tipis',thin);else h+=ln;
 return h+D.vcEff(p,n,win,los,nmn)+pinfo((p.u=='cb'?'Cashback koin: harga pembeli tidak berubah, biaya cashback ditanggung toko dan dikurangkan dari untung (perkiraan, cocokkan dengan aturan Shopee). ':'')+'Voucher Toko dan Voucher Produk yang berjalan otomatis dipakai di tab Hitung bila paling hemat bagi pembeli (diasumsikan satu voucher per pesanan). Hitungan di atas mengandaikan pembeli memakai voucher ini.')+'</div>'}
function pun(p,k){var c=D.CFG[p.t];if(c.u&&k=='a')return(p.u=='pct'||p.u=='cb')?'%':'m';if(c.c=='pd'&&k=='b')return (p.tp||'pct')=='pct'?'%':'m';return c[k][1]}
function ppd(p,r,o){var N=Math.max(Math.round(p.a||0),1),tp=p.tp||'pct',v=p.b||0;
 if(!(p.a>0))return pinfo('Isi jumlah beli untuk melihat hitungan untung.');
 if(!(v>0))return pinfo(tp=='hrg'?'Isi harga paket diskon.':'Isi nilai diskon.');
 var base=o.L*N,Lp=Math.max(tp=='pct'?Math.floor(base*(100-v)/100+1e-7):tp=='nom'?base-v:v,0),
 r2=Object.assign({},r,{q:(r.q>0?r.q:1)*N}),R2=Object.assign({},o.R,{cg:o.R.cg*N,cp:o.R.cp*N,cvx:o.R.cvx*N,clv:o.R.clv*N,cpb:o.R.cpb*N}),
 q=D.fwdL(Lp,r2,R2),x=D.warns(q,true),hm=base-Lp,im=D.bis(function(L){for(var k=0;k<=5;k++)if(D.fwdL(L+k,r2,R2).u<0)return false;return true});
 return '<div class="res">'+rw('Beli',N+' pcs')+rw('Harga normal ('+N+' pcs)',D.rp(base))+rw('Harga paket',D.rp(Lp))+rw('Harga per pcs',D.rp(Math.round(Lp/N)))+rw('Hemat untuk pembeli',hm>0?D.rp(hm)+' ('+D.pc1(hm/base*100)+'%)':'tidak ada')+(q.v?rw('Voucher toko','- '+D.rp(q.v)):'')+rw('Saldo masuk toko',D.rp(q.s))+rw('Modal ('+N+' pcs + Management Partner + packing)',D.rp(D.tmod(r2)))+rw(q.u<0?'Rugi bersih per paket':'Untung bersih per paket',(q.u<0?'- ':'')+D.rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',D.pc1(x.m)+'%')+(im===null?'':rw('Harga paket minimal agar tidak rugi',D.rp(im)))+(p.x>0?rw('Untung per pembeli (batas '+p.x+' paket)',(q.u<0?'- ':'')+D.rp(Math.abs(q.u)*p.x),q.u<0?'bad':''):'')+D.WN(x)+pinfo('Modal dihitung per pesanan: modal x '+N+' pcs, ditambah biaya Management Partner dan packing sekali.')+'</div>'}
function pdet(p,z){var r=D.State.rows.filter(function(x){return x.id===z.p})[0];if(!r)return{h:''};var o=D.calc(r),nm=D.esc(r.n||'(tanpa nama)');
 if(!o||o.err)return{h:'<div class="stk" style="margin:6px 2px">'+(o&&o.err?'Harga belum bisa dihitung, periksa tab Hitung.':'Modal belum diisi di tab Hitung.')+'</div>'};
 var M=o.M,Lp=D.ptp(p,z,M);if(!(Lp>0))return{h:'<div class="stk" style="margin:6px 2px">Isi diskon atau harga promo.</div>'};
 var q=D.fwdL(Lp,r,o.R),x=D.warns(q,true),dp=Math.floor((M-Lp)/M*1000)/10,lim=z.l>0?z.l:(p.x>0?p.x:0),
 mT=D.bis(function(L){for(var k=0;k<=5;k++)if(D.fwdL(L+k,r,o.R).u<r.t)return false;return true}),
 mI=D.bis(function(L){for(var k=0;k<=5;k++)if(D.fwdL(L+k,r,o.R).u<0)return false;return true}),
 dt=function(m){return m===null?'tidak bisa dihitung':(m>=M?0:Math.floor((M-m)/M*100))+'% (harga '+D.rp(m)+')'};
 return{n:1,u:q.u,bad:q.u<0?1:0,thin:(q.u>=0&&x.lv)?1:0,h:'<div class="pit2"><b>'+nm+'</b>'+rw('Harga asli (listing)',D.rp(M))+rw('Harga promo',D.rp(Lp)+(dp>0?' (-'+D.fmt(dp)+'%)':''))+rw(q.u<0?'Rugi bersih':'Untung bersih',(q.u<0?'- ':'')+D.rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',D.pc1(x.m)+'%')+rw('Diskon maks. agar target tercapai',dt(mT))+rw('Diskon maks. agar tidak rugi',dt(mI))+(lim?rw('Batas pembelian',lim+' pcs'):'')+D.WN(x)+'</div>'}}
function ppt(p){var it=p.it||[];if(!it.length)return pinfo('Tambah produk ke promo ini. Isi diskon atau harga promo (cukup salah satu, yang lain terisi otomatis). Kosongkan untuk memakai diskon bawaan ('+(p.a>0?D.fmt(p.a)+'%':'belum diisi')+').');
 var bad=0,thin=0,n=0;
 it.forEach(function(z){var d=pdet(p,z);n+=d.n||0;bad+=d.bad||0;thin+=d.thin||0});
 return '<div class="res">'+rw('Produk dihitung',n)+rw('Rugi dengan diskon ini',bad,bad?'bad':'ok')+rw('Untung tipis',thin)+pinfo('Rincian tiap produk ada di kartu produknya. Harga asli = harga listing hasil hitung di tab Hitung. Voucher toko ikut dihitung.')+'</div>'}
function pitM(z){var r=D.State.rows.filter(function(x){return x.id===z.p})[0],o=r?D.calc(r):null;return o&&!o.err&&o.M>0?o.M:0}
function pitH(M,d){return Math.round(M*(100-d)/100).toLocaleString('id-ID')}
function pitD(M,h){return D.fmt(Math.round(Math.max((M-h)/M*100,0)*10)/10)}
function pitPh(p,M){return{d:p.a>0?D.fmt(p.a):'0',h:(M>0&&p.a>0)?pitH(M,p.a):'otomatis'}}
function pds(d){return d.n?(d.u<0?'Rugi ':'Untung ')+D.rp(Math.abs(d.u)):'Belum dihitung'}
function pdd(p,z){var d=pdet(p,z);return '<details class="pdd"'+(z.ro?' open':'')+'><summary><span>Rincian hitungan</span><b class="pds '+(d.n?(d.bad?'bad':'ok'):'')+'">'+pds(d)+'</b></summary><div class="pdt">'+d.h+'</div></details>'}
function pitSync(c,p){c.querySelectorAll('.pii[data-ix]').forEach(function(ii){var z=(p.it||[])[+ii.dataset.ix];if(!z)return;var M=pitM(z),ph=pitPh(p,M),a=ii.querySelector('.pdt'),d=ii.querySelector('[data-it=d]'),h=ii.querySelector('[data-it=h]');if(a){var dd=pdet(p,z);D.KDOM.setHTML(a, dd.h);var sm=ii.querySelector('.pds');if(sm){sm.textContent=pds(dd);sm.className='pds '+(dd.n?(dd.bad?'bad':'ok'):'')}}if(d)d.placeholder=ph.d;if(h)h.placeholder=ph.h})}
function pitems(p){var kh=p.t=='kh',h='<div class="pit"><div class="pith">'+(kh?'Produk tambahan (dapat diskon, bisa berbeda tiap produk)':'Produk dalam promo (diskon bisa berbeda tiap produk)')+'</div>';
 (p.it||[]).forEach(function(z,ix){var r=D.State.rows.filter(function(x){return x.id===z.p})[0];
  var M=kh?0:pitM(z),ph=kh?{d:(p.a>0?D.fmt(p.a):'0'),h:'otomatis'}:pitPh(p,M),dv=z.d>0?D.fmt(z.d):(M>0&&z.h>0?pitD(M,z.h):''),hv=z.h>0?z.h.toLocaleString('id-ID'):(M>0&&z.d>0?pitH(M,z.d):'');
  h+='<div class="pii" data-ix="'+ix+'"><div class="pin"><span>'+D.esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-itdel aria-label="Hapus produk dari promo">&#10005;</button></div><div class="g3"><div><label>Diskon (%)</label><input data-it="d" inputmode="decimal" placeholder="'+ph.d+'" value="'+dv+'"></div><div><label>Harga promo (Rp)</label><input data-it="h" inputmode="numeric" placeholder="'+ph.h+'" value="'+hv+'"></div><div><label>Batas beli</label><input data-it="l" inputmode="numeric" placeholder="'+(p.x>0?p.x:'-')+'" value="'+(z.l>0?z.l:'')+'"></div></div><div class="pia"><select data-itsw aria-label="Ganti produk ini"><option value="">Ganti produk...</option>'+D.State.rows.filter(function(r2){return r2.id!==z.p&&!(p.it||[]).some(function(y){return y.p===r2.id})&&!(kh&&(p.mp||[]).indexOf(r2.id)>=0)}).map(function(r2){return '<option value="'+D.esc(r2.id)+'">'+D.esc((r2.n||'(tanpa nama)')+(r2.live?' \u2022 live':''))+'</option>'}).join('')+'</select><button class="lk" type="button" data-itrs>Kosongkan isian</button></div>'+(kh?'':pdd(p,z))+'</div>'});
 return h+'<select data-itadd aria-label="'+(kh?'Tambah produk tambahan':'Tambah produk ke promo')+'"><option value="">'+(kh?'+ Tambah produk tambahan':'+ Tambah produk ke promo')+'</option>'+D.State.rows.filter(function(r){return !(p.it||[]).some(function(z){return z.p===r.id})&&!(kh&&(p.mp||[]).indexOf(r.id)>=0)}).map(function(r){return '<option value="'+D.esc(r.id)+'">'+D.esc((r.n||'(tanpa nama)')+(r.live?' \u2022 live':''))+'</option>'}).join('')+'</select>'+(kh?'':'<button class="lk" type="button" data-itall>Masukkan semua produk live</button>')+'</div>'}
function pmain(p){var h='<div class="pit">'+pinfo('Aturan hadiah: pembeli membeli produk utama, lalu mendapat diskon untuk produk tambahan.')+'<div class="pith">Produk utama</div>';
 (p.mp||[]).forEach(function(id,ix){var r=D.State.rows.filter(function(x){return x.id===id})[0];h+='<div class="pii" data-mi="'+ix+'"><div class="pin"><span>'+D.esc(r?(r.n||'(tanpa nama)'):'Produk sudah dihapus')+'</span><button class="x" type="button" data-kmdel aria-label="Hapus produk utama">&#10005;</button></div></div>'});
 return h+'<select data-kmadd aria-label="Tambah produk utama"><option value="">+ Tambah produk utama</option>'+D.State.rows.filter(function(r){return (p.mp||[]).indexOf(r.id)<0&&!(p.it||[]).some(function(z){return z.p===r.id})}).map(function(r){return '<option value="'+D.esc(r.id)+'">'+D.esc((r.n||'(tanpa nama)')+(r.live?' \u2022 live':''))+'</option>'}).join('')+'</select></div>'}
D.document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-kmadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.mp=x.p.mp||[]).push(t.value);D.persist();prRender()});
D.document.addEventListener('click',function(e){var d=e.target.closest&&e.target.closest('[data-kmdel]');if(!d)return;var x=ptc(e);if(!x)return;x.p.mp.splice(+d.closest('.pii').dataset.mi,1);D.persist();prRender()});
function ptc(e){var c=e.target.closest('.pe');return c&&D.State.PRM[+c.dataset.i]?{c:c,p:D.State.PRM[+c.dataset.i]}:null}
D.document.addEventListener('change',function(e){var t=e.target;if(!t.matches||!t.matches('[data-itadd]')||!t.value)return;var x=ptc(e);if(!x)return;(x.p.it=x.p.it||[]).push({p:t.value,d:0,h:0,l:0});D.persist();prRender()});
D.document.addEventListener('click',function(e){var del=e.target.closest&&e.target.closest('[data-itdel]'),all=e.target.closest&&e.target.closest('[data-itall]');if(!del&&!all)return;var x=ptc(e);if(!x)return;if(del)x.p.it.splice(+del.closest('.pii').dataset.ix,1);else D.State.rows.forEach(function(r){if(r.live&&r.m>0&&!(x.p.it||[]).some(function(z){return z.p===r.id}))(x.p.it=x.p.it||[]).push({p:r.id,d:0,h:0,l:0})});D.persist();prRender()});
D.document.addEventListener('input',function(e){var t=e.target,k=t.dataset&&t.dataset.it;if(!k)return;var x=ptc(e);if(!x)return;var ii=t.closest('.pii'),z=x.p.it[+ii.dataset.ix];if(!z)return;var pt=x.p.t=='pt',M=pt?pitM(z):0;
 if(k=='d'){z.d=Math.min(Math.max((String(t.value).trim()===''?NaN:Number(String(t.value).replace(',','.')))||0,0),99.9);if(z.d>0){z.h=0;ii.querySelector('[data-it=h]').value=(pt&&M>0)?pitH(M,z.d):''}else if(pt){z.h=0;ii.querySelector('[data-it=h]').value=''}}
 else if(k=='h'){z.h=D.num(t.value);D.fk(t,z.h?z.h.toLocaleString('id-ID'):'');if(z.h>0){z.d=0;ii.querySelector('[data-it=d]').value=(pt&&M>0)?pitD(M,z.h):''}else if(pt){z.d=0;ii.querySelector('[data-it=d]').value=''}}
 else{z.l=D.num(t.value)}
 D.persist();prRes(x.c,x.p)});
D.document.addEventListener('change',function(e){var t=e.target;if(!t.dataset||t.dataset.itsw===undefined||!t.value)return;var x=ptc(e);if(!x)return;var ii=t.closest('.pii'),z=x.p.it[+ii.dataset.ix];if(!z)return;z.p=t.value;if(z.h>0){z.h=0;D.toast('Produk diganti. Harga promo (Rp) dikosongkan karena harga produk berbeda')}else D.toast('Produk diganti');D.persist();prRender()});
D.document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-itrs]');if(!b)return;var x=ptc(e);if(!x)return;var z=x.p.it[+b.closest('.pii').dataset.ix];if(!z)return;z.d=0;z.h=0;z.l=0;D.persist();prRender();D.toast('Isian dikosongkan, kembali ke diskon bawaan')});
D.document.addEventListener('toggle',function(e){var t=e.target;if(!t.classList||!t.classList.contains('pdd'))return;var x=ptc(e);if(!x)return;var ii=t.closest('.pii'),z=ii&&x.p.it[+ii.dataset.ix];if(z)z.ro=t.open},true);
var PKS=null,PKT=null;
function pkOk(s){return !!s&&s.tagName=='SELECT'&&s.options.length>=8&&!s.disabled}
function pkClose(){var b=D.$('pkb');if(b)b.remove();D.document.removeEventListener('keydown',pkKey,true);PKS=null}
function pkKey(e){if(e.key=='Escape'){e.preventDefault();pkClose()}}
function pkOpen(sel){if(PKS)return;PKS=sel;
 var opts=Array.prototype.filter.call(sel.options,function(o){return o.value!==''}),ph=sel.options[0]?sel.options[0].text:'Pilih produk',
 hay=opts.map(function(o){var r=D.State.rows.filter(function(x){return x.id===o.value})[0];return(o.text+' '+(r?(r.sku||'')+' '+(r.sup||''):'')).toLowerCase()});
 var b=D.document.createElement('div');b.id='pkb';b.className='pkb';
 D.KDOM.setHTML(b, '<div class="pks" role="dialog" aria-modal="true" aria-label="'+D.esc(ph)+'"><div class="pkt">'+D.esc(ph.replace(/^\+\s*/,''))+'</div><div class="pkh"><input id="pki" type="search" placeholder="Cari produk, SKU, atau supplier" aria-label="Cari produk" autocomplete="off"><button type="button" id="pkx" aria-label="Tutup">&#10005;</button></div><div class="pkn" id="pkn"></div><div id="pkl"></div></div>');
 D.document.body.appendChild(b);
 var inp=D.$('pki'),lst=D.$('pkl'),cnt=D.$('pkn');
 function draw(){var q=inp.value.toLowerCase().split(/\s+/).filter(Boolean),h='',n=0;opts.forEach(function(o,i){if(q.every(function(w){return hay[i].indexOf(w)>=0})){n++;h+='<button type="button" class="pkr" data-v="'+D.esc(o.value)+'">'+D.esc(o.text)+'</button>'}});cnt.textContent=n?n+' produk':'';D.KDOM.setHTML(lst, h||'<div class="pke">Tidak ada produk yang cocok.</div>')}
 inp.addEventListener('input',draw);draw();
 b.addEventListener('click',function(e){var r=e.target.closest('.pkr');if(r){var v=r.dataset.v,s=PKS;pkClose();if(s){s.value=v;s.dispatchEvent(new D.Event('change',{bubbles:true}))}return}if(e.target===b||e.target.closest('#pkx'))pkClose()});
 D.document.addEventListener('keydown',pkKey,true);D.setTimeout(function(){try{inp.focus()}catch(x){}},30)}
(function(){var v=D.$('v3');if(!v)return;
 v.addEventListener('mousedown',function(e){var s=e.target.closest&&e.target.closest('select');if(pkOk(s)){e.preventDefault();pkOpen(s)}},true);
 v.addEventListener('touchstart',function(e){var t=e.touches[0];PKT=t?{x:t.clientX,y:t.clientY}:null},{passive:true,capture:true});
 v.addEventListener('touchend',function(e){var s=e.target.closest&&e.target.closest('select'),t=e.changedTouches[0];if(!pkOk(s)||!PKT||!t)return;var mv=Math.abs(t.clientX-PKT.x)+Math.abs(t.clientY-PKT.y);PKT=null;if(mv>10)return;if(e.cancelable)e.preventDefault();pkOpen(s)},{passive:false,capture:true});
 v.addEventListener('keydown',function(e){var s=e.target;if(pkOk(s)&&(e.key=='Enter'||e.key==' ')){e.preventDefault();pkOpen(s)}},true)})();
function pcalc(p){var c=D.CFG[p.t];if(!c||!c.c)return'';if(c.c=='pt')return ppt(p);if(c.c=='kh')return pkombo(p);if(c.c=='hm')return phm(p);if(c.c=='vc')return pvoucher(p);
 var r=D.State.rows.filter(function(x){return x.id===p.p})[0];
 if(!r)return'<div class="wn i">Pilih produk untuk melihat hitungan untung.</div>';
 var o=D.calc(r);if(!o||o.err)return'<div class="wn i">'+(o&&o.err?'Harga produk belum bisa dihitung, periksa tab Hitung.':'Modal produk belum diisi di tab Hitung.')+'</div>';
 var h,q,x,im;
 if(c.c=='vi')return D.pcalc2(p,r,o);
 if(c.c=='pd')return ppd(p,r,o);
 if(c.c=='af'){var k=p.a||0,fee=Math.round(o.L*k/100),u=o.u-fee;q=Object.assign({},o,{u:u});x=D.warns(q,true);
  return '<div class="res">'+rw('Harga akhir saat ini',D.rp(o.L))+rw('Untung sebelum komisi',D.rp(o.u))+rw('Komisi affiliate ('+D.fmt(k)+'%)','- '+D.rp(fee))+rw(u<0?'Rugi bersih':'Untung bersih',(u<0?'- ':'')+D.rp(Math.abs(u)),u<0?'bad':'ok')+rw('Margin',D.pc1(x.m)+'%')+D.WN(x)+'</div>'}
 var L=c.c=='pd'?Math.floor(o.L*(100-(p.b||0))/100+1e-7):(p.a||0);
 if(!(L>0))return'<div class="wn i">Isi harga promo untuk melihat hitungan untung.</div>';
 q=D.fwdL(L,r,o.R);x=D.warns(q,true);im=D.impas(r,o.R);
 return '<div class="res">'+rw(c.c=='pd'?'Harga per pcs setelah diskon':'Harga promo',D.rp(q.L))+(q.v?rw('Voucher toko','- '+D.rp(q.v)):'')+rw('Saldo masuk toko',D.rp(q.s))+rw('Modal + Management Partner + packing',D.rp(D.tmod(r)))+rw(q.u<0?'Rugi bersih':'Untung bersih',(q.u<0?'- ':'')+D.rp(Math.abs(q.u)),q.u<0?'bad':'ok')+rw('Margin',D.pc1(x.m)+'%')+(im===null?'':rw('Harga promo minimal (impas)',D.rp(im)))+D.WN(x)+'</div>'}
function pfCard(i,p){var c=D.CFG[p.t],h='';
 var fld=function(k,d){if(!d)return'';var un=pun(p,k),v=p[k]||0,val=!v?'':un=='%'?D.fmt(v):v.toLocaleString('id-ID');return '<div><label>'+((c.c=='pd'&&k=='b')?{pct:'Dan dapatkan (% diskon)',nom:'Dan dapatkan potongan (Rp)',hrg:'Harga paket diskon (Rp)'}[p.tp||'pct']:(k=='cp'&&p.u=='cb'?'Maksimum cashback (Rp)':d[0])+(c.u&&k=='a'?(p.u=='pct'?' (%)':p.u=='cb'?' (% cashback)':' (Rp)'):''))+'</label><input data-pf="'+k+'" inputmode="'+(un=='%'?'decimal':'numeric')+'" value="'+val+'" placeholder="0"></div>'};
 var optf=function(key){return '<option value="">Pilih produk</option>'+D.State.rows.map(function(r){return '<option value="'+D.esc(r.id)+'"'+(r.id===p[key]?' selected':'')+'>'+D.esc((r.n||'(tanpa nama)')+(r.live?' • live':''))+'</option>'}).join('')};
 var sel=function(key,lb){return '<div style="grid-column:1/-1"><label>'+lb+'</label><select data-pf="'+key+'">'+optf(key)+'</select></div>'};
 var jt0=p.jt||'toko',jsel=c.jt?'<div style="grid-column:1/-1"><label>Jenis voucher</label><select data-pf="jt">'+[['toko','Voucher Toko (semua produk)'],['produk','Voucher Produk (produk pilihan)'],['live','Voucher Live (hanya Shopee Live)'],['video','Voucher Video (hanya Shopee Video)']].map(function(o){return '<option value="'+o[0]+'"'+(o[0]==jt0?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>':'';
 var tsel=c.tp?'<div style="grid-column:1/-1"><label>Tipe paket diskon</label><select data-pf="tp">'+[['pct','Persentase diskon'],['nom','Nominal diskon'],['hrg','Harga paket diskon']].map(function(o){return '<option value="'+o[0]+'"'+(o[0]==(p.tp||'pct')?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>':'';
 var usel=c.u?'<div style="grid-column:1/-1"><label>Jenis diskon</label><select data-pf="u"><option value="rp"'+((p.u!='pct'&&p.u!='cb')?' selected':'')+'>Nominal Diskon (Rp)</option><option value="pct"'+(p.u=='pct'?' selected':'')+'>Persentase Diskon (%)</option>'+(p.t=='vc'?'<option value="cb"'+(p.u=='cb'?' selected':'')+'>Cashback Koin</option>':'')+'</select></div>':'';
 var dts='<div><label>Waktu mulai</label><input type="date" data-pf="s" value="'+D.esc(p.s||'')+'"></div><div><label>Waktu berakhir</label><input type="date" data-pf="e" value="'+D.esc(p.e||'')+'"></div>';
 return '<div class="pe" data-i="'+i+'"><div class="peh"><span class="pty">'+c.n+'</span><span class="pst"></span><button class="x" type="button" data-del aria-label="Hapus promo">&#10005;</button></div><input class="nm" data-pf="n"'+(p.t=='kh'?' maxlength="25"':'')+' placeholder="Nama promo atau kode" aria-label="Nama promo" value="'+D.esc(p.n||'')+'"><div class="g">'+(c.c=='vc'?'':dts)+''+(c.jt?jsel+(jt0!='toko'?sel('p','Produk 1')+sel('p2','Produk 2 (opsional)')+sel('p3','Produk 3 (opsional)'):''):c.ps?sel('p','Produk 1')+sel('p2','Produk 2')+sel('p3','Produk 3 (opsional)'):c.p?sel('p','Produk'):'')+usel+tsel+fld('a',c.a)+((p.u=='pct'||p.u=='cb')?fld('cp',c.cp):'')+fld('b',c.b)+fld('x',c.x)+fld('m',c.m)+fld('y',c.y)+(c.c=='vc'?dts:'')+'<div style="grid-column:1/-1"><label>Catatan</label><input data-pf="k" style="text-align:left" placeholder="Opsional" value="'+D.esc(p.k||'')+'"></div></div>'+(p.t=='pt'?pitems(p):p.t=='kh'?pmain(p)+pitems(p):p.t=='hm'?pgm(p):'')+'<div class="prc"></div></div>'}
function prRes(c,p){var s=D.pst(p),e=c.querySelector('.pst');e.className='pst '+s.k;e.textContent=s.t;D.KDOM.setHTML(c.querySelector('.prc'), pcalc(p));if(p.t=='pt')pitSync(c,p);prTiles()}
function paSync(){var off=D.State.A.pa=='no';D.document.querySelectorAll('[data-pa]').forEach(function(x){x.hidden=off});var e=D.$('pa');if(e&&e.value!=(off?'no':'yes'))e.value=off?'no':'yes'}
function prTiles(){var h='',cnt={},tot={a:0,u:0,e:0};
 D.State.PRM.forEach(function(p){var k=D.pst(p).k;if(k=='a'||k=='u'){cnt[p.t]=(cnt[p.t]||0)+1}if(tot[k]!==undefined)tot[k]++});
 D.PORD.forEach(function(k){h+='<button type="button" class="tl'+(D.PSEL==k?' on':'')+'" data-pt="'+k+'" aria-pressed="'+(D.PSEL==k)+'"><span class="tc"><svg viewBox="0 0 24 24">'+IC[k]+'</svg>'+(cnt[k]?'<i>'+cnt[k]+'</i>':'')+'</span><span class="tn">'+D.CFG[k].n+'</span></button>'});
 D.KDOM.setHTML(D.$('prt'), h);D.$('prs').textContent=D.State.PRM.length?tot.a+' berjalan, '+tot.u+' akan datang, '+tot.e+' berakhir':'Pilih jenis promo, lalu tekan tombol Tambah.';
 D.$('vcs').hidden=D.PSEL!='vc';D.$('pts').hidden=D.PSEL!='pt';paSync();var b=D.$('pra');b.textContent=D.PSEL?'Tambah '+D.CFG[D.PSEL].n:'Pilih jenis promo di atas';b.className='btn'+(D.PSEL?'':' gh')}
function prRender(){D.VoucherRules.reset();D.CalcCache.invalidate();prTiles();var ix=[];D.State.PRM.forEach(function(p,i){if(!D.PSEL||p.t==D.PSEL)ix.push(i)});
 var ord={a:0,u:1,n:2,e:3};ix.sort(function(x,y){var a=ord[D.pst(D.State.PRM[x]).k],b=ord[D.pst(D.State.PRM[y]).k];return a-b||(D.State.PRM[x].s||'').localeCompare(D.State.PRM[y].s||'')});
 D.KDOM.setHTML(D.$('prl'), ix.length?ix.map(function(i){return pfCard(i,D.State.PRM[i])}).join(''):'<div class="si"><div class="empty">'+(D.PSEL?'Belum ada '+D.CFG[D.PSEL].n+'. Tekan tombol Tambah di bawah.':'Belum ada promo.')+'</div></div>');
 D.document.querySelectorAll('#prl .pe').forEach(function(c){prRes(c,D.State.PRM[+c.dataset.i])})}
D.$('prt').addEventListener('click',function(e){var b=e.target.closest('[data-pt]');if(!b)return;D.PSEL=D.PSEL==b.dataset.pt?'':b.dataset.pt;prRender()});
D.$('pra').onclick=function(){if(!D.PSEL){D.toast('Pilih jenis promo dulu');return}if(D.State.PRM.length>=300){D.toast('Maksimal 300 promo');return}
 D.State.PRM.push({id:D.uid(),t:D.PSEL,n:'',s:D.today(),e:'',p:'',a:0,b:0,k:'',it:[],mp:[],gf:[]});prRender();D.persist();var c=D.$('prl').querySelector('.pe[data-i="'+(D.State.PRM.length-1)+'"]');if(c){c.scrollIntoView({block:'center'});c.querySelector('input').focus()}};
D.$('prl').addEventListener('click',function(e){if(!e.target.closest('[data-del]'))return;var c=e.target.closest('.pe'),p=D.State.PRM[+c.dataset.i];D.ask('Hapus promo ini?','Ya, hapus',function(){D.State.PRM.splice(D.State.PRM.indexOf(p),1);prRender();D.persist();D.toast('Promo dihapus')})});
D.$('prl').addEventListener('input',function(e){var t=e.target,c=t.closest('.pe');if(!c||!t.dataset.pf)return;var p=D.State.PRM[+c.dataset.i],k=t.dataset.pf;D.VoucherRules.reset();D.CalcCache.invalidate();
 if(k=='a'||k=='b'||k=='x'||k=='y'||k=='m'||k=='cp'){var u=pun(p,k);if(u=='%'){var v=(t.value.trim()===''?NaN:Number(t.value.replace(',','.')));p[k]=isNaN(v)||v<0?0:Math.min(v,100)}else{var n=D.num(t.value);p[k]=n;t.value=n?n.toLocaleString('id-ID'):''}}
 else if(k=='u'){p.u=t.value;p.a=0;prRender();D.persist();return}
 else if(k=='tp'){p.tp=t.value;p.b=0;prRender();D.persist();return}
 else if(k=='jt'){p.jt=t.value;prRender();D.persist();return}
 else p[k]=(k=='n'||k=='k')?t.value.slice(0,120):t.value;
 prRes(c,p);D.persist()});
return {paSync,pinfo,prRender,rw};
}
