import { FixedCostsConfig, FormatCost, Product, SalesOrder } from './supabase';
import { calculateNetFromGross } from './taxUtils';

export interface DashboardProductMetrics {
  rawMaterialCost: number;
  containerCost: number;
  packagingCost: number;
  labelCost: number;
  shippingCost: number;
  totalProductionCost: number;
  basePriceGross: number;
  basePriceNet: number;
  basePriceVAT: number;
  shopifyCommissionGross: number;
  shopifyCommissionNet: number;
  realCost: number;
  netProfitNet: number;
  netMarginNet: number;
  distributorPriceGross: number;
  distributorPriceNet: number;
  distributorVAT: number;
  ctpProfitNetPerUnit: number;
  vatToReserve: number;
  unitsPerBatch: number;
}

export const getDashboardFormatCosts = (
  product: Product,
  formats: FormatCost[],
  fallbackCosts: FixedCostsConfig | null,
): { container: number; label: number } => {
  const formatLower = product.format.toLowerCase();

  for (const formatCost of formats) {
    const normalizedName = formatCost.format_name.toLowerCase().replace('cc', '').replace('rtu', '').trim();
    if (formatLower.includes(normalizedName)) {
      return { container: formatCost.container_cost, label: formatCost.label_cost };
    }
  }

  return {
    container: fallbackCosts?.container_cost || 450,
    label: fallbackCosts?.label_cost || 150,
  };
};

export const calculateDashboardProductMetrics = (
  product: Product,
  rawMaterialCostPer100L: number,
  costs: FixedCostsConfig | null,
  formats: FormatCost[],
  distributorDiscount: number,
): DashboardProductMetrics => {
  const unitsPerBatch = product.units_per_batch || 1;
  const rawMaterialCost = unitsPerBatch > 0 ? rawMaterialCostPer100L / unitsPerBatch : rawMaterialCostPer100L;
  const formatCosts = getDashboardFormatCosts(product, formats, costs);
  const containerCost = formatCosts.container;
  const labelCost = formatCosts.label;
  const packagingCost = costs?.packaging_cost || 500;
  const shippingCost = costs?.shipping_cost || 750;
  const totalProductionCost = rawMaterialCost + containerCost + packagingCost + labelCost;

  const basePriceGross = product.base_price;
  const basePriceBreakdown = calculateNetFromGross(basePriceGross);
  const basePriceNet = basePriceBreakdown.net;
  const basePriceVAT = basePriceBreakdown.vat;
  const shopifyCommissionNet = basePriceNet * 0.05;
  const shopifyCommissionGross = shopifyCommissionNet * 1.19;
  const realCost = totalProductionCost + shopifyCommissionNet + shippingCost;
  const netProfitNet = basePriceNet - realCost;
  const netMarginNet = basePriceNet > 0 ? (netProfitNet / basePriceNet) * 100 : 0;

  const distributorPriceGross = basePriceGross * (1 - distributorDiscount);
  const distributorBreakdown = calculateNetFromGross(distributorPriceGross);
  const distributorPriceNet = distributorBreakdown.net;
  const distributorVAT = distributorBreakdown.vat;
  const ctpProfitNetPerUnit = distributorPriceNet - totalProductionCost;

  return {
    rawMaterialCost,
    containerCost,
    packagingCost,
    labelCost,
    shippingCost,
    totalProductionCost,
    basePriceGross,
    basePriceNet,
    basePriceVAT,
    shopifyCommissionGross,
    shopifyCommissionNet,
    realCost,
    netProfitNet,
    netMarginNet,
    distributorPriceGross,
    distributorPriceNet,
    distributorVAT,
    ctpProfitNetPerUnit,
    vatToReserve: basePriceVAT,
    unitsPerBatch,
  };
};

export const getMonthlyRevenueSummary = (orders: SalesOrder[], now = new Date()) => {
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthlyOrders = orders.filter((order) => {
    const orderDate = new Date(order.order_date);
    return orderDate.getMonth() === month && orderDate.getFullYear() === year;
  });

  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const monthlyRevenueBreakdown = calculateNetFromGross(monthlyRevenue);

  return {
    monthlyOrders,
    monthlyRevenue,
    monthlyRevenueBreakdown,
  };
};
