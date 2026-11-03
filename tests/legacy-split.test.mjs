// Menjaga pemecahan js/legacy-app.js (v9.14): daftar bagian, urutan, sintaks tiap bagian, dan cache offline.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {legacyParts, readLegacySource} from './helpers/legacy-source.mjs';
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
ok(!/^\s*(import|export)\s/m.test(readLegacySource()), 'bagian legacy tidak boleh memakai import/export (belum modul ES terpisah)');
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
for (const f of ['parts.json', ...legacyParts]) ok(sw.includes("'./js/legacy/" + f + "'"), 'sw.js CORE harus menyebut js/legacy/' + f);
const loader = fs.readFileSync(new URL('../js/legacy-app.js', import.meta.url), 'utf8');
ok(/parts\.json/.test(loader) && /import\(url\)/.test(loader), 'js/legacy-app.js harus berupa loader bagian-bagian');
ok(loader.split('\n').length < 30, 'loader harus tetap kecil; logika bisnis tidak boleh kembali ke sini');
console.log(`Legacy split audit: ${n} assertions passed (${legacyParts.length} bagian).`);
