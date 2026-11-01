import { db, seedInitialData, getUrgentProducts, addProduct } from './modules/db.js';
import { createProductCard, VirtualScroller } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Kalsara v5.82 Full Logic Initialized");
    
    await seedInitialData();
    
    // Load Urgent Products
    const urgentListContainer = document.getElementById('urgent-list');
    const urgentProducts = await getUrgentProducts();
    urgentProducts.forEach(prod => {
        const card = createProductCard(prod, () => {});
        urgentListContainer.appendChild(card);
    });
    
    // Load Safe Products with Virtual Scrolling
    const safeProducts = await db.products.where('status').equals('safe').toArray();
    document.getElementById('stok-aman-title').textContent = `STOK AMAN (${safeProducts.length})`;
    
    const scroller = new VirtualScroller('virtual-scroll-viewport', 'virtual-scroll-spacer', 'product-list');
    scroller.setItems(safeProducts);
    
    // TAB SWITCHING LOGIC (Navigasi Menu Bawah)
    const tabs = document.querySelectorAll('.tab');
    const views = document.querySelectorAll('.app-view');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.getAttribute('data-target');
            document.getElementById('etad-title').textContent = target.charAt(0).toUpperCase() + target.slice(1);
            
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${target}`).classList.add('active');
        });
    });
    
    // PIPELINE KALKULATOR HARGA (Integer Math Pattern)
    const btnRunCalc = document.getElementById('btn-run-calc');
    if (btnRunCalc) {
        btnRunCalc.addEventListener('click', () => {
            const modalRp = parseFloat(document.getElementById('calc-modal').value) || 0;
            const marginPct = parseFloat(document.getElementById('calc-margin').value) || 0;
            
            // Integer Math (*100)
            const modalInt = modalRp * 100;
            const targetProfitInt = modalInt * (marginPct / 100);
            const subtotalInt = modalInt + targetProfitInt;
            
            // Pipeline Fee Marketplace & PPN (16%)
            const feeInt = subtotalInt * 0.16;
            const finalPriceInt = subtotalInt + feeInt;
            
            // Display Result (dibagi 100)
            const finalRp = (finalPriceInt / 100).toLocaleString('id-ID');
            const profitRp = (targetProfitInt / 100).toLocaleString('id-ID');
            
            document.getElementById('res-price').textContent = `Rp ${finalRp}`;
            document.getElementById('res-profit').textContent = `Rp ${profitRp}`;
            document.getElementById('calc-result').style.display = 'block';
        });
    }
    
    // WEB WORKER IMPORT LAPORAN SHOPEE
    const btnImport = document.getElementById('btn-import');
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            const statusEl = document.getElementById('import-status');
            statusEl.textContent = "Mengurai file laporan di latar belakang (Web Worker)...";
            
            const worker = new Worker('js/workers/importWorker.js');
            worker.postMessage({ fileData: 'mock_data' });
            
            worker.onmessage = function(e) {
                if (e.data.success) {
                    statusEl.textContent = `Berhasil! ${e.data.count} baris pesanan Shopee tersinkronisasi ke ERP.`;
                }
            };
        });
    }
    
    // EXPORT DATABASE JSON
    const btnExport = document.getElementById('btn-export-db');
    if (btnExport) {
        btnExport.addEventListener('click', async () => {
            const allProducts = await db.products.toArray();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allproducts));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", "kalsara_backup_erp.json");
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();
        });
    }
    
    // FAB TAMBAH PRODUK
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
        
        const updatedSafe = await db.products.where('status').equals('safe').toArray();
        scroller.setItems(updatedSafe);
        document.getElementById('stok-aman-title').textContent = `STOK AMAN (${updatedSafe.length})`;
        alert("Produk berhasil ditambahkan!");
    });
    
    document.getElementById('btn-guide').addEventListener('click', () => {
        alert("Kalsara Micro-ERP v5.82 Full Logic:
- Integer Math aktif
- Web Worker aktif
- IndexedDB aktif.");
    });
});
