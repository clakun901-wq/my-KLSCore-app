/* Kalsara SQLite engine (Tahap 3).
 *
 * Logika murni: skema, migrasi, dan operasi transaksional di atas adapter `db`.
 * Tidak mengimpor Wasm, Worker, atau DOM, sehingga dapat diuji di Node dengan
 * SQLite sungguhan (node:sqlite) dan dipakai apa adanya oleh Worker di browser.
 *
 * Adapter `db` yang dibutuhkan:
 *   exec(sql)            -> jalankan satu/lebih pernyataan tanpa bind
 *   run(sql, bind=[])    -> jalankan satu pernyataan dengan bind
 *   all(sql, bind=[])    -> array baris, tiap baris berupa array nilai kolom
 */
export const SCHEMA_VERSION = 1;
export const ERP_KEY_PREFIX = 'kalsara_erp_';
export const ERP_TABLES = Object.freeze({
  marketplaces_raw: 'erp_marketplaces_raw',
  order_items: 'erp_order_items',
  opex: 'erp_opex',
  settings: 'erp_settings'
});

const DDL = [
  'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, rev INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS erp_marketplaces_raw (id TEXT PRIMARY KEY, order_id TEXT, sku TEXT, date TEXT, gross_revenue INTEGER, released_amount INTEGER, quantity INTEGER, payload TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_erp_market_date ON erp_marketplaces_raw(date)',
  'CREATE INDEX IF NOT EXISTS idx_erp_market_order ON erp_marketplaces_raw(order_id)',
  'CREATE TABLE IF NOT EXISTS erp_order_items (id TEXT PRIMARY KEY, order_id TEXT, sku TEXT, quantity INTEGER, price INTEGER, payload TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_erp_items_order ON erp_order_items(order_id)',
  'CREATE INDEX IF NOT EXISTS idx_erp_items_sku ON erp_order_items(sku)',
  'CREATE TABLE IF NOT EXISTS erp_opex (id TEXT PRIMARY KEY, date TEXT, category TEXT, amount INTEGER, notes TEXT, payload TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_erp_opex_date ON erp_opex(date)',
  'CREATE TABLE IF NOT EXISTS erp_settings (id TEXT PRIMARY KEY, payload TEXT NOT NULL)'
];

function safeInt(v) { return Number.isSafeInteger(v) ? v : null; }
const str = v => String(v || '');

// Kolom turunan per entitas (selain id dan payload) dan cara mengambil nilainya.
const ERP_COLUMNS = {
  marketplaces_raw: { cols: ['order_id', 'sku', 'date', 'gross_revenue', 'released_amount', 'quantity'], values: r => [str(r.order_id), str(r.sku), str(r.date), safeInt(r.gross_revenue), safeInt(r.tp), safeInt(r.qty)] },
  order_items: { cols: ['order_id', 'sku', 'quantity', 'price'], values: r => [str(r.order_id), str(r.sku), safeInt(r.qty), safeInt(r.price)] },
  opex: { cols: ['date', 'category', 'amount', 'notes'], values: r => [str(r.date), str(r.category), safeInt(r.amount), str(r.notes)] },
  settings: { cols: [], values: () => [] }
};
const UPSERT = {};
for (const [entity, table] of Object.entries(ERP_TABLES)) {
  const cols = ['id', ...ERP_COLUMNS[entity].cols, 'payload'];
  const updates = cols.slice(1).map(c => c + '=excluded.' + c).join(',');
  UPSERT[entity] = 'INSERT INTO ' + table + '(' + cols.join(',') + ') VALUES(' + cols.map(() => '?').join(',') + ') ON CONFLICT(id) DO UPDATE SET ' + updates;
}

export function erpEntityOfKey(k) {
  if (typeof k !== 'string' || !k.startsWith(ERP_KEY_PREFIX)) return null;
  const entity = k.slice(ERP_KEY_PREFIX.length);
  return Object.prototype.hasOwnProperty.call(ERP_TABLES, entity) ? entity : null;
}
function needEntity(entity) {
  if (!Object.prototype.hasOwnProperty.call(ERP_TABLES, entity)) throw new Error('Entitas ERP tidak dikenal: ' + entity);
  return entity;
}

export function migrate(db) {
  const version = Number(db.all('PRAGMA user_version')[0][0]);
  if (version > SCHEMA_VERSION) throw new Error('Skema database (v' + version + ') lebih baru dari aplikasi ini (v' + SCHEMA_VERSION + '). Perbarui aplikasi; data tidak diubah.');
  if (version === SCHEMA_VERSION) return { from: version, to: version };
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const sql of DDL) db.exec(sql);
    db.exec('PRAGMA user_version = ' + SCHEMA_VERSION);
    db.exec('COMMIT');
  } catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }
  return { from: version, to: SCHEMA_VERSION };
}

