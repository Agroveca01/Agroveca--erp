export interface ShopifySimulatorProductLike {
  product: {
    id: string;
  };
  basePriceGross: number;
  basePriceNet: number;
  realCost: number;
  netProfitNet: number;
  netMarginNet: number;
}

export interface ShopifySimulatorSummary<T extends ShopifySimulatorProductLike> {
  selectedProductData?: T;
  totalRevenueGross: number;
  totalRevenueNet: number;
  totalVATDebit: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  roi: number;
}

export const getShopifySimulatorSummary = <T extends ShopifySimulatorProductLike>(
  products: T[],
  selectedProductId: string,
  estimatedSales: number,
  adsInvestment: number,
): ShopifySimulatorSummary<T> => {
  const selectedProductData = products.find((product) => product.product.id === selectedProductId);
  const totalRevenueGross = selectedProductData ? selectedProductData.basePriceGross * estimatedSales : 0;
  const totalRevenueNet = selectedProductData ? selectedProductData.basePriceNet * estimatedSales : 0;
  const totalVATDebit = totalRevenueGross - totalRevenueNet;
  const totalCosts = selectedProductData ? selectedProductData.realCost * estimatedSales : 0;
  const grossProfit = totalRevenueNet - totalCosts;
  const netProfit = grossProfit - adsInvestment;
  const roi = adsInvestment > 0 ? (netProfit / adsInvestment) * 100 : 0;

  return {
    selectedProductData,
    totalRevenueGross,
    totalRevenueNet,
    totalVATDebit,
    totalCosts,
    grossProfit,
    netProfit,
    roi,
  };
};
