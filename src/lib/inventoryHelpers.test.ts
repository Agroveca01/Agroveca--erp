import { describe, expect, it } from 'vitest';

import { filterProducts, filterRawMaterials, isLowStockMaterial } from './inventoryHelpers';

describe('inventoryHelpers', () => {
  it('detects low stock materials at or below alert threshold', () => {
    expect(
      isLowStockMaterial({
        id: 'm1',
        name: 'Acido citrico',
        category: 'chemical',
        unit: 'kg',
        current_cost: 1000,
        stock_quantity: 5,
        min_stock_alert: 5,
      }),
    ).toBe(true);

    expect(
      isLowStockMaterial({
        id: 'm2',
        name: 'Alcohol',
        category: 'chemical',
        unit: 'l',
        current_cost: 2000,
        stock_quantity: 6,
        min_stock_alert: 5,
      }),
    ).toBe(false);
  });

  it('filters raw materials by name, category, or unit', () => {
    const rawMaterials = [
      {
        id: 'm1',
        name: 'Acido citrico',
        category: 'chemical' as const,
        unit: 'kg',
        current_cost: 1000,
        stock_quantity: 5,
        min_stock_alert: 2,
      },
      {
        id: 'm2',
        name: 'Fragancia floral',
        category: 'fragrance' as const,
        unit: 'l',
        current_cost: 3000,
        stock_quantity: 8,
        min_stock_alert: 1,
      },
    ];

    expect(filterRawMaterials(rawMaterials, 'fragancia')).toEqual([rawMaterials[1]]);
    expect(filterRawMaterials(rawMaterials, 'chemical')).toEqual([rawMaterials[0]]);
    expect(filterRawMaterials(rawMaterials, 'kg')).toEqual([rawMaterials[0]]);
  });

  it('filters finished products by visible searchable fields', () => {
    const products = [
      {
        id: 'p1',
        name: 'Limpiador Citrus',
        product_id: 'CTP-001',
        format: '500cc',
        product_type: 'rtu-gatillo' as const,
        color: null,
        aroma: null,
        ph_target: null,
        production_unit_liters: 0.5,
        base_price: 5990,
      },
      {
        id: 'p2',
        name: 'Sustrato Premium',
        product_id: 'CTP-002',
        format: '5L',
        product_type: 'sustrato' as const,
        color: null,
        aroma: null,
        ph_target: null,
        production_unit_liters: 5,
        base_price: 8990,
      },
    ];

    expect(filterProducts(products, 'citrus')).toEqual([products[0]]);
    expect(filterProducts(products, 'ctp-002')).toEqual([products[1]]);
    expect(filterProducts(products, 'sustrato')).toEqual([products[1]]);
    expect(filterProducts(products, '500cc')).toEqual([products[0]]);
  });
});
