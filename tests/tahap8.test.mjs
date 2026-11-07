/* Tes Tahap 8 (v9.45): penutupan migrasi.
 * Memastikan: (1) legacy/, legacy-app.js, parts.json benar-benar hilang dan tidak dirujuk kode;
 * (2) index.html hanya memuat satu titik masuk (js/main.js); (3) daftar cache sw.js sama persis dengan berkas runtime nyata;
 * (4) SATU sumber nomor versi (js/version.js) dipakai sw.js, panel Pembaruan, package.json dan dokumen;
 * (5) sw.js benar-benar dijalankan di sandbox: nama cache benar, install meng-cache seluruh CORE;
 * (6) tiap fixture lama masih dipakai tes; (7) dokumen arsip dan tracker ada. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const walk = d => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name).split(path.sep).join('/')]);
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/.*$/gm, ' ');

/* (1) mekanisme legacy hilang */
for (const f of ['js/legacy', 'js/legacy-app.js', 'js/legacy/parts.json', 'parts.json']) ok(!exists(f), f + ' tidak boleh ada lagi');
const runtime = [...walk('js'), ...walk('workers'), ...walk('components')].filter(f => /\.(js|mjs)$/.test(f));
for (const f of [...runtime, 'sw.js', 'index.html']) {
  const code = f.endsWith('.html') ? read(f) : stripComments(read(f));
  ok(!/legacy-app|parts\.json|js\/legacy\//.test(code), f + ' tidak boleh merujuk loader/folder legacy');
}

/* (2) satu titik masuk */
const scripts = [...read('index.html').matchAll(/<script\b[^>]*>/g)].map(m => m[0]);
ok(scripts.length === 1 && /type="module"/.test(scripts[0]) && /src="js\/main\.js"/.test(scripts[0]), 'index.html hanya memuat <script type=module src=js/main.js>');
const mainSrc = read('js/main.js');
ok(mainSrc.indexOf("import './version.js'") > -1 && mainSrc.indexOf("import './version.js'") < mainSrc.indexOf("await import('./app-core.js')"), 'main.js memuat version.js sebelum app-core.js');

/* (3) daftar cache = berkas runtime nyata */
const core = vm.runInNewContext(read('sw.js').match(/const CORE=(\[.*?\]);/)[1]).map(String);
for (const f of core) ok(f === './' || exists(f.slice(2)), 'entri CORE harus ada di disk: ' + f);
const wajib = [...runtime, 'css/app.css', 'index.html', 'manifest.webmanifest', 'vendor/sqlite-wasm/sqlite3.mjs', 'vendor/sqlite-wasm/sqlite3.wasm'];
for (const f of wajib) ok(core.includes('./' + f), 'berkas runtime harus terdaftar di CORE sw.js: ' + f);
ok(new Set(core).size === core.length, 'CORE tidak boleh berisi entri ganda');
ok(!core.some(f => /scripts\/|tests\/|laporan\/|arsip\/|source\//.test(f)), 'CORE tidak boleh memuat berkas pengembang');

/* (4) satu sumber versi */
const versionSrc = read('js/version.js');
const ctxV = vm.createContext({}); ctxV.globalThis = ctxV; vm.runInContext(versionSrc, ctxV);
const V = ctxV.KALSARA_VERSION;
ok(V && /^\d+\.\d+$/.test(V.app) && /^\d+\.\d+$/.test(V.paket), 'js/version.js mendefinisikan app dan paket');
ok(JSON.parse(read('package.json')).version === '0.' + V.paket, 'package.json version harus 0.' + V.paket);
ok(read('README.md').includes('v' + V.paket), 'README.md harus menyebut v' + V.paket);
ok(read('state_tracker.txt').includes('v' + V.paket), 'state_tracker.txt harus menyebut v' + V.paket);
ok(/APPV:globalThis\.KALSARA_VERSION\.app/.test(read('js/app-core.js')), 'panel Pembaruan memakai versi dari version.js');
ok(!/APPV\s*=\s*'/.test(read('js/pwa.js')) && !/APPV:'\d/.test(read('js/app-core.js')), 'tidak ada nomor versi tertulis tangan untuk APPV');
const stray = runtime.concat(['sw.js']).filter(f => f !== 'js/version.js' && /kalsara-v\d|client-v\d/.test(stripComments(read(f))));
ok(stray.length === 0, 'nama cache tidak boleh tertulis tangan di: ' + stray.join(', '));

/* (5) sw.js dijalankan di sandbox */
const listeners = {}; const added = []; const opened = []; const imported = [];
const ctx = vm.createContext({
  addEventListener: (t, f) => { listeners[t] = f; }, skipWaiting() {}, clients: { claim() {} }, location: { origin: 'http://x' },
  caches: { open: async name => { opened.push(name); return { addAll: async l => { added.push(...l); } }; }, keys: async () => [], delete: async () => true, match: async () => undefined },
  importScripts: (...us) => { for (const u of us) { imported.push(u); vm.runInContext(read(u.replace(/^\.\//, '')), ctx); } },
  fetch: async () => { throw new Error('tidak dipakai'); },
});
ctx.self = ctx;
const swr = vm.runInContext(read('sw.js') + '\n;({CACHE,CORE})', ctx);
ok(imported.length === 1 && imported[0] === './js/version.js', 'sw.js memuat js/version.js lewat importScripts');
ok(swr.CACHE === `kalsara-v${V.app}-client-v${V.paket}`, 'nama cache harus diturunkan dari version.js: ' + swr.CACHE);
let pending; listeners.install({ waitUntil: p => { pending = p; } }); await pending;
ok(opened.length === 1 && opened[0] === swr.CACHE, 'install membuka cache bernama versi');
ok(JSON.stringify(added) === JSON.stringify(Array.from(swr.CORE)) && added.includes('./js/version.js'), 'install meng-cache seluruh CORE (termasuk version.js) dengan addAll');
ok(listeners.activate && listeners.fetch, 'handler activate dan fetch terpasang');

/* (6) setiap fixture masih dipakai */
const testFiles = [...walk('tests').filter(f => !f.startsWith('tests/fixtures/')), ...walk('scripts').filter(f => !f.includes('/vendor/'))];
const corpus = testFiles.map(f => read(f)).join('\n');
for (const f of walk('tests/fixtures')) ok(corpus.includes(path.basename(f)), 'fixture harus masih dirujuk tes: ' + f);

/* (7) dokumen */
ok(exists('arsip/MIGRATION-STATUS.md') && !exists('MIGRATION-STATUS.md'), 'MIGRATION-STATUS.md dipindah ke arsip/');
ok(exists('LANJUT-DI-SINI.md') && exists('state_tracker.txt'), 'LANJUT-DI-SINI.md dan state_tracker.txt ada');
ok(/Tahap 8: SELESAI/.test(read('state_tracker.txt')), 'state_tracker.txt mencatat Tahap 8');
console.log(`Tahap 8 (penutupan): ${n} pernyataan lulus; satu sumber versi ${V.app}/${V.paket}; sw.js dijalankan di sandbox; CORE = ${core.length} entri.`);
