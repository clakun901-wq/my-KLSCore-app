var VF=[['fx','Biaya proses pesanan','Biaya proses pesanan'],['ad','Biaya administrasi','Kategori administrasi atau Tabel tarif'],['gx','Gratis Ongkir XTRA','Kategori Gratis Ongkir XTRA, tarif atau batas Rp'],['px','Promo XTRA','Promo XTRA (%) atau batas Rp'],['vl','Video/Live XTRA','Video XTRA atau Live XTRA'],['pay','Biaya pembayaran/layanan lain','Tipe toko dan biaya pembayaran'],['pm','Premi','Premi (%)'],['tx','PPh 22 (Pajak)','PPh 22 (%), atau 0 jika bebas']];
KDOM.setHTML($('vfi'), [['n','Jumlah barang dalam pesanan','Angka 1 atau lebih. Mengubahnya mengisi ulang harga produk dan voucher di bawah'],['L','Harga produk','Total semua barang, setelah diskon, sebelum voucher. Rp'],['v','Voucher dari penjual','Rp, isi 0 jika tidak ada']].concat(VF.map(function(x){return[x[0],x[1],'Rp']})).concat([['t','Total penghasilan','Dana yang diterima di Rincian Penghasilan. Rp']]).map(function(x){return'<div class="fl"><label for="vf_'+x[0]+'">'+x[1]+'<small>'+x[2]+'</small></label><input id="vf_'+x[0]+'" inputmode="numeric"></div>'}).join(''));
function vfOpt(){var h='<option value="">Pilih produk</option>';rows.forEach(function(r,i){if(r.m>0)h+='<option value="'+i+'">'+esc(r.n||'(tanpa nama)')+'</option>'});return h}
function vfFill(){var h=vfOpt();KDOM.setHTML($('vfp'), h);document.querySelectorAll('#vfxl select').forEach(function(e){var c=e.value;KDOM.setHTML(e, h);if(c&&e.querySelector('option[value="'+c+'"]'))e.value=c;if(e._sync)e._sync()});if($('vfp')._sync)$('vfp')._sync()}
function vfKeep(){var c=$('vfp').value;vfFill();if(c&&$('vfp').querySelector('option[value="'+c+'"]'))$('vfp').value=c;if($('vfp')._sync)$('vfp')._sync()}
$('vfd').addEventListener('toggle',function(){if(this.open)vfKeep()});
function vfN(){var n=Math.floor(num($('vf_n').value));return Math.min(Math.max(n,1),999)}
$('vf_n').value='1';
function vfLines(){var out=[],v=$('vfp').value;if(v!=='')out.push({r:rows[+v],n:vfN()});
 if($('vfm').checked)document.querySelectorAll('#vfxl .vfxr').forEach(function(d){var q=d.querySelector('select').value,n=Math.min(Math.max(Math.floor(num(d.querySelector('input.vq').value))||1,1),999);if(q!=='')out.push({r:rows[+q],n:n})});
 return out}
function vfAuto(){if(!$('vfa').checked)return;var ls=vfLines(),L=0,bad=!ls.length;ls.forEach(function(x){var o=calc(x.r);if(!o||o.err){bad=true;return}L+=o.L*x.n});if(bad)return;var vv=volt(L,ls[0].r)||0;$('vf_L').value=L;$('vf_v').value=vv;var w=$('vfn');w.hidden=false;
 w.textContent=ls.length>1?'Terisi otomatis dari harga '+ls.length+' produk sekarang (harga '+rp(L)+', voucher '+rp(vv)+'). Voucher diperkirakan dari total harga. Jika pesanan terjadi di harga lain, ganti angkanya atau matikan isi otomatis.':'Terisi otomatis dari harga produk sekarang (harga '+rp(L)+', voucher '+rp(vv)+'). Jika pesanan terjadi di harga lain, ganti angkanya atau matikan isi otomatis.'}
