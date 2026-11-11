/* Peringatan stok/margin Kalsara (v9.31, tahap 6d): pc1, skHi, stk, warns, WN, mchg.
 * Dipindah APA ADANYA dari js/legacy/20-hitung-etalase.js (baris 49-73 lama). Perubahan teks hanya: `var A=getA();` di awal skHi, stk, warns, mchg,
 * karena kode legacy menugaskan ulang A saat restore backup, sehingga nilainya HARUS dibaca ulang setiap dipakai (jangan simpan salinan A).
 * Ketergantungan lain disuntikkan: calc, fwd (dipakai mchg), rp, fmt, today, dtx. pc1 dan WN murni (tidak memakai A).
 * Dipakai di 20-hitung-etalase.js, 50-promosi.js dan 60-tab-impor-sinkron.js lewat nama yang sama (saat dipanggil, bukan saat muat). */
export function createWarnings({getA,calc,fwd,rp,fmt,today,dtx}){
function pc1(x){return fmt(Math.round(x*10)/10)}
function skHi(){var A=getA();var a=Math.max(0,Math.floor(+A.sh)||0),b=Math.max(0,Math.floor(+A.sl)||0);return Math.min(a,b)}
function stk(r){var A=getA();if(!(r.m>0||r.n))return{lv:'',h:''};
 var d=r.sd?Math.floor((new Date(today()+'T00:00')-new Date(r.sd+'T00:00'))/864e5):null,b=' <button class="lk ck" type="button">Sudah dicek hari ini</button>',
 w=function(l,t,k){return{lv:l,h:'<div class="wn '+l+'">&#9888; '+t+(k?b:'')+'</div>'}};
 if(r.s==null)return w('y','Stok belum diisi. Cek jumlah stok asli di Seller Centre.',0);
 if(r.s<=0)return w('r','Stok habis. Nonaktifkan produk atau isi ulang stok di Shopee.',1);
 if(r.s<=skHi())return w('r','Stok hampir habis ('+r.s+' pcs). Segera isi ulang stok.',1); if(r.s<=A.sl)return w('y','Stok menipis ('+r.s+' pcs). Cek stok di Shopee dan sumber barang.',1);
 if(A.sdy>0&&d!==null&&d>=A.sdy)return w('y','Stok terakhir dicek '+d+' hari lalu. Cek ulang jumlah asli di Shopee.',1);
 return{lv:'',h:'<div class="stk">Stok '+r.s.toLocaleString('id-ID')+' pcs, '+(d===null?'tanggal cek belum tercatat':d===0?'dicek hari ini':'dicek '+d+' hari lalu')+b+'</div>'}}
function warns(o,rev){var A=getA();
 var w=[],sh=[],lv='',m=o.P>0?o.u/o.P*100:0,pot=o.P>0?(o.sh+o.pm+o.tax)/o.P*100:0;
 if(o.u<0){lv='r';w.push(rev?'Rugi pada harga ini.':'Rugi. Naikkan harga atau target untung.');sh.push('Rugi')}
 else if(o.u==0){lv='r';w.push(rev?'Impas, tidak ada untung sama sekali.':'Untung nol. Tidak ada cadangan untuk risiko.');sh.push('Untung nol')}
 else if(o.u<A.wu||m<A.wm){lv='y';w.push('Untung tipis ('+rp(o.u)+', margin '+pc1(m)+'%). Batas aman: '+rp(A.wu)+' dan '+pc1(A.wm)+'%.');sh.push('Untung tipis')}
 if(pot>A.wp){lv=lv||'y';w.push('Total potongan tinggi ('+pc1(pot)+'% dari harga jual). Periksa tarif yang diisi.');sh.push('Potongan tinggi')}
 return{w:w,sh:sh,lv:lv,m:m,pot:pot}}
function WN(x){return x.w.map(function(t){return '<div class="wn '+(x.lv=='r'&&x.w[0]==t?'r':'y')+'">&#9888; '+t+'</div>'}).join('')}
function mchg(r,o){var A=getA();var h=r.mh&&r.mh.length&&r.mh[r.mh.length-1];if(!h||r.ack)return null;
 var old=calc(Object.assign({},r,{m:h.a}));if(!old||old.err)return null;
 var q=fwd(old.M,r,o.R),x=warns(q,true),up=h.b>h.a,lv='',t;
 if(up){lv=q.u<0?'r':(q.u<r.t||x.m<A.wm||q.u<A.wu)?'y':'';
  t='Modal naik '+rp(h.b-h.a)+' ('+dtx(h.d)+'). Harga listing perlu naik dari '+rp(old.M)+' ke '+rp(o.M)+'. Jika harga lama dipertahankan, untung jadi '+rp(q.u)+' (margin '+pc1(x.m)+'%).'}
 else t='Modal turun '+rp(h.a-h.b)+' ('+dtx(h.d)+'). Harga listing bisa turun dari '+rp(old.M)+' ke '+rp(o.M)+'.';
 return{lv:lv,h:'<div class="wn '+(lv||'i')+'">'+(lv?'&#9888; ':'')+t+' <button class="lk ak" type="button">Sudah update harga di Shopee</button></div>'}}
return {pc1:pc1,skHi:skHi,stk:stk,warns:warns,WN:WN,mchg:mchg};
}
