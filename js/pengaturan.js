/* Pengaturan toko: catatan perubahan tarif, kolom pengaturan (data-k), reset bawaan, tema, bantuan, onboarding, dan pengikat tab/Cek tarif (v9.40, Tahap 4).
 * Dulu: separuh bagian "80-cadangan-tema" di js/app-core.js. Kini modul ES dengan dependensi eksplisit; isi fungsi disalin APA ADANYA.
 * tab dan tchk adalah variabel milik app-core yang dibungkus ulang (dulu ditimpa langsung); kini modul ini meminta app-core membungkusnya
 * lewat wrapTab/wrapTchk, dan memanggil tab lewat fungsi pembaca agar selalu mendapat versi terbaru. */
import {State} from './state.js';
import {KStore} from './storage.js';
import * as KDOM from './dom.js';
import {pf, fmt, PCT, today} from './format.js';
import {esc, dtx} from './helpers.js';
import {createTheme} from './theme.js';

export function createPengaturan({$, DEF, ask, toast, fill, upd, paSync, clearMark, vfKeep, vgSync, tab, wrapTab, wrapTchk}) {
/*5.23: catatan perubahan tarif (disimpan di pengaturan dan ikut cadangan)*/
function tlOk(x){return x&&/^\d{4}-\d{2}-\d{2}$/.test(x.d||'')&&typeof x.t=='string'&&x.t}
function tlRender(){var L=(Array.isArray(State.A.tlog)?State.A.tlog:[]).filter(tlOk),e=$('tll');if(!e)return;
 KDOM.setHTML(e, L.length?L.map(function(x,i){return '<div class="rw" style="align-items:center;border-bottom:1px solid var(--line);padding:8px 2px"><span style="min-width:0;word-break:break-word">'+dtx(x.d)+' '+x.d.slice(0,4)+': '+esc(x.t)+'</span><button class="x" type="button" data-tld="'+i+'" aria-label="Hapus catatan" style="flex:0 0 40px;height:40px">&#10005;</button></div>'}).join(''):'<div class="stk" style="margin:12px 2px 0">Belum ada catatan perubahan tarif.</div>')}
function tlLast(){var L=(Array.isArray(State.A.tlog)?State.A.tlog:[]).filter(tlOk);return L[0]||null}
$('tla').onclick=function(){var t=$('tlt').value.trim().slice(0,200),d=$('tld').value||today();if(!t){toast('Tulis isi perubahan dulu');return}
 var L=(Array.isArray(State.A.tlog)?State.A.tlog:[]).filter(tlOk).slice();L.push({d:d,t:t});L.sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0});State.A.tlog=L.slice(0,50);$('tlt').value='';upd(true);tlRender();toast('Perubahan tarif dicatat')};
$('tll').addEventListener('click',function(e){var b=e.target.closest('[data-tld]');if(!b)return;var L=(Array.isArray(State.A.tlog)?State.A.tlog:[]).filter(tlOk);L.splice(+b.dataset.tld,1);State.A.tlog=L;upd(true);tlRender();toast('Catatan dihapus')});
document.querySelectorAll('[data-k]').forEach(function(el){
 el.addEventListener('input',function(){
  var k=el.dataset.k;
  if(el.tagName=='SELECT'){State.A[k]=el.value;if(k=='pa')paSync();if(k=='tp'){State.A.pb=el.value=='ml'?1.8:0;fill()}if(k=='pp'){if(el.value!='man'){State.A.px=el.value=='no'?0:el.value=='x'?4.5:6.5;State.A.cp=el.value=='xp'?80000:60000}syncVL();fill()}if(k=='vp'||k=='lp'){syncVL();fill()}}
  else if(el.type=='date'){State.A[k]=el.value;if(k=='tchk'&&State.A.ver&&State.A.ver.ok)State.A.ver=null}else{var v=pf(el.value,PCT.indexOf(k)>=0);State.A[k]=isNaN(v)||v<0?0:v;if(PCT.indexOf(k)>=0&&State.A[k]>100){State.A[k]=100;el.value='100'}}
  if(k=='px'){State.A.pp=State.A.px>0?'man':'no';$('pp').value=State.A.pp;syncVL(1)}else if(k=='cp'){if(State.A.pp!='no'){State.A.pp='man';$('pp').value='man'}syncVL(1)}if(k=='vx'){State.A.vp='man';$('vp').value='man'}if(k=='lv'){State.A.lp='man';$('lp').value='man'}
  upd(true)})});
