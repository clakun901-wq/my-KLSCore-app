/* Jembatan state inti Kalsara (v9.26, tahap 5b).
 * State inti (A, rows, SALES, PRM, TS) masih hidup sebagai variabel di lingkup legacy karena kode legacy
 * (applyState, impor, promosi, dst.) menugaskan ulang variabel itu secara langsung. Modul tab yang sudah
 * dipisah tidak boleh menyimpan salinan atau daftar getter sendiri: mereka membaca dan menulis lewat objek ini,
 * sehingga SELALU melihat nilai terbaru (mis. setelah restore backup mengganti SALES utuh).
 * Setiap kunci diikat ke pasangan {get, set} dari lingkup legacy. Nanti, bila seluruh kode legacy sudah pindah,
 * ikatan ini diganti penyimpanan milik modul ini tanpa mengubah pemanggilnya. */
export const STATE_KEYS = Object.freeze(['A', 'rows', 'SALES', 'PRM', 'TS']);

/* Pemeriksa bentuk: menangkap salah tugas (mis. SALES = null) di titik penulisan, bukan jauh di render. */
const CHECKS = {
  A: v => v !== null && typeof v === 'object' && !Array.isArray(v),
  rows: Array.isArray,
  SALES: Array.isArray,
  PRM: Array.isArray,
  TS: v => typeof v === 'number' && Number.isFinite(v)
};
const EXPECT = { A: 'objek', rows: 'array', SALES: 'array', PRM: 'array', TS: 'angka terhingga' };

export function createState(bindings) {
  if (!bindings || typeof bindings !== 'object') throw new TypeError('createState: bindings wajib berupa objek');
  const store = {};
  for (const key of STATE_KEYS) {
    const b = bindings[key];
    if (!b || typeof b.get !== 'function' || typeof b.set !== 'function') {
      throw new TypeError('createState: ikatan "' + key + '" harus punya get dan set');
    }
    Object.defineProperty(store, key, {
      enumerable: true,
      get() { return b.get(); },
      set(value) {
        if (!CHECKS[key](value)) throw new TypeError('State.' + key + ' harus ' + EXPECT[key]);
        b.set(value);
      }
    });
  }
  const api = {
    /* Salinan dangkal keadaan saat ini: kunci -> nilai terbaru. Bukan tampilan hidup. */
    snapshot() { const o = {}; for (const key of STATE_KEYS) o[key] = store[key]; return o; },
    get(key) { if (!STATE_KEYS.includes(key)) throw new RangeError('State: kunci tidak dikenal "' + key + '"'); return store[key]; },
    set(key, value) { if (!STATE_KEYS.includes(key)) throw new RangeError('State: kunci tidak dikenal "' + key + '"'); store[key] = value; }
  };
  for (const name of Object.keys(api)) Object.defineProperty(store, name, { value: api[name], enumerable: false });
  return Object.preventExtensions(store);
}
