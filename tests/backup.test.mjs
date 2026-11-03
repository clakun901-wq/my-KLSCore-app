import assert from 'node:assert/strict';
import { createBackup } from '../js/backup.js';
import { parseBackupText } from '../js/backup-format.js';

let state = { A: {}, rows: [{ id: 1 }], pr: [], sl: [{ id: 'old' }], ts: 1 };
let applied = null, persisted = 0, confirmed = null, failed = null, restoredUi = 0;
const erpData = { n: { marketplaces_raw: 2, order_items: 3, opex: 1 } };
const ERP = {
  dump: async () => erpData,
  check: value => value && value.n ? { ok: true, n: erpData.n } : { ok: false, msg: 'format salah' },
  restore: async value => { assert.ok(value && value.n); return true; }
};
const backup = createBackup({
  parseBackupText, snapshotState: () => structuredClone(state), ERP,
  getSales: () => state.sl,
  applyState: data => { applied = structuredClone(data); state = structuredClone(data); },
  persist: () => { persisted++; },
  ask: (message, label, callback) => { confirmed = { message, label, callback }; },
  toast: () => {}, onFailure: message => { failed = message; },
  onRestored: () => { restoredUi++; }
});

const full = await backup.full(false);
assert.equal(full.erp, true);
assert.equal(JSON.parse(full.t).bv, 2);
assert.deepEqual(JSON.parse(full.t).erp, erpData);
const light = await backup.full(true);
assert.equal(light.erp, false);
assert.equal('sl' in JSON.parse(light.t), false);

backup.restoreText(JSON.stringify({ A: {}, rows: [{ id: 2 }], pr: [], erp: erpData }));
assert.ok(confirmed.message.includes('1 produk'));
assert.ok(confirmed.message.includes('2 baris laporan'));
confirmed.callback();
await new Promise(resolve => setTimeout(resolve, 0));
assert.deepEqual(applied.sl, [{ id: 'old' }], 'backup ringan harus mempertahankan sales terkini');
assert.equal(persisted, 1);
assert.equal(restoredUi, 1);

backup.restoreText('{broken');
assert.match(failed, /terpotong|tidak valid/);
const before = persisted;
backup.restoreText(JSON.stringify({ A: {}, rows: [], pr: [], erp: { bad: true } }));
assert.match(failed, /format salah/);
assert.equal(persisted, before, 'backup ERP invalid tidak boleh mengubah state');
console.log('Backup orchestration: 14 assertions passed.');
