/* Signals: mesin reaktif lokal (API sama dengan signal/computed/effect/batch milik @preact/signals-core).
   Sengaja TIDAK memuat apa pun dari internet: aturan proyek melarang CDN saat aplikasi berjalan, dan aplikasi harus
   utuh sejak pemasangan pertama tanpa internet. */

export function createLocalSignals() {
  let current = null, batchDepth = 0;
  const queue = new Set();
  const flush = () => { for (const run of [...queue]) { queue.delete(run); run(); } };
  function track(deps) { if (current) { deps.add(current); current.sources.add(deps); } }
  function notify(deps) {
    for (const sub of [...deps]) { if (sub.computed) sub.markDirty(); else queue.add(sub); }
    if (!batchDepth) flush();
  }
  const signal = initial => {
    let value = initial; const deps = new Set();
    return {
      get value() { track(deps); return value; },
      set value(v) { if (Object.is(v, value)) return; value = v; notify(deps); },
      peek() { return value; },
      subscribe(fn) { return effect(() => fn(this.value)); }
    };
  };
  function runTracked(sub, fn) {
    for (const s of sub.sources) s.delete(sub);
    sub.sources.clear();
    const prev = current; current = sub;
    try { return fn(); } finally { current = prev; }
  }
  const computed = fn => {
    const deps = new Set(); let value, dirty = true;
    const sub = {computed: true, sources: new Set(), markDirty() { if (!dirty) { dirty = true; notify(deps); } }};
    return {
      get value() { track(deps); if (dirty) { value = runTracked(sub, fn); dirty = false; } return value; },
      peek() { if (dirty) { value = runTracked(sub, fn); dirty = false; } return value; }
    };
  };
  const effect = fn => {
    let cleanup, disposed = false;
    const run = () => {
      if (disposed) return;
      if (typeof cleanup === 'function') cleanup();
      cleanup = runTracked(run, fn);
    };
    run.sources = new Set();
    run();
    return () => { disposed = true; if (typeof cleanup === 'function') cleanup(); for (const s of run.sources) s.delete(run); run.sources.clear(); };
  };
  const batch = fn => { batchDepth++; try { return fn(); } finally { if (--batchDepth === 0) flush(); } };
  return {signal, computed, effect, batch};
}

const loaded = {core: createLocalSignals(), source: 'local'};
const core = loaded.core;
export const signalsSource = loaded.source;
export const {signal, computed, effect} = core;
export const batch = core.batch || (fn => fn());
export const appRevision = signal(0);
export const activeView = signal(0);
export const appReady = computed(() => appRevision.value >= 0);
export function touchState() { appRevision.value++; }