function vfCombo(sel,ph){
 var w=document.createElement('div');w.className='vfc';
 var inp=document.createElement('input');inp.type='text';inp.placeholder=ph||'Ketik untuk cari produk';inp.setAttribute('autocomplete','off');inp.setAttribute('autocapitalize','off');inp.setAttribute('spellcheck','false');inp.setAttribute('aria-label','Cari produk');
 var ul=document.createElement('ul');ul.className='vfcl';ul.hidden=true;
 sel.style.display='none';sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');sel.parentNode.insertBefore(w,sel);w.appendChild(inp);w.appendChild(ul);
 function hay(i){var r=rows[i],t=[];if(!r)return'';for(var k in r){var x=r[k];if(typeof x==='string'||typeof x==='number')t.push(x)}return t.join(' ').toLowerCase()}
 function sync(){inp.value=sel.selectedIndex>0?sel.options[sel.selectedIndex].text:''}
 function render(q){KDOM.setHTML(ul, '');var qs=q.toLowerCase().split(/\s+/).filter(Boolean),n=0;
  for(var i=1;i<sel.options.length;i++){var o=sel.options[i],h=hay(+o.value);if(qs.every(function(t){return h.indexOf(t)>=0})){var li=document.createElement('li');li.textContent=o.text;li.dataset.v=o.value;if(o.value===sel.value)li.className='on';ul.appendChild(li);n++}}
  if(!n){var e=document.createElement('li');e.className='em';e.textContent=q?'Tidak ada produk yang cocok':'Belum ada produk';ul.appendChild(e)}
  ul.hidden=false}
 function pick(v){sel.value=v;sync();ul.hidden=true;inp.blur();sel.dispatchEvent(new Event('change'))}
 inp.addEventListener('focus',function(){try{inp.select()}catch(e){}render('')});
 inp.addEventListener('input',function(){render(inp.value)});
 inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var f=ul.querySelector('li[data-v]');if(f)pick(f.dataset.v)}else if(e.key==='Escape'){ul.hidden=true;sync();inp.blur()}});
 inp.addEventListener('blur',function(){setTimeout(function(){ul.hidden=true;sync()},250)});
 ul.addEventListener('click',function(e){var li=e.target.closest('li');if(li&&li.dataset.v)pick(li.dataset.v)});
 sel._sync=sync;sync()}
function vfNum(){document.querySelectorAll('#vfxl .vt').forEach(function(e,i){e.textContent='Produk tambahan '+(i+1)})}
function vfAddRow(){var d=document.createElement('div');d.className='vfxr';
 KDOM.setHTML(d, '<div class="vt">Produk tambahan</div><select aria-label="Produk tambahan">'+vfOpt()+'</select><div class="vb"><label>Jumlah</label><input class="vq" inputmode="numeric" value="1" aria-label="Jumlah produk tambahan"><button class="btn gh" type="button" aria-label="Hapus produk ini">Hapus</button></div>');
 d.querySelector('button').onclick=function(){d.remove();vfNum();vfAuto()};
 var se=d.querySelector('select');se.onchange=vfAuto;d.querySelector('input.vq').addEventListener('input',vfAuto);
 $('vfxl').appendChild(d);vfCombo(se,'Ketik untuk cari produk');vfNum()}
