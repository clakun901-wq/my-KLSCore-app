import fs from 'node:fs';
const dir = new URL('../../js/legacy/', import.meta.url);
export const legacyParts = JSON.parse(fs.readFileSync(new URL('parts.json', dir), 'utf8')).parts;
/* Sumber legacy utuh = seluruh bagian js/legacy/ digabung sesuai urutan eksekusi (sama dengan yang dijalankan loader). */
export const readLegacySource = () => legacyParts.map(n => fs.readFileSync(new URL(n, dir), 'utf8')).join('');
