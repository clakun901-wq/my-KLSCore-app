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
ok(/import \{createERP\} from/.test(loader) && /new URL\('\.\/erp\.js', import\.meta\.url\)/.test(loader), 'loader harus menyisipkan import createERP dari js/erp.js');
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
ok(/import \{createXlsxReader\} from/.test(loader) && /import \{createPWA\} from/.test(loader), 'loader harus mengimpor factory XLSX Reader dan PWA');
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
ok(/import \{createTheme\} from/.test(loader) && /import \{parseBackupText\} from/.test(loader), 'loader harus mengimpor modul tema dan parser cadangan');
const backupPart = fs.readFileSync(new URL('80-cadangan-tema.js', dir), 'utf8');
ok(/Backup\.restoreText\(txt\)/.test(backupPart), 'restoreText legacy harus meneruskan ke modul orkestrasi cadangan');
const backupModule = fs.readFileSync(new URL('../js/backup.js', import.meta.url), 'utf8');
ok(backupModule.includes('export function createBackup('), 'orkestrasi cadangan harus menjadi factory ES');
ok(/getSales\(\)\.slice\(\)/.test(backupModule), 'restore backup ringan harus membaca sales terbaru lewat getter dinamis');
ok(!/window\.|globalThis\./.test(backupModule), 'modul cadangan tidak boleh membaca global tersembunyi');
execFileSync(process.execPath, ['--check', new URL('../js/backup.js', import.meta.url).pathname]); n++;
ok(sw.includes("'./js/backup.js'"), 'sw.js CORE harus menyebut js/backup.js');
ok(/import \{createBackup\} from/.test(loader), 'loader harus mengimpor factory backup');
ok(/createTheme\(\{\$,KStore,KDOM,toast,document\}\)/.test(backupPart), 'legacy harus memasang factory tema dengan dependensi eksplisit');
