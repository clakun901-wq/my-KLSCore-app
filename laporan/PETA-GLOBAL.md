# Peta ketergantungan global js/app-core.js (dihasilkan otomatis)

Dihasilkan oleh `node scripts/peta-global.mjs`. Jangan diedit tangan: jalankan ulang skrip itu. Tes `tests/peta-global.test.mjs` gagal bila berkas ini tidak sama dengan hasil terbaru.

## 1. Ringkasan (bahasa awam)

Aplikasi ini masih memuat 12 bagian kode di `js/app-core.js` (sampai v9.37 berupa berkas terpisah di `js/legacy/`; sejak v9.38 disatukan menjadi satu modul, isinya tidak diubah) yang berbagi SATU lingkup nama besar saat dijalankan. Karena berbagi, sebuah potongan bisa memakai "nama" (fungsi atau variabel) milik potongan lain tanpa izin tertulis. Nama seperti itu disebut **global**. Makin banyak global yang dipakai lintas potongan, makin sulit potongan-potongan itu dipisah menjadi modul mandiri.

- Jumlah seluruh nama global: **227** (125 fungsi, 102 variabel/konstanta).
- Nama yang melintasi berkas (didefinisikan di satu potongan, dipakai di potongan lain): **90** (36 fungsi, 54 variabel). **Inilah angka yang harus turun ke 0** agar bagian-bagian `app-core.js` bisa dipisah menjadi modul fitur mandiri.
- Nama yang hanya dipakai di berkasnya sendiri: 137 (ini mudah dipindah).
- Lima data inti (`A`, `rows`, `SALES`, `PRM`, `TS`) kini disimpan langsung oleh modul `state.js`; kelimanya tidak lagi menjadi nama global di `app-core.js`. Akses tercatat di bagian 2.
- Dibanding v9.38, jumlah global turun 6 (233 → 227) dan jumlah lintas bagian turun 6 (96 → 90). Enam nama yang hilang dari daftar global: `A`, `rows`, `SALES`, `PRM`, `TS`, dan `State` (jembatan lama). `State` kini merupakan impor modul, bukan variabel global bagian.
- Nama yang dipanggil lewat teks HTML (mis. `onclick="..."`) dan karena itu tidak kelihatan sebagai pemanggilan biasa: **0** (bagian 5). Ini PERLU perhatian khusus saat fungsi dipindah ke modul.
- Nama yang didefinisikan lebih dari sekali: 0.
- Nama yang tidak ditemukan di mana pun (kemungkinan salah ketik): 0.

### Per berkas

| Berkas | Ukuran (byte) | Nama yang didefinisikan | …fungsi | …variabel | Dipakai berkas lain | Memakai nama berkas lain |
|---|---:|---:|---:|---:|---:|---:|
| 00-core.js | 617 | 4 | 0 | 4 | 3 | 0 |
| 10-calc.js | 1.210 | 29 | 0 | 29 | 21 | 2 |
| 20-hitung-etalase.js | 22.297 | 54 | 19 | 35 | 25 | 31 |
| 30-penjualan.js | 826 | 6 | 0 | 6 | 6 | 19 |
| 40-voucher-panel.js | 976 | 2 | 0 | 2 | 2 | 16 |
| 50-promosi.js | 40.283 | 53 | 46 | 7 | 11 | 23 |
| 60-tab-impor-sinkron.js | 22.109 | 30 | 28 | 2 | 10 | 27 |
| 70-xlsx-reader.js | 171 | 0 | 0 | 0 | 0 | 8 |
| 80-cadangan-tema.js | 15.766 | 47 | 32 | 15 | 11 | 22 |
| 90-erp.js | 262 | 1 | 0 | 1 | 1 | 2 |
| 95-boot.js | 449 | 1 | 0 | 1 | 0 | 12 |
| 99-pwa.js | 44 | 0 | 0 | 0 | 0 | 3 |
| **Jumlah** | **105.010** | **227** | **125** | **102** | **90** (nama unik) | |

Cara membaca: "Dipakai berkas lain" = berapa nama buatan berkas ini yang dipakai berkas lain. "Memakai nama berkas lain" = berapa nama milik berkas lain yang dipakai di berkas ini. Berkas dengan angka keduanya kecil paling mudah dipindah lebih dulu.

### Siapa memakai milik siapa (jumlah nama)

| Pemakai ↓ / Pemilik → | 00 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 95 | 99 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 00-core.js |  |  |  |  |  |  |  |  |  |  |  |  |
| 10-calc.js | 1 |  | 1 |  |  |  |  |  |  |  |  |  |
| 20-hitung-etalase.js | 2 | 11 |  | 3 |  | 9 | 4 |  | 2 |  |  |  |
| 30-penjualan.js | 1 | 5 | 3 |  |  | 2 | 6 |  | 2 |  |  |  |
| 40-voucher-panel.js | 2 | 4 | 7 |  |  |  |  |  | 3 |  |  |  |
| 50-promosi.js | 1 | 15 | 6 |  |  |  |  |  | 1 |  |  |  |
| 60-tab-impor-sinkron.js | 2 | 5 | 14 | 2 |  | 3 |  |  | 1 |  |  |  |
| 70-xlsx-reader.js | 1 |  | 6 |  |  |  | 1 |  |  |  |  |  |
| 80-cadangan-tema.js | 2 | 2 | 9 | 1 | 2 | 3 | 2 |  |  | 1 |  |  |
| 90-erp.js | 1 |  | 1 |  |  |  |  |  |  |  |  |  |
| 95-boot.js | 1 |  | 4 |  |  |  | 1 |  | 5 | 1 |  |  |
| 99-pwa.js | 1 |  | 1 |  |  |  |  |  | 1 |  |  |  |

Kolom diberi awalan angka berkas pemilik (00 = 00-core.js, dst.). Satu nama yang didefinisikan di beberapa berkas dihitung di tiap pemilik.

## 2. Lima nama inti: A, rows, SALES, PRM, TS (penyimpanan resmi js/state.js)

