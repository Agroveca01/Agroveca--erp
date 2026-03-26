import { describe, expect, it } from 'vitest';

import {
  getOrderPreparationSummary,
  hasVipRewardPending,
} from './orderPreparationBoardHelpers';

describe('orderPreparationBoardHelpers', () => {
  const orders = [
    {
      id: 'o-1',
      order_number: '1001',
      status: 'pending',
      reward_eligible: true,
      reward_included: false,
      is_vip_milestone: true,
      customer: { name: 'Cliente VIP', email: 'vip@test.com' },
    },
    {
      id: 'o-2',
      order_number: '1002',
      status: 'preparing',
      reward_eligible: true,
      reward_included: false,
      is_vip_milestone: false,
      customer: { name: 'Cliente VIP 2', email: 'vip2@test.com' },
    },
    {
      id: 'o-3',
      order_number: '1003',
      status: 'ready',
      reward_eligible: false,
      reward_included: false,
      is_vip_milestone: false,
      customer: { name: 'Cliente Listo', email: 'ready@test.com' },
    },
    {
      id: 'o-4',
      order_number: '1004',
      status: 'delivered',
      reward_eligible: false,
      reward_included: false,
      is_vip_milestone: false,
      customer: { name: 'Cliente Entregado', email: 'done@test.com' },
    },
  ];

  it('builds preparation summary counts and VIP buckets', () => {
    const summary = getOrderPreparationSummary(orders);

    expect(summary.pendingOrders).toHaveLength(2);
    expect(summary.vipPendingOrders).toHaveLength(2);
    expect(summary.vipMilestoneOrders).toHaveLength(1);
    expect(summary.readyOrdersCount).toBe(1);
    expect(summary.shippedOrDeliveredCount).toBe(1);
  });

  it('detects pending VIP rewards', () => {
    expect(hasVipRewardPending(orders[0])).toBe(true);
    expect(hasVipRewardPending({ reward_eligible: true, reward_included: true })).toBe(false);
    expect(hasVipRewardPending({ reward_eligible: false, reward_included: false })).toBe(false);
  });
});
