#!/usr/bin/env node
/* Menyiapkan SQLite Wasm lokal di vendor/sqlite-wasm/ (menggantikan CDN).
 *
 *   node scripts/fetch-sqlite-wasm.mjs                      # unduh @sqlite.org/sqlite-wasm lewat `npm pack` (butuh jaringan + npm)
 *   node scripts/fetch-sqlite-wasm.mjs --from paket.tgz     # pakai .tgz hasil `npm pack` yang sudah ada
 *   node scripts/fetch-sqlite-wasm.mjs --from folder/       # pakai folder paket yang sudah diekstrak
 *   node scripts/fetch-sqlite-wasm.mjs --version 3.46.1-build1
 *   node scripts/fetch-sqlite-wasm.mjs --check              # verifikasi hash file yang sudah ada (tanpa jaringan)
 *
 * Yang disalin hanya: sqlite3.mjs, sqlite3.wasm (+ LICENSE bila ada), lalu VERSION.json berisi versi dan SHA-256.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_VERSION = '3.46.1-build1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const VENDOR_DIR = path.resolve(HERE, '..', 'vendor', 'sqlite-wasm');
const NEEDED = ['sqlite3.mjs', 'sqlite3.wasm'];
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
/** Cari file yang dibutuhkan di folder paket. Bila ada duplikat, pilih yang jalurnya paling dangkal. */
export function locateFiles(packageDir) {
  const all = walk(packageDir);
  const found = {};
  for (const name of [...NEEDED, 'LICENSE', 'package.json']) {
    const hits = all.filter(f => path.basename(f) === name).sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);
    if (hits.length) found[name] = hits[0];
  }
  const missing = NEEDED.filter(n => !found[n]);
  if (missing.length) throw new Error('Paket tidak memuat: ' + missing.join(', ') + '. Periksa versi paket @sqlite.org/sqlite-wasm.');
  return found;
}
export function validateFiles(found) {
  const wasm = fs.readFileSync(found['sqlite3.wasm']);
  if (wasm.length < 100_000 || wasm.subarray(0, 4).toString('hex') !== '0061736d') throw new Error('sqlite3.wasm bukan berkas WebAssembly yang valid.');
  const mjs = fs.readFileSync(found['sqlite3.mjs'], 'utf8');
  if (!mjs.includes('installOpfsSAHPoolVfs')) throw new Error('sqlite3.mjs ini tidak mendukung OPFS SAH Pool (diperlukan Kalsara). Pakai versi 3.43 atau lebih baru.');
  return { wasm, mjs };
}
export function install(packageDir, vendorDir = VENDOR_DIR, versionHint = null) {
  const found = locateFiles(packageDir);
  validateFiles(found);
  fs.mkdirSync(vendorDir, { recursive: true });
  const files = {};
  for (const name of [...NEEDED, ...(found.LICENSE ? ['LICENSE'] : [])]) {
    fs.copyFileSync(found[name], path.join(vendorDir, name));
    files[name] = sha256(fs.readFileSync(path.join(vendorDir, name)));
  }
  let version = versionHint;
  try { version = JSON.parse(fs.readFileSync(found['package.json'], 'utf8')).version || version; } catch {}
  const info = { package: '@sqlite.org/sqlite-wasm', version, files, installedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(vendorDir, 'VERSION.json'), JSON.stringify(info, null, 2) + '\n');
  return info;
}
/** Verifikasi vendor/sqlite-wasm terhadap VERSION.json. Mengembalikan daftar masalah (kosong = baik). */
export function check(vendorDir = VENDOR_DIR) {
  const problems = [];
  const vf = path.join(vendorDir, 'VERSION.json');
  if (!fs.existsSync(vf)) return ['VERSION.json tidak ada; jalankan scripts/fetch-sqlite-wasm.mjs'];
  let info; try { info = JSON.parse(fs.readFileSync(vf, 'utf8')); } catch { return ['VERSION.json rusak']; }
  for (const name of NEEDED) {
    const f = path.join(vendorDir, name);
    if (!fs.existsSync(f)) { problems.push(name + ' tidak ada'); continue; }
    if (info.files?.[name] !== sha256(fs.readFileSync(f))) problems.push(name + ' tidak cocok dengan hash di VERSION.json');
  }
  return problems;
}

function extractTgz(tgz, into) { execFileSync('tar', ['-xzf', tgz, '-C', into]); return into; }
function main(argv) {
  const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  if (argv.includes('--check')) {
    const problems = check();
    if (problems.length) { console.error('vendor/sqlite-wasm bermasalah:\n- ' + problems.join('\n- ')); process.exit(1); }
    console.log('vendor/sqlite-wasm OK'); return;
  }
  const version = opt('--version') || DEFAULT_VERSION;
  let from = opt('--from');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kls-sqlite-'));
  try {
    if (!from) {
      console.log('Mengunduh @sqlite.org/sqlite-wasm@' + version + ' lewat npm pack ...');
      const out = execFileSync('npm', ['pack', '@sqlite.org/sqlite-wasm@' + version, '--silent'], { cwd: tmp, encoding: 'utf8' }).trim().split('\n').pop();
      from = path.join(tmp, out);
    }
    const dir = fs.statSync(from).isDirectory() ? from : extractTgz(path.resolve(from), tmp);
    const info = install(dir, VENDOR_DIR, version);
    console.log('Terpasang ke vendor/sqlite-wasm: ' + info.package + '@' + info.version);
    for (const [n, h] of Object.entries(info.files)) console.log('  ' + n + '  sha256:' + h);
    console.log('Selanjutnya: npm test, lalu commit folder vendor/sqlite-wasm bersama aplikasi.');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); } catch (e) { console.error('Gagal: ' + e.message); process.exit(1); }
}