function vfaState(){var c=$('vfa').checked,e=$('vfas');e.textContent=c?'Aktif':'Mati';e.classList.toggle('off',!c)}
try{$('vfa').checked=KStore.getItem('kalsara_vfauto')!=='0'}catch(e){}
vfaState();
$('vfa').addEventListener('change',function(){vfaState();try{KStore.setItem('kalsara_vfauto',this.checked?'1':'0')}catch(e){}if(this.checked){vfAuto()}else{$('vf_L').value='';$('vf_v').value='';$('vfn').hidden=true;toast('Isi sendiri harga dan voucher dari pesanan')}});
['vf_L','vf_v'].forEach(function(id){$(id).addEventListener('input',function(){$('vfn').hidden=true})});
$('vfp').onchange=vfAuto;$('vf_n').addEventListener('input',vfAuto);
$('vfm').addEventListener('change',function(){var on=this.checked;$('vfx').hidden=!on;$('vfmp').hidden=on;$('vfms').textContent=on?'Aktif':'Mati';$('vfms').classList.toggle('off',!on);if(on&&!$('vfxl').children.length)vfAddRow();vfAuto()});
vfCombo($('vfp'),'Ketik untuk cari produk');
$('vfxa').onclick=function(){if($('vfxl').children.length>=9){toast('Maksimal 10 produk per pesanan');return}vfAddRow()};
function vfRate(x){return x.toFixed(2).replace('.',',')+'%'}
function tlPush(t){var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk).slice();L.unshift({d:today(),t:String(t).slice(0,200)});A.tlog=L.slice(0,50);tlRender()}
function vgSync(){var v=A.ver,bad=!!(v&&!v.ok);$('vig').hidden=!(bad&&!v.ig);var gi=$('vigi');if(bad&&v.ig){gi.hidden=false;gi.textContent='Peringatan selisih ('+v.bad.join(', ')+') diabaikan pada '+dtx(v.ig.d)+'. Alasan: '+v.ig.w+'. Cek ulang dengan pesanan nyata untuk memastikan tarif sudah benar.'}else gi.hidden=true}
function vgOpen(){var v=A.ver;if(!v||v.ok||v.ig)return;dprev=document.activeElement;$('vgc').textContent='Selisih pada: '+v.bad.join(', ')+' (cek '+dtx(v.d)+').';$('vgr').value='';$('vge').hidden=true;$('vgd').hidden=false;inertBg(true);$('vgr').focus()}
function vgClose(){$('vgd').hidden=true;inertBg(false);var p=dprev;dprev=null;if(p&&p.focus)try{p.focus()}catch(e){}}
$('vig').onclick=vgOpen;$('vgn').onclick=vgClose;
$('vgy').onclick=function(){var v=A.ver;if(!v||v.ok||v.ig){vgClose();return}var t=$('vgr').value.trim();if(t.length<3){$('vge').hidden=false;$('vgr').focus();return}t=t.slice(0,120);v.ig={d:today(),w:t};tlPush('Peringatan selisih tarif diabaikan ('+v.bad.join(', ')+'). Alasan: '+t);vgClose();upd(true);toast('Peringatan diabaikan dan dicatat')};
document.querySelectorAll('[data-vgq]').forEach(function(b){b.addEventListener('click',function(){$('vgr').value=this.dataset.vgq;$('vge').hidden=true;$('vgr').focus()})});
$('vgd').addEventListener('keydown',function(e){if(e.key=='Escape')vgClose();else if(e.key=='Tab'){var f=[].slice.call($('vgd').querySelectorAll('textarea,button')),i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus()}});
$('vgd').addEventListener('click',function(e){if(e.target===this)vgClose()});

function gdOpen(n){var g=$('gd'),b=$('gdb');if(!b.firstChild)KDOM.copyChildren(b, $('gdtp'));if(g.hidden){dprev=document.activeElement;g.hidden=false;inertBg(true);g.scrollTop=0}
 b.querySelectorAll('details[data-ch]').forEach(function(d){d.open=false});
 if(n){var d=b.querySelector('details[data-ch="'+n+'"]');if(d){d.open=true;setTimeout(function(){d.scrollIntoView({block:'start'})},40)}}else g.scrollTop=0;
 if(n===0||g.dataset.f!=='1'){g.dataset.f='1';$('gdx').focus()}}
function gdClose(){var g=$('gd');if(g.hidden)return;g.hidden=true;g.dataset.f='';inertBg(false);var p=dprev;dprev=null;if(p&&p.focus)try{p.focus()}catch(e){}}
$('gdx').onclick=gdClose;
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-gd]');if(!b)return;e.preventDefault();gdOpen(+b.dataset.gd||0)});
document.addEventListener('keydown',function(e){if(e.key=='Escape'&&!$('gd').hidden)gdClose()});
function vfSrc(r,N,L,v,P,RT,ovr){
 var src=$('vfn').hidden?'diisi manual':'terisi otomatis dari produk';
 var T=[['Administrasi',RT.ad],['Gratis Ongkir XTRA',RT.gx],['Promo XTRA',RT.px],['Video/Live XTRA',RT.vl],['Pembayaran',RT.pay],['Premi',RT.pm],['PPh 22',RT.tx]].map(function(x){return x[0]+' '+vfRate(x[1])}).join(', ');
 return'<div class="stk" style="margin-top:8px"><b>Dasar hitungan aplikasi</b><br>Produk: '+esc(r.n||'(tanpa nama)')+' &middot; '+N+' barang<br>Harga '+rp(L)+' ('+src+'), voucher '+rp(v)+', harga setelah voucher '+rp(P)+'<br>Tarif yang dipakai (pengaturan toko sekarang): '+T+(ovr.length?'<br>Dikecualikan di pesanan ini (0%): '+ovr.join(', '):'')+'</div>'}
