import { calculateNetFromGross } from './taxUtils';

export interface DashboardWholesaleProductLike {
  product: {
    id: string;
    format: string;
    name: string;
  };
  distributorPriceGross: number;
  distributorPriceNet: number;
  distributorVAT: number;
  ctpProfitNetPerUnit: number;
  totalProductionCost: number;
  basePriceNet: number;
  netProfitNet: number;
}

export interface DashboardWholesaleComparison {
  revenue: number;
  profit: number;
}

export interface DashboardWholesaleSummary<T extends DashboardWholesaleProductLike> {
  selectedProducts: T[];
  subtotalGross: number;
  subtotalNet: number;
  subtotalVAT: number;
  totalCtpProfitNet: number;
  totalCostsNet: number;
  shippingNetBreakdown: ReturnType<typeof calculateNetFromGross>;
  totalGross: number;
  finalCtpProfit: number;
  totalUnitsSelected: number;
  shopifyComparison: DashboardWholesaleComparison;
  wholesaleProfit: number;
  profitDifference: number;
  profitDifferencePercent: number;
}

export const getDashboardWholesaleMOQError = <T extends DashboardWholesaleProductLike>(
  products: T[],
  quantities: Record<string, number>,
): string | null => {
  const rtuProducts = products.filter((product) => {
    const format = product.product.format.toLowerCase();
    return format.includes('rtu') && format.includes('500');
  });

  const concentrateProducts = products.filter((product) => {
    const format = product.product.format.toLowerCase();
    return (format.includes('100') || format.includes('200')) && !format.includes('rtu');
  });

  const rtuTotal = rtuProducts.reduce((sum, product) => sum + (quantities[product.product.id] || 0), 0);
  const concentrateTotal = concentrateProducts.reduce((sum, product) => sum + (quantities[product.product.id] || 0), 0);

  if (rtuTotal > 0 && rtuTotal < 12) {
    return `RTU-500cc: Minimo 12 unidades en total. Actualmente: ${rtuTotal}`;
  }

  if (concentrateTotal > 0 && concentrateTotal < 12) {
    return `Concentrados (100cc/200cc): Minimo 12 unidades en total. Actualmente: ${concentrateTotal}`;
  }

  return null;
};

export const getDashboardWholesaleSummary = <T extends DashboardWholesaleProductLike>(
  products: T[],
  quantities: Record<string, number>,
  shippingCost: number,
): DashboardWholesaleSummary<T> => {
  let subtotalGross = 0;
  let subtotalNet = 0;
  let subtotalVAT = 0;
  let totalCtpProfitNet = 0;
  let totalCostsNet = 0;

  const selectedProducts = products.filter((product) => (quantities[product.product.id] || 0) > 0);

  selectedProducts.forEach((product) => {
    const quantity = quantities[product.product.id] || 0;
    subtotalGross += product.distributorPriceGross * quantity;
    subtotalNet += product.distributorPriceNet * quantity;
    subtotalVAT += product.distributorVAT * quantity;
    totalCtpProfitNet += product.ctpProfitNetPerUnit * quantity;
    totalCostsNet += product.totalProductionCost * quantity;
  });

  const shippingNetBreakdown = calculateNetFromGross(shippingCost);
  const totalGross = subtotalGross + shippingCost;
  const finalCtpProfit = totalCtpProfitNet - shippingNetBreakdown.net;
  const totalUnitsSelected = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);

  const shopifyComparison = selectedProducts.reduce<DashboardWholesaleComparison>(
    (acc, product) => {
      const quantity = quantities[product.product.id] || 0;
      acc.revenue += product.basePriceNet * quantity;
      acc.profit += product.netProfitNet * quantity;
      return acc;
    },
    { revenue: 0, profit: 0 },
  );

  const wholesaleProfit = totalCtpProfitNet;
  const profitDifference = wholesaleProfit - shopifyComparison.profit;
  const profitDifferencePercent = shopifyComparison.profit > 0
    ? (profitDifference / shopifyComparison.profit) * 100
    : 0;

  return {
    selectedProducts,
    subtotalGross,
    subtotalNet,
    subtotalVAT,
    totalCtpProfitNet,
    totalCostsNet,
    shippingNetBreakdown,
    totalGross,
    finalCtpProfit,
    totalUnitsSelected,
    shopifyComparison,
    wholesaleProfit,
    profitDifference,
    profitDifferencePercent,
  };
};
