function fill(){tblSync();paSync();refreshLabels();document.querySelectorAll('[data-k]').forEach(function(el){el.value=fmt(A[el.dataset.k])});fillT();tlRender()}
/*5.23: catatan perubahan tarif (disimpan di pengaturan dan ikut cadangan)*/
function tlOk(x){return x&&/^\d{4}-\d{2}-\d{2}$/.test(x.d||'')&&typeof x.t=='string'&&x.t}
function tlRender(){var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk),e=$('tll');if(!e)return;
 KDOM.setHTML(e, L.length?L.map(function(x,i){return '<div class="rw" style="align-items:center;border-bottom:1px solid var(--line);padding:8px 2px"><span style="min-width:0;word-break:break-word">'+dtx(x.d)+' '+x.d.slice(0,4)+': '+esc(x.t)+'</span><button class="x" type="button" data-tld="'+i+'" aria-label="Hapus catatan" style="flex:0 0 40px;height:40px">&#10005;</button></div>'}).join(''):'<div class="stk" style="margin:12px 2px 0">Belum ada catatan perubahan tarif.</div>')}
function tlLast(){var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk);return L[0]||null}
$('tla').onclick=function(){var t=$('tlt').value.trim().slice(0,200),d=$('tld').value||today();if(!t){toast('Tulis isi perubahan dulu');return}
 var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk).slice();L.push({d:d,t:t});L.sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0});A.tlog=L.slice(0,50);$('tlt').value='';upd(true);tlRender();toast('Perubahan tarif dicatat')};
$('tll').addEventListener('click',function(e){var b=e.target.closest('[data-tld]');if(!b)return;var L=(Array.isArray(A.tlog)?A.tlog:[]).filter(tlOk);L.splice(+b.dataset.tld,1);A.tlog=L;upd(true);tlRender();toast('Catatan dihapus')});
document.querySelectorAll('[data-k]').forEach(function(el){
 el.addEventListener('input',function(){
  var k=el.dataset.k;
  if(el.tagName=='SELECT'){A[k]=el.value;if(k=='pa')paSync();if(k=='tp'){A.pb=el.value=='ml'?1.8:0;fill()}if(k=='pp'){if(el.value!='man'){A.px=el.value=='no'?0:el.value=='x'?4.5:6.5;A.cp=el.value=='xp'?80000:60000}syncVL();fill()}if(k=='vp'||k=='lp'){syncVL();fill()}}
  else if(el.type=='date'){A[k]=el.value;if(k=='tchk'&&A.ver&&A.ver.ok)A.ver=null}else{var v=pf(el.value,PCT.indexOf(k)>=0);A[k]=isNaN(v)||v<0?0:v;if(PCT.indexOf(k)>=0&&A[k]>100){A[k]=100;el.value='100'}}
  if(k=='px'){A.pp=A.px>0?'man':'no';$('pp').value=A.pp;syncVL(1)}else if(k=='cp'){if(A.pp!='no'){A.pp='man';$('pp').value='man'}syncVL(1)}if(k=='vx'){A.vp='man';$('vp').value='man'}if(k=='lv'){A.lp='man';$('lp').value='man'}
  upd(true)})});
function syncVL(u){if(A.vp=='no')A.vx=0;else if(A.vp=='auto')A.vx=A.pp=='no'?3:2;if(A.lp=='no')A.lv=0;else if(A.lp=='auto')A.lv=A.pp=='no'?3:2;if(u)['vx','lv'].forEach(function(i){if(document.activeElement!==$(i))$(i).value=fmt(A[i])})}
$('def').onclick=function(){ask('Kembalikan semua pengaturan toko dan tarif ke bawaan? Tabel tarif kustom dan status cek tarif ikut direset, jadi harga jual produk bisa berubah. Data produk dan catatan perubahan tarif tidak terhapus.','Ya, kembalikan',function(){A=Object.assign({},DEF,{tlog:A.tlog});fill();upd(true);toast('Pengaturan dikembalikan')})};
function bkText(lt){try{var sn=snapState();if(lt)delete sn.sl;return JSON.stringify(sn)}catch(e){return null}}
/*5.81: cadangan lengkap = data utama + data ERP dalam satu file. Cadangan ringan tidak memuat ERP*/
function bkFull(lt){return Backup.full(lt)}
function bkDo(lt,use){bkFull(lt).then(function(r){if(!r.t){toast('Gagal membuat cadangan');return}
 if(r.err){ask('Data ERP tidak bisa dibaca ('+r.err+'). Cadangan ini HANYA memuat data utama (produk, promo, penjualan), bukan data ERP. Lanjutkan?','Ya, tanpa ERP',function(){use(r)});return}
 use(r)})}
