self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js');
let db;
self.onmessage = async function(e) {
    const { action, payload } = e.data;
    try {
        if (action === 'init') {
            const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
            db = new SQL.Database();
            db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT UNIQUE, name TEXT, price INTEGER, created_at INTEGER);`);
            self.postMessage({ status: 'ready' });
        } 
        else if (action === 'add') {
            const stmt = db.prepare("INSERT INTO products (sku, name, price, created_at) VALUES (?, ?, ?, ?)");
            stmt.run([payload.sku, payload.name, payload.price, Date.now()]);
            stmt.free();
            self.postMessage({ status: 'added' });
        }
        else if (action === 'getAll') {
            const res = db.exec("SELECT sku, name, price FROM products ORDER BY created_at DESC");
            let data = [];
            if (res.length > 0) {
                data = res[0].values.map(row => ({ sku: row[0], name: row[1], price: row[2] }));
            }
            self.postMessage({ status: 'data', payload: data });
        }
    } catch (err) {
        self.postMessage({ status: 'error', error: err.message });
    }
};