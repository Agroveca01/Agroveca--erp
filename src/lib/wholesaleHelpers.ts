import { FixedCostsConfig, FormatCost, Product } from './supabase';
import { calculateNetFromGross, IVA_RATE } from './taxUtils';

export interface WholesaleProductCostBreakdown {
  product: Product;
  rawMaterialCost: number;
  containerCost: number;
  packagingCost: number;
  labelCost: number;
  totalCost: number;
  pvpGross: number;
  pvpNet: number;
  pvpVAT: number;
  distributorPriceGross: number;
  distributorPriceNet: number;
  distributorVAT: number;
  ctpProfitNet: number;
}

export interface WholesaleQuotationItem {
  product: Product;
  quantity: number;
  pvpGross: number;
  pvpNet: number;
  pvpVAT: number;
  discount: number;
  netPriceGross: number;
  netPriceNet: number;
  netPriceVAT: number;
  subtotalGross: number;
  subtotalNet: number;
  subtotalVAT: number;
}

export interface WholesaleQuotation {
  items: WholesaleQuotationItem[];
  subtotalGross: number;
  subtotalNet: number;
  subtotalVAT: number;
  shippingCost: number;
  totalGross: number;
  totalNet: number;
  totalVAT: number;
  totalCtpProfitNet: number;
  totalCostsNet: number;
}

export type WholesaleQuotationResult = WholesaleQuotation | null;

export const getWholesaleFormatCosts = (
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

export const getProductMOQ = (product: Product): number => {
  const formatLower = product.format.toLowerCase();

  if (formatLower.includes('rtu') && formatLower.includes('500')) {
    return 12;
  }

  if (formatLower.includes('100') || formatLower.includes('200')) {
    return 12;
  }

  return 12;
};

export const validateMOQ = (
  quotationItems: Record<string, number>,
  products: Product[],
): string | null => {
  for (const [productId, quantity] of Object.entries(quotationItems)) {
    if (quantity > 0) {
      const product = products.find((item) => item.id === productId);
      if (product) {
        const moq = getProductMOQ(product);
        if (quantity < moq) {
          return `${product.name} requiere un minimo de ${moq} unidades. Actualmente: ${quantity} unidades.`;
        }
      }
    }
  }

  return null;
};

export const calculateWholesaleQuotation = (
  quotationItems: Record<string, number>,
  productCosts: WholesaleProductCostBreakdown[],
  editableShippingCost: number,
  distributorDiscount: number,
): WholesaleQuotation | null => {
  const items: WholesaleQuotationItem[] = [];
  let subtotalGross = 0;
  let subtotalNet = 0;
  let subtotalVAT = 0;
  let totalCtpProfitNet = 0;
  let totalCostsNet = 0;

  for (const [productId, quantity] of Object.entries(quotationItems)) {
    if (quantity > 0) {
      const costBreakdown = productCosts.find((item) => item.product.id === productId);
      if (costBreakdown) {
        const discount = costBreakdown.pvpGross * distributorDiscount;
        const netPriceGross = costBreakdown.distributorPriceGross;
        const netPriceBreakdown = calculateNetFromGross(netPriceGross);

        const itemSubtotalGross = netPriceGross * quantity;
        const itemSubtotalNet = netPriceBreakdown.net * quantity;
        const itemSubtotalVAT = netPriceBreakdown.vat * quantity;

        items.push({
          product: costBreakdown.product,
          quantity,
          pvpGross: costBreakdown.pvpGross,
          pvpNet: costBreakdown.pvpNet,
          pvpVAT: costBreakdown.pvpVAT,
          discount,
          netPriceGross,
          netPriceNet: netPriceBreakdown.net,
          netPriceVAT: netPriceBreakdown.vat,
          subtotalGross: itemSubtotalGross,
          subtotalNet: itemSubtotalNet,
          subtotalVAT: itemSubtotalVAT,
        });

        subtotalGross += itemSubtotalGross;
        subtotalNet += itemSubtotalNet;
        subtotalVAT += itemSubtotalVAT;
        totalCtpProfitNet += costBreakdown.ctpProfitNet * quantity;
        totalCostsNet += costBreakdown.totalCost * quantity;
      }
    }
  }

  if (items.length === 0) {
    return null;
  }

  const totalGross = subtotalGross + editableShippingCost;
  const totalNet = subtotalNet + editableShippingCost / (1 + IVA_RATE);
  const totalVAT = totalGross - totalNet;
  const finalCtpProfit = totalCtpProfitNet - editableShippingCost / (1 + IVA_RATE);

  return {
    items,
    subtotalGross,
    subtotalNet,
    subtotalVAT,
    shippingCost: editableShippingCost,
    totalGross,
    totalNet,
    totalVAT,
    totalCtpProfitNet: finalCtpProfit,
    totalCostsNet,
  };
};
