var AD0=JSON.parse(JSON.stringify(AD)),GO0=JSON.parse(JSON.stringify(GO));
function tblSync(){Object.keys(AD0).forEach(function(k){AD[k]=(A.tbl&&A.tbl.AD&&A.tbl.AD[k])?A.tbl.AD[k].slice():AD0[k].slice()});Object.keys(GO0).forEach(function(k){GO[k]=(A.tbl&&A.tbl.GO&&A.tbl.GO[k])?A.tbl.GO[k].slice():GO0[k].slice()})}
function tbuild(){var h='',NM=['Admin','Admin Mall','Ongkir biasa','Ongkir khusus'];'ABCDEFGHI'.split('').forEach(function(c){h+='<div class="tb"><b>Kategori '+c+'</b>'+[['AD',0],['AD',1],['GO',0],['GO',1]].map(function(x,ix){if(x[0]=='GO'&&!GO0[c])return'';return'<label><span>'+NM[ix]+' (%)</span><input inputmode="decimal" aria-label="Kategori '+c+' '+NM[ix]+'" data-t="'+x[0]+'|'+x[1]+'|'+c+'"></label>'}).join('')+'</div>'});
 KDOM.setHTML($('tbl'), h);
 $('tbl').addEventListener('input',function(e){var t=e.target,p=(t.dataset.t||'').split('|');if(p.length<3)return;var v=(t.value.trim()===''?NaN:Number(t.value.replace(',','.')));if(isNaN(v)||v<0)return;if(v>100){v=100;t.value='100'}
  A.tbl=A.tbl||{AD:{},GO:{}};var src=p[0]=='AD'?AD:GO,arr=(A.tbl[p[0]][p[2]]||src[p[2]]).slice();arr[+p[1]]=v;A.tbl[p[0]][p[2]]=arr;upd(true)});
 $('tr').onclick=function(){A.tbl=null;fill();upd(true);toast('Tabel tarif dikembalikan')}}
function fillT(){document.querySelectorAll('[data-t]').forEach(function(t){var p=t.dataset.t.split('|'),a=(p[0]=='AD'?AD:GO)[p[2]];t.value=a?fmt(a[+p[1]]):''})}
function tchk(){var w=$('tw');if(A.ver&&!A.ver.ok&&!A.ver.ig){w.hidden=false;w.textContent='Cek pesanan nyata ('+A.ver.d+') menemukan selisih pada: '+A.ver.bad.join(', ')+'. Perbaiki di tab Tarif, lalu cek ulang.';return}var sd=verStale();if(sd){w.hidden=false;w.textContent='Tarif berubah sejak cek pesanan nyata ('+A.ver.d+'): '+sd.slice(0,4).join(', ')+(sd.length>4?', dan '+(sd.length-4)+' lainnya':'')+'. Cek ulang dengan pesanan nyata.';return}var d=A.tchk?Math.floor((new Date(today()+'T00:00')-new Date(A.tchk+'T00:00'))/864e5):null;
 if(d===null){w.hidden=false;w.textContent='Tanggal pengecekan tarif belum diisi. Cocokkan tabel tarif dengan Seller Centre di tab Tarif, lalu isi tanggalnya.'}
 else if(d>(A.tcd>0?A.tcd:30)){w.hidden=false;w.textContent='Tarif terakhir dicek '+d+' hari lalu. Cocokkan lagi dengan Seller Centre.'}else w.hidden=true}
var SGL={tp:'Tipe toko',fb:'Biaya proses pesanan',fl:'Nominal biaya proses',pb:'Biaya pembayaran (%)',pbc:'Batas biaya pembayaran',ad:'Admin manual (%)',ac:'Kategori administrasi',gc:'Kategori Gratis Ongkir XTRA',sz:'Ukuran Gratis Ongkir XTRA',gf:'Tarif Gratis Ongkir XTRA toko baru',gad:'Potongan tarif karena iklan',gm:'Gratis Ongkir XTRA manual (%)',px:'Promo XTRA (%)',vx:'Video XTRA (%)',lv:'Live XTRA (%)',pm:'Premi (%)',cg:'Batas Gratis Ongkir XTRA biasa',cgk:'Batas Gratis Ongkir XTRA khusus',cp:'Batas Promo XTRA',cvx:'Batas Video XTRA',clv:'Batas Live XTRA',tbl:'Tabel tarif'};
function feeSig(){var s={};Object.keys(SGL).forEach(function(k){s[k]=JSON.stringify(k=='gf'?gfac():(A[k]===undefined?null:A[k]))});return s}
function prodSig(R){return JSON.stringify([R.ad,R.gx,R.px,R.vx,R.lv,R.pm,R.cg,R.cp,R.cvx,R.clv,R.cpb])}
function verStale(){var v=A.ver;if(!v||!v.ok)return null;if(!v.sg)return['pengaturan tarif (cek lama belum mencatat pengaturan)'];
 var c=feeSig(),d=Object.keys(SGL).filter(function(k){return c[k]!==v.sg[k]}).map(function(k){return SGL[k]});if(d.length)return d;
 var ml=v.ml||(v.ps?[{pn:v.pn,ps:v.ps}]:[]);for(var mi=0;mi<ml.length;mi++){var r=rows.filter(function(x){return(x.n||'')===ml[mi].pn})[0],o=r&&calc(r);if(o&&!o.err&&prodSig(o.R)!==ml[mi].ps)return['tarif khusus produk '+(ml[mi].pn||'(tanpa nama)')]}
 return null}
