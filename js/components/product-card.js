// Native Web Component (Shadow DOM) + Signals
const { signal, effect } = window.preactSignalsCore;

export class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.priceSignal = signal(0);
        this.netSignal = signal(0);
    }

    connectedCallback() {
        // Dilarang innerHTML, wajib DOM API murni
        const container = document.createElement('div');
        container.className = 'card';
        
        const title = document.createElement('h3');
        title.textContent = this.getAttribute('name') || 'Produk';
        
        const priceLabel = document.createElement('div');
        const netLabel = document.createElement('div');

        // Reactive UI update via Signals
        effect(() => {
            priceLabel.textContent = `Harga Listing: Rp ${this.priceSignal.value / 100}`;
            netLabel.textContent = `Untung Bersih: Rp ${this.netSignal.value / 100}`;
        });

        const style = document.createElement('style');
        style.textContent = `
            .card { border: 1px solid #ccc; padding: 16px; border-radius: 12px; background: #fff; }
            h3 { margin: 0 0 8px; }
        `;

        container.appendChild(style);
        container.appendChild(title);
        container.appendChild(priceLabel);
        container.appendChild(netLabel);
        this.shadowRoot.appendChild(container);
    }

    updateData(priceCents, netCents) {
        this.priceSignal.value = priceCents;
        this.netSignal.value = netCents;
    }
}
customElements.define('kalsara-product', ProductCard);
