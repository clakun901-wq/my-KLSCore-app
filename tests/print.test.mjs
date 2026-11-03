// Audit statis cetak laporan ERP (v9.13): cetak harus memakai salinan #erpp di luar tata letak aplikasi.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const js = fs.readFileSync(new URL('../js/legacy-app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../css/app.css', import.meta.url), 'utf8');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

const h = js.match(/\$\('erpw'\)\.onclick=function\(\)\{[\s\S]*?\};\$\('erpx'\)/);
ok(h, 'handler tombol cetak ditemukan');
const body = h[0];
ok(body.includes("id='erpp'"), 'membuat kontainer cetak #erpp');
ok(body.includes('cloneNode(true)'), 'menyalin isi laporan');
ok(body.includes("removeAttribute('id')"), 'salinan tidak menduplikasi id erpr');
ok(body.includes("classList.add('pe')") && body.includes("classList.remove('pe')"), 'kelas body.pe dipasang dan dilepas');
ok(body.includes('afterprint'), 'dibersihkan setelah cetak');
ok(body.includes('window.print()'), 'memanggil print');

ok(!/@media print\{body \*\{visibility:hidden\}/.test(css), 'pola lama visibility:hidden + absolute sudah dibuang');
const m = css.match(/@media print\{body\.pe>\*:not\(#erpp\)\{display:none!important\}[\s\S]*?\}\}/);
ok(m, 'aturan cetak baru ada');
ok(/#erpp\{display:none\}/.test(css), '#erpp tersembunyi di layar');
ok(/position:static!important/.test(m[0]), 'tidak memakai posisi absolut (supaya halaman bersambung)');
ok(/content-visibility:visible!important/.test(m[0]) && /overflow:visible!important/.test(m[0]), 'content-visibility dan overflow tidak memotong');
console.log(`Print audit: ${n} assertions passed`);