var ADN={A:'Pakaian Muslim, Rumah Tangga, Mainan',B:'Peralatan RT, Buku, Olahraga',C:'Aksesoris Fashion, Ibu & Bayi, Makanan, Kecantikan',D:'Kesehatan, Komputer & Aksesoris',E:'Fotografi, Audio, Elektronik Besar',F:'Makanan Segar, Bahan Pokok',G:'Handphone & Tablet',H:'Logam Mulia, Emas, Perak',I:'Sepeda Motor, Mobil'};
function refreshLabels(root){root=root||document;
 var ix=A.tp=='ml'?1:0;
 root.querySelectorAll('#ac option,select[data-o="ac"] option').forEach(function(o){var t=AD[o.value];if(!t)return;var p=o.parentNode.id=='ac';o.textContent=p?o.value+' ('+fmt(t[ix])+'%): '+ADN[o.value]:'Kategori '+o.value+' ('+fmt(t[ix])+'%)'});
 root.querySelectorAll('select[data-o="g2"] option').forEach(function(o){var t=GO2[o.value];if(!t)return;o.textContent=o.value+' · '+fmt(t[0])+'%'});
 root.querySelectorAll('#gc option,select[data-o="gc"] option').forEach(function(o){var t=GO[o.value];if(!t)return;var p=o.parentNode.id=='gc';o.textContent=p?'Kategori '+o.value+': '+fmt(t[0])+'% biasa / '+fmt(t[1])+'% khusus':o.value+' · '+fmt(t[0])+'%'})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
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
 e.querySelector('.x').onclick=function(){ask('Hapus '+(r.n?'produk "'+String(r.n).slice(0,40)+'"':'produk ini')+'? Data produk ini tidak bisa dikembalikan.','Ya, hapus',function(){var ix=rows.indexOf(r);if(ix<0)return;rows.splice(ix,1);e.remove();if(!rows.length)add();upd(true,r)})};
 e.addEventListener('toggle',function(ev){if(ev.target.classList.contains('rd'))r.ro=ev.target.open;if(ev.target.classList.contains('rd2'))r.ro2=ev.target.open},true);r.ac=e.querySelector('.ac');r.bg=e.querySelector('.bdg');var pd=e.querySelector('.pad');if(pd&&(r.ha>0||r.hd>0))pd.open=true;r.el=e.querySelector('.res');r.cs=e.querySelector('.cs');r.sk=e.querySelector('.sk');r.mhl=e.querySelector('.mhl');r.lkx=e.querySelector('.lkx');r.cxr=e.querySelector('.cxr');r.box=e;
 refreshLabels(e)}
/*v9.8: hidrasi malas. card() hanya membuat cangkang ringan; isi formulir (cardBody) dibangun saat kartu mendekati layar, jadi ribuan produk tidak membangun ribuan formulir sekaligus.*/
var ROW_MAX=1000,HY_ALL=40,LZM=new Map(),LZ=null;
try{if(typeof IntersectionObserver=='function')LZ=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;var r=LZM.get(en.target);if(r)hyd(r)})},{rootMargin:'900px 0px'})}catch(x){LZ=null}
function card(r){var e=document.createElement('div');e.className='pc lz';e.classList.toggle('cl',!!r.c);r.box=e;r.hy=false;$('list').appendChild(e);
 if(!LZ||rows.length<=HY_ALL)hyd(r);else{LZM.set(e,r);LZ.observe(e)}}
function hyd(r){if(r.hy||!r.box)return;r.hy=true;var e=r.box;if(LZ){LZ.unobserve(e);LZM.delete(e)}cardBody(r,e);e.classList.remove('lz');updRow(r)}
function add(d){var r=Object.assign({n:'',m:0,d:0,p:0,t:0,o:{}},d||{});r.o=r.o||{};if(!r.id)r.id=uid();if(!(r.mb>0)&&r.m>0)r.mb=r.m;rows.push(r);card(r)}
function dup(r){
 if(rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}
 var nr=Object.assign({},strip(r),{id:uid(),s:null,sd:'',mh:[],ack:false,live:false,ha:0,hd:0,n:r.n?r.n+' (salinan)':'',o:Object.assign({},r.o||{}),c:false});
 rows.splice(rows.indexOf(r)+1,0,nr);card(nr);hyd(nr);$('list').insertBefore(nr.box,r.box.nextSibling);
 nr.box.scrollIntoView({block:'center'});upd(true);toast('Produk diduplikat')}
