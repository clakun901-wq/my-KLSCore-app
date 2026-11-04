/*v9.27 (tahap 5c): panel "Cek pesanan nyata" dan dialog panduan/peringatan tarif kini modul ES (js/voucher-panel.js; createVoucherPanel diimpor oleh loader js/legacy-app.js).
 Di sini hanya dipasang dependensi dari lingkup legacy. A/rows dibaca lewat State; dprev (milik js/ui.js, dipakai bersama ask()) lewat getDprev/setDprev dari UI.
 Fungsi legacy yang didefinisikan bagian lain (upd, fill, syncVL, tlOk, tlRender, dtx, inertBg, prodSig, feeSig, toast, esc) adalah deklarasi function sehingga sudah tersedia saat bagian ini berjalan.
 Hanya vgSync dan vfKeep yang dipakai bagian lain (80-cadangan-tema.js, saat berpindah tab).*/
var {vgSync,vfKeep}=createVoucherPanel({st:State,$:$,esc:esc,num:num,rp:rp,today:today,pr:pr,KDOM:KDOM,KStore:KStore,document:document,calc:calc,volt:volt,fees:fees,gfac:gfac,toast:toast,upd:upd,
 fill:fill,syncVL:syncVL,prodSig:prodSig,feeSig:feeSig,tlOk:tlOk,tlRender:tlRender,dtx:dtx,inertBg:inertBg,getDprev:getDprev,setDprev:setDprev});
