/* Penyimpanan, cadangan, status penyimpanan, dan pengingat cadangan Kalsara (v9.40, Tahap 4).
 * Dulu: separuh bagian "80-cadangan-tema" di js/app-core.js yang berbagi variabel global dengan bagian lain.
 * Kini: modul ES dengan dependensi eksplisit. Isi fungsi disalin APA ADANYA (tanpa perubahan logika); yang berubah hanya
 * cara ERP diterima (fasad dari app-core) dan daftar yang diekspor di bawah.
 * Kontrak penyimpanan (v9.36): KStore.setItem hanya MENGANTRIKAN tulisan; keberhasilan sungguhan baru diketahui lewat KStore.flush()
 * (lflushDurable). Jangan menyimpulkan "tersimpan" dari try/catch sinkron. */
import {State} from './state.js';
import {KStore} from './storage.js';
import * as KDOM from './dom.js';
import {today} from './format.js';
import {parseBackupText} from './backup-format.js';
import {createBackup} from './backup.js';

export function createPenyimpananCadangan({$, DEF, ROW_MAX, CalcCache, VoucherRules, ERP, add, fill, upd, ask, toast, dl, migPt, prRender, strip, ymd}) {
function bkText(lt){try{var sn=snapState();if(lt)delete sn.sl;return JSON.stringify(sn)}catch(e){return null}}
/*5.81: cadangan lengkap = data utama + data ERP dalam satu file. Cadangan ringan tidak memuat ERP*/
function bkFull(lt){return Backup.full(lt)}
function bkDo(lt,use){bkFull(lt).then(function(r){if(!r.t){toast('Gagal membuat cadangan');return}
 if(r.err){ask('Data ERP tidak bisa dibaca ('+r.err+'). Cadangan ini HANYA memuat data utama (produk, promo, penjualan), bukan data ERP. Lanjutkan?','Ya, tanpa ERP',function(){use(r)});return}
 use(r)})}
$('bk').onclick=function(){bkDo(false,function(r){dl('cadangan-wulfeg-'+today()+'.txt',r.t,'text/plain;charset=utf-8','Salin cadangan');bkMark()})};
function bpInfo(){var n=$('bpt').value.length;$('bpm').textContent=n?n.toLocaleString('id-ID')+' karakter di kotak.':''}
/*5.22: bagikan cadangan lewat menu bagikan HP; jika tidak tersedia, jatuh ke unduhan biasa*/
$('bsh').onclick=function(){bkDo(false,function(r){var t=r.t,
 nm='cadangan-wulfeg-'+today()+'.txt',fb=function(){toast('Menu bagikan tidak tersedia di sini. Cadangan diunduh sebagai gantinya.');dl(nm,t,'text/plain;charset=utf-8','Salin cadangan');bkMark()};
 try{var f=new File([t],nm,{type:'text/plain'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Cadangan Wulfeg'}).then(function(){bkMark();toast('Cadangan dibagikan')},function(e){if(e&&e.name=='AbortError')toast('Dibatalkan');else fb()});return}}catch(e){}
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
  /*v9.40: ERP diterima sebagai fasad "dibaca saat dipanggil" dari app-core, karena ERP baru dipasang di bagian 90 (sesudah modul ini dibuat); menyalin nilainya di sini akan menghasilkan undefined (galat v9.18-v9.32).*/
 ERP:ERP,
 getSales:function(){return State.SALES},
 applyState:applyState,
 persist:persist,
 ask:ask,
 toast:toast,
 onFailure:bpFail,
 onRestored:function(){ $('bpw').hidden=true;$('bpt').value='';$('bpm').textContent=''; },
 flush:lflushDurable,
 /*batas dibaca saat dipanggil (getter): SALES_MAX/PRM_MAX baru diisi di bagian bawah berkas ini*/
 limits:{get rows(){return ROW_MAX},get promos(){return PRM_MAX},get sales(){return SALES_MAX}}
});
function restoreText(txt){Backup.restoreText(txt)}
$('rs').onclick=function(){$('bf').click()};
$('bf').onchange=function(){var f=this.files[0];this.value='';if(!f)return;var fr=new FileReader();fr.onload=function(){restoreText(fr.result)};fr.onerror=function(){toast('File tidak bisa dibaca')};fr.readAsText(f)};
function snapState(){return{A:State.A,rows:State.rows.map(strip),pr:State.PRM,sl:State.SALES,ts:State.TS}}
/*v5.14: manajemen kuota. SALES_DAYS = usia maksimum riwayat penjualan (hari; 0 = nonaktif). Bila browser menolak simpan (QuotaExceededError), 10% riwayat terlama dibuang lalu simpan diulang.*/
var SALES_MAX=5000,PRM_MAX=300,SALES_DAYS=730,qWarn=0;
function isQuota(e){return !!e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22||e.code===1014)}
function pruneAge(){if(!(SALES_DAYS>0)||!State.SALES.length)return 0;var cut=ymd(new Date(Date.now()-SALES_DAYS*864e5)),n=State.SALES.length;State.SALES=State.SALES.filter(function(s){return !s.d||s.d>=cut});return n-State.SALES.length}
/*v9.36 (Tahap 0): KStore.setItem hanya MENGANTRIKAN penulisan; kegagalan penulisan sungguhan terjadi belakangan dan dilaporkan lewat KStore.flush() dan peristiwa kalsara-storage-error. try/catch di sini hanya menangkap galat sinkron (mis. penyimpanan belum siap), jadi return true berarti 'diterima antrean', BUKAN 'sudah tersimpan'. Untuk kepastian tersimpan pakai lflushDurable().*/
function saveWarn(e){if(Date.now()-qWarn>30000){qWarn=Date.now();if(typeof toast=='function')toast('Perubahan belum tersimpan: '+((e&&e.message)||'penyimpanan gagal')+'. Buat cadangan sekarang.')}}
function lsave(){var K='kalsara_v3';
 try{KStore.setItem(K,JSON.stringify(snapState()));return true}catch(e){if(!isQuota(e)){saveWarn(e);return false}}
 /*kuota penuh: coba simpan dengan riwayat terpangkas (10% terlama per putaran); SALES asli baru dipangkas bila penyimpanan terbukti berhasil*/
 var keep=State.SALES.length;
 for(var t=0;t<12&&keep>0;t++){keep=Math.max(0,keep-Math.max(200,Math.ceil(keep*.1)));
  try{var sn=snapState();sn.sl=State.SALES.slice(State.SALES.length-keep);KStore.setItem(K,JSON.stringify(sn));
   var gone=State.SALES.length-keep;State.SALES.splice(0,gone);if(typeof toast=='function')toast(gone+' catatan penjualan terlama dihapus karena penyimpanan perangkat penuh. Ekspor CSV di tab Laporan untuk arsip.');return true}
  catch(e){if(!isQuota(e))return false}}
 if(Date.now()-qWarn>30000){qWarn=Date.now();if(typeof toast=='function')toast('Penyimpanan perangkat penuh, perubahan belum tersimpan. Ekspor cadangan sekarang.')}
 return false}
/*5.63: pencatat waktu cadangan, status penyimpanan yang jelas, dan pengingat cadangan berkala. Kunci terpisah dari data utama.*/
var BK_KEY='kalsara_lastbk',BK_SNZ='kalsara_bksnooze',BK_DAYS=7;
function bkLast(){try{return +KStore.getItem(BK_KEY)||0}catch(e){return 0}}
function bkMark(){try{KStore.setItem(BK_KEY,String(Date.now()));KStore.removeItem(BK_SNZ)}catch(e){}syLocal();bkRemind()}
function bkAgo(t){var d=Math.floor((Date.now()-t)/864e5);return d<=0?'hari ini':d==1?'kemarin':d+' hari lalu'}
function hasData(){return State.rows.some(function(r){return r.m>0})||State.SALES.length>0||State.PRM.length>0}
function syLocal(){var t=bkLast();sy('Tersimpan di perangkat ini. '+(t?'Cadangan terakhir: '+bkAgo(t)+'.':'Belum pernah dicadangkan.'))}
function bkRemind(){var b=$('bkr');if(!b)return;var t=bkLast(),age=t?(Date.now()-t)/864e5:1e9,snz=0;try{snz=+KStore.getItem(BK_SNZ)||0}catch(e){}
 var need=hasData()&&age>=BK_DAYS&&Date.now()>snz;
 b.hidden=!need;if(need)$('bkrt').textContent=t?'Cadangan terakhir '+bkAgo(t)+'. Data hanya ada di HP ini, jadi simpan cadangan sekarang agar aman jika browser dibersihkan atau HP diganti.':'Data Anda belum pernah dicadangkan. Data hanya ada di HP ini, jadi simpan cadangan sekarang agar aman jika browser dibersihkan atau HP diganti.'}
function sy(t){$('sy').textContent=t}
var ref=null,tm=null;
var lt=null;function lflush(){if(lt!==null){clearTimeout(lt);lt=null;lsave()}}
/*v9.36: simpan sekarang lalu tunggu sampai benar-benar tertulis di penyimpanan tetap; menolak (reject) bila gagal.*/
function lflushDurable(){lflush();return KStore.flush()}
function persist(){VoucherRules.reset();CalcCache.invalidate();State.TS=Date.now();clearTimeout(lt);lt=setTimeout(lflush,350);clearTimeout(tm);tm=setTimeout(push,700)}
document.addEventListener('visibilitychange',function(){if(document.hidden)lflush()});window.addEventListener('pagehide',lflush);
/*v9.36: bila masih ada penulisan yang belum selesai saat halaman akan ditutup, minta konfirmasi (peramban menampilkan peringatan standarnya).*/
window.addEventListener('beforeunload',function(e){if(lt!==null)lflush();if(KStore.hasPending()){e.preventDefault();e.returnValue=''}});
function push(){if(!ref)return;sy('Menyimpan...');ref.set({json:JSON.stringify(snapState())}).then(function(){sy('Tersinkron ke akun Anda')},function(){syLocal()})}
function applyState(d){
 var a=d.A||{};if(a.vx===undefined&&a.vd!==undefined){a.vx=a.vd;a.lv=0}if(a.cvx===undefined&&a.cv!==undefined){a.cvx=a.cv;a.clv=a.cv}delete a.vd;delete a.cv;
 (d.rows||[]).forEach(function(x){if(x.o&&x.o.vd!==undefined){if(x.o.vx===undefined)x.o.vx=x.o.vd;delete x.o.vd}});
 if(a.vp===undefined)a.vp=a.vx>0?'man':'no';if(a.lp===undefined)a.lp=a.lv>0?'man':'no';if(a.pp==='no'&&a.px>0)a.pp='man';if(a.sh===undefined){a.sh=5;if(!(a.sl>=10))a.sl=10}State.A=Object.assign({},DEF,a);State.TS=d.ts||0;State.SALES=Array.isArray(d.sl)?d.sl.slice(-SALES_MAX):[];var pa=pruneAge();if(pa&&typeof toast=='function')setTimeout(function(){toast(pa+' catatan penjualan lebih dari '+Math.round(SALES_DAYS/365)+' tahun dibersihkan otomatis')},1200);VoucherRules.reset();CalcCache.invalidate();State.PRM=(Array.isArray(d.pr)?d.pr.slice(0,PRM_MAX):[]).map(migPt);State.rows=[];KDOM.setHTML($('list'), '');
 (d.rows||[]).slice(0,ROW_MAX).forEach(function(x){add(x)});if(!State.rows.length)add();
 fill();upd(false);prRender();lsave()}
return {applyState, bkRemind, lflush, persist, syLocal, SALES_MAX};
}
