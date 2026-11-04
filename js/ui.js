/* Dialog konfirmasi (ask), penutup latar (inertBg) dan toast Kalsara (v9.28, tahap 6a): dipindah APA ADANYA dari js/legacy/20-hitung-etalase.js.
 * `$` dan `document` disuntikkan; dfn (callback konfirmasi), dprev (elemen pemicu dialog) dan toastT (timer toast) kini privat di closure.
 * dprev tetap DIPAKAI BERSAMA dialog lain (peringatan selisih tarif dan panduan di js/voucher-panel.js) lewat getDprev/setDprev, supaya
 * perilaku fokus-kembali antar dialog sama persis seperti saat semuanya berbagi satu variabel. Pendengar #dn, #dy, #dlg dipasang saat factory dipanggil.
 * Yang dipakai bagian legacy dan modul lain hanya nilai kembalian di bawah. */
export function createUI({$,document}){
var dfn=null,dprev=null;
function inertBg(on){[document.querySelector('main'),document.querySelector('nav'),document.querySelector('header'),$('fab')].forEach(function(x){if(x)x.inert=on})}
function ask(m,ok,fn){dprev=document.activeElement;$('dlgm').textContent=m;$('dy').textContent=ok;dfn=fn;$('dlg').hidden=false;inertBg(true);$('dn').focus()}
function dclose(){$('dlg').hidden=true;dfn=null;inertBg(false);var p=dprev;dprev=null;if(p&&p.focus)try{p.focus()}catch(e){}}
$('dn').onclick=dclose;$('dy').onclick=function(){var f=dfn;dclose();if(f)f()};
$('dlg').addEventListener('keydown',function(e){if(e.key=='Escape')dclose();else if(e.key=='Tab'){var f=[$('dn'),$('dy')],i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+2)%2].focus()}});$('dlg').addEventListener('click',function(e){if(e.target===this)dclose()});
var toastT=null;function toast(m){var t=$('tt');t.textContent=m;t.className='toast on';clearTimeout(toastT);toastT=setTimeout(function(){t.className='toast'},1600)}
return {inertBg:inertBg,ask:ask,toast:toast,getDprev:function(){return dprev},setDprev:function(v){dprev=v}};
}
