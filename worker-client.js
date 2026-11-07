/* Lazy Worker bridge: an unsupported/broken Worker must not prevent the legacy UI
   from booting. Each request has a timeout so callers can surface a recoverable
   error instead of leaving an import/calculation permanently pending. */
let worker = null;
let seq = 0;
const pending = new Map();
const REQUEST_TIMEOUT_MS = 60_000;

function settleAll(error) {
  for (const [id, p] of pending) {
    clearTimeout(p.timer);
    p.reject(error);
    pending.delete(id);
  }
}
function resetWorker(error) {
  const old = worker;
  worker = null;
  if (old) {
    old.onmessage = null;
    old.onerror = null;
    try { old.terminate(); } catch {}
  }
  settleAll(error);
}
function ensureWorker() {
  if (worker) return worker;
  if (typeof Worker !== 'function') throw new Error('Browser ini tidak mendukung Web Worker. Muat ulang di browser modern.');
  const instance = new Worker(new URL('../workers/compute.worker.js', import.meta.url), {type:'module'});
  instance.onmessage = ({data}) => {
    const p = pending.get(data?.id);
    if (!p) return;
    pending.delete(data.id);
    clearTimeout(p.timer);
    if (data.ok) p.resolve(data.result);
    else p.reject(new Error(data.error || 'Operasi Worker gagal'));
  };
  instance.onerror = event => resetWorker(new Error(event.message || 'Worker Kalsara gagal dijalankan'));
  worker = instance;
  return instance;
}

export function compute(type, payload, transfer = []) {
  return new Promise((resolve, reject) => {
    let instance;
    try { instance = ensureWorker(); }
    catch (error) { reject(error); return; }
    const id = ++seq;
    const timer = setTimeout(() => {
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      p.reject(new Error('Operasi Worker melewati batas waktu 60 detik: ' + type));
      // A timed-out synchronous task can block this worker; replace it for future work.
      resetWorker(new Error('Worker Kalsara direset setelah batas waktu'));
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, {resolve, reject, timer});
    try { instance.postMessage({id, type, payload}, transfer); }
    catch (error) {
      pending.delete(id);
      clearTimeout(timer);
      reject(error);
      if (error?.name === 'DataCloneError') return;
      resetWorker(error);
    }
  });
}
