import { AccountsPayable, AccountsReceivable, Customer, CustomerOrder, SalesOrder } from './supabase';

export type TopCustomer = Customer & {
  orderCount: number;
  totalSpent: number;
  totalUnits: number;
  paymentScore: string | null;
};

export type RevenueChannel = {
  label: string;
  revenue: number;
  percentage: number;
  barClass: string;
  amountClass: string;
};

export interface LiquiditySummary {
  totalPayables: number;
  totalReceivables: number;
  liquidityRatio: number;
  netCashFlow: number;
}

export interface ReceivableBucket {
  count: number;
  totalAmount: number;
}

export interface ReceivablesAgingSummary {
  current: ReceivableBucket;
  overdue1to15: ReceivableBucket;
  critical: ReceivableBucket;
}

export interface FinancialHealthTone {
  cardClass: string;
  textClass: string;
  label: string;
}

export interface PaymentScoreBadge {
  className: string;
  label: string;
}

export interface CustomerRankBadge {
  className: string;
  label: string;
}

export const getLiquiditySummary = (
  payables: AccountsPayable[],
  receivables: AccountsReceivable[],
): LiquiditySummary => {
  const totalPayables = payables.reduce((sum, payable) => sum + payable.amount_due, 0);
  const totalReceivables = receivables.reduce((sum, receivable) => sum + receivable.amount_due, 0);

  return {
    totalPayables,
    totalReceivables,
    liquidityRatio: totalPayables > 0 ? totalReceivables / totalPayables : 0,
    netCashFlow: totalReceivables - totalPayables,
  };
};

export const getLiquidityTone = (
  totalPayables: number,
  liquidityRatio: number,
): FinancialHealthTone => {
  if (totalPayables === 0) {
    return {
      cardClass: 'from-[#10b981]/80 to-[#10b981]/90 border-[#10b981]/50',
      textClass: 'text-emerald-200',
      label: 'Sin cuentas por pagar pendientes',
    };
  }

  if (liquidityRatio >= 1) {
    return {
      cardClass: 'from-[#10b981]/80 to-[#10b981]/90 border-[#10b981]/50',
      textClass: 'text-emerald-200',
      label: 'Autofinanciado',
    };
  }

  return {
    cardClass: 'from-orange-800 to-orange-900 border-orange-700/50',
    textClass: 'text-orange-200',
    label: 'Deficit',
  };
};

export const getNetCashFlowTone = (netCashFlow: number): FinancialHealthTone => {
  if (netCashFlow >= 0) {
    return {
      cardClass: 'from-blue-800 to-blue-900 border-blue-700/50',
      textClass: 'text-blue-200',
      label: 'Superavit',
    };
  }

  return {
    cardClass: 'from-purple-800 to-purple-900 border-purple-700/50',
    textClass: 'text-purple-200',
    label: 'Deficit',
  };
};

export const getPaymentScoreBadge = (score: string): PaymentScoreBadge => {
  if (score === 'A') {
    return {
      className: 'bg-green-100 text-green-800',
      label: 'Score: A',
    };
  }

  if (score === 'B') {
    return {
      className: 'bg-yellow-100 text-yellow-800',
      label: 'Score: B',
    };
  }

  return {
    className: 'bg-red-100 text-red-800',
    label: `Score: ${score}`,
  };
};

export const getCustomerRankBadge = (index: number): CustomerRankBadge => {
  if (index === 0) {
    return {
      className: 'bg-amber-500',
      label: '1',
    };
  }

  if (index === 1) {
    return {
      className: 'bg-slate-400',
      label: '2',
    };
  }

  if (index === 2) {
    return {
      className: 'bg-orange-600',
      label: '3',
    };
  }

  return {
    className: 'bg-slate-600',
    label: String(index + 1),
  };
};