function vfSrc2(ls,N,L,v,P,RT,ovr){
 if(ls.length<2)return vfSrc(ls[0].r,N,L,v,P,RT,ovr);
 var src=$('vfn').hidden?'diisi manual':'terisi otomatis dari produk';
 var h='<div class="stk" style="margin-top:8px"><b>Dasar hitungan aplikasi (pesanan campuran)</b><br>Total '+N+' barang dari '+ls.length+' produk. Harga '+rp(L)+' ('+src+'), voucher '+rp(v)+', harga setelah voucher '+rp(P)+'. Harga dan voucher dibagi ke tiap produk sesuai proporsi harganya.';
 ls.forEach(function(x){var Q=x.Q;h+='<br>&bull; '+esc(x.r.n||'(tanpa nama)')+' &times;'+x.n+': harga '+rp(x.Li)+', Administrasi '+vfRate(Q.ad)+', Gratis Ongkir XTRA '+vfRate(Q.gx)+', Promo XTRA '+vfRate(Q.px)+', Video/Live XTRA '+vfRate(Q.vx+Q.lv)+', Premi '+vfRate(Q.pm)});
 h+='<br>Berlaku untuk semua: Pembayaran '+vfRate(A.pb)+', PPh 22 '+vfRate(A.pj)+(ovr.length?'<br>Dikecualikan di pesanan ini (0%): '+ovr.join(', '):'')+'</div>';return h}
function vfBtn(k,a,P,d,RT,r){
 if(!({ad:1,gx:1,px:1,pay:1,pm:1,tx:1})[k]||!(P>0))return'';
 if((k=='gx'&&$('vfog').value==='0')||(k=='px'&&$('vfop').value==='0'))return'';
 var pk={ad:'ad',gx:'gx',px:'px',pm:'pm'}[k];
 if(pk&&r&&r.o&&r.o[pk]!==null&&r.o[pk]!==undefined)return'<br>Produk ini punya tarif khusus. Ubah di "Tarif produk ini", bukan di pengaturan toko.';
 if(d<0&&({gx:1,px:1,pay:1})[k]&&RT[k]>0&&a>0)return'';
 if(k=='ad'&&a===0)return'';
 var v=Math.round(a/P*10000)/100;if(v>100)return'';
 var lb=a===0?(k=='px'||k=='gx'?'Set tidak ikut (0%)':'Set ke 0%'):'Pakai '+vfRate(v)+' dari pesanan ini';
 return'<br><button class="lk" type="button" data-vfa="'+k+'|'+v+'" style="margin-top:6px">'+lb+'</button> <small>(dihitung dari harga setelah voucher '+rp(P)+(!$('vfn').hidden?'; angka harga terisi otomatis, pastikan sama dengan pesanan':'')+')</small>'}
$('vfr').addEventListener('click',function(e){var b=e.target.closest('[data-vfa]');if(!b)return;var p=b.dataset.vfa.split('|'),k=p[0],v=Number(p[1]);if(isNaN(v)||v<0||v>100)return;
 var g=gfac()>0?gfac():100,nm;
 if(k=='ad'){A.ac='man';A.ad=v;nm='Administrasi'}
 else if(k=='gx'){if(v===0)A.gc='none';else{A.gc='man';A.gm=Math.min(100,Math.round(v*10000/g)/100)}nm='Gratis Ongkir XTRA'}
 else if(k=='px'){A.px=v;A.pp=v>0?'man':'no';syncVL();nm='Promo XTRA'}
 else if(k=='pay'){A.pb=v;nm='Biaya pembayaran'}
 else if(k=='pm'){A.pm=v;nm='Premi'}
 else if(k=='tx'){A.pj=v;nm='PPh 22'}
 else return;
 tlPush(nm+(v===0?' diatur tidak ikut (0%)':' diubah ke '+vfRate(v))+' mengikuti pesanan nyata');
 fill();upd(true);toast(nm+' diperbarui dari pesanan ini, mengecek ulang');$('vfg').click()});
