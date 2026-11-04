import fs from 'node:fs';
const dir = new URL('../../js/legacy/', import.meta.url);
export const legacyParts = JSON.parse(fs.readFileSync(new URL('parts.json', dir), 'utf8')).parts;
/* Sumber legacy utuh = seluruh bagian js/legacy/ digabung sesuai urutan eksekusi (sama dengan yang dijalankan loader). */
export const readLegacyPartsOnly = () => legacyParts.map(n => fs.readFileSync(new URL(n, dir), 'utf8')).join('');
export const erpModuleSource = () => fs.readFileSync(new URL('../../js/erp.js', import.meta.url), 'utf8');
export const leafModuleSources = () => ['xlsx-reader.js','pwa.js','backup.js','format.js','tariff.js','pricing.js','calc-cache.js','voucher-rules.js','state.js','penjualan.js','voucher-panel.js','ui.js','helpers.js','tarif-ui.js','warnings.js'].map(n => fs.readFileSync(new URL('../../js/'+n, import.meta.url), 'utf8')).join('\n');
/* v9.15: modul ERP (js/erp.js) dihitung bagian dari sumber legacy untuk audit statis; urutannya tidak penting bagi audit. */
export const readLegacySource = () => legacyParts.map(n => fs.readFileSync(new URL(n, dir), 'utf8')).join('') + '\n' + erpModuleSource() + '\n' + leafModuleSources();