function pc1(x){return fmt(Math.round(x*10)/10)}
function skHi(){var a=Math.max(0,Math.floor(+A.sh)||0),b=Math.max(0,Math.floor(+A.sl)||0);return Math.min(a,b)}
function stk(r){if(!(r.m>0||r.n))return{lv:'',h:''};
 var d=r.sd?Math.floor((new Date(today()+'T00:00')-new Date(r.sd+'T00:00'))/864e5):null,b=' <button class="lk ck" type="button">Sudah dicek hari ini</button>',
 w=function(l,t,k){return{lv:l,h:'<div class="wn '+l+'">&#9888; '+t+(k?b:'')+'</div>'}};
 if(r.s==null)return w('y','Stok belum diisi. Cek jumlah stok asli di Seller Centre.',0);
 if(r.s<=0)return w('r','Stok habis. Nonaktifkan produk atau isi ulang stok di Shopee.',1);
 if(r.s<=skHi())return w('r','Stok hampir habis ('+r.s+' pcs). Segera isi ulang di supplier dan Shopee.',1); if(r.s<=A.sl)return w('y','Stok menipis ('+r.s+' pcs). Cek stok supplier dan Shopee.',1);
 if(A.sdy>0&&d!==null&&d>=A.sdy)return w('y','Stok terakhir dicek '+d+' hari lalu. Cek ulang jumlah asli di Shopee.',1);
 return{lv:'',h:'<div class="stk">Stok '+r.s.toLocaleString('id-ID')+' pcs, '+(d===null?'tanggal cek belum tercatat':d===0?'dicek hari ini':'dicek '+d+' hari lalu')+b+'</div>'}}
function warns(o,rev){
 var w=[],sh=[],lv='',m=o.P>0?o.u/o.P*100:0,pot=o.P>0?(o.sh+o.pm+o.tax)/o.P*100:0;
 if(o.u<0){lv='r';w.push(rev?'Rugi pada harga ini.':'Rugi. Naikkan harga atau target untung.');sh.push('Rugi')}
 else if(o.u==0){lv='r';w.push(rev?'Impas, tidak ada untung sama sekali.':'Untung nol. Tidak ada cadangan untuk risiko.');sh.push('Untung nol')}
 else if(o.u<A.wu||m<A.wm){lv='y';w.push('Untung tipis ('+rp(o.u)+', margin '+pc1(m)+'%). Batas aman: '+rp(A.wu)+' dan '+pc1(A.wm)+'%.');sh.push('Untung tipis')}
 if(pot>A.wp){lv=lv||'y';w.push('Total potongan tinggi ('+pc1(pot)+'% dari harga jual). Periksa tarif yang diisi.');sh.push('Potongan tinggi')}
 return{w:w,sh:sh,lv:lv,m:m,pot:pot}}
