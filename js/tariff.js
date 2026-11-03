/* Tabel dan fungsi tarif Shopee (Admin, Gratis Ongkir XTRA). Dipindahkan apa adanya dari js/legacy/10-calc.js (tahap 4b).
   Tabel GO/GO2/AD diekspor sebagai objek yang SAMA (bisa diubah di tempat oleh tblSync); state pengaturan A diambil lewat getA() karena A diganti utuh saat restore/reset. */
import {today} from './format.js';
export const GO={A:[1,2.5],B:[2,3.5],C:[3.5,5],D:[5.5,7],E:[6,7.5],F:[6.5,8],G:[7.5,9],H:[8,9.5]};
export const GO2={A:[1.5,3.5],B:[5,7],C:[6.5,8.5],D:[8.5,10.5],E:[9,11],F:[9.5,11.5],G:[10.5,12],H:[11,13]};
export const GO2D='2026-12-01';
export const AD={A:[10,11.7],B:[9.5,10.45],C:[9,10.2],D:[8.25,9.95],E:[6.75,7.7],F:[6.5,7.2],G:[5.25,6.2],H:[4.25,4.7],I:[2.5,2.5]};
export function createTariff({getA}){
  function gcOf(r){var A=getA();var o=r.o||{};if(today()>=GO2D&&o.g2)return o.g2;return o.gc||A.gc}
  function goT(c){var A=getA();if(today()>=GO2D&&!(A.tbl&&A.tbl.GO&&A.tbl.GO[c])&&GO2[c])return GO2[c];return GO[c]}
  function capG(sk){var A=getA();if(today()>=GO2D&&(sk?A.cgk===60000:A.cg===40000))return sk?80000:60000;return sk?A.cgk:A.cg}
  function gfac(){var A=getA();if(A.gfd&&today()>A.gfd)return 100;return A.gf}
  function goRate(r){var A=getA();var ov=r.o&&r.o.gx;if(ov!==null&&ov!==undefined)return Math.round(ov*gfac()*100)/10000;var c=gcOf(r),s=(r.o&&r.o.sz)||A.sz;if(c=='man')return Math.round(A.gm*gfac()*100)/10000;var t=goT(c);return t?Math.max(Math.round((Math.round(t[s=='k'?1:0]*gfac()*100)/10000-(A.gad||0))*10000)/10000,0):0}
  function adRate(r){var A=getA();if(r.o&&r.o.ad!==null&&r.o.ad!==undefined)return r.o.ad;var t=AD[(r.o&&r.o.ac)||A.ac];return t?t[A.tp=='ml'?1:0]:A.ad}
  function rate(r,k){var A=getA();var v=r.o&&r.o[k];return(v===null||v===undefined)?A[k]:v}
  return {gcOf,goT,capG,gfac,goRate,adRate,rate};
}
