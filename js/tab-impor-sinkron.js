import {State} from './state.js';
import {KStore} from './storage.js';

// Semua akses ke aplikasi induk disuntikkan agar modul tidak bergantung pada global bersama.
export function createTabImporSinkron({$,ROW_MAX,toast,ask,KDOM,add,upd,colL,persist,calc,impas,tmod,fmt,pc1,navigator,document,window,KStore,today,num,rp,strip,etAll,rlAll,psig,PSIG,rpt,tgl,prRender,srt,shop,CR,fees,warns,fwdL,esc,pr,pf}) {
function tab(i){if(i==1&&psig()!==PSIG)upd(false);if(i!=0)etAll();rlAll();$('v4').hidden=i!=4;$('t4').setAttribute('aria-selected',i==4);if(i==4){rpt()}$('v3').hidden=i!=3;$('t3').setAttribute('aria-selected',i==3);if(i==3){tgl();prRender()}$('fab').hidden=i!=0;$('v0').hidden=i!=0;$('top').hidden=i!=1;$('v1').hidden=i!=1;$('v2').hidden=i!=2;$('t0').setAttribute('aria-selected',i==0);$('t1').setAttribute('aria-selected',i==1);$('t2').setAttribute('aria-selected',i==2);if(i==1)srt();if(i==0){tgl();shop()}window.scrollTo({top:0,left:0,behavior:'instant'})}
$('t0').onclick=function(){tab(0)};$('t1').onclick=function(){tab(1)};$('t2').onclick=function(){tab(2)};$('t3').onclick=function(){tab(3)};$('t4').onclick=function(){tab(4)};$('t5').onclick=function(){tab(5)};
$('add').onclick=function(){if(State.rows.length>=ROW_MAX){toast('Maksimal '+ROW_MAX+' produk');return}$('q').value='';$('ff').value='all';$('so').value='0';add();var c=$('list').lastChild;c.scrollIntoView({block:'center'});c.querySelector('input').focus();upd(false)};
$('col').onclick=function(){var all=State.rows.length&&State.rows.every(function(r){return r.c});State.rows.forEach(function(r){r.c=!all;r.box.classList.toggle('cl',!all);var tg=r.box.querySelector('.tg');if(tg)tg.setAttribute('aria-expanded',all)});colL();persist()};
$('rst').onclick=function(){ask('Kosongkan semua produk? Semua data produk akan terhapus.','Ya, kosongkan',function(){State.rows=[];KDOM.setHTML($('list'), '');add();upd(true);toast('Semua produk dikosongkan')})};
var HD=['Produk','Isi paket','Stok Shopee','Tanggal cek stok','Supplier','SKU','Link supplier','Modal supplier','Biaya Management Partner','Biaya packing','Total modal','Target untung','Harga listing awal','Harga diskon coret','Voucher toko','Harga setelah voucher','Tarif administrasi (%)','Tarif Gratis Ongkir XTRA (%)','Tarif Promo XTRA (%)','Tarif Video XTRA (%)','Tarif Live XTRA (%)','Biaya administrasi','Biaya Gratis Ongkir XTRA','Biaya Promo XTRA','Biaya Video XTRA','Biaya Live XTRA','Biaya pembayaran','Biaya layanan pesanan','Total Biaya Shopee','Premi','PPh 22','Biaya iklan','Cadangan retur','Ongkir ditanggung','Saldo masuk','Untung bersih','Margin (%)','Harga impas (diskon coret)'];
function tbl(){var o=[HD];
 State.rows.forEach(function(r){var c=calc(r);if(c&&!c.err){var im=impas(r,c.R);o.push([(r.n||'-').replace(/[\t\r\n]+/g,' '),r.q>0?r.q:1,r.s==null?'':r.s,r.sd||'',r.sup||'',r.sku||'',r.lnk||'',r.m,r.d,r.p,tmod(r),r.t,c.M,c.L,c.v,c.P,fmt(c.R.ad),fmt(c.R.gx),fmt(c.R.px),fmt(c.R.vx),fmt(c.R.lv),c.b.ad,c.b.gx,c.b.px,c.b.vx,c.b.lv,c.b.pay,c.b.fx,c.sh,c.pm,c.tax,c.ads,c.rt,State.A.og,c.s,c.u,pc1(c.P>0?c.u/c.P*100:0),im===null?'':im])}});
 return o}
$('cpy').onclick=function(){var o=tbl();
 if(o.length<2){toast('Belum ada hasil untuk disalin');return}
 try{navigator.clipboard.writeText(o.map(function(x){return x.map(function(v){return typeof v=='string'?csvSafe(v.replace(/[\t\r\n]+/g,' ')):v}).join('\t')}).join('\n')).then(function(){toast('Hasil tersalin')},function(){toast('Gagal menyalin')})}catch(e){toast('Gagal menyalin')}};
function salesRows(){if(!State.SALES.length)return null;return [['Tanggal','Jam','Produk','Harga jual','Untung','Sumber harga','Harga ideal','Untung di harga ideal','Selisih untung']].concat(State.SALES.slice().sort(function(a,b){return a.t-b.t}).map(function(x){var t=new Date(x.t);return[x.d,String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0'),x.n,Math.round(x.a),Math.round(x.u),({akt:'Harga aktual',promo:'Promo',ideal:'Harga ideal'}[x.sr]||''),x.pi>0?Math.round(x.pi):'',x.pi>0?Math.round(x.ui):'',x.pi>0?Math.round(x.ui-x.u):'']}))}
function showCpBox(text){var b=$('cpbox'),t=$('cptx');if(!b||!t)return;b.hidden=false;t.value=text;try{t.focus();t.select();t.setSelectionRange(0,text.length);b.scrollIntoView({block:'nearest'})}catch(e){}}
function copySales(){var d=salesRows();if(!d){toast('Belum ada penjualan untuk disalin');return}
 var text=csv(d).replace(/^\ufeff/,''),bx=$('cpbox');
 var done=function(){if(bx)bx.hidden=true;toast('CSV tersalin ke clipboard')};
 var manual=function(){showCpBox(text);toast('Salin manual dari kotak teks')};
 var legacy=function(){var ok=false,t;try{t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(t);t.focus();t.select();t.setSelectionRange(0,text.length);ok=document.execCommand('copy')}catch(e){ok=false}try{if(t)t.remove()}catch(e){}return ok};
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){legacy()?done():manual()})}else{legacy()?done():manual()}}catch(e){legacy()?done():manual()}}
function csvSafe(v){if(typeof v!='string')return v;if(/^[=+\-@\t\r]/.test(v)&&v!=='-'&&!/^[+-]?\d[\d.,]*%?$/.test(v))return "'"+v;return v}
function csv(o){return '\ufeff'+o.map(function(x){return x.map(function(v){v=String(csvSafe(v));return /[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')}).join('\r\n')}
function anchorDl(name,text,mime){try{var b=new Blob([text],{type:mime||'text/csv'});if(navigator.msSaveOrOpenBlob){navigator.msSaveOrOpenBlob(b,name);return true}var u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(u)},4000);return true}catch(e){return false}}
function dl(name,text,mime,alt,onFail){
 var ok=anchorDl(name,text,mime);
 if(!ok&&onFail)onFail();
 var h=alt?'gunakan tombol '+alt:'buka aplikasi lewat browser biasa';
 toast(ok?'Unduhan dimulai. Jika file tidak muncul, '+h+'.':'Unduhan tidak tersedia. '+h.charAt(0).toUpperCase()+h.slice(1)+'.');
}
$('xr').onclick=function(){var o=tbl();if(o.length<2){toast('Belum ada hasil untuk diunduh');return}dl('hasil-kalsara.csv',csv(o),'text/csv;charset=utf-8','Salin hasil')};
$('xt').onclick=function(){dl('template-produk-kalsara.csv',(csv([['Nama produk','Modal supplier','Biaya Management Partner','Biaya packing','Target untung','Isi paket (opsional)','Stok Shopee (opsional)','Supplier (opsional)','SKU (opsional)','Link supplier (opsional)','Tarif Gratis Ongkir XTRA % (opsional)'],['Contoh produk A',25000,1000,500,5000,1,20,'Toko ABC','KAOS-01','https://contoh.com/produk',2]])),'text/csv;charset=utf-8','')};
function parseCsv(t){
 parseCsv.bad=false;t=String(t||'').replace(/^\ufeff/,'');
 var l1=t.split(/\r?\n/,1)[0]||'',ds=[';','\t',','],counts=ds.map(function(d){
  var n=0,q=false;
  for(var j=0;j<l1.length;j++){var ch=l1[j];
   if(ch=='"'){if(q&&l1[j+1]=='"')j++;else q=!q}
   else if(!q&&ch==d)n++}
  return[d,n]});
 counts.sort(function(a,b){return b[1]-a[1]});
 var dm=counts[0][1]>0?counts[0][0]:';';
 var out=[],row=[],c='',q=false;
 for(var i=0;i<t.length;i++){var ch=t[i];
  if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch=='"'&&c.trim()===''){q=true;c=''}
  else if(ch==dm){row.push(c);c=''}
  else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;row.push(c);c='';if(row.some(function(v){return String(v).trim()!==''}))out.push(row);row=[]}
  else c+=ch}
 if(q){parseCsv.bad=true;return []}
 row.push(c);if(row.some(function(v){return String(v).trim()!==''}))out.push(row);
 return out}
/*kolom ke-11 opsional pada impor CSV = tarif penuh Gratis Ongkir XTRA per produk (%), dikali faktor keringanan toko. Kosong = ikut Setelan.*/
function impGx(v){if(v===undefined||v===null)return null;var s=String(v).trim();if(s==='')return null;if(!/^\d+([.,]\d+)?\s*%?$/.test(s))return NaN;var g=pf(s,true);if(!isFinite(g)||g<0||g>100)return NaN;return Math.round(g*10000)/10000}
function impGxK(v){var s=String(v==null?'':v).trim().toUpperCase(),m=s.match(/^([A-H])(?:\s*[\/>-]\s*([A-H]))?$/);return m?{gc:m[1],g2:m[2]||null}:null}
function impGxO(v){var k=impGxK(v);if(k)return k.g2?{gc:k.gc,g2:k.g2}:{gc:k.gc};var g=impGx(v);return(g===null||isNaN(g))?{}:{gx:g}}
function impGxStat(d){var n=0,bad=0,low=0;d.forEach(function(x){if(impGxK(x[10])){n++;return}var g=impGx(x[10]);if(g===null)return;if(isNaN(g)){bad++;return}n++;if(g>0&&g<1&&String(x[10]).indexOf('%')<0)low++});
 var m='';if(n>0)m+=' Tarif Gratis Ongkir XTRA per produk diisi di '+n+' produk.';if(bad>0)m+=' '+bad+' tarif Gratis Ongkir XTRA tidak terbaca (harus angka 0 sampai 100) dan diabaikan.';if(low>0)m+=' Perhatian: '+low+' tarif Gratis Ongkir XTRA di bawah 1 tanpa tanda %. Pastikan itu persen (2 berarti 2%), bukan pecahan (0,02).';return m}
function imp(t){var d=parseCsv(t);if(parseCsv.bad){toast('Ada tanda kutip (") yang tidak ditutup di file. Periksa file lalu coba lagi');return}if(d.length&&isNaN(Number(String(d[0][1]||'').replace(/\./g,'').replace(',','.'))))d.shift();
 var all=d.length;d=d.filter(function(x){return num(x[1])>0});
 if(!d.length){toast('Tidak ada baris valid. Kolom: nama, modal, Management Partner, packing, target');return}
 var sk=all-d.length,lo=d.filter(function(x){return num(x[1])<100}).length,
 pv=d.slice(0,3).map(function(x){return (String(x[0]||'').trim().slice(0,25)||'(tanpa nama)')+' modal '+rp(num(x[1]))}).join('; ');
 ask('Impor '+d.length+' produk? Contoh: '+pv+'.'+(sk>0?' '+sk+' baris dilewati (modal kosong atau 0).':'')+(lo>0?' Perhatian: '+lo+' baris bermodal di bawah Rp100, periksa format angka.':'')+impGxStat(d),'Ya, impor',function(){impGo(d)})}
function impGo(d){var old=State.rows.filter(function(r){return r.n||r.m||r.d||r.p||r.t}).map(strip);State.rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});
 var k=Math.min(ROW_MAX-State.rows.length,d.length);
 d.slice(0,k).forEach(function(x){add({n:String(x[0]||'').trim().slice(0,120),m:num(x[1]),d:num(x[2]),p:num(x[3]),t:num(x[4]),q:num(x[5]),s:(x[6]===undefined||String(x[6]).trim()==='')?null:num(x[6]),sd:(x[6]===undefined||String(x[6]).trim()==='')?'':today(),sup:String(x[7]||'').trim().slice(0,120),sku:String(x[8]||'').trim().slice(0,60),lnk:String(x[9]||'').trim().slice(0,300),o:impGxO(x[10])})});
 if(!State.rows.length)add();$('q').value='';upd(true);srt();toast(k+' produk diimpor'+(k<d.length?' (batas '+ROW_MAX+' produk)':''))}
$('xi').onclick=function(){$('xf').click()};
$('xf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){imp(String(fr.result))};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};

/* 5.15: sinkron modal dan stok dari spreadsheet supplier. Cocok lewat SKU, lalu nama. Tidak menambah produk baru. */
var SYK='kalsara_sync_url';
function syUrl(u){u=String(u||'').trim();var m=u.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/i),g=u.match(/[?#&]gid=(\d+)/);
 if(!m)return u;
 if(m[1]==='e'){var pm=u.match(/\/d\/e\/([\w-]+)/);return pm?'https://docs.google.com/spreadsheets/d/e/'+pm[1]+'/pub?output=csv'+(g?'&gid='+g[1]:''):u}
 return 'https://docs.google.com/spreadsheets/d/'+m[1]+'/gviz/tq?tqx=out:csv'+(g?'&gid='+g[1]:'')}
function syCol(h){var c={sku:-1,n:-1,m:-1,s:-1};h=h.map(function(x){return String(x).trim().toLowerCase()});
 h.forEach(function(x,i){if(c.sku<0&&/^(sku|kode|kode produk|kode barang)$/.test(x))c.sku=i;else if(c.n<0&&/^(nama|nama produk|produk|nama barang|barang)$/.test(x))c.n=i;else if(c.s<0&&/(stok|stock|qty)/.test(x))c.s=i});
 h.forEach(function(x,i){if(c.m<0&&/modal/.test(x))c.m=i});
 h.forEach(function(x,i){if(c.m<0&&/^harga/.test(x)&&!/(jual|awal|diskon|promo)/.test(x))c.m=i});return c}
function sySync(t){var d=parseCsv(t);if(parseCsv.bad){toast('Ada tanda kutip (") yang tidak ditutup di file. Periksa file lalu coba lagi');return}
 if(/^\s*</.test(t)||d.length<2){toast('Isi sheet tidak terbaca. Pastikan dibagikan ke siapa saja yang memiliki link');return}
 var c=syCol(d[0]);
 if((c.m<0&&c.s<0)||(c.sku<0&&c.n<0)){toast('Baris pertama harus judul: SKU atau Nama, serta Modal dan/atau Stok');return}
 var old=State.rows.map(strip),by={},bn={};
 old.forEach(function(r){var k=(r.sku||'').trim().toLowerCase(),n=(r.n||'').trim().toLowerCase();if(k){if(Object.prototype.hasOwnProperty.call(by,k))by[k]=null;else by[k]=r}if(n){if(Object.prototype.hasOwnProperty.call(bn,n))bn[n]=null;else bn[n]=r}});
 var up={},miss=0;
 d.slice(1).forEach(function(x){var k=c.sku>=0?String(x[c.sku]||'').trim().toLowerCase():'',n=c.n>=0?String(x[c.n]||'').trim().toLowerCase():'',r=k?(by[k]||null):(n?(bn[n]||null):null);
  if(!r){if(k||n)miss++;return}
  var m=c.m>=0?num(x[c.m]==null?'':x[c.m]):0,hs=c.s>=0&&String(x[c.s]==null?'':x[c.s]).trim()!=='',s=hs?num(x[c.s]):null;
  up[r.id]={r:r,m:(m>0&&m!==r.m)?m:0,s:(hs&&s!==r.s)?s:null}});
 var L=Object.keys(up).map(function(k){return up[k]}),mc=L.filter(function(u){return u.m>0}).length,sc=L.filter(function(u){return u.s!=null}).length;
 if(!mc&&!sc){toast(L.length?'Semua sudah sama dengan sheet':'Tidak ada produk yang cocok. Cek SKU atau nama di sheet');return}
 ask('Sinkron dari supplier: modal berubah di '+mc+' produk, stok berubah di '+sc+' produk.'+(miss>0?' '+miss+' baris sheet tidak cocok dengan produk Anda dan dilewati.':'')+' Lanjutkan?','Ya, sinkronkan',function(){
  L.forEach(function(u){var r=u.r;
   if(u.m>0){var a=r.m;if(a>0)r.mh=(r.mh||[]).concat([{d:today(),a:a,b:u.m}]).slice(-10);r.ack=false;r.m=u.m;r.mb=u.m}
   if(u.s!=null){r.s=u.s;r.sd=today()}});
  State.rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});upd(true);srt();toast('Disinkron: '+mc+' modal, '+sc+' stok')})}
function syGo(){var u=$('syu').value.trim(),b=$('syb');
 if(!/^https?:\/\//i.test(u)){toast('Isi link Google Sheet atau CSV, diawali https://');return}
 if(!window.fetch){toast('Browser tidak mendukung. Pakai sinkron dari file CSV');return}
 try{KStore.setItem(SYK,u)}catch(e){}
 b.disabled=true;b.textContent='Mengambil data...';
 var done=function(){b.disabled=false;b.textContent='Ambil dan sinkronkan'};
 fetch(syUrl(u),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){done();sySync(t)},function(){done();toast('Gagal mengambil. Cek link, koneksi, dan izin akses sheet')})}
$('syb').onclick=syGo;
$('syc').onclick=function(){$('syf').click()};
$('syf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){sySync(String(fr.result))};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};
try{$('syu').value=KStore.getItem(SYK)||''}catch(e){}

/* 5.16: harga aktual di Shopee (awal + diskon) per produk, penilaian untung, dan impor dari file atau link sheet */

/* 5.17: penanda Produk baru / Sudah tayang + saringan */
function actNote(r,o,pr){var al=(r.ha>0||r.hd>0)?actL(r,o.R):0,st='<div class="stk" style="margin:4px 0 0">';
 if(!(al>0))return pr?'':st+'Belum ada harga aktual. Penjualan dicatat di harga ideal '+rp(o.L)+'.</div>';
 if(pr&&al>=pr)return '';
 var aq=fwdL(al,r,o.R).u;return st+'Penjualan dicatat di harga aktual '+rp(al)+(al==o.L?' (sama dengan ideal).':' (ideal '+rp(o.L)+').')+' <b style="color:var(--'+(aq<0?'bad':'ok')+')">'+(aq<0?'Rugi ':'Untung ')+rp(Math.abs(aq))+'</b></div>'}
function actL(r,R){var L=r.hd>0?r.hd:(R.dm=='nom'?r.ha-Math.round(R.dv):Math.floor(r.ha*(100-R.dv)/100+1e-7));return Math.max(L,0)}
function bdH(r,o){r.ay=0;if(!(r.ha>0||r.hd>0))return '<span class="bd">Produk baru</span>';
 var t='Sudah tayang';
 if(o&&!o.err){var u=fwdL(actL(r,o.R),r,o.R).u;r.ay=u<r.t?1:0;t+=' \u2022 '+(u<0?'rugi':u<r.t?'di bawah target':'sesuai target')}
 return '<span class="bd tz'+(r.ay>0?' bad':'')+'">'+t+'</span>'}
function acH(r,o){
 if(!(r.ha>0)&&!(r.hd>0))return '';
 if(!o||o.err)return '<div class="stk">'+(o&&o.err?'Harga produk belum bisa dihitung, periksa tab Hitung.':'Isi modal supplier dulu untuk menilai harga aktual.')+'</div>';
 var R=o.R,L=actL(r,R);
 var a=fwdL(L,r,R),mg=a.P>0?a.u/a.P*100:0,st=a.u<0?'RUGI':(a.u<r.t?'Di bawah target':'Sesuai target'),ok=a.u>=r.t,h='';
 h+='<div class="pf '+(ok?'ok':'bad')+'"><span>Untung di harga aktual<small>'+st+' &bull; margin '+pc1(mg)+'%</small></span><b>'+rp(a.u)+'</b></div>';
 if(r.ha>0&&r.hd>0){h+=r.hd>r.ha?'<div class="stk" style="margin-top:8px">Periksa input: harga diskon lebih tinggi dari harga awal.</div>':'<div class="stk" style="margin-top:8px">Diskon aktual '+pc1((r.ha-r.hd)/r.ha*100)+'%</div>'}
 else if(r.ha>0)h+='<div class="stk" style="margin-top:8px">Harga diskon dihitung dari pengaturan diskon coret Anda.</div>';
 h+='<div class="stk">Harga diskon ideal '+rp(o.L)+(L<o.L?' (kurang '+rp(o.L-L)+')':' (aktual sudah di atas ideal)')+'</div>';
 if(R.dv>0)h+='<div class="stk">Harga awal ideal '+rp(o.M)+(r.ha>0?(r.ha<o.M?' (kurang '+rp(o.M-r.ha)+')':' (aktual sudah di atas ideal)'):'')+'</div>';
 else h+='<div class="stk">Diskon coret Promo Toko belum aktif, jadi harga awal ideal sama dengan harga diskon ideal ('+rp(o.M)+'). Harga awal di atas itu tetap aman, tapi hasilnya hanya menilai harga diskon. <button class="lk" type="button" data-go="pt">Buka Promosi</button></div>';
 if(!ok)h+='<div class="stk">Kurang '+rp(r.t-a.u)+' dari target untung.</div>';
 h+=actRin(r,o,a,L);
 return h}
/*5.19: rincian biaya untuk harga aktual (harga yang terpasang di Shopee), sama dengan Rincian Penghasilan*/
function actRin(r,o,a,L){var R=o.R,b=fees(a.P,R).b,x=warns(a,true),im=impas(r,R);
 return '<details class="det rd2"'+(r.ro2?' open':'')+'><summary>Lihat rincian biaya harga aktual</summary>'+
 '<div class="rw">Harga produk (harga diskon aktual)<b>'+rp(a.L)+'</b></div>'+
 (a.v?'<div class="rw">'+esc(a.vs||'Voucher toko')+'<b>- '+rp(a.v)+'</b></div><div class="rw">Harga setelah voucher<b>'+rp(a.P)+'</b></div>':'')+
 CR('Tarif administrasi',R.ad,b.ad,b.ad)+CR('Tarif Gratis Ongkir XTRA',R.gx,b.gx,Math.round(R.gx/100*a.P))+CR('Tarif Promo XTRA',R.px,b.px,Math.round(R.px/100*a.P))+CR('Tarif Video XTRA',R.vx,b.vx,Math.round(R.vx/100*a.P))+CR('Tarif Live XTRA',R.lv,b.lv,Math.round(R.lv/100*a.P))+CR('Biaya pembayaran',State.A.pb,b.pay,pr(State.A.pb,a.P))+(b.fx?'<div class="rw">Biaya layanan pesanan<b>'+rp(b.fx)+'</b></div>':'')+
 '<div class="rw">Total Biaya Shopee<b>'+rp(a.sh)+'</b></div><div class="rw">Premi<b>'+rp(a.pm)+'</b></div><div class="rw">PPh 22<b>'+rp(a.tax)+'</b></div>'+
 (a.ads?'<div class="rw">Biaya iklan ('+fmt(R.ads)+'%)<b>'+rp(a.ads)+'</b></div>':'')+(a.rt?'<div class="rw">Cadangan retur ('+fmt(R.rt)+'%)<b>'+rp(a.rt)+'</b></div>':'')+(State.A.og?'<div class="rw">Ongkir ditanggung<b>'+rp(State.A.og)+'</b></div>':'')+
 '<div class="rw">Saldo masuk toko<b>'+rp(a.s)+'</b></div><div class="rw">Modal + Management Partner + packing<b>'+rp(tmod(r))+'</b></div>'+
 '<div class="rw">'+(a.u<0?'Rugi bersih':'Untung bersih')+'<b class="'+(a.u<0?'bad':'ok')+'">'+(a.u<0?'- ':'')+rp(Math.abs(a.u))+'</b></div>'+
 '<div class="rw">Margin (dari harga jual)<b>'+pc1(x.m)+'%</b></div>'+(im===null?'':'<div class="rw">Harga impas (harga diskon coret)<b>'+rp(im)+'</b></div>')+
 '<div class="stk" style="margin-top:8px">Saldo masuk toko sama dengan Penghasilan Akhir di Rincian Penghasilan Shopee jika tarif cocok. Ongkir subsidi Shopee tidak dihitung.</div></details>'}
function hrCol(h){var c={sku:-1,n:-1,ha:-1,hd:-1};h=h.map(function(x){return String(x).trim().toLowerCase()});
 h.forEach(function(x,i){if(c.sku<0&&/^sku$/.test(x))c.sku=i});h.forEach(function(x,i){if(c.sku<0&&/^(kode|kode produk|sku)/.test(x))c.sku=i});
 h.forEach(function(x,i){if(c.n<0&&/^(nama|nama produk|produk)$/.test(x))c.n=i});
 h.forEach(function(x,i){if(c.hd<0&&/(harga diskon|harga promo|harga akhir|discount|promo price)/.test(x))c.hd=i});
 h.forEach(function(x,i){if(c.ha<0&&/(harga awal|harga normal|harga asli|original)/.test(x))c.ha=i});
 h.forEach(function(x,i){if(c.ha<0&&c.hd!==i&&/^(harga|price)$/.test(x))c.ha=i});return c}
function hrSync(t){var d=parseCsv(t);if(parseCsv.bad){toast('Ada tanda kutip (") yang tidak ditutup di file. Periksa file lalu coba lagi');return}
 if(/^\s*</.test(t)||d.length<2){toast('Isi file tidak terbaca. Pastikan formatnya CSV');return}
 var c=hrCol(d[0]);
 if((c.ha<0&&c.hd<0)||(c.sku<0&&c.n<0)){toast('Baris pertama harus judul: SKU atau Nama, serta Harga awal dan/atau Harga diskon');return}
 var old=State.rows.map(strip),by={},bn={};
 old.forEach(function(r){var k=(r.sku||'').trim().toLowerCase(),n=(r.n||'').trim().toLowerCase();if(k&&!by[k])by[k]=r;if(n&&!bn[n])bn[n]=r});
 var up={},miss=0;
 d.slice(1).forEach(function(x){var k=c.sku>=0?String(x[c.sku]||'').trim().toLowerCase():'',n=c.n>=0?String(x[c.n]||'').trim().toLowerCase():'',r=(k&&by[k])||(n&&bn[n]);
  if(!r){if(k||n)miss++;return}
  var ha=c.ha>=0?num(x[c.ha]==null?'':x[c.ha]):0,hd=c.hd>=0?num(x[c.hd]==null?'':x[c.hd]):0;
  if(ha>0||hd>0)up[r.id]={r:r,ha:ha,hd:hd}});
 var L=Object.keys(up).map(function(k){return up[k]});
 if(!L.length){toast('Tidak ada produk yang cocok. Cek SKU atau nama di file');return}
 ask('Isi harga aktual Shopee di '+L.length+' produk.'+(miss>0?' '+miss+' baris file tidak cocok dengan produk Anda dan dilewati.':'')+' Lanjutkan?','Ya, isi harga',function(){
  L.forEach(function(u){if(u.ha>0)u.r.ha=u.ha;if(u.hd>0)u.r.hd=u.hd});
  State.rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});upd(true);srt();toast('Harga aktual terisi di '+L.length+' produk')})}
function hrGo(){var u=$('hru').value.trim(),b=$('hrb');
 if(!/^https?:\/\//i.test(u)){toast('Isi link Google Sheet atau CSV, diawali https://');return}
 if(!window.fetch){toast('Browser tidak mendukung. Pakai file CSV');return}
 try{KStore.setItem('kalsara_hr_url',u)}catch(e){}
 b.disabled=true;b.textContent='Mengambil data...';
 var done=function(){b.disabled=false;b.textContent='Ambil harga aktual'};
 fetch(syUrl(u),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){done();hrSync(t)},function(){done();toast('Gagal mengambil. Cek link, koneksi, dan izin akses sheet')})}
$('hrb').onclick=hrGo;
$('hrc').onclick=function(){$('hrf').click()};
$('hrf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){hrSync(String(fr.result))};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};
 return {tab:function(){return tab.apply(null,arguments)},parseCsv:parseCsv,wrapTab:function(mk){tab=mk(tab)},salesRows:salesRows,copySales:copySales,showCpBox:showCpBox,dl:dl,csv:csv,actNote:actNote,actL:actL,bdH:bdH,acH:acH,actRin:actRin,hrSync:hrSync};
}
