/* Ganti nama aplikasi Kalsara -> Wulfeg (HANYA teks tampilan dan nama berkas unduhan).
   Fixture lama (pre_v9_xx) membeku teks sebelum penggantian nama. Tes kesetaraan mengganti nama lama di fixture dengan nama baru
   memakai daftar tertutup di bawah, dengan jumlah kemunculan yang dicek tepat. Kunci penyimpanan (kalsara_*) sengaja TIDAK diganti
   agar data dan cadangan lama tetap terbaca; perubahan lain apa pun tetap terdeteksi. */
import assert from 'node:assert/strict';
export const NAMA_WULFEG=[
 ["'cadangan-kalsara-'","'cadangan-wulfeg-'"],
 ["title:'Cadangan Kalsara'","title:'Cadangan Wulfeg'"],
 ["'penjualan-kalsara-'","'penjualan-wulfeg-'"],
 ["'hasil-kalsara.csv'","'hasil-wulfeg.csv'"],
 ["'template-produk-kalsara.csv'","'template-produk-wulfeg.csv'"]
];
export function renameWulfeg(text,expected,name){
 let count=0;
 for(const [o,w] of NAMA_WULFEG){const k=text.split(o).length-1;count+=k;text=text.split(o).join(w)}
 assert.equal(count,expected,'penggantian nama Wulfeg di '+name+' harus tepat '+expected+' kali (ditemukan '+count+')');
 return text;
}
