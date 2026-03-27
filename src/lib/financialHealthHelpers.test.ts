import { describe, expect, it } from 'vitest';

import {
  getCustomerRankBadge,
  getLiquidityTone,
  getLiquiditySummary,
  getMonthlyCompletedOrders,
  getNetCashFlowTone,
  getPaymentScoreBadge,
  getReceivablesAgingSummary,
  getRevenueChannels,
  getTopCustomers,
} from './financialHealthHelpers';

describe('financialHealthHelpers', () => {
  it('calculates liquidity summary from payables and receivables', () => {
    expect(
      getLiquiditySummary(
        [
          { id: 'p1', invoice_id: 'i1', supplier_id: 's1', amount_due: 1000, amount_paid: 0, due_date: '2026-03-20', status: 'pending', aging_category: null, created_at: '2026-03-01', updated_at: '2026-03-01' },
        ],
        [
          { id: 'r1', sales_order_id: null, customer_id: 'c1', customer_name: 'Cliente 1', invoice_number: null, amount_due: 3000, amount_paid: 0, due_date: '2026-03-20', status: 'pending', days_overdue: 0, payment_score: 'A', created_at: '2026-03-01', updated_at: '2026-03-01' },
        ],
      ),
    ).toEqual({
      totalPayables: 1000,
      totalReceivables: 3000,
      liquidityRatio: 3,
      netCashFlow: 2000,
    });
  });

  it('builds monthly revenue channels from completed orders only', () => {
    const monthlyOrders = getMonthlyCompletedOrders(
      [
        { id: 'o1', order_number: '1', product_id: 'p1', quantity: 1, unit_price: 1000, subtotal: 1000, commission: 0, shipping_cost: 0, total_amount: 1190, channel: 'shopify', order_date: '2026-03-10', status: 'completed', notes: null },
        { id: 'o2', order_number: '2', product_id: 'p1', quantity: 1, unit_price: 2000, subtotal: 2000, commission: 0, shipping_cost: 0, total_amount: 2380, channel: 'wholesale', order_date: '2026-03-12', status: 'completed', notes: null },
        { id: 'o3', order_number: '3', product_id: 'p1', quantity: 1, unit_price: 1500, subtotal: 1500, commission: 0, shipping_cost: 0, total_amount: 1785, channel: 'direct', order_date: '2026-03-15', status: 'completed', notes: null },
        { id: 'o4', order_number: '4', product_id: 'p1', quantity: 1, unit_price: 500, subtotal: 500, commission: 0, shipping_cost: 0, total_amount: 595, channel: 'shopify', order_date: '2026-02-28', status: 'completed', notes: null },
      ],
      new Date('2026-03-26T00:00:00.000Z'),
    );

    expect(getRevenueChannels(monthlyOrders)).toEqual({
      totalRevenue: 5355,
      revenueChannels: [
        { label: 'Shopify (Minorista)', revenue: 1190, percentage: 22.22222222222222, barClass: 'bg-[#10b981]', amountClass: 'text-[#10b981]' },
        { label: 'Distribuidores (Mayorista)', revenue: 2380, percentage: 44.44444444444444, barClass: 'bg-gradient-to-r from-blue-500 to-cyan-500', amountClass: 'text-blue-400' },
        { label: 'Directo / Otros', revenue: 1785, percentage: 33.33333333333333, barClass: 'bg-gradient-to-r from-violet-500 to-fuchsia-500', amountClass: 'text-violet-300' },
      ],
    });
  });

  it('builds top customers and receivables aging buckets', () => {
    const customers = [
      { id: 'c1', name: 'Cliente 1', email: 'c1@test.com', phone: null, address: null, total_purchases: 0, total_spent: 0, loyalty_tier: 1, reward_count: 0, last_purchase_date: null, created_at: '2026-03-01', updated_at: '2026-03-01' },
      { id: 'c2', name: 'Cliente 2', email: 'c2@test.com', phone: null, address: null, total_purchases: 0, total_spent: 0, loyalty_tier: 2, reward_count: 0, last_purchase_date: null, created_at: '2026-03-01', updated_at: '2026-03-01' },
    ];
    const customerOrders = [
      { id: 'co1', customer_id: 'c1', order_number: 'A1', order_date: '2026-03-10', total_amount: 10000, items: [{ quantity: 2 }, { quantity: 3 }], status: 'completed', reward_eligible: false, reward_included: false, created_at: '2026-03-10' },
      { id: 'co2', customer_id: 'c2', order_number: 'A2', order_date: '2026-03-11', total_amount: 5000, items: [{ quantity: 1 }], status: 'completed', reward_eligible: false, reward_included: false, created_at: '2026-03-11' },
    ];
    const receivables = [
      { id: 'r1', sales_order_id: null, customer_id: 'c1', customer_name: 'Cliente 1', invoice_number: null, amount_due: 3000, amount_paid: 0, due_date: '2026-03-20', status: 'pending', days_overdue: 0, payment_score: 'A', created_at: '2026-03-20', updated_at: '2026-03-20' },
      { id: 'r2', sales_order_id: null, customer_id: 'c2', customer_name: 'Cliente 2', invoice_number: null, amount_due: 2000, amount_paid: 0, due_date: '2026-03-05', status: 'pending', days_overdue: 10, payment_score: 'B', created_at: '2026-03-05', updated_at: '2026-03-05' },
      { id: 'r3', sales_order_id: null, customer_id: 'c2', customer_name: 'Cliente 2', invoice_number: null, amount_due: 1000, amount_paid: 0, due_date: '2026-02-01', status: 'pending', days_overdue: 40, payment_score: 'C', created_at: '2026-02-01', updated_at: '2026-02-01' },
    ];

    expect(getTopCustomers(customers, customerOrders, receivables)).toMatchObject([
      { id: 'c1', totalSpent: 10000, totalUnits: 5, orderCount: 1, paymentScore: 'A' },
      { id: 'c2', totalSpent: 5000, totalUnits: 1, orderCount: 1, paymentScore: 'B' },
    ]);

    expect(getReceivablesAgingSummary(receivables)).toEqual({
      current: { count: 1, totalAmount: 3000 },
      overdue1to15: { count: 1, totalAmount: 2000 },
      critical: { count: 1, totalAmount: 1000 },
    });
  });

  it('builds display tones for liquidity, cash flow, and payment score badges', () => {
    expect(getLiquidityTone(0, 0)).toEqual({
      cardClass: 'from-[#10b981]/80 to-[#10b981]/90 border-[#10b981]/50',
      textClass: 'text-emerald-200',
      label: 'Sin cuentas por pagar pendientes',
    });

    expect(getLiquidityTone(1000, 1.5)).toEqual({
      cardClass: 'from-[#10b981]/80 to-[#10b981]/90 border-[#10b981]/50',
      textClass: 'text-emerald-200',
      label: 'Autofinanciado',
    });

    expect(getLiquidityTone(1000, 0.5)).toEqual({
      cardClass: 'from-orange-800 to-orange-900 border-orange-700/50',
      textClass: 'text-orange-200',
      label: 'Deficit',
    });

    expect(getNetCashFlowTone(500)).toEqual({
      cardClass: 'from-blue-800 to-blue-900 border-blue-700/50',
      textClass: 'text-blue-200',
      label: 'Superavit',
    });

    expect(getNetCashFlowTone(-100)).toEqual({
      cardClass: 'from-purple-800 to-purple-900 border-purple-700/50',
      textClass: 'text-purple-200',
      label: 'Deficit',
    });

    expect(getPaymentScoreBadge('A')).toEqual({
      className: 'bg-green-100 text-green-800',
      label: 'Score: A',
    });

    expect(getPaymentScoreBadge('C')).toEqual({
      className: 'bg-red-100 text-red-800',
      label: 'Score: C',
    });

    expect(getCustomerRankBadge(0)).toEqual({
      className: 'bg-amber-500',
      label: '1',
    });

    expect(getCustomerRankBadge(3)).toEqual({
      className: 'bg-slate-600',
      label: '4',
    });
  });
});
