import assert from 'node:assert/strict';
import { mergeLegacyRows, mergeMigrationConflicts, compareLegacyKey } from '../js/migration.js';

const existing = {
  'same': { id: 'same', name: 'Sama', amount: 10 },
  'changed': { id: 'changed', name: 'Data tujuan', amount: 900 }
};
const source = [
  { id: 'same', amount: 10, name: 'Sama' }, // Same record, different property order.
  { id: 'new-1', name: 'Record baru', amount: 25 },
  { id: 'changed', name: 'Data sumber lama', amount: 12 },
  { id: 'new-1', name: 'Record duplikat konflik', amount: 26 },
  null,
  { name: 'Tanpa ID' }
];
const merged = mergeLegacyRows(existing, source, 'opex');
assert.equal(merged.added, 1, 'new source IDs are merged');
assert.equal(merged.identical, 1, 'identical IDs are recognized independent of property order');
assert.equal(merged.conflicts.length, 2, 'different values on existing or duplicate IDs are recorded');
assert.equal(merged.skipped, 2, 'invalid source rows are counted');
assert.equal(merged.map.changed.amount, 900, 'destination wins an ID collision and is not overwritten');
assert.equal(merged.map['new-1'].amount, 25, 'first valid new source row is preserved');
assert.equal(merged.map.same.amount, 10, 'identical destination record remains intact');
assert.equal(Object.keys(existing).length, 2, 'input destination map is not mutated');
const conflictSet = mergeMigrationConflicts(merged.conflicts, [merged.conflicts[0], { entity: 'products', id: 'p-1', source: { id: 'p-1' }, destination: { id: 'p-1' } }]);
assert.equal(conflictSet.length, 3, 'conflict log deduplicates repeated entries');
const retry = mergeLegacyRows(merged.map, source, 'opex');
assert.equal(retry.added, 0, 'rerunning the migration does not duplicate already migrated IDs');
assert.equal(retry.map.changed.amount, 900, 'rerunning does not overwrite destination values');
assert.deepEqual(compareLegacyKey(null, 'old-value', 'alpha'), { action: 'copy', key: 'alpha', source: 'old-value' }, 'missing destination keys are copied');
assert.deepEqual(compareLegacyKey('same', 'same', 'alpha'), { action: 'identical', key: 'alpha' }, 'identical localStorage values are not rewritten');
assert.deepEqual(compareLegacyKey('new-value', 'old-value', 'alpha'), { action: 'conflict', key: 'alpha', destination: 'new-value', source: 'old-value' }, 'different localStorage values are recorded instead of silently discarded');
console.log('Migration safety tests: 13 assertions passed');
