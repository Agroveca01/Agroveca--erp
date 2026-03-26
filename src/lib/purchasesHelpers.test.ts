import { describe, expect, it } from 'vitest';

import {
  findPackagingInventoryMatch,
  getPurchaseMonthSummary,
  normalizeInventoryFormat,
} from './purchasesHelpers';

describe('purchasesHelpers', () => {
  it('normalizes empty inventory formats to null', () => {
    expect(normalizeInventoryFormat(' 500cc ')).toBe('500cc');
    expect(normalizeInventoryFormat('   ')).toBeNull();
    expect(normalizeInventoryFormat(null)).toBeNull();
  });

  it('matches packaging inventory by type, name, and normalized format', () => {
    const inventory = [
      {
        id: 'inv-1',
        item_type: 'envase',
        item_name: 'Botella PET',
        format: '500cc',
        current_stock: 20,
        min_stock_alert: 5,
        optimal_stock: 40,
        unit_cost_net: 120,
        location: null,
        last_updated: '2026-03-26T00:00:00.000Z',
        created_at: '2026-03-26T00:00:00.000Z',
      },
      {
        id: 'inv-2',
        item_type: 'envase',
        item_name: 'Botella PET',
        format: null,
        current_stock: 10,
        min_stock_alert: 2,
        optimal_stock: 20,
        unit_cost_net: 100,
        location: null,
        last_updated: '2026-03-26T00:00:00.000Z',
        created_at: '2026-03-26T00:00:00.000Z',
      },
    ];

    expect(findPackagingInventoryMatch(inventory, 'envase', 'Botella PET', ' 500cc ')?.id).toBe('inv-1');
    expect(findPackagingInventoryMatch(inventory, 'envase', 'Botella PET', '')?.id).toBe('inv-2');
    expect(findPackagingInventoryMatch(inventory, 'tapa', 'Botella PET', '500cc')).toBeUndefined();
  });

  it('summarizes purchases for the reference month only', () => {
    const purchases = [
      {
        id: 'p-1',
        purchase_date: '2026-03-05',
        supplier_name: 'Proveedor A',
        item_type: 'envase',
        item_name: 'Botella PET',
        quantity: 100,
        unit_price_gross: 119,
        total_gross: 11900,
        total_net: 10000,
        vat_credit: 1900,
        invoice_number: null,
        notes: null,
        inventory_updated: true,
        created_at: '2026-03-05T00:00:00.000Z',
      },
      {
        id: 'p-2',
        purchase_date: '2026-03-18',
        supplier_name: 'Proveedor B',
        item_type: 'tapa',
        item_name: 'Tapa 500cc',
        quantity: 200,
        unit_price_gross: 59.5,
        total_gross: 11900,
        total_net: 10000,
        vat_credit: 1900,
        invoice_number: null,
        notes: null,
        inventory_updated: true,
        created_at: '2026-03-18T00:00:00.000Z',
      },
      {
        id: 'p-3',
        purchase_date: '2026-02-28',
        supplier_name: 'Proveedor C',
        item_type: 'etiqueta',
        item_name: 'Etiqueta Frontal',
        quantity: 50,
        unit_price_gross: 238,
        total_gross: 11900,
        total_net: 10000,
        vat_credit: 1900,
        invoice_number: null,
        notes: null,
        inventory_updated: true,
        created_at: '2026-02-28T00:00:00.000Z',
      },
    ];

    const summary = getPurchaseMonthSummary(purchases, new Date('2026-03-26T12:00:00.000Z'));

    expect(summary.monthlyPurchases).toHaveLength(2);
    expect(summary.totalSpent).toBe(23800);
    expect(summary.totalVatCredit).toBe(3800);
  });
});
