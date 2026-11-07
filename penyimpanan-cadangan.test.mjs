/* Tes Tahap 4 (v9.40): bagian "80-cadangan-tema" pindah dari js/app-core.js ke js/penyimpanan-cadangan.js dan js/pengaturan.js.
 * Bukti "tidak ada perubahan logika": teks asli bagian 80 (fixture app-core.bagian80.pre_v9_40.js.txt) dipecah menjadi pernyataan tingkat atas,
 * lima suntingan yang disengaja diterapkan, lalu hasilnya HARUS sama persis (pernyataan demi pernyataan, tanpa komentar dan spasi) dengan isi
 * kedua modul baru. Pernyataan yang hilang, dobel, atau berubah akan menggagalkan tes ini. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as acorn from '../scripts/vendor/acorn.mjs';
import { legacyPart } from './helpers/legacy-source.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const read = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
const orig = read('./fixtures/app-core.bagian80.pre_v9_40.js.txt');
const simpan = read('../js/penyimpanan-cadangan.js'), atur = read('../js/pengaturan.js'), sw = read('../sw.js');

const noComment = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ');
const norm = t => noComment(t).replace(/\s+/g, ' ').trim();
const statements = code => acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }).body.map(x => norm(code.slice(x.start, x.end)));
const bodyOf = src => { const i = src.indexOf(') {\n') + 4, j = src.lastIndexOf('\nreturn {'); ok(i > 4 && j > i, 'badan factory harus ditemukan'); return src.slice(i, j); };

// ---- 1. Kesetaraan pernyataan (lima suntingan yang disengaja)
function edit(t, a, b) { assert.equal(t.split(a).length, 2, 'pola suntingan harus tepat satu kali: ' + a.slice(0, 50)); n++; return t.replace(a, () => b); }
let e = norm(orig);
e = edit(e, 'ERP:{dump:function(){return ERP.dump.apply(ERP,arguments)},check:function(){return ERP.check.apply(ERP,arguments)},restore:function(){return ERP.restore.apply(ERP,arguments)}},', 'ERP:ERP,');
e = edit(e, 'var _tchk=tchk; tchk=function(){_tchk();', 'wrapTchk(function(_tchk){return function(){_tchk();');
e = edit(e, "replace('di tab Tarif','di bawah')}}; function openVerify", "replace('di tab Tarif','di bawah')}}}); function openVerify");
e = edit(e, 'var _tab=tab,TI=', 'var TI=');
e = edit(e, ' tab=function(i){if(i!=1)clearMark();_tab(i);', ' wrapTab(function(_tab){return function(i){if(i!=1)clearMark();_tab(i);');
e = edit(e, "?0:-1})}; TO.forEach", "?0:-1})}}); TO.forEach");
const expected = statements(e);
const actual = [...statements(bodyOf(simpan)), ...statements(bodyOf(atur))];
ok(expected.length === actual.length, 'jumlah pernyataan harus sama: asli ' + expected.length + ' vs modul ' + actual.length);
const sortA = [...actual].sort(), sortE = [...expected].sort();
for (let i = 0; i < sortE.length; i++) assert.equal(sortA[i], sortE[i], 'pernyataan berbeda dari teks asli: ' + sortE[i].slice(0, 80));
n += sortE.length;
// urutan di dalam masing-masing modul tetap urutan aslinya (urutan = urutan pemasangan penangan dan inisialisasi)
const order = list => list.map(s => expected.indexOf(s));
const o1 = order(statements(bodyOf(simpan))), o2 = order(statements(bodyOf(atur)));
ok(o1.every((x, i) => i === 0 || x > o1[i - 1]) && o2.every((x, i) => i === 0 || x > o2[i - 1]), 'urutan pernyataan di tiap modul harus sama dengan urutan asli');

// ---- 2. Bentuk modul
ok(/^export function createPenyimpananCadangan\(\{\$, DEF, ROW_MAX, CalcCache, VoucherRules, ERP, add, fill, upd, ask, toast, dl, migPt, prRender, strip, ymd\}\) \{$/m.test(simpan), 'createPenyimpananCadangan menerima dependensi secara eksplisit');
ok(/^export function createPengaturan\(\{\$, DEF, ask, toast, fill, upd, paSync, clearMark, vfKeep, vgSync, tab, wrapTab, wrapTchk\}\) \{$/m.test(atur), 'createPengaturan menerima dependensi secara eksplisit');
ok(/\nreturn \{applyState, bkRemind, lflush, persist, syLocal, SALES_MAX\};\n\}\n$/.test(simpan), 'penyimpanan-cadangan mengekspor tepat enam nama');
ok(/\nreturn \{tlOk, tlRender, syncVL, TO, obInit\};\n\}\n$/.test(atur), 'pengaturan mengekspor tepat lima nama');
for (const [nm, t] of [['penyimpanan-cadangan.js', simpan], ['pengaturan.js', atur]]) {
  ok(!/globalThis\.|\blocalStorage\b|\bsessionStorage\b/.test(noComment(t)), nm + ' tidak boleh membaca global tersembunyi atau localStorage langsung (KStore diimpor)');
  ok(/^import \{State\} from '\.\/state\.js';$/m.test(t) && /^import \{KStore\} from '\.\/storage\.js';$/m.test(t), nm + ' mengimpor State dan KStore secara eksplisit');
  ok(!/\bimport\(/.test(noComment(t)) && sw.includes("'./js/" + nm + "'"), nm + ' terdaftar di cache offline sw.js');
  execFileSync(process.execPath, ['--check', new URL('../js/' + nm, import.meta.url).pathname]); n++;
}
// Aturan A2/B7: kontrak penyimpanan asinkron tetap utuh setelah dipindah.
ok(/function lflushDurable\(\)\{lflush\(\);return KStore\.flush\(\)\}/.test(simpan) && /flush:lflushDurable/.test(simpan), 'restore tetap menunggu KStore.flush() (lflushDurable)');
ok(/addEventListener\('beforeunload'[^]*KStore\.hasPending\(\)[^]*preventDefault/.test(simpan), 'penjaga beforeunload tetap ada');

// ---- 3. Bagian 80 di app-core hanya pemasangan
const p80 = legacyPart('80-cadangan-tema.js');
ok(Buffer.byteLength(p80) < 3500, 'bagian 80 di app-core tinggal pemasangan (kurang dari 3,5 KB), sekarang ' + Buffer.byteLength(p80) + ' byte');
for (const name of ['bkDo', 'bkFull', 'bkMark', 'copyBk', 'lsave', 'isQuota', 'pruneAge', 'snapState', 'tlLast', 'openVerify', 'obDone', 'hasData', 'showBp', 'restoreText'])
  ok(!new RegExp('function\\s+' + name + '\\s*\\(').test(p80), name + ' tidak lagi didefinisikan di app-core');
ok(!/\.onclick=|addEventListener\(/.test(noComment(p80)), 'bagian 80 tidak lagi memasang penangan peristiwa; semuanya ada di modul fitur');
for (const name of ['persist', 'lflush', 'applyState', 'bkRemind', 'syLocal', 'tlOk', 'tlRender', 'syncVL', 'obInit'])
  ok(new RegExp('^function ' + name + '\\(\\)\\{return (Simpan|Atur)\\.' + name + '\\.apply\\(null,arguments\\)\\}$', 'm').test(p80), name + ' tersedia sebagai deklarasi function penerus (di-hoist seperti aslinya)');
// SABOTASE: menghapus satu pernyataan dari modul harus terdeteksi oleh pembanding yang sama.
{
  const rusak = statements(bodyOf(simpan)).slice(1);
  ok(rusak.length + statements(bodyOf(atur)).length !== expected.length, 'SABOTASE: pembanding mendeteksi pernyataan yang hilang');
  const mutasi = statements(bodyOf(simpan)).map(s => s.replace('Tersimpan di perangkat ini.', 'Tersimpan.'));
  ok(mutasi.join('|') !== statements(bodyOf(simpan)).join('|'), 'SABOTASE: sebuah teks pesan memang berubah pada salinan');
  ok([...mutasi, ...statements(bodyOf(atur))].sort().join('|') !== sortE.join('|'), 'SABOTASE: pembanding mendeteksi perubahan teks pesan penyimpanan');
}
console.log(`Penyimpanan-cadangan + pengaturan (Tahap 4): ${n} assertions passed (kesetaraan ${expected.length} pernyataan vs teks asli v9.39).`);
