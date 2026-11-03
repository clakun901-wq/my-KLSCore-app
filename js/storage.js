/* Kalsara client-only persistence (Tahap 3).
 *
 * Dua mode, dipilih saat initStorage():
 *  - 'sqlite'  : SQLite Wasm di Worker (OPFS SAH Pool) adalah SATU-SATUNYA sumber data.
 *                Tiap perubahan = satu transaksi (key-value + tabel domain ERP sekaligus).
 *                Jurnal OPFS lama tidak lagi ditulis; ia dibiarkan utuh sebagai sumber pemulihan.
 *  - 'journal' : jalur lama (OPFS append-only journal). Hanya dipakai bila SQLite tidak tersedia
 *                DAN aplikasi belum pernah beralih ke SQLite pada perangkat ini.
 * Setelah beralih, penanda `kalsara-backend.json` mencegah jatuh diam-diam ke jurnal yang sudah usang.
 */
import { ERP_TABLES, ERP_KEY_PREFIX, erpEntityOfKey, isEmptyData } from './sqlite-engine.js';
import { createSqliteBackend } from './sqlite-client.js';

const JOURNAL = 'kalsara-delta.log';
const MARKER = 'kalsara-backend.json';
const WRITER_LOCK = 'kalsara-sqlite-writer';
const encoder = new TextEncoder();
let root, backend = null, mode = 'journal', chain = Promise.resolve(), ready = false, lockRelease = null;
const cache = new Map();
// durableCache tracks values known to have reached durable storage (journal or SQLite).
const durableCache = new Map();
const writeVersions = new Map();
const failedWrites = new Map();
// Mode SQLite: baris ERP per entitas domain (id -> baris). Tabel SQLite adalah sumber kebenaran di disk.
const erpMaps = new Map();

function coded(code, message, cause) { const e = new Error(message); e.code = code; if (cause) e.cause = cause; return e; }
const isErpDomain = entity => Object.prototype.hasOwnProperty.call(ERP_TABLES, entity);
const erpKey = entity => ERP_KEY_PREFIX + entity;
const sqliteErpEntity = k => (mode === 'sqlite' ? erpEntityOfKey(k) : null);
function erpCompat(entity) {
  const map = erpMaps.get(entity);
  return map && map.size ? JSON.stringify(Object.fromEntries(map)) : null;
}
function allKeys() {
  const keys = [...cache.keys()];
  if (mode === 'sqlite') for (const entity of Object.keys(ERP_TABLES)) if (erpMaps.get(entity)?.size) keys.push(erpKey(entity));
  return keys;
}
function dispatchStorageError(message) {
  try { window.dispatchEvent(new CustomEvent('kalsara-storage-error', { detail: { message } })); } catch {}
}

/* ---------- jurnal OPFS (jalur lama + sumber impor sekali jalan) ---------- */
async function replayJournal() {
  const handle = await root.getFileHandle(JOURNAL, {create:true});
  const raw = await (await handle.getFile()).text();
  const lines = raw.split('\n');
  for (let i=0; i<lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    try {
      const event = JSON.parse(line);
      if (!event || typeof event !== 'object') continue;
      if (event.snapshot && typeof event.snapshot === 'object' && !Array.isArray(event.snapshot)) {
        cache.clear();
        for (const [k,v] of Object.entries(event.snapshot)) cache.set(k,String(v));
        continue;
      }
      if (typeof event.k !== 'string') continue;
      if (event.del) cache.delete(event.k);
      else if (typeof event.v === 'string') cache.set(event.k,event.v);
    } catch (e) {
      // A torn final write is ignored; malformed interior records are surfaced.
      if (i !== lines.length-1) throw new Error('Jurnal OPFS rusak pada baris ' + (i+1));
    }
  }
}
async function appendJournal(record) {
  const event = JSON.stringify(record) + '\n';
  const handle = await root.getFileHandle(JOURNAL,{create:true});
  const file = await handle.getFile();
  const writer = await handle.createWritable({keepExistingData:true});
  try { await writer.seek(file.size); await writer.write(encoder.encode(event)); await writer.close(); }
  catch (e) { try { await writer.abort(); } catch {} throw e; }
}
const appendDelta = (k, v, del=false) => appendJournal({k,v,del,at:Date.now()});
const appendSnapshot = snapshot => appendJournal({snapshot,at:Date.now()});