function parseErpMap(entity, serialized) {
  const rows = serialized ? JSON.parse(serialized) : {};
  if (!rows || typeof rows !== 'object' || Array.isArray(rows)) throw new Error('Data ERP ' + entity + ' tidak valid');
  return rows;
}
function erpUpsert(db, entity, id, row) {
  db.run(UPSERT[entity], [String(id), ...ERP_COLUMNS[entity].values(row), JSON.stringify(row)]);
}
function erpClear(db, entity) { db.run('DELETE FROM ' + ERP_TABLES[entity]); }
function erpReplace(db, entity, map) {
  erpClear(db, entity);
  for (const [mapKey, row] of Object.entries(map)) {
    if (!row || typeof row !== 'object') continue;
    erpUpsert(db, entity, row.id ?? mapKey, row);
  }
}
function kvPut(db, k, v) { db.run('INSERT INTO kv(k,v,rev) VALUES(?,?,1) ON CONFLICT(k) DO UPDATE SET v=excluded.v, rev=kv.rev+1', [k, v]); }

function applyOp(db, op) {
  if (!op || typeof op !== 'object') throw new Error('Operasi penyimpanan tidak valid');
  switch (op.op) {
    case 'put': {
      if (typeof op.k !== 'string' || typeof op.v !== 'string') throw new Error('put memerlukan key dan nilai string');
      const entity = erpEntityOfKey(op.k);
      if (entity) erpReplace(db, entity, parseErpMap(entity, op.v)); else kvPut(db, op.k, op.v);
      return;
    }
    case 'del': {
      if (typeof op.k !== 'string') throw new Error('del memerlukan key string');
      const entity = erpEntityOfKey(op.k);
      if (entity) erpClear(db, entity); else db.run('DELETE FROM kv WHERE k=?', [op.k]);
      return;
    }
    case 'erp-put': {
      needEntity(op.entity);
      if (!Array.isArray(op.rows)) throw new TypeError('Daftar baris ERP harus berupa array');
      for (const row of op.rows) {
        if (!row || typeof row !== 'object' || row.id == null) throw new Error('Setiap baris ERP harus memiliki ID');
        erpUpsert(db, op.entity, row.id, row);
      }
      return;
    }
    case 'erp-del': needEntity(op.entity); db.run('DELETE FROM ' + ERP_TABLES[op.entity] + ' WHERE id=?', [String(op.id)]); return;
    case 'erp-clear': needEntity(op.entity); erpClear(db, op.entity); return;
    case 'meta': {
      if (typeof op.k !== 'string' || typeof op.v !== 'string') throw new Error('meta memerlukan key dan nilai string');
      db.run('INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v', [op.k, op.v]);
      return;
    }
    case 'replace': {
      const snapshot = op.snapshot;
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('Snapshot tidak valid');
      db.run('DELETE FROM kv');
      for (const entity of Object.keys(ERP_TABLES)) erpClear(db, entity);
      for (const [k, v] of Object.entries(snapshot)) {
        const value = String(v), entity = erpEntityOfKey(k);
        if (entity) erpReplace(db, entity, parseErpMap(entity, value)); else kvPut(db, k, value);
      }
      return;
    }
    default: throw new Error('Operasi penyimpanan tidak dikenal: ' + op.op);
  }
}

/** Menerapkan seluruh operasi dalam SATU transaksi: semua berhasil atau tidak ada yang berubah. */
export function applyOps(db, ops) {
  if (!Array.isArray(ops)) throw new TypeError('ops harus array');
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const op of ops) applyOp(db, op);
    db.exec('COMMIT');
  } catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }
}

export function loadEntity(db, entity) {
  needEntity(entity);
  return db.all('SELECT id,payload FROM ' + ERP_TABLES[entity] + ' ORDER BY rowid').map(([id, payload]) => [id, JSON.parse(payload)]);
}

/** Seluruh isi database untuk hidrasi cache. Memakai pasangan [k,v], bukan objek, agar key aneh aman. */
export function loadAll(db) {
  const erp = {};
  for (const entity of Object.keys(ERP_TABLES)) erp[entity] = loadEntity(db, entity);
  return {
    kv: db.all('SELECT k,v FROM kv ORDER BY rowid').map(([k, v]) => [k, v]),
    erp,
    meta: Object.fromEntries(db.all('SELECT k,v FROM meta'))
  };
}

export function isEmptyData(data) {
  return data.kv.length === 0 && Object.values(data.erp).every(rows => rows.length === 0);
}

/** Layanan pesan untuk Worker: type -> hasil. `openDb` membuat adapter (Wasm di browser, node:sqlite di tes). */
export function createStoreService(openDb) {
  let db = null;
  const need = () => { if (!db) throw new Error('Database belum dibuka'); return db; };
  return {
    async handle(type, payload = {}) {
      switch (type) {
        case 'open': {
          if (db) return { schema: SCHEMA_VERSION, reopened: true };
          const opened = await openDb();
          try { migrate(opened); } catch (e) { try { opened.close?.(); } catch {} throw e; }
          db = opened;
          return { schema: SCHEMA_VERSION };
        }
        case 'load': return loadAll(need());
        case 'erp-load': return loadEntity(need(), payload.entity);
        case 'apply': applyOps(need(), payload.ops); return { applied: payload.ops.length };
        case 'close': { const d = db; db = null; d?.close?.(); return {}; }
        default: throw new Error('Pesan penyimpanan tidak dikenal: ' + type);
      }
    }
  };
}