function WN(x){return x.w.map(function(t){return '<div class="wn '+(x.lv=='r'&&x.w[0]==t?'r':'y')+'">&#9888; '+t+'</div>'}).join('')}
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function dtx(d){var p=String(d).split('-');return(+p[2])+' '+['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][p[1]-1]}
function mchg(r,o){var h=r.mh&&r.mh.length&&r.mh[r.mh.length-1];if(!h||r.ack)return null;
 var old=calc(Object.assign({},r,{m:h.a}));if(!old||old.err)return null;
 var q=fwd(old.M,r,o.R),x=warns(q,true),up=h.b>h.a,lv='',t;
 if(up){lv=q.u<0?'r':(q.u<r.t||x.m<A.wm||q.u<A.wu)?'y':'';
  t='Modal naik '+rp(h.b-h.a)+' ('+dtx(h.d)+'). Harga listing perlu naik dari '+rp(old.M)+' ke '+rp(o.M)+'. Jika harga lama dipertahankan, untung jadi '+rp(q.u)+' (margin '+pc1(x.m)+'%).'}
 else t='Modal turun '+rp(h.a-h.b)+' ('+dtx(h.d)+'). Harga listing bisa turun dari '+rp(old.M)+' ke '+rp(o.M)+'.';
 return{lv:lv,h:'<div class="wn '+(lv||'i')+'">'+(lv?'&#9888; ':'')+t+' <button class="lk ak" type="button">Sudah update harga di Shopee</button></div>'}}
function revHtml(r,o,im){
 var q=fwdL(r.cx,r,o.R),x=warns(q,true),d=im===null?null:r.cx-im,tm=tmod(r);
 return '<div class="rw">Harga jual yang dicek<b>'+rp(q.L)+'</b></div>'+
 (q.v?'<div class="rw">'+esc(q.vs||'Voucher toko')+'<b>- '+rp(q.v)+'</b></div><div class="rw">Harga setelah voucher<b>'+rp(q.P)+'</b></div>':'')+
 '<div class="rw">Total Biaya Shopee<b>'+rp(q.sh)+'</b></div><div class="rw">Premi + PPh 22<b>'+rp(q.pm+q.tax)+'</b></div>'+(q.ads?'<div class="rw">Biaya iklan<b>'+rp(q.ads)+'</b></div>':'')+(q.rt?'<div class="rw">Cadangan retur<b>'+rp(q.rt)+'</b></div>':'')+(A.og?'<div class="rw">Ongkir ditanggung<b>'+rp(A.og)+'</b></div>':'')+
 '<div class="rw">Saldo masuk toko<b>'+rp(q.s)+'</b></div><div class="rw">Modal + Management Partner + packing<b>'+rp(tm)+'</b></div>'+
 '<div class="rw">'+(q.u<0?'Rugi bersih':'Untung bersih')+'<b class="'+(q.u<0?'bad':q.u<A.wu||x.m<A.wm?'':'ok')+'">'+(q.u<0?'- ':'')+rp(Math.abs(q.u))+'</b></div>'+
 '<div class="rw">Margin (dari harga jual)<b>'+pc1(x.m)+'%</b></div>'+
 (d===null?'':'<div class="rw">Selisih dari harga impas<b>'+(d>=0?rp(d)+' di atas':rp(-d)+' di bawah')+'</b></div>')+WN(x)}
function CR(l,p,v,raw){return p>0||l=='Tarif administrasi'?'<div class="rw">'+l+' ('+fmt(p)+'%)<b>'+rp(v)+(raw>v?' (kena batas)':'')+'</b></div>':''}
function colL(){var b=$('col');if(b)b.textContent=(rows.length&&rows.every(function(r){return r.c}))?'Buka semua':'Ciutkan semua'}
function dep(){var c={fl:A.fb=='yes',ad:A.ac=='man',gm:A.gc=='man',vv:A.vm!='none',vc:A.vm=='pct'};for(var k in c){var x=$(k);if(x)x.closest('.fl').hidden=!c[k]}colL()}
function sp(o,r){var c=tmod(r),f=o.sh+o.pm+o.tax+o.ads+o.rt+A.og,u=Math.max(o.u,0),t=c+f+u;if(t<=0)return'';var w=function(v){return(v/t*100).toFixed(1)},q=function(v){return Math.round(v/t*100)};return'<div class="pg"><div class="pgh">Ke mana harga jual pergi</div><div class="bar"><i class="c1" style="width:'+w(c)+'%"></i><i class="c2" style="width:'+w(f)+'%"></i><i class="c3" style="width:'+w(u)+'%"></i></div><div class="lg"><span><s class="c1"></s>Modal '+q(c)+'%</span><span><s class="c2"></s>Potongan '+q(f)+'%</span><span><s class="c3"></s>Untung '+q(u)+'%</span></div></div>'}
function gwarn(){var w=$('gw');if(A.gc!='none'&&A.gf<100&&!A.gfd){w.hidden=false;KDOM.setHTML(w, '&#9888; Gratis Ongkir XTRA dihitung '+fmt(A.gf)+'% dari tarif tabel tanpa tanggal berakhir. Jika Shopee sebenarnya menagih tarif penuh, harga jadi terlalu murah dan untung nyata di bawah target. <button class="lk" type="button" id="gwb">Pakai tarif penuh (100%)</button>')}else w.hidden=true}
$('gw').addEventListener('click',function(e){if(!e.target.closest('#gwb'))return;A.gf=100;fill();upd(true);toast('Tarif Gratis Ongkir XTRA: penuh (100%)')});
function errH(e){var m={'Voucher 100% tidak valid':['Voucher toko 100% membuat harga jadi nol. Turunkan nilainya.','vc','Buka Voucher'],'Diskon coret tidak valid':['Diskon coret 100% atau lebih tidak masuk akal. Turunkan nilainya.','pt','Buka Promosi'],'Total tarif 100% atau lebih':['Total tarif (admin, iklan, premi, dan lainnya) mencapai 100%. Periksa persen iklan dan tarif.','set','Buka Pengaturan'],'Target untung di luar batas pencarian harga':['Target untung belum tercapai dalam batas pencarian harga. Periksa target untung, modal, biaya, dan tarif; turunkan target atau periksa input biaya.','','']}[e];if(!m)return'<div class="empty">'+esc(e)+'</div>';return'<div class="wn r">&#9888; '+m[0]+(m[2]?' <button class="lk" type="button" data-go="'+m[1]+'">'+m[2]+'</button>':'')+'</div>'}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-go]');if(!b)return;var g=b.dataset.go;if(g=='set')tab(2);else{PSEL=g;tab(3)}});
function updRow(r){var H=!!r.hy,g=r._ag={n:0,sm:0,su:0,nw:0,ns:0};
 if(H){
  var lbn=r.box.querySelector('[data-lv]');if(lbn){lbn.classList.toggle('on',!!r.live);lbn.setAttribute('aria-pressed',!!r.live);lbn.textContent=r.live?'✓ Live di toko (ketuk untuk lepas)':'Tandai sudah listing / live di Shopee'}
  r.box.querySelectorAll('input[data-o]').forEach(function(x){var k=x.dataset.o;x.placeholder=k=='gx'?fmt(gfac()>0?Math.round(goRate({o:Object.assign({},r.o,{gx:null})})*10000/gfac())/100:goRate({o:Object.assign({},r.o,{gx:null})})):k=='ad'?fmt(adRate({o:Object.assign({},r.o,{ad:null})})):k=='dv'&&A.pa=='no'?'Nonaktif':fmt(A[k])});
  var th=r.box.querySelector('.tph');if(th){try{var gmn=r.o&&r.o.gx!==null&&r.o.gx!==undefined,amn=r.o&&r.o.ad!==null&&r.o.ad!==undefined;th.textContent='Dipakai sekarang: admin '+fmt(adRate(r))+'%'+(amn?' (manual)':'')+', Gratis Ongkir XTRA '+fmt(goRate(r))+'%'+(gmn?' (manual)':'')+(gfac()<100?' (sudah dikali keringanan '+fmt(gfac())+'%)':'')+'.'}catch(e){}}
  var dl=r.box.querySelector('input[data-o="dv"]');if(dl&&dl.previousElementSibling)dl.previousElementSibling.textContent=(A.dm=='nom'?'Diskon coret (Rp)':'Diskon coret (%)')+(A.pa=='no'?' - Promo Toko nonaktif':'');
  KDOM.setHTML(r.lkx, /^https?:\/\//i.test(r.lnk||'')?'<a href="'+esc(r.lnk)+'" target="_blank" rel="noopener noreferrer">Buka link supplier</a>':'');
  KDOM.setHTML(r.mhl, (r.mh&&r.mh.length)?'<div class="stk">Riwayat modal</div>'+r.mh.slice().reverse().map(function(h){return'<div class="stk">'+dtx(h.d)+': '+rp(h.a)+' ke '+rp(h.b)+' ('+(h.b>=h.a?'+':'')+pc1((h.b-h.a)/h.a*100)+'%)</div>'}).join(''):'');
 }
  var kk=stk(r);r.sl=kk.lv;if(kk.lv)g.ns++;H&&KDOM.setHTML(r.sk, kk.h);r.u=undefined;r.lv='';var o=calc(r);H&&KDOM.setHTML(r.cxr, '');if(!o||o.err){H&&KDOM.setHTML(r.ac, acH(r,null));H&&KDOM.setHTML(r.bg, bdH(r,null))}
  if(!o){H&&KDOM.setHTML(r.el, '<div class="empty">Isi modal supplier, hasil muncul otomatis di sini.</div>');H&&KDOM.setHTML(r.cs, '<div class="em">Isi modal supplier, hasil muncul otomatis di sini.</div>');if(r.cx>0)H&&KDOM.setHTML(r.cxr, '<div class="empty">Isi modal supplier dulu.</div>');return}
  if(o.err){var eh=errH(o.err);H&&KDOM.setHTML(r.el, eh);H&&KDOM.setHTML(r.cs, '<div class="em">'+eh+'</div>');if(r.cx>0)H&&KDOM.setHTML(r.cxr, eh);return}
  g.n++;g.sm+=o.M;g.su+=o.u;H&&KDOM.setHTML(r.ac, acH(r,o));H&&KDOM.setHTML(r.bg, bdH(r,o));
  var okc=o.u>=r.t?'ok':'bad';
  var wx=warns(o,false),im=impas(r,o.R);if(wx.lv)g.nw++;r.u=o.u;r.mg=wx.m;r.M=o.M;r.lv=wx.lv;var mc=mchg(r,o),vsn=vscn(r,o);H&&KDOM.setHTML(r.sk, kk.h+(mc?mc.h:'')+vsn.h);if(mc&&mc.lv&&!r.lv){r.lv=mc.lv;g.nw++}if(vsn.lv&&!r.lv){r.lv=vsn.lv;g.nw++}
  H&&KDOM.setHTML(r.cs, '<div>Harga listing awal<b>'+rp(o.M)+'</b></div><div>Untung bersih<b class="'+okc+'">'+rp(o.u)+' ('+pc1(wx.m)+'%)</b></div>'+(wx.lv?'<div class="em wn '+wx.lv+'">&#9888; '+wx.sh.join(', ')+'</div>':''));
  H&&KDOM.setHTML(r.el, '<div class="big"><div><span>Harga listing awal</span><b>'+rp(o.M)+'</b></div><div><span>Harga diskon coret</span><b>'+rp(o.L)+'</b></div></div><div class="pf '+okc+'"><span>Untung bersih<small>Margin '+pc1(wx.m)+'%</small></span><b>'+rp(o.u)+'</b></div>'+sp(o,r)+vnote(o,r)+WN(wx)+'<details class="det rd"'+(r.ro?' open':'')+'><summary>Lihat rincian biaya</summary>'+
  (o.v?'<div class="rw">'+esc(o.vs||'Voucher toko')+'<b>- '+rp(o.v)+'</b></div><div class="rw">Harga setelah voucher<b>'+rp(o.P)+'</b></div>':'')+
  CR('Tarif administrasi',o.R.ad,o.b.ad,o.b.ad)+CR('Tarif Gratis Ongkir XTRA',o.R.gx,o.b.gx,Math.round(o.R.gx/100*o.P))+CR('Tarif Promo XTRA',o.R.px,o.b.px,Math.round(o.R.px/100*o.P))+CR('Tarif Video XTRA',o.R.vx,o.b.vx,Math.round(o.R.vx/100*o.P))+CR('Tarif Live XTRA',o.R.lv,o.b.lv,Math.round(o.R.lv/100*o.P))+CR('Biaya pembayaran',A.pb,o.b.pay,pr(A.pb,o.P))+(o.b.fx?'<div class="rw">Biaya layanan pesanan<b>'+rp(o.b.fx)+'</b></div>':'')+'<div class="rw">Total Biaya Shopee<b>'+rp(o.sh)+'</b></div><div class="rw">Premi<b>'+rp(o.pm)+'</b></div><div class="rw">PPh 22<b>'+rp(o.tax)+'</b></div>'+(o.ads?'<div class="rw">Biaya iklan ('+fmt(o.R.ads)+'%)<b>'+rp(o.ads)+'</b></div>':'')+(o.rt?'<div class="rw">Cadangan retur ('+fmt(o.R.rt)+'%)<b>'+rp(o.rt)+'</b></div>':'')+(A.og?'<div class="rw">Ongkir ditanggung<b>'+rp(A.og)+'</b></div>':'')+
  '<div class="rw">Saldo masuk toko<b>'+rp(o.s)+'</b></div><div class="rw">Modal + Management Partner + packing<b>'+rp(tmod(r))+'</b></div><div class="rw">Untung bersih<b class="'+okc+'">'+rp(o.u)+'</b></div><div class="rw">Margin (dari harga jual)<b>'+pc1(wx.m)+'%</b></div>'+(im===null?'':'<div class="rw">Harga impas (harga diskon coret)<b>'+rp(im)+'</b></div>')+'</details>');
  if(r.cx>0)H&&KDOM.setHTML(r.cxr, revHtml(r,o,im))}
function upd(save,only){CalcCache.invalidate();var light=CalcCache.prewarmStale(only);
 tblSync();refreshLabels();tchk();gwarn();vwarn();dep();
 $('gci').textContent=A.gc=='none'?'Tidak ikut Gratis Ongkir XTRA':'Tarif berlaku sekarang: '+fmt(goRate({o:{}}))+'% (ukuran '+(A.sz=='k'?'khusus':'biasa')+')';
 $('aci').textContent='Tarif berlaku sekarang: '+fmt(adRate({o:{}}))+'%';
 /*v9.8: upd(save,only) menghitung ulang HANYA produk 'only' (edit di kartu); produk lain memakai hasil tersimpan r._ag.*/
 if(light)rows.forEach(function(r){if(r.hy)updRow(r)});else if(only)updRow(only);else rows.forEach(updRow);
 var g={n:0,sm:0,su:0,nw:0,ns:0};rows.forEach(function(r){var q=r._ag;if(q){g.n+=q.n;g.sm+=q.sm;g.su+=q.su;g.nw+=q.nw;g.ns+=q.ns}});
 var n=g.n,sm=g.sm,su=g.su,nw=g.nw,ns=g.ns;
 $('s1').textContent=n;$('s2').textContent=n?rp(sm/n):'-';$('s3').textContent=n?rp(su):'-';$('s3').className=su<0?'neg':'';$('s4').textContent=nw;$('s5').textContent=ns;var tl=rows.filter(function(r){return r.live}).length;$('tp1').textContent=rows.length;$('tp2').textContent=tl;$('tp3').textContent=rows.length-tl;if(!light){flt();shop()}
 PSIG=psig();
 if(save)persist()}
function flt(){var s=($('q').value||'').toLowerCase().trim(),f=$('ff').value;$('qb').hidden=rows.length<6&&!s&&f=='all'&&$('so').value=='0';
 rows.forEach(function(r){var h=!!s&&((r.n||'')+' '+(r.sup||'')+' '+(r.sku||'')).toLowerCase().indexOf(s)<0;if(f=='chk')h=h||!r.lv;if(f=='bad')h=h||r.lv!='r';if(f=='stk')h=h||!r.sl;if(f=='new')h=h||!!(r.ha>0||r.hd>0);if(f=='live')h=h||!r.live;if(f=='nlive')h=h||!!r.live;if(f=='gap')h=h||!(r.ay>0);if(f=='ok')h=h||r.u===undefined||!!r.lv;if(r.box.contains(document.activeElement))h=false;r.box.hidden=h});document.querySelectorAll('#tt3 [data-ft]').forEach(function(d){d.classList.toggle('on',d.dataset.ft==f&&f!='all')})}
function srt(){var v=$('so').value,a=rows.slice(),K={us:function(r){return r.u},ub:function(r){return -r.u},mg:function(r){return r.mg},hl:function(r){return -r.M}};
 if(v!='0')a.sort(function(x,y){if(v=='sk')return(x.s==null?-1:x.s)-(y.s==null?-1:y.s);if(v=='nm')return(x.n||'~').localeCompare(y.n||'~','id');var hx=x.u===undefined,hy=y.u===undefined;if(hx||hy)return hx-hy;return K[v](x)-K[v](y)});
 var L=$('list');a.forEach(function(r,i){if(L.children[i]!==r.box)L.insertBefore(r.box,L.children[i]||null)})}
$('ff').onchange=flt;
document.querySelectorAll('#tt3 [data-ft]').forEach(function(d){function go(){var v=d.dataset.ft;$('ff').value=v;$('q').value='';flt();var n=rows.filter(function(r){return !r.box.hidden}).length;toast(v=='all'?'Menampilkan semua produk ('+n+')':'Menampilkan '+n+' produk '+(v=='live'?'sudah live':'belum live'));var b=$('qb');if(b&&b.scrollIntoView)b.scrollIntoView({block:'start'})}d.onclick=go;d.onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();go()}}});
$('so').onchange=function(){srt();flt();toast('Urutan diterapkan')};
$('q').addEventListener('input',flt);
var dfn=null,dprev=null;
function inertBg(on){[document.querySelector('main'),document.querySelector('nav'),document.querySelector('header'),$('fab')].forEach(function(x){if(x)x.inert=on})}
function ask(m,ok,fn){dprev=document.activeElement;$('dlgm').textContent=m;$('dy').textContent=ok;dfn=fn;$('dlg').hidden=false;inertBg(true);$('dn').focus()}
function dclose(){$('dlg').hidden=true;dfn=null;inertBg(false);var p=dprev;dprev=null;if(p&&p.focus)try{p.focus()}catch(e){}}
$('dn').onclick=dclose;$('dy').onclick=function(){var f=dfn;dclose();if(f)f()};
$('dlg').addEventListener('keydown',function(e){if(e.key=='Escape')dclose();else if(e.key=='Tab'){var f=[$('dn'),$('dy')],i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+2)%2].focus()}});$('dlg').addEventListener('click',function(e){if(e.target===this)dclose()});
var toastT=null;function toast(m){var t=$('tt');t.textContent=m;t.className='toast on';clearTimeout(toastT);toastT=setTimeout(function(){t.className='toast'},1600)}