Kelima nama ini bukan lagi variabel global. Nilai tinggal di `state.js`; kode aplikasi membaca dan menggantinya melalui `State.nama`. Kolom baca/tulis menunjukkan pemakaian objek state di setiap bagian.

| Nama | Global di app-core? | Penugasan ulang langsung | Akses State baca / tulis |
|---|---|---:|---:|
| `A` | tidak | 0 | 81 / 3 |
| `rows` | tidak | 0 | 60 / 6 |
| `SALES` | tidak | 0 | 14 / 2 |
| `PRM` | tidak | 0 | 25 / 2 |
| `TS` | tidak | 0 | 1 / 2 |

**`A`** - bukan global. Akses `State.A` terdapat di: 00-core×1, 10-calc×3, 20-hitung-etalase×18, 50-promosi×7, 60-tab-impor-sinkron×5, 80-cadangan-tema×50.

**`rows`** - bukan global. Akses `State.rows` terdapat di: 10-calc×1, 20-hitung-etalase×24, 50-promosi×19, 60-tab-impor-sinkron×14, 70-xlsx-reader×2, 80-cadangan-tema×5, 90-erp×1.

**`SALES`** - bukan global. Akses `State.SALES` terdapat di: 60-tab-impor-sinkron×2, 80-cadangan-tema×14.

**`PRM`** - bukan global. Akses `State.PRM` terdapat di: 10-calc×2, 20-hitung-etalase×1, 50-promosi×21, 80-cadangan-tema×3.

**`TS`** - bukan global. Akses `State.TS` terdapat di: 80-cadangan-tema×3.

## 3. Nama yang melintasi berkas (90)

