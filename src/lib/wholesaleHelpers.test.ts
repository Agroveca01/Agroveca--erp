import { describe, expect, it } from 'vitest';

import { calculateWholesaleQuotation, getProductMOQ, validateMOQ } from './wholesaleHelpers';

describe('wholesaleHelpers', () => {
  it('keeps MOQ at 12 units for supported formats', () => {
    expect(
      getProductMOQ({
        id: 'p1',
        name: 'RTU',
        product_id: 'CTP-001',
        format: '500cc RTU',
        product_type: 'rtu-gatillo',
        color: null,
        aroma: null,
        ph_target: null,
        production_unit_liters: 0.5,
        base_price: 5950,
      }),
    ).toBe(12);
  });

  it('validates MOQ against selected wholesale quantities', () => {
    expect(
      validateMOQ(
        { p1: 6 },
        [
          {
            id: 'p1',
            name: 'Limpiador',
            product_id: 'CTP-001',
            format: '500cc RTU',
            product_type: 'rtu-gatillo',
            color: null,
            aroma: null,
            ph_target: null,
            production_unit_liters: 0.5,
            base_price: 5950,
          },
        ],
      ),
    ).toBe('Limpiador requiere un minimo de 12 unidades. Actualmente: 6 unidades.');
  });

  it('calculates wholesale quotation totals with shipping and VAT', () => {
    const quotation = calculateWholesaleQuotation(
      { p1: 12 },
      [
        {
          product: {
            id: 'p1',
            name: 'Limpiador',
            product_id: 'CTP-001',
            format: '500cc RTU',
            product_type: 'rtu-gatillo',
            color: null,
            aroma: null,
            ph_target: null,
            production_unit_liters: 0.5,
            base_price: 5950,
          },
          rawMaterialCost: 50,
          containerCost: 550,
          packagingCost: 500,
          labelCost: 150,
          totalCost: 1250,
          pvpGross: 5950,
          pvpNet: 5000,
          pvpVAT: 950,
          distributorPriceGross: 3570,
          distributorPriceNet: 3000,
          distributorVAT: 570,
          ctpProfitNet: 1750,
        },
      ],
      5000,
      0.4,
    );

    expect(quotation).toMatchObject({
      subtotalGross: 42840,
      subtotalNet: 36000,
      subtotalVAT: 6840,
      shippingCost: 5000,
      totalGross: 47840,
      totalVAT: 7638.319327731093,
      totalCtpProfitNet: 16798.319327731093,
      totalCostsNet: 15000,
    });
  });
});
