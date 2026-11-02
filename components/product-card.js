/* <kalsara-product-card> — kartu produk Etalase sebagai Native Web Component.
   - Shadow DOM: gaya kartu terisolasi dari CSS halaman (variabel tema --card, --ink, dst tetap diwarisi).
   - Signals: seluruh tampilan adalah fungsi dari satu signal `model` (objek biasa). Mengisi `card.model = {...}`
     hanya memperbarui node yang berubah; tidak ada innerHTML, semua node dibuat dengan DOM API + textContent.
   - Interaksi keluar lewat CustomEvent (bubbles + composed): kls-open, kls-lock, kls-step, kls-stock, kls-voucher, kls-go.

   Bentuk model:
   { index, name, rawName, chips:[{kind:'a'|'u', text}],
     price: {kind:'empty'} | {kind:'error', message, goTarget?, goLabel?, plain?:true}
          | {kind:'priced', main, strike?, pct?, label, actual?:bool, notes:[[{text, tone?:'ok'|'bad', bold?:bool}]], warn?:{text, bad?:bool}},
     voucher: null | {checked, remaining},
     stock: {value, label, tone:''|'low'|'bad', unlocked:bool} } */
import {signal, effect} from '../js/signals.js';

const CARD_CSS = `
:host{display:block;margin-bottom:10px;content-visibility:auto;contain-intrinsic-size:auto 190px}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
[hidden]{display:none!important}
.si{background:var(--card);border-radius:24px;box-shadow:var(--sh);padding:14px 16px;border:1px solid var(--line);cursor:pointer;transition:box-shadow .2s,transform .14s,border-color .2s;font-variant-numeric:tabular-nums}
.si:active{transform:scale(.985)}
button{font:inherit;touch-action:manipulation}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.snb{display:block;width:100%;text-align:left;background:none;border:0;padding:0;font-weight:700;font-size:16px;color:var(--ink);margin-bottom:6px;word-break:break-word;transition:background-color .16s,color .16s,transform .14s cubic-bezier(.3,1.3,.5,1),box-shadow .16s,opacity .16s}
.snb::after{content:" \\203A";color:var(--mute)}
.snb:focus-visible{border-radius:8px}
.pcs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}
.pch{font-size:12px;font-weight:700;border-radius:999px;padding:3px 10px;background:var(--soft)}
.pch.a{background:color-mix(in srgb,var(--ok) 15%,var(--card));color:var(--ok)}
.pch.u{background:var(--warnbg);color:var(--warn)}
.spr{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.spr b{font-size:24px;font-weight:800;letter-spacing:-.3px}
.spr s{color:var(--mute);font-size:14px}
.spr em,.sl em{font-style:normal;font-size:12px;font-weight:700;background:var(--badbg);color:var(--bad);border-radius:999px;padding:2px 8px}
.sl.low em{background:var(--warnbg);color:var(--warn)}
.etl{font-size:11px;font-weight:700;border-radius:999px;padding:2px 8px;color:var(--mute);background:color-mix(in srgb,var(--mute) 14%,var(--card))}
.etl.a{color:var(--ok);background:color-mix(in srgb,var(--ok) 13%,var(--card))}
.stk{font-size:12.5px;color:var(--mute);margin:4px 0 0}
.tok{color:var(--ok)}.tbad{color:var(--bad)}
.etr{margin:8px 0 0}
.etw{display:inline-block;font-size:12px;font-weight:700;border-radius:999px;padding:4px 10px;background:var(--warnbg);color:var(--warn)}
.etw.bad{background:var(--badbg);color:var(--bad)}
.empty{color:var(--mute);font-size:13px;text-align:left;padding:6px 0}
.wn{border-radius:16px;padding:8px 10px;margin-top:8px;font-size:13px;line-height:1.4;background:var(--badbg);color:var(--bad);border:1px solid color-mix(in srgb,var(--bad) 25%,transparent)}
.lk{background:none;border:0;color:var(--accent);font-size:12.5px;font-weight:600;padding:4px 0 4px 6px;min-height:32px;text-decoration:underline}
.vuse{display:flex;align-items:center;gap:8px;margin:6px 2px 2px;font-size:12.5px;color:var(--mute);cursor:pointer}
.vuse input{width:18px;height:18px;min-height:0;padding:0;margin:0;flex:none}
.sst{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
.sl{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--mute);font-weight:600}
.lkb{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--ink);cursor:pointer;flex:0 0 40px}
.lkb.on{background:var(--accent);border-color:var(--accent);color:var(--onacc)}
.stp{display:flex;align-items:center;gap:6px}
.stp button{flex:0 0 46px;height:46px;border:0;border-radius:16px;background:var(--soft);color:var(--ink);font-size:24px;font-weight:700;line-height:1;padding:0;transition:background-color .16s,color .16s,transform .14s cubic-bezier(.3,1.3,.5,1),box-shadow .16s,opacity .16s}
.stp button:active{transform:scale(.94)}
.stp button.lkd{opacity:.4}
.stp input{font:inherit;font-size:17px;font-weight:800;color:var(--ink);background:var(--inp);border:1px solid var(--inpl);border-radius:14px;padding:0 12px;height:46px;width:92px;min-width:0;text-align:center;caret-color:var(--accent);font-variant-numeric:tabular-nums}
.stp input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
.stp input[readonly]{opacity:.75}
`;

