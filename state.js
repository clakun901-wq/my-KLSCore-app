/* Penyimpanan resmi state inti Kalsara.
 * Nilai disimpan di modul ini, bukan dipinjam dari variabel app-core.js.
 * Getter properti membuat setiap modul selalu membaca nilai terbaru setelah restore/reset. */
export const STATE_KEYS = Object.freeze(['A', 'rows', 'SALES', 'PRM', 'TS']);
const CHECKS = {
  A: v => v !== null && typeof v === 'object' && !Array.isArray(v),
  rows: Array.isArray,
  SALES: Array.isArray,
  PRM: Array.isArray,
  TS: v => typeof v === 'number' && Number.isFinite(v)
};
const EXPECT = { A: 'objek', rows: 'array', SALES: 'array', PRM: 'array', TS: 'angka terhingga' };

export function createState(initial = {}) {
  if (!initial || typeof initial !== 'object' || Array.isArray(initial)) throw new TypeError('createState: nilai awal wajib berupa objek');
  const values = {
    A: initial.A === undefined ? {} : initial.A,
    rows: initial.rows === undefined ? [] : initial.rows,
    SALES: initial.SALES === undefined ? [] : initial.SALES,
    PRM: Object.prototype.hasOwnProperty.call(initial, 'PRM') ? initial.PRM : undefined,
    TS: initial.TS === undefined ? 0 : initial.TS
  };
  for (const key of STATE_KEYS) if (!(key === 'PRM' && values[key] === undefined) && !CHECKS[key](values[key])) throw new TypeError('State.' + key + ' harus ' + EXPECT[key]);
  const store = {};
  for (const key of STATE_KEYS) Object.defineProperty(store, key, {
    enumerable: true,
    get() { return values[key]; },
    set(value) {
      if (!CHECKS[key](value)) throw new TypeError('State.' + key + ' harus ' + EXPECT[key]);
      values[key] = value;
    }
  });
  const api = {
    snapshot() { const out = {}; for (const key of STATE_KEYS) out[key] = values[key]; return out; },
    get(key) { if (!STATE_KEYS.includes(key)) throw new RangeError('State: kunci tidak dikenal "' + key + '"'); return store[key]; },
    set(key, value) { if (!STATE_KEYS.includes(key)) throw new RangeError('State: kunci tidak dikenal "' + key + '"'); store[key] = value; }
  };
  for (const name of Object.keys(api)) Object.defineProperty(store, name, { value: api[name], enumerable: false });
  return Object.preventExtensions(store);
}

export const State = createState();
