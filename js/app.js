
import { products, totalProfit } from './state.js';
import { initDatabase, appendLog, backupToFileSystem } from './db.js';
import './components/product-card.js';
import { formatRupiah } from './calculator.js';

let opfsHandle = null;
const worker = new Worker('js/worker.js', { type: 'module' });

worker.onmessage = function(e) {
  if (e.data.type === 'BATCH_RESULT') {
    products.value = e.data.payload;
  }
};

async function initApp() {
  opfsHandle = await initDatabase();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed', err));
  }

  // Initial dummy products with integer math values (cents)
  const initialProducts = [
    { id: '1', name: 'Kemeja Flanel Premium', capital: '45000', target: '15000', packing: '1000', partner: '500' },
    { id: '2', name: 'Celana Chinos Casual', capital: '75000', target: '25000', packing: '1500', partner: '1000' }
  ];

  // Send to Web Worker for processing
  worker.postMessage({ type: 'CALCULATE_BATCH', payload: initialProducts });

  // Subscribe to signals for DOM updates without innerHTML
  products.subscribe(newProducts => {
    const container = document.getElementById('app-container');
    container.innerHTML = ''; // Clear container safely or reuse elements
    newProducts.forEach(prod => {
      const card = document.createElement('kalsara-product-card');
      card.product = prod;
      container.appendChild(card);
    });
  });

  totalProfit.subscribe(val => {
    document.getElementById('hero-profit').textContent = formatRupiah(val);
  });

  // UI Event Listeners
  document.getElementById('btn-add-product').onclick = async () => {
    const name = prompt('Nama Produk Baru:');
    if (!name) return;
    const capital = prompt('Modal Supplier (Rp):', '50000');
    const target = prompt('Target Untung (Rp):', '10000');
    
    const newProd = { id: Date.now().toString(), name, capital, target, packing: '1000', partner: '500' };
    const updated = [...products.value, newProd];
    
    worker.postMessage({ type: 'CALCULATE_BATCH', payload: updated });

    // Append to OPFS Log
    await appendLog(opfsHandle, { action: 'ADD_PRODUCT', product: newProd });
  };

  document.getElementById('btn-backup-fs').onclick = () => {
    backupToFileSystem({ products: products.value });
  };
}

initApp();
