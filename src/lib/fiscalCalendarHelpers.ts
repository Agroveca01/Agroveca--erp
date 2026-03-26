import { Purchase, SalesOrder } from './supabase';
import { calculateNetFromGross } from './taxUtils';

export interface FiscalMonthData {
  monthlyOrders: SalesOrder[];
  monthlyPurchases: Purchase[];
}

export interface FiscalSummary {
  totalRevenueGross: number;
  totalRevenueNet: number;
  vatDebit: number;
  totalVatCredit: number;
  netVatToPay: number;
  ppmAmount: number;
  totalF29Reserve: number;
  totalCashAvailable: number;
  realProfitAvailable: number;
}

export interface WithdrawalSimulation {
  withdrawalWarning: boolean;
  remainingAfterWithdrawal: number;
}

export const getMonthlyFiscalData = (
  orders: SalesOrder[],
  purchases: Purchase[],
  referenceDate = new Date(),
): FiscalMonthData => {
  const referenceMonth = referenceDate.getMonth();
  const referenceYear = referenceDate.getFullYear();

  return {
    monthlyOrders: orders.filter((order) => {
      const orderDate = new Date(order.order_date);
      return orderDate.getMonth() === referenceMonth && orderDate.getFullYear() === referenceYear;
    }),
    monthlyPurchases: purchases.filter((purchase) => {
      const purchaseDate = new Date(purchase.purchase_date);
      return purchaseDate.getMonth() === referenceMonth && purchaseDate.getFullYear() === referenceYear;
    }),
  };
};

export const getFiscalSummary = (
  monthlyOrders: SalesOrder[],
  monthlyPurchases: Purchase[],
  ppmPercentage: number,
): FiscalSummary => {
  const totalRevenueGross = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const revenueBreakdown = calculateNetFromGross(totalRevenueGross);
  const totalRevenueNet = revenueBreakdown.net;
  const vatDebit = revenueBreakdown.vat;
  const totalVatCredit = monthlyPurchases.reduce((sum, purchase) => sum + purchase.vat_credit, 0);
  const netVatToPay = vatDebit - totalVatCredit;
  const ppmAmount = totalRevenueNet * (ppmPercentage / 100);
  const totalF29Reserve = netVatToPay + ppmAmount;
  const totalCashAvailable = totalRevenueGross;
  const realProfitAvailable = totalRevenueNet - totalF29Reserve;

  return {
    totalRevenueGross,
    totalRevenueNet,
    vatDebit,
    totalVatCredit,
    netVatToPay,
    ppmAmount,
    totalF29Reserve,
    totalCashAvailable,
    realProfitAvailable,
  };
};

export const isF29AlertPeriod = (referenceDate = new Date()) => {
  const currentDay = referenceDate.getDate();
  return currentDay >= 12 && currentDay <= 20;
};

export const simulateWithdrawal = (
  withdrawalAmount: number,
  realProfitAvailable: number,
): WithdrawalSimulation => {
  return {
    withdrawalWarning: withdrawalAmount > realProfitAvailable,
    remainingAfterWithdrawal: realProfitAvailable - withdrawalAmount,
  };
};
