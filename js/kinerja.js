/* v9.48 (Tahap 9A): pengukur kinerja Kalsara. Tujuan: tahu SEBELUM mengoptimasi di mana waktu habis,
 * berdasarkan angka dari perangkat nyata (HP/laptop pemilik), bukan tebakan.
 *
 * Aktif hanya bila alamat memuat ?perf=1 (atau KStore 'kalsara_perf' = '1'). Saat tidak aktif, t() mengembalikan
 * fungsi aslinya (nol beban) dan tidak ada pengamat yang dipasang. Tidak mengubah data, rumus, atau tampilan
 * selain tombol kecil "Kinerja" di pojok kiri bawah saat aktif.
 *
 * Yang diukur:
 *  - waktu sinkron tiap fungsi yang dibungkus t(nama, fn): jumlah panggilan, total, rata-rata, terlama, terakhir;
 *  - tiap perpindahan tab: waktu sinkron (JavaScript selesai) dan waktu sampai tampilan sempat digambar
 *    (dua requestAnimationFrame + timeout 0) = perkiraan "terasa lambat" bagi pengguna;
 *  - tugas panjang (long task > 50 ms) lewat PerformanceObserver: jumlah, total, terlama;
 *  - jumlah elemen DOM: seluruh dokumen, kartu Etalase, kartu Hitung;
 *  - lingkungan: UA, jumlah inti CPU, memori perangkat, jumlah produk.
 */
export function createKinerja({ global = globalThis, doc = globalThis.document, enabled, getRowsCount, now } = {}) {
  const clock = now || (() => (global.performance ? global.performance.now() : Date.now()));
  const on = !!enabled;
  const fn = Object.create(null);
  const tabs = [];
  const lt = { n: 0, total: 0, max: 0 };
  function rec(name, ms) {
    const f = fn[name] || (fn[name] = { n: 0, total: 0, max: 0, last: 0 });
    f.n++; f.total += ms; f.last = ms; if (ms > f.max) f.max = ms;
  }
  function t(name, f) {
    if (!on || typeof f !== 'function') return f;
    const w = function () { const a = clock(); try { return f.apply(this, arguments); } finally { rec(name, clock() - a); } };
    return w;
  }
  function tabWrap(inner) {
    if (!on) return inner;
    return function (i) {
      const a = clock(); let r;
      try { r = inner.apply(this, arguments); } finally {
        const sync = clock() - a, row = { tab: i, sync: +sync.toFixed(1), paint: null };
        tabs.push(row); if (tabs.length > 200) tabs.shift();
        rec('tab(' + i + ')', sync);
        const raf = global.requestAnimationFrame || (cb => setTimeout(cb, 16));
        raf(() => raf(() => setTimeout(() => { row.paint = +(clock() - a).toFixed(1); }, 0)));
      }
      return r;
    };
  }
  if (on && global.PerformanceObserver) {
    try {
      new global.PerformanceObserver(list => { for (const e of list.getEntries()) { lt.n++; lt.total += e.duration; if (e.duration > lt.max) lt.max = e.duration; } }).observe({ type: 'longtask', buffered: true });
    } catch (e) { /* longtask tidak didukung di peramban ini */ }
  }
  const q = (sel) => { try { return doc.querySelectorAll(sel).length; } catch (e) { return -1; } };
  function dom() { return { semua: q('*'), kartuEtalase: q('#shl kalsara-product-card'), kartuHitung: q('#list > *') }; }
  function reset() { for (const k of Object.keys(fn)) delete fn[k]; tabs.length = 0; lt.n = 0; lt.total = 0; lt.max = 0; }
  function report() {
    const r = (x) => +x.toFixed(1), out = { dibuat: new Date().toISOString(), produk: getRowsCount ? getRowsCount() : null, dom: dom(), tabs: tabs.slice(-40), fungsi: {}, tugasPanjang: { jumlah: lt.n, total: r(lt.total), terlama: r(lt.max) },
      lingkungan: { ua: global.navigator ? global.navigator.userAgent : '', inti: global.navigator && global.navigator.hardwareConcurrency, memoriGB: global.navigator && global.navigator.deviceMemory } };
    for (const k of Object.keys(fn)) { const f = fn[k]; out.fungsi[k] = { n: f.n, total: r(f.total), rata: r(f.total / f.n), terlama: r(f.max), terakhir: r(f.last) }; }
    return out;
  }
  function panel() {
    if (!on || !doc || !doc.body) return;
    const btn = doc.createElement('button'), box = doc.createElement('div'), pre = doc.createElement('pre'), copy = doc.createElement('button'), clr = doc.createElement('button');
    btn.type = copy.type = clr.type = 'button'; btn.textContent = 'Kinerja';
    btn.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;padding:6px 10px;border-radius:8px;border:1px solid #888;background:#fff;color:#000;font:12px system-ui';
    box.hidden = true;
    box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:44px;max-height:60vh;overflow:auto;z-index:99999;background:#fff;color:#000;border:1px solid #888;border-radius:8px;padding:8px;font:11px/1.4 monospace';
    copy.textContent = 'Salin laporan'; clr.textContent = 'Kosongkan';
    const refresh = () => { pre.textContent = JSON.stringify(report(), null, 1); };
    btn.onclick = () => { box.hidden = !box.hidden; if (!box.hidden) refresh(); };
    clr.onclick = () => { reset(); refresh(); };
    copy.onclick = () => {
      const text = JSON.stringify(report(), null, 1);
      const manual = () => { const ta = doc.createElement('textarea'); ta.value = text; ta.style.cssText = 'width:100%;height:120px'; box.append(ta); ta.select(); };
      try { global.navigator.clipboard.writeText(text).catch(manual); } catch (e) { manual(); }
    };
    box.append(copy, clr, pre); doc.body.append(btn, box);
  }
  const api = { enabled: on, t, tabWrap, report, reset, panel, rec };
  if (on) { global.KPerf = api; if (doc && doc.readyState !== 'loading') panel(); else if (doc) doc.addEventListener('DOMContentLoaded', panel); }
  return api;
}
export function kinerjaAktif(search, storeGet) {
  try { if (new URLSearchParams(search || '').get('perf') === '1') return true; } catch (e) {}
  try { return !!storeGet && storeGet('kalsara_perf') === '1'; } catch (e) { return false; }
}
