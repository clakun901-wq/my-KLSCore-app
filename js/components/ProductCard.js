export class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .card { 
                    background: #fff; border: 1px solid #e4e4e7; 
                    padding: 16px; border-radius: 12px; 
                    display: flex; justify-content: space-between; align-items: center;
                }
                .meta { display: flex; flex-direction: column; gap: 4px; }
                .sku { font-size: 0.75rem; color: #71717a; font-family: monospace; background: #f4f4f5; padding: 2px 6px; border-radius: 4px; width: fit-content;}
                .name { font-weight: 600; margin: 0; font-size: 1rem; }
                .price { font-weight: 700; color: #16a34a; font-size: 1.1rem; }
            </style>
            <div class="card">
                <div class="meta">
                    <span class="sku" id="sku-node"></span>
                    <h3 class="name" id="name-node"></h3>
                </div>
                <div class="price" id="price-node"></div>
            </div>
        `;
        
        this.skuNode = this.shadowRoot.getElementById('sku-node');
        this.nameNode = this.shadowRoot.getElementById('name-node');
        this.priceNode = this.shadowRoot.getElementById('price-node');
    }
    
    set product(data) {
        this.skuNode.textContent = data.sku;
        this.nameNode.textContent = data.name;
        const displayPrice = data.price / 100; 
        this.priceNode.textContent = `Rp ${displayPrice.toLocaleString('id-ID')}`;
    }
}
customElements.define('product-card', ProductCard);