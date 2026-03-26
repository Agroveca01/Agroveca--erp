import { describe, expect, it } from 'vitest';

import { filterPreparedOrders, sanitizeOrderItems } from './orderPreparationHelpers';

describe('orderPreparationHelpers', () => {
  it('sanitizes nullable order items for printable output', () => {
    expect(
      sanitizeOrderItems([
        { name: 'Producto A', quantity: 2, sku: 'SKU-1' },
        { name: '', quantity: 0 },
      ]),
    ).toEqual([
      { name: 'Producto A', quantity: 2, sku: 'SKU-1' },
      { name: 'Producto sin nombre', quantity: 0, sku: undefined },
    ]);
  });

  it('filters prepared orders by status and search term', () => {
    const orders = [
      {
        id: 'o1',
        order_number: 'VIP-001',
        status: 'pending',
        reward_eligible: true,
        reward_included: false,
        customer: { name: 'Ana', email: 'ana@example.com' },
      },
      {
        id: 'o2',
        order_number: 'REG-002',
        status: 'ready',
        reward_eligible: false,
        reward_included: false,
        customer: { name: 'Bruno', email: 'bruno@example.com' },
      },
    ];

    expect(filterPreparedOrders(orders, 'ana', 'all')).toEqual([orders[0]]);
    expect(filterPreparedOrders(orders, '', 'ready')).toEqual([orders[1]]);
  });

  it('prioritizes reward-eligible orders before regular ones', () => {
    const orders = [
      {
        id: 'o1',
        order_number: 'REG-001',
        status: 'pending',
        reward_eligible: false,
        reward_included: false,
        customer: { name: 'Regular', email: 'regular@example.com' },
      },
      {
        id: 'o2',
        order_number: 'VIP-002',
        status: 'pending',
        reward_eligible: true,
        reward_included: false,
        customer: { name: 'VIP', email: 'vip@example.com' },
      },
    ];

    expect(filterPreparedOrders(orders, '', 'all').map((order) => order.id)).toEqual(['o2', 'o1']);
  });
});