/* ---------- penanda backend & penjaga multi-tab ---------- */
async function readMarker() {
  try {
    const handle = await root.getFileHandle(MARKER);
    const text = await (await handle.getFile()).text();
    return text ? JSON.parse(text) : {};
  } catch { return {}; }
}
async function writeMarker() {
  const handle = await root.getFileHandle(MARKER, {create:true});
  const writer = await handle.createWritable();
  try { await writer.write(JSON.stringify({authoritative:'sqlite',since:new Date().toISOString()})); await writer.close(); }
  catch (e) { try { await writer.abort(); } catch {} throw e; }
}
// SAH Pool hanya mengizinkan satu koneksi. Web Lock dipegang sepanjang umur halaman.
function acquireWriterLock() {
  if (!globalThis.navigator?.locks?.request) return Promise.resolve({held:true, release(){}});
  return new Promise(resolve => {
    navigator.locks.request(WRITER_LOCK, {ifAvailable:true}, lock => {
      if (!lock) { resolve({held:false}); return; }
      return new Promise(release => resolve({held:true, release}));
    }).catch(() => resolve({held:true, release(){}}));
  });
}

/* ---------- hidrasi ---------- */
function hydrate(data) {
  cache.clear(); durableCache.clear(); erpMaps.clear();
  for (const [k,v] of data.kv) cache.set(k,v);
  for (const entity of Object.keys(ERP_TABLES)) erpMaps.set(entity,new Map(data.erp[entity] || []));
  for (const [k,v] of cache) durableCache.set(k,v);
}
async function resyncErp(entity) {
  if (!backend) return;
  erpMaps.set(entity,new Map(await backend.request('erp-load',{entity})));
}

async function openSqliteBackend(options) {
  const factory = options.backendFactory || defaultBackendFactory;
  const b = await factory();
  try { await b.request('open'); } catch (e) { try { b.terminate?.(); } catch {} throw e; }
  return b;
}
async function defaultBackendFactory() {
  if (typeof Worker !== 'function') throw coded('no-worker','Browser ini tidak mendukung Web Worker.');
  return createSqliteBackend(() => new Worker(new URL('../workers/sqlite-store.worker.js', import.meta.url), {type:'module'}));
}

export async function initStorage(options = {}) {
  if (!navigator.storage?.getDirectory) throw new Error('OPFS tidak didukung browser ini. Gunakan browser modern melalui HTTPS/localhost.');
  root = await navigator.storage.getDirectory();
  try { await navigator.storage.persist(); } catch {}
  const marker = await readMarker();
  const lock = await acquireWriterLock();
  if (!lock.held) throw coded('another-tab','Kalsara sedang terbuka di tab atau jendela lain. Tutup yang lain, lalu muat ulang halaman ini agar data tidak bentrok.');

  let opened = null, openError = null;
  try {
    opened = await openSqliteBackend(options);
    backend = opened;
    let data = await backend.request('load');
    if (!data.meta.journal_imported_at) {
      // Pertama kali SQLite dipakai: impor atomik dari jurnal OPFS (jurnal sendiri tidak diubah).
      await writeMarker(); // Tanda ditulis SEBELUM impor: bila crash, boot berikutnya tidak jatuh ke jurnal usang.
      await replayJournal();
      const ops = [];
      if (isEmptyData(data)) ops.push({op:'replace',snapshot:Object.fromEntries(cache)});
      else console.warn('Database SQLite sudah berisi data tanpa penanda impor; data SQLite dipertahankan, jurnal tidak diimpor.');
      ops.push({op:'meta',k:'journal_imported_at',v:new Date().toISOString()});
      await backend.request('apply',{ops});
      data = await backend.request('load');
    }
    hydrate(data);
    mode = 'sqlite';
    lockRelease = lock.release;
  } catch (e) {
    openError = e;
    try { backend?.terminate?.(); } catch {}
    backend = null; cache.clear(); durableCache.clear(); erpMaps.clear();
  }
  if (openError) {
    lock.release();
    // Baca ulang: impor pertama menulis penanda sebelum gagal; jangan jatuh ke jurnal bila penanda sudah ada.
    const current = await readMarker();
    if (marker.authoritative === 'sqlite' || current.authoritative === 'sqlite') throw coded('sqlite-required','Database SQLite Kalsara tidak dapat dibuka (' + openError.message + '). Data terbaru berada di SQLite, jadi aplikasi tidak memakai jurnal lama yang sudah usang. Pastikan file vendor/sqlite-wasm tersedia, lalu muat ulang.', openError);
    console.warn('SQLite tidak tersedia; memakai jurnal OPFS.', openError);
    mode = 'journal';
    await replayJournal();
    durableCache.clear();
    for (const [k,v] of cache) durableCache.set(k,v);
  }
  ready = true;
}

