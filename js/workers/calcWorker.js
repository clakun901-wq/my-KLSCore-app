const applyAdminFee = (priceInt) => priceInt + Math.floor(priceInt * 0.05);
const applyTax = (priceInt) => priceInt + Math.floor(priceInt * 0.11);

self.onmessage = function(e) {
    const { action, id, basePrice } = e.data;
    if (action === 'run_pipeline') {
        let finalPrice = basePrice;
        finalPrice = applyAdminFee(finalPrice);
        finalPrice = applyTax(finalPrice);
        self.postMessage({ status: 'success', id: id, finalPrice: finalPrice });
    }
};