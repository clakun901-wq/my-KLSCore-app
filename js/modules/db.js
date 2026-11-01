export const db = new Dexie('KalsaraERPDB');

db.version(1).stores({
    products: 'id, sku, name, price, original_price, stock, status, created_at',
    sales: 'id, product_id, date, amount, profit',
    settings: 'key, value'
});

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
                status: 'urgent',
                created_at: Date.now()
            }
        ];
        
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

export async function getUrgentProducts() {
    return await db.products.where('status').equals('urgent').toArray();
}

export async function updateStock(id, newStock) {
    await db.products.update(id, { stock: newStock });
}

export async function addProduct(product) {
    return await db.products.add(product);
}
