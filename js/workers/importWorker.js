// Web Worker untuk memproses file CSV/Excel laporan Shopee besar di latar belakang
self.onmessage = function(e) {
    const { fileData } = e.data;
    try {
        // Simulasi parsing data berat ribuan baris pesanan tanpa membebani Main Thread
        let parsedRows = [];
        // Contoh proses...
        self.postMessage({ success: true, count: parsedRows.length });
    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};
