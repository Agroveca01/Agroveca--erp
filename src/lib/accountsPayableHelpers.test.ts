import { describe, expect, it } from 'vitest';

import {
  getDaysUntilDue,
  getPayableStatus,
  getPayablesSummary,
} from './accountsPayableHelpers';

describe('accountsPayableHelpers', () => {
  const referenceDate = new Date('2026-03-26T00:00:00.000Z');

  it('calculates days until due relative to a reference date', () => {
    expect(getDaysUntilDue('2026-03-30', referenceDate)).toBe(4);
    expect(getDaysUntilDue('2026-03-24', referenceDate)).toBe(-2);
  });

  it('classifies overdue, due-soon, and current payables', () => {
    expect(getPayableStatus('2026-03-24', referenceDate)).toMatchObject({
      isOverdue: true,
      isDueSoon: false,
      tone: 'overdue',
      label: 'Vencida hace 2 dias',
    });

    expect(getPayableStatus('2026-03-30', referenceDate)).toMatchObject({
      isOverdue: false,
      isDueSoon: true,
      tone: 'due-soon',
      label: 'Vence en 4 dias',
    });

    expect(getPayableStatus('2026-04-10', referenceDate)).toMatchObject({
      isOverdue: false,
      isDueSoon: false,
      tone: 'current',
      label: 'Vence en 15 dias',
    });
  });

  it('summarizes pending debt buckets correctly', () => {
    const payables = [
      {
        id: 'ap-1',
        invoice_id: 'i-1',
        supplier_id: 's-1',
        amount_due: 10000,
        amount_paid: 0,
        due_date: '2026-03-24',
        status: 'pending',
        aging_category: null,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 'ap-2',
        invoice_id: 'i-2',
        supplier_id: 's-2',
        amount_due: 15000,
        amount_paid: 0,
        due_date: '2026-03-30',
        status: 'pending',
        aging_category: null,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 'ap-3',
        invoice_id: 'i-3',
        supplier_id: 's-3',
        amount_due: 20000,
        amount_paid: 0,
        due_date: '2026-04-10',
        status: 'pending',
        aging_category: null,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 'ap-4',
        invoice_id: 'i-4',
        supplier_id: 's-4',
        amount_due: 5000,
        amount_paid: 5000,
        due_date: '2026-03-20',
        status: 'paid',
        aging_category: null,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      },
    ];

    const summary = getPayablesSummary(payables, referenceDate);

    expect(summary.pendingPayables).toHaveLength(3);
    expect(summary.overduePayables).toHaveLength(1);
    expect(summary.dueSoonPayables).toHaveLength(1);
    expect(summary.currentPayables).toHaveLength(1);
    expect(summary.totalDebt).toBe(45000);
  });
});
