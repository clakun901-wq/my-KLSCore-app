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
export const SCHEMA_VERSION = 2;
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

const MAX_SAFE = 9007199254740991;
const MKT_FIELDS = ['fv', 'fs', 'fa', 'fx', 'fp', 'fr', 'fk', 'ft', 'platform_fee'];
function safeInt(v) { return Number.isSafeInteger(v) ? v : null; }
const str = v => String(v || '');
const rptOk = (r, fields) => fields.every(f => { const v = r[f]; return v == null || v === '' || Number.isSafeInteger(v); }) ? 1 : 0;

// Kolom turunan per entitas (selain id dan payload) dan cara mengambil nilainya.
const ERP_COLUMNS = {
  marketplaces_raw: { cols: ['order_id', 'sku', 'date', 'gross_revenue', 'released_amount', 'quantity', ...MKT_FIELDS, 'rpt_ok'], values: r => [str(r.order_id), str(r.sku), str(r.date), safeInt(r.gross_revenue), safeInt(r.tp), safeInt(r.qty), ...MKT_FIELDS.map(f => safeInt(r[f])), rptOk(r, ['gross_revenue', 'tp', ...MKT_FIELDS])] },
  order_items: { cols: ['order_id', 'sku', 'quantity', 'price'], values: r => [str(r.order_id), str(r.sku), safeInt(r.qty), safeInt(r.price)] },
  opex: { cols: ['date', 'category', 'amount', 'notes', 'rpt_ok'], values: r => [str(r.date), str(r.category), safeInt(r.amount), str(r.notes), rptOk(r, ['amount'])] },
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

// Tipe nilai uang yang diterima laporan: kosong/null atau integer aman. Selain itu menandai baris "tidak valid" (rpt_ok=0).
const sqlOk = f => "(json_type(payload,'$." + f + "') IS NULL OR json_type(payload,'$." + f + "')='null' OR (json_type(payload,'$." + f + "')='integer' AND ABS(json_extract(payload,'$." + f + "'))<=" + MAX_SAFE + "))";
const sqlInt = f => "CASE WHEN json_type(payload,'$." + f + "')='integer' AND ABS(json_extract(payload,'$." + f + "'))<=" + MAX_SAFE + " THEN json_extract(payload,'$." + f + "') END";

/* v2: kolom uang laporan menjadi kolom sungguhan (laporan tidak perlu mem-parse JSON per baris) + penanda rpt_ok.
   Data v1 yang sudah ada diisi ulang dari payload dalam transaksi yang sama. */
function migrateV2(db) {
  for (const f of MKT_FIELDS) db.exec('ALTER TABLE erp_marketplaces_raw ADD COLUMN ' + f + ' INTEGER');
  db.exec('ALTER TABLE erp_marketplaces_raw ADD COLUMN rpt_ok INTEGER NOT NULL DEFAULT 1');
  db.exec('ALTER TABLE erp_opex ADD COLUMN rpt_ok INTEGER NOT NULL DEFAULT 1');
  const mkt = ['gross_revenue', 'tp', ...MKT_FIELDS];
  db.exec('UPDATE erp_marketplaces_raw SET ' + MKT_FIELDS.map(f => f + '=(' + sqlInt(f) + ')').join(', ') +
    ', rpt_ok=CASE WHEN ' + mkt.map(sqlOk).join(' AND ') + ' THEN 1 ELSE 0 END');
  db.exec('UPDATE erp_opex SET rpt_ok=CASE WHEN ' + sqlOk('amount') + ' THEN 1 ELSE 0 END');
  db.exec('CREATE INDEX IF NOT EXISTS idx_erp_market_month ON erp_marketplaces_raw(substr(date,1,7))');
  db.exec('CREATE INDEX IF NOT EXISTS idx_erp_opex_month ON erp_opex(substr(date,1,7))');
}

export function migrate(db) {
  const version = Number(db.all('PRAGMA user_version')[0][0]);
  if (version > SCHEMA_VERSION) throw new Error('Skema database (v' + version + ') lebih baru dari aplikasi ini (v' + SCHEMA_VERSION + '). Perbarui aplikasi; data tidak diubah.');
  if (version === SCHEMA_VERSION) return { from: version, to: version };
  db.exec('BEGIN IMMEDIATE');
  try {
    if (version < 1) for (const sql of DDL) db.exec(sql);
    if (version < 2) migrateV2(db);
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

/* ---------- Laporan ERP di SQL ----------
 * Semua penjumlahan uang dan HPP terkunci (snapshot) dihitung SQLite dalam SATU lintasan untuk seluruh bulan
 * (kolom uang sudah menjadi kolom sungguhan sejak skema v2). Hanya baris tanpa snapshot dikembalikan ke JS untuk
 * pencocokan modal (aturan pencocokan tetap satu-satunya di compute.worker.js).
 * Bila ada nilai yang bukan "integer Rupiah aman" (yang membuat hitungan lama melempar RangeError), hasilnya
 * {fallback:true} sehingga pemanggil memakai jalur lama dan perilakunya identik. */
const REPORT_SUMS = { om: 'gross_revenue', fv: 'fv', fs: 'fs', fa: 'fa', fx: 'fx', fp: 'fp', fr: 'fr', fk: 'fk', ft: 'ft', fee: 'platform_fee', tp: 'released_amount' };
const SUM_KEYS = Object.keys(REPORT_SUMS);
const SNAP_CTE = "WITH snap AS (SELECT j.key AS id, json_extract(j.value,'$.hs') AS hs, json_type(j.value,'$.hs') AS t FROM erp_settings s, json_each(s.payload,'$.map') j WHERE s.id='hpp_snap' AND json_type(s.payload,'$.map')='object') ";
const LOCKED = "COALESCE(sn.id IS NOT NULL AND sn.t='integer' AND ABS(sn.hs)<=" + MAX_SAFE + ",0)";
const SNAPBAD = "COALESCE(sn.id IS NOT NULL AND sn.t='real' AND sn.hs=CAST(sn.hs AS INTEGER),0)";
const GROUP_SQL = SNAP_CTE + 'SELECT substr(r.date,1,7), COUNT(*), SUM(' + LOCKED + '), SUM(CASE WHEN ' + LOCKED + ' THEN sn.hs ELSE 0 END), SUM(' + SNAPBAD + '), SUM(1-r.rpt_ok), ' +
  SUM_KEYS.map(k => 'COALESCE(SUM(r.' + REPORT_SUMS[k] + '),0)').join(', ') + ' FROM erp_marketplaces_raw r LEFT JOIN snap sn ON sn.id=r.id GROUP BY 1';
const UNLOCKED_SQL = SNAP_CTE + 'SELECT substr(r.date,1,7), r.payload FROM erp_marketplaces_raw r LEFT JOIN snap sn ON sn.id=r.id WHERE NOT ' + LOCKED + ' ORDER BY r.rowid';
const OPEX_SQL = 'SELECT substr(date,1,7), COALESCE(SUM(amount),0), SUM(1-rpt_ok) FROM erp_opex GROUP BY 1';
const num = v => { const n = typeof v === 'bigint' ? (v <= BigInt(MAX_SAFE) && v >= -BigInt(MAX_SAFE) ? Number(v) : NaN) : v; return Number.isSafeInteger(n) ? n : NaN; };
const FALLBACK = reason => ({ fallback: true, reason });

/** Satu hasil per bulan yang diminta ('' = semua periode). Satu pemindaian tabel untuk semuanya. */
export function erpReports(db, months) {
  const want = (Array.isArray(months) ? months : ['']).map(m => String(m || ''));
  try {
    const groups = new Map();
    for (const r of db.all(GROUP_SQL)) {
      const v = r.map(num);
      groups.set(String(r[0]), { count: v[1], locked: v[2], lockedHpp: v[3], bad: v[4] + v[5], sums: Object.fromEntries(SUM_KEYS.map((k, i) => [k, v[6 + i]])) });
    }
    const opex = new Map(db.all(OPEX_SQL).map(r => [String(r[0]), { amount: num(r[1]), bad: num(r[2]) }]));
    let unlocked = null;
    return want.map(month => {
      const pick = month === '' ? [...groups.values()] : (groups.has(month) ? [groups.get(month)] : []);
      const ox = month === '' ? [...opex.values()] : (opex.has(month) ? [opex.get(month)] : []);
      const out = { count: 0, locked: 0, lockedHpp: 0, sums: Object.fromEntries(SUM_KEYS.map(k => [k, 0])) };
      let bad = 0;
      for (const g of pick) { out.count += g.count; out.locked += g.locked; out.lockedHpp += g.lockedHpp; bad += g.bad; for (const k of SUM_KEYS) out.sums[k] += g.sums[k]; }
      out.ox = 0; for (const o of ox) { out.ox += o.amount; bad += o.bad; }
      const nums = [out.count, out.locked, out.lockedHpp, out.ox, ...Object.values(out.sums)];
      if (bad !== 0 || nums.some(n => !Number.isSafeInteger(n))) return FALLBACK('nilai bukan integer Rupiah aman atau melebihi batas');
      if (unlocked === null) unlocked = db.all(UNLOCKED_SQL).map(r => ({ mo: String(r[0]), payload: r[1] }));
      return { fallback: false, month, ...out, unlocked: unlocked.filter(u => month === '' || u.mo === month).map(u => JSON.parse(u.payload)) };
    });
  } catch (e) { return want.map(() => FALLBACK(String(e && e.message || e))); }
}
export const erpReport = (db, month) => erpReports(db, [month])[0];

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
        case 'erp-report': return erpReports(need(), payload.months || ['']);
        case 'apply': applyOps(need(), payload.ops); return { applied: payload.ops.length };
        case 'close': { const d = db; db = null; d?.close?.(); return {}; }
        default: throw new Error('Pesan penyimpanan tidak dikenal: ' + type);
      }
    }
  };
}
