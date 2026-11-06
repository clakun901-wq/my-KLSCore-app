import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f));
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

const manifest = JSON.parse(read('manifest.webmanifest').toString('utf8'));
ok(manifest.name && manifest.short_name, 'manifest harus punya name dan short_name');
ok(manifest.start_url && manifest.scope, 'manifest harus punya start_url dan scope');
ok(['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display), 'display harus standalone/fullscreen/minimal-ui');

function pngSize(buf) {
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'bukan PNG');
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}
const sizes = new Set();
for (const ic of manifest.icons) {
  const buf = read(ic.src);
  const [w, h] = pngSize(buf);
  assert.equal(`${w}x${h}`, ic.sizes, `ukuran ikon ${ic.src} tidak cocok dengan manifest`);
  sizes.add(ic.sizes + ':' + (ic.purpose || 'any'));
  n++;
}
ok(sizes.has('192x192:any'), 'perlu ikon 192x192');
ok(sizes.has('512x512:any'), 'perlu ikon 512x512');
ok(sizes.has('512x512:maskable'), 'perlu ikon maskable 512x512');

const index = read('index.html').toString('utf8');
ok(/<link rel="manifest" href="manifest\.webmanifest">/.test(index), 'index.html harus menautkan manifest');
ok(/rel="apple-touch-icon" href="icons\/apple-touch-icon\.png"/.test(index), 'apple-touch-icon harus ditautkan');
for (const m of index.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)) ok(fs.existsSync(path.join(root, m[1])), 'ikon tertaut tidak ada: ' + m[1]);

const sw = read('sw.js').toString('utf8');
ok(/addEventListener\('fetch'/.test(sw), 'Service Worker wajib punya handler fetch agar bisa dipasang');
const optional = new Set();
const core = [...sw.matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(f => f && !f.startsWith('kalsara') && !optional.has(f));
for (const f of core) ok(fs.existsSync(path.join(root, f)), 'file di cache Service Worker tidak ada: ' + f);
// v9.36 (Tahap 0): Wasm SQLite WAJIB di cache (bukan opsional). Kegagalan unduh harus menggagalkan instalasi SW dengan jelas, bukan lolos diam-diam.
ok(!/OPTIONAL/.test(sw), 'tidak boleh ada daftar berkas opsional yang kegagalannya ditelan diam-diam');
ok(/caches\.open\(CACHE\)\.then\(async c=>\{await c\.addAll\(CORE\);\}\)/.test(sw), 'seluruh berkas inti di-cache dengan addAll sehingga satu kegagalan membatalkan instalasi');
ok(!/\.catch\(\(\)=>\{\}\)/.test(sw), 'sw.js tidak boleh menelan galat dengan catch kosong');
const sqliteWorker = fs.readFileSync(path.join(root, 'workers/sqlite-store.worker.js'), 'utf8');
for (const f of ['sqlite3.mjs', 'sqlite3.wasm']) ok(sw.includes('./vendor/sqlite-wasm/' + f) && fs.existsSync(path.join(root, 'vendor/sqlite-wasm/' + f)), 'cache wajib harus memuat berkas nyata ' + f);
ok(sqliteWorker.includes("'../vendor/sqlite-wasm/sqlite3.mjs'"), 'Worker memuat Wasm dari vendor lokal');
ok(!/cdn\.jsdelivr|unpkg|esm\.sh/.test(fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8') + sqliteWorker), 'tidak ada lagi dependensi CDN untuk SQLite');
// Bila vendor sudah dipasang, harus utuh (hash cocok dengan VERSION.json).
if (fs.existsSync(path.join(root, 'vendor/sqlite-wasm/sqlite3.wasm'))) { const { check } = await import('../scripts/fetch-sqlite-wasm.mjs'); const problems = check(); ok(problems.length === 0, 'vendor/sqlite-wasm tidak utuh: ' + problems.join('; ')); }
for (const ic of manifest.icons) ok(sw.includes('./' + ic.src), 'ikon belum masuk cache Service Worker: ' + ic.src);
console.log(`PWA installability audit: ${n} assertions passed`);
