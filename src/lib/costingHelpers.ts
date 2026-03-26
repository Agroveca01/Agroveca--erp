import { BusinessConfig, FixedCostsConfig, FormatCost, Product } from './supabase';

export interface ProductCostAnalysisInput {
  totalCost: number;
  netProfit: number;
  netMargin: number;
  commission: number;
}

export interface EditableCostRow {
  rawMaterialCost: number;
  containerCost: number;
  packagingCost: number;
  labelCost: number;
  shippingCost: number;
  basePrice: number;
}

export const getFormatCostsByProduct = (
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

export const calculateEditableMetrics = (
  data: EditableCostRow,
  businessConfig: BusinessConfig | null,
): ProductCostAnalysisInput => {
  const totalCost = data.rawMaterialCost + data.containerCost + data.packagingCost + data.labelCost + data.shippingCost;
  const commission = businessConfig ? (data.basePrice * businessConfig.shopify_commission_pct) / 100 : 0;
  const netProfit = data.basePrice - totalCost - commission;
  const netMargin = data.basePrice > 0 ? (netProfit / data.basePrice) * 100 : 0;

  return { totalCost, netProfit, netMargin, commission };
};
