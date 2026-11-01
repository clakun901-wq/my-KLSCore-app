import { productsSignal, dbReadySignal } from './store/signals.js';
import { effect } from '@preact/signals-core';
import './components/ProductCard.js';

const dbWorker = new Worker('js/workers/dbWorker.js');
const calcWorker = new Worker('js/workers/calcWorker.js');

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('product-list');
    const btnAdd = document.getElementById('btn-add-product');
    const dbStatus = document.getElementById('db-status');

    // Auto-init DB on load (Seamless UX)
    dbWorker.postMessage({ action: 'init' });

    // Reactive DOM Update without innerHTML
    effect(() => {
        while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
        productsSignal.value.forEach(prod => {
            const el = document.createElement('product-card');
            el.product = prod;
            listContainer.appendChild(el);
        });
    });

    effect(() => { 
        btnAdd.disabled = !dbReadySignal.value; 
        if (dbReadySignal.value) {
            dbStatus.textContent = "Database Aktif";
            dbStatus.className = "badge success";
        }
    });

    dbWorker.onmessage = (e) => {
        const { status, payload, error } = e.data;
        if (status === 'ready') {
            dbReadySignal.value = true;
            dbWorker.postMessage({ action: 'getAll' });
        } else if (status === 'added' || status === 'data') {
            if (status === 'added') dbWorker.postMessage({ action: 'getAll' });
            if (status === 'data') productsSignal.value = payload;
        }
    };

    calcWorker.onmessage = (e) => {
        const { status, id, finalPrice } = e.data;
        if (status === 'success') {
            dbWorker.postMessage({
                action: 'add',
                payload: { sku: `SKU-KLS${id}`, name: `Produk Reguler ${id}`, price: finalPrice }
            });
        }
    };

    // FAB Add Data
    btnAdd.addEventListener('click', () => {
        const randomId = Math.floor(Math.random() * 9000) + 1000;
        calcWorker.postMessage({ action: 'run_pipeline', id: randomId, basePrice: 15000000 });
    });
});
