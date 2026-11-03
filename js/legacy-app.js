/* Loader modul kompatibilitas Kalsara v5.82 (v9.14, diperbarui v9.15).
 * Logika bisnis kini dipecah menjadi berkas berurutan di js/legacy/ (daftar: js/legacy/parts.json).
 * Bagian-bagian itu dijalankan sebagai SATU modul (lingkup variabel sama seperti sebelum dipecah),
 * karena fungsi dan variabel (A, rows, $, ...) masih saling memakai. Urutan di parts.json = urutan eksekusi. */
const base = new URL('./legacy/', import.meta.url);
const manifest = await fetch(new URL('parts.json', base)).then(r => { if (!r.ok) throw new Error('parts.json gagal dimuat (' + r.status + ')'); return r.json(); });
const texts = await Promise.all(manifest.parts.map(name => fetch(new URL(name, base)).then(r => { if (!r.ok) throw new Error('Bagian ' + name + ' gagal dimuat (' + r.status + ')'); return r.text(); })));
/* Modul ES yang sudah dipisah (mulai v9.15: ERP) diimpor lewat URL absolut yang disisipkan di awal gabungan, karena import relatif tidak bisa dipakai di dalam Blob. */
const erpUrl = new URL('./erp.js', import.meta.url).href;
const preamble = 'import {createERP} from ' + JSON.stringify(erpUrl) + ';\n';
const url = URL.createObjectURL(new Blob([preamble + texts.join('') + '\n//# sourceURL=kalsara-legacy-app.js'], { type: 'text/javascript' }));
try { await import(url); } finally { URL.revokeObjectURL(url); }