function setStock(r,v){r.s=v;if(v!=null)r.sd=today();else r.sd='';var i=r.box.querySelector('input[data-f="s"]');if(i)i.value=v==null?'':v.toLocaleString('id-ID');upd(true)}
var ETU={},ETT={};
function etUn(r){return !!(r&&ETU[r.id]>Date.now())}
function etSet(r,on){clearTimeout(ETT[r.id]);if(on){ETU[r.id]=Date.now()+10000;ETT[r.id]=setTimeout(function(){delete ETU[r.id];var a=document.activeElement;if(a&&$('shl').contains(a)){var ia=a.shadowRoot&&a.shadowRoot.activeElement,t=ia||a;if(t.blur)t.blur()}shop()},10100)}else delete ETU[r.id]}
function etAll(){for(var k in ETT)clearTimeout(ETT[k]);ETU={};ETT={}}
/*v9.8: Etalase = Web Component <kalsara-product-card> (Shadow DOM + Signals). shop() hanya menyusun MODEL data per produk; tampilan dibuat komponen tanpa innerHTML.*/
function shopChips(r,o){var out=[];PRM.forEach(function(q){if(!CFG[q.t])return;var tk=q.t=='vc'&&(q.jt||'toko')=='toko';var iz=(q.t=='pt'||q.t=='kh')&&q.it?q.it.filter(function(y){return y.p===r.id})[0]:null,ik=(q.t=='kh'||q.t=='hm')&&(q.mp||[]).indexOf(r.id)>=0;if(!tk&&!iz&&!ik&&[q.p,q.p2,q.p3].indexOf(r.id)<0)return;var z=pst(q);if(z.k!='a'&&z.k!='u')return;
 var t=CFG[q.t].n+(q.t=='vc'?' '+{toko:'Toko',produk:'Produk',live:'Live',video:'Video'}[q.jt||'toko']:'')+((CFG[q.t].c=='vi'||CFG[q.t].c=='vc')&&q.a>0?' '+(q.u=='pct'||q.u=='cb'?fmt(q.a)+'%'+(q.u=='cb'?' cashback':''):rp(q.a)):'')+(iz&&o&&!o.err&&ptp(q,iz,o.M)>0?' '+rp(ptp(q,iz,o.M)):CFG[q.t].c=='pr'&&q.a>0?' '+rp(q.a):CFG[q.t].c=='hm'&&q.b>0?' min '+rp(q.b):CFG[q.t].c=='pd'&&q.b>0?' beli '+(q.a||1)+' '+((q.tp||'pct')=='pct'?'-'+fmt(q.b)+'%':(q.tp=='nom'?'-':'')+rp(q.b)):'')+' \u00b7 '+z.t+(q.t=='vc'&&o&&!o.err&&o.vq===q?' \u00b7 dipakai di harga':'');
 out.push({kind:z.k,text:t})});return out}
