import { describe, expect, it } from 'vitest';

import {
  buildSalesOrderCreationPayloads,
  calculateSalesSimulation,
  getChannelColor,
  getSalesDashboardSummary,
  isSalesChannel,
} from './salesHelpers';

describe('salesHelpers', () => {
  it('validates supported sales channels and channel colors', () => {
    expect(isSalesChannel('shopify')).toBe(true);
    expect(isSalesChannel('unknown')).toBe(false);
    expect(getChannelColor('wholesale')).toBe('bg-purple-100 text-purple-700');
    expect(getChannelColor('unknown')).toBe('bg-slate-100 text-slate-700');
  });

  it('builds sales dashboard summary and current month revenue', () => {
    const orders = [
      { id: '1', order_number: 'ORD-1', product_id: 'p1', quantity: 1, unit_price: 1000, subtotal: 1000, commission: 50, shipping_cost: 100, total_amount: 1100, channel: 'shopify', order_date: '2026-03-10', status: 'completed', notes: null },
      { id: '2', order_number: 'ORD-2', product_id: 'p2', quantity: 2, unit_price: 2000, subtotal: 4000, commission: 0, shipping_cost: 200, total_amount: 4200, channel: 'direct', order_date: '2026-03-11', status: 'completed', notes: null },
      { id: '3', order_number: 'ORD-3', product_id: 'p3', quantity: 1, unit_price: 1500, subtotal: 1500, commission: 0, shipping_cost: 100, total_amount: 1600, channel: 'other', order_date: '2026-02-28', status: 'completed', notes: null },
    ];

    expect(getSalesDashboardSummary(orders, new Date('2026-03-26T00:00:00.000Z'))).toEqual({
      totalRevenue: 6900,
      totalOrders: 3,
      averageOrderValue: 2300,
      totalCommissions: 50,
      monthlyOrders: [orders[0], orders[1]],
      monthlyRevenue: 5300,
    });
  });

  it('calculates the sales simulator output', () => {
    expect(
      calculateSalesSimulation({
        avgOrderValue: 50000,
        newCustomers: 100,
        returningCustomers: 50,
        vipDiscountRate: 0.1,
      }),
    ).toEqual({
      newRevenue: 5000000,
      returningRevenue: 2500000,
      vipDiscountImpact: 50000,
      netReturningRevenue: 2450000,
      totalRevenue: 7450000,
      totalOrders: 150,
      avgDiscount: 0.6711409395973155,
    });
  });

  it('builds linked customer order and sales order payloads from the same sale', () => {
    expect(
      buildSalesOrderCreationPayloads({
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
          units_per_batch: 200,
        },
        businessConfig: {
          id: 'cfg1',
          company_name: 'CTP',
          currency: 'CLP',
          shopify_commission_pct: 8,
          meta_ads_budget: 100000,
          target_monthly_sales: 5000000,
          shipping_cost: 3500,
          default_margin_target: 40,
        },
        quantity: 3,
        channel: 'shopify',
        notes: 'Cliente recurrente',
        orderNumber: 'ORD-123',
        orderDate: '2026-03-27',
      }),
    ).toEqual({
      customerOrder: {
        order_number: 'ORD-123',
        order_date: '2026-03-27',
        total_amount: 21470,
        items: [
          {
            product_id: 'p1',
            name: 'Limpiador Citrus',
            quantity: 3,
            unit_price: 5990,
            sku: 'CTP-001',
          },
        ],
        status: 'pending',
      },
      salesOrder: {
        order_number: 'ORD-123',
        product_id: 'p1',
        quantity: 3,
        unit_price: 5990,
        subtotal: 17970,
        commission: 1437.6,
        shipping_cost: 3500,
        total_amount: 21470,
        channel: 'shopify',
        order_date: '2026-03-27',
        status: 'completed',
        notes: 'Cliente recurrente',
      },
    });
  });
});
