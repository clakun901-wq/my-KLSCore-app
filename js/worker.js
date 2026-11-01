
importScripts('./calculator.js'); // Or self.onmessage listener with imported logic

self.onmessage = function(e) {
  const { type, payload } = e.data;
  if (type === 'CALCULATE_BATCH') {
    const results = payload.map(product => {
      // Simulate heavy ERP / price pipeline computation in worker thread
      const capitalCents = Math.round(parseFloat(product.capital || 0) * 100);
      const targetProfitCents = Math.round(parseFloat(product.target || 0) * 100);
      const packingCents = Math.round(parseFloat(product.packing || 0) * 100);
      const partnerCents = Math.round(parseFloat(product.partner || 0) * 100);

      const baseCost = capitalCents + packingCents + partnerCents;
      const marketplaceFees = Math.round(baseCost * 0.083); // ~8.3% combined fee
      const calculatedProfit = targetProfitCents;
      const listingPrice = baseCost + marketplaceFees + calculatedProfit;

      return {
        ...product,
        capitalCents,
        targetProfitCents,
        calculatedProfit,
        listingPrice
      };
    });
    self.postMessage({ type: 'BATCH_RESULT', payload: results });
  }
};
