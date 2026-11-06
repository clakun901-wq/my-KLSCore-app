/* Tes Tahap 1 (v9.37, disesuaikan v9.38): peta ketergantungan global js/app-core.js (scripts/peta-global.mjs).
 * v9.38: bagian-bagian dibaca dari baris penanda BAGIAN di js/app-core.js (dulu dari js/legacy/parts.json); angka harus tetap sama.
 * Memastikan (a) skrip berjalan dan laporan konsisten dengan sumber, (b) angka dicek silang dengan cara independen,
 * (c) pemeriksa benar-benar menangkap kasus nyata lewat uji sabotase pada SALINAN SEMENTARA (kode aplikasi asli tidak disentuh),
 * (d) pemeriksa tidak pernah gagal diam-diam. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { analyze, render, readSources, CORE_NAMES } from '../scripts/peta-global.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

/* ---------- (a) berjalan pada proyek nyata ---------- */
const d = analyze({ root });
const S = d.summary;
const byName = new Map(d.globals.map(g => [g.name, g]));
ok(S.total > 100 && S.total === d.globals.length, 'peta harus menemukan ratusan nama global (ditemukan ' + S.total + ')');
ok(S.total === S.functions + S.variables, 'jumlah fungsi + variabel harus sama dengan total');
const coreRaw = read('js/app-core.js');
ok(d.parts.length === (coreRaw.match(/^\/\* ===== BAGIAN [\w-]+ ===== \*\/$/gm) || []).length && d.parts.length >= 10, 'jumlah bagian di peta harus sama dengan jumlah baris penanda BAGIAN di js/app-core.js');
// ukuran sebenarnya dihitung ulang tanpa memakai readSources: seluruh berkas dikurangi header (sebelum penanda pertama) dan baris-baris penanda
const realBytes = Buffer.byteLength(coreRaw.slice(coreRaw.search(/^\/\* ===== BAGIAN /m)).replace(/^\/\* ===== BAGIAN [\w-]+ ===== \*\/\n/gm, ''), 'utf8');
ok(S.totalBytes === realBytes, 'ukuran total di laporan harus sama dengan ukuran isi bagian sebenarnya (' + realBytes + ')');
ok(d.perPart.reduce((s, p) => s + p.defined, 0) === d.globals.reduce((s, g) => s + g.definedIn.length, 0), 'jumlah per berkas harus cocok dengan total');
ok(d.perPart.every(p => p.definedFunctions + p.definedVariables === p.defined), 'fungsi + variabel per berkas harus sama dengan jumlah didefinisikan');

/* lintas berkas dihitung ulang dari catatan mentah */
const crossRecomputed = d.globals.filter(g => [...g.reads, ...g.writes].some(r => !g.definedIn.includes(r.part)));
ok(crossRecomputed.length === S.cross && crossRecomputed.every(g => g.cross) && d.globals.filter(g => g.cross).length === S.cross, 'daftar lintas berkas harus konsisten dengan catatan baca/tulis');
ok(S.cross <= S.total && S.local === S.total - S.cross, 'angka lintas berkas dan lokal harus konsisten');
ok(d.globals.every(g => g.readCount === g.reads.length && g.writeCount === g.writes.length), 'hitungan baca/tulis harus sama dengan daftar mentah');

/* pemeriksaan silang independen: setiap bagian yang diklaim memakai sebuah nama harus memuat kata itu (syarat perlu) */
const { parts: rawParts, text } = readSources(root);
const partText = i => text.slice(rawParts[i].start, rawParts[i].end);
const wordIn = (name, i) => new RegExp('(?<![\\w$])' + name.replace(/\$/g, '\\$') + '(?![\\w$])').test(partText(i));
for (const g of d.globals) for (const i of new Set([...g.decls, ...g.reads, ...g.writes].map(r => r.part))) { if (!wordIn(g.name, i)) assert.fail('peta mengklaim ' + g.name + ' ada di ' + rawParts[i].name + ' tetapi kata itu tidak ada di berkasnya'); }
n++;

