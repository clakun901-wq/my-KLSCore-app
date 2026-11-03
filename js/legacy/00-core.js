/* Compatibility module preserving the original Kalsara v5.82 business logic. */
var DEF={tp:'ns',fb:'no',fl:1250,pb:0,pbc:50000,ad:6.5,ac:'F',gc:'D',sz:'b',gf:100,gfd:'',gad:0,re:0,pp:'no',cgk:60000,cvx:20000,clv:20000,px:0,vx:0,lv:0,vp:'no',lp:'no',gm:0,wu:2000,wm:1,wp:30,cg:40000,cp:60000,pa:'yes',dm:'pct',dv:30,vm:'none',vv:0,vc:0,pm:0.5,pj:0.5,og:0,rd:100,ads:0,rt:0,sl:10,sh:5,sdy:7,tbl:null,tchk:'',tcd:30};
var A=Object.assign({},DEF),rows=[],TS=0,OK=['ad','gx','px','vx','lv','dv'];
var $=function(i){return document.getElementById(i)};
var rp=function(n){return 'Rp '+Math.round(n).toLocaleString('id-ID')};
/*v5.14: pf() = pembaca angka desimal format Indonesia untuk kolom pengaturan/tarif (titik = ribuan, koma = desimal; "1,234.56" juga dikenali). pct=true: titik/koma selalu desimal (persentase).*/
function pf(s,pct){s=String(s).trim().replace(/^rp\.?\s*/i,'').replace(/[^\d.,]/g,'');if(!/\d/.test(s))return NaN;
 var dt=(s.match(/\./g)||[]).length,cm=(s.match(/,/g)||[]).length;
 if(dt&&cm){var dc=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.',th=dc==','?'.':',';s=s.split(th).join('').replace(dc,'.')}
 else if(cm){if(!pct&&(cm>1||/^\d{1,3},\d{3}$/.test(s)))s=s.replace(/,/g,'');else s=s.replace(/,/g,'.')}
 else if(dt&&!pct&&(dt>1||/^[1-9]\d{0,2}\.\d{3}$/.test(s)))s=s.replace(/\./g,'');
 return Number(s)}
/*v5.14: num() = bilangan bulat Rupiah. Aturan titik TETAP seperti sebelumnya (kolom diformat ulang saat mengetik, titik = ribuan); yang berubah: koma desimal (mis. "12.500,75") kini dibulatkan, bukan dibuang.*/
var num=function(s){s=String(s).trim().replace(/^rp\.?\s*/i,'').replace(/\s/g,'');var up=0;if(/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s))s=s.replace(/,/g,'').split('.')[0];else{if(/^\d+\.\d{1,2}$/.test(s))s=s.split('.')[0];var pp=s.split(',');s=pp[0];if(pp.length>1&&/^[5-9]/.test(pp[1]))up=1}return Math.min((parseInt(s.replace(/\D/g,''),10)||0)+up,999999999999)};
var fmt=function(v){return String(v).replace('.',',')};
var pr=function(r,P){return globalThis.KalsaraMoney.percentOfRupiah(P,r)};
var PCT=['gad','ads','rt','pb','ad','gm','gf','px','vx','lv','wm','wp','pm','pj'];
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
