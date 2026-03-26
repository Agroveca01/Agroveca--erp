import { normalizeUserRole } from './supabase';

export type AppModule =
  | 'dashboard'
  | 'inventory'
  | 'production'
  | 'costing'
  | 'pricing'
  | 'wholesale'
  | 'sales'
  | 'crm'
  | 'orders'
  | 'users'
  | 'shopify'
  | 'fiscal'
  | 'purchases'
  | 'stock'
  | 'production-sheet'
  | 'suppliers'
  | 'invoices'
  | 'payables'
  | 'financial-health'
  | 'kpis'
  | 'config';

export const getRolePermissions = (role?: string | null): AppModule[] => {
  const normalizedRole = normalizeUserRole(role);

  if (normalizedRole === 'admin') {
    return ['dashboard', 'kpis', 'financial-health', 'fiscal', 'suppliers', 'invoices', 'payables', 'purchases', 'stock', 'production-sheet', 'inventory', 'production', 'costing', 'pricing', 'wholesale', 'sales', 'orders', 'crm', 'shopify', 'users', 'config'];
  }

  if (normalizedRole === 'operario') {
    return ['dashboard', 'production-sheet', 'inventory', 'stock'];
  }

  if (normalizedRole === 'vendedor') {
    return ['dashboard', 'pricing', 'wholesale', 'sales', 'orders', 'crm', 'financial-health'];
  }

  return ['dashboard'];
};
