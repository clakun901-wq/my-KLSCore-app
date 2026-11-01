export class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Static template (No innerHTML dynamic injection during runtime)
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .pc { 
                    background: #fff; 
                    border-radius: 16px; 
                    padding: 16px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 12px;
                    align-items: start;
                }
                .meta { display: flex; flex-direction: column; gap: 6px; }
                .tags { display: flex; gap: 6px; }
                .sku { font-size: 0.7rem; color: #64748b; font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
                .status { font-size: 0.7rem; color: #047857; background: #d1fae5; padding: 2px 6px; border-radius: 6px; font-weight: 600; }
                .name { font-weight: 700; margin: 0; font-size: 1.05rem; color: #0f172a; line-height: 1.3;}
                
                .financials { text-align: right; display: flex; flex-direction: column; gap: 4px; }
                .price-label { font-size: 0.7rem; color: #64748b; margin-bottom: -4px; }
                .price { font-weight: 800; color: #2563eb; font-size: 1.15rem; }
                .profit { font-size: 0.75rem; color: #10b981; font-weight: 600; }
            </style>
            <div class="pc">
                <div class="meta">
                    <div class="tags">
                        <span class="sku" id="sku-node"></span>
                        <span class="status">Aktif</span>
                    </div>
                    <h3 class="name" id="name-node"></h3>
                </div>
                <div class="financials">
                    <span class="price-label">Harga Jual</span>
                    <div class="price" id="price-node"></div>
                    <div class="profit" id="profit-node"></div>
                </div>
            </div>
        `;
        
        // Cache node references
        this.skuNode = this.shadowRoot.getElementById('sku-node');
        this.nameNode = this.shadowRoot.getElementById('name-node');
        this.priceNode = this.shadowRoot.getElementById('price-node');
        this.profitNode = this.shadowRoot.getElementById('profit-node');
    }
    
    // Setter handles integer-to-decimal display logic natively
    set product(data) {
        this.skuNode.textContent = data.sku;
        this.nameNode.textContent = data.name;
        
        const displayPrice = data.price / 100;
        this.priceNode.textContent = `Rp ${displayPrice.toLocaleString('id-ID')}`;
        
        // Simulasi kalkulasi profit (20% dari harga jual) untuk keperluan UI
        const estimatedProfit = Math.floor(data.price * 0.20) / 100;
        this.profitNode.textContent = `+ Rp ${estimatedProfit.toLocaleString('id-ID')}`;
    }
}
customElements.define('product-card', ProductCard);