$('bk').onclick=function(){bkDo(false,function(r){dl('cadangan-kalsara-'+today()+'.txt',r.t,'text/plain;charset=utf-8','Salin cadangan');bkMark()})};
function bpInfo(){var n=$('bpt').value.length;$('bpm').textContent=n?n.toLocaleString('id-ID')+' karakter di kotak.':''}
/*5.22: bagikan cadangan lewat menu bagikan HP; jika tidak tersedia, jatuh ke unduhan biasa*/
$('bsh').onclick=function(){bkDo(false,function(r){var t=r.t,
 nm='cadangan-kalsara-'+today()+'.txt',fb=function(){toast('Menu bagikan tidak tersedia di sini. Cadangan diunduh sebagai gantinya.');dl(nm,t,'text/plain;charset=utf-8','Salin cadangan');bkMark()};
 try{var f=new File([t],nm,{type:'text/plain'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Cadangan Kalsara'}).then(function(){bkMark();toast('Cadangan dibagikan')},function(e){if(e&&e.name=='AbortError')toast('Dibatalkan');else fb()});return}}catch(e){}
 fb()})};
function showBp(txt){$('bpw').hidden=false;if(txt!==undefined)$('bpt').value=txt;bpInfo();$('bpt').focus()}
$('bpt').addEventListener('input',bpInfo);
function copyBk(lt){bkDo(lt,function(r){var t=r.t;
 var man=function(){showBp(t);toast('Salin manual dari kotak teks')};
 try{navigator.clipboard.writeText(t).then(function(){bkMark();showBp(t);$('bpm').textContent=t.length.toLocaleString('id-ID')+' karakter tersalin. Setelah menempel, jumlah karakter di kotak harus sama.';toast('Cadangan tersalin ('+Math.round(t.length/1000)+' rb karakter)')},man)}catch(e){man()}})}
$('bc').onclick=function(){copyBk(false)};
$('bkrn').onclick=function(){$('bsh').onclick()};
$('bkrl').onclick=function(){try{KStore.setItem(BK_SNZ,String(Date.now()+864e5))}catch(e){}$('bkr').hidden=true;toast('Diingatkan lagi besok')};
document.addEventListener('visibilitychange',function(){if(!document.hidden)bkRemind()});
$('bcl').onclick=function(){copyBk(true)};
$('bp').onclick=function(){showBp('')};
$('bpg').onclick=function(){var v=$('bpt').value.trim();if(!v){toast('Tempel teks cadangan dulu');return}restoreText(v)};
/*5.20: toleran BOM dan teks tambahan di sekitar cadangan, mendeteksi teks terpotong, menampilkan ringkasan sebelum memulihkan, dan mempertahankan penjualan jika cadangan ringan*/
function bpFail(m){if(!$('bpw').hidden)$('bpm').textContent=m;toast(m)}
const Backup=createBackup({
 parseBackupText:parseBackupText,
 snapshotState:snapState,
 /*v9.32.1: ERP baru dipasang di 90-erp.js (SESUDAH bagian ini). Dulu `ERP:ERP` menyalin nilai undefined saat muat, sehingga cadangan penuh (ERP.dump) dan pemulihan cadangan ber-ERP (ERP.check/restore) error sejak v9.18. Dibungkus late-bound: ERP dibaca saat dipanggil.*/
 ERP:{dump:function(){return ERP.dump.apply(ERP,arguments)},check:function(){return ERP.check.apply(ERP,arguments)},restore:function(){return ERP.restore.apply(ERP,arguments)}},
 getSales:function(){return SALES},
 applyState:applyState,
 persist:persist,
 ask:ask,
 toast:toast,
 onFailure:bpFail,
 onRestored:function(){ $('bpw').hidden=true;$('bpt').value='';$('bpm').textContent=''; }
});
function restoreText(txt){Backup.restoreText(txt)}
$('rs').onclick=function(){$('bf').click()};
$('bf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){restoreText(fr.result)};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};
function snapState(){return{A:A,rows:rows.map(strip),pr:PRM,sl:SALES,ts:TS}}
/*v5.14: manajemen kuota. SALES_DAYS = usia maksimum riwayat penjualan (hari; 0 = nonaktif). Bila browser menolak simpan (QuotaExceededError), 10% riwayat terlama dibuang lalu simpan diulang.*/
var SALES_MAX=5000,SALES_DAYS=730,qWarn=0;
function isQuota(e){return !!e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22||e.code===1014)}
function pruneAge(){if(!(SALES_DAYS>0)||!SALES.length)return 0;var cut=ymd(new Date(Date.now()-SALES_DAYS*864e5)),n=SALES.length;SALES=SALES.filter(function(s){return !s.d||s.d>=cut});return n-SALES.length}
function lsave(){var K='kalsara_v3';
 try{KStore.setItem(K,JSON.stringify(snapState()));return true}catch(e){if(!isQuota(e))return false}
 /*kuota penuh: coba simpan dengan riwayat terpangkas (10% terlama per putaran); SALES asli baru dipangkas bila penyimpanan terbukti berhasil*/
 var keep=SALES.length;
 for(var t=0;t<12&&keep>0;t++){keep=Math.max(0,keep-Math.max(200,Math.ceil(keep*.1)));
  try{var sn=snapState();sn.sl=SALES.slice(SALES.length-keep);KStore.setItem(K,JSON.stringify(sn));
   var gone=SALES.length-keep;SALES.splice(0,gone);if(typeof toast=='function')toast(gone+' catatan penjualan terlama dihapus karena penyimpanan perangkat penuh. Ekspor CSV di tab Laporan untuk arsip.');return true}
  catch(e){if(!isQuota(e))return false}}
 if(Date.now()-qWarn>30000){qWarn=Date.now();if(typeof toast=='function')toast('Penyimpanan perangkat penuh, perubahan belum tersimpan. Ekspor cadangan sekarang.')}
 return false}
/*5.63: pencatat waktu cadangan, status penyimpanan yang jelas, dan pengingat cadangan berkala. Kunci terpisah dari data utama.*/
var BK_KEY='kalsara_lastbk',BK_SNZ='kalsara_bksnooze',BK_DAYS=7;
function bkLast(){try{return +KStore.getItem(BK_KEY)||0}catch(e){return 0}}
function bkMark(){try{KStore.setItem(BK_KEY,String(Date.now()));KStore.removeItem(BK_SNZ)}catch(e){}syLocal();bkRemind()}
function bkAgo(t){var d=Math.floor((Date.now()-t)/864e5);return d<=0?'hari ini':d==1?'kemarin':d+' hari lalu'}
function hasData(){return rows.some(function(r){return r.m>0})||SALES.length>0||PRM.length>0}
function syLocal(){var t=bkLast();sy('Tersimpan di perangkat ini. '+(t?'Cadangan terakhir: '+bkAgo(t)+'.':'Belum pernah dicadangkan.'))}
function bkRemind(){var b=$('bkr');if(!b)return;var t=bkLast(),age=t?(Date.now()-t)/864e5:1e9,snz=0;try{snz=+KStore.getItem(BK_SNZ)||0}catch(e){}
 var need=hasData()&&age>=BK_DAYS&&Date.now()>snz;
 b.hidden=!need;if(need)$('bkrt').textContent=t?'Cadangan terakhir '+bkAgo(t)+'. Data hanya ada di HP ini, jadi simpan cadangan sekarang agar aman jika browser dibersihkan atau HP diganti.':'Data Anda belum pernah dicadangkan. Data hanya ada di HP ini, jadi simpan cadangan sekarang agar aman jika browser dibersihkan atau HP diganti.'}
function sy(t){$('sy').textContent=t}
var ref=null,tm=null;
var lt=null;function lflush(){if(lt!==null){clearTimeout(lt);lt=null;lsave()}}
function persist(){VoucherRules.reset();CalcCache.invalidate();TS=Date.now();clearTimeout(lt);lt=setTimeout(lflush,350);clearTimeout(tm);tm=setTimeout(push,700)}
document.addEventListener('visibilitychange',function(){if(document.hidden)lflush()});window.addEventListener('pagehide',lflush);
function push(){if(!ref)return;sy('Menyimpan...');ref.set({json:JSON.stringify(snapState())}).then(function(){sy('Tersinkron ke akun Anda')},function(){syLocal()})}
function applyState(d){
 var a=d.A||{};if(a.vx===undefined&&a.vd!==undefined){a.vx=a.vd;a.lv=0}if(a.cvx===undefined&&a.cv!==undefined){a.cvx=a.cv;a.clv=a.cv}delete a.vd;delete a.cv;
 (d.rows||[]).forEach(function(x){if(x.o&&x.o.vd!==undefined){if(x.o.vx===undefined)x.o.vx=x.o.vd;delete x.o.vd}});
 if(a.vp===undefined)a.vp=a.vx>0?'man':'no';if(a.lp===undefined)a.lp=a.lv>0?'man':'no';if(a.pp==='no'&&a.px>0)a.pp='man';if(a.sh===undefined){a.sh=5;if(!(a.sl>=10))a.sl=10}A=Object.assign({},DEF,a);TS=d.ts||0;SALES=Array.isArray(d.sl)?d.sl.slice(-SALES_MAX):[];var pa=pruneAge();if(pa&&typeof toast=='function')setTimeout(function(){toast(pa+' catatan penjualan lebih dari '+Math.round(SALES_DAYS/365)+' tahun dibersihkan otomatis')},1200);VoucherRules.reset();CalcCache.invalidate();PRM=(Array.isArray(d.pr)?d.pr.slice(0,300):[]).map(migPt);rows=[];KDOM.setHTML($('list'), '');
 (d.rows||[]).slice(0,ROW_MAX).forEach(function(x){add(x)});if(!rows.length)add();
 fill();upd(false);prRender();lsave()}
createTheme({$,KStore,KDOM,toast,document});
$('hp').onclick=function(){var p=$('hpt');p.hidden=!p.hidden;this.setAttribute('aria-expanded',String(!p.hidden))};
function obDone(){$('ob').hidden=true;try{KStore.setItem('kalsara_ob','1')}catch(e){}}
function obInit(){var ok=null;try{ok=KStore.getItem('kalsara_ob')}catch(e){}if(ok||rows.some(function(r){return r.m>0}))return;
 [['obc','ac'],['obg','gc']].forEach(function(x){var e=$(x[0]);KDOM.copyChildren(e, $(x[1]));e.querySelectorAll('option[value="man"]').forEach(function(o){o.remove()});e.value=A[x[1]]});
 $('obt').value=A.tp;$('ob').hidden=false}
$('obs').onclick=function(){A.tp=$('obt').value;A.pb=A.tp=='ml'?1.8:0;A.ac=$('obc').value;A.gc=$('obg').value;fill();upd(true);obDone();toast('Pengaturan toko tersimpan')};
$('obx').onclick=obDone;
var _tchk=tchk;
tchk=function(){_tchk();var w=$('tw'),m=$('tw0'),lg=tlLast();if(!w.hidden){if(lg)w.textContent+=' Perubahan tarif terakhir dicatat '+dtx(lg.d)+': '+lg.t+'.';w.textContent+=' Ketuk untuk membuka Cek tarif.'}m.hidden=w.hidden;m.textContent=w.textContent;$('t5').classList.toggle('dot',!w.hidden);vgSync();if(!$('v5').hidden){var m5=$('tw5');m5.hidden=w.hidden;m5.textContent=w.textContent.replace(' Ketuk untuk membuka Cek tarif.','').replace('Perbaiki di tab Tarif','Perbaiki di bawah').replace('di tab Tarif','di bawah')}};
function openVerify(){tab(5);var d=$('vfd');d.open=true;vfKeep();setTimeout(function(){d.scrollIntoView({behavior:'smooth',block:'start'})},60)}
['tw','tw0'].forEach(function(id){var e=$(id);e.setAttribute('role','button');e.tabIndex=0;e.addEventListener('click',openVerify);e.addEventListener('keydown',function(ev){if(ev.key=='Enter'||ev.key==' '){ev.preventDefault();openVerify()}})});
var _tab=tab,TI={t0:'v0',t1:'v1',t3:'v3',t4:'v4',t5:'v5',t6:'v6',t2:'v2'},TO=['t0','t1','t3','t4','t5','t6','t2'];
tab=function(i){if(i!=1)clearMark();_tab(i);$('v5').hidden=i!=5;$('t5').setAttribute('aria-selected',i==5);if(i==5){vgSync();vfKeep();if(!$('tld').value)$('tld').value=today();var w=$('tw'),m=$('tw5');m.hidden=w.hidden;m.textContent=w.textContent.replace(' Ketuk untuk membuka Cek tarif.','').replace('Perbaiki di tab Tarif','Perbaiki di bawah').replace('di tab Tarif','di bawah')}TO.forEach(function(id){var b=$(id);b.tabIndex=b.getAttribute('aria-selected')=='true'?0:-1})};
TO.forEach(function(id){$(id).setAttribute('aria-controls',TI[id]);$(TI[id]).setAttribute('role','tabpanel');$(TI[id]).setAttribute('aria-labelledby',id)});
$('t0').parentNode.addEventListener('keydown',function(e){var c=TO.indexOf(document.activeElement.id);if(c<0)return;var n=e.key=='ArrowRight'?(c+1)%7:e.key=='ArrowLeft'?(c+6)%7:e.key=='Home'?0:e.key=='End'?6:-1;if(n<0)return;e.preventDefault();$(TO[n]).click();$(TO[n]).focus()});