/* ---------- penulisan ---------- */
function enqueueTask(key, run, rollback) {
  const version = (writeVersions.get(key) || 0) + 1;
  writeVersions.set(key, version);
  chain = chain.then(async () => {
    await run();
    failedWrites.delete(key);
  }).catch(async error => {
    failedWrites.set(key,error);
    // Roll back only if no newer optimistic edit superseded this write.
    if (writeVersions.get(key) === version) {
      try { await rollback(); } catch (e) { console.error('Gagal memulihkan keadaan setelah penulisan gagal.',e); }
    }
    console.error('Gagal menyimpan perubahan Kalsara.',error);
    dispatchStorageError(error.message);
  });
}
function enqueue(k,v,del) {
  const entity = sqliteErpEntity(k);
  enqueueTask(k, async () => {
    if (backend) await backend.request('apply',{ops:[del?{op:'del',k}:{op:'put',k,v}]});
    else await appendDelta(k,v,del);
    if (!entity) { if (del) durableCache.delete(k); else durableCache.set(k,v); }
  }, async () => {
    if (entity) { await resyncErp(entity); return; }
    if (durableCache.has(k)) cache.set(k,durableCache.get(k)); else cache.delete(k);
  });
}
function erpFallbackMap(entity) {
  const raw=cache.get(erpKey(entity));
  if(!raw)return {};
  const value=JSON.parse(raw);
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Data ERP '+entity+' tidak valid');
  return value;
}
function cloneRows(list) { return JSON.parse(JSON.stringify(list)); }
function checkRows(list) {
  if(!Array.isArray(list))throw new TypeError('Daftar baris ERP harus berupa array');
  for(const row of list){if(!row||typeof row!=='object'||row.id==null)throw new Error('Setiap baris ERP harus memiliki ID');}
}
function sqliteErpMutation(entity, optimistic, op) {
  optimistic(erpMaps.get(entity));
  enqueueTask(erpKey(entity), async () => { await backend.request('apply',{ops:[op]}); }, () => resyncErp(entity));
}

export const KStore = {
  get backend() { return mode; },
  getItem(k) {
    k=String(k);
    const entity = sqliteErpEntity(k);
    if (entity) return erpCompat(entity);
    return cache.has(k) ? cache.get(k) : null;
  },
  async erpAll(entity) {
    if (mode === 'sqlite' && isErpDomain(entity)) return structuredClone([...erpMaps.get(entity).values()]);
    return Object.values(erpFallbackMap(entity));
  },
  async erpPut(entity, list) {
    checkRows(list);
    if (mode === 'sqlite' && isErpDomain(entity)) {
      const rows = cloneRows(list); // sama dengan yang akan tersimpan di tabel (payload JSON)
      sqliteErpMutation(entity, map => { for (const row of rows) map.set(String(row.id),row); }, {op:'erp-put',entity,rows});
    } else {
      const map=erpFallbackMap(entity);
      for(const row of list)map[String(row.id)]=row;
      this.setItem(erpKey(entity),JSON.stringify(map));
    }
    await this.flush();
    return this.erpAll(entity);
  },
  async erpDelete(entity, id) {
    if (mode === 'sqlite' && isErpDomain(entity)) {
      sqliteErpMutation(entity, map => map.delete(String(id)), {op:'erp-del',entity,id:String(id)});
    } else {
      const map=erpFallbackMap(entity);delete map[String(id)];
      this.setItem(erpKey(entity),JSON.stringify(map));
    }
    await this.flush();
    return this.erpAll(entity);
  },
  async erpClear(entity) {
    if (mode === 'sqlite' && isErpDomain(entity)) sqliteErpMutation(entity, map => map.clear(), {op:'erp-clear',entity});
    else this.setItem(erpKey(entity),'{}');
    await this.flush();
    return this.erpAll(entity);
  },
  setItem(k,v) {
    if (!ready) throw new Error('Penyimpanan belum siap');
    k=String(k); v=String(v);
    const entity = sqliteErpEntity(k);
    if (entity) {
      const parsed = JSON.parse(v);
      if (!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw new Error('Data ERP '+entity+' tidak valid');
      if (erpCompat(entity)===JSON.stringify(parsed) || (!erpMaps.get(entity).size && !Object.keys(parsed).length)) return;
      erpMaps.set(entity,new Map(Object.entries(parsed).filter(([,row])=>row&&typeof row==='object').map(([mapKey,row])=>[String(row.id ?? mapKey),row])));
      enqueue(k,v,false);
      return;
    }
    if (cache.has(k) && cache.get(k)===v) return;
    cache.set(k,v);
    enqueue(k,v,false);
  },
  removeItem(k) {
    if (!ready) throw new Error('Penyimpanan belum siap');
    k=String(k);
    const entity = sqliteErpEntity(k);
    if (entity) { if (!erpMaps.get(entity).size) return; erpMaps.get(entity).clear(); enqueue(k,'',true); return; }
    if (!cache.has(k) && !durableCache.has(k)) return; cache.delete(k); enqueue(k,'',true);
  },
  key(i) { return allKeys()[i] ?? null; },
  get length() { return allKeys().length; },
  async flush() {
    await chain;
    if (failedWrites.size) { const [key,error] = failedWrites.entries().next().value; throw new Error('Data '+key+' belum tersimpan: '+error.message); }
  },
  async exportSnapshot() {
    await this.flush();
    const out = Object.fromEntries(cache);
    if (mode === 'sqlite') for (const entity of Object.keys(ERP_TABLES)) { const c = erpCompat(entity); if (c !== null) out[erpKey(entity)] = c; }
    return JSON.stringify(out);
  },
  async importSnapshot(json) {
    const obj=JSON.parse(json);
    if (!obj || typeof obj!=='object' || Array.isArray(obj)) throw new Error('Cadangan tidak valid');
    await chain; // A restore may recover from an earlier failed key write.
    const snapshot = Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,String(v)]));
    const task = chain.then(async () => {
      if (backend) {
        // Satu transaksi SQLite: restore bersifat semua-atau-tidak-sama-sekali.
        await backend.request('apply',{ops:[{op:'replace',snapshot}]});
        hydrate(await backend.request('load'));
      } else {
        await appendSnapshot(snapshot); // One journal record: restore is all-or-nothing.
        cache.clear(); durableCache.clear();
        for (const [k,v] of Object.entries(snapshot)) { cache.set(k,v); durableCache.set(k,v); }
      }
      failedWrites.clear();
    });
    chain = task.catch(() => {});
    await task;
  }
};
export async function backupToFile() {
  if (!window.showSaveFilePicker) throw new Error('File System Access API tidak tersedia di browser ini.');
  const data=await KStore.exportSnapshot();
  const handle=await window.showSaveFilePicker({suggestedName:'kalsara-backup.json',types:[{description:'Cadangan Kalsara',accept:{'application/json':['.json']}}]});
  const writer=await handle.createWritable();
  try { await writer.write(data); await writer.close(); } catch(e) { try { await writer.abort(); } catch {} throw e; }
}
export async function restoreFromFile(file) { await KStore.importSnapshot(await file.text()); }
