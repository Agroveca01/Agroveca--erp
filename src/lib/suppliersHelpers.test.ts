import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SUPPLIER_FORM,
  getSupplierStats,
  mapSupplierToForm,
} from './suppliersHelpers';

describe('suppliersHelpers', () => {
  it('provides stable default supplier form values', () => {
    expect(DEFAULT_SUPPLIER_FORM).toEqual({
      rut: '',
      business_name: '',
      trade_name: '',
      business_activity: '',
      address: '',
      phone: '',
      email: '',
      contact_person: '',
      payment_terms_days: 30,
      notes: '',
    });
  });

  it('maps suppliers into editable form state', () => {
    expect(
      mapSupplierToForm({
        id: 's1',
        rut: '12.345.678-9',
        business_name: 'Envases SPA',
        trade_name: null,
        business_activity: null,
        address: null,
        phone: null,
        email: null,
        contact_person: null,
        payment_terms_days: 45,
        is_active: true,
        notes: null,
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
      }),
    ).toEqual({
      rut: '12.345.678-9',
      business_name: 'Envases SPA',
      trade_name: '',
      business_activity: '',
      address: '',
      phone: '',
      email: '',
      contact_person: '',
      payment_terms_days: 45,
      notes: '',
    });
  });

  it('calculates supplier stats from invoices', () => {
    expect(
      getSupplierStats(
        [
          { id: 'i1', supplier_id: 's1', invoice_number: 'F1', invoice_date: '2026-03-01', payment_condition: 'credit', credit_days: 30, due_date: '2026-03-31', subtotal: 10000, vat_amount: 1900, total_amount: 11900, status: 'pending', paid_date: null, notes: null, created_at: '2026-03-01', updated_at: '2026-03-01' },
          { id: 'i2', supplier_id: 's1', invoice_number: 'F2', invoice_date: '2026-03-05', payment_condition: 'cash', credit_days: 0, due_date: null, subtotal: 5000, vat_amount: 950, total_amount: 5950, status: 'paid', paid_date: '2026-03-10', notes: null, created_at: '2026-03-05', updated_at: '2026-03-05' },
          { id: 'i3', supplier_id: 's2', invoice_number: 'F3', invoice_date: '2026-03-07', payment_condition: 'credit', credit_days: 15, due_date: '2026-03-22', subtotal: 3000, vat_amount: 570, total_amount: 3570, status: 'pending', paid_date: null, notes: null, created_at: '2026-03-07', updated_at: '2026-03-07' },
        ],
        's1',
      ),
    ).toEqual({
      totalSpent: 17850,
      pendingAmount: 11900,
      invoiceCount: 2,
    });
  });
});