/* kecocokan dengan tests/legacy-functions.json (nama fungsi asli v5.82) */
const original = JSON.parse(read('tests/legacy-functions.json'));
const topFns = new Set(d.topFunctions); const nestedFns = new Set(d.nestedFunctions.map(x => x.name));
let inLegacyText = 0, asGlobal = 0, movedOut = 0;
for (const name of original) {
  const rx = new RegExp('function\\s+' + name.replace(/\$/g, '\\$') + '\\s*\\(');
  const present = rx.test(text);
  if (present) { inLegacyText++; ok(topFns.has(name) || nestedFns.has(name), name + ' ada di teks legacy sebagai fungsi, tetapi peta tidak mengenalnya sebagai global maupun fungsi bersarang'); }
  else ok(!topFns.has(name), name + ' dilaporkan peta sebagai fungsi global padahal tidak ada deklarasinya di teks legacy');
  if (topFns.has(name)) asGlobal++; else movedOut++;
}
ok(asGlobal + movedOut === original.length && original.length === 271, 'seluruh 271 nama fungsi asli harus terhitung: ' + asGlobal + ' masih global + ' + movedOut + ' sudah pindah/bersarang');
ok(asGlobal > 0 && asGlobal <= S.functions, 'fungsi asli yang masih global harus ada dan tidak melebihi jumlah fungsi global');

/* lima nama inti: dicek silang dengan penghitung regex yang tidak memakai pembaca kode */
ok(JSON.stringify(d.core.map(c => c.name)) === JSON.stringify(CORE_NAMES), 'bagian "lima nama inti" harus memuat A, rows, SALES, PRM, TS');
for (const c of d.core) {
  const nm = c.name.replace(/\$/g, '\\$');
  const asg = [...text.matchAll(new RegExp('(?<![\\w$.])' + nm + '\\s*(?:\\*\\*|<<|>>>|>>|[-+*/%|&^])?=(?!=)', 'g'))].length;
  const upd = [...text.matchAll(new RegExp('(?<![\\w$.])' + nm + '\\s*(?:\\+\\+|--)|(?:\\+\\+|--)' + nm + '(?![\\w$])', 'g'))].length;
  ok(c.initCount + c.reassignTotal === asg + upd, c.name + ': jumlah penugasan peta (' + (c.initCount + c.reassignTotal) + ') harus sama dengan penghitung regex independen (' + (asg + upd) + ')');
  ok(c.reassignDirect + c.reassignBridge === c.reassignTotal && c.direct.length === c.reassignDirect, c.name + ': penugasan langsung + jembatan harus sama dengan total');
  ok(c.initCount === 1 && c.definedIn.length === 1, c.name + ' harus dideklarasikan tepat satu kali');
}

/* tidak ada nama tak dikenal, tidak ada nama global implisit */
ok(d.externals.filter(e => e.category === 'TIDAK DIKENAL').length === 0, 'nama yang tidak ditemukan di mana pun: ' + d.externals.filter(e => e.category === 'TIDAK DIKENAL').map(e => e.name).join(', '));
ok(d.externals.every(e => e.writes === 0 || e.category === 'peramban'), 'tidak boleh ada penulisan ke nama global implisit/di luar legacy');