let sheet = null;
function adoptStyles(root) {
  try {
    if (!sheet) { sheet = new CSSStyleSheet(); sheet.replaceSync(CARD_CSS); }
    root.adoptedStyleSheets = [sheet];
  } catch {
    const style = document.createElement('style');
    style.textContent = CARD_CSS;
    root.append(style);
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function lockIcon(open) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({viewBox: '0 0 24 24', width: '18', height: '18', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})) svg.setAttribute(k, v);
  const rect = document.createElementNS(SVG_NS, 'rect');
  for (const [k, v] of Object.entries({x: '5', y: '11', width: '14', height: '9', rx: '2'})) rect.setAttribute(k, v);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', open ? 'M8 11V8a4 4 0 0 1 7.5-1.5' : 'M8 11V8a4 4 0 0 1 8 0v3');
  svg.append(rect, path);
  return svg;
}
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

class KalsaraProductCard extends HTMLElement {
  #model = signal(null);
  #dispose = null;
  #ref = {};

  constructor() { super(); this.attachShadow({mode: 'open'}); }

  get model() { return this.#model.peek(); }
  set model(value) { this.#model.value = value; }
  /* true bila input stok sedang difokuskan (jangan ganti isinya saat pengguna mengetik) */
  isEditing() { const a = this.shadowRoot.activeElement; return !!a && a.tagName === 'INPUT' && a.type !== 'checkbox'; }

  connectedCallback() {
    if (!this.#ref.root) this.#build();
    if (!this.#dispose) this.#dispose = effect(() => this.#render(this.#model.value));
  }
  disconnectedCallback() { if (this.#dispose) { this.#dispose(); this.#dispose = null; } }

  #emit(name, detail) { this.dispatchEvent(new CustomEvent(name, {detail, bubbles: true, composed: true})); }

  #build() {
    const r = this.#ref, root = this.shadowRoot;
    adoptStyles(root);
    r.root = el('div', 'si');
    r.name = el('button', 'snb'); r.name.type = 'button';
    r.chips = el('div', 'pcs');
    r.price = el('div', 'price');
    r.voucherLabel = el('label', 'vuse');
    r.voucherBox = document.createElement('input'); r.voucherBox.type = 'checkbox';
    r.voucherText = document.createTextNode('');
    r.voucherLabel.append(r.voucherBox, r.voucherText);
    r.sst = el('div', 'sst');
    r.sl = el('span', 'sl');
    r.lock = el('button', 'lkb'); r.lock.type = 'button';
    r.stockLabel = document.createTextNode('Stok');
    r.badge = el('em');
    r.sl.append(r.lock, r.stockLabel, r.badge);
    const stp = el('div', 'stp');
    r.minus = el('button', '', '\u2212'); r.minus.type = 'button'; r.minus.setAttribute('aria-label', 'Kurangi stok');
    r.input = document.createElement('input');
    r.input.setAttribute('inputmode', 'numeric'); r.input.placeholder = 'Isi stok';
    r.plus = el('button', '', '+'); r.plus.type = 'button'; r.plus.setAttribute('aria-label', 'Tambah stok');
    stp.append(r.minus, r.input, r.plus);
    r.sst.append(r.sl, stp);
    r.root.append(r.name, r.chips, r.price, r.voucherLabel, r.sst);
    root.append(r.root);

    r.lock.addEventListener('click', () => this.#emit('kls-lock', {index: this.model.index}));
    r.minus.addEventListener('click', () => this.#emit('kls-step', {index: this.model.index, delta: -1}));
    r.plus.addEventListener('click', () => this.#emit('kls-step', {index: this.model.index, delta: 1}));
    r.input.addEventListener('change', () => this.#emit('kls-stock', {index: this.model.index, value: r.input.value, blur: () => r.input.blur()}));
    r.voucherBox.addEventListener('change', () => this.#emit('kls-voucher', {index: this.model.index, checked: r.voucherBox.checked}));
    r.root.addEventListener('click', event => {
      const path = event.composedPath();
      if (path.some(n => n === r.lock || n === r.minus || n === r.plus || n === r.input || n === r.voucherLabel || (n.classList && n.classList.contains('lk')))) return;
      this.#emit('kls-open', {index: this.model.index});
    });
    r.price.addEventListener('click', event => {
      const btn = event.composedPath().find(n => n.classList && n.classList.contains('lk'));
      if (btn && btn.dataset.go) this.#emit('kls-go', {target: btn.dataset.go});
    });
  }

  #render(m) {
    const r = this.#ref;
    if (!m) return;
    r.name.textContent = m.name;
    r.name.setAttribute('aria-label', 'Buka ' + (m.rawName || 'produk') + ' di tab Hitung');

    r.chips.replaceChildren(...(m.chips || []).map(c => el('span', 'pch ' + c.kind, c.text)));
    r.chips.hidden = !(m.chips && m.chips.length);

    r.price.replaceChildren(...this.#priceNodes(m.price));

    r.voucherLabel.hidden = !m.voucher;
    if (m.voucher) {
      r.voucherBox.checked = !!m.voucher.checked;
      r.voucherText.nodeValue = ' Pesanan berikutnya pakai voucher (sisa kuota ' + m.voucher.remaining + ')';
    }

    const s = m.stock;
    r.sl.className = 'sl' + (s.tone ? ' ' + s.tone : '');
    r.badge.textContent = s.label || '';
    r.badge.hidden = !s.label;
    r.lock.className = 'lkb' + (s.unlocked ? ' on' : '');
    r.lock.setAttribute('aria-pressed', String(s.unlocked));
    r.lock.setAttribute('aria-label', s.unlocked ? 'Kunci stok' : 'Buka kunci stok');
    r.lock.replaceChildren(lockIcon(s.unlocked));
    for (const b of [r.minus, r.plus]) {
      b.className = s.unlocked ? '' : 'lkd';
      if (s.unlocked) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true');
    }
    r.input.setAttribute('aria-label', 'Stok ' + (m.rawName || 'produk'));
    if (this.shadowRoot.activeElement !== r.input) r.input.value = s.value;
    r.input.readOnly = !s.unlocked;
  }

  #priceNodes(p) {
    if (!p || p.kind === 'empty') return [el('div', 'empty', 'Harga belum dihitung. Isi modal di tab Hitung.')];
    if (p.kind === 'error') {
      if (p.plain) return [el('div', 'empty', p.message)];
      const box = el('div', 'wn', '\u26a0 ' + p.message);
      if (p.goLabel) { const b = el('button', 'lk', p.goLabel); b.type = 'button'; b.dataset.go = p.goTarget; box.append(' ', b); }
      return [box];
    }
    const out = [];
    const spr = el('div', 'spr');
    spr.append(el('b', '', p.main));
    if (p.strike) { spr.append(el('s', '', p.strike)); spr.append(el('em', '', p.pct)); }
    spr.append(el('span', 'etl' + (p.actual ? ' a' : ''), p.label));
    out.push(spr);
    for (const line of p.notes || []) {
      const d = el('div', 'stk');
      for (const seg of line) {
        const node = seg.bold || seg.tone ? el('b', seg.tone === 'bad' ? 'tbad' : seg.tone === 'ok' ? 'tok' : '', seg.text) : document.createTextNode(seg.text);
        d.append(node);
      }
      out.push(d);
    }
    if (p.warn) { const w = el('div', 'etr'); w.append(el('span', 'etw' + (p.warn.bad ? ' bad' : ''), p.warn.text)); out.push(w); }
    return out;
  }
}
if (!customElements.get('kalsara-product-card')) customElements.define('kalsara-product-card', KalsaraProductCard);

/* Rekonsiliasi daftar Etalase berkunci id: elemen dipakai ulang, hanya model-nya yang diganti. */
export function renderShelf(container, items) {
  const existing = new Map();
  for (const child of [...container.children]) if (child.dataset && child.dataset.key) existing.set(child.dataset.key, child);
  const wanted = [];
  for (const item of items) {
    let node = existing.get(item.key);
    if (node && node.dataset.kind !== item.kind) node = null;
    if (!node) {
      node = item.kind === 'card' ? document.createElement('kalsara-product-card') : el(item.kind === 'heading' ? 'h3' : 'div');
      node.dataset.key = item.key; node.dataset.kind = item.kind;
    }
    if (item.kind === 'card') {
      const sig = JSON.stringify(item.model); // lewati kartu yang datanya tidak berubah
      if (node._sig !== sig) { node._sig = sig; node.model = item.model; }
    }
    else if (item.kind === 'heading') node.textContent = item.text;
    else { node.className = 'si'; node.replaceChildren(el('div', 'empty', item.text)); }
    wanted.push(node);
    existing.delete(item.key);
  }
  for (const child of [...container.children]) if (!wanted.includes(child)) child.remove();
  let cursor = container.firstElementChild;
  for (const node of wanted) {
    if (node === cursor) cursor = cursor.nextElementSibling;
    else container.insertBefore(node, cursor);
  }
}
export function anyCardEditing(container) {
  return [...container.querySelectorAll('kalsara-product-card')].some(c => c.isEditing());
}

/* legacy-app.js bukan modul ES; ia mengakses perender lewat global ini. */
globalThis.KShelf = Object.freeze({renderShelf, anyCardEditing});
