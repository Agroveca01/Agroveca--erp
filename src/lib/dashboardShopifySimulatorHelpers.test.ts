import { describe, expect, it } from 'vitest';

import { getShopifySimulatorSummary } from './dashboardShopifySimulatorHelpers';

describe('dashboardShopifySimulatorHelpers', () => {
  it('returns zeros when the selected product is not found', () => {
    expect(getShopifySimulatorSummary([], 'missing', 100, 500000)).toEqual({
      selectedProductData: undefined,
      totalRevenueGross: 0,
      totalRevenueNet: 0,
      totalVATDebit: 0,
      totalCosts: 0,
      grossProfit: 0,
      netProfit: -500000,
      roi: -100,
    });
  });

  it('calculates shopify simulator summary for the selected product', () => {
    const products = [
      {
        product: { id: 'p1' },
        basePriceGross: 1190,
        basePriceNet: 1000,
        realCost: 400,
        netProfitNet: 600,
        netMarginNet: 60,
      },
    ];

    expect(getShopifySimulatorSummary(products, 'p1', 100, 50000)).toEqual({
      selectedProductData: products[0],
      totalRevenueGross: 119000,
      totalRevenueNet: 100000,
      totalVATDebit: 19000,
      totalCosts: 40000,
      grossProfit: 60000,
      netProfit: 10000,
      roi: 20,
    });
  });
});
