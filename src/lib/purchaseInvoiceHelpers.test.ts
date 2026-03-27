import { describe, expect, it } from 'vitest';

import {
  buildInvoiceInventoryResolutionPlan,
  calculateInvoiceTotals,
  EMPTY_LINE_ITEM,
  getCreditDueDate,
  hasInvoiceItemsToSubmit,
  normalizeInvoiceItemsForInsert,
  updateInvoiceLineItem,
} from './purchaseInvoiceHelpers';

describe('purchaseInvoiceHelpers', () => {
  it('provides a stable empty line item template', () => {
    expect(EMPTY_LINE_ITEM).toEqual({
      item_type: 'envase',
      item_name: '',
      format: '',
      quantity: 0,
      unit_price_net: 0,
      line_total_net: 0,
      packaging_inventory_id: null,
    });
  });

  it('updates line totals and matches inventory for edited line items', () => {
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
    ];

    let items = [EMPTY_LINE_ITEM];
    items = updateInvoiceLineItem(items, 0, 'item_name', 'Botella PET', inventory);
    items = updateInvoiceLineItem(items, 0, 'format', '500cc', inventory);
    items = updateInvoiceLineItem(items, 0, 'quantity', 12, inventory);
    items = updateInvoiceLineItem(items, 0, 'unit_price_net', 100, inventory);

    expect(items[0]).toMatchObject({
      item_name: 'Botella PET',
      format: '500cc',
      quantity: 12,
      unit_price_net: 100,
      line_total_net: 1200,
      packaging_inventory_id: 'inv-1',
    });
  });

  it('calculates invoice totals and credit due date', () => {
    expect(
      calculateInvoiceTotals([
        { ...EMPTY_LINE_ITEM, quantity: 2, unit_price_net: 1000, line_total_net: 2000 },
        { ...EMPTY_LINE_ITEM, quantity: 1, unit_price_net: 500, line_total_net: 500 },
      ]),
    ).toEqual({
      subtotal: 2500,
      vatAmount: 475,
      totalAmount: 2975,
    });

    expect(getCreditDueDate('2026-03-26', 30)).toBe('2026-04-25');
  });

  it('filters and normalizes line items for invoice item inserts', () => {
    const items = [
      { ...EMPTY_LINE_ITEM, item_name: 'Botella PET', format: ' 500cc ', quantity: 10, unit_price_net: 100, line_total_net: 1000 },
      { ...EMPTY_LINE_ITEM, item_name: 'Ignorar', quantity: 0, unit_price_net: 50, line_total_net: 0 },
    ];

    expect(hasInvoiceItemsToSubmit(items)).toBe(true);
    expect(normalizeInvoiceItemsForInsert('inv-123', items)).toEqual([
      {
        invoice_id: 'inv-123',
        item_type: 'envase',
        item_name: 'Botella PET',
        format: '500cc',
        quantity: 10,
        unit_price_net: 100,
        line_total_net: 1000,
        packaging_inventory_id: null,
      },
    ]);
  });

  it('builds inventory resolution plans for inserts and stock updates from invoice lines', () => {
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
    ];

    expect(
      buildInvoiceInventoryResolutionPlan(
        {
          ...EMPTY_LINE_ITEM,
          item_type: 'envase',
          item_name: 'Botella PET',
          format: ' 500cc ',
          quantity: 12,
          unit_price_net: 100,
          line_total_net: 1200,
        },
        'F-100',
        inventory,
      ),
    ).toEqual({
      normalizedFormat: '500cc',
      packagingInventoryId: 'inv-1',
      shouldInsertInventory: false,
      inventoryInsertPayload: null,
      inventoryUpdatePayload: {
        id: 'inv-1',
        current_stock: 32,
        unit_cost_net: 100,
      },
      movementPayload: {
        movement_type: 'entrada',
        quantity: 12,
        reference_type: 'purchase_invoice',
        notes: 'Factura F-100',
      },
    });

    expect(
      buildInvoiceInventoryResolutionPlan(
        {
          ...EMPTY_LINE_ITEM,
          item_type: 'etiqueta',
          item_name: 'Etiqueta Nueva',
          format: ' 250cc ',
          quantity: 30,
          unit_price_net: 50,
          line_total_net: 1500,
        },
        'F-200',
        inventory,
      ),
    ).toEqual({
      normalizedFormat: '250cc',
      packagingInventoryId: null,
      shouldInsertInventory: true,
      inventoryInsertPayload: {
        item_type: 'etiqueta',
        item_name: 'Etiqueta Nueva',
        format: '250cc',
        current_stock: 30,
        unit_cost_net: 50,
      },
      inventoryUpdatePayload: null,
      movementPayload: {
        movement_type: 'entrada',
        quantity: 30,
        reference_type: 'purchase_invoice',
        notes: 'Factura F-200',
      },
    });
  });
});
