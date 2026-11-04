/*v9.26 (tahap 5b): tab Penjualan/Laporan kini modul ES (js/penjualan.js; createPenjualan diimpor oleh loader js/legacy-app.js).
 Di sini hanya dipasang dependensi dari lingkup legacy. SALES tetap variabel legacy (dibaca lewat State); sold/curP/VUSE/rlAll/rpt/ymd dipakai bagian legacy lain.
 getCFG dan getSalesMax dibaca saat dipanggil karena CFG (50-promosi) dan SALES_MAX (80-cadangan-tema) didefinisikan setelah bagian ini.*/
var {rpt,sold,curP,VUSE,rlAll,ymd}=createPenjualan({st:State,$:$,esc:esc,today:today,rp:rp,num:num,toast:toast,ask:ask,uid:uid,KDOM:KDOM,calc:calc,fwdL:fwdL,vbest:vbest,actL:actL,ptp:ptp,
 getCFG:function(){return CFG},VoucherRules:VoucherRules,CalcCache:CalcCache,setStock:setStock,persist:persist,salesRows:salesRows,copySales:copySales,showCpBox:showCpBox,dl:dl,csv:csv,
 getSalesMax:function(){return SALES_MAX}});