export const getMonthlyCompletedOrders = (orders: SalesOrder[], referenceDate = new Date()): SalesOrder[] => {
  const referenceMonth = referenceDate.getMonth();
  const referenceYear = referenceDate.getFullYear();

  return orders.filter((order) => {
    const orderDate = new Date(order.order_date);
    return order.status === 'completed' && orderDate.getMonth() === referenceMonth && orderDate.getFullYear() === referenceYear;
  });
};

export const getRevenueChannels = (orders: SalesOrder[]): { totalRevenue: number; revenueChannels: RevenueChannel[] } => {
  const shopifyRevenue = orders.filter((order) => order.channel === 'shopify').reduce((sum, order) => sum + order.total_amount, 0);
  const wholesaleRevenue = orders.filter((order) => order.channel === 'wholesale').reduce((sum, order) => sum + order.total_amount, 0);
  const otherRevenue = orders
    .filter((order) => order.channel !== 'shopify' && order.channel !== 'wholesale')
    .reduce((sum, order) => sum + order.total_amount, 0);
  const totalRevenue = shopifyRevenue + wholesaleRevenue + otherRevenue;

  return {
    totalRevenue,
    revenueChannels: [
      {
        label: 'Shopify (Minorista)',
        revenue: shopifyRevenue,
        percentage: totalRevenue > 0 ? (shopifyRevenue / totalRevenue) * 100 : 0,
        barClass: 'bg-[#10b981]',
        amountClass: 'text-[#10b981]',
      },
      {
        label: 'Distribuidores (Mayorista)',
        revenue: wholesaleRevenue,
        percentage: totalRevenue > 0 ? (wholesaleRevenue / totalRevenue) * 100 : 0,
        barClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        amountClass: 'text-blue-400',
      },
      {
        label: 'Directo / Otros',
        revenue: otherRevenue,
        percentage: totalRevenue > 0 ? (otherRevenue / totalRevenue) * 100 : 0,
        barClass: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
        amountClass: 'text-violet-300',
      },
    ],
  };
};

export const getTopCustomers = (
  customers: Customer[],
  customerOrders: CustomerOrder[],
  receivables: AccountsReceivable[],
): TopCustomer[] => {
  const activeCustomerOrders = customerOrders.filter((order) => order.status !== 'cancelled');

  return customers
    .map((customer) => {
      const ordersForCustomer = activeCustomerOrders.filter((order) => order.customer_id === customer.id);
      const receivablesForCustomer = receivables.filter((receivable) => receivable.customer_id === customer.id);
      const totalSpent = ordersForCustomer.reduce((sum, order) => sum + order.total_amount, 0);
      const totalUnits = ordersForCustomer.reduce(
        (sum, order) => sum + order.items.reduce((itemsSum, item) => itemsSum + (item.quantity || 0), 0),
        0,
      );
      const paymentScore = receivablesForCustomer.length > 0
        ? [...receivablesForCustomer].sort((a, b) => b.created_at.localeCompare(a.created_at))[0].payment_score
        : null;

      return {
        ...customer,
        totalSpent,
        totalUnits,
        orderCount: ordersForCustomer.length,
        paymentScore,
      };
    })
    .filter((customer) => customer.orderCount > 0 || customer.totalSpent > 0 || customer.paymentScore)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);
};

export const getReceivablesAgingSummary = (receivables: AccountsReceivable[]): ReceivablesAgingSummary => {
  const current = receivables.filter((receivable) => receivable.days_overdue === 0);
  const overdue1to15 = receivables.filter((receivable) => receivable.days_overdue > 0 && receivable.days_overdue <= 15);
  const critical = receivables.filter((receivable) => receivable.days_overdue > 30);

  return {
    current: {
      count: current.length,
      totalAmount: current.reduce((sum, receivable) => sum + receivable.amount_due, 0),
    },
    overdue1to15: {
      count: overdue1to15.length,
      totalAmount: overdue1to15.reduce((sum, receivable) => sum + receivable.amount_due, 0),
    },
    critical: {
      count: critical.length,
      totalAmount: critical.reduce((sum, receivable) => sum + receivable.amount_due, 0),
    },
  };
};
