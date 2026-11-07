/* Tahap 9A (v9.48): pengukur kinerja. Nonaktif = nol beban dan tidak mengubah apa pun. */
import assert from 'node:assert/strict';
import {createKinerja,kinerjaAktif} from '../js/kinerja.js';
let n=0; const ok=(v,m)=>{assert.ok(v,m);n++};
// Nonaktif: fungsi asli dikembalikan apa adanya, tidak ada global KPerf, tidak ada pengamat.
{const g={};const K=createKinerja({global:g,doc:null,enabled:false});const f=()=>1;
 ok(K.t('x',f)===f,'nonaktif: t() mengembalikan fungsi asli');const tw=x=>x;ok(K.tabWrap(tw)===tw,'nonaktif: tabWrap() mengembalikan tab asli');ok(!('KPerf' in g),'nonaktif: tidak ada global KPerf');}
// Aktif: waktu dicatat, hasil dan argumen fungsi asli tidak berubah, galat tetap dilempar dan tetap tercatat.
{let t=0;const g={performance:{now:()=>t},requestAnimationFrame:cb=>cb(),navigator:{userAgent:'uji',hardwareConcurrency:4}};
 const K=createKinerja({global:g,doc:null,enabled:true,getRowsCount:()=>1000,now:()=>t});
 const f=K.t('hitung',function(a,b){t+=12;return a+b});ok(f(2,3)===5,'hasil dan argumen fungsi asli sama');
 const bad=K.t('galat',function(){t+=3;throw new Error('x')});let thrown=false;try{bad()}catch(e){thrown=true}ok(thrown,'galat tetap dilempar');
 const r=K.report();ok(r.fungsi.hitung.n===1&&r.fungsi.hitung.total===12&&r.fungsi.galat.n===1,'waktu tercatat termasuk saat galat');
 ok(r.produk===1000&&r.lingkungan.inti===4,'laporan memuat jumlah produk dan lingkungan');ok(g.KPerf===K,'aktif: KPerf tersedia untuk dibaca dari konsol');
 const tab=K.tabWrap(i=>{t+=40;return 'ok'+i});ok(tab(2)==='ok2','tab terbungkus mengembalikan hasil asli');
 ok(K.report().fungsi['tab(2)'].total===40,'waktu sinkron pindah tab tercatat');
 K.reset();ok(Object.keys(K.report().fungsi).length===0,'reset mengosongkan');}
ok(kinerjaAktif('?perf=1',()=>null)===true&&kinerjaAktif('',()=>'1')===true&&kinerjaAktif('?perf=0',()=>null)===false&&kinerjaAktif('',()=>null)===false,'aktif hanya lewat ?perf=1 atau pengaturan kalsara_perf=1');
console.log(`Pengukur kinerja (Tahap 9A): ${n} pernyataan lulus.`);
