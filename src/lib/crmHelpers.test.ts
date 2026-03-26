import { describe, expect, it } from 'vitest';

import { filterCRMCustomers, getCRMSummary } from './crmHelpers';

describe('crmHelpers', () => {
  const customers = [
    {
      id: 'c1',
      name: 'Ana Verde',
      email: 'ana@test.com',
      total_spent: 50000,
      loyalty_tier: 3,
      order_count: 10,
    },
    {
      id: 'c2',
      name: 'Bruno Campo',
      email: 'bruno@test.com',
      total_spent: 20000,
      loyalty_tier: 2,
      order_count: 4,
    },
    {
      id: 'c3',
      name: 'Carla Brote',
      email: 'carla@test.com',
      total_spent: 10000,
      loyalty_tier: 1,
      order_count: 2,
    },
  ];

  it('filters CRM customers by name or email', () => {
    expect(filterCRMCustomers(customers, 'bruno')).toMatchObject([{ id: 'c2' }]);
    expect(filterCRMCustomers(customers, 'test.com')).toHaveLength(3);
    expect(filterCRMCustomers(customers, '')).toHaveLength(3);
  });

  it('builds CRM summary metrics and tier distribution', () => {
    expect(getCRMSummary(customers, 'ana')).toEqual({
      filteredCustomers: [customers[0]],
      topCustomers: customers,
      totalLTV: 80000,
      avgLTV: 80000 / 3,
      tierDistribution: {
        brote: 1,
        crecimiento: 1,
        bosque: 1,
      },
      maxTierCount: 1,
    });
  });
});
