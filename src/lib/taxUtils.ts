export const IVA_RATE = 0.19;

export interface TaxBreakdown {
  gross: number;
  net: number;
  vat: number;
}

export function calculateNetFromGross(gross: number): TaxBreakdown {
  const net = gross / (1 + IVA_RATE);
  const vat = gross - net;

  return {
    gross,
    net,
    vat,
  };
}

export function calculateGrossFromNet(net: number): TaxBreakdown {
  const vat = net * IVA_RATE;
  const gross = net + vat;

  return {
    gross,
    net,
    vat,
  };
}

export function formatVATPercentage(): string {
  return `${(IVA_RATE * 100).toFixed(0)}%`;
}

export function calculateMarginOnNet(netRevenue: number, netCosts: number): number {
  if (netRevenue === 0) return 0;
  return ((netRevenue - netCosts) / netRevenue) * 100;
}

export function calculateNetProfit(netRevenue: number, netCosts: number): number {
  return netRevenue - netCosts;
}
