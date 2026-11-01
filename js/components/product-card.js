
import { formatRupiah } from '../calculator.js';

class KalsaraProductCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set product(data) {
    this._product = data;
    this.render();
  }

  render() {
    const p = this._product || {};
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; background: var(--card, #fff); border: 1px solid var(--line, #e7e7ea); border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .name { font-weight: 700; font-size: 16px; margin-bottom: 8px; color: var(--ink, #111214); }
        .row { display: flex; justify-content: space-between; font-size: 13.5px; color: var(--mute, #62646c); margin-bottom: 4px; }
        .price { font-weight: 800; font-size: 18px; color: var(--ok, #10795a); margin-top: 8px; }
      </style>
      <div class="name">${p.name || 'Produk Tanpa Nama'}</div>
      <div class="row"><span>Modal Supplier</span> <b>${formatRupiah(p.capitalCents || 0)}</b></div>
      <div class="row"><span>Target Untung</span> <b>${formatRupiah(p.targetProfitCents || 0)}</b></div>
      <div class="price">Harga Rekomendasi: ${formatRupiah(p.listingPrice || 0)}</div>
    `;
  }
}

customElements.define('kalsara-product-card', KalsaraProductCard);
