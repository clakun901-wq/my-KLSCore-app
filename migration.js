/* Safe merge helpers for one-time migration from the legacy ERP IndexedDB.
 * Existing destination rows win on ID collisions; source and destination values
 * are retained in a conflict report so the operator can resolve them later.
 */
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

export function mergeLegacyRows(existing, rows, entity) {
  const map = existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...existing } : {};
  const result = { map, added: 0, identical: 0, conflicts: [], skipped: 0 };
  if (!Array.isArray(rows)) throw new TypeError('Data sumber migrasi harus berupa array');

  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row) || row.id == null || String(row.id) === '') {
      result.skipped++;
      continue;
    }
    const id = String(row.id);
    if (!Object.prototype.hasOwnProperty.call(map, id)) {
      map[id] = row;
      result.added++;
      continue;
    }
    if (canonical(map[id]) === canonical(row)) {
      result.identical++;
      continue;
    }
    result.conflicts.push({ entity, id, destination: map[id], source: row });
  }
  return result;
}

export function mergeMigrationConflicts(existing, incoming) {
  const all = Array.isArray(existing) ? existing.slice() : [];
  const seen = new Set(all.map(canonical));
  for (const item of incoming || []) {
    const key = canonical(item);
    if (!seen.has(key)) { seen.add(key); all.push(item); }
  }
  return all;
}

export function compareLegacyKey(destinationValue, sourceValue, key) {
  if (destinationValue === null || destinationValue === undefined) return { action: 'copy', key, source: sourceValue };
  if (destinationValue === sourceValue) return { action: 'identical', key };
  return { action: 'conflict', key, destination: destinationValue, source: sourceValue };
}