| Nama | Jenis | Didefinisikan di | Dibaca di | Ditulis ulang di | Juga dari HTML? |
|---|---|---|---|---|---|
| `$` | variabel | 00-core.js | 20-hitung-etalase×35, 30-penjualan×1, 40-voucher-panel×1, 50-promosi×18, 60-tab-impor-sinkron×52, 70-xlsx-reader×1, 80-cadangan-tema×76, 90-erp×1, 95-boot×4, 99-pwa×1 | - |  |
| `CFG` | variabel | 50-promosi.js | 20-hitung-etalase×1, 30-penjualan×1 | - |  |
| `CR` | variabel | 20-hitung-etalase.js | 60-tab-impor-sinkron×6 | - |  |
| `CalcCache` | variabel | 10-calc.js | 20-hitung-etalase×1, 30-penjualan×1, 50-promosi×3, 80-cadangan-tema×2 | - |  |
| `DEF` | variabel | 00-core.js | 80-cadangan-tema×2 | - |  |
| `ERP` | variabel | 90-erp.js | 80-cadangan-tema×6, 95-boot×1 | - |  |
| `PSEL` | variabel | 50-promosi.js | - | 20-hitung-etalase×2 |  |
| `PSIG` | variabel | 50-promosi.js | 60-tab-impor-sinkron×1 | 20-hitung-etalase×1 |  |
| `ROW_MAX` | variabel | 20-hitung-etalase.js | 60-tab-impor-sinkron×4, 80-cadangan-tema×2 | - |  |
| `SALES_MAX` | variabel | 80-cadangan-tema.js | 30-penjualan×1 | - |  |
| `TO` | variabel | 80-cadangan-tema.js | 95-boot×1 | - |  |
| `VNO` | variabel | 10-calc.js | - | 50-promosi×2 |  |
| `VUSE` | variabel | 30-penjualan.js | 20-hitung-etalase×2 | - |  |
| `VoucherRules` | variabel | 10-calc.js | 30-penjualan×1, 50-promosi×2, 80-cadangan-tema×2 | - |  |
| `WN` | variabel | 20-hitung-etalase.js | 50-promosi×7 | - |  |
| `acH` | fungsi | 60-tab-impor-sinkron.js | 20-hitung-etalase×1 | - |  |
| `actL` | fungsi | 60-tab-impor-sinkron.js | 20-hitung-etalase×1, 30-penjualan×1 | - |  |
| `adRate` | variabel | 10-calc.js | 20-hitung-etalase×2 | - |  |
| `add` | fungsi | 20-hitung-etalase.js | 60-tab-impor-sinkron×7, 70-xlsx-reader×1, 80-cadangan-tema×2, 95-boot×2 | - |  |
| `applyState` | fungsi | 80-cadangan-tema.js | 95-boot×1 | - |  |
| `ask` | variabel | 20-hitung-etalase.js | 30-penjualan×1, 50-promosi×1, 60-tab-impor-sinkron×4, 70-xlsx-reader×1, 80-cadangan-tema×3 | - |  |
| `bdH` | fungsi | 60-tab-impor-sinkron.js | 20-hitung-etalase×1 | - |  |
| `bkRemind` | fungsi | 80-cadangan-tema.js | 95-boot×1 | - |  |
| `calc` | variabel | 10-calc.js | 20-hitung-etalase×4, 30-penjualan×1, 40-voucher-panel×1, 50-promosi×8, 60-tab-impor-sinkron×1 | - |  |
| `cbc` | variabel | 10-calc.js | 50-promosi×1 | - |  |
| `clearMark` | fungsi | 20-hitung-etalase.js | 80-cadangan-tema×1 | - |  |
| `colL` | fungsi | 20-hitung-etalase.js | 60-tab-impor-sinkron×1 | - |  |
| `copySales` | fungsi | 60-tab-impor-sinkron.js | 30-penjualan×1 | - |  |
| `csv` | fungsi | 60-tab-impor-sinkron.js | 30-penjualan×1 | - |  |
| `curP` | variabel | 30-penjualan.js | 20-hitung-etalase×1 | - |  |
| `dd` | variabel | 10-calc.js | 50-promosi×1 | - |  |
| `dl` | fungsi | 60-tab-impor-sinkron.js | 30-penjualan×1, 80-cadangan-tema×2 | - |  |
| `etAll` | fungsi | 20-hitung-etalase.js | 60-tab-impor-sinkron×1 | - |  |
| `feeSig` | variabel | 20-hitung-etalase.js | 40-voucher-panel×1 | - |  |
| `fees` | variabel | 10-calc.js | 40-voucher-panel×1, 50-promosi×1, 60-tab-impor-sinkron×1 | - |  |
| `fill` | variabel | 20-hitung-etalase.js | 40-voucher-panel×1, 80-cadangan-tema×6, 95-boot×1 | - |  |
| `fk` | fungsi | 20-hitung-etalase.js | 50-promosi×1 | - |  |
| `fwd` | variabel | 10-calc.js | 20-hitung-etalase×1 | - |  |
| `fwdL` | variabel | 10-calc.js | 20-hitung-etalase×2, 30-penjualan×1, 50-promosi×11, 60-tab-impor-sinkron×3 | - |  |
| `getDprev` | variabel | 20-hitung-etalase.js | 40-voucher-panel×1 | - |  |
| `gfac` | variabel | 10-calc.js | 20-hitung-etalase×2, 40-voucher-panel×1 | - |  |
| `goRate` | variabel | 10-calc.js | 20-hitung-etalase×2 | - |  |
| `impas` | variabel | 10-calc.js | 20-hitung-etalase×1, 50-promosi×1, 60-tab-impor-sinkron×2 | - |  |
| `inertBg` | variabel | 20-hitung-etalase.js | 40-voucher-panel×1 | - |  |
| `lflush` | fungsi | 80-cadangan-tema.js | 99-pwa×1 | - |  |
| `migPt` | fungsi | 50-promosi.js | 80-cadangan-tema×1 | - |  |
| `obInit` | fungsi | 80-cadangan-tema.js | 95-boot×1 | - |  |
| `paSync` | fungsi | 50-promosi.js | 20-hitung-etalase×1, 80-cadangan-tema×1 | - |  |
| `parseCsv` | fungsi | 60-tab-impor-sinkron.js | 70-xlsx-reader×1 | - |  |
| `pc1` | variabel | 20-hitung-etalase.js | 50-promosi×9, 60-tab-impor-sinkron×4 | - |  |
| `persist` | fungsi | 80-cadangan-tema.js | 20-hitung-etalase×3, 30-penjualan×1, 50-promosi×15, 60-tab-impor-sinkron×1 | - |  |
| `pr` | variabel | 00-core.js | 10-calc×2, 20-hitung-etalase×1, 40-voucher-panel×1, 60-tab-impor-sinkron×1 | - |  |
| `prRender` | fungsi | 50-promosi.js | 60-tab-impor-sinkron×1, 80-cadangan-tema×1 | - |  |
| `psig` | fungsi | 50-promosi.js | 20-hitung-etalase×1, 60-tab-impor-sinkron×1 | - |  |
| `pst` | variabel | 10-calc.js | 20-hitung-etalase×1, 50-promosi×6 | - |  |
| `ptp` | fungsi | 50-promosi.js | 20-hitung-etalase×1, 30-penjualan×1 | - |  |
| `rlAll` | variabel | 30-penjualan.js | 60-tab-impor-sinkron×1 | - |  |
| `rpt` | variabel | 30-penjualan.js | 60-tab-impor-sinkron×1 | - |  |
| `salesRows` | fungsi | 60-tab-impor-sinkron.js | 30-penjualan×1 | - |  |
| `setDprev` | variabel | 20-hitung-etalase.js | 40-voucher-panel×1 | - |  |
| `setStock` | fungsi | 20-hitung-etalase.js | 30-penjualan×1 | - |  |
| `shop` | variabel | 20-hitung-etalase.js | 60-tab-impor-sinkron×1 | - |  |
| `showCpBox` | fungsi | 60-tab-impor-sinkron.js | 30-penjualan×1 | - |  |
| `sold` | variabel | 30-penjualan.js | 20-hitung-etalase×1 | - |  |
| `srt` | fungsi | 20-hitung-etalase.js | 60-tab-impor-sinkron×4, 70-xlsx-reader×1 | - |  |
| `strip` | fungsi | 20-hitung-etalase.js | 60-tab-impor-sinkron×3, 70-xlsx-reader×1, 80-cadangan-tema×1 | - |  |
| `syLocal` | fungsi | 80-cadangan-tema.js | 95-boot×1 | - |  |
| `syncVL` | fungsi | 80-cadangan-tema.js | 40-voucher-panel×1 | - |  |
| `tab` | fungsi | 60-tab-impor-sinkron.js | 20-hitung-etalase×6, 80-cadangan-tema×2, 95-boot×3 | 80-cadangan-tema×1, 95-boot×1 |  |
| `tbuild` | variabel | 20-hitung-etalase.js | 95-boot×1 | - |  |
| `tchk` | variabel | 20-hitung-etalase.js | 80-cadangan-tema×1 | 80-cadangan-tema×1 |  |
| `tgl` | fungsi | 20-hitung-etalase.js | 60-tab-impor-sinkron×2 | - |  |
| `tlOk` | fungsi | 80-cadangan-tema.js | 40-voucher-panel×1 | - |  |
| `tlRender` | fungsi | 80-cadangan-tema.js | 20-hitung-etalase×1, 40-voucher-panel×1 | - |  |
| `tmod` | variabel | 10-calc.js | 20-hitung-etalase×2, 50-promosi×5, 60-tab-impor-sinkron×2 | - |  |
| `toast` | variabel | 20-hitung-etalase.js | 30-penjualan×1, 40-voucher-panel×1, 50-promosi×6, 60-tab-impor-sinkron×33, 70-xlsx-reader×1, 80-cadangan-tema×25, 90-erp×1, 99-pwa×1 | - |  |
| `upd` | variabel | 20-hitung-etalase.js | 10-calc×1, 40-voucher-panel×1, 60-tab-impor-sinkron×6, 70-xlsx-reader×1, 80-cadangan-tema×6, 95-boot×1 | - |  |
| `vbest` | variabel | 10-calc.js | 20-hitung-etalase×1, 30-penjualan×1 | - |  |
| `vcApply` | variabel | 10-calc.js | 50-promosi×2 | - |  |
| `vcLab` | variabel | 10-calc.js | 50-promosi×2 | - |  |
| `vcList` | variabel | 10-calc.js | 50-promosi×4 | - |  |
| `vdisc` | variabel | 10-calc.js | 50-promosi×3 | - |  |
| `vfKeep` | variabel | 40-voucher-panel.js | 80-cadangan-tema×2 | - |  |
| `vgSync` | variabel | 40-voucher-panel.js | 80-cadangan-tema×2 | - |  |
| `vnote` | fungsi | 50-promosi.js | 20-hitung-etalase×1 | - |  |
| `volt` | variabel | 10-calc.js | 40-voucher-panel×1 | - |  |
| `vscn` | fungsi | 50-promosi.js | 20-hitung-etalase×1 | - |  |
| `vwarn` | fungsi | 50-promosi.js | 20-hitung-etalase×1 | - |  |
| `warns` | variabel | 20-hitung-etalase.js | 50-promosi×8, 60-tab-impor-sinkron×1 | - |  |
| `ymd` | variabel | 30-penjualan.js | 80-cadangan-tema×1 | - |  |

Hanya pemakaian DI LUAR berkas pendefinisi yang tercantum di kolom "Dibaca di" / "Ditulis ulang di".

## 4. Semua nama global (227)

| Nama | Jenis | Didefinisikan di (baris) | Dibaca | Ditulis ulang | Lintas berkas |
|---|---|---|---:|---:|---|
| `$` | variabel (nilai fungsi) | 00-core.js:4 | 190 | 0 | ya |
| `BK_DAYS` | variabel | 80-cadangan-tema.js:83 | 1 | 0 |  |
| `BK_KEY` | variabel | 80-cadangan-tema.js:83 | 2 | 0 |  |
| `BK_SNZ` | variabel | 80-cadangan-tema.js:83 | 3 | 0 |  |
| `Backup` | konstanta | 80-cadangan-tema.js:46 | 2 | 0 |  |
| `CFG` | variabel | 50-promosi.js:3 | 13 | 0 | ya |
| `CR` | variabel | 20-hitung-etalase.js:8 | 7 | 0 | ya |
| `CalcCache` | variabel | 10-calc.js:10 | 8 | 0 | ya |
| `DEF` | variabel | 00-core.js:2 | 3 | 0 | ya |
| `ERP` | variabel | 90-erp.js:2 | 7 | 0 | ya |
| `ETT` | variabel | 20-hitung-etalase.js:82 | 4 | 1 |  |
| `ETU` | variabel | 20-hitung-etalase.js:82 | 4 | 1 |  |
| `HD` | variabel | 60-tab-impor-sinkron.js:6 | 1 | 0 |  |
| `HY_ALL` | variabel | 20-hitung-etalase.js:44 | 1 | 0 |  |
| `IC` | variabel | 50-promosi.js:4 | 1 | 0 |  |
| `LZ` | variabel | 20-hitung-etalase.js:44 | 4 | 2 |  |
| `LZM` | variabel | 20-hitung-etalase.js:44 | 3 | 0 |  |
| `OK` | variabel | 00-core.js:3 | 0 | 0 |  |
| `PKS` | variabel | 50-promosi.js:161 | 2 | 2 |  |
| `PKT` | variabel | 50-promosi.js:161 | 3 | 2 |  |
| `PORD` | variabel | 50-promosi.js:2 | 1 | 0 |  |
| `PRM_MAX` | variabel | 80-cadangan-tema.js:67 | 2 | 0 |  |
| `PSEL` | variabel | 50-promosi.js:2 | 14 | 3 | ya |
| `PSIG` | variabel | 50-promosi.js:11 | 1 | 1 | ya |
| `ROW_MAX` | variabel | 20-hitung-etalase.js:44 | 10 | 0 | ya |
| `SALES_DAYS` | variabel | 80-cadangan-tema.js:67 | 3 | 0 |  |
| `SALES_MAX` | variabel | 80-cadangan-tema.js:67 | 3 | 0 | ya |
| `SYK` | variabel | 60-tab-impor-sinkron.js:72 | 2 | 0 |  |
| `TI` | variabel | 80-cadangan-tema.js:120 | 3 | 0 |  |
| `TO` | variabel | 80-cadangan-tema.js:120 | 6 | 0 | ya |
| `VNO` | variabel | 10-calc.js:4 | 2 | 2 | ya |
| `VUSE` | variabel | 30-penjualan.js:4 | 2 | 0 | ya |
| `VoucherRules` | variabel | 10-calc.js:5 | 6 | 0 | ya |
| `WN` | variabel | 20-hitung-etalase.js:6 | 9 | 0 | ya |
| `_tab` | variabel | 80-cadangan-tema.js:120 | 1 | 0 |  |
| `_tab6` | variabel | 95-boot.js:1 | 1 | 0 |  |
| `_tchk` | variabel | 80-cadangan-tema.js:116 | 1 | 0 |  |
| `acH` | fungsi | 60-tab-impor-sinkron.js:123 | 1 | 0 | ya |
| `actL` | fungsi | 60-tab-impor-sinkron.js:118 | 5 | 0 | ya |
| `actNote` | fungsi | 60-tab-impor-sinkron.js:114 | 0 | 0 |  |
| `actNoteModel` | variabel | 20-hitung-etalase.js:10 | 0 | 0 |  |
| `actPromo` | fungsi | 50-promosi.js:54 | 2 | 0 |  |
| `actRin` | fungsi | 60-tab-impor-sinkron.js:138 | 1 | 0 |  |
| `adRate` | variabel | 10-calc.js:2 | 3 | 0 | ya |
| `add` | fungsi | 20-hitung-etalase.js:49 | 13 | 0 | ya |
| `anchorDl` | fungsi | 60-tab-impor-sinkron.js:23 | 1 | 0 |  |
| `applyState` | fungsi | 80-cadangan-tema.js:102 | 2 | 0 | ya |
| `ask` | variabel | 20-hitung-etalase.js:79 | 11 | 0 | ya |
| `bdH` | fungsi | 60-tab-impor-sinkron.js:119 | 1 | 0 | ya |
| `bis` | fungsi | 50-promosi.js:47 | 6 | 0 |  |
| `bkAgo` | fungsi | 80-cadangan-tema.js:86 | 2 | 0 |  |
| `bkDo` | fungsi | 80-cadangan-tema.js:21 | 3 | 0 |  |
| `bkFull` | fungsi | 80-cadangan-tema.js:20 | 1 | 0 |  |
| `bkLast` | fungsi | 80-cadangan-tema.js:84 | 2 | 0 |  |
| `bkMark` | fungsi | 80-cadangan-tema.js:85 | 4 | 0 |  |
| `bkRemind` | fungsi | 80-cadangan-tema.js:89 | 3 | 0 | ya |
| `bkText` | fungsi | 80-cadangan-tema.js:18 | 0 | 0 |  |
| `bpFail` | fungsi | 80-cadangan-tema.js:45 | 1 | 0 |  |
| `bpInfo` | fungsi | 80-cadangan-tema.js:25 | 2 | 0 |  |
| `calc` | variabel | 10-calc.js:12 | 15 | 0 | ya |
| `calcNV` | fungsi | 50-promosi.js:13 | 1 | 0 |  |
| `calcSync` | variabel | 10-calc.js:7 | 1 | 0 |  |
| `capG` | variabel | 10-calc.js:2 | 1 | 0 |  |
| `card` | fungsi | 20-hitung-etalase.js:46 | 2 | 0 |  |
| `cardBody` | fungsi | 20-hitung-etalase.js:13 | 1 | 0 |  |
| `cbc` | variabel | 10-calc.js:6 | 1 | 0 | ya |
| `clearMark` | fungsi | 20-hitung-etalase.js:93 | 2 | 0 | ya |
| `colL` | fungsi | 20-hitung-etalase.js:55 | 4 | 0 | ya |
| `copyBk` | fungsi | 80-cadangan-tema.js:34 | 2 | 0 |  |
| `copySales` | fungsi | 60-tab-impor-sinkron.js:15 | 1 | 0 | ya |
| `csv` | fungsi | 60-tab-impor-sinkron.js:22 | 4 | 0 | ya |
| `csvSafe` | fungsi | 60-tab-impor-sinkron.js:21 | 2 | 0 |  |
| `curP` | variabel | 30-penjualan.js:4 | 1 | 0 | ya |
| `dd` | variabel | 10-calc.js:6 | 1 | 0 | ya |
| `dep` | fungsi | 20-hitung-etalase.js:56 | 1 | 0 |  |
| `dl` | fungsi | 60-tab-impor-sinkron.js:24 | 5 | 0 | ya |
| `dup` | fungsi | 20-hitung-etalase.js:50 | 1 | 0 |  |
| `errH` | variabel | 20-hitung-etalase.js:8 | 1 | 0 |  |
| `errModel` | variabel | 20-hitung-etalase.js:10 | 0 | 0 |  |
| `etAll` | fungsi | 20-hitung-etalase.js:85 | 1 | 0 | ya |
| `etSet` | fungsi | 20-hitung-etalase.js:84 | 3 | 0 |  |
| `etUn` | fungsi | 20-hitung-etalase.js:83 | 4 | 0 |  |
| `feeSig` | variabel | 20-hitung-etalase.js:4 | 2 | 0 | ya |
| `fees` | variabel | 10-calc.js:7 | 3 | 0 | ya |
| `fill` | variabel | 20-hitung-etalase.js:65 | 10 | 0 | ya |
| `fillT` | variabel | 20-hitung-etalase.js:2 | 1 | 0 |  |
| `fk` | fungsi | 20-hitung-etalase.js:12 | 2 | 0 | ya |
| `flt` | fungsi | 20-hitung-etalase.js:67 | 6 | 0 |  |
| `fwd` | variabel | 10-calc.js:7 | 1 | 0 | ya |
| `fwdL` | variabel | 10-calc.js:7 | 17 | 0 | ya |
| `fwdV` | fungsi | 50-promosi.js:46 | 4 | 0 |  |
| `gcOf` | variabel | 10-calc.js:2 | 0 | 0 |  |
| `getDprev` | variabel | 20-hitung-etalase.js:79 | 1 | 0 | ya |
| `gfac` | variabel | 10-calc.js:2 | 3 | 0 | ya |
| `goProd` | fungsi | 20-hitung-etalase.js:94 | 1 | 0 |  |
| `goRate` | variabel | 10-calc.js:2 | 3 | 0 | ya |
| `goT` | variabel | 10-calc.js:2 | 0 | 0 |  |
| `gwarn` | fungsi | 20-hitung-etalase.js:57 | 1 | 0 |  |
| `hasData` | fungsi | 80-cadangan-tema.js:87 | 1 | 0 |  |
| `hrCol` | fungsi | 60-tab-impor-sinkron.js:149 | 1 | 0 |  |
| `hrGo` | fungsi | 60-tab-impor-sinkron.js:171 | 1 | 0 |  |
| `hrSync` | fungsi | 60-tab-impor-sinkron.js:155 | 2 | 0 |  |
| `hyd` | fungsi | 20-hitung-etalase.js:48 | 4 | 0 |  |
| `imp` | fungsi | 60-tab-impor-sinkron.js:58 | 1 | 0 |  |
| `impGo` | fungsi | 60-tab-impor-sinkron.js:64 | 1 | 0 |  |
| `impGx` | fungsi | 60-tab-impor-sinkron.js:53 | 2 | 0 |  |
| `impGxK` | fungsi | 60-tab-impor-sinkron.js:54 | 2 | 0 |  |
| `impGxO` | fungsi | 60-tab-impor-sinkron.js:55 | 1 | 0 |  |
| `impGxStat` | fungsi | 60-tab-impor-sinkron.js:56 | 1 | 0 |  |
| `impas` | variabel | 10-calc.js:7 | 4 | 0 | ya |
| `inertBg` | variabel | 20-hitung-etalase.js:79 | 1 | 0 | ya |
| `isQuota` | fungsi | 80-cadangan-tema.js:68 | 2 | 0 |  |
| `lflush` | fungsi | 80-cadangan-tema.js:94 | 6 | 0 | ya |
| `lflushDurable` | fungsi | 80-cadangan-tema.js:96 | 1 | 0 |  |
| `lsave` | fungsi | 80-cadangan-tema.js:72 | 2 | 0 |  |
| `lt` | variabel | 80-cadangan-tema.js:94 | 4 | 2 |  |
| `mchg` | variabel | 20-hitung-etalase.js:6 | 1 | 0 |  |
| `migPt` | fungsi | 50-promosi.js:5 | 1 | 0 | ya |
| `obDone` | fungsi | 80-cadangan-tema.js:110 | 2 | 0 |  |
| `obInit` | fungsi | 80-cadangan-tema.js:111 | 1 | 0 | ya |
| `openVerify` | fungsi | 80-cadangan-tema.js:118 | 2 | 0 |  |
| `paSync` | fungsi | 50-promosi.js:205 | 3 | 0 | ya |
| `parseCsv` | fungsi | 60-tab-impor-sinkron.js:32 | 9 | 0 | ya |
| `pc1` | variabel | 20-hitung-etalase.js:6 | 16 | 0 | ya |
| `pcalc` | fungsi | 50-promosi.js:181 | 1 | 0 |  |
| `pcalc2` | fungsi | 50-promosi.js:49 | 1 | 0 |  |
| `pdd` | fungsi | 50-promosi.js:137 | 1 | 0 |  |
| `pdet` | fungsi | 50-promosi.js:119 | 3 | 0 |  |
| `pds` | fungsi | 50-promosi.js:136 | 2 | 0 |  |
| `persist` | fungsi | 80-cadangan-tema.js:97 | 21 | 0 | ya |
| `pfCard` | fungsi | 50-promosi.js:195 | 1 | 0 |  |
| `pgm` | fungsi | 50-promosi.js:55 | 1 | 0 |  |
| `phm` | fungsi | 50-promosi.js:62 | 1 | 0 |  |
| `pinfo` | fungsi | 50-promosi.js:48 | 27 | 0 |  |
| `pitD` | fungsi | 50-promosi.js:134 | 2 | 0 |  |
| `pitH` | fungsi | 50-promosi.js:133 | 3 | 0 |  |
| `pitM` | fungsi | 50-promosi.js:132 | 3 | 0 |  |
| `pitPh` | fungsi | 50-promosi.js:135 | 2 | 0 |  |
| `pitSync` | fungsi | 50-promosi.js:138 | 1 | 0 |  |
| `pitems` | fungsi | 50-promosi.js:139 | 2 | 0 |  |
| `pkClose` | fungsi | 50-promosi.js:163 | 3 | 0 |  |
| `pkKey` | fungsi | 50-promosi.js:164 | 2 | 0 |  |
| `pkOk` | fungsi | 50-promosi.js:162 | 3 | 0 |  |
| `pkOpen` | fungsi | 50-promosi.js:165 | 3 | 0 |  |
| `pkombo` | fungsi | 50-promosi.js:81 | 1 | 0 |  |
| `pmain` | fungsi | 50-promosi.js:144 | 1 | 0 |  |
| `ppd` | fungsi | 50-promosi.js:112 | 1 | 0 |  |
| `ppt` | fungsi | 50-promosi.js:127 | 1 | 0 |  |
| `pr` | variabel (nilai fungsi) | 00-core.js:6 | 5 | 0 | ya |
| `prRender` | fungsi | 50-promosi.js:211 | 16 | 0 | ya |
| `prRes` | fungsi | 50-promosi.js:204 | 3 | 0 |  |
| `prTiles` | fungsi | 50-promosi.js:206 | 2 | 0 |  |
| `pruneAge` | fungsi | 80-cadangan-tema.js:69 | 1 | 0 |  |
| `psig` | fungsi | 50-promosi.js:12 | 2 | 0 | ya |
| `pst` | variabel | 10-calc.js:6 | 7 | 0 | ya |
| `ptc` | fungsi | 50-promosi.js:149 | 10 | 0 |  |
| `ptp` | fungsi | 50-promosi.js:6 | 5 | 0 | ya |
| `pun` | fungsi | 50-promosi.js:111 | 2 | 0 |  |
| `push` | fungsi | 80-cadangan-tema.js:101 | 1 | 0 |  |
| `pvoucher` | fungsi | 50-promosi.js:98 | 1 | 0 |  |
| `qWarn` | variabel | 80-cadangan-tema.js:67 | 2 | 2 |  |
| `rate` | variabel | 10-calc.js:2 | 1 | 0 |  |
| `ref` | variabel | 80-cadangan-tema.js:93 | 2 | 0 |  |
| `refreshLabels` | variabel | 20-hitung-etalase.js:2 | 3 | 0 |  |
| `restoreText` | fungsi | 80-cadangan-tema.js:62 | 2 | 0 |  |
| `revHtml` | variabel | 20-hitung-etalase.js:8 | 1 | 0 |  |
| `rlAll` | variabel | 30-penjualan.js:4 | 1 | 0 | ya |
| `rpt` | variabel | 30-penjualan.js:4 | 1 | 0 | ya |
| `rw` | fungsi | 50-promosi.js:7 | 75 | 0 |  |
| `salesRows` | fungsi | 60-tab-impor-sinkron.js:13 | 2 | 0 | ya |
| `saveWarn` | fungsi | 80-cadangan-tema.js:71 | 1 | 0 |  |
| `setDprev` | variabel | 20-hitung-etalase.js:79 | 1 | 0 | ya |
| `setStock` | fungsi | 20-hitung-etalase.js:81 | 3 | 0 | ya |
| `shop` | variabel | 20-hitung-etalase.js:10 | 5 | 0 | ya |
| `shopChips` | variabel | 20-hitung-etalase.js:10 | 0 | 0 |  |
| `shopPrice` | variabel | 20-hitung-etalase.js:10 | 0 | 0 |  |
| `showBp` | fungsi | 80-cadangan-tema.js:32 | 3 | 0 |  |
| `showCpBox` | fungsi | 60-tab-impor-sinkron.js:14 | 2 | 0 | ya |
| `skHi` | variabel | 20-hitung-etalase.js:6 | 1 | 0 |  |
| `snapState` | fungsi | 80-cadangan-tema.js:65 | 5 | 0 |  |
| `sold` | variabel | 30-penjualan.js:4 | 1 | 0 | ya |
| `sp` | variabel | 20-hitung-etalase.js:8 | 1 | 0 |  |
| `srt` | fungsi | 20-hitung-etalase.js:69 | 6 | 0 | ya |
| `stk` | variabel | 20-hitung-etalase.js:6 | 1 | 0 |  |
| `strip` | fungsi | 20-hitung-etalase.js:11 | 6 | 0 | ya |
| `sy` | fungsi | 80-cadangan-tema.js:92 | 3 | 0 |  |
| `syCol` | fungsi | 60-tab-impor-sinkron.js:77 | 1 | 0 |  |
| `syGo` | fungsi | 60-tab-impor-sinkron.js:99 | 1 | 0 |  |
| `syLocal` | fungsi | 80-cadangan-tema.js:88 | 3 | 0 | ya |
| `sySync` | fungsi | 60-tab-impor-sinkron.js:81 | 2 | 0 |  |
| `syUrl` | fungsi | 60-tab-impor-sinkron.js:73 | 2 | 0 |  |
| `syncVL` | fungsi | 80-cadangan-tema.js:16 | 5 | 0 | ya |
| `tab` | fungsi | 60-tab-impor-sinkron.js:1 | 17 | 2 | ya |
| `tbl` | fungsi | 60-tab-impor-sinkron.js:7 | 2 | 0 |  |
| `tblSync` | variabel | 20-hitung-etalase.js:2 | 2 | 0 |  |
| `tbuild` | variabel | 20-hitung-etalase.js:2 | 1 | 0 | ya |
| `tchk` | variabel | 20-hitung-etalase.js:2 | 2 | 1 | ya |
| `tgl` | fungsi | 20-hitung-etalase.js:97 | 3 | 0 | ya |
| `tlLast` | fungsi | 80-cadangan-tema.js:5 | 1 | 0 |  |
| `tlOk` | fungsi | 80-cadangan-tema.js:2 | 5 | 0 | ya |
| `tlRender` | fungsi | 80-cadangan-tema.js:3 | 4 | 0 | ya |
| `tm` | variabel | 80-cadangan-tema.js:93 | 1 | 1 |  |
| `tmod` | variabel | 10-calc.js:7 | 9 | 0 | ya |
| `toast` | variabel | 20-hitung-etalase.js:79 | 83 | 0 | ya |
| `upd` | variabel | 20-hitung-etalase.js:64 | 29 | 0 | ya |
| `updRow` | variabel | 20-hitung-etalase.js:61 | 2 | 0 |  |
| `vbest` | variabel | 10-calc.js:7 | 2 | 0 | ya |
| `vcApply` | variabel | 10-calc.js:6 | 2 | 0 | ya |
| `vcBad` | variabel | 10-calc.js:6 | 2 | 0 |  |
| `vcBest` | variabel | 10-calc.js:6 | 2 | 0 |  |
| `vcEff` | fungsi | 50-promosi.js:42 | 1 | 0 |  |
| `vcLab` | variabel | 10-calc.js:6 | 2 | 0 | ya |
| `vcList` | variabel | 10-calc.js:6 | 4 | 0 | ya |
| `vcSoon` | fungsi | 50-promosi.js:26 | 3 | 0 |  |
| `vcThr` | variabel | 10-calc.js:6 | 2 | 0 |  |
| `vcWhy` | fungsi | 50-promosi.js:32 | 1 | 0 |  |
| `vdisc` | variabel | 10-calc.js:6 | 3 | 0 | ya |
| `vfKeep` | variabel | 40-voucher-panel.js:5 | 2 | 0 | ya |
| `vgSync` | variabel | 40-voucher-panel.js:5 | 2 | 0 | ya |
| `vnote` | fungsi | 50-promosi.js:21 | 1 | 0 | ya |
| `volt` | variabel | 10-calc.js:7 | 1 | 0 | ya |
| `vsc` | fungsi | 50-promosi.js:14 | 2 | 0 |  |
| `vscT` | fungsi | 50-promosi.js:19 | 2 | 0 |  |
| `vscn` | fungsi | 50-promosi.js:20 | 1 | 0 | ya |
| `vwarn` | fungsi | 50-promosi.js:28 | 1 | 0 | ya |
| `warns` | variabel | 20-hitung-etalase.js:6 | 11 | 0 | ya |
| `ymd` | variabel | 30-penjualan.js:4 | 1 | 0 | ya |

