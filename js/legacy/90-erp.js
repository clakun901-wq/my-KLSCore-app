/*v9.15 (tahap 2): modul ERP kini modul ES sungguhan di js/erp.js. Di sini hanya dipasang dependensi dari lingkup legacy; createERP diimpor oleh loader (js/legacy-app.js).*/
var ERP=createERP({$:$,today:today,toast:toast,getRows:function(){return rows}});
