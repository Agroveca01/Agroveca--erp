import { describe, expect, it } from 'vitest';

import {
  calculateDashboardProductMetrics,
  getDashboardFormatCosts,
  getMonthlyRevenueSummary,
} from './dashboardFinancialHelpers';

describe('dashboardFinancialHelpers', () => {
  it('matches format costs with normalized format names', () => {
    expect(
      getDashboardFormatCosts(
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
          base_price: 5990,
        },
        [
          {
            id: 'f1',
            format_name: '500cc',
            container_cost: 550,
            label_cost: 150,
            created_at: '2026-03-26T00:00:00.000Z',
            updated_at: '2026-03-26T00:00:00.000Z',
          },
        ],
        null,
      ),
    ).toEqual({ container: 550, label: 150 });
  });

  it('calculates dashboard financial metrics consistently', () => {
    expect(
      calculateDashboardProductMetrics(
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
          units_per_batch: 50,
        },
        2500,
        {
          id: 'fc1',
          container_cost: 450,
          packaging_cost: 500,
          label_cost: 150,
          shipping_cost: 750,
          updated_at: '2026-03-26T00:00:00.000Z',
          updated_by: null,
        },
        [
          {
            id: 'format1',
            format_name: '500cc',
            container_cost: 550,
            label_cost: 150,
            created_at: '2026-03-26T00:00:00.000Z',
            updated_at: '2026-03-26T00:00:00.000Z',
          },
        ],
        0.4,
      ),
    ).toMatchObject({
      rawMaterialCost: 50,
      containerCost: 550,
      packagingCost: 500,
      labelCost: 150,
      shippingCost: 750,
      totalProductionCost: 1250,
      unitsPerBatch: 50,
      vatToReserve: 950,
    });
  });

  it('summarizes monthly orders and revenue for the current month', () => {
    const summary = getMonthlyRevenueSummary(
      [
        {
          id: 'o1',
          order_number: 'SO-001',
          product_id: 'p1',
          quantity: 1,
          unit_price: 1190,
          subtotal: 1190,
          commission: 0,
          shipping_cost: 0,
          total_amount: 1190,
          channel: 'shopify',
          order_date: '2026-03-10T00:00:00.000Z',
          status: 'completed',
          notes: null,
          products: undefined,
        },
        {
          id: 'o2',
          order_number: 'SO-002',
          product_id: 'p2',
          quantity: 1,
          unit_price: 2380,
          subtotal: 2380,
          commission: 0,
          shipping_cost: 0,
          total_amount: 2380,
          channel: 'direct',
          order_date: '2026-02-10T00:00:00.000Z',
          status: 'completed',
          notes: null,
          products: undefined,
        },
      ],
      new Date('2026-03-20T00:00:00.000Z'),
    );

    expect(summary.monthlyOrders).toHaveLength(1);
    expect(summary.monthlyRevenue).toBe(1190);
    expect(summary.monthlyRevenueBreakdown).toEqual({ gross: 1190, net: 1000, vat: 190 });
  });
});