/* laporan di repo harus mutakhir dan dapat dibaca */
const md = render(d);
ok(fs.existsSync(path.join(root, 'laporan/PETA-GLOBAL.md')), 'laporan/PETA-GLOBAL.md harus ada (jalankan: node scripts/peta-global.mjs)');
ok(read('laporan/PETA-GLOBAL.md') === md, 'laporan/PETA-GLOBAL.md sudah usang. Jalankan: node scripts/peta-global.mjs');
ok(md.indexOf('## 1. Ringkasan (bahasa awam)') > 0 && md.includes('**' + S.total + '**') && md.includes('**' + S.cross + '**'), 'ringkasan awam harus memuat total dan jumlah lintas berkas');
for (const h of ['## 2. Lima nama inti', '## 3. Nama yang melintasi berkas', '## 4. Semua nama global', '## 5. Nama yang dipanggil lewat teks HTML', '## 6. Perhatian tambahan', '## 7. Batas pemeriksa']) ok(md.includes(h), 'laporan harus memuat bagian: ' + h);
ok(md.split('\n').filter(l => /^\| `/.test(l)).length >= S.total, 'tabel semua global harus memuat setiap nama');

/* alat pengembang: tidak boleh ikut dikirim ke pengguna */
const sw = read('sw.js'), html = read('index.html');
ok(!/peta-global|scripts\/|acorn|laporan\//.test(sw), 'sw.js tidak boleh men-cache skrip/laporan pengembang');
ok(!/peta-global|acorn/.test(html), 'index.html tidak boleh memuat alat pengembang');
ok(/Copyright/.test(read('scripts/vendor/acorn.LICENSE')) && /MIT/.test(read('scripts/vendor/acorn.LICENSE')), 'lisensi acorn harus menyertai salinannya');

/* jalur baris perintah */
const cliOut = execFileSync(process.execPath, [path.join(root, 'scripts/peta-global.mjs'), '--check'], { encoding: 'utf8' }); n++;
ok(/mutakhir/.test(cliOut) && /lintas berkas: \d+/.test(cliOut), '--check harus lulus dan menampilkan angka ringkas');

/* ---------- (c) uji sabotase pada salinan sementara ---------- */
const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'kls-peta-'));
let seq = 0;
function sandbox(mutate) {
  const dir = path.join(tmpBase, 'c' + (seq++));
  for (const sub of ['js', 'components', 'workers']) fs.cpSync(path.join(root, sub), path.join(dir, sub), { recursive: true });
  fs.copyFileSync(path.join(root, 'index.html'), path.join(dir, 'index.html'));
  const api = {
    dir,
    // menambah teks di AKHIR sebuah bagian (tepat sebelum penanda bagian berikutnya, atau akhir berkas untuk bagian terakhir)
    append: (part, s) => {
      const f = path.join(dir, 'js/app-core.js'); const src = fs.readFileSync(f, 'utf8');
      const marks = [...src.matchAll(/^\/\* ===== BAGIAN ([\w-]+) ===== \*\/\n/gm)];
      const i = marks.findIndex(m => m[1] + '.js' === part); if (i < 0) throw new Error('bagian tidak ada: ' + part);
      const at = i + 1 < marks.length ? marks[i + 1].index : src.length;
      fs.writeFileSync(f, src.slice(0, at) + s + src.slice(at));
    },
    write: (rel, s) => fs.writeFileSync(path.join(dir, rel), s),
    read: rel => fs.readFileSync(path.join(dir, rel), 'utf8')
  };
  if (mutate) mutate(api);
  return api;
}
const get = (res, name) => res.globals.find(g => g.name === name);
const pName = (res, i) => res.parts[i].name;
const base = sandbox(); // salinan tanpa perubahan harus identik dengan hasil asli
ok(render(analyze({ root: base.dir })) === md, 'salinan tak berubah harus menghasilkan laporan identik (pemeriksa deterministik)');

// S1: pemakaian lintas berkas buatan harus tertangkap
{
  const sb = sandbox(a => { a.append('00-core.js', 'function zzSab(){return 1}\n'); a.append('99-pwa.js', 'zzSab();\n'); });
  const r = analyze({ root: sb.dir }); const g = get(r, 'zzSab');
  ok(g && g.cross && g.kind === 'fungsi' && g.definedIn.map(i => pName(r, i)).join() === '00-core.js' && g.crossReaders.map(i => pName(r, i)).join() === '99-pwa.js', 'S1: pemakaian lintas berkas buatan harus tertangkap beserta berkas pendefinisi dan pemakainya');
  ok(r.summary.cross === S.cross + 1 && r.summary.total === S.total + 1 && r.summary.functions === S.functions + 1, 'S1: total +1, lintas berkas +1, fungsi +1');
  ok(render(r) !== md, 'S1: laporan harus berubah');
  const cli = spawnSync(process.execPath, [path.join(root, 'scripts/peta-global.mjs'), '--check', '--root', sb.dir, '--out', path.join(root, 'laporan/PETA-GLOBAL.md')], { encoding: 'utf8' });
  ok(cli.status === 1 && /usang/.test(cli.stderr), 'S1: --check harus gagal (exit 1) bila laporan usang terhadap kode');
}
// S2: penugasan ulang baru ke variabel inti harus terhitung
{
  const sb = sandbox(a => a.append('95-boot.js', 'function zzReset(){A=null;rows=[];}\n'));
  const r = analyze({ root: sb.dir });
  const cA = r.core.find(c => c.name === 'A'), cR = r.core.find(c => c.name === 'rows'), c0A = d.core.find(c => c.name === 'A'), c0R = d.core.find(c => c.name === 'rows');
  ok(cA.reassignDirect === c0A.reassignDirect + 1 && cR.reassignDirect === c0R.reassignDirect + 1, 'S2: penugasan ulang langsung A dan rows masing-masing harus bertambah 1');
  ok(cA.direct.some(w => w.part === r.parts.length - 2 && w.fn === 'zzReset') && get(r, 'A').crossWriters.length === get(d, 'A').crossWriters.length + 1, 'S2: lokasi penulisan baru (berkas 95-boot, fungsi zzReset) harus tercatat');
  ok(r.summary.coreReassignDirect === S.coreReassignDirect + 2, 'S2: ringkasan penugasan ulang inti bertambah 2');
}
// S3: variabel lokal/parameter senama TIDAK boleh dihitung sebagai pemakaian global (hindari alarm palsu)
{
  const sb = sandbox(a => a.append('95-boot.js', 'function zzLocal(rows){var A=1,SALES;return rows+A+SALES}\nfunction zzLet(){let PRM=2;{const TS=3;return PRM+TS}}\nfunction zzCatch(){try{}catch(rows){return rows}}\n'));
  const r = analyze({ root: sb.dir });
  ok(r.core.every((c, i) => c.readCount === d.core[i].readCount && c.reassignTotal === d.core[i].reassignTotal), 'S3: variabel lokal senama tidak boleh menambah hitungan baca/tulis global');
  ok(r.summary.cross === S.cross, 'S3: lintas berkas tidak boleh berubah');
}
// S4: nama properti, kunci objek, dan isi teks bukan pemakaian variabel
{
  const sb = sandbox(a => a.append('95-boot.js', 'var zzObj={rows:1,A:2,SALES:3};zzObj.rows;zzObj.A=5;var zzTxt="rows A SALES PRM TS";var zzTpl=`A ${zzObj.TS} rows`;\n'));
  const r = analyze({ root: sb.dir });
  ok(r.core.every((c, i) => c.readCount === d.core[i].readCount && c.reassignTotal === d.core[i].reassignTotal), 'S4: properti/kunci/teks tidak boleh dihitung sebagai pemakaian global');
}
// S5: pemanggilan lewat teks HTML
{
  const sb = sandbox(a => { a.append('00-core.js', 'function zzClick(){}\nfunction zzOther(){}\n'); a.append('95-boot.js', "var zzBtn='<button onclick=\"zzClick(1);zzNoSuch()\">x</button>';\n"); });
  const r = analyze({ root: sb.dir });
  ok(r.htmlUse.some(h => h.name === 'zzClick' && h.files.includes('js/app-core.js#95-boot.js')), 'S5: onclick di dalam teks harus tertangkap');
  ok(!r.htmlUse.some(h => h.name === 'zzOther' || h.name === 'zzNoSuch'), 'S5: nama yang tidak dipanggil/ tidak global tidak boleh ikut');
}
// S6: nama ganda, urutan muat, nama tak dikenal
{
  const sb = sandbox(a => { a.append('00-core.js', 'zzLate;\nvar zzDup=1;\n'); a.append('10-calc.js', 'var zzLate=1;\nvar zzDup=2;\nzzTypoNeverDefined();\n'); });
  const r = analyze({ root: sb.dir });
  ok(get(r, 'zzDup').duplicate && r.summary.duplicates === S.duplicates + 1, 'S6: nama yang didefinisikan dua kali harus ditandai');
  ok(get(r, 'zzLate').earlyLoad.length === 1, 'S6: pemakaian saat-muat sebelum definisi harus ditandai');
  ok(r.externals.some(e => e.name === 'zzTypoNeverDefined' && e.category === 'TIDAK DIKENAL'), 'S6: nama yang tidak ada di mana pun harus ditandai TIDAK DIKENAL');
  let failed = false; try { assert.ok(r.externals.filter(e => e.category === 'TIDAK DIKENAL').length === 0); } catch { failed = true; }
  ok(failed, 'S6: aturan "tidak ada nama tak dikenal" di tes ini memang akan gagal pada kode seperti itu');
}
// S7: pemeriksa tidak boleh gagal diam-diam
{
  const throwsIn = (mutate, re, msg) => { const sb = sandbox(mutate); assert.throws(() => analyze({ root: sb.dir }), re, msg); n++; };
  throwsIn(a => a.append('90-erp.js', 'function (\n'), /./, 'S7: sintaks rusak harus melempar galat');
  throwsIn(a => a.append('90-erp.js', "import x from './x.js';\n"), /./, 'S7: import di bagian legacy harus melempar galat');
  const core = a => a.read('js/app-core.js');
  throwsIn(a => a.write('js/app-core.js', core(a) + '/* ===== BAGIAN zz liar ===== */\nvar q=1;\n'), /rusak/, 'S7: baris penanda BAGIAN yang bentuknya rusak harus melempar galat');
  throwsIn(a => a.write('js/app-core.js', core(a) + '/* ===== BAGIAN 99-pwa ===== */\nvar q=1;\n'), /dobel/, 'S7: nama bagian dobel harus melempar galat');
  throwsIn(a => a.write('js/app-core.js', core(a).replace(/^\/\* ===== BAGIAN [\w-]+ ===== \*\/\n/gm, '')), /penanda/, 'S7: app-core.js tanpa penanda bagian harus melempar galat');
  throwsIn(a => a.write('js/app-core.js', core(a).trimEnd()), /baris baru/, 'S7: bagian terakhir tanpa baris baru di akhir harus melempar galat');
  throwsIn(a => a.write('js/app-core.js', core(a).replace(/^import \{[^}]*\} from '[^']+';\n/gm, '')), /tidak memiliki import/, 'S7: header tanpa import harus melempar galat (daftar impor tidak boleh hilang diam-diam)');
  throwsIn(a => a.write('js/app-core.js', core(a).replace(/^(\/\* ===== BAGIAN 00-core)/m, 'var zzHeader=1;\n$1')), /hanya boleh berisi import/, 'S7: kode selain import di header harus melempar galat');
  const empty = path.join(tmpBase, 'kosong'); fs.mkdirSync(empty); assert.throws(() => analyze({ root: empty })); n++;
  const cli = spawnSync(process.execPath, [path.join(root, 'scripts/peta-global.mjs'), '--root', empty], { encoding: 'utf8' });
  ok(cli.status !== 0, 'S7: baris perintah harus keluar dengan kode non-nol saat gagal');
}
// S8: nama dari modul ES yang disuntikkan bukan global legacy, tetapi tercatat sebagai impor
ok(d.imports.length > 20 && d.externals.some(e => e.category === 'impor'), 'impor di header app-core.js harus terbaca');
ok(!byName.has('createERP') && !byName.has('esc'), 'nama hasil impor tidak boleh dihitung sebagai global legacy');
fs.rmSync(tmpBase, { recursive: true, force: true });
console.log(`Peta global audit: ${n} assertions passed (${S.total} global, ${S.cross} lintas berkas, ${S.coreReassignDirect} penugasan ulang langsung variabel inti, ${S.htmlOnlyPlus} nama dipanggil via HTML).`);
