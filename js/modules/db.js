// Modul IndexedDB menggunakan Dexie.js untuk menangani 1.000+ produk tanpa QuotaExceededError
export const db = new Dexie('KalsaraERPDB');

db.version(1).stores({
    products: 'id, sku, name, price, original_price, stock, status, created_at',
    sales: 'id, product_id, date, amount, profit',
    settings: 'key, value'
});

// Seed data awal jika database kosong agar langsung mirip v5.82
export async function seedInitialData() {
    const count = await db.products.count();
    if (count === 0) {
        const initialProducts = [
            {
                id: 1,
                sku: 'AO40-HITAM',
                name: 'AOLIVIYA Rak Buku Minimalis DIY Table Bookshelf Organizer Double Layer - AO40 - Hitam',
                price: 102500 * 100, // Integer Math (*100)
                original_price: 151080 * 100,
                stock: 5,
                status: 'urgent', // Perlu isi ulang
                created_at: Date.now()
            }
        ];
        
        // Generate dummy 1000 produk untuk uji performa skala spektakuler
        for (let i = 2; i <= 1000; i++) {
            initialProducts.push({
                id: i,
                sku: `SKU-PROD-${i}`,
                name: `Produk Grosir Micro-ERP Kalsara Unit Ke-${i} Berkualitas Tinggi`,
                price: (50000 + (i * 150)) * 100,
                original_price: (80000 + (i * 200)) * 100,
                stock: Math.floor(Math.random() * 20) + 1,
                status: 'safe',
                created_at: Date.now() - i
            });
        }
        await db.products.bulkPut(initialProducts);
    }
}

export async function getProductsPaged(offset, limit) {
    return await db.products
        .where('status')
        .equals('safe')
        .offset(offset)
        .limit(limit)
        .toArray();
}

export async function getUrgentProducts() {
    return await db.products.where('status').equals('urgent').toArray();
}

export async function updateStock(id, newStock) {
    await db.products.update(id, { stock: newStock });
}

export async function addProduct(product) {
    return await db.products.add(product);
}
