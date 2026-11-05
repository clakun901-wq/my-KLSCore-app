// Menjaga pemecahan js/legacy-app.js (v9.14): daftar bagian, urutan, sintaks tiap bagian, dan cache offline.
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {legacyParts, readLegacyPartsOnly, erpModuleSource} from './helpers/legacy-source.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const dir = new URL('../js/legacy/', import.meta.url);
ok(legacyParts.length >= 10, 'legacy harus terdiri dari beberapa bagian');
ok(new Set(legacyParts).size === legacyParts.length, 'nama bagian tidak boleh dobel');
ok(JSON.stringify(legacyParts) === JSON.stringify([...legacyParts].sort()), 'bagian harus berurutan menurut awalan angka (urutan = urutan eksekusi)');
const onDisk = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
ok(JSON.stringify(onDisk) === JSON.stringify([...legacyParts].sort()), 'setiap berkas js/legacy/*.js harus terdaftar di parts.json dan sebaliknya');
for (const name of legacyParts) {
  const src = fs.readFileSync(new URL(name, dir), 'utf8');
  ok(src.endsWith('\n'), name + ' harus diakhiri baris baru agar penggabungan aman');
  assert.doesNotThrow(() => new vm.Script('"use strict";' + src, {filename: name}), name + ' harus valid sebagai potongan statement utuh');
  n++;
}
ok(!/^\s*(import|export)\s/m.test(readLegacyPartsOnly()), 'bagian legacy tidak boleh memakai import/export (hanya js/legacy-app.js yang menyisipkan import untuk modul ES terpisah)');
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
for (const f of ['parts.json', ...legacyParts]) ok(sw.includes("'./js/legacy/" + f + "'"), 'sw.js CORE harus menyebut js/legacy/' + f);
const loader = fs.readFileSync(new URL('../js/legacy-app.js', import.meta.url), 'utf8');
/* v9.24: loader berbasis daftar `modules`; pemeriksa ini memastikan sebuah modul terdaftar dengan nama impor yang tepat. */
const loaderImports = (file, names) => loader.includes("['" + file + "', '" + names + "']");
ok(/parts\.json/.test(loader) && /import\(url\)/.test(loader), 'js/legacy-app.js harus berupa loader bagian-bagian');
ok(loader.split('\n').length < 30, 'loader harus tetap kecil; logika bisnis tidak boleh kembali ke sini');
// Tahap 2 (v9.15): ERP adalah modul ES sungguhan dengan dependensi eksplisit.
const erp = erpModuleSource();
ok(/^export function createERP\(\{\$, today, toast, getRows\}\)/m.test(erp), 'js/erp.js harus mengekspor createERP dengan dependensi eksplisit');
for (const imp of ["from './storage.js'", "from './worker-client.js'", "from './money.js'", "from './dom.js'"]) ok(erp.includes(imp), 'js/erp.js harus mengimpor ' + imp);
ok(!/globalThis\.(KStore|KalsaraWorker|KalsaraMoney|KDOM)|window\.rows/.test(erp), 'js/erp.js tidak boleh membaca global tersembunyi');
const part90 = fs.readFileSync(new URL('90-erp.js', dir), 'utf8');
ok(/var ERP=createERP\(/.test(part90) && part90.split('\n').length < 6, '90-erp.js hanya memasang dependensi, tanpa logika ERP');
ok(/return getRows\(\)\.map\(/.test(erp) && /var P=getRows\(\),/.test(erp), 'js/erp.js membaca daftar produk lewat getRows() di prodsLite dan mt');
ok(/getRows:function\(\)\{return rows\}/.test(part90), 'daftar produk harus dibaca segar lewat getRows (rows bisa diganti applyState)');
ok(loaderImports('./erp.js', 'createERP'), 'loader harus menyisipkan import createERP dari js/erp.js');
ok(sw.includes("'./js/erp.js'"), 'sw.js CORE harus menyebut js/erp.js');
console.log(`Legacy split audit: ${n} assertions passed (${legacyParts.length} bagian).`);

// Tahap 3 parsial (v9.16): XLSX Reader dan PWA dipindahkan menjadi modul ES dengan bridge eksplisit.
const xlsx = fs.readFileSync(new URL('../js/xlsx-reader.js', import.meta.url), 'utf8');
const pwa = fs.readFileSync(new URL('../js/pwa.js', import.meta.url), 'utf8');
for (const [name, src, exp] of [['xlsx-reader', xlsx, 'createXlsxReader'], ['pwa', pwa, 'createPWA']]) {
  ok(src.includes('export function ' + exp), name + ' harus mengekspor factory ES');
  execFileSync(process.execPath, ['--check', new URL('../js/' + name + '.js', import.meta.url).pathname]); n++;
}
ok(xlsx.includes("from './money.js'") && xlsx.includes('getRows') && xlsx.includes('replaceRows'), 'XLSX Reader harus memakai dependensi eksplisit dan bridge rows dinamis');
ok(pwa.includes('export function createPWA({ $, toast, lflush, APPV'), 'PWA harus menerima dependensi aplikasi eksplisit');
for (const f of ['xlsx-reader.js', 'pwa.js']) ok(sw.includes("'./js/" + f + "'"), 'sw.js CORE harus menyebut js/' + f);
ok(loaderImports('./xlsx-reader.js', 'createXlsxReader') && loaderImports('./pwa.js', 'createPWA'), 'loader harus mengimpor factory XLSX Reader dan PWA');
// Tahap 3 (v9.17): preferensi tema dan parser cadangan dipisahkan dari orkestrasi state legacy.
const theme = fs.readFileSync(new URL('../js/theme.js', import.meta.url), 'utf8');
const backupFormat = fs.readFileSync(new URL('../js/backup-format.js', import.meta.url), 'utf8');
ok(theme.includes('export function createTheme({ $, KStore, KDOM, toast, document })'), 'tema harus berupa factory ES dengan dependensi eksplisit');
ok(!/\bwindow\.|globalThis\./.test(theme), 'modul tema tidak boleh membaca global tersembunyi');
ok(backupFormat.includes('export function parseBackupText(text)'), 'parser cadangan harus diekspor sebagai fungsi murni');
ok(!/KStore|localStorage|sessionStorage|ERP\./.test(backupFormat), 'parser cadangan tidak boleh menyentuh storage atau ERP');
for (const f of ['theme.js', 'backup-format.js']) {
  execFileSync(process.execPath, ['--check', new URL('../js/' + f, import.meta.url).pathname]); n++;
  ok(sw.includes("'./js/" + f + "'"), 'sw.js CORE harus menyebut js/' + f);
}
ok(loaderImports('./theme.js', 'createTheme') && loaderImports('./backup-format.js', 'parseBackupText'), 'loader harus mengimpor modul tema dan parser cadangan');
const backupPart = fs.readFileSync(new URL('80-cadangan-tema.js', dir), 'utf8');
ok(/Backup\.restoreText\(txt\)/.test(backupPart), 'restoreText legacy harus meneruskan ke modul orkestrasi cadangan');
const backupModule = fs.readFileSync(new URL('../js/backup.js', import.meta.url), 'utf8');
ok(backupModule.includes('export function createBackup('), 'orkestrasi cadangan harus menjadi factory ES');
ok(/getSales\(\)\.slice\(\)/.test(backupModule), 'restore backup ringan harus membaca sales terbaru lewat getter dinamis');
ok(!/window\.|globalThis\./.test(backupModule), 'modul cadangan tidak boleh membaca global tersembunyi');
execFileSync(process.execPath, ['--check', new URL('../js/backup.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/backup.js'"), 'sw.js CORE harus menyebut js/backup.js');
ok(loaderImports('./backup.js', 'createBackup'), 'loader harus mengimpor factory backup');
ok(/createTheme\(\{\$,KStore,KDOM,toast,document\}\)/.test(backupPart), 'legacy harus memasang factory tema dengan dependensi eksplisit');
// Tahap 4a (v9.20): pembaca angka/format/tanggal murni dipisahkan dari 00-core.js.
const formatMod = fs.readFileSync(new URL('../js/format.js', import.meta.url), 'utf8');
for (const name of ['rp', 'pf', 'num', 'fmt', 'PCT', 'today']) ok(new RegExp('export (const|function) ' + name + '\\b').test(formatMod), 'format.js harus mengekspor ' + name);
ok(!/\bwindow\.|globalThis\.|document\.|KStore/.test(formatMod), 'format.js tidak boleh membaca global tersembunyi atau DOM');
ok(!/parseFloat/.test(formatMod), 'format.js tidak boleh memakai parseFloat');
execFileSync(process.execPath, ['--check', new URL('../js/format.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/format.js'"), 'sw.js CORE harus menyebut js/format.js');
ok(loaderImports('./format.js', 'rp, pf, num, fmt, PCT, today'), 'loader harus mengimpor modul format');
const core = fs.readFileSync(new URL('00-core.js', dir), 'utf8');
ok(!/^(var rp=|function pf\(|var num=|var fmt=|function today\(|var PCT=)/m.test(core), '00-core.js tidak boleh lagi mendefinisikan ulang fungsi format');
// Tahap 4b (v9.21): tabel dan fungsi tarif dipisahkan dari 10-calc.js.
const tariffMod = fs.readFileSync(new URL('../js/tariff.js', import.meta.url), 'utf8');
for (const name of ['GO', 'GO2', 'GO2D', 'AD']) ok(new RegExp('export const ' + name + '=').test(tariffMod), 'tariff.js harus mengekspor ' + name);
ok(tariffMod.includes('export function createTariff({getA})'), 'tariff.js harus berupa factory dengan getA eksplisit');
ok(!/\bwindow\.|globalThis\.|document\.|KStore/.test(tariffMod), 'tariff.js tidak boleh membaca global tersembunyi atau DOM');
execFileSync(process.execPath, ['--check', new URL('../js/tariff.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/tariff.js'"), 'sw.js CORE harus menyebut js/tariff.js');
ok(loaderImports('./tariff.js', 'GO, GO2, GO2D, AD, createTariff'), 'loader harus mengimpor modul tarif');
const calcPart = fs.readFileSync(new URL('10-calc.js', dir), 'utf8');
ok(!/^(var GO=|var GO2=|var AD=|function (gcOf|goT|capG|gfac|goRate|adRate|rate)\()/m.test(calcPart), '10-calc.js tidak boleh lagi mendefinisikan ulang tarif');
ok(/createTariff\(\{getA:function\(\)\{return A\}\}\)/.test(calcPart), 'legacy harus memasang factory tarif dengan getter A');
// Tahap 4c (v9.22): pipa harga sinkron dipisahkan dari 10-calc.js.
const pricingMod = fs.readFileSync(new URL('../js/pricing.js', import.meta.url), 'utf8');
ok(pricingMod.includes('export function createPricing({getA,getVNO,pr,Money,tariff,hooks})'), 'pricing.js harus berupa factory dengan dependensi eksplisit');
for (const name of ['vbest', 'volt', 'fees', 'tmod', 'fwdL', 'fwd', 'impas', 'calcSync']) ok(new RegExp('function ' + name + '\\(').test(pricingMod), 'pricing.js harus memuat ' + name);
ok(!/\bwindow\.|globalThis\.|document\.|KStore|\bVNO\b(?!\))/.test(pricingMod.replace(/getVNO/g, '').replace(/\/\*[\s\S]*?\*\//g, '')), 'pricing.js tidak boleh membaca global tersembunyi, DOM, atau VNO langsung');
execFileSync(process.execPath, ['--check', new URL('../js/pricing.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/pricing.js'"), 'sw.js CORE harus menyebut js/pricing.js');
ok(loaderImports('./pricing.js', 'createPricing'), 'loader harus mengimpor modul pipa harga');
const calcPart2 = fs.readFileSync(new URL('10-calc.js', dir), 'utf8');
ok(!/^function (vbest|volt|fees|tmod|fwdL|fwd|impas|calcSync)\(/m.test(calcPart2), '10-calc.js tidak boleh lagi mendefinisikan ulang pipa harga');
ok(/createPricing\(\{getA:function\(\)\{return A\},getVNO:function\(\)\{return VNO\}/.test(calcPart2), 'legacy harus memasang factory pipa harga dengan getA dan getVNO');
ok(/var VNO=0;/.test(calcPart2), 'flag VNO harus tetap di legacy (dimutasi calcNV)');
// Tahap 4d (v9.24): cache kalkulator + pra-hitung Worker dipisahkan dari 10-calc.js.
const ccMod = fs.readFileSync(new URL('../js/calc-cache.js', import.meta.url), 'utf8');
ok(ccMod.includes('export function createCalcCache({getA,getPRM,getRows,getVNO,getWorker,calcSync,onReady})'), 'calc-cache.js harus berupa factory dengan dependensi eksplisit');
for (const name of ['gver', 'rkey', 'staleRows', 'prewarm', 'pwKick', 'calc', 'invalidate', 'prewarmStale']) ok(new RegExp('function ' + name + '\\(').test(ccMod), 'calc-cache.js harus memuat ' + name);
ok(!/\bwindow\.|globalThis\.|document\.|KStore/.test(ccMod.replace(/\/\*[\s\S]*?\*\//g, '')), 'calc-cache.js tidak boleh membaca global tersembunyi atau DOM');
execFileSync(process.execPath, ['--check', new URL('../js/calc-cache.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/calc-cache.js'"), 'sw.js CORE harus menyebut js/calc-cache.js');
ok(loaderImports('./calc-cache.js', 'createCalcCache'), 'loader harus mengimpor modul cache kalkulator');
const calcPart3 = fs.readFileSync(new URL('10-calc.js', dir), 'utf8');
ok(!/^function (gver|rkey|staleRows|prewarm|pwKick|calc)\(/m.test(calcPart3) && !/var CC=new Map/.test(calcPart3), '10-calc.js tidak boleh lagi mendefinisikan ulang cache kalkulator');
for (const f of ['20-hitung-etalase.js', '30-penjualan.js', '50-promosi.js', '80-cadangan-tema.js']) ok(!/(?<![\w.])GK=null/.test(fs.readFileSync(new URL(f, dir), 'utf8')), f + ' tidak boleh menulis GK langsung (pakai CalcCache.invalidate())');
ok(/var light=CalcCache\.prewarmStale\(only\)/.test(fs.readFileSync(new URL('20-hitung-etalase.js', dir), 'utf8')), 'upd() harus memakai CalcCache.prewarmStale');
// Tahap 5a (v9.25): aturan voucher dipisahkan dari 50-promosi.js ke js/voucher-rules.js.
const vrMod = fs.readFileSync(new URL('../js/voucher-rules.js', import.meta.url), 'utf8');
ok(vrMod.includes('export function createVoucherRules({getPRM,today,pr,fmt,rp})'), 'voucher-rules.js harus berupa factory dengan dependensi eksplisit');
for (const name of ['vdisc', 'cbc', 'dd', 'pst', 'vcList', 'vcApply', 'vcLab', 'vcBest', 'vcBad', 'vcThr', 'reset']) ok(new RegExp('function ' + name + '\\(').test(vrMod), 'voucher-rules.js harus memuat ' + name);
ok(!/\bwindow\.|globalThis\.|document\.|KStore|\$\(/.test(vrMod.replace(/\/\*[\s\S]*?\*\//g, '')), 'voucher-rules.js tidak boleh membaca global tersembunyi, DOM, atau penyimpanan');
execFileSync(process.execPath, ['--check', new URL('../js/voucher-rules.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/voucher-rules.js'"), 'sw.js CORE harus menyebut js/voucher-rules.js');
ok(loaderImports('./voucher-rules.js', 'createVoucherRules'), 'loader harus mengimpor modul aturan voucher');
const promoPart = fs.readFileSync(new URL('50-promosi.js', dir), 'utf8');
ok(!/^function (vdisc|cbc|dd|pst|vcList|vcApply|vcLab|vcBest|vcBad|vcThr)\(/m.test(promoPart) && !/var VCC=/.test(promoPart), '50-promosi.js tidak boleh lagi mendefinisikan ulang aturan voucher');
for (const f of ['30-penjualan.js', '50-promosi.js', '80-cadangan-tema.js']) ok(!/(?<![\w.])VCC\b/.test(fs.readFileSync(new URL(f, dir), 'utf8')), f + ' tidak boleh menulis VCC langsung (pakai VoucherRules.reset())');
ok(/createVoucherRules\(\{getPRM:function\(\)\{return PRM\}/.test(fs.readFileSync(new URL('10-calc.js', dir), 'utf8')), 'legacy harus memasang factory aturan voucher dengan getPRM segar');
// Tahap 5b (v9.26): jembatan state inti (js/state.js) dan tab Penjualan (js/penjualan.js) dipisahkan dari legacy.
const stMod = fs.readFileSync(new URL('../js/state.js', import.meta.url), 'utf8');
ok(stMod.includes('export function createState(bindings)') && stMod.includes("export const STATE_KEYS = Object.freeze(['A', 'rows', 'SALES', 'PRM', 'TS'])"), 'state.js harus mengekspor createState dan daftar kunci tetap');
ok(!/\bwindow\.|globalThis\.|document\.|KStore|localStorage/.test(stMod.replace(/\/\*[\s\S]*?\*\//g, '')), 'state.js tidak boleh membaca global tersembunyi atau storage');
const pjMod = fs.readFileSync(new URL('../js/penjualan.js', import.meta.url), 'utf8');
ok(pjMod.includes('export function createPenjualan({st,$,esc,today,rp,num,toast,ask,uid,KDOM,calc,fwdL,vbest,actL,ptp,getCFG,VoucherRules,CalcCache,setStock,persist,salesRows,copySales,showCpBox,dl,csv,getSalesMax})'), 'penjualan.js harus berupa factory dengan dependensi eksplisit');
for (const name of ['sold', 'curP', 'rpt', 'delSale', 'rlSet', 'rlAll', 'perS', 'bkHtml', 'fprod', 'sgrp', 'ymd']) ok(new RegExp('function ' + name + '\\(').test(pjMod), 'penjualan.js harus memuat ' + name);
ok(/return \{rpt:rpt,sold:sold,curP:curP,VUSE:VUSE,rlAll:rlAll,ymd:ymd\};/.test(pjMod), 'penjualan.js hanya mengekspos yang dipakai bagian legacy lain');
const pjCode = pjMod.replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/\bwindow\.|globalThis\.|document\.|KStore|localStorage/.test(pjCode), 'penjualan.js tidak boleh membaca global tersembunyi atau storage');
ok(!/(?<![\w.])(SALES|PRM|CFG|SALES_MAX|VCC|GK)\b(?!\s*:)/.test(pjCode.replace(/var CFG=getCFG\(\),m=0;[\s\S]*?(?=\nvar VUSE)/, '').replace(/CFG\[/g, '').replace(/\bst\.(SALES|PRM)\b/g, '')) , 'penjualan.js tidak boleh mengakses SALES/PRM/SALES_MAX langsung (pakai st/getSalesMax)');
for (const f of ['state.js', 'penjualan.js']) {
  execFileSync(process.execPath, ['--check', new URL('../js/' + f, import.meta.url).pathname]); n++;
  ok(sw.includes("'./js/" + f + "'"), 'sw.js CORE harus menyebut js/' + f);
}
ok(loaderImports('./state.js', 'createState') && loaderImports('./penjualan.js', 'createPenjualan'), 'loader harus mengimpor createState dan createPenjualan');
const core5b = fs.readFileSync(new URL('00-core.js', dir), 'utf8');
ok(/var State=createState\(\{A:\{get:function\(\)\{return A\},set:function\(v\)\{A=v\}\},rows:\{get:function\(\)\{return rows\},set:function\(v\)\{rows=v\}\},SALES:\{get:function\(\)\{return SALES\},set:function\(v\)\{SALES=v\}\},/.test(core5b) && /PRM:\{get:function\(\)\{return PRM\},set:function\(v\)\{PRM=v\}\},TS:\{get:function\(\)\{return TS\},set:function\(v\)\{TS=v\}\}\}\);/.test(core5b), '00-core.js harus memasang State dengan getter/setter segar untuk A, rows, SALES, PRM, TS');
ok(/,SALES=\[\],/.test(core5b), 'SALES tetap variabel legacy yang dideklarasikan di 00-core.js (sumber kebenaran sampai semua penugas ulang pindah)');
const part30 = fs.readFileSync(new URL('30-penjualan.js', dir), 'utf8');
ok(/var \{rpt,sold,curP,VUSE,rlAll,ymd\}=createPenjualan\(\{st:State,/.test(part30) && part30.split('\n').length < 10, '30-penjualan.js hanya memasang dependensi, tanpa logika tab');
ok(!/^(var SALES=|function (sold|curP|rpt|delSale|perS|bkHtml|fprod|sgrp|rlSet|rlOn|rlAll|ymd)\()/m.test(part30), '30-penjualan.js tidak boleh lagi mendefinisikan ulang logika penjualan');
ok(/getCFG:function\(\)\{return CFG\}/.test(part30) && /getSalesMax:function\(\)\{return SALES_MAX\}/.test(part30), 'CFG dan SALES_MAX dibaca saat dipanggil (didefinisikan di bagian setelahnya)');
for (const f of ['20-hitung-etalase.js', '50-promosi.js', '60-tab-impor-sinkron.js', '80-cadangan-tema.js']) ok(!/(?<![\w.])(RM|RD|RO|RPL|RLU|RLT|SW|swMoved)\b\s*=[^=]/.test(fs.readFileSync(new URL(f, dir), 'utf8')), f + ' tidak boleh menyentuh state privat tab Penjualan');
// Tahap 5c (v9.27): panel "Cek pesanan nyata" + dialog peringatan/panduan tarif (js/voucher-panel.js) dipisahkan dari legacy.
execFileSync(process.execPath, ['--check', new URL('../js/voucher-panel.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/voucher-panel.js'"), 'sw.js CORE harus menyebut js/voucher-panel.js');
ok(loaderImports('./voucher-panel.js', 'createVoucherPanel'), 'loader harus mengimpor createVoucherPanel');
const vpMod = fs.readFileSync(new URL('../js/voucher-panel.js', import.meta.url), 'utf8');
const vpParams = 'st,$,esc,num,rp,today,pr,KDOM,KStore,document,calc,volt,fees,gfac,toast,upd,fill,syncVL,prodSig,feeSig,tlOk,tlRender,dtx,inertBg,getDprev,setDprev';
ok(vpMod.includes('export function createVoucherPanel({' + vpParams + '})'), 'voucher-panel.js harus mengekspor createVoucherPanel dengan dependensi eksplisit');
ok(/return \{vgSync:vgSync,vfKeep:vfKeep\};\n\}\n$/.test(vpMod), 'voucher-panel.js hanya mengekspos yang dipakai bagian legacy lain (vgSync, vfKeep)');
const vpPrivate = ['VF', 'vfOpt', 'vfFill', 'vfN', 'vfLines', 'vfAuto', 'vfCombo', 'vfNum', 'vfAddRow', 'vfaState', 'vfRate', 'tlPush', 'vgOpen', 'vgClose', 'gdOpen', 'gdClose', 'vfSrc', 'vfSrc2', 'vfBtn'];
for (const name of [...vpPrivate, 'vgSync', 'vfKeep']) ok(name === 'VF' ? /var VF=/.test(vpMod) : new RegExp('function ' + name + '\\(').test(vpMod), 'voucher-panel.js harus memuat ' + name);
const vpCode = vpMod.replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/\bwindow\.|globalThis\.|localStorage/.test(vpCode), 'voucher-panel.js tidak boleh membaca global tersembunyi atau localStorage (document dan KStore disuntikkan)');
ok(!/(?<![\w$.])(A(?=\.)|rows|dprev|SALES|PRM|TS)(?![\w$])/.test(vpCode.replace(/(?<![\w$.])st\.(A|rows)\b/g, '')), 'voucher-panel.js tidak boleh mengakses A/rows/dprev/SALES/PRM/TS langsung (lewat st, getDprev/setDprev)');
const part40 = fs.readFileSync(new URL('40-voucher-panel.js', dir), 'utf8');
const wireKeys = (/createVoucherPanel\(\{([\s\S]*?)\}\);\s*$/.exec(part40) || [])[1] || '';
ok(/var \{vgSync,vfKeep\}=createVoucherPanel\(\{st:State,/.test(part40) && part40.split('\n').length < 12, '40-voucher-panel.js hanya memasang dependensi, tanpa logika panel');
ok(vpParams.split(',').every(k => new RegExp('(^|[,{\\s])' + k.replace('$', '\\$') + ':').test(wireKeys)) && vpParams.split(',').length === (wireKeys.match(/(?:^|[,{\s])[\w$]+:/g) || []).length, 'pemasangan di legacy harus menyuntikkan tepat semua dependensi factory');
ok(/getDprev:getDprev,setDprev:setDprev\}\);\s*$/.test(part40) && !/(?<![\w$.])dprev\b/.test(part40.replace(/\/\*[\s\S]*?\*\//g, '')), 'dprev dibagikan lewat getDprev/setDprev dari createUI (bagian 40 tidak menyentuh variabel dprev)');
ok(!/^(var VF=|function (vf[A-Za-z0-9]*|vg[A-Za-z]*|gd[A-Za-z]*|tlPush)\()/m.test(part40), '40-voucher-panel.js tidak boleh lagi mendefinisikan ulang logika panel');
for (const f of legacyParts.filter(f => f !== '40-voucher-panel.js')) ok(!new RegExp('(?<![\\w$.])(' + vpPrivate.join('|') + ')(?![\\w$])').test(fs.readFileSync(new URL(f, dir), 'utf8')), f + ' tidak boleh memakai fungsi panel yang kini privat (hanya vgSync/vfKeep yang dibagikan)');
ok(/vgSync\(\)/.test(fs.readFileSync(new URL('80-cadangan-tema.js', dir), 'utf8')) && /vfKeep\(\)/.test(fs.readFileSync(new URL('80-cadangan-tema.js', dir), 'utf8')), '80-cadangan-tema.js tetap memakai vgSync dan vfKeep dari hasil factory');
// Tahap 6a (v9.28): dialog konfirmasi (ask), inertBg, dan toast (js/ui.js) dipisahkan dari 20-hitung-etalase.js.
execFileSync(process.execPath, ['--check', new URL('../js/ui.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/ui.js'"), 'sw.js CORE harus menyebut js/ui.js');
ok(loaderImports('./ui.js', 'createUI'), 'loader harus mengimpor createUI');
const uiMod = fs.readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
ok(uiMod.includes('export function createUI({$,document}){'), 'ui.js harus mengekspor createUI({$,document})');
ok(/return \{inertBg:inertBg,ask:ask,toast:toast,getDprev:function\(\)\{return dprev\},setDprev:function\(v\)\{dprev=v\}\};\n\}\n$/.test(uiMod), 'ui.js hanya mengekspos inertBg, ask, toast, getDprev, setDprev');
for (const name of ['inertBg', 'ask', 'dclose', 'toast']) ok(new RegExp('function ' + name + '\\(').test(uiMod), 'ui.js harus memuat ' + name);
ok(!/\bwindow\.|globalThis\.|localStorage|KStore/.test(uiMod.replace(/\/\*[\s\S]*?\*\//g, '')), 'ui.js tidak boleh membaca global tersembunyi');
const part20 = fs.readFileSync(new URL('20-hitung-etalase.js', dir), 'utf8');
ok(/var \{inertBg,ask,toast,getDprev,setDprev\}=createUI\(\{\$:\$,document:document\}\);/.test(part20), '20-hitung-etalase.js memasang createUI');
ok(!/function (inertBg|ask|dclose|toast)\(/.test(part20) && !/var (dfn|dprev|toastT)\b/.test(part20) && !/var dfn=null,dprev=null/.test(part20), '20-hitung-etalase.js tidak boleh lagi mendefinisikan dialog/toast');
for (const f of legacyParts) ok(!/(?<![\w$.])(dfn|dprev|toastT|dclose)\b/.test(fs.readFileSync(new URL(f, dir), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')), f + ' tidak boleh memakai dfn/dprev/toastT/dclose (privat di ui.js)');
{ /* pemasangan harus terjadi SEBELUM pemakaian saat muat: tak ada pemanggilan ask/toast/inertBg di tingkat atas bagian 00/10 atau 20 sebelum baris pemasangan */
  const pre = part20.slice(0, part20.indexOf('var {inertBg,ask,toast,getDprev,setDprev}=createUI(')) + fs.readFileSync(new URL('00-core.js', dir), 'utf8') + fs.readFileSync(new URL('10-calc.js', dir), 'utf8');
  ok(!/(?<![\w$.])(toast|ask|inertBg):(toast|ask|inertBg)\b/.test(pre), 'tak ada yang meneruskan ask/toast/inertBg sebagai nilai sebelum pemasangan createUI (bukan lagi di-hoist)');
}
// Tahap 6b (v9.29): helper murni (esc, dtx, uid, prodSig, SGL, feeSig) dipisahkan ke js/helpers.js.
execFileSync(process.execPath, ['--check', new URL('../js/helpers.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/helpers.js'"), 'sw.js CORE harus menyebut js/helpers.js');
ok(loaderImports('./helpers.js', 'esc, dtx, uid, prodSig, SGL, createFeeSig'), 'loader harus mengimpor esc, dtx, uid, prodSig, SGL, createFeeSig');
const hlpMod = fs.readFileSync(new URL('../js/helpers.js', import.meta.url), 'utf8');
ok(/export function createFeeSig\(\{getA,gfac\}\)\{/.test(hlpMod) && /return feeSig;\n\}\n$/.test(hlpMod), 'helpers.js harus mengekspor createFeeSig({getA,gfac}) yang mengembalikan feeSig');
for (const name of ['esc', 'dtx', 'uid', 'prodSig']) ok(new RegExp('export function ' + name + '\\(').test(hlpMod), 'helpers.js harus mengekspor ' + name);
ok(/export var SGL=\{/.test(hlpMod), 'helpers.js harus mengekspor SGL');
const hlpCode = hlpMod.replace(/\/\*[\s\S]*?\*\//g, '');
ok(/function feeSig\(\)\{var A=getA\(\);/.test(hlpCode), 'feeSig membaca A lewat getA() di dalam fungsinya (A bisa ditugaskan ulang saat restore)');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|document\b/.test(hlpCode.replace(/function esc\(.*?\}\)\}\n/, '').replace(/var SGL=\{[^}]*\};/, '')), 'helpers.js tidak boleh membaca global tersembunyi');
const part20b = fs.readFileSync(new URL('20-hitung-etalase.js', dir), 'utf8');
ok(!/^(function (esc|dtx|uid|prodSig|feeSig)\(|var SGL=)/m.test(part20b), '20-hitung-etalase.js tidak boleh lagi mendefinisikan esc/dtx/uid/prodSig/feeSig/SGL');
ok(/^var feeSig=createFeeSig\(\{getA:function\(\)\{return A\},gfac:gfac\}\);$/m.test(part20b), '20-hitung-etalase.js memasang createFeeSig dengan getA dan gfac');
for (const f of legacyParts) ok(!/^(function (esc|dtx|uid|prodSig|feeSig)\(|var SGL=)/m.test(fs.readFileSync(new URL(f, dir), 'utf8')), f + ' tidak boleh mendefinisikan ulang helper yang kini di js/helpers.js');
{ // feeSig dulu function yang di-hoist; kini var. Tidak boleh dipakai saat muat sebelum baris pemasangannya.
  const at = part20b.indexOf('var feeSig=createFeeSig(');
  const pre = fs.readFileSync(new URL('00-core.js', dir), 'utf8') + fs.readFileSync(new URL('10-calc.js', dir), 'utf8') + part20b.slice(0, at);
  ok(!/(?<![\w$.])feeSig\b/.test(pre.replace(/\/\*[\s\S]*?\*\//g, '').replace('feeSig:function(){return feeSig()}', '')), 'feeSig tidak boleh dirujuk di 00-core, 10-calc, atau bagian 20 sebelum pemasangannya (kecuali pembungkus late-bound createTarifUI, yang baru memanggil saat dipakai)');
  ok(/prodSig:prodSig,feeSig:feeSig/.test(fs.readFileSync(new URL('40-voucher-panel.js', dir), 'utf8')) && !/^\s*(feeSig|prodSig|esc|dtx|uid)\(/m.test(part20b.slice(0, at)), 'bagian 40 menerima feeSig/prodSig sebagai nilai setelah bagian 20 (urutan eksekusi terjaga)'); }
// Tahap 6c (v9.30): logika tarif/peringatan (tblSync, tbuild, fillT, tchk, verStale, ADN, refreshLabels, AD0/GO0) dipisahkan ke js/tarif-ui.js.
execFileSync(process.execPath, ['--check', new URL('../js/tarif-ui.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/tarif-ui.js'"), 'sw.js CORE harus menyebut js/tarif-ui.js');
ok(loaderImports('./tarif-ui.js', 'createTarifUI'), 'loader harus mengimpor createTarifUI');
const tuMod = fs.readFileSync(new URL('../js/tarif-ui.js', import.meta.url), 'utf8');
const tuCode = tuMod.replace(/\/\*[\s\S]*?\*\//g, '');
ok(/export function createTarifUI\(\{getA,getRows,\$,document,KDOM,AD,GO,GO2,fmt,today,SGL,prodSig,feeSig,calc,upd,fill,toast\}\)\{/.test(tuCode), 'tarif-ui.js mengekspor createTarifUI dengan tanda tangan yang disepakati');
ok(/return \{tblSync:tblSync,tbuild:tbuild,fillT:fillT,tchk:tchk,verStale:verStale,refreshLabels:refreshLabels\};\n\}\n$/.test(tuCode), 'tarif-ui.js mengembalikan enam fungsi');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|\bsessionStorage\b/.test(tuCode), 'tarif-ui.js tidak boleh membaca global tersembunyi (document dan KDOM disuntikkan)');
for (const fnName of ['tblSync', 'tchk', 'refreshLabels']) ok(new RegExp('function ' + fnName + '\\([^)]*\\)\\{var A=getA\\(\\);').test(tuCode), fnName + ' membaca A lewat getA() di dalam fungsinya (A bisa ditugaskan ulang saat restore)');
ok(/function verStale\(\)\{var A=getA\(\),rows=getRows\(\);/.test(tuCode), 'verStale membaca A dan rows lewat getA()/getRows()');
ok(/addEventListener\('input',function\(e\)\{var A=getA\(\);/.test(tuCode) && /\$\('tr'\)\.onclick=function\(\)\{var A=getA\(\);/.test(tuCode), 'pendengar tbuild membaca A ulang saat peristiwa terjadi');
const part20c = fs.readFileSync(new URL('20-hitung-etalase.js', dir), 'utf8');
ok(/^var \{tblSync,tbuild,fillT,tchk,refreshLabels\}=createTarifUI\(\{getA:function\(\)\{return A\},getRows:function\(\)\{return rows\},/m.test(part20c), '20-hitung-etalase.js memasang createTarifUI dengan getA dan getRows');
for (const w of ['feeSig:function(){return feeSig()}', 'calc:function(){return calc.apply(null,arguments)}', 'upd:function(){return upd.apply(null,arguments)}', 'fill:function(){return fill()}', 'toast:function(m){return toast(m)}']) ok(part20c.includes(w), 'pemasangan createTarifUI memakai pembungkus late-bound: ' + w);
for (const f of legacyParts) ok(!/^(function (tblSync|tbuild|fillT|tchk|verStale|refreshLabels)\(|var (AD0|GO0|ADN)\b)/m.test(fs.readFileSync(new URL(f, dir), 'utf8')), f + ' tidak boleh mendefinisikan ulang fungsi/variabel tarif yang kini di js/tarif-ui.js');
for (const f of legacyParts) ok(!/(?<![\w$.])(verStale|ADN|AD0|GO0)\b/.test(fs.readFileSync(new URL(f, dir), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')), f + ' tidak boleh memakai verStale/ADN/AD0/GO0 (privat di tarif-ui.js)');
{ // tchk harus tetap bisa ditugaskan ulang (80-cadangan-tema.js membungkusnya): dipasang sebagai var legacy, bukan const/let.
  ok(/^var _tchk=tchk;\ntchk=function\(\)\{_tchk\(\);/m.test(fs.readFileSync(new URL('80-cadangan-tema.js', dir), 'utf8')), '80-cadangan-tema.js masih membungkus tchk (_tchk=tchk; tchk=function)');
  ok(!/\b(const|let)\s*\{[^}]*\btchk\b/.test(part20c) && /^var \{[^}]*\btchk\b/m.test(part20c), 'tchk dipasang dengan var (bisa ditugaskan ulang)');
}
{ // Dulu function yang di-hoist; kini var. Tak boleh dipakai saat muat sebelum baris pemasangan (00-core, 10-calc, awal bagian 20).
  const at = part20c.indexOf('var {tblSync,tbuild,fillT,tchk,refreshLabels}=createTarifUI(');
  const pre = fs.readFileSync(new URL('00-core.js', dir), 'utf8') + fs.readFileSync(new URL('10-calc.js', dir), 'utf8') + part20c.slice(0, at);
  ok(at >= 0 && !/(?<![\w$.'"])(tblSync|tbuild|fillT|tchk|refreshLabels)\b(?!\s*:)/.test(pre.replace(/\/\*[\s\S]*?\*\//g, '')), 'tblSync/tbuild/fillT/tchk/refreshLabels tidak boleh dirujuk sebelum pemasangannya');
  const boot = fs.readFileSync(new URL('95-boot.js', dir), 'utf8');
  ok(legacyParts.indexOf('95-boot.js') > legacyParts.indexOf('20-hitung-etalase.js') && /\btbuild\(\)/.test(boot), 'tbuild dipanggil di 95-boot.js, yang berjalan SETELAH bagian 20');
}
// Tahap 6d (v9.31): peringatan stok/margin (pc1, skHi, stk, warns, WN, mchg) dipisahkan ke js/warnings.js.
execFileSync(process.execPath, ['--check', new URL('../js/warnings.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/warnings.js'"), 'sw.js CORE harus menyebut js/warnings.js');
ok(loaderImports('./warnings.js', 'createWarnings'), 'loader harus mengimpor createWarnings');
const wrCode = fs.readFileSync(new URL('../js/warnings.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ok(/export function createWarnings\(\{getA,calc,fwd,rp,fmt,today,dtx\}\)\{/.test(wrCode), 'warnings.js mengekspor createWarnings dengan tanda tangan yang disepakati');
ok(/return \{pc1:pc1,skHi:skHi,stk:stk,warns:warns,WN:WN,mchg:mchg\};\n\}\n$/.test(wrCode), 'warnings.js mengembalikan enam fungsi');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|\bsessionStorage\b|\bdocument\b/.test(wrCode), 'warnings.js tidak boleh membaca global tersembunyi');
for (const fnName of ['skHi', 'stk', 'warns', 'mchg']) ok(new RegExp('function ' + fnName + '\\([^)]*\\)\\{var A=getA\\(\\);').test(wrCode), fnName + ' membaca A lewat getA() di dalam fungsinya (A bisa ditugaskan ulang saat restore)');
ok(!/function (pc1|WN)\([^)]*\)\{[^}]*\bA\./.test(wrCode), 'pc1 dan WN murni: tidak memakai A');
ok((wrCode.match(/\bA\s*=/g) || []).length === 4, 'A hanya ditugaskan empat kali (var A=getA() di empat fungsi), tidak ada salinan lain');
const part20d = fs.readFileSync(new URL('20-hitung-etalase.js', dir), 'utf8');
ok(/^var \{pc1,skHi,stk,warns,WN,mchg\}=createWarnings\(\{getA:function\(\)\{return A\},/m.test(part20d), '20-hitung-etalase.js memasang createWarnings dengan getA');
for (const w of ['calc:function(){return calc.apply(null,arguments)}', 'fwd:function(){return fwd.apply(null,arguments)}', 'rp:rp,fmt:fmt,today:today,dtx:dtx']) ok(part20d.includes(w), 'pemasangan createWarnings: ' + w);
for (const f of legacyParts) ok(!/^function (pc1|skHi|stk|warns|WN|mchg)\(/m.test(fs.readFileSync(new URL(f, dir), 'utf8')), f + ' tidak boleh mendefinisikan ulang fungsi peringatan yang kini di js/warnings.js');
{ // Dulu function yang di-hoist; kini var. Tak boleh dipakai saat muat sebelum baris pemasangan (00-core, 10-calc, awal bagian 20).
  const at = part20d.indexOf('var {pc1,skHi,stk,warns,WN,mchg}=createWarnings(');
  const pre = fs.readFileSync(new URL('00-core.js', dir), 'utf8') + fs.readFileSync(new URL('10-calc.js', dir), 'utf8') + part20d.slice(0, at);
  ok(at >= 0 && !/(?<![\w$.'"\-])(pc1|skHi|stk|warns|WN|mchg)\(/.test(pre.replace(/\/\*[\s\S]*?\*\//g, '')), 'pc1/skHi/stk/warns/WN/mchg tidak boleh dipanggil sebelum pemasangannya');
  ok(legacyParts.indexOf('95-boot.js') > legacyParts.indexOf('20-hitung-etalase.js'), 'boot berjalan SETELAH bagian 20 (pemanggilan pertama terjadi sesudah pemasangan)');
  ok(legacyParts.indexOf('50-promosi.js') > legacyParts.indexOf('20-hitung-etalase.js') && legacyParts.indexOf('60-tab-impor-sinkron.js') > legacyParts.indexOf('20-hitung-etalase.js'), 'pemakai di luar bagian 20 (50-promosi, 60-tab-impor-sinkron) dijalankan setelah pemasangan');
}
// Tahap 6e (v9.32): tampilan hasil kartu Hitung (revHtml, CR, sp, errH) dipisahkan ke js/hasil-view.js.
execFileSync(process.execPath, ['--check', new URL('../js/hasil-view.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/hasil-view.js'"), 'sw.js CORE harus menyebut js/hasil-view.js');
ok(sw.includes("client-v9.32"), 'sw.js harus memakai nama cache client-v9.32');
ok(loaderImports('./hasil-view.js', 'createHasilView'), 'loader harus mengimpor createHasilView');
const hvCode = fs.readFileSync(new URL('../js/hasil-view.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ok(/export function createHasilView\(\{getA,fmt,rp,esc,tmod,fwdL,warns,WN,pc1\}\)\{/.test(hvCode), 'hasil-view.js mengekspor createHasilView dengan tanda tangan yang disepakati');
ok(/return \{CR:CR,errH:errH,sp:sp,revHtml:revHtml\};\n\}\n$/.test(hvCode), 'hasil-view.js mengembalikan empat fungsi');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|\bsessionStorage\b|\bdocument\b/.test(hvCode), 'hasil-view.js tidak boleh membaca global tersembunyi');
for (const fnName of ['revHtml', 'sp']) ok(new RegExp('function ' + fnName + '\\([^)]*\\)\\{var A=getA\\(\\);').test(hvCode), fnName + ' membaca A lewat getA() di dalam fungsinya (A bisa ditugaskan ulang saat restore)');
ok(!/function (CR|errH)\([^)]*\)\{[^}]*\bA\./.test(hvCode), 'CR dan errH murni: tidak memakai A');
ok((hvCode.match(/\bA\s*=/g) || []).length === 2, 'A hanya ditugaskan dua kali (var A=getA() di dua fungsi), tidak ada salinan lain');
const part20e = fs.readFileSync(new URL('20-hitung-etalase.js', dir), 'utf8');
ok(/^var \{CR,errH,sp,revHtml\}=createHasilView\(\{getA:function\(\)\{return A\},/m.test(part20e), '20-hitung-etalase.js memasang createHasilView dengan getA (var, global bagi 60-tab-impor-sinkron.js)');
for (const w of ['fmt:fmt,rp:rp,esc:esc', 'tmod:tmod,fwdL:fwdL', 'warns:warns,WN:WN,pc1:pc1']) ok(part20e.includes(w), 'pemasangan createHasilView: ' + w);
for (const f of legacyParts) ok(!/^function (CR|errH|sp|revHtml)\(/m.test(fs.readFileSync(new URL(f, dir), 'utf8')), f + ' tidak boleh mendefinisikan ulang fungsi tampilan hasil yang kini di js/hasil-view.js');
ok(!/^(const|let)\s*\{[^}]*\b(CR|errH|sp|revHtml)\b/m.test(part20e), 'CR/errH/sp/revHtml dipasang dengan var (global), bukan const/let');
{ // Dulu function yang di-hoist; kini var. Tak boleh dipakai saat muat sebelum baris pemasangan (00-core, 10-calc, awal bagian 20).
  const at = part20e.indexOf('var {CR,errH,sp,revHtml}=createHasilView(');
  const pre = fs.readFileSync(new URL('00-core.js', dir), 'utf8') + fs.readFileSync(new URL('10-calc.js', dir), 'utf8') + part20e.slice(0, at);
  ok(at >= 0 && !/(?<![\w$.'"\-])(CR|errH|sp|revHtml)\(/.test(pre.replace(/\/\*[\s\S]*?\*\//g, '')), 'CR/errH/sp/revHtml tidak boleh dipanggil sebelum pemasangannya');
  const atW = part20e.indexOf('var {pc1,skHi,stk,warns,WN,mchg}=createWarnings(');
  ok(atW >= 0 && atW < at, 'createHasilView dipasang SETELAH createWarnings (warns/WN/pc1 disuntikkan langsung)');
  ok(part20e.indexOf('var A=') < 0 && legacyParts.indexOf('10-calc.js') < legacyParts.indexOf('20-hitung-etalase.js') && /var \{[^}]*\btmod\b[^}]*\bfwdL\b[^}]*\}=createPricing\(/.test(fs.readFileSync(new URL('10-calc.js', dir), 'utf8')), 'tmod dan fwdL sudah dipasang di 10-calc.js (sebelum bagian 20), jadi aman disuntikkan langsung');
  ok(legacyParts.indexOf('60-tab-impor-sinkron.js') > legacyParts.indexOf('20-hitung-etalase.js') && /\bCR\(/.test(fs.readFileSync(new URL('60-tab-impor-sinkron.js', dir), 'utf8')), 'CR masih dipakai 60-tab-impor-sinkron.js, yang berjalan setelah pemasangan');
}
// v9.32.1: pemasangan createXxx({k:nilaiTelanjang}) menyalin nilai SAAT MUAT. Bila nilainya var yang baru ditugaskan di bagian/baris SESUDAH pemasangan, yang tersalin undefined
// (bug ERP:ERP di createBackup sejak v9.18: cadangan penuh dan pulihkan cadangan ber-ERP error). Audit ini berlaku untuk SEMUA pemasangan.
function lateCaptures(texts) {
  const all = texts.join(''), strip = all.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length)), out = [];
  const imported = new Set(); for (const m of loader.matchAll(/\['\.\/[\w-]+\.js', '([^']+)'\]/g)) m[1].split(',').forEach(x => imported.add(x.trim()));
  const globalsLuar = new Set(['KDOM', 'KStore', 'document', 'Math', 'JSON', 'Date', 'Object', 'Array', 'window', 'navigator', 'localStorage', 'globalThis', 'Promise', 'String', 'Number', 'undefined', 'null', 'true', 'false']);
  for (const c of strip.matchAll(/\b(create[A-Z]\w*)\(\{/g)) {
    const start = c.index + c[0].length - 1; let d = 0, j = start;
    for (; j < strip.length; j++) { const ch = strip[j]; if ('{(['.includes(ch)) d++; else if ('})]'.includes(ch)) { d--; if (d === 0) break; } }
    const args = []; let dd = 0, cur = '';
    for (const ch of strip.slice(start + 1, j)) { if ('{(['.includes(ch)) dd++; if ('})]'.includes(ch)) dd--; if (ch === ',' && dd === 0) { args.push(cur); cur = ''; } else cur += ch; }
    if (cur.trim()) args.push(cur);
    for (const a of args) {
      const m = a.match(/^\s*([\w$]+)\s*:\s*([\w$]+)\s*$/) || a.match(/^\s*([\w$]+)\s*$/); if (!m) continue;
      const v = m[2] || m[1]; if (globalsLuar.has(v) || imported.has(v)) continue;
      const ev = v.replace(/\$/g, '\\$');
      if (new RegExp('(^|[^\\w$.])function\\s+' + ev + '\\s*\\(').test(strip)) continue;          // deklarasi function di-hoist: aman
      const dm = new RegExp('(?:^|[;\\n}])\\s*(?:var|let|const)\\s+(?:[^;=]*?[,\\s{])?' + ev + '(?=[\\s,=};:])', 'm').exec(strip);
      if (!dm || dm.index > c.index) out.push(c[1] + ' -> ' + (m[2] ? m[1] + ':' : '') + v);
    }
  }
  return out;
}
{
  const texts = legacyParts.map(f => fs.readFileSync(new URL(f, dir), 'utf8'));
  const found = lateCaptures(texts);
  ok(found.length === 0, 'tidak boleh ada nilai bare yang disalin ke createXxx sebelum nilainya ada: ' + found.join('; '));
  const bkIdx = legacyParts.indexOf('80-cadangan-tema.js'), erpIdx = legacyParts.indexOf('90-erp.js');
  ok(bkIdx >= 0 && erpIdx > bkIdx && /^var ERP=createERP\(/m.test(fs.readFileSync(new URL('90-erp.js', dir), 'utf8')), 'ERP dipasang di 90-erp.js, SESUDAH 80-cadangan-tema.js (alasan pembungkus late-bound)');
  const t80 = fs.readFileSync(new URL('80-cadangan-tema.js', dir), 'utf8');
  ok(/ERP:\{dump:function\(\)\{return ERP\.dump\.apply\(ERP,arguments\)\},check:function\(\)\{return ERP\.check\.apply\(ERP,arguments\)\},restore:function\(\)\{return ERP\.restore\.apply\(ERP,arguments\)\}\}/.test(t80), 'createBackup memakai pembungkus late-bound untuk ERP (dump/check/restore)');
  // SABOTASE: versi lama (ERP:ERP) harus terdeteksi oleh audit yang sama; pemasangan lain (KDOM/KStore global, function hoisted) tidak boleh memicu alarm palsu.
  const rusak = texts.map(t => t.replace(/ERP:\{dump:[^\n]*\},\n/, 'ERP:ERP,\n'));
  ok(rusak.join('') !== texts.join(''), 'sabotase benar-benar mengubah teks 80-cadangan-tema.js');
  ok(lateCaptures(rusak).some(x => /createBackup -> ERP:ERP/.test(x)), 'SABOTASE: audit harus mendeteksi ERP:ERP lama di createBackup');
  const pasangHasil = /^var \{CR,errH,sp,revHtml\}=createHasilView\([^\n]*\);\n/m;   // pindahkan pemasangan createHasilView ke SEBELUM createWarnings
  const rusak2 = texts.map(t => { const m = t.match(pasangHasil); return m ? t.replace(pasangHasil, '').replace('var {pc1,skHi,stk,warns,WN,mchg}=createWarnings(', m[0] + 'var {pc1,skHi,stk,warns,WN,mchg}=createWarnings(') : t; });
  ok(rusak2.join('') !== texts.join(''), 'sabotase urutan benar-benar mengubah teks');
  ok(lateCaptures(rusak2).some(x => /createHasilView -> (warns|WN|pc1)/.test(x)), 'SABOTASE: audit harus mendeteksi createHasilView yang dipasang SEBELUM createWarnings (warns/WN/pc1 belum ada)');
  // v9.32.1: cadangan penuh dan pulihkan ber-ERP wajib punya E2E sendiri (tak ada tes lama yang menyentuhnya di browser)
  ok(fs.existsSync(new URL('./e2e/cadangan.e2e.py', import.meta.url)) && fs.existsSync(new URL('./fixtures/cadangan-v5_82-dengan-erp.txt', import.meta.url)), 'ada E2E cadangan dan fixture cadangan asli v5.82');
  const fx = JSON.parse(fs.readFileSync(new URL('./fixtures/cadangan-v5_82-dengan-erp.txt', import.meta.url), 'utf8'));
  ok(fx.A && Array.isArray(fx.rows) && fx.rows.length === 6 && fx.bv === 2 && fx.erp && fx.erp.n.opex === 2, 'fixture cadangan v5.82: A, 6 produk, bv=2, erp dengan 2 OpEx');
}
console.log(`Legacy split audit (tahap 6e + perbaikan v9.32.1): ${n} assertions passed total.`);
