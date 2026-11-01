import { productsSignal, dbReadySignal } from './store/signals.js';
import { effect } from '@preact/signals-core';
import './components/ProductCard.js';

const dbWorker = new Worker('js/workers/dbWorker.js');
const calcWorker = new Worker('js/workers/calcWorker.js');

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('product-list');
    const btnInit = document.getElementById('btn-init-db');
    const btnAdd = document.getElementById('btn-add-product');

    effect(() => {
        while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
        productsSignal.value.forEach(prod => {
            const el = document.createElement('product-card');
            el.product = prod;
            listContainer.appendChild(el);
        });
    });

    effect(() => { btnAdd.disabled = !dbReadySignal.value; });

    dbWorker.onmessage = (e) => {
        const { status, payload, error } = e.data;
        if (status === 'ready') {
            dbReadySignal.value = true;
            btnInit.textContent = "OPFS DB Connected";
            btnInit.disabled = true;
            dbWorker.postMessage({ action: 'getAll' });
        } else if (status === 'added' || status === 'data') {
            if (status === 'added') dbWorker.postMessage({ action: 'getAll' });
            if (status === 'data') productsSignal.value = payload;
        } else if (status === 'error') {
            console.error("DB Error:", error);
        }
    };

    calcWorker.onmessage = (e) => {
        const { status, id, finalPrice } = e.data;
        if (status === 'success') {
            dbWorker.postMessage({
                action: 'add',
                payload: { sku: `SKU-${id}`, name: `Produk Simulasi ${id}`, price: finalPrice }
            });
        }
    };

    btnInit.addEventListener('click', () => { dbWorker.postMessage({ action: 'init' }); });
    btnAdd.addEventListener('click', () => {
        const randomId = Math.floor(Math.random() * 10000);
        calcWorker.postMessage({ action: 'run_pipeline', id: randomId, basePrice: 10000000 });
    });
});