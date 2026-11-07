import {initStorage,KStore,backupToFile} from './storage.js';
import {compute} from './worker-client.js';
import {mergeLegacyRows,mergeMigrationConflicts,compareLegacyKey} from './migration.js';
import './money.js';
import './dom.js';
import './signals.js';
import '../components/product-card.js';

try { await initStorage(); }
catch (e) {
  // Kegagalan penyimpanan harus terlihat (mis. tab ganda atau SQLite tak terbuka); jangan biarkan layar kosong.
  const box = document.createElement('div');
  box.setAttribute('role','alert');
  box.style.cssText = 'margin:24px auto;max-width:520px;padding:16px;border:1px solid #c33;border-radius:8px;font:15px/1.5 system-ui,sans-serif';
  box.textContent = 'Kalsara tidak dapat membuka penyimpanan data. ' + (e && e.message ? e.message : '');
  document.body.replaceChildren(box);
  throw e;
}
// One-time, read-only migration of existing v5.82 browser data into OPFS.
// After this pass the application uses KStore; localStorage is not used as the live database.
if (KStore.getItem('__kalsara_migration_v1') !== 'done') {
  // Do not mark a partial import complete. If browser storage is unavailable,
  // the next launch can retry without preventing the app from opening now.
  try {
    const oldStore = window.localStorage;
    const report = { version: 1, completedAt: new Date().toISOString(), sourceKeys: oldStore.length, copied: 0, identical: 0, conflicts: 0 };
    let conflicts = [];
    for (let i=0; i<oldStore.length; i++) {
      const key=oldStore.key(i);
      if (!key) continue;
      const sourceValue = oldStore.getItem(key);
      const comparison = compareLegacyKey(KStore.getItem(key), sourceValue, key);
      if (comparison.action === 'copy') { KStore.setItem(key, sourceValue); report.copied++; }
      else if (comparison.action === 'identical') report.identical++;
      else conflicts.push(comparison); // Preserve destination; keep both values for review.
    }
    const oldConflicts = KStore.getItem('__kalsara_localstorage_migration_conflicts_v1');
    if (oldConflicts) { try { conflicts = mergeMigrationConflicts(JSON.parse(oldConflicts), conflicts); } catch { console.warn('Log konflik localStorage lama tidak dapat dibaca; key log dipertahankan.'); } }
    report.conflicts = conflicts.length;
    KStore.setItem('__kalsara_localstorage_migration_report_v1', JSON.stringify(report));
    if (conflicts.length) KStore.setItem('__kalsara_localstorage_migration_conflicts_v1', JSON.stringify(conflicts));
    await KStore.flush();
    KStore.setItem('__kalsara_migration_v1','done');
    await KStore.flush();
  } catch (e) { console.warn('Migrasi data browser lama belum selesai; akan dicoba lagi saat aplikasi dibuka berikutnya.',e); }
}
// One-time migration of the previous ERP IndexedDB stores into the unified OPFS store.
// The old database is intentionally left untouched as a recovery source.
async function migrateLegacyERP() {
  if (KStore.getItem('__kalsara_erp_idb_migration_v1') === 'done') return;
  if (!('indexedDB' in window)) { KStore.setItem('__kalsara_erp_idb_migration_v1','done'); return; }
  let db;
  try { db = await new Promise((resolve,reject) => {
    let created = false;
    let req;
    try { req = indexedDB.open('KalsaraERP'); } catch { resolve(null); return; }
    req.onupgradeneeded = event => { created = event.oldVersion === 0; if (created) req.transaction.abort(); };
    req.onsuccess = () => resolve(created ? (req.result.close(), null) : req.result);
    req.onerror = () => created ? resolve(null) : reject(req.error || new Error('Database ERP lama tidak bisa dibaca'));
    req.onblocked = () => resolve(false);
  }); } catch (e) { console.warn('Migrasi ERP lama belum selesai; akan dicoba lagi saat aplikasi dibuka berikutnya.',e); return; }
  if (db === false) { console.warn('Migrasi ERP lama tertunda karena database sedang dipakai tab lain.'); return; }
  const report = { version: 1, completedAt: new Date().toISOString(), entities: {}, conflicts: 0 };
  let conflicts = [];
  if (db) {
    try {
      const names = ['products','inventory_logs','marketplaces_raw','opex','settings','order_items'];
      for (const name of names) {
        if (!db.objectStoreNames.contains(name)) continue;
        const rows = await new Promise((resolve,reject) => {
          const tx = db.transaction(name,'readonly');
          const req = tx.objectStore(name).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
        const key = 'kalsara_erp_'+name;
        let current = {};
        const existing = KStore.getItem(key);
        if (existing !== null) {
          current = JSON.parse(existing);
          if (!current || typeof current !== 'object' || Array.isArray(current)) throw new Error('Data tujuan '+name+' tidak valid; migrasi dihentikan agar data tidak tertimpa.');
        }
        const merged = mergeLegacyRows(current, rows, name);
        // Never replace an existing destination row on ID collision. New IDs are
        // appended; conflicting source/destination records are preserved in a report.
        if (merged.added > 0) KStore.setItem(key,JSON.stringify(merged.map));
        conflicts = mergeMigrationConflicts(conflicts, merged.conflicts);
        report.entities[name] = { source: rows.length, added: merged.added, identical: merged.identical, conflicts: merged.conflicts.length, skipped: merged.skipped };
      }
    } finally { db.close(); }
  }
  const oldConflicts = KStore.getItem('__kalsara_erp_idb_migration_conflicts_v1');
  if (oldConflicts) {
    try { conflicts = mergeMigrationConflicts(JSON.parse(oldConflicts), conflicts); }
    catch { console.warn('Log konflik migrasi lama tidak dapat dibaca; tidak akan menghapus key log tersebut.'); }
  }
  report.conflicts = conflicts.length;
  KStore.setItem('__kalsara_erp_idb_migration_report_v1',JSON.stringify(report));
  if (conflicts.length) KStore.setItem('__kalsara_erp_idb_migration_conflicts_v1',JSON.stringify(conflicts));
  KStore.setItem('__kalsara_erp_idb_migration_v1','done');
  await KStore.flush();
}
await migrateLegacyERP();
globalThis.KStore=KStore;
globalThis.KalsaraWorker={compute};
await import('./app-core.js');

// Optional permanent backup through the browser's File System Access API.
// The original backup/restore UI remains intact; these helpers are also exposed for integration.
globalThis.KalsaraBackup={backupToFile};
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-kalsara-fs-backup]');
  if(!b)return;
  backupToFile().then(()=>globalThis.toast?.('Cadangan disimpan')).catch(err=>globalThis.toast?.(err.message));
});

window.addEventListener('kalsara-storage-error', event => {
  const message = event.detail?.message || 'Penyimpanan perangkat gagal.';
  setTimeout(() => globalThis.toast?.('PERINGATAN: '+message+' Buat cadangan data dan periksa ruang penyimpanan.'),0);
});
