// Entry Point Kalsara v6
import { ProductCard } from './components/product-card.js';
import { saveBackup } from './utils/fs-api.js';

const calcWorker = new Worker('js/workers/calc-worker.js', { type: 'module' });
const dbWorker = new Worker('js/workers/sqlite-worker.js', { type: 'module' });

dbWorker.postMessage({ type: 'INIT_DB' });

document.addEventListener('DOMContentLoaded', () => {
    const demoProduct = document.getElementById('demo-product');
    demoProduct.setAttribute('name', 'Produk Etalase 1');

    calcWorker.onmessage = (e) => {
        if (e.data.type === 'RESULT') {
            demoProduct.updateData(e.data.payload.price, e.data.payload.net);
        }
    };

    // Simulasi Integer Math: Modal 50rb, Harga 100rb, Admin 5%, Xtra 4% (disimpan *100)
    calcWorker.postMessage({
        type: 'CALCULATE',
        id: 1,
        payload: { cogs: 5000000, price: 10000000, adminRate: 5, xtraRate: 4 }
    });
});
