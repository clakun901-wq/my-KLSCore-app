/*5.73 (khusus Shopee): modul Micro-ERP (tab ERP): impor CSV Shopee, OpEx, Laba Rugi makro. Data di IndexedDB KalsaraERP, terpisah dari data lama (KStore). HPP diambil dari modal produk (SKU cocok).*/
var ERP=(function(){
var RAW=[],ITM={},OPX=[],SNAP={},MODE='',/*MODE dulu diisi saat membuka IndexedDB; deklarasinya hilang saat migrasi sehingga tab ERP dan dump() error*/CAT=['Gaji Karyawan / Admin','Sewa Tempat','Utilitas (Listrik, Air, Internet)','Pemasaran Eksternal','Perlengkapan Packing & Lain-lain'];
var ST=['products','inventory_logs','marketplaces_raw','opex','settings','order_items'];
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function rp(n){return(n<0?'-':'')+'Rp'+Math.round(Math.abs(n)).toLocaleString('id-ID')}
var MEM={};
function fbGet(s){
 if(MEM[s])return MEM[s];
 var o={};try{o=JSON.parse(KStore.getItem('kalsara_erp_'+s)||'{}')}catch(e){}
 return MEM[s]=o;
}
function fbSave(s){
 KStore.setItem('kalsara_erp_'+s,JSON.stringify(MEM[s]));
 return KStore.flush();
}
var FBERR='Penyimpanan ERP gagal. Periksa ruang penyimpanan perangkat dan buat cadangan data.';
function open(){return Promise.resolve(null)}
function all(s){if(typeof KStore.erpAll==='function')return KStore.erpAll(s);var m=fbGet(s);return Promise.resolve(Object.keys(m).map(function(k){return m[k]}))}
function put(s,list){
 var old=Object.assign({},fbGet(s)),m=Object.assign({},old);
 list.forEach(function(x){m[x.id]=x});
 MEM[s]=m;
 var save=typeof KStore.erpPut==='function'?KStore.erpPut(s,list):fbSave(s);
 return save.catch(function(e){MEM[s]=old;KStore.setItem('kalsara_erp_'+s,JSON.stringify(old));throw e});
}
function del(s,id){
 var old=Object.assign({},fbGet(s)),m=Object.assign({},old);delete m[id];MEM[s]=m;
 var save=typeof KStore.erpDelete==='function'?KStore.erpDelete(s,id):fbSave(s);
 return save.catch(function(e){MEM[s]=old;KStore.setItem('kalsara_erp_'+s,JSON.stringify(old));throw e});
}
function clr(names){
 var old={};
 names.forEach(function(s){old[s]=Object.assign({},fbGet(s));MEM[s]={};});
 return Promise.all(names.map(function(s){return typeof KStore.erpClear==='function'?KStore.erpClear(s):fbSave(s)})).catch(function(e){
  names.forEach(function(s){MEM[s]=old[s];KStore.setItem('kalsara_erp_'+s,JSON.stringify(old[s]));});
  throw e;
 });
}
function csv(t){return globalThis.KalsaraWorker.compute('parse-csv',{text:t})}
function num(v){return globalThis.KalsaraMoney.parseIDR(v)}
function dt(v){v=String(v||'');if(/^\d{5}(\.\d+)?$/.test(v))return new Date(Math.round((+v-25569)*864e5)).toISOString().slice(0,10);var m=v.match(/(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];m=v.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);return m?m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2):''}
function ix(h,n){for(var a=0;a<n.length;a++){var i=h.indexOf(n[a]);if(i>=0)return i}return -1}
function ixs(h,p){var o=[];h.forEach(function(x,i){for(var k=0;k<p.length;k++)if(x.indexOf(p[k])==0){o.push(i);return}});return o}
function sm(r,c){return globalThis.KalsaraMoney.toSafeNumber(globalThis.KalsaraMoney.sumRupiah(c.map(function(i){return num(r[i])})))}
var G={fa:['biaya administrasi'],fr:['biaya proses pesanan'],fx:['biaya spesial gratis ongkir','biaya gratis ongkir','biaya layanan'],fp:['biaya kampanye','biaya komisi ams','biaya isi saldo otomatis','fbs fee'],fk:['premi'],ft:['pph 22'],fv:['voucher disponsor oleh penjual','cashback koin disponsori penjual','voucher co-fund','cashback koin co-fund','diskon produk dari shopee','jumlah pengembalian dana ke pembeli'],fs:['ongkir dibayar pembeli','ongkos kirim yang dibayarkan','potongan ongkos kirim','gratis ongkir dari shopee','ongkos kirim pengembalian','return to seller fee','pengembalian biaya kirim']};
var SUMK=['gross_revenue','tp','fv','fs','fa','fr','fx','fp','fk','ft','platform_fee'];
function parse(R){return globalThis.KalsaraWorker.compute('parse-shopee-report',{rows:R})}
function xlsx(buf){return globalThis.KalsaraWorker.compute('parse-xlsx',{buffer:buf},[buf])}
function kind(R){for(var i=0;i<Math.min(R.length,12);i++){var l=R[i].map(function(x){return String(x==null?'':x).trim().toLowerCase()});if(l.indexOf('no. pesanan')>=0){if(l.indexOf('harga produk')>=0)return'inc';if(l.indexOf('nomor referensi sku')>=0&&l.indexOf('jumlah')>=0)return'ord'}}return''}
function parseOrders(R){return globalThis.KalsaraWorker.compute('parse-shopee-orders',{rows:R})}
function res(x){var L=ITM[x.order_id];if(!L||!L.length)return null;var nm=(x.name||'').toLowerCase().trim(),c=L.filter(function(it){var n=(it.name||'').toLowerCase().trim();return nm&&n&&(n==nm||n.slice(0,30)==nm.slice(0,30))});
if(!c.length&&L.length==1)c=L;if(c.length>1){var p=c.filter(function(it){return Math.abs(it.price*it.q0-x.gross_revenue)<2});if(p.length)c=p}return c.length===1?c[0]:null}
function mt(x){var P=window.rows||rows,sk=String(x.sku||''),rk=String(x.rsku||'').toLowerCase(),nm=(x.name||'').toLowerCase().trim();
if(rk)for(var a=0;a<P.length;a++){if(+P[a].m>0&&(P[a].sku||'').toLowerCase()==rk)return+P[a].m}
if(sk)for(var i=0;i<P.length;i++){var r=P[i];if(+r.m>0&&((r.sku||'').toLowerCase()==sk.toLowerCase()||(r.lnk||'').indexOf(sk)>=0))return+r.m}
if(nm.length>=8)for(var j=0;j<P.length;j++){var q=P[j],n2=(q.n||'').toLowerCase().trim();if(+q.m>0&&n2.length>=8&&(n2==nm||nm.indexOf(n2)==0||n2.indexOf(nm)==0))return+q.m}return null}
function prodsLite(){return(window.rows||rows).map(function(p){return{m:p.m,sku:p.sku,lnk:p.lnk,n:p.n}})}
function calcJs(mo){return globalThis.KalsaraWorker.compute('aggregate-erp',{month:mo||'',raw:RAW,opex:OPX,items:ITM,snapshot:SNAP,products:prodsLite()})}
/*Tahap 3b: penjumlahan uang + HPP terkunci dihitung SQLite (satu lintasan/bulan); JS hanya mencocokkan modal baris tanpa snapshot. Bila SQLite tidak aktif atau ada nilai tak valid, jalur JS lama dipakai (hasil identik, diuji paritas).*/
function calcMany(ms){
 if(typeof KStore.erpReport!=='function')return Promise.all(ms.map(calcJs));
 return KStore.erpReport(ms).then(function(reps){
  if(!reps)return Promise.all(ms.map(calcJs));
  var good=reps.map(function(r){return r&&!r.fallback?r:null}),list=good.filter(Boolean),
   fin=list.length?globalThis.KalsaraWorker.compute('finish-erp-reports',{reports:list,items:ITM,products:prodsLite()}):Promise.resolve([]);
  return fin.then(function(done){var k=0;return Promise.all(ms.map(function(m,i){return good[i]?done[k++]:calcJs(m)}))})
 }).catch(function(){return Promise.all(ms.map(calcJs))})}
function calc(mo){return calcMany([mo||'']).then(function(a){return a[0]})}
/*5.82: HPP dikunci. Snapshot = nilai HPP yang sama dengan hitungan saat ini, jadi mengunci tidak mengubah angka yang tampil. Hanya baris yang punya detail pesanan dan modal yang dikunci*/
function lockHpp(mo){var add={},n=0;RAW.forEach(function(x){if(mo&&x.date.slice(0,7)!=mo)return;if(SNAP[x.id])return;var it=res(x);if(!it)return;var h=mt({sku:x.sku,rsku:it.sku,name:x.name});if(h==null)return;var q=it.qty;add[x.id]={hs:h*q,m:h,q:q,d:today()};n++});
 if(!n)return Promise.resolve(0);var nm=Object.assign({},SNAP,add);return put('settings',[{id:'hpp_snap',map:nm,upd:today()}]).then(function(){SNAP=nm;return n})}
function unlockHpp(mo){var nm=Object.assign({},SNAP),n=0;RAW.forEach(function(x){if((!mo||x.date.slice(0,7)==mo)&&nm[x.id]){delete nm[x.id];n++}});
 if(!n)return Promise.resolve(0);return put('settings',[{id:'hpp_snap',map:nm,upd:today()}]).then(function(){SNAP=nm;return n})}
function months(){var m={};RAW.concat(OPX).forEach(function(x){if(x.date)m[x.date.slice(0,7)]=1});return Object.keys(m).sort().reverse()}
async function render(){var el=$('erpm'),cur=el.value;KDOM.setHTML(el, '<option value="">Semua periode</option>'+months().map(function(m){return'<option value="'+m+'">'+m+'</option>'}).join(''));el.value=months().indexOf(cur)>=0?cur:(months()[0]||'');
var T=await calc(el.value),mk=Object.keys(T.miss),L=[['Omzet (harga produk)',T.om,1],['Voucher, diskon & pengembalian dana',T.fv],['Total HPP (modal)',-T.hpp],['Ongkir ditanggung penjual (bersih)',T.fs],['Biaya administrasi',-T.fa],['Biaya Gratis Ongkir XTRA / layanan',-T.fx],['Biaya proses pesanan',-T.fr],['Iklan, kampanye & lainnya',-T.fp],['Premi',-T.fk],['PPh 22',-T.ft],['Laba kotor',T.lk,1],['Biaya operasional (OpEx)',-T.ox],['Laba bersih korporat',T.nb,1]];
var mg=T.om>0?(T.nb/T.om*100).toFixed(1)+'%':'-';
KDOM.setHTML($('erpr'), (T.n?'':'<p class="tip">Belum ada data. Impor laporan CSV di bawah, lalu isi OpEx.</p>')+L.map(function(l){return'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);'+(l[2]?'font-weight:800':'')+'"><span>'+l[0]+'</span><span style="color:'+(l[1]<0?'var(--bad)':'inherit')+'">'+rp(l[1])+'</span></div>'}).join('')+'<p class="tip" style="margin-top:8px">Margin bersih: <b>'+mg+'</b> &middot; '+T.n+' baris produk &middot; dana dilepas Shopee '+rp(T.tp)+'</p>'+(T.n?'<p class="tip" style="margin:0">HPP: '+T.nl+' dari '+T.n+' baris memakai modal yang dikunci saat impor, sisanya memakai modal saat ini.</p>':'')+(mk.length?'<div class="nt" style="margin-top:8px">'+mk.length+' produk belum cocok dengan modal produk di Kalsara, jadi HPP-nya dihitung 0: '+esc(mk.slice(0,8).join(', '))+(mk.length>8?' ...':'')+'. Isi kolom SKU di tab Hitung dengan ID Produk Shopee (atau samakan nama produknya) dan isi modalnya, agar laba tidak terlalu tinggi.</div>':''));
if(T.nr)KDOM.insertHTML($('erpr'), 'beforeend', '<div class="nt" style="margin-top:8px">'+T.nr+' baris produk belum punya detail pesanan (SKU dan jumlah asli). Impor laporan Pesanan Selesai (Order completed) untuk periode itu agar HPP akurat.</div>');if(MODE=='fb')KDOM.insertHTML($('erpr'), 'beforeend', '<div class="nt" style="margin-top:8px">Penyimpanan permanen ERP tidak tersedia di alamat ini (aplikasi dibuka dari file lokal). Data memakai penyimpanan cadangan yang bisa hilang. Buka Kalsara lewat alamat https (GitHub Pages) agar data tersimpan aman dan tidak terpisah dari data produkmu.</div>');var mo=el.value;KDOM.setHTML($('erpo'), OPX.filter(function(x){return!mo||x.date.slice(0,7)==mo}).sort(function(a,b){return a.date<b.date?1:-1}).map(function(x){return'<div style="display:flex;gap:8px;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)"><span style="min-width:0"><b>'+esc(x.category)+'</b><br><small style="color:var(--mute)">'+x.date+(x.notes?' &middot; '+esc(x.notes):'')+'</small></span><span>'+rp(x.amount)+' <button type="button" class="gh" data-d="'+x.id+'" aria-label="Hapus" style="border:0;background:none;color:var(--bad);font-weight:700;padding:6px">Hapus</button></span></div>'}).join('')||'<p class="tip">Belum ada biaya operasional untuk periode ini.</p>')}
async function chart(){var ms=months().slice(0,6).reverse(),vals=await calcMany(ms),D=ms.map(function(m,i){var T=vals[i];return[m,T.om,T.hpp,T.ox,T.nb]}),mx=1;D.forEach(function(d){for(var i=1;i<5;i++)mx=Math.max(mx,Math.abs(d[i]))});
if(!D.length){KDOM.setHTML($('erpg'), '');return}var C=['var(--accent)','var(--mute)','var(--warn)',''];
KDOM.setHTML($('erpg'), '<div style="margin-bottom:8px;font-weight:700">Kesehatan keuangan bulanan</div><div style="display:flex;gap:10px;align-items:flex-end;overflow-x:auto;padding-bottom:4px">'+D.map(function(d){return'<div style="text-align:center;flex:1;min-width:64px"><div style="display:flex;gap:3px;align-items:flex-end;height:80px;justify-content:center">'+[1,2,3,4].map(function(i){var h=Math.max(Math.abs(d[i])/mx*78,d[i]?2:0);return'<i title="'+rp(d[i])+'" style="width:9px;height:'+h+'px;border-radius:3px 3px 0 0;background:'+(i==4?(d[i]<0?'var(--bad)':'var(--ok)'):C[i-1])+'"></i>'}).join('')+'</div><small style="color:var(--mute)">'+d[0].slice(2)+'</small></div>'}).join('')+'</div><div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-top:6px"><span>Omzet</span><span>HPP</span><span>OpEx</span><span>Laba bersih</span></div>')}
function reload(){return Promise.all([all('marketplaces_raw'),all('opex'),all('order_items'),all('settings')]).then(function(r){RAW=r[0];OPX=r[1];ITM={};r[2].forEach(function(o){(ITM[o.order_id]=ITM[o.order_id]||[]).push(o)});var sd=r[3].filter(function(o){return o&&o.id=='hpp_snap'})[0];SNAP=sd&&sd.map&&typeof sd.map==='object'&&!Array.isArray(sd.map)?sd.map:{};return Promise.all([render(),chart()])})}
async function txt(){var T=await calc($('erpm').value),z=function(v){return Math.round(v)};return'LAPORAN LABA RUGI MAKRO SHOPEE - '+($('erpm').value||'Semua periode')+'\nOmzet (harga produk)\t'+z(T.om)+'\nVoucher, diskon & pengembalian\t'+z(T.fv)+'\nTotal HPP\t'+z(-T.hpp)+'\nOngkir ditanggung penjual\t'+z(T.fs)+'\nBiaya administrasi\t'+z(-T.fa)+'\nBiaya Gratis Ongkir XTRA / layanan\t'+z(-T.fx)+'\nBiaya proses pesanan\t'+z(-T.fr)+'\nIklan, kampanye & lainnya\t'+z(-T.fp)+'\nPremi\t'+z(-T.fk)+'\nPPh 22\t'+z(-T.ft)+'\nLaba kotor\t'+z(T.lk)+'\nOpEx\t'+z(-T.ox)+'\nLaba bersih\t'+z(T.nb)}
function init(){KDOM.setHTML($('erpc'), CAT.map(function(c){return'<option>'+esc(c)+'</option>'}).join(''));$('erpd').value=today();
$('erpf').onchange=function(){var inp=this,fs=[].slice.call(inp.files),msg=[],say=function(){KDOM.setHTML($('erpi'), msg.map(esc).join('<br>'))},cur=function(t){KDOM.setHTML($('erpi'), msg.map(esc).join('<br>')+(msg.length?'<br>':'')+esc(t))};if(!fs.length)return;msg.push('Membaca '+fs.length+' file...');say();
var rb=function(f,t){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=function(){no(new Error('File tidak bisa dibaca. Salin dulu ke penyimpanan HP lalu pilih lagi'))};if(t)r.readAsText(f);else r.readAsArrayBuffer(f)})};
fs.reduce(function(pm,f){return pm.then(function(){cur(f.name+': membaca file...');var pr=/\.xlsx$/i.test(f.name)?rb(f).then(xlsx):/\.xls$/i.test(f.name)?Promise.reject(new Error('Format .xls lama tidak didukung. Unduh ulang sebagai .xlsx')):rb(f,1).then(function(tx){if(/^\s*\{\s*"A"\s*:/.test(String(tx).replace(/^\uFEFF/,'')))throw new Error('Ini file cadangan Kalsara, bukan laporan Shopee. Pulihkan lewat Setelan, Cadangan data, Pulihkan dari cadangan.');return csv(tx)});
return pr.then(function(R){cur(f.name+': mengurai isi...');var k=kind(R);if(k=='inc'){return parse(R).then(function(p){cur(f.name+': menyimpan...');return put('marketplaces_raw',p.rows).then(function(){msg.push(f.name+': laporan penghasilan, '+p.rows.length+' baris produk dari '+p.orders+' pesanan, dana dilepas '+rp(p.tp)+' (cocokkan dengan Total yang Dilepas di Ringkasan)')})})}
if(k=='ord'){return parseOrders(R).then(function(o){cur(f.name+': menyimpan...');return put('order_items',o.rows).then(function(){msg.push(f.name+': detail pesanan, '+o.rows.length+' baris untuk '+o.orders+' pesanan')})})}
throw new Error('Jenis file tidak dikenali (butuh Laporan Penghasilan atau Order completed)')}).catch(function(e){msg.push(f.name+': GAGAL, '+(e&&e.message||e))}).then(say)})},Promise.resolve())
.then(reload).then(function(){return lockHpp('').catch(function(e){msg.push('HPP belum bisa dikunci: '+(e&&e.message||e));return 0})}).then(function(n){if(n){msg.push('HPP dikunci untuk '+n+' baris (memakai modal saat ini, angka laporan tidak berubah)');return reload()}}).then(function(){msg.push('Selesai');say();toast('Impor selesai')}).catch(function(e){msg.push('Gagal: '+(e&&e.message||e));say()}).then(function(){inp.value=''})};
$('erpa').onclick=function(){var a=num($('erpn').value);if(!(a>0)||!$('erpd').value){toast('Isi tanggal dan nominal');return}put('opex',[{id:'o'+Date.now(),date:$('erpd').value,category:$('erpc').value,amount:a,notes:$('erpt').value.trim()}]).then(reload).then(function(){$('erpn').value='';$('erpt').value='';toast('OpEx tersimpan')}).catch(function(e){toast('OpEx gagal disimpan: '+(e&&e.message||e))})};
$('erpo').onclick=function(e){var d=e.target.getAttribute&&e.target.getAttribute('data-d');if(d&&confirm('Hapus biaya ini?'))del('opex',d).then(reload).catch(function(e){toast('Gagal menghapus: '+(e&&e.message||e))})};
$('erpm').onchange=function(){render().catch(function(e){toast('Laporan gagal dihitung: '+e.message)})};
$('erpk').onclick=function(){var mo=$('erpm').value;lockHpp(mo).then(function(n){return reload().then(function(){toast(n?'HPP dikunci untuk '+n+' baris':'Tidak ada baris baru yang bisa dikunci. Baris tanpa detail pesanan atau tanpa modal belum bisa dikunci')})}).catch(function(e){toast('Gagal mengunci HPP: '+(e&&e.message||e))})};
$('erpu').onclick=function(){var mo=$('erpm').value;if(!confirm('Hitung ulang HPP '+(mo||'semua periode')+' memakai modal produk saat ini? Laba periode itu akan berubah mengikuti modal terbaru.'))return;unlockHpp(mo).then(function(n){return reload().then(function(){toast(n?'HPP dihitung ulang untuk '+n+' baris':'Tidak ada HPP terkunci di periode ini')})}).catch(function(e){toast('Gagal menghitung ulang: '+(e&&e.message||e))})};
$('erpy').onclick=function(){txt().then(function(t){if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){toast('Laporan disalin')},function(){toast('Gagal menyalin')});else toast('Salin tidak didukung')}).catch(function(e){toast('Laporan gagal dihitung: '+e.message)})};
$('erpw').onclick=function(){var src=$('erpr');if(!src)return;var o=$('erpp');if(o)o.remove();var w=document.createElement('div');w.id='erpp';var h=document.createElement('h2');h.textContent='Laporan laba rugi Shopee - '+($('erpm').value||'Semua periode');var c=src.cloneNode(true);c.removeAttribute('id');w.appendChild(h);w.appendChild(c);document.body.appendChild(w);document.body.classList.add('pe');var done=function(){window.removeEventListener('afterprint',done);document.body.classList.remove('pe');var e=$('erpp');if(e)e.remove()};window.addEventListener('afterprint',done);try{window.print()}catch(e){done();toast('Cetak gagal: '+e.message)}};$('erpx').onclick=function(){txt().then(function(t){var b=new Blob(['\uFEFF'+t.replace(/\t/g,',')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='laba-rugi-'+($('erpm').value||'semua')+'.csv';document.body.appendChild(a);a.click();a.remove()}).catch(function(e){toast('Ekspor gagal: '+e.message)})};
$('erpz').onclick=function(){if(confirm('Hapus semua data impor marketplace di modul ERP? OpEx tidak ikut terhapus. HPP yang sudah dikunci tetap disimpan, jadi kalau file yang sama diimpor lagi, HPP lama dipakai.'))clr(['marketplaces_raw','order_items']).then(function(){reload();toast('Data impor dihapus')}).catch(function(e){toast('Gagal menghapus: '+(e&&e.message||e))})}}

/*5.81: cadangan lengkap ERP. Hanya field olahan yang disimpan; kolom data pribadi pembeli disaring lagi sebagai pengaman*/
var PIIK=/^(username|user_name|nama_penerima|penerima|telepon|no_telepon|phone|alamat|address|pembeli|buyer|kode_pos|kota|provinsi)/i;
function cln(o){if(!o||typeof o!=='object'||Array.isArray(o))return o;var r={};Object.keys(o).forEach(function(k){if(!PIIK.test(k))r[k]=o[k]});return r}
function dump(){return Promise.all(ST.map(function(s){return all(s)})).then(function(a){var st={},n={};ST.forEach(function(s,i){st[s]=a[i].map(cln);n[s]=st[s].length});return{v:1,mode:MODE||'idb',n:n,st:st}})}
function check(e){if(!e||typeof e!=='object'||!e.st||typeof e.st!=='object'||Array.isArray(e.st))return{ok:false,msg:'bagian data ERP di cadangan tidak valid'};var n={};
 for(var i=0;i<ST.length;i++){var s=ST[i],a=e.st[s];if(a===undefined)a=[];if(!Array.isArray(a))return{ok:false,msg:'data ERP rusak pada bagian '+s};var seen={};
  for(var j=0;j<a.length;j++){var x=a[j];if(!x||typeof x!=='object'||Array.isArray(x)||(typeof x.id!=='string'&&typeof x.id!=='number'))return{ok:false,msg:'data ERP rusak pada bagian '+s+' (baris '+(j+1)+' tidak punya ID)'};if(seen[x.id])return{ok:false,msg:'data ERP rusak pada bagian '+s+' (ID ganda)'};seen[x.id]=1}
  n[s]=a.length}
 return{ok:true,n:n}}
function restore(e){var c=check(e);if(!c.ok)return Promise.reject(new Error(c.msg));
 return open().then(function(d){
  if(!d){var old={};ST.forEach(function(s){old[s]=Object.assign({},fbGet(s))});
   var bad=false;ST.forEach(function(s){var m={};(e.st[s]||[]).forEach(function(x){m[x.id]=cln(x)});MEM[s]=m;if(!fbSave(s))bad=true});
   if(bad){ST.forEach(function(s){MEM[s]=old[s];fbSave(s)});throw new Error(FBERR+'. Data ERP lama dipertahankan')}return}
  return new Promise(function(ok,no){var t=d.transaction(ST,'readwrite');ST.forEach(function(s){var o=t.objectStore(s);o.clear();(e.st[s]||[]).forEach(function(x){o.put(cln(x))})});
   t.oncomplete=ok;t.onerror=function(){no(t.error||new Error('gagal menulis data ERP'))};t.onabort=function(){no(t.error||new Error('penulisan data ERP dibatalkan, data lama dipertahankan'))}})})
 .then(function(){return Promise.all(ST.map(function(s){return all(s)}))})
 .then(function(a){var bad=ST.filter(function(s,i){return a[i].length!==c.n[s]});if(bad.length)throw new Error('pemeriksaan setelah pemulihan gagal pada '+bad.join(', ')+'. Coba pulihkan lagi');return(ready?reload():Promise.resolve()).then(function(){return c.n})})}
var ready=false;function show(){if(!ready){ready=true;init()}reload().catch(function(e){KDOM.setHTML($('erpr'), '<div class="nt">Penyimpanan ERP tidak bisa dibuka: '+esc(e.message)+'</div>')})}
return{show:show,dump:dump,check:check,restore:restore}})();