$('vfg').onclick=function(){var ls=vfLines();if(!ls.length){toast('Pilih produk dulu');return}
 for(var q=0;q<ls.length;q++){var oo=calc(ls[q].r);if(!oo||oo.err){toast('Harga produk belum bisa dihitung'+(ls.length>1?': '+(ls[q].r.n||'(tanpa nama)'):''));return}ls[q].o=oo}
 var multi=ls.length>1,r=ls[0].r,o=ls[0].o;
 var g=function(k){var v=$('vf_'+k).value;return v.trim()===''?0:Math.max(0,num(v)||0)},L=g('L'),v=g('v'),T=g('t');if(!(L>0)){toast('Isi harga produk');return}
 var N=0,W=0,ovr=[],ovg=$('vfog').value==='0',ovp=$('vfop').value==='0',ovv=$('vfov').value==='0';
 if(ovg)ovr.push('Gratis Ongkir XTRA');if(ovp)ovr.push('Promo XTRA');if(ovv)ovr.push('Video/Live XTRA');
 ls.forEach(function(x){N+=x.n;x.w=x.o.L*x.n;W+=x.w});
 var Ls=0,Vs=0,P=0,sh=0,pmS=0,txS=0,E={fx:0,ad:0,gx:0,px:0,vl:0,pay:0,pm:0,tx:0},CAPD={gx:0,px:0,pay:0,vl:0},CAPK={gx:1,px:1,vl:1,pay:1};
 var cf=function(r,c,P2){return pr(r,P2)>c?c:0};
 ls.forEach(function(x,i){var last=i==ls.length-1;x.Li=last?L-Ls:Math.round(L*x.w/W);x.vi=last?v-Vs:Math.round(v*x.w/W);Ls+=x.Li;Vs+=x.vi;
  var Q=Object.assign({},x.o.R);['cg','cp','cvx','clv','cpb'].forEach(function(k){Q[k]=x.o.R[k]*x.n});if(ovg)Q.gx=0;if(ovp)Q.px=0;if(ovv){Q.vx=0;Q.lv=0}
  x.Q=Q;x.P=x.Li-x.vi;x.f=fees(x.P,Q);var b=x.f.b;
  P+=x.P;E.fx+=i==0?b.fx:0;E.ad+=b.ad;E.gx+=b.gx;E.px+=b.px;E.vl+=b.vx+b.lv;E.pay+=b.pay;E.pm+=x.f.pm;E.tx+=x.f.tax;
  sh+=x.f.sh-(i==0?0:b.fx);pmS+=x.f.pm;txS+=x.f.tax;
  CAPD.gx+=cf(Q.gx,Q.cg,x.P);CAPD.px+=cf(Q.px,Q.cp,x.P);CAPD.pay+=cf(A.pb,Q.cpb,x.P);CAPD.vl+=cf(Q.vx,Q.cvx,x.P)||cf(Q.lv,Q.clv,x.P)});
 var same=function(fn){var a=fn(ls[0].Q);return ls.every(function(x){return fn(x.Q)===a})?a:undefined};
 var RT={ad:same(function(Q){return Q.ad}),gx:same(function(Q){return Q.gx}),px:same(function(Q){return Q.px}),vl:same(function(Q){return Q.vx+Q.lv}),pay:A.pb,pm:same(function(Q){return Q.pm}),tx:A.pj},bad=[],h='',sa=0;
 VF.forEach(function(x){var k=x[0],e=E[k],a=g(k),d=a-e,wr=Math.abs(d)>Math.max(100,e*0.02);sa+=a;
  if(!wr){h+='<div class="rw"><span>'+x[1]+'</span><b class="ok">Cocok &middot; '+rp(a)+'</b></div>';return}
  bad.push(x[1]);var ra=P>0?a/P*100:0;
  h+='<div class="wn r"><b>'+x[1]+' meleset '+(d>0?'+':'-')+rp(Math.abs(d))+'</b><br>Aplikasi '+rp(e)+(RT[k]!==undefined?' ('+vfRate(RT[k])+')':'')+', aktual '+rp(a)+(RT[k]!==undefined?' (sekitar '+vfRate(ra)+' dari harga setelah voucher)':'')+'. Periksa: '+x[2]+'.'+(CAPD[k]?' Perkiraan aplikasi sudah dibatasi '+rp(CAPD[k])+' untuk '+N+' barang.':'')+(d<0&&RT[k]>0?' Jika biaya aktual lebih kecil, mungkin kena batas maksimum.':'')+(N>1&&CAPK[k]?' Pastikan jumlah barang ('+N+') benar, karena batas dihitung per barang.':'')+(multi?(({pay:1,tx:1})[k]?vfBtn(k,a,P,d,RT,null):(({ad:1,gx:1,px:1,pm:1})[k]?'<br><small>Pesanan campuran: tombol "Pakai ... dari pesanan ini" tidak tersedia karena tiap produk punya tarif sendiri. Cek produk yang dicurigai dengan pesanan satu jenis.</small>':'')):vfBtn(k,a,P,d,RT,r))+'</div>'});
 var et=P-sh-pmS-txS,tw=false;
 if(T>0){var un=(P-sa)-T;if(Math.abs(un)>Math.max(100,et*0.02)){tw=true;bad.push('Total penghasilan');
  h+='<div class="wn r"><b>Total penghasilan tidak cocok</b><br>Aplikasi memperkirakan '+rp(et)+', aktual '+rp(T)+'. '+(bad.length==1?'Semua komponen di atas cocok, jadi ada potongan lain di Rincian Penghasilan yang belum ada di aplikasi ('+rp(un)+').':'Selisih ini ikut dari komponen yang meleset.')+'</div>'}else h+='<div class="rw"><span>Total penghasilan</span><b class="ok">Cocok &middot; '+rp(T)+'</b></div>'}
 var ok=!bad.length,sv=ok&&!ovr.length;
 if(sv){A.ver={ok:true,d:today(),n:r.n||'',q:N,pn:r.n||'',ps:prodSig(o.R),sg:feeSig()};if(multi)A.ver.ml=ls.map(function(x){return{pn:x.r.n||'',ps:prodSig(x.o.R)}});A.tchk=today();$('tchk').value=A.tchk}
 else if(!ok&&!ovr.length)A.ver={ok:false,d:today(),bad:bad};
 h='<div class="wn '+(ok?'y':'r')+'" style="margin-top:12px">'+(ok?'Semua komponen cocok'+(N>1?' (untuk '+N+' barang'+(multi?' dari '+ls.length+' produk':'')+')':'')+'. '+(sv?'Tanggal cek tarif diperbarui ke hari ini. Hasil ini berlaku selama tarif toko tidak berubah.':'Pesanan ini dihitung tanpa '+ovr.join(' dan ')+', jadi tanggal cek tarif tidak diperbarui. Untuk memvalidasi pengaturan sekarang, cek satu pesanan yang benar-benar memakainya.'):'Ada '+bad.length+' selisih. Perbaiki lalu cek ulang dengan pesanan yang sama. '+(ovr.length?' Karena memakai pengecualian ('+ovr.join(', ')+'), hasil ini tidak disimpan sebagai peringatan di tab lain.':' Peringatan tampil di tab lain sampai kamu memperbaiki dan cek ulang berhasil, atau menekan "Abaikan peringatan ini" di bagian atas tab ini dan menulis alasannya.'))+'</div>'+vfSrc2(ls,N,L,v,P,RT,ovr)+'<div style="margin-top:6px">'+h+'</div>';
 KDOM.setHTML($('vfr'), h);upd(true)};