function errModel(e){var m={'Voucher 100% tidak valid':['Voucher toko 100% membuat harga jadi nol. Turunkan nilainya.','vc','Buka Voucher'],'Diskon coret tidak valid':['Diskon coret 100% atau lebih tidak masuk akal. Turunkan nilainya.','pt','Buka Promosi'],'Total tarif 100% atau lebih':['Total tarif (admin, iklan, premi, dan lainnya) mencapai 100%. Periksa persen iklan dan tarif.','set','Buka Pengaturan'],'Target untung di luar batas pencarian harga':['Target untung belum tercapai dalam batas pencarian harga. Periksa target untung, modal, biaya, dan tarif; turunkan target atau periksa input biaya.','','']}[e];if(!m)return{kind:'error',plain:true,message:String(e)};return{kind:'error',message:m[0],goTarget:m[1],goLabel:m[2]}}
function actNoteModel(r,o,pr){var al=(r.ha>0||r.hd>0)?actL(r,o.R):0;
 if(!(al>0))return pr?null:[{text:'Belum ada harga aktual. Penjualan dicatat di harga ideal '+rp(o.L)+'.'}];
 if(pr&&al>=pr)return null;
 var aq=fwdL(al,r,o.R).u;return [{text:'Penjualan dicatat di harga aktual '+rp(al)+(al==o.L?' (sama dengan ideal).':' (ideal '+rp(o.L)+').')+' '},{text:(aq<0?'Rugi ':'Untung ')+rp(Math.abs(aq)),tone:aq<0?'bad':'ok',bold:true}]}
