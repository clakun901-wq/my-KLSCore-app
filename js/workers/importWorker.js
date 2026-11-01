self.onmessage = function(e) {
    const { fileData } = e.data;
    try {
        // Simulasi parsing data Shopee di background thread
        setTimeout(() => {
            self.postMessage({ success: true, count: 245 });
        }, 1000);
    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};
