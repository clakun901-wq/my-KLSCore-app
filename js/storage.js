/* Kalsara client-only persistence.
 * OPFS append-only journal is authoritative; SQLite Wasm is a rebuildable index.
 */
const DB_NAME = 'kalsara.sqlite3';
const JOURNAL = 'kalsara-delta.log';
const encoder = new TextEncoder();
let root, db, chain = Promise.resolve(), ready = false;
const cache = new Map();
// durableCache tracks values known to have reached the OPFS journal.
const durableCache = new Map();
const writeVersions = new Map();
const failedWrites = new Map();

function sqlExec(sql, bind = []) {
  if (!db) return;
  const stmt = db.prepare(sql);
  try { stmt.bind(bind); while (stmt.step()) {} } finally { stmt.finalize(); }
}

const ERP_TABLES = Object.freeze({marketplaces_raw:'erp_marketplaces_raw',order_items:'erp_order_items',opex:'erp_opex',settings:'erp_settings'});
function safeInt(v) { return Number.isSafeInteger(v) ? v : null; }
function syncErpMaterialized(key, serialized) {
  if (!db || !key.startsWith('kalsara_erp_')) return;
  const entity=key.slice('kalsara_erp_'.length), table=ERP_TABLES[entity];
  if (!table) return;
  const rows=serialized ? JSON.parse(serialized) : {};
  if (!rows || typeof rows!=='object' || Array.isArray(rows)) throw new Error('Data ERP '+entity+' tidak valid untuk indeks SQLite');
  sqlExec('DELETE FROM '+table);
  for (const [mapKey,row] of Object.entries(rows)) {
    if (!row || typeof row!=='object') continue;
    const id=String(row.id ?? mapKey), payload=JSON.stringify(row);
    if (entity==='marketplaces_raw') sqlExec('INSERT INTO erp_marketplaces_raw(id,order_id,sku,date,gross_revenue,released_amount,quantity,payload) VALUES(?,?,?,?,?,?,?,?)',[id,String(row.order_id||''),String(row.sku||''),String(row.date||''),safeInt(row.gross_revenue),safeInt(row.tp),safeInt(row.qty),payload]);
    else if (entity==='order_items') sqlExec('INSERT INTO erp_order_items(id,order_id,sku,quantity,price,payload) VALUES(?,?,?,?,?,?)',[id,String(row.order_id||''),String(row.sku||''),safeInt(row.qty),safeInt(row.price),payload]);
    else if (entity==='opex') sqlExec('INSERT INTO erp_opex(id,date,category,amount,notes,payload) VALUES(?,?,?,?,?,?)',[id,String(row.date||''),String(row.category||''),safeInt(row.amount),String(row.notes||''),payload]);
    else if (entity==='settings') sqlExec('INSERT INTO erp_settings(id,payload) VALUES(?,?)',[id,payload]);
  }
}
async function openSQLite() {
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.46.1-build1/index.mjs');
    const sqlite3 = await mod.default({ print:()=>{}, printErr:()=>{} });
    db = new sqlite3.oo1.OpfsDb('/' + DB_NAME, 'c');
    db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, rev INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS event_log (seq INTEGER PRIMARY KEY AUTOINCREMENT, k TEXT NOT NULL, v TEXT NOT NULL, at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS erp_marketplaces_raw (id TEXT PRIMARY KEY, order_id TEXT, sku TEXT, date TEXT, gross_revenue INTEGER, released_amount INTEGER, quantity INTEGER, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_erp_market_date ON erp_marketplaces_raw(date); CREATE INDEX IF NOT EXISTS idx_erp_market_order ON erp_marketplaces_raw(order_id); CREATE TABLE IF NOT EXISTS erp_order_items (id TEXT PRIMARY KEY, order_id TEXT, sku TEXT, quantity INTEGER, price INTEGER, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_erp_items_order ON erp_order_items(order_id); CREATE INDEX IF NOT EXISTS idx_erp_items_sku ON erp_order_items(sku); CREATE TABLE IF NOT EXISTS erp_opex (id TEXT PRIMARY KEY, date TEXT, category TEXT, amount INTEGER, notes TEXT, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_erp_opex_date ON erp_opex(date); CREATE TABLE IF NOT EXISTS erp_settings (id TEXT PRIMARY KEY, payload TEXT NOT NULL);');
    return true;
  } catch (e) {
    db = null;
    console.warn('SQLite OPFS tidak tersedia; jurnal OPFS tetap menjadi penyimpanan utama.', e);
    return false;
  }
}
async function hydrateSQLite() {
  if (!db) return;
  try {
    db.exec({sql:'SELECT k,v FROM kv',rowMode:'array',callback:r=>cache.set(r[0],r[1])});
  } catch (e) { console.warn('Indeks SQLite akan dibangun ulang dari jurnal OPFS.', e); }
}
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
async function rebuildSQLite() {
  if (!db) return;
  db.exec('BEGIN IMMEDIATE');
  try {
    sqlExec('DELETE FROM kv');
    sqlExec('DELETE FROM erp_marketplaces_raw'); sqlExec('DELETE FROM erp_order_items'); sqlExec('DELETE FROM erp_opex'); sqlExec('DELETE FROM erp_settings');
    for (const [k,v] of cache) { sqlExec('INSERT INTO kv(k,v,rev) VALUES(?,?,1)',[k,v]); syncErpMaterialized(k,v); }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); console.warn('Indeks SQLite gagal dibangun ulang; jurnal tetap aman.',e); db=null; }
}
async function appendDelta(k, v, del=false) {
  const event = JSON.stringify({k,v,del,at:Date.now()}) + '\n';
  const handle = await root.getFileHandle(JOURNAL,{create:true});
  const file = await handle.getFile();
  const writer = await handle.createWritable({keepExistingData:true});
  try { await writer.seek(file.size); await writer.write(encoder.encode(event)); await writer.close(); }
  catch (e) { try { await writer.abort(); } catch {} throw e; }

  if (db) {
    try {
      db.exec('BEGIN IMMEDIATE');
      sqlExec('INSERT INTO event_log(k,v,at) VALUES(?,?,?)',[k,v,Date.now()]);
      if (del) sqlExec('DELETE FROM kv WHERE k=?',[k]);
      else sqlExec('INSERT INTO kv(k,v,rev) VALUES(?,?,1) ON CONFLICT(k) DO UPDATE SET v=excluded.v, rev=kv.rev+1',[k,v]);
      if (k.startsWith('kalsara_erp_')) syncErpMaterialized(k,del?null:v);
      db.exec('COMMIT');
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch {}
      console.warn('SQLite tertinggal; data jurnal OPFS tetap tersimpan.',e);
      db=null;
    }
  }
}
function enqueue(k,v,del) {
  const version = (writeVersions.get(k) || 0) + 1;
  writeVersions.set(k, version);
  const task = chain.then(async () => {
    await appendDelta(k,v,del);
    if (del) durableCache.delete(k); else durableCache.set(k,v);
    failedWrites.delete(k);
  }).catch(error => {
    failedWrites.set(k,error);
    // Roll back only if no newer optimistic edit superseded this write.
    if (writeVersions.get(k) === version) {
      if (durableCache.has(k)) cache.set(k,durableCache.get(k));
      else cache.delete(k);
    }
    console.error('Gagal menyimpan perubahan Kalsara ke OPFS.',error);
    try { window.dispatchEvent(new CustomEvent('kalsara-storage-error',{detail:{message:error.message}})); } catch {}
  });
  chain = task;
}
export async function initStorage() {
  if (!navigator.storage?.getDirectory) throw new Error('OPFS tidak didukung browser ini. Gunakan browser modern melalui HTTPS/localhost.');
  root = await navigator.storage.getDirectory();
  try { await navigator.storage.persist(); } catch {}
  await openSQLite();
  await hydrateSQLite();
  await replayJournal(); // Journal is newer than the SQLite materialized view.
  await rebuildSQLite();
  durableCache.clear();
  for (const [k,v] of cache) durableCache.set(k,v);
  ready = true;
}
async function appendSnapshot(snapshot) {
  const event = JSON.stringify({snapshot,at:Date.now()}) + '\n';
  const handle = await root.getFileHandle(JOURNAL,{create:true});
  const file = await handle.getFile();
  const writer = await handle.createWritable({keepExistingData:true});
  try { await writer.seek(file.size); await writer.write(encoder.encode(event)); await writer.close(); }
  catch (e) { try { await writer.abort(); } catch {} throw e; }
}
function erpFallbackMap(entity) {
  const raw=cache.get('kalsara_erp_'+entity);
  if(!raw)return {};
  const value=JSON.parse(raw);
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Data ERP '+entity+' tidak valid');
  return value;
}
function erpRowsFromSQLite(entity) {
  const table=ERP_TABLES[entity];
  if(!db||!table)return null;
  const rows=[];
  try { db.exec({sql:'SELECT payload FROM '+table+' ORDER BY id',rowMode:'array',callback:r=>rows.push(JSON.parse(r[0]))}); return rows; }
  catch(e) { console.warn('Pembacaan tabel ERP '+entity+' gagal; memakai jurnal OPFS.',e); return null; }
}
export const KStore = {
  getItem(k) { k=String(k); return cache.has(k) ? cache.get(k) : null; },
  async erpAll(entity) {
    if(!Object.prototype.hasOwnProperty.call(ERP_TABLES,entity))return Object.values(erpFallbackMap(entity));
    const rows=erpRowsFromSQLite(entity);
    return rows===null?Object.values(erpFallbackMap(entity)):rows;
  },
  async erpPut(entity, list) {
    if(!Array.isArray(list))throw new TypeError('Daftar baris ERP harus berupa array');
    const map=erpFallbackMap(entity);
    for(const row of list){if(!row||typeof row!=='object'||row.id==null)throw new Error('Setiap baris ERP harus memiliki ID');map[String(row.id)]=row;}
    this.setItem('kalsara_erp_'+entity,JSON.stringify(map));
    await this.flush();
    return this.erpAll(entity);
  },
  async erpDelete(entity, id) {
    const map=erpFallbackMap(entity);delete map[String(id)];
    this.setItem('kalsara_erp_'+entity,JSON.stringify(map));
    await this.flush();
    return this.erpAll(entity);
  },
  async erpClear(entity) {
    this.setItem('kalsara_erp_'+entity,'{}');
    await this.flush();
    return this.erpAll(entity);
  },
  setItem(k,v) {
    if (!ready) throw new Error('Penyimpanan belum siap');
    k=String(k); v=String(v);
    if (cache.has(k) && cache.get(k)===v) return;
    cache.set(k,v);
    enqueue(k,v,false);
  },
  removeItem(k) {
    if (!ready) throw new Error('Penyimpanan belum siap');
    k=String(k); if (!cache.has(k) && !durableCache.has(k)) return; cache.delete(k); enqueue(k,'',true);
  },
  key(i) { return [...cache.keys()][i] ?? null; },
  get length() { return cache.size; },
  async flush() {
    await chain;
    if (failedWrites.size) { const [key,error] = failedWrites.entries().next().value; throw new Error('Data '+key+' belum tersimpan di OPFS: '+error.message); }
  },
  async exportSnapshot() { await this.flush(); return JSON.stringify(Object.fromEntries(cache)); },
  async importSnapshot(json) {
    const obj=JSON.parse(json);
    if (!obj || typeof obj!=='object' || Array.isArray(obj)) throw new Error('Cadangan tidak valid');
    await chain; // A restore may recover from an earlier failed key write.
    const snapshot = Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,String(v)]));
    const task = chain.then(async () => {
      await appendSnapshot(snapshot); // One journal record: restore is all-or-nothing.
      cache.clear(); durableCache.clear();
      for (const [k,v] of Object.entries(snapshot)) { cache.set(k,v); durableCache.set(k,v); }
      failedWrites.clear();
      await rebuildSQLite();
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
