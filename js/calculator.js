
// Chain of Responsibility Pattern (Pipeline Pattern) for Financial Calculations
// Absolute Financial Accuracy: Integer Math Pattern (Multiply by 100 for storage/calc, divide by 100 for UI display).

class PriceCalculationHandler {
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }
  handle(context) {
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }
    return context;
  }
}

class BaseCostHandler extends PriceCalculationHandler {
  handle(context) {
    // context.capital (modal in cents), packing, partner fee
    context.baseCost = context.product.capitalCents + context.product.packingCents + context.product.partnerCents;
    return super.handle(context);
  }
}

class MarketplaceFeeHandler extends PriceCalculationHandler {
  handle(context) {
    // Calculate admin fee, payment gateway fee, XTRA programs using integer math
    const price = context.estimatedListingPrice || 10000000; // in cents (e.g., Rp 100,000.00 = 10000000)
    const adminFee = Math.round(price * 650 / 10000); // 6.5%
    const paymentFee = Math.round(price * 180 / 10000); // 1.8%
    context.marketplaceFees = adminFee + paymentFee;
    return super.handle(context);
  }
}

class ProfitMarginHandler extends PriceCalculationHandler {
  handle(context) {
    const targetProfit = context.product.targetProfitCents || 200000; // Rp 2,000.00 = 200000 cents
    context.finalListingPriceCents = context.baseCost + context.marketplaceFees + targetProfit;
    context.netProfitCents = targetProfit;
    return super.handle(context);
  }
}

export function calculatePricePipeline(product) {
  const handler1 = new BaseCostHandler();
  const handler2 = new MarketplaceFeeHandler();
  const handler3 = new ProfitMarginHandler();

  handler1.setNext(handler2).setNext(handler3);

  const context = { product };
  handler1.handle(context);
  return {
    listingPrice: context.finalListingPriceCents,
    netProfit: context.netProfitCents
  };
}

export function formatRupiah(cents) {
  const rupiah = cents / 100;
  return 'Rp ' + Math.round(rupiah).toLocaleString('id-ID');
}
