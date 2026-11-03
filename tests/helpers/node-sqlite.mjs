/* Pembantu tes: SQLite sungguhan lewat node:sqlite + Worker palsu yang menjalankan layanan penyimpanan di proses yang sama.
   Hanya untuk tes; tidak ikut dipakai aplikasi. */
import { DatabaseSync } from 'node:sqlite';

export function openNodeDb(path = ':memory:') {
  const d = new DatabaseSync(path);
  return {
    raw: d,
    exec: sql => { d.exec(sql); },
    run: (sql, bind = []) => { d.prepare(sql).run(...bind); },
    all: (sql, bind = []) => d.prepare(sql).all(...bind).map(r => Object.values(r)),
    close: () => d.close()
  };
}

/** Worker palsu: meniru postMessage/onmessage (dengan structuredClone seperti Worker asli). */
export function fakeWorkerFactory(service, hooks = {}) {
  return () => {
    const w = {
      onmessage: null, onerror: null, terminated: false,
      postMessage(msg) {
        const m = structuredClone(msg);
        queueMicrotask(async () => {
          try {
            if (hooks.before) await hooks.before(m);
            const result = await service.handle(m.type, m.payload);
            w.onmessage?.({ data: structuredClone({ id: m.id, ok: true, result }) });
          } catch (e) { w.onmessage?.({ data: { id: m.id, ok: false, error: e.message, code: e.code } }); }
        });
      },
      terminate() { w.terminated = true; }
    };
    return w;
  };
}

/** Peniru OPFS minimal (getFileHandle/getFile/createWritable) di atas Map. */
export function fakeOpfsRoot(files) {
  return {
    async getFileHandle(name, opts) {
      if (!files.has(name) && !(opts && opts.create)) { const e = new Error('NotFoundError'); e.name = 'NotFoundError'; throw e; }
      return {
        async getFile() { const c = files.get(name) || ''; return { size: new TextEncoder().encode(c).length, async text() { return c; } }; },
        async createWritable(o = {}) {
          let content = o.keepExistingData ? (files.get(name) || '') : '';
          let cursor = o.keepExistingData ? content.length : 0;
          return {
            async seek(n) { cursor = n; },
            async write(data) { const chunk = typeof data === 'string' ? data : new TextDecoder().decode(data); content = content.slice(0, cursor) + chunk + content.slice(cursor + chunk.length); cursor += chunk.length; },
            async close() { files.set(name, content); },
            async abort() {}
          };
        }
      };
    }
  };
}
