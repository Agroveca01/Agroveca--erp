import { describe, expect, it } from 'vitest';

import { getRolePermissions } from './permissions';

describe('getRolePermissions', () => {
  it('grants the full admin menu', () => {
    expect(getRolePermissions('admin')).toEqual([
      'dashboard',
      'kpis',
      'financial-health',
      'fiscal',
      'suppliers',
      'invoices',
      'payables',
      'purchases',
      'stock',
      'production-sheet',
      'inventory',
      'production',
      'costing',
      'pricing',
      'wholesale',
      'sales',
      'orders',
      'crm',
      'shopify',
      'users',
      'config',
    ]);
  });

  it('normalizes legacy roles before mapping permissions', () => {
    expect(getRolePermissions('operator')).toEqual([
      'dashboard',
      'production-sheet',
      'inventory',
      'stock',
    ]);

    expect(getRolePermissions('VENTAS')).toEqual([
      'dashboard',
      'pricing',
      'wholesale',
      'sales',
      'orders',
      'crm',
      'financial-health',
    ]);
  });

  it('falls back to dashboard only for unknown roles', () => {
    expect(getRolePermissions('guest')).toEqual(['dashboard']);
    expect(getRolePermissions(undefined)).toEqual(['dashboard']);
  });
});
