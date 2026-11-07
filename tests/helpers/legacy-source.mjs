import fs from 'node:fs';
/* v9.38 (Tahap 2): isi lama js/legacy/*.js kini satu modul, js/app-core.js. Setiap bagian diawali SATU baris penanda
 * "BAGIAN nn-nama" (komentar). Pembaca ini memotong berkas itu menurut penanda sehingga tes lama tetap bisa meminta "bagian 20"
 * dan menerima teks yang sama persis dengan isi berkas legacy dulu. Daftar import di atas penanda pertama (header) dipisahkan. */
const coreUrl = new URL('../../js/app-core.js', import.meta.url);
export const appCoreSource = () => fs.readFileSync(coreUrl, 'utf8');
const MARK = /^\/\* ===== BAGIAN ([\w-]+) ===== \*\/\n/gm;
export function splitAppCore(src = appCoreSource()) {
  const marks = [...src.matchAll(MARK)];
  if (!marks.length) throw new Error('js/app-core.js tidak memiliki penanda BAGIAN');
  const header = src.slice(0, marks[0].index);
  const sections = marks.map((m, i) => ({ name: m[1] + '.js', text: src.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : src.length) }));
  return { header, sections };
}
const split = splitAppCore();
/* Nama bagian dengan akhiran .js, urutan = urutan eksekusi (sama seperti parts.json dulu). */
export const legacyParts = split.sections.map(s => s.name);
/* Header = komentar pembuka + seluruh baris import eksplisit (pengganti larik `modules` di legacy-app.js). */
export const appCoreHeader = split.header;
export const legacyPart = name => { const s = split.sections.find(x => x.name === (name.endsWith('.js') ? name : name + '.js')); if (!s) throw new Error('Bagian tidak ada: ' + name); return s.text; };
/* Sumber legacy utuh = seluruh bagian digabung sesuai urutan eksekusi, TANPA header import dan tanpa baris penanda (sama dengan teks yang dulu dijalankan loader). */
export const readLegacyPartsOnly = () => split.sections.map(s => s.text).join('');
/* Pasangan [berkas, nama impor] dari baris import di header; bentuk sama dengan larik `modules` lama. */
export const coreImports = () => [...split.header.matchAll(/^import \{([^}]*)\} from '([^']+)';$/gm)].map(m => [m[2], m[1]]);
export const erpModuleSource = () => fs.readFileSync(new URL('../../js/erp.js', import.meta.url), 'utf8');
export const leafModuleSources = () => ['xlsx-reader.js','pwa.js','backup.js','format.js','tariff.js','pricing.js','calc-cache.js','voucher-rules.js','state.js','penjualan.js','voucher-panel.js','ui.js','helpers.js','tarif-ui.js','warnings.js','hasil-view.js','kartu-update.js','upd-fill.js','etalase-view.js','penyimpanan-cadangan.js','pengaturan.js','hitung-etalase.js'].map(n => fs.readFileSync(new URL('../../js/'+n, import.meta.url), 'utf8')).join('\n');
/* v9.15: modul ERP (js/erp.js) dihitung bagian dari sumber legacy untuk audit statis; urutannya tidak penting bagi audit. */
export const readLegacySource = () => readLegacyPartsOnly() + '\n' + erpModuleSource() + '\n' + leafModuleSources();
