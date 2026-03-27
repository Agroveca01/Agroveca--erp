import { describe, expect, it } from 'vitest';

import {
  getDashboardWholesaleMOQError,
  getDashboardWholesaleSummary,
} from './dashboardWholesaleSimulatorHelpers';

const products = [
  {
    product: { id: 'p1', format: '500cc RTU', name: 'RTU' },
    distributorPriceGross: 3570,
    distributorPriceNet: 3000,
    distributorVAT: 570,
    ctpProfitNetPerUnit: 1750,
    totalProductionCost: 1250,
    basePriceNet: 5000,
    netProfitNet: 1500,
  },
  {
    product: { id: 'p2', format: '200cc', name: 'Conc 200' },
    distributorPriceGross: 2380,
    distributorPriceNet: 2000,
    distributorVAT: 380,
    ctpProfitNetPerUnit: 900,
    totalProductionCost: 1100,
    basePriceNet: 3000,
    netProfitNet: 700,
  },
];

describe('dashboardWholesaleSimulatorHelpers', () => {
  it('validates grouped MOQ rules for RTU and concentrates', () => {
    expect(getDashboardWholesaleMOQError(products, { p1: 6 })).toBe(
      'RTU-500cc: Minimo 12 unidades en total. Actualmente: 6',
    );
    expect(getDashboardWholesaleMOQError(products, { p2: 8 })).toBe(
      'Concentrados (100cc/200cc): Minimo 12 unidades en total. Actualmente: 8',
    );
    expect(getDashboardWholesaleMOQError(products, { p1: 12, p2: 12 })).toBeNull();
  });

  it('calculates wholesale summary, shipping impact, and channel comparison', () => {
    expect(getDashboardWholesaleSummary(products, { p1: 12, p2: 12 }, 5000)).toMatchObject({
      selectedProducts: products,
      subtotalGross: 71400,
      subtotalNet: 60000,
      subtotalVAT: 11400,
      totalCtpProfitNet: 31800,
      totalCostsNet: 28200,
      totalGross: 76400,
      finalCtpProfit: 27598.319327731093,
      totalUnitsSelected: 24,
      shopifyComparison: {
        revenue: 96000,
        profit: 26400,
      },
      wholesaleProfit: 31800,
      profitDifference: 5400,
      profitDifferencePercent: 20.454545454545457,
    });
    const breakdown = getDashboardWholesaleSummary(products, { p1: 12, p2: 12 }, 5000).shippingNetBreakdown;
    expect(breakdown.gross).toBe(5000);
    expect(breakdown.net).toBeCloseTo(4201.680672268907, 10);
    expect(breakdown.vat).toBeCloseTo(798.3193277310925, 10);
  });
});
