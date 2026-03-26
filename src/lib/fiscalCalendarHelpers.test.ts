import { describe, expect, it } from 'vitest';

import {
  getFiscalSummary,
  getMonthlyFiscalData,
  isF29AlertPeriod,
  simulateWithdrawal,
} from './fiscalCalendarHelpers';

describe('fiscalCalendarHelpers', () => {
  it('filters monthly sales and purchases by reference month', () => {
    const orders = [
      {
        id: 'o-1',
        order_number: 'SO-1',
        product_id: 'p-1',
        quantity: 10,
        unit_price: 1000,
        subtotal: 10000,
        commission: 0,
        shipping_cost: 0,
        total_amount: 11900,
        channel: 'web',
        order_date: '2026-03-10',
        status: 'paid',
        notes: null,
      },
      {
        id: 'o-2',
        order_number: 'SO-2',
        product_id: 'p-1',
        quantity: 5,
        unit_price: 1000,
        subtotal: 5000,
        commission: 0,
        shipping_cost: 0,
        total_amount: 5950,
        channel: 'web',
        order_date: '2026-02-28',
        status: 'paid',
        notes: null,
      },
    ];
    const purchases = [
      {
        id: 'p-1',
        purchase_date: '2026-03-05',
        supplier_name: 'Proveedor A',
        item_type: 'envase',
        item_name: 'Botella',
        quantity: 10,
        unit_price_gross: 119,
        total_gross: 1190,
        total_net: 1000,
        vat_credit: 190,
        invoice_number: null,
        notes: null,
        inventory_updated: true,
        created_at: '2026-03-05T00:00:00.000Z',
      },
      {
        id: 'p-2',
        purchase_date: '2026-02-25',
        supplier_name: 'Proveedor B',
        item_type: 'tapa',
        item_name: 'Tapa',
        quantity: 10,
        unit_price_gross: 119,
        total_gross: 1190,
        total_net: 1000,
        vat_credit: 190,
        invoice_number: null,
        notes: null,
        inventory_updated: true,
        created_at: '2026-02-25T00:00:00.000Z',
      },
    ];

    const monthly = getMonthlyFiscalData(orders, purchases, new Date('2026-03-26T00:00:00.000Z'));

    expect(monthly.monthlyOrders).toHaveLength(1);
    expect(monthly.monthlyPurchases).toHaveLength(1);
  });

  it('calculates fiscal reserves from monthly sales and purchases', () => {
    const summary = getFiscalSummary(
      [
        {
          id: 'o-1',
          order_number: 'SO-1',
          product_id: 'p-1',
          quantity: 10,
          unit_price: 1000,
          subtotal: 10000,
          commission: 0,
          shipping_cost: 0,
          total_amount: 11900,
          channel: 'web',
          order_date: '2026-03-10',
          status: 'paid',
          notes: null,
        },
      ],
      [
        {
          id: 'p-1',
          purchase_date: '2026-03-05',
          supplier_name: 'Proveedor A',
          item_type: 'envase',
          item_name: 'Botella',
          quantity: 10,
          unit_price_gross: 119,
          total_gross: 1190,
          total_net: 1000,
          vat_credit: 190,
          invoice_number: null,
          notes: null,
          inventory_updated: true,
          created_at: '2026-03-05T00:00:00.000Z',
        },
      ],
      1,
    );

    expect(summary).toEqual({
      totalRevenueGross: 11900,
      totalRevenueNet: 10000,
      vatDebit: 1900,
      totalVatCredit: 190,
      netVatToPay: 1710,
      ppmAmount: 100,
      totalF29Reserve: 1810,
      totalCashAvailable: 11900,
      realProfitAvailable: 8190,
    });
  });

  it('evaluates alert period and withdrawal warnings', () => {
    expect(isF29AlertPeriod(new Date('2026-03-15T00:00:00.000Z'))).toBe(true);
    expect(isF29AlertPeriod(new Date('2026-03-25T00:00:00.000Z'))).toBe(false);
    expect(simulateWithdrawal(9000, 8190)).toEqual({
      withdrawalWarning: true,
      remainingAfterWithdrawal: -810,
    });
    expect(simulateWithdrawal(5000, 8190)).toEqual({
      withdrawalWarning: false,
      remainingAfterWithdrawal: 3190,
    });
  });
});
