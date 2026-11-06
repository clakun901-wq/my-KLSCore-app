// Menjaga struktur modul inti js/app-core.js (v9.38, Tahap 2; sebelumnya memeriksa loader js/legacy-app.js + js/legacy/parts.json dari v9.14):
// daftar bagian dan urutan, sintaks tiap bagian, import eksplisit, tidak ada lagi loader teks/Blob, dan cache offline.
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {legacyParts, legacyPart, appCoreSource, appCoreHeader, coreImports, readLegacyPartsOnly, erpModuleSource} from './helpers/legacy-source.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const root = new URL('../', import.meta.url);
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
/* v9.38: penanda BAGIAN di js/app-core.js menggantikan js/legacy/parts.json. Urutan = urutan eksekusi, sama persis dengan parts.json v9.37.
   Bila sebuah bagian dipindah ke modul fitur (Tahap 4-8), perbarui daftar ini dengan sadar. */
const EXPECTED_ORDER = ['00-core.js', '10-calc.js', '20-hitung-etalase.js', '30-penjualan.js', '40-voucher-panel.js', '50-promosi.js', '60-tab-impor-sinkron.js', '70-xlsx-reader.js', '80-cadangan-tema.js', '90-erp.js', '95-boot.js', '99-pwa.js'];
ok(JSON.stringify(legacyParts) === JSON.stringify(EXPECTED_ORDER), 'bagian di js/app-core.js harus berurutan persis seperti parts.json v9.37: ' + legacyParts.join(', '));
ok(legacyParts.length >= 10, 'app-core harus terdiri dari beberapa bagian');
ok(new Set(legacyParts).size === legacyParts.length, 'nama bagian tidak boleh dobel');
ok(JSON.stringify(legacyParts) === JSON.stringify([...legacyParts].sort()), 'bagian harus berurutan menurut awalan angka (urutan = urutan eksekusi)');
const coreSrc = appCoreSource();
ok((coreSrc.match(/^\/\* ===== BAGIAN /gm) || []).length === legacyParts.length, 'setiap baris penanda BAGIAN harus berbentuk baku (tidak ada penanda rusak)');
// Mekanisme lama harus benar-benar hilang (Tahap 2): tidak ada folder js/legacy/, loader legacy-app.js, parts.json.
for (const gone of ['js/legacy', 'js/legacy-app.js', 'js/legacy/parts.json']) ok(!fs.existsSync(new URL(gone, root)), gone + ' harus sudah dihapus');
for (const name of legacyParts) {
  const src = legacyPart(name);
  ok(src.endsWith('\n'), name + ' harus diakhiri baris baru agar penanda bagian berikutnya berdiri sendiri di barisnya');
  assert.doesNotThrow(() => new vm.Script('"use strict";' + src, {filename: name}), name + ' harus valid sebagai potongan statement utuh');
  n++;
}
// Seluruh app-core.js harus valid sebagai MODUL ES (import di atas, tidak ada deklarasi ganda antara import dan var/function).
execFileSync(process.execPath, ['--check', new URL('../js/app-core.js', import.meta.url).pathname]); n++;
ok(!/^\s*(import|export)\s/m.test(readLegacyPartsOnly()), 'isi bagian tidak boleh memakai import/export (import hanya boleh di header js/app-core.js)');
const headerCode = appCoreHeader.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.trim()).filter(Boolean);
ok(headerCode.length > 20 && headerCode.every(l => /^import \{[^}]+\} from '\.\/[\w-]+\.js';$/.test(l)), 'header app-core.js hanya berisi baris import statis eksplisit dari ./nama.js');
// Tidak ada lagi sisa mekanisme loader lama di app-core.js: import dinamis, pembaca parts.json/folder legacy, penyambungan teks `preamble`, sourceURL, import.meta, eval.
// (fetch dan Blob TIDAK dilarang: dipakai fitur sah, yaitu sinkron Google Sheet dan unduh file cadangan; yang dilarang hanya pola loader.)
const coreNoComments = coreSrc.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
ok(!/\bimport\(|import\.meta|parts\.json|\.\/legacy\/|legacy-app|sourceURL|preamble|manifest\.parts|new Function|\beval\(/.test(coreNoComments), 'app-core.js tidak boleh memuat sisa loader lama (import dinamis, parts.json, ./legacy/, sourceURL, import.meta, eval)');
ok(!/new Blob\(\[[^\]]*(texts|preamble)/.test(coreNoComments) && !/\bawait\b/.test(coreNoComments.slice(appCoreHeader.length)), 'app-core.js tidak merakit Blob dari teks bagian dan tidak memakai top-level await (urutan eksekusi harus sinkron seperti Blob lama)');
// Titik masuk: main.js memuat app-core.js (import dinamis, setelah penyimpanan siap) dan tidak lagi menyebut legacy-app.js.
const mainSrc = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
ok(/^await import\('\.\/app-core\.js'\);$/m.test(mainSrc) && !/legacy-app/.test(mainSrc), 'main.js harus memuat ./app-core.js (dan tidak legacy-app.js)');
ok(mainSrc.indexOf("await import('./app-core.js')") > mainSrc.indexOf('await initStorage()'), 'app-core dimuat SETELAH initStorage() selesai (urutan sama seperti sebelum Tahap 2)');
// Setiap import eksplisit menunjuk berkas nyata, tidak dobel, dan terdaftar di cache offline.
const IMPORTS = coreImports();
ok(IMPORTS.length === 22 && new Set(IMPORTS.map(x => x[0])).size === IMPORTS.length, 'app-core.js mengimpor 22 modul, masing-masing sekali (sama dengan larik modules loader v9.37)');
for (const [file] of IMPORTS) { ok(fs.existsSync(new URL('../js/' + file.slice(2), import.meta.url)), 'berkas impor harus ada: ' + file); ok(sw.includes("'./js/" + file.slice(2) + "'"), 'sw.js CORE harus menyebut js/' + file.slice(2)); }
ok(sw.includes("'./js/app-core.js'") && !/js\/legacy/.test(sw), 'sw.js CORE harus menyebut js/app-core.js dan tidak lagi js/legacy/*');
/* v9.38: setiap entri CORE sw.js harus berkas nyata (mencegah pemasangan offline gagal karena berkas yang sudah dihapus masih terdaftar). */
for (const f of eval(sw.match(/const CORE=(\[.*?\]);/)[1])) ok(f === './' || fs.existsSync(new URL(f, root)), 'entri CORE sw.js harus ada di disk: ' + f);
/* Daftar impor eksplisit (pengganti larik `modules` di legacy-app.js v9.24+): memastikan sebuah modul diimpor dengan nama yang tepat. */
const loaderImports = (file, names) => IMPORTS.some(([f, nm]) => f === file && nm === names);
// Tahap 2 (v9.15): ERP adalah modul ES sungguhan dengan dependensi eksplisit.
const erp = erpModuleSource();
ok(/^export function createERP\(\{\$, today, toast, getRows\}\)/m.test(erp), 'js/erp.js harus mengekspor createERP dengan dependensi eksplisit');
for (const imp of ["from './storage.js'", "from './worker-client.js'", "from './money.js'", "from './dom.js'"]) ok(erp.includes(imp), 'js/erp.js harus mengimpor ' + imp);
ok(!/globalThis\.(KStore|KalsaraWorker|KalsaraMoney|KDOM)|window\.rows/.test(erp), 'js/erp.js tidak boleh membaca global tersembunyi');
const part90 = legacyPart('90-erp.js');
ok(/var ERP=createERP\(/.test(part90) && part90.split('\n').length < 6, '90-erp.js hanya memasang dependensi, tanpa logika ERP');
ok(/return getRows\(\)\.map\(/.test(erp) && /var P=getRows\(\),/.test(erp), 'js/erp.js membaca daftar produk lewat getRows() di prodsLite dan mt');
ok(/getRows:function\(\)\{return rows\}/.test(part90), 'daftar produk harus dibaca segar lewat getRows (rows bisa diganti applyState)');
ok(loaderImports('./erp.js', 'createERP'), 'app-core.js harus mengimpor createERP dari js/erp.js');
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
ok(loaderImports('./xlsx-reader.js', 'createXlsxReader') && loaderImports('./pwa.js', 'createPWA'), 'app-core.js harus mengimpor factory XLSX Reader dan PWA');
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
ok(loaderImports('./theme.js', 'createTheme') && loaderImports('./backup-format.js', 'parseBackupText'), 'app-core.js harus mengimpor modul tema dan parser cadangan');
const backupPart = legacyPart('80-cadangan-tema.js');
ok(/Backup\.restoreText\(txt\)/.test(backupPart), 'restoreText legacy harus meneruskan ke modul orkestrasi cadangan');
const backupModule = fs.readFileSync(new URL('../js/backup.js', import.meta.url), 'utf8');
ok(backupModule.includes('export function createBackup('), 'orkestrasi cadangan harus menjadi factory ES');
ok(/getSales\(\)\.slice\(\)/.test(backupModule), 'restore backup ringan harus membaca sales terbaru lewat getter dinamis');
ok(!/window\.|globalThis\./.test(backupModule), 'modul cadangan tidak boleh membaca global tersembunyi');
execFileSync(process.execPath, ['--check', new URL('../js/backup.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/backup.js'"), 'sw.js CORE harus menyebut js/backup.js');
ok(loaderImports('./backup.js', 'createBackup'), 'app-core.js harus mengimpor factory backup');
ok(/createTheme\(\{\$,KStore,KDOM,toast,document\}\)/.test(backupPart), 'legacy harus memasang factory tema dengan dependensi eksplisit');
// Tahap 4a (v9.20): pembaca angka/format/tanggal murni dipisahkan dari 00-core.js.
const formatMod = fs.readFileSync(new URL('../js/format.js', import.meta.url), 'utf8');
for (const name of ['rp', 'pf', 'num', 'fmt', 'PCT', 'today']) ok(new RegExp('export (const|function) ' + name + '\\b').test(formatMod), 'format.js harus mengekspor ' + name);
ok(!/\bwindow\.|globalThis\.|document\.|KStore/.test(formatMod), 'format.js tidak boleh membaca global tersembunyi atau DOM');
ok(!/parseFloat/.test(formatMod), 'format.js tidak boleh memakai parseFloat');
execFileSync(process.execPath, ['--check', new URL('../js/format.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/format.js'"), 'sw.js CORE harus menyebut js/format.js');
ok(loaderImports('./format.js', 'rp, pf, num, fmt, PCT, today'), 'app-core.js harus mengimpor modul format');
const core = legacyPart('00-core.js');
ok(!/^(var rp=|function pf\(|var num=|var fmt=|function today\(|var PCT=)/m.test(core), '00-core.js tidak boleh lagi mendefinisikan ulang fungsi format');
// Tahap 4b (v9.21): tabel dan fungsi tarif dipisahkan dari 10-calc.js.
const tariffMod = fs.readFileSync(new URL('../js/tariff.js', import.meta.url), 'utf8');
for (const name of ['GO', 'GO2', 'GO2D', 'AD']) ok(new RegExp('export const ' + name + '=').test(tariffMod), 'tariff.js harus mengekspor ' + name);
ok(tariffMod.includes('export function createTariff({getA})'), 'tariff.js harus berupa factory dengan getA eksplisit');
ok(!/\bwindow\.|globalThis\.|document\.|KStore/.test(tariffMod), 'tariff.js tidak boleh membaca global tersembunyi atau DOM');
execFileSync(process.execPath, ['--check', new URL('../js/tariff.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/tariff.js'"), 'sw.js CORE harus menyebut js/tariff.js');
ok(loaderImports('./tariff.js', 'GO, GO2, GO2D, AD, createTariff'), 'app-core.js harus mengimpor modul tarif');
const calcPart = legacyPart('10-calc.js');
ok(!/^(var GO=|var GO2=|var AD=|function (gcOf|goT|capG|gfac|goRate|adRate|rate)\()/m.test(calcPart), '10-calc.js tidak boleh lagi mendefinisikan ulang tarif');
ok(/createTariff\(\{getA:function\(\)\{return A\}\}\)/.test(calcPart), 'legacy harus memasang factory tarif dengan getter A');
// Tahap 4c (v9.22): pipa harga sinkron dipisahkan dari 10-calc.js.
const pricingMod = fs.readFileSync(new URL('../js/pricing.js', import.meta.url), 'utf8');
ok(pricingMod.includes('export function createPricing({getA,getVNO,pr,Money,tariff,hooks})'), 'pricing.js harus berupa factory dengan dependensi eksplisit');
for (const name of ['vbest', 'volt', 'fees', 'tmod', 'fwdL', 'fwd', 'impas', 'calcSync']) ok(new RegExp('function ' + name + '\\(').test(pricingMod), 'pricing.js harus memuat ' + name);
ok(!/\bwindow\.|globalThis\.|document\.|KStore|\bVNO\b(?!\))/.test(pricingMod.replace(/getVNO/g, '').replace(/\/\*[\s\S]*?\*\//g, '')), 'pricing.js tidak boleh membaca global tersembunyi, DOM, atau VNO langsung');
execFileSync(process.execPath, ['--check', new URL('../js/pricing.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/pricing.js'"), 'sw.js CORE harus menyebut js/pricing.js');
ok(loaderImports('./pricing.js', 'createPricing'), 'app-core.js harus mengimpor modul pipa harga');
const calcPart2 = legacyPart('10-calc.js');
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
ok(loaderImports('./calc-cache.js', 'createCalcCache'), 'app-core.js harus mengimpor modul cache kalkulator');
const calcPart3 = legacyPart('10-calc.js');
ok(!/^function (gver|rkey|staleRows|prewarm|pwKick|calc)\(/m.test(calcPart3) && !/var CC=new Map/.test(calcPart3), '10-calc.js tidak boleh lagi mendefinisikan ulang cache kalkulator');
for (const f of ['20-hitung-etalase.js', '30-penjualan.js', '50-promosi.js', '80-cadangan-tema.js']) ok(!/(?<![\w.])GK=null/.test(legacyPart(f)), f + ' tidak boleh menulis GK langsung (pakai CalcCache.invalidate())');
ok(/CalcCache\.prewarmStale\(only\)/.test(fs.readFileSync(new URL('../js/upd-fill.js', import.meta.url), 'utf8')), 'upd() modul harus memakai CalcCache.prewarmStale');
// Tahap 5a (v9.25): aturan voucher dipisahkan dari 50-promosi.js ke js/voucher-rules.js.
const vrMod = fs.readFileSync(new URL('../js/voucher-rules.js', import.meta.url), 'utf8');
ok(vrMod.includes('export function createVoucherRules({getPRM,today,pr,fmt,rp})'), 'voucher-rules.js harus berupa factory dengan dependensi eksplisit');
for (const name of ['vdisc', 'cbc', 'dd', 'pst', 'vcList', 'vcApply', 'vcLab', 'vcBest', 'vcBad', 'vcThr', 'reset']) ok(new RegExp('function ' + name + '\\(').test(vrMod), 'voucher-rules.js harus memuat ' + name);
ok(!/\bwindow\.|globalThis\.|document\.|KStore|\$\(/.test(vrMod.replace(/\/\*[\s\S]*?\*\//g, '')), 'voucher-rules.js tidak boleh membaca global tersembunyi, DOM, atau penyimpanan');
execFileSync(process.execPath, ['--check', new URL('../js/voucher-rules.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/voucher-rules.js'"), 'sw.js CORE harus menyebut js/voucher-rules.js');
ok(loaderImports('./voucher-rules.js', 'createVoucherRules'), 'app-core.js harus mengimpor modul aturan voucher');
const promoPart = legacyPart('50-promosi.js');
ok(!/^function (vdisc|cbc|dd|pst|vcList|vcApply|vcLab|vcBest|vcBad|vcThr)\(/m.test(promoPart) && !/var VCC=/.test(promoPart), '50-promosi.js tidak boleh lagi mendefinisikan ulang aturan voucher');
for (const f of ['30-penjualan.js', '50-promosi.js', '80-cadangan-tema.js']) ok(!/(?<![\w.])VCC\b/.test(legacyPart(f)), f + ' tidak boleh menulis VCC langsung (pakai VoucherRules.reset())');
ok(/createVoucherRules\(\{getPRM:function\(\)\{return PRM\}/.test(legacyPart('10-calc.js')), 'legacy harus memasang factory aturan voucher dengan getPRM segar');
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
ok(loaderImports('./state.js', 'createState') && loaderImports('./penjualan.js', 'createPenjualan'), 'app-core.js harus mengimpor createState dan createPenjualan');
const core5b = legacyPart('00-core.js');
ok(/var State=createState\(\{A:\{get:function\(\)\{return A\},set:function\(v\)\{A=v\}\},rows:\{get:function\(\)\{return rows\},set:function\(v\)\{rows=v\}\},SALES:\{get:function\(\)\{return SALES\},set:function\(v\)\{SALES=v\}\},/.test(core5b) && /PRM:\{get:function\(\)\{return PRM\},set:function\(v\)\{PRM=v\}\},TS:\{get:function\(\)\{return TS\},set:function\(v\)\{TS=v\}\}\}\);/.test(core5b), '00-core.js harus memasang State dengan getter/setter segar untuk A, rows, SALES, PRM, TS');
ok(/,SALES=\[\],/.test(core5b), 'SALES tetap variabel legacy yang dideklarasikan di 00-core.js (sumber kebenaran sampai semua penugas ulang pindah)');
const part30 = legacyPart('30-penjualan.js');
ok(/var \{rpt,sold,curP,VUSE,rlAll,ymd\}=createPenjualan\(\{st:State,/.test(part30) && part30.split('\n').length < 10, '30-penjualan.js hanya memasang dependensi, tanpa logika tab');
ok(!/^(var SALES=|function (sold|curP|rpt|delSale|perS|bkHtml|fprod|sgrp|rlSet|rlOn|rlAll|ymd)\()/m.test(part30), '30-penjualan.js tidak boleh lagi mendefinisikan ulang logika penjualan');
ok(/getCFG:function\(\)\{return CFG\}/.test(part30) && /getSalesMax:function\(\)\{return SALES_MAX\}/.test(part30), 'CFG dan SALES_MAX dibaca saat dipanggil (didefinisikan di bagian setelahnya)');
for (const f of ['20-hitung-etalase.js', '50-promosi.js', '60-tab-impor-sinkron.js', '80-cadangan-tema.js']) ok(!/(?<![\w.])(RM|RD|RO|RPL|RLU|RLT|SW|swMoved)\b\s*=[^=]/.test(legacyPart(f)), f + ' tidak boleh menyentuh state privat tab Penjualan');
// Tahap 5c (v9.27): panel "Cek pesanan nyata" + dialog peringatan/panduan tarif (js/voucher-panel.js) dipisahkan dari legacy.
execFileSync(process.execPath, ['--check', new URL('../js/voucher-panel.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/voucher-panel.js'"), 'sw.js CORE harus menyebut js/voucher-panel.js');
ok(loaderImports('./voucher-panel.js', 'createVoucherPanel'), 'app-core.js harus mengimpor createVoucherPanel');
const vpMod = fs.readFileSync(new URL('../js/voucher-panel.js', import.meta.url), 'utf8');
const vpParams = 'st,$,esc,num,rp,today,pr,KDOM,KStore,document,calc,volt,fees,gfac,toast,upd,fill,syncVL,prodSig,feeSig,tlOk,tlRender,dtx,inertBg,getDprev,setDprev';
ok(vpMod.includes('export function createVoucherPanel({' + vpParams + '})'), 'voucher-panel.js harus mengekspor createVoucherPanel dengan dependensi eksplisit');
ok(/return \{vgSync:vgSync,vfKeep:vfKeep\};\n\}\n$/.test(vpMod), 'voucher-panel.js hanya mengekspos yang dipakai bagian legacy lain (vgSync, vfKeep)');
const vpPrivate = ['VF', 'vfOpt', 'vfFill', 'vfN', 'vfLines', 'vfAuto', 'vfCombo', 'vfNum', 'vfAddRow', 'vfaState', 'vfRate', 'tlPush', 'vgOpen', 'vgClose', 'gdOpen', 'gdClose', 'vfSrc', 'vfSrc2', 'vfBtn'];
for (const name of [...vpPrivate, 'vgSync', 'vfKeep']) ok(name === 'VF' ? /var VF=/.test(vpMod) : new RegExp('function ' + name + '\\(').test(vpMod), 'voucher-panel.js harus memuat ' + name);
const vpCode = vpMod.replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/\bwindow\.|globalThis\.|localStorage/.test(vpCode), 'voucher-panel.js tidak boleh membaca global tersembunyi atau localStorage (document dan KStore disuntikkan)');
ok(!/(?<![\w$.])(A(?=\.)|rows|dprev|SALES|PRM|TS)(?![\w$])/.test(vpCode.replace(/(?<![\w$.])st\.(A|rows)\b/g, '')), 'voucher-panel.js tidak boleh mengakses A/rows/dprev/SALES/PRM/TS langsung (lewat st, getDprev/setDprev)');
const part40 = legacyPart('40-voucher-panel.js');
const wireKeys = (/createVoucherPanel\(\{([\s\S]*?)\}\);\s*$/.exec(part40) || [])[1] || '';
ok(/var \{vgSync,vfKeep\}=createVoucherPanel\(\{st:State,/.test(part40) && part40.split('\n').length < 12, '40-voucher-panel.js hanya memasang dependensi, tanpa logika panel');
ok(vpParams.split(',').every(k => new RegExp('(^|[,{\\s])' + k.replace('$', '\\$') + ':').test(wireKeys)) && vpParams.split(',').length === (wireKeys.match(/(?:^|[,{\s])[\w$]+:/g) || []).length, 'pemasangan di legacy harus menyuntikkan tepat semua dependensi factory');
ok(/getDprev:getDprev,setDprev:setDprev\}\);\s*$/.test(part40) && !/(?<![\w$.])dprev\b/.test(part40.replace(/\/\*[\s\S]*?\*\//g, '')), 'dprev dibagikan lewat getDprev/setDprev dari createUI (bagian 40 tidak menyentuh variabel dprev)');
ok(!/^(var VF=|function (vf[A-Za-z0-9]*|vg[A-Za-z]*|gd[A-Za-z]*|tlPush)\()/m.test(part40), '40-voucher-panel.js tidak boleh lagi mendefinisikan ulang logika panel');
for (const f of legacyParts.filter(f => f !== '40-voucher-panel.js')) ok(!new RegExp('(?<![\\w$.])(' + vpPrivate.join('|') + ')(?![\\w$])').test(legacyPart(f)), f + ' tidak boleh memakai fungsi panel yang kini privat (hanya vgSync/vfKeep yang dibagikan)');
ok(/vgSync\(\)/.test(legacyPart('80-cadangan-tema.js')) && /vfKeep\(\)/.test(legacyPart('80-cadangan-tema.js')), '80-cadangan-tema.js tetap memakai vgSync dan vfKeep dari hasil factory');
// Tahap 6a (v9.28): dialog konfirmasi (ask), inertBg, dan toast (js/ui.js) dipisahkan dari 20-hitung-etalase.js.
execFileSync(process.execPath, ['--check', new URL('../js/ui.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/ui.js'"), 'sw.js CORE harus menyebut js/ui.js');
ok(loaderImports('./ui.js', 'createUI'), 'app-core.js harus mengimpor createUI');
const uiMod = fs.readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
ok(uiMod.includes('export function createUI({$,document}){'), 'ui.js harus mengekspor createUI({$,document})');
ok(/return \{inertBg:inertBg,ask:ask,toast:toast,getDprev:function\(\)\{return dprev\},setDprev:function\(v\)\{dprev=v\}\};\n\}\n$/.test(uiMod), 'ui.js hanya mengekspos inertBg, ask, toast, getDprev, setDprev');
for (const name of ['inertBg', 'ask', 'dclose', 'toast']) ok(new RegExp('function ' + name + '\\(').test(uiMod), 'ui.js harus memuat ' + name);
ok(!/\bwindow\.|globalThis\.|localStorage|KStore/.test(uiMod.replace(/\/\*[\s\S]*?\*\//g, '')), 'ui.js tidak boleh membaca global tersembunyi');
const part20 = legacyPart('20-hitung-etalase.js');
ok(/var \{inertBg,ask,toast,getDprev,setDprev\}=createUI\(\{\$:\$,document:document\}\);/.test(part20), '20-hitung-etalase.js memasang createUI');
ok(!/function (inertBg|ask|dclose|toast)\(/.test(part20) && !/var (dfn|dprev|toastT)\b/.test(part20) && !/var dfn=null,dprev=null/.test(part20), '20-hitung-etalase.js tidak boleh lagi mendefinisikan dialog/toast');
for (const f of legacyParts) ok(!/(?<![\w$.])(dfn|dprev|toastT|dclose)\b/.test(legacyPart(f).replace(/\/\*[\s\S]*?\*\//g, '')), f + ' tidak boleh memakai dfn/dprev/toastT/dclose (privat di ui.js)');
{ /* pemasangan harus terjadi SEBELUM pemakaian saat muat: tak ada pemanggilan ask/toast/inertBg di tingkat atas bagian 00/10 atau 20 sebelum baris pemasangan */
  const pre = part20.slice(0, part20.indexOf('var {inertBg,ask,toast,getDprev,setDprev}=createUI(')) + legacyPart('00-core.js') + legacyPart('10-calc.js');
  ok(!/(?<![\w$.])(toast|ask|inertBg):(toast|ask|inertBg)\b/.test(pre), 'tak ada yang meneruskan ask/toast/inertBg sebagai nilai sebelum pemasangan createUI (bukan lagi di-hoist)');
}
// Tahap 6b (v9.29): helper murni (esc, dtx, uid, prodSig, SGL, feeSig) dipisahkan ke js/helpers.js.
execFileSync(process.execPath, ['--check', new URL('../js/helpers.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/helpers.js'"), 'sw.js CORE harus menyebut js/helpers.js');
ok(loaderImports('./helpers.js', 'esc, dtx, uid, prodSig, SGL, createFeeSig'), 'app-core.js harus mengimpor esc, dtx, uid, prodSig, SGL, createFeeSig');
const hlpMod = fs.readFileSync(new URL('../js/helpers.js', import.meta.url), 'utf8');
ok(/export function createFeeSig\(\{getA,gfac\}\)\{/.test(hlpMod) && /return feeSig;\n\}\n$/.test(hlpMod), 'helpers.js harus mengekspor createFeeSig({getA,gfac}) yang mengembalikan feeSig');
for (const name of ['esc', 'dtx', 'uid', 'prodSig']) ok(new RegExp('export function ' + name + '\\(').test(hlpMod), 'helpers.js harus mengekspor ' + name);
ok(/export var SGL=\{/.test(hlpMod), 'helpers.js harus mengekspor SGL');
const hlpCode = hlpMod.replace(/\/\*[\s\S]*?\*\//g, '');
ok(/function feeSig\(\)\{var A=getA\(\);/.test(hlpCode), 'feeSig membaca A lewat getA() di dalam fungsinya (A bisa ditugaskan ulang saat restore)');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|document\b/.test(hlpCode.replace(/function esc\(.*?\}\)\}\n/, '').replace(/var SGL=\{[^}]*\};/, '')), 'helpers.js tidak boleh membaca global tersembunyi');
const part20b = legacyPart('20-hitung-etalase.js');
ok(!/^(function (esc|dtx|uid|prodSig|feeSig)\(|var SGL=)/m.test(part20b), '20-hitung-etalase.js tidak boleh lagi mendefinisikan esc/dtx/uid/prodSig/feeSig/SGL');
ok(/^var feeSig=createFeeSig\(\{getA:function\(\)\{return A\},gfac:gfac\}\);$/m.test(part20b), '20-hitung-etalase.js memasang createFeeSig dengan getA dan gfac');
for (const f of legacyParts) ok(!/^(function (esc|dtx|uid|prodSig|feeSig)\(|var SGL=)/m.test(legacyPart(f)), f + ' tidak boleh mendefinisikan ulang helper yang kini di js/helpers.js');
{ // feeSig dulu function yang di-hoist; kini var. Tidak boleh dipakai saat muat sebelum baris pemasangannya.
  const at = part20b.indexOf('var feeSig=createFeeSig(');
  const pre = legacyPart('00-core.js') + legacyPart('10-calc.js') + part20b.slice(0, at);
  ok(!/(?<![\w$.])feeSig\b/.test(pre.replace(/\/\*[\s\S]*?\*\//g, '').replace('feeSig:function(){return feeSig()}', '')), 'feeSig tidak boleh dirujuk di 00-core, 10-calc, atau bagian 20 sebelum pemasangannya (kecuali pembungkus late-bound createTarifUI, yang baru memanggil saat dipakai)');
  ok(/prodSig:prodSig,feeSig:feeSig/.test(legacyPart('40-voucher-panel.js')) && !/^\s*(feeSig|prodSig|esc|dtx|uid)\(/m.test(part20b.slice(0, at)), 'bagian 40 menerima feeSig/prodSig sebagai nilai setelah bagian 20 (urutan eksekusi terjaga)'); }
// Tahap 6c (v9.30): logika tarif/peringatan (tblSync, tbuild, fillT, tchk, verStale, ADN, refreshLabels, AD0/GO0) dipisahkan ke js/tarif-ui.js.
execFileSync(process.execPath, ['--check', new URL('../js/tarif-ui.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/tarif-ui.js'"), 'sw.js CORE harus menyebut js/tarif-ui.js');
ok(loaderImports('./tarif-ui.js', 'createTarifUI'), 'app-core.js harus mengimpor createTarifUI');
const tuMod = fs.readFileSync(new URL('../js/tarif-ui.js', import.meta.url), 'utf8');
const tuCode = tuMod.replace(/\/\*[\s\S]*?\*\//g, '');
ok(/export function createTarifUI\(\{getA,getRows,\$,document,KDOM,AD,GO,GO2,fmt,today,SGL,prodSig,feeSig,calc,upd,fill,toast\}\)\{/.test(tuCode), 'tarif-ui.js mengekspor createTarifUI dengan tanda tangan yang disepakati');
ok(/return \{tblSync:tblSync,tbuild:tbuild,fillT:fillT,tchk:tchk,verStale:verStale,refreshLabels:refreshLabels\};\n\}\n$/.test(tuCode), 'tarif-ui.js mengembalikan enam fungsi');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|\bsessionStorage\b/.test(tuCode), 'tarif-ui.js tidak boleh membaca global tersembunyi (document dan KDOM disuntikkan)');
for (const fnName of ['tblSync', 'tchk', 'refreshLabels']) ok(new RegExp('function ' + fnName + '\\([^)]*\\)\\{var A=getA\\(\\);').test(tuCode), fnName + ' membaca A lewat getA() di dalam fungsinya (A bisa ditugaskan ulang saat restore)');
ok(/function verStale\(\)\{var A=getA\(\),rows=getRows\(\);/.test(tuCode), 'verStale membaca A dan rows lewat getA()/getRows()');
ok(/addEventListener\('input',function\(e\)\{var A=getA\(\);/.test(tuCode) && /\$\('tr'\)\.onclick=function\(\)\{var A=getA\(\);/.test(tuCode), 'pendengar tbuild membaca A ulang saat peristiwa terjadi');
const part20c = legacyPart('20-hitung-etalase.js');
ok(/^var \{tblSync,tbuild,fillT,tchk,refreshLabels\}=createTarifUI\(\{getA:function\(\)\{return A\},getRows:function\(\)\{return rows\},/m.test(part20c), '20-hitung-etalase.js memasang createTarifUI dengan getA dan getRows');
for (const w of ['feeSig:function(){return feeSig()}', 'calc:function(){return calc.apply(null,arguments)}', 'upd:function(){return upd.apply(null,arguments)}', 'fill:function(){return fill()}', 'toast:function(m){return toast(m)}']) ok(part20c.includes(w), 'pemasangan createTarifUI memakai pembungkus late-bound: ' + w);
for (const f of legacyParts) ok(!/^(function (tblSync|tbuild|fillT|tchk|verStale|refreshLabels)\(|var (AD0|GO0|ADN)\b)/m.test(legacyPart(f)), f + ' tidak boleh mendefinisikan ulang fungsi/variabel tarif yang kini di js/tarif-ui.js');
for (const f of legacyParts) ok(!/(?<![\w$.])(verStale|ADN|AD0|GO0)\b/.test(legacyPart(f).replace(/\/\*[\s\S]*?\*\//g, '')), f + ' tidak boleh memakai verStale/ADN/AD0/GO0 (privat di tarif-ui.js)');
{ // tchk harus tetap bisa ditugaskan ulang (80-cadangan-tema.js membungkusnya): dipasang sebagai var legacy, bukan const/let.
  ok(/^var _tchk=tchk;\ntchk=function\(\)\{_tchk\(\);/m.test(legacyPart('80-cadangan-tema.js')), '80-cadangan-tema.js masih membungkus tchk (_tchk=tchk; tchk=function)');
  ok(!/\b(const|let)\s*\{[^}]*\btchk\b/.test(part20c) && /^var \{[^}]*\btchk\b/m.test(part20c), 'tchk dipasang dengan var (bisa ditugaskan ulang)');
}
{ // Dulu function yang di-hoist; kini var. Tak boleh dipakai saat muat sebelum baris pemasangan (00-core, 10-calc, awal bagian 20).
  const at = part20c.indexOf('var {tblSync,tbuild,fillT,tchk,refreshLabels}=createTarifUI(');
  const pre = legacyPart('00-core.js') + legacyPart('10-calc.js') + part20c.slice(0, at);
  ok(at >= 0 && !/(?<![\w$.'"])(tblSync|tbuild|fillT|tchk|refreshLabels)\b(?!\s*:)/.test(pre.replace(/\/\*[\s\S]*?\*\//g, '')), 'tblSync/tbuild/fillT/tchk/refreshLabels tidak boleh dirujuk sebelum pemasangannya');
  const boot = legacyPart('95-boot.js');
  ok(legacyParts.indexOf('95-boot.js') > legacyParts.indexOf('20-hitung-etalase.js') && /\btbuild\(\)/.test(boot), 'tbuild dipanggil di 95-boot.js, yang berjalan SETELAH bagian 20');
}
// Tahap 6d (v9.31): peringatan stok/margin (pc1, skHi, stk, warns, WN, mchg) dipisahkan ke js/warnings.js.
execFileSync(process.execPath, ['--check', new URL('../js/warnings.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/warnings.js'"), 'sw.js CORE harus menyebut js/warnings.js');
ok(loaderImports('./warnings.js', 'createWarnings'), 'app-core.js harus mengimpor createWarnings');
const wrCode = fs.readFileSync(new URL('../js/warnings.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ok(/export function createWarnings\(\{getA,calc,fwd,rp,fmt,today,dtx\}\)\{/.test(wrCode), 'warnings.js mengekspor createWarnings dengan tanda tangan yang disepakati');
ok(/return \{pc1:pc1,skHi:skHi,stk:stk,warns:warns,WN:WN,mchg:mchg\};\n\}\n$/.test(wrCode), 'warnings.js mengembalikan enam fungsi');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|\bsessionStorage\b|\bdocument\b/.test(wrCode), 'warnings.js tidak boleh membaca global tersembunyi');
for (const fnName of ['skHi', 'stk', 'warns', 'mchg']) ok(new RegExp('function ' + fnName + '\\([^)]*\\)\\{var A=getA\\(\\);').test(wrCode), fnName + ' membaca A lewat getA() di dalam fungsinya (A bisa ditugaskan ulang saat restore)');
ok(!/function (pc1|WN)\([^)]*\)\{[^}]*\bA\./.test(wrCode), 'pc1 dan WN murni: tidak memakai A');
ok((wrCode.match(/\bA\s*=/g) || []).length === 4, 'A hanya ditugaskan empat kali (var A=getA() di empat fungsi), tidak ada salinan lain');
const part20d = legacyPart('20-hitung-etalase.js');
ok(/^var \{pc1,skHi,stk,warns,WN,mchg\}=createWarnings\(\{getA:function\(\)\{return A\},/m.test(part20d), '20-hitung-etalase.js memasang createWarnings dengan getA');
for (const w of ['calc:function(){return calc.apply(null,arguments)}', 'fwd:function(){return fwd.apply(null,arguments)}', 'rp:rp,fmt:fmt,today:today,dtx:dtx']) ok(part20d.includes(w), 'pemasangan createWarnings: ' + w);
for (const f of legacyParts) ok(!/^function (pc1|skHi|stk|warns|WN|mchg)\(/m.test(legacyPart(f)), f + ' tidak boleh mendefinisikan ulang fungsi peringatan yang kini di js/warnings.js');
{ // Dulu function yang di-hoist; kini var. Tak boleh dipakai saat muat sebelum baris pemasangan (00-core, 10-calc, awal bagian 20).
  const at = part20d.indexOf('var {pc1,skHi,stk,warns,WN,mchg}=createWarnings(');
  const pre = legacyPart('00-core.js') + legacyPart('10-calc.js') + part20d.slice(0, at);
  ok(at >= 0 && !/(?<![\w$.'"\-])(pc1|skHi|stk|warns|WN|mchg)\(/.test(pre.replace(/\/\*[\s\S]*?\*\//g, '')), 'pc1/skHi/stk/warns/WN/mchg tidak boleh dipanggil sebelum pemasangannya');
  ok(legacyParts.indexOf('95-boot.js') > legacyParts.indexOf('20-hitung-etalase.js'), 'boot berjalan SETELAH bagian 20 (pemanggilan pertama terjadi sesudah pemasangan)');
  ok(legacyParts.indexOf('50-promosi.js') > legacyParts.indexOf('20-hitung-etalase.js') && legacyParts.indexOf('60-tab-impor-sinkron.js') > legacyParts.indexOf('20-hitung-etalase.js'), 'pemakai di luar bagian 20 (50-promosi, 60-tab-impor-sinkron) dijalankan setelah pemasangan');
}
// Tahap 6e (v9.32): tampilan hasil kartu Hitung (revHtml, CR, sp, errH) dipisahkan ke js/hasil-view.js.
execFileSync(process.execPath, ['--check', new URL('../js/hasil-view.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/hasil-view.js'"), 'sw.js CORE harus menyebut js/hasil-view.js');
// v9.38 (Tahap 2): nama cache dinaikkan agar pengguna lama mengunduh js/app-core.js dan membuang cache lama yang memuat js/legacy/*.
ok(sw.includes("client-v9.38"), 'sw.js harus memakai nama cache client-v9.38');
ok(loaderImports('./hasil-view.js', 'createHasilView'), 'app-core.js harus mengimpor createHasilView');
const hvCode = fs.readFileSync(new URL('../js/hasil-view.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ok(/export function createHasilView\(\{getA,fmt,rp,esc,tmod,fwdL,warns,WN,pc1\}\)\{/.test(hvCode), 'hasil-view.js mengekspor createHasilView dengan tanda tangan yang disepakati');
ok(/return \{CR:CR,errH:errH,sp:sp,revHtml:revHtml\};\n\}\n$/.test(hvCode), 'hasil-view.js mengembalikan empat fungsi');
ok(!/\bwindow\.|globalThis\.|localStorage|KStore|\bsessionStorage\b|\bdocument\b/.test(hvCode), 'hasil-view.js tidak boleh membaca global tersembunyi');
for (const fnName of ['revHtml', 'sp']) ok(new RegExp('function ' + fnName + '\\([^)]*\\)\\{var A=getA\\(\\);').test(hvCode), fnName + ' membaca A lewat getA() di dalam fungsinya (A bisa ditugaskan ulang saat restore)');
ok(!/function (CR|errH)\([^)]*\)\{[^}]*\bA\./.test(hvCode), 'CR dan errH murni: tidak memakai A');
ok((hvCode.match(/\bA\s*=/g) || []).length === 2, 'A hanya ditugaskan dua kali (var A=getA() di dua fungsi), tidak ada salinan lain');
const part20e = legacyPart('20-hitung-etalase.js');
ok(/^var \{CR,errH,sp,revHtml\}=createHasilView\(\{getA:function\(\)\{return A\},/m.test(part20e), '20-hitung-etalase.js memasang createHasilView dengan getA (var, global bagi 60-tab-impor-sinkron.js)');
for (const w of ['fmt:fmt,rp:rp,esc:esc', 'tmod:tmod,fwdL:fwdL', 'warns:warns,WN:WN,pc1:pc1']) ok(part20e.includes(w), 'pemasangan createHasilView: ' + w);
for (const f of legacyParts) ok(!/^function (CR|errH|sp|revHtml)\(/m.test(legacyPart(f)), f + ' tidak boleh mendefinisikan ulang fungsi tampilan hasil yang kini di js/hasil-view.js');
ok(!/^(const|let)\s*\{[^}]*\b(CR|errH|sp|revHtml)\b/m.test(part20e), 'CR/errH/sp/revHtml dipasang dengan var (global), bukan const/let');
{ // Dulu function yang di-hoist; kini var. Tak boleh dipakai saat muat sebelum baris pemasangan (00-core, 10-calc, awal bagian 20).
  const at = part20e.indexOf('var {CR,errH,sp,revHtml}=createHasilView(');
  const pre = legacyPart('00-core.js') + legacyPart('10-calc.js') + part20e.slice(0, at);
  ok(at >= 0 && !/(?<![\w$.'"\-])(CR|errH|sp|revHtml)\(/.test(pre.replace(/\/\*[\s\S]*?\*\//g, '')), 'CR/errH/sp/revHtml tidak boleh dipanggil sebelum pemasangannya');
  const atW = part20e.indexOf('var {pc1,skHi,stk,warns,WN,mchg}=createWarnings(');
  ok(atW >= 0 && atW < at, 'createHasilView dipasang SETELAH createWarnings (warns/WN/pc1 disuntikkan langsung)');
  ok(part20e.indexOf('var A=') < 0 && legacyParts.indexOf('10-calc.js') < legacyParts.indexOf('20-hitung-etalase.js') && /var \{[^}]*\btmod\b[^}]*\bfwdL\b[^}]*\}=createPricing\(/.test(legacyPart('10-calc.js')), 'tmod dan fwdL sudah dipasang di 10-calc.js (sebelum bagian 20), jadi aman disuntikkan langsung');
  ok(legacyParts.indexOf('60-tab-impor-sinkron.js') > legacyParts.indexOf('20-hitung-etalase.js') && /\bCR\(/.test(legacyPart('60-tab-impor-sinkron.js')), 'CR masih dipakai 60-tab-impor-sinkron.js, yang berjalan setelah pemasangan');
}
// v9.32.1: pemasangan createXxx({k:nilaiTelanjang}) menyalin nilai SAAT MUAT. Bila nilainya var yang baru ditugaskan di bagian/baris SESUDAH pemasangan, yang tersalin undefined
// (bug ERP:ERP di createBackup sejak v9.18: cadangan penuh dan pulihkan cadangan ber-ERP error). Audit ini berlaku untuk SEMUA pemasangan.
function lateCaptures(texts) {
  const all = texts.join(''), strip = all.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length)), out = [];
  const imported = new Set(); for (const [, nm] of IMPORTS) nm.split(',').forEach(x => imported.add(x.trim()));
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
  const texts = legacyParts.map(f => legacyPart(f));
  const found = lateCaptures(texts);
  ok(found.length === 0, 'tidak boleh ada nilai bare yang disalin ke createXxx sebelum nilainya ada: ' + found.join('; '));
  const bkIdx = legacyParts.indexOf('80-cadangan-tema.js'), erpIdx = legacyParts.indexOf('90-erp.js');
  ok(bkIdx >= 0 && erpIdx > bkIdx && /^var ERP=createERP\(/m.test(legacyPart('90-erp.js')), 'ERP dipasang di 90-erp.js, SESUDAH 80-cadangan-tema.js (alasan pembungkus late-bound)');
  const t80 = legacyPart('80-cadangan-tema.js');
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
// Tahap 6g (v9.34): upd + fill dipisahkan ke js/upd-fill.js.
execFileSync(process.execPath, ['--check', new URL('../js/kartu-update.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/kartu-update.js'"), 'sw.js CORE harus menyebut js/kartu-update.js');
ok(loaderImports('./kartu-update.js', 'createKartuUpdate'), 'app-core.js harus mengimpor createKartuUpdate');
const kuCode=fs.readFileSync(new URL('../js/kartu-update.js',import.meta.url),'utf8');
ok(/export function createKartuUpdate\(\{getA,KDOM,fmt,gfac,goRate,adRate,esc,dtx,rp,pc1,stk,calc,impas,warns,mchg,CR,sp,revHtml,errH,pr,tmod,acH,bdH,vnote,vscn,WN\}\)/.test(kuCode),'kartu-update.js mengekspor createKartuUpdate dengan dependensi eksplisit');
ok(/function updRow\(r\)\{var A=getA\(\);/.test(kuCode),'updRow tetap deklarasi function dan membaca A terbaru melalui getA');
ok(/return \{updRow:updRow\};/.test(kuCode),'factory mengembalikan updRow');
ok(!/\b(?:window|globalThis|document|localStorage|sessionStorage)\b/.test(kuCode),'kartu-update.js tidak boleh membaca global tersembunyi');
const part20f=legacyPart('20-hitung-etalase.js');
ok(/^var \{updRow\}=createKartuUpdate\(\{getA:function\(\)\{return A\},/m.test(part20f),'bagian 20 memasang createKartuUpdate dengan getA');
for(const w of ['KDOM:KDOM','fmt:fmt,gfac:gfac,goRate:goRate,adRate:adRate','stk:stk','calc:function(){return calc.apply(null,arguments)}','acH:function(){return acH.apply(null,arguments)}','bdH:function(){return bdH.apply(null,arguments)}','vnote:function(){return vnote.apply(null,arguments)}','vscn:function(){return vscn.apply(null,arguments)}','CR:CR,sp:sp,revHtml:revHtml,errH:errH']) ok(part20f.includes(w),'pemasangan createKartuUpdate: '+w);
ok(!/^function updRow\(/m.test(part20f),'bagian 20 tidak lagi mendefinisikan updRow');
const ufCode=fs.readFileSync(new URL('../js/upd-fill.js',import.meta.url),'utf8');
execFileSync(process.execPath, ['--check', new URL('../js/upd-fill.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/upd-fill.js'"),'sw.js CORE harus menyebut js/upd-fill.js');
ok(loaderImports('./upd-fill.js','createUpdater, createFiller'),'app-core.js harus mengimpor createUpdater dan createFiller');
ok(/^var \{upd\}=createUpdater\(/m.test(part20f),'bagian 20 memasang createUpdater');
ok(/^var \{fill\}=createFiller\(/m.test(part20f),'bagian 20 memasang createFiller');
ok(!/^function upd\(/m.test(part20f)&&!/^function fill\(/m.test(legacyPart('80-cadangan-tema.js')),'upd dan fill tidak lagi didefinisikan di legacy');
ok(/export function createUpdater/.test(ufCode)&&/export function createFiller/.test(ufCode),'modul mengekspor dua factory');
ok(/setPSIG\(psig\(\)\)/.test(ufCode),'upd memperbarui PSIG melalui setter');
ok(/getA\(\)/.test(ufCode)&&/getRows\(\)/.test(ufCode),'modul membaca A dan rows terbaru melalui getter');
ok(!/\b(?:window|globalThis|localStorage|sessionStorage)\b/.test(ufCode),'modul tidak membaca global browser tersembunyi');
{
 const at=part20f.indexOf('var {updRow}=createKartuUpdate('), ah=part20f.indexOf('var {CR,errH,sp,revHtml}=createHasilView(');
 ok(ah>=0&&ah<at,'createKartuUpdate dipasang setelah createHasilView');
 ok(legacyParts.indexOf('50-promosi.js')>legacyParts.indexOf('20-hitung-etalase.js')&&legacyParts.indexOf('60-tab-impor-sinkron.js')>legacyParts.indexOf('20-hitung-etalase.js'),'vnote/vscn/acH/bdH tersedia pada pemanggilan setelah bagian 20');
 ok((part20f.replace(/\/\*[\s\S]*?\*\//g,'').match(/\bupdRow\s*\(/g)||[]).length===1 && part20f.includes('updRow:updRow'),'updRow hanya diberikan sebagai dependensi, tidak dipanggil saat evaluasi muat');
}
{
 const all=legacyParts.map(f=>legacyPart(f));
 const found=lateCaptures(all);
 ok(found.length===0,'audit lateCaptures harus lulus setelah pemasangan kartu-update: '+found.join('; '));
 const install=/^var \{updRow\}=createKartuUpdate\([^\n]*\);\n/m;
 const broken=all.map(t=>{const m=t.match(install);return m?t.replace(install,'').replace('var {pc1,skHi,stk,warns,WN,mchg}=createWarnings(',m[0]+'var {pc1,skHi,stk,warns,WN,mchg}=createWarnings('):t});
 ok(lateCaptures(broken).some(x=>/createKartuUpdate -> (pc1|stk|warns|WN|mchg)/.test(x)),'SABOTASE: audit menangkap pemasangan kartu-update sebelum createWarnings');
}
ok(fs.existsSync(new URL('./e2e/kartu-update.e2e.py',import.meta.url)),'E2E khusus updRow tersedia');

// Tahap 6h (v9.35): model Etalase dipisahkan ke js/etalase-view.js.
{
 const ev=fs.readFileSync(new URL('../js/etalase-view.js',import.meta.url),'utf8');
 const p20=legacyPart('20-hitung-etalase.js');
 execFileSync(process.execPath,['--check',new URL('../js/etalase-view.js',import.meta.url).pathname]); n++;
 ok(ev.includes('export function createEtalaseView({getRows,getA,getPRM,getCFG,getVUSE,getCurP,getVbest,getActL,'),'etalase-view mengekspor factory dengan getter state');
 ok(sw.includes("'./js/etalase-view.js'"),'sw CORE memuat etalase-view.js');
 ok(loaderImports('./etalase-view.js','createEtalaseView'),'app-core.js mengimpor createEtalaseView');
 ok(/var \{errModel,actNoteModel,shopChips,shopPrice,shop\}=createEtalaseView\(/.test(p20),'bagian 20 memasang factory Etalase');
 for(const name of ['errModel','actNoteModel','shopChips','shopPrice','shop']) ok(!new RegExp('^function '+name+'\\(','m').test(p20),name+' tidak lagi didefinisikan di legacy');
 ok(/getRows:function\(\)\{return rows\}/.test(p20)&&/getA:function\(\)\{return A\}/.test(p20)&&/getPRM:function\(\)\{return PRM\}/.test(p20)&&/getCFG:function\(\)\{return CFG\}/.test(p20),'state yang dapat diganti memakai getter late-bound');
 ok(/getVUSE:function\(\)\{return VUSE\}/.test(p20)&&/getCurP:function\(\)\{return curP\}/.test(p20)&&/getVbest:function\(\)\{return vbest\}/.test(p20),'VUSE/curP/vbest yang dipasang belakangan memakai getter');
 ok(/getActL:function\(\)\{return actL\}/.test(p20),'actL late-bound karena definisinya di bagian 60');
 ok(!/\b(?:window|localStorage|sessionStorage|document)\b/.test(ev),'etalase-view tidak membaca global tersembunyi');
 ok(fs.existsSync(new URL('./fixtures/etalase-view.pre_v9_35.js.txt',import.meta.url)),'fixture teks Etalase v9.34 tersedia');
 ok(fs.readFileSync(new URL('./helpers/legacy-source.mjs',import.meta.url),'utf8').includes("'etalase-view.js'"),'harness sumber menyertakan modul Etalase');
}

console.log(`Legacy split audit (tahap 6h + seluruh audit sebelumnya): ${n} assertions passed total.`);
