import { describe, expect, it } from 'vitest';

import { calculateFactoryCost, calculatePricingAnalysis, getFormatCosts, getVolumeDiscount } from './pricingHelpers';

describe('pricingHelpers', () => {
  it('maps product formats to expected container and label costs', () => {
    expect(getFormatCosts('100cc')).toEqual({ container: 350, label: 80 });
    expect(getFormatCosts('200cc')).toEqual({ container: 450, label: 100 });
    expect(getFormatCosts('500cc RTU')).toEqual({ container: 550, label: 150 });
    expect(getFormatCosts('5L')).toEqual({ container: 450, label: 100 });
  });

  it('returns the correct volume discount tier for an order quantity', () => {
    expect(getVolumeDiscount(120)).toMatchObject({ level: 1, discountPercent: 0 });
    expect(getVolumeDiscount(500)).toMatchObject({ level: 2, discountPercent: 5 });
    expect(getVolumeDiscount(1500)).toMatchObject({ level: 3, discountPercent: 10 });
  });

  it('calculates factory cost using units per batch and fixed packaging costs', () => {
    expect(
      calculateFactoryCost(
        {
          id: 'p1',
          name: 'Limpiador Citrus',
          product_id: 'CTP-001',
          format: '500cc RTU',
          product_type: 'rtu-gatillo',
          color: null,
          aroma: null,
          ph_target: null,
          production_unit_liters: 0.5,
          base_price: 5990,
          units_per_batch: 50,
        },
        {
          id: 'fc1',
          container_cost: 450,
          packaging_cost: 500,
          label_cost: 150,
          shipping_cost: 750,
          updated_at: '2026-03-26T00:00:00.000Z',
          updated_by: null,
        },
        2500,
      ),
    ).toEqual({
      rawMaterialCost: 50,
      containerCost: 550,
      labelCost: 150,
      packagingCost: 500,
      factoryCost: 1250,
    });
  });

  it('calculates pricing analysis cascade from factory cost to distributor and pvp targets', () => {
    const analysis = calculatePricingAnalysis(
      {
        id: 'p1',
        name: 'Limpiador Citrus',
        product_id: 'CTP-001',
        format: '500cc RTU',
        product_type: 'rtu-gatillo',
        color: null,
        aroma: null,
        ph_target: null,
        production_unit_liters: 0.5,
        base_price: 5990,
        units_per_batch: 50,
      },
      {
        id: 'fc1',
        container_cost: 450,
        packaging_cost: 500,
        label_cost: 150,
        shipping_cost: 750,
        updated_at: '2026-03-26T00:00:00.000Z',
        updated_by: null,
      },
      2500,
      50,
      35,
      500,
    );

    expect(analysis).toMatchObject({
      product: {
        id: 'p1',
        name: 'Limpiador Citrus',
        product_id: 'CTP-001',
        format: '500cc RTU',
        product_type: 'rtu-gatillo',
        color: null,
        aroma: null,
        ph_target: null,
        production_unit_liters: 0.5,
        base_price: 5990,
        units_per_batch: 50,
      },
      rawMaterialCost: 50,
      containerCost: 550,
      labelCost: 150,
      packagingCost: 500,
      factoryCost: 1250,
      baseDistributorPrice: 2500,
      distributorPriceWithDiscount: 2375,
      marginWarning: false,
      currentShopifyPrice: 5990,
      ourMargin: 50,
      distributorMargin: 35,
      totalProfit: 562500,
    });

    expect(analysis.finalMarginPercent).toBeCloseTo(47.368421052631575);
    expect(analysis.suggestedPVP).toBeCloseTo(3653.846153846154);
    expect(analysis.recommendedPVP70).toBeCloseTo(4166.666666666667);
    expect(analysis.priceDifference).toBeCloseTo(-2336.153846153846);
    expect(analysis.priceDifferencePercent).toBeCloseTo(-39.00089893395399);
  });
});
