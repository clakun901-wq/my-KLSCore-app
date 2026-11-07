/* Proxy ke Worker SQLite. `workerFactory` mengembalikan objek bergaya Worker
 * (postMessage/onmessage/onerror/terminate), sehingga tes dapat memakai Worker palsu. */
const REQUEST_TIMEOUT_MS = 60_000;

export function createSqliteBackend(workerFactory, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  let worker = null, seq = 0, dead = null;
  const pending = new Map();

  function settleAll(error) {
    for (const [id, p] of pending) { clearTimeout(p.timer); p.reject(error); pending.delete(id); }
  }
  function fail(error) {
    dead = error;
    const old = worker; worker = null;
    if (old) { old.onmessage = null; old.onerror = null; try { old.terminate(); } catch {} }
    settleAll(error);
  }
  function ensure() {
    if (dead) throw dead;
    if (worker) return worker;
    const instance = workerFactory();
    instance.onmessage = ({ data }) => {
      const p = pending.get(data?.id);
      if (!p) return;
      pending.delete(data.id); clearTimeout(p.timer);
      if (data.ok) p.resolve(data.result);
      else { const err = new Error(data.error || 'Operasi SQLite gagal'); if (data.code) err.code = data.code; p.reject(err); }
    };
    instance.onerror = event => fail(new Error(event?.message || 'Worker SQLite gagal dijalankan'));
    worker = instance;
    return instance;
  }

  return {
    request(type, payload) {
      return new Promise((resolve, reject) => {
        let instance;
        try { instance = ensure(); } catch (e) { reject(e); return; }
        const id = ++seq;
        const timer = setTimeout(() => {
          if (!pending.has(id)) return;
          pending.delete(id);
          const err = new Error('Operasi SQLite melewati batas waktu: ' + type);
          err.code = 'timeout';
          reject(err);
          // Worker yang macet tidak boleh dipakai lagi; operasi berikutnya gagal eksplisit, bukan menggantung.
          fail(err);
        }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        try { instance.postMessage({ id, type, payload }); }
        catch (e) { pending.delete(id); clearTimeout(timer); reject(e); }
      });
    },
    terminate() { fail(new Error('Worker SQLite dihentikan')); }
  };
}