function syncVL(u){if(State.A.vp=='no')State.A.vx=0;else if(State.A.vp=='auto')State.A.vx=State.A.pp=='no'?3:2;if(State.A.lp=='no')State.A.lv=0;else if(State.A.lp=='auto')State.A.lv=State.A.pp=='no'?3:2;if(u)['vx','lv'].forEach(function(i){if(document.activeElement!==$(i))$(i).value=fmt(State.A[i])})}
$('def').onclick=function(){ask('Kembalikan semua pengaturan toko dan tarif ke bawaan? Tabel tarif kustom dan status cek tarif ikut direset, jadi harga jual produk bisa berubah. Data produk dan catatan perubahan tarif tidak terhapus.','Ya, kembalikan',function(){State.A=Object.assign({},DEF,{tlog:State.A.tlog});fill();upd(true);toast('Pengaturan dikembalikan')})};
createTheme({$,KStore,KDOM,toast,document});
$('hp').onclick=function(){var p=$('hpt');p.hidden=!p.hidden;this.setAttribute('aria-expanded',String(!p.hidden))};
function obDone(){$('ob').hidden=true;try{KStore.setItem('kalsara_ob','1')}catch(e){}}
function obInit(){var ok=null;try{ok=KStore.getItem('kalsara_ob')}catch(e){}if(ok||State.rows.some(function(r){return r.m>0}))return;
 [['obc','ac'],['obg','gc']].forEach(function(x){var e=$(x[0]);KDOM.copyChildren(e, $(x[1]));e.querySelectorAll('option[value="man"]').forEach(function(o){o.remove()});e.value=State.A[x[1]]});
 $('obt').value=State.A.tp;$('ob').hidden=false}
$('obs').onclick=function(){State.A.tp=$('obt').value;State.A.pb=State.A.tp=='ml'?1.8:0;State.A.ac=$('obc').value;State.A.gc=$('obg').value;fill();upd(true);obDone();toast('Pengaturan toko tersimpan')};
$('obx').onclick=obDone;
wrapTchk(function(_tchk){return function(){_tchk();var w=$('tw'),m=$('tw0'),lg=tlLast();if(!w.hidden){if(lg)w.textContent+=' Perubahan tarif terakhir dicatat '+dtx(lg.d)+': '+lg.t+'.';w.textContent+=' Ketuk untuk membuka Cek tarif.'}m.hidden=w.hidden;m.textContent=w.textContent;$('t5').classList.toggle('dot',!w.hidden);vgSync();if(!$('v5').hidden){var m5=$('tw5');m5.hidden=w.hidden;m5.textContent=w.textContent.replace(' Ketuk untuk membuka Cek tarif.','').replace('Perbaiki di tab Tarif','Perbaiki di bawah').replace('di tab Tarif','di bawah')}}});
function openVerify(){tab(5);var d=$('vfd');d.open=true;vfKeep();setTimeout(function(){d.scrollIntoView({behavior:'smooth',block:'start'})},60)}
['tw','tw0'].forEach(function(id){var e=$(id);e.setAttribute('role','button');e.tabIndex=0;e.addEventListener('click',openVerify);e.addEventListener('keydown',function(ev){if(ev.key=='Enter'||ev.key==' '){ev.preventDefault();openVerify()}})});
var TI={t0:'v0',t1:'v1',t3:'v3',t4:'v4',t5:'v5',t6:'v6',t2:'v2'},TO=['t0','t1','t3','t4','t5','t6','t2'];
wrapTab(function(_tab){return function(i){if(i!=1)clearMark();_tab(i);$('v5').hidden=i!=5;$('t5').setAttribute('aria-selected',i==5);if(i==5){vgSync();vfKeep();if(!$('tld').value)$('tld').value=today();var w=$('tw'),m=$('tw5');m.hidden=w.hidden;m.textContent=w.textContent.replace(' Ketuk untuk membuka Cek tarif.','').replace('Perbaiki di tab Tarif','Perbaiki di bawah').replace('di tab Tarif','di bawah')}TO.forEach(function(id){var b=$(id);b.tabIndex=b.getAttribute('aria-selected')=='true'?0:-1})}});
TO.forEach(function(id){$(id).setAttribute('aria-controls',TI[id]);$(TI[id]).setAttribute('role','tabpanel');$(TI[id]).setAttribute('aria-labelledby',id)});
$('t0').parentNode.addEventListener('keydown',function(e){var c=TO.indexOf(document.activeElement.id);if(c<0)return;var n=e.key=='ArrowRight'?(c+1)%7:e.key=='ArrowLeft'?(c+6)%7:e.key=='Home'?0:e.key=='End'?6:-1;if(n<0)return;e.preventDefault();$(TO[n]).click();$(TO[n]).focus()});
return {tlOk, tlRender, syncVL, TO, obInit};
}