function shopPrice(r,o){
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
function shop(){var L=rows.filter(function(r){return r.live}),lo=function(r){return r.s!=null&&r.s<=A.sl},att=L.filter(lo).sort(function(a,b){return a.s-b.s});if(att.length)L=att.concat(L.filter(function(r){return !lo(r)}));var rest=L.length-att.length;
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
$('shl').addEventListener('kls-lock',function(e){var r0=rows[e.detail.index];if(!r0)return;var on=!etUn(r0);etSet(r0,on);shop();if(on)toast('Stok terbuka 10 detik')});
$('shl').addEventListener('kls-step',function(e){var r=rows[e.detail.index],d=e.detail.delta;if(!r)return;if(!etUn(r)){toast('Terkunci. Ketuk ikon gembok dulu');return}etSet(r,true);if(r.s==null&&d<0){toast('Isi stok awal dulu');return}if(d<0&&r.s>0)sold(r);setStock(r,Math.min(Math.max(0,(r.s||0)+d),999999999));try{if(navigator.vibrate)navigator.vibrate(8)}catch(x){}});
$('shl').addEventListener('kls-stock',function(e){var r=rows[e.detail.index];if(!r)return;if(!etUn(r)){shop();return}etSet(r,true);e.detail.blur();setStock(r,e.detail.value.trim()===''?null:num(e.detail.value))});
$('shl').addEventListener('kls-voucher',function(e){var r=rows[e.detail.index];if(r)VUSE[r.id]=e.detail.checked});
$('shl').addEventListener('kls-go',function(e){var g=e.detail.target;if(g=='set')tab(2);else{PSEL=g;tab(3)}});
$('shl').addEventListener('kls-open',function(e){goProd(e.detail.index)});
function clearMark(){rows.forEach(function(r){if(r.box)r.box.classList.remove('mk')})}
function goProd(i){var r=rows[i];if(!r)return;hyd(r);clearMark();$('q').value='';$('ff').value='all';document.body.classList.add('swp');tab(1);r.c=false;r.box.classList.remove('cl');var g=r.box.querySelector('.tg');if(g)g.setAttribute('aria-expanded','true');flt();colL();persist();
 var done=function(){document.body.classList.remove('swp')};setTimeout(done,500);
 requestAnimationFrame(function(){requestAnimationFrame(function(){r.box.scrollIntoView({block:'start',behavior:'auto'});r.box.setAttribute('tabindex','-1');try{r.box.focus({preventScroll:true})}catch(e){}r.box.classList.add('mk');done()})})}
function tgl(){var d=new Date();$('tgl2').textContent=$('tgl').textContent=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()]+', '+d.getDate()+' '+['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()]+' '+d.getFullYear()}
document.addEventListener('visibilitychange',function(){if(!document.hidden){tgl();upd(false)}});
$('fab').onclick=function(){if(rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}tab(1);$('add').onclick()};

