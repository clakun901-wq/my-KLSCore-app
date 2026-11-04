/* Compatibility module preserving the original Kalsara v5.82 business logic. */
var DEF={tp:'ns',fb:'no',fl:1250,pb:0,pbc:50000,ad:6.5,ac:'F',gc:'D',sz:'b',gf:100,gfd:'',gad:0,re:0,pp:'no',cgk:60000,cvx:20000,clv:20000,px:0,vx:0,lv:0,vp:'no',lp:'no',gm:0,wu:2000,wm:1,wp:30,cg:40000,cp:60000,pa:'yes',dm:'pct',dv:30,vm:'none',vv:0,vc:0,pm:0.5,pj:0.5,og:0,rd:100,ads:0,rt:0,sl:10,sh:5,sdy:7,tbl:null,tchk:'',tcd:30};
var A=Object.assign({},DEF),rows=[],TS=0,SALES=[],OK=['ad','gx','px','vx','lv','dv'];
var $=function(i){return document.getElementById(i)};
/*v9.26 (tahap 5b): jembatan state inti. Variabel legacy tetap menjadi sumber kebenaran (kode legacy menugaskan ulang A/rows/SALES/PRM/TS langsung);
  modul tab yang sudah dipisah membaca/menulis lewat State sehingga selalu melihat nilai terbaru. PRM dideklarasikan di 50-promosi.js (var, dibaca saat dipanggil).*/
var State=createState({A:{get:function(){return A},set:function(v){A=v}},rows:{get:function(){return rows},set:function(v){rows=v}},SALES:{get:function(){return SALES},set:function(v){SALES=v}},
 PRM:{get:function(){return PRM},set:function(v){PRM=v}},TS:{get:function(){return TS},set:function(v){TS=v}}});
var pr=function(r,P){return globalThis.KalsaraMoney.percentOfRupiah(P,r)};
