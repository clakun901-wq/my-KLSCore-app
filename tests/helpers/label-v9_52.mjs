/* v9.52: penggantian label (HANYA teks tampilan) agar aplikasi tidak terkesan khusus dropship.
   Fixture lama (pre_v9_xx) membeku teks sebelum v9.52. Tes kesetaraan mengganti label lama di fixture dengan label baru
   memakai daftar tertutup di bawah, dengan jumlah kemunculan yang dicek tepat. Perubahan lain apa pun tetap terdeteksi. */
import assert from 'node:assert/strict';
export const LABEL_V952=[
 /* urutan penting: pasangan yang lebih panjang dulu agar tidak terpotong pasangan 'Modal supplier' di bawah */
 ["'Supplier','SKU','Link supplier','Modal supplier'","'Sumber barang','SKU','Link sumber barang','Modal / HPP per pcs'"],
 ["'Nama produk','Modal supplier'","'Nama produk','Modal / HPP per pcs'"],
 ["'Modal supplier'","'Modal / HPP per pcs'"],
 ["<summary>Supplier dan riwayat modal</summary>","<summary>Sumber barang dan riwayat modal</summary>"],
 ['<label>Nama supplier</label><input data-p="sup" placeholder="Nama toko supplier">','<label>Sumber barang (opsional)</label><input data-p="sup" placeholder="Nama toko atau tempat beli barang">'],
 ["<label>Link produk supplier</label>","<label>Link sumber barang (opsional)</label>"],
 ["Buka link supplier","Buka link sumber barang"],
 ["Isi modal supplier, hasil muncul otomatis di sini.","Isi modal per pcs, hasil muncul otomatis di sini."],
 ["Segera isi ulang di supplier dan Shopee.","Segera isi ulang stok."],
 ["Cek stok supplier dan Shopee.","Cek stok di Shopee dan sumber barang."],
 ["Cari produk, SKU, atau supplier","Cari produk, SKU, atau sumber barang"],
  ["'Supplier (opsional)'","'Sumber barang (opsional)'"],
 ["'Link supplier (opsional)'","'Link sumber barang (opsional)'"],
 ["Isi modal supplier dulu untuk menilai","Isi modal per pcs dulu untuk menilai"],
 /* v9.57: "Management Partner" menjadi "biaya tambahan" (HANYA teks tampilan, header CSV, dan label). Dijalankan SETELAH pasangan v9.52 di atas.
    Pasangan header ekspor dan templat harus lebih dulu daripada pasangan umum. */
 ["'Modal / HPP per pcs','Biaya Management Partner','Biaya packing','Total modal'","'Modal / HPP per pcs','Biaya tambahan per pesanan','Biaya packing','Total modal'"],
 ["['Nama produk','Modal / HPP per pcs','Biaya Management Partner','Biaya packing'","['Nama produk','Modal / HPP per pcs','Biaya tambahan per pesanan (opsional)','Biaya packing'"],
 ["['d','Biaya Management Partner']","['d','Biaya tambahan per pesanan (opsional)']"],
 ["Modal + Management Partner + packing","Modal + biaya tambahan + packing"],
 ["Biaya hadiah (modal + Management Partner + packing)","Biaya hadiah (modal + biaya tambahan + packing)"],
 ["hanya biaya modal, Management Partner, dan packing hadiah","hanya biaya modal, biaya tambahan, dan packing hadiah"],
 ["' pcs + Management Partner + packing)'","' pcs + biaya tambahan + packing)'"],
 ["ditambah biaya Management Partner dan packing sekali.","ditambah biaya tambahan dan packing sekali."],
 ["Tidak ada baris valid. Kolom: nama, modal, Management Partner, packing, target","Tidak ada baris valid. Kolom: nama, modal, biaya tambahan, packing, target"]
];
/* Mengembalikan fixture dengan label baru; `expected` = jumlah penggantian yang harus terjadi di fixture itu. */
export function relabelV952(text,expected,name){
 let count=0;
 for(const [o,w] of LABEL_V952){const k=text.split(o).length-1;count+=k;text=text.split(o).join(w)}
 assert.equal(count,expected,'penggantian label v9.52 di '+name+' harus tepat '+expected+' kali (ditemukan '+count+')');
 return text;
}
