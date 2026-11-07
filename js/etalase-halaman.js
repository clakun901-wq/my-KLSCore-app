/* v9.48 (Tahap 9B): pembagian halaman Etalase + penanda "data berubah".
 *
 * Etalase menghasilkan SELURUH daftar model kartu (shop() di js/etalase-view.js tidak diubah, tetap identik
 * dengan teks legacy yang dijaga tes). Modul ini berdiri di antara shop() dan perender kartu (KShelf):
 *   1. daftar model lengkap (semua produk live, sudah disaring dan diurutkan oleh shop()) disimpan utuh;
 *   2. hanya potongan halaman aktif (default 50 kartu) yang diteruskan ke perender, jadi elemen DOM yang
 *      dibuat dan di-layout hanya sebanyak itu;
 *   3. pindah halaman memotong ulang daftar yang sudah ada, tanpa menghitung ulang 1.000 produk.
 * Pembagian halaman HANYA untuk tampilan. Data, urutan, hitungan, ekspor, dan penyimpanan tidak tersentuh.
 *
 * Penanda "data berubah" (gate): perpindahan ke tab Etalase hanya memanggil shop() bila ada yang berubah
 * sejak render terakhir (State.TS berubah lewat persist(), rows/A/PRM diganti utuh saat pemulihan, ada kunci
 * stok yang masih terbuka, atau lebih dari 60 detik karena status promo bergantung pada waktu).
 * Pemanggilan shop() dari tempat lain (upd, gembok, stok) tetap selalu dirender seperti sebelumnya.
 */
export const UKURAN_HALAMAN = 50;
export const TTL_MS = 60000;

export function ukuranDariAlamat(search) {
  const v = Number(new URLSearchParams(search || '').get('hal'));
  return Number.isInteger(v) && v >= 10 && v <= 200 ? v : UKURAN_HALAMAN;
}

/* Murni (bisa diuji di Node): potong daftar item Etalase per halaman.
 * item: {kind:'heading'|'card'|'empty', ...}. Judul grup yang mendahului kartu ikut tampil di awal potongan. */
export function potongHalaman(items, page, size) {
  const cards = []; let head = null;
  for (const it of items) {
    if (it.kind === 'heading') head = it;
    else if (it.kind === 'card') cards.push({ it, head });
    else return { out: items, page: 0, pages: 1, total: 0, from: 0, to: 0 };
  }
  const total = cards.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(0, Number.isFinite(page) ? Math.trunc(page) : 0), pages - 1);
  if (pages === 1) return { out: items, page: 0, pages: 1, total, from: total ? 1 : 0, to: total };
  const slice = cards.slice(p * size, (p + 1) * size), out = []; let last = null;
  for (const c of slice) {
    if (c.head && c.head !== last) { out.push(c.head); last = c.head; }
    out.push(c.it);
  }
  return { out, page: p, pages, total, from: p * size + 1, to: p * size + slice.length };
}

export function installEtalaseHalaman({ global = globalThis, doc = globalThis.document, size = UKURAN_HALAMAN, now = () => Date.now(), getKey } = {}) {
  const real = global.KShelf;
  if (!real) return null;
  const st = { items: [], page: 0, container: null, unlocked: false, key: null, at: 0, rendered: false, skipped: 0, ran: 0 };
  const pagers = [];

  function keyNow() { return getKey ? getKey() : []; }
  function sameKey(a, b) { return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]); }
  function makePager(id) {
    const nav = doc && doc.getElementById(id);
    if (!nav) return null;
    const prev = doc.createElement('button'), next = doc.createElement('button'), inp = doc.createElement('input'), info = doc.createElement('span'), of = doc.createElement('span');
    prev.type = next.type = 'button';
    prev.textContent = '\u2039 Sebelumnya'; next.textContent = 'Berikutnya \u203a';
    prev.setAttribute('aria-label', 'Halaman sebelumnya'); next.setAttribute('aria-label', 'Halaman berikutnya');
    inp.type = 'number'; inp.min = '1'; inp.step = '1'; inp.inputMode = 'numeric'; inp.setAttribute('aria-label', 'Loncat ke halaman');
    info.className = 'pgi'; info.setAttribute('aria-live', 'polite');
    nav.className = 'pgn'; nav.hidden = true;
    const mid = doc.createElement('span'); mid.className = 'pgm';
    mid.append(doc.createTextNode('Hal. '), inp, of);
    nav.append(prev, mid, next, info);
    prev.onclick = () => go(st.page - 1);
    next.onclick = () => go(st.page + 1);
    const jump = () => { const v = parseInt(inp.value, 10); if (Number.isFinite(v)) go(v - 1); else inp.value = String(st.page + 1); };
    inp.onchange = jump;
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); jump(); } };
    return { nav, prev, next, inp, info, of };
  }
  function drawPagers(r) {
    for (const p of pagers) {
      p.nav.hidden = r.pages <= 1;
      if (r.pages <= 1) continue;
      p.prev.disabled = r.page <= 0; p.next.disabled = r.page >= r.pages - 1;
      p.inp.max = String(r.pages); p.inp.value = String(r.page + 1);
      p.of.textContent = ' dari ' + r.pages.toLocaleString('id-ID');
      p.info.textContent = 'Produk ' + r.from.toLocaleString('id-ID') + '\u2013' + r.to.toLocaleString('id-ID') + ' dari ' + r.total.toLocaleString('id-ID');
    }
  }
  function draw() {
    const r = potongHalaman(st.items, st.page, size);
    st.page = r.page;
    real.renderShelf(st.container, r.out);
    drawPagers(r);
    return r;
  }
  function go(n) {
    if (!st.container) return;
    const r0 = potongHalaman(st.items, n, size);
    if (r0.page === st.page) { drawPagers(r0); return; }
    st.page = r0.page; draw();
    try { global.scrollTo && global.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) {}
  }

  pagers.push(...['shpt', 'shpg'].map(makePager).filter(Boolean));

  const proxy = Object.freeze({
    renderShelf(container, items) {
      st.container = container; st.items = items;
      st.unlocked = items.some(i => i.kind === 'card' && i.model && i.model.stock && i.model.stock.unlocked);
      st.key = keyNow(); st.at = now(); st.rendered = true; st.ran++;
      return draw();
    },
    anyCardEditing: real.anyCardEditing
  });
  global.KShelf = proxy;

  return {
    size, state: st, go, draw,
    /* Bungkus pemanggil shop() milik perpindahan tab: lewati bila tidak ada yang berubah. */
    gate(fn) {
      return function () {
        if (st.rendered && !st.unlocked && sameKey(st.key, keyNow()) && now() - st.at < TTL_MS) { st.skipped++; return undefined; }
        return fn.apply(this, arguments);
      };
    },
    /* v9.49: upd() dari tab Hitung tidak perlu membangun 1.000 model Etalase yang sedang tersembunyi.
     * Cukup tandai "kotor"; perpindahan ke Etalase lewat gate() lalu merender ulang. */
    tandaiKotor() { st.rendered = false; },
    stats() { return { rendered: st.ran, skipped: st.skipped, page: st.page + 1, size }; }
  };
}
