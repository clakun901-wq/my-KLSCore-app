import { updateStock } from './db.js';

export function createProductCard(product, onStockChange) {
    const card = document.createElement('div');
    card.className = 'pc';
    
    const displayPrice = product.price / 100;
    const displayOrig = product.original_price / 100;
    const discountPct = Math.round(((product.original_price - product.price) / product.original_price) * 100);
    
    card.innerHTML = `
        <div class="pc-title">${product.name}</div>
        <div class="voucher-tag">🎫 Voucher Toko Rp 2.000 · Berjalan, sisa 5 hari</div>
        <div class="price-row">
            <span class="current-price">Rp ${displayPrice.toLocaleString('id-ID')}</span>
            <span class="original-price">Rp ${displayOrig.toLocaleString('id-ID')}</span>
            <span class="discount-badge">-${discountPct}%</span>
            <span class="actual-tag">Harga aktual</span>
        </div>
        <div class="margin-info">
            Harga awal Shopee Rp ${displayOrig.toLocaleString('id-ID')}. <span>Untung Rp 40 · margin 0%</span>
        </div>
        <div class="stock-action-row">
            <div>
                ${product.status === 'urgent' 
                    ? '<span class="stock-status-badge">Hampir habis</span>' 
                    : '<span class="stock-status-badge safe">Stok Aman</span>'}
            </div>
            <div class="stock-counter">
                <button class="stock-btn minus" type="button">-</button>
                <span class="stock-val">${product.stock}</span>
                <button class="stock-btn plus" type="button">+</button>
            </div>
        </div>
    `;
    
    const minusBtn = card.querySelector('.minus');
    const plusBtn = card.querySelector('.plus');
    const stockValSpan = card.querySelector('.stock-val');
    
    minusBtn.addEventListener('click', async () => {
        if (product.stock > 0) {
            product.stock--;
            stockValSpan.textContent = product.stock;
            await updateStock(product.id, product.stock);
            if (onStockChange) onStockChange();
        }
    });
    
    plusBtn.addEventListener('click', async () => {
        product.stock++;
        stockValSpan.textContent = product.stock;
        await updateStock(product.id, product.stock);
        if (onStockChange) onStockChange();
    });
    
    return card;
}

export class VirtualScroller {
    constructor(viewportId, spacerId, containerId) {
        this.viewport = document.getElementById(viewportId);
        this.spacer = document.getElementById(spacerId);
        this.container = document.getElementById(containerId);
        this.items = [];
        
        this.viewport.addEventListener('scroll', () => {
            this.render();
        });
    }
    
    setItems(items) {
        this.items = items;
        this.spacer.style.height = `${this.items.length * 150}px`;
        this.render();
    }
    
    render() {
        const scrollTop = this.viewport.scrollTop;
        const viewportHeight = this.viewport.clientHeight;
        
        const startIndex = Math.max(0, Math.floor(scrollTop / 150) - 2);
        const visibleCount = Math.ceil(viewportHeight / 150) + 4;
        const endIndex = Math.min(this.items.length, startIndex + visibleCount);
        
        this.container.style.transform = `translateY(${startIndex * 150}px)`;
        
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        
        for (let i = startIndex; i < endIndex; i++) {
            if (this.items[i]) {
                const card = createProductCard(this.items[i]);
                this.container.appendChild(card);
            }
        }
    }
}
