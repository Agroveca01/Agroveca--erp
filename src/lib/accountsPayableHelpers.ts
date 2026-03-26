import { AccountsPayable } from './supabase';

export type PayableStatusTone = 'overdue' | 'due-soon' | 'current';

export interface PayableStatus {
  daysUntilDue: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  tone: PayableStatusTone;
  label: string;
}

export interface PayablesSummary {
  pendingPayables: AccountsPayable[];
  totalDebt: number;
  overduePayables: AccountsPayable[];
  dueSoonPayables: AccountsPayable[];
  currentPayables: AccountsPayable[];
}

export const getDaysUntilDue = (dueDate: string, referenceDate = new Date()) => {
  const due = new Date(dueDate);
  const diffTime = due.getTime() - referenceDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getPayableStatus = (dueDate: string, referenceDate = new Date()): PayableStatus => {
  const daysUntilDue = getDaysUntilDue(dueDate, referenceDate);
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 5;

  if (isOverdue) {
    return {
      daysUntilDue,
      isOverdue,
      isDueSoon,
      tone: 'overdue',
      label: `Vencida hace ${Math.abs(daysUntilDue)} dias`,
    };
  }

  if (isDueSoon) {
    return {
      daysUntilDue,
      isOverdue,
      isDueSoon,
      tone: 'due-soon',
      label: `Vence en ${daysUntilDue} dias`,
    };
  }

  return {
    daysUntilDue,
    isOverdue,
    isDueSoon,
    tone: 'current',
    label: `Vence en ${daysUntilDue} dias`,
  };
};

export const getPayablesSummary = (
  payables: AccountsPayable[],
  referenceDate = new Date(),
): PayablesSummary => {
  const pendingPayables = payables.filter((payable) => payable.status === 'pending');
  const overduePayables = pendingPayables.filter(
    (payable) => getPayableStatus(payable.due_date, referenceDate).isOverdue,
  );
  const dueSoonPayables = pendingPayables.filter(
    (payable) => getPayableStatus(payable.due_date, referenceDate).isDueSoon,
  );
  const currentPayables = pendingPayables.filter((payable) => {
    const status = getPayableStatus(payable.due_date, referenceDate);
    return !status.isOverdue && !status.isDueSoon;
  });

  return {
    pendingPayables,
    totalDebt: pendingPayables.reduce((sum, payable) => sum + payable.amount_due, 0),
    overduePayables,
    dueSoonPayables,
    currentPayables,
  };
};
