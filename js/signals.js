/* Signals: memakai @preact/signals-core dari CDN bila tersedia (batas tunggu 2,5 detik agar boot
   tidak tertahan), dan jatuh ke implementasi lokal dengan API sama (signal/computed/effect/batch)
   yang melacak dependensi secara otomatis. Mode luring tetap reaktif sepenuhnya. */
const CDN = 'https://cdn.jsdelivr.net/npm/@preact/signals-core@1.8.0/+esm';

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

async function loadCore() {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('CDN timeout')), 2500));
    const core = await Promise.race([import(CDN), timeout]);
    if (core && core.signal && core.effect) return {core, source: 'cdn'};
  } catch (error) { console.warn('Signals CDN belum tersedia; memakai mesin reaktif lokal.', error && error.message); }
  return {core: createLocalSignals(), source: 'local'};
}

const loaded = await loadCore();
const core = loaded.core;
export const signalsSource = loaded.source;
export const {signal, computed, effect} = core;
export const batch = core.batch || (fn => fn());
export const appRevision = signal(0);
export const activeView = signal(0);
export const appReady = computed(() => appRevision.value >= 0);
export function touchState() { appRevision.value++; }
