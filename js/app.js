import { db, seedInitialData, getUrgentProducts, getProductsPaged, addProduct } from './modules/db.js';
import { createProductCard, VirtualScroller } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Kalsara v5.82 Full Local-First Architecture Initialized");
    
    // Inisialisasi IndexedDB & Seed Data
    await seedInitialData();
    
    // Load Produk Urgen (Perlu Isi Ulang)
    const urgentListContainer = document.getElementById('urgent-list');
    const urgentProducts = await getUrgentProducts();
    
    urgentProducts.forEach(prod => {
        const card = createProductCard(prod, () => {});
        urgentListContainer.appendChild(card);
    });
    
    // Load Produk Aman dengan Virtual Scrolling untuk 1.000+ produk
    const safeProducts = await db.products.where('status').equals('safe').toArray();
    document.getElementById('stok-aman-title').textContent = `STOK AMAN (${safeProducts.length})`;
    
    const scroller = new VirtualScroller('virtual-scroll-viewport', 'virtual-scroll-spacer', 'product-list', 150);
    scroller.setItems(safeProducts);
    
    // FAB Tambah Produk Cepat
    document.getElementById('fab-add').addEventListener('click', async () => {
        const newId = Date.now();
        const newProd = {
            id: newId,
            sku: `SKU-NEW-${Math.floor(Math.random()*1000)}`,
            name: `Produk Baru Micro-ERP Kalsara Instan`,
            price: 125000 * 100,
            original_price: 180000 * 100,
            stock: 12,
            status: 'safe',
            created_at: Date.now()
        };
        await addProduct(newProd);
        
        // Refresh list
        const updatedSafe = await db.products.where('status').equals('safe').toArray();
        scroller.setItems(updatedSafe);
        document.getElementById('stok-aman-title').textContent = `STOK AMAN (${updatedSafe.length})`;
    });
    
    // Navigasi Tab Bawah
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-target');
            document.getElementById('etad-title').textContent = target.charAt(0).toUpperCase() + target.slice(1);
        });
    });
});