## 5. Nama yang dipanggil lewat teks HTML (onclick="..." dan sejenisnya)

Pembaca kode biasa tidak melihat pemanggilan ini karena tertulis di dalam teks. Bila fungsi-fungsi ini dipindah ke modul tanpa dipasang ke `window`, tombolnya mati. Pemeriksa mencari pola `on...="nama(...)"` di string js/app-core.js, js/*.js, components/*.js, dan index.html.

Tidak ada.

## 6. Perhatian tambahan

**Nama didefinisikan lebih dari sekali** (0): tidak ada.

**Dipakai saat aplikasi dimuat sebelum didefinisikan** (0): tidak ada. (Untuk `var`, nilainya `undefined` saat itu; ini jebakan urutan bila berkas diatur ulang.)

**Akses dinamis** (`window[...]`, `eval`, `new Function`): tidak ada.

**Nama yang dibaca/ditulis lewat `window.` atau `globalThis.`** di legacy: `KShelf` (baca) di 20-hitung-etalase.js:10; `KalsaraMoney` (baca) di 00-core.js:6, 10-calc.js:7, 50-promosi.js:6, 50-promosi.js:46, 50-promosi.js:46, 50-promosi.js:46; `KalsaraWorker` (baca) di 10-calc.js:11; `addEventListener` (baca) di 80-cadangan-tema.js:98, 80-cadangan-tema.js:100; `fetch` (baca) di 60-tab-impor-sinkron.js:101, 60-tab-impor-sinkron.js:173; `scrollTo` (baca) di 60-tab-impor-sinkron.js:1.

**Fungsi bersarang** (dideklarasikan di dalam fungsi lain, bukan global): `OM`, `go`, `draw`.

### Nama dari luar legacy (tidak dideklarasikan di js/app-core.js)

| Nama | Asal | Dibaca | Ditulis |
|---|---|---:|---:|
| `AD` | impor (./tariff.js) | 1 | 0 |
| `Array` | bawaan JS | 9 | 0 |
| `Blob` | peramban | 1 | 0 |
| `Boolean` | bawaan JS | 9 | 0 |
| `Date` | bawaan JS | 16 | 0 |
| `Event` | peramban | 1 | 0 |
| `File` | peramban | 1 | 0 |
| `FileReader` | peramban | 4 | 0 |
| `GO` | impor (./tariff.js) | 1 | 0 |
| `GO2` | impor (./tariff.js) | 1 | 0 |
| `IntersectionObserver` | peramban | 2 | 0 |
| `JSON` | bawaan JS | 6 | 0 |
| `KDOM` | skrip lain (js/dom.js) | 22 | 0 |
| `KStore` | skrip lain (js/main.js) | 18 | 0 |
| `Map` | bawaan JS | 1 | 0 |
| `Math` | bawaan JS | 70 | 0 |
| `NaN` | bawaan JS | 4 | 0 |
| `Number` | bawaan JS | 3 | 0 |
| `Object` | bawaan JS | 17 | 0 |
| `PCT` | impor (./format.js) | 2 | 0 |
| `SGL` | impor (./helpers.js) | 1 | 0 |
| `State` | impor (./state.js) | 198 | 0 |
| `String` | bawaan JS | 34 | 0 |
| `URL` | peramban | 2 | 0 |
| `clearTimeout` | peramban | 5 | 0 |
| `createBackup` | impor (./backup.js) | 1 | 0 |
| `createCalcCache` | impor (./calc-cache.js) | 1 | 0 |
| `createERP` | impor (./erp.js) | 1 | 0 |
| `createEtalaseView` | impor (./etalase-view.js) | 1 | 0 |
| `createFeeSig` | impor (./helpers.js) | 1 | 0 |
| `createFiller` | impor (./upd-fill.js) | 1 | 0 |
| `createHasilView` | impor (./hasil-view.js) | 1 | 0 |
| `createKartuUpdate` | impor (./kartu-update.js) | 1 | 0 |
| `createPWA` | impor (./pwa.js) | 1 | 0 |
| `createPenjualan` | impor (./penjualan.js) | 1 | 0 |
| `createPricing` | impor (./pricing.js) | 1 | 0 |
| `createTarifUI` | impor (./tarif-ui.js) | 1 | 0 |
| `createTariff` | impor (./tariff.js) | 1 | 0 |
| `createTheme` | impor (./theme.js) | 1 | 0 |
| `createUI` | impor (./ui.js) | 1 | 0 |
| `createUpdater` | impor (./upd-fill.js) | 1 | 0 |
| `createVoucherPanel` | impor (./voucher-panel.js) | 1 | 0 |
| `createVoucherRules` | impor (./voucher-rules.js) | 1 | 0 |
| `createWarnings` | impor (./warnings.js) | 1 | 0 |
| `createXlsxReader` | impor (./xlsx-reader.js) | 1 | 0 |
| `document` | peramban | 44 | 0 |
| `dtx` | impor (./helpers.js) | 6 | 0 |
| `esc` | impor (./helpers.js) | 41 | 0 |
| `fetch` | peramban | 2 | 0 |
| `fmt` | impor (./format.js) | 28 | 0 |
| `globalThis` | bawaan JS | 8 | 0 |
| `isFinite` | bawaan JS | 1 | 0 |
| `isNaN` | bawaan JS | 6 | 0 |
| `navigator` | peramban | 15 | 0 |
| `num` | impor (./format.js) | 21 | 0 |
| `parseBackupText` | impor (./backup-format.js) | 1 | 0 |
| `pf` | impor (./format.js) | 3 | 0 |
| `prodSig` | impor (./helpers.js) | 2 | 0 |
| `requestAnimationFrame` | peramban | 2 | 0 |
| `rp` | impor (./format.js) | 92 | 0 |
| `setTimeout` | peramban | 9 | 0 |
| `today` | impor (./format.js) | 22 | 0 |
| `uid` | impor (./helpers.js) | 4 | 0 |
| `undefined` | bawaan JS | 22 | 0 |
| `window` | peramban | 5 | 0 |

## 7. Batas pemeriksa (yang TIDAK terlihat)

- Nama yang dirangkai menjadi teks lalu dijalankan (`eval`, `new Function`, `window[nama]`) dicatat di bagian 6 bila ada, tetapi isinya tidak bisa ditelusuri.
- Panggilan lewat teks HTML hanya dikenali dengan pola `on...="nama("`. Cara lain (mis. `data-aksi` yang diterjemahkan kode lain) tidak terlihat.
- Pemakaian oleh `workers/` dan `components/` tidak dihitung sebagai pemakai global legacy (Worker tidak bisa melihat variabel halaman).
- Pemeriksa membaca kode, tidak menjalankannya. Perilaku aplikasi tetap dijaga `npm test` dan E2E.
