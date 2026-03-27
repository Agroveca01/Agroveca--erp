import { FixedCostsConfig, Product } from './supabase';

export interface FormatCosts {
  container: number;
  label: number;
}

export interface VolumeDiscount {
  level: number;
  name: string;
  minQuantity: number;
  maxQuantity: number | null;
  discountPercent: number;
  description: string;
}

export interface PricingAnalysis {
  product: Product;
  rawMaterialCost: number;
  containerCost: number;
  packagingCost: number;
  labelCost: number;
  factoryCost: number;
  baseDistributorPrice: number;
  distributorPriceWithDiscount: number;
  finalMarginPercent: number;
  marginWarning: boolean;
  suggestedPVP: number;
  recommendedPVP70: number;
  currentShopifyPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  ourMargin: number;
  distributorMargin: number;
  totalProfit: number;
}

export const VOLUME_DISCOUNTS: VolumeDiscount[] = [
  {
    level: 1,
    name: 'MOQ',
    minQuantity: 100,
    maxQuantity: 499,
    discountPercent: 0,
    description: 'Pedido minimo (100-499 unidades)',
  },
  {
    level: 2,
    name: 'Master',
    minQuantity: 500,
    maxQuantity: 999,
    discountPercent: 5,
    description: 'Volumen Master (500-999 unidades) - 5% desc.',
  },
  {
    level: 3,
    name: 'Pallet',
    minQuantity: 1000,
    maxQuantity: null,
    discountPercent: 10,
    description: 'Volumen Pallet (1000+ unidades) - 10% desc.',
  },
];

export const getFormatCosts = (format: string): FormatCosts => {
  const formatLower = format.toLowerCase();

  if (formatLower.includes('100')) {
    return { container: 350, label: 80 };
  }

  if (formatLower.includes('200')) {
    return { container: 450, label: 100 };
  }

  if (formatLower.includes('500') || formatLower.includes('rtu')) {
    return { container: 550, label: 150 };
  }

  return { container: 450, label: 100 };
};

export const getVolumeDiscount = (quantity: number): VolumeDiscount => {
  for (let i = VOLUME_DISCOUNTS.length - 1; i >= 0; i -= 1) {
    const discount = VOLUME_DISCOUNTS[i];
    if (quantity >= discount.minQuantity && (discount.maxQuantity === null || quantity <= discount.maxQuantity)) {
      return discount;
    }
  }

  return VOLUME_DISCOUNTS[0];
};

export const calculateFactoryCost = (
  product: Product,
  costs: FixedCostsConfig | null,
  rawMaterialCostPer100L: number,
): {
  rawMaterialCost: number;
  containerCost: number;
  labelCost: number;
  packagingCost: number;
  factoryCost: number;
} => {
  const unitsPerBatch = product.units_per_batch || 1;
  const rawMaterialCost = unitsPerBatch > 0 ? rawMaterialCostPer100L / unitsPerBatch : rawMaterialCostPer100L;
  const formatCosts = getFormatCosts(product.format);
  const containerCost = formatCosts.container;
  const labelCost = formatCosts.label;
  const packagingCost = costs?.packaging_cost || 500;
  const factoryCost = rawMaterialCost + containerCost + packagingCost + labelCost;

  return {
    rawMaterialCost,
    containerCost,
    labelCost,
    packagingCost,
    factoryCost,
  };
};

export const calculatePricingAnalysis = (
  product: Product,
  costs: FixedCostsConfig | null,
  rawMaterialCostPer100L: number,
  ourMarginTarget: number,
  distributorMarginTarget: number,
  orderQuantity: number,
): PricingAnalysis => {
  const volumeDiscount = getVolumeDiscount(orderQuantity);
  const { rawMaterialCost, containerCost, labelCost, packagingCost, factoryCost } = calculateFactoryCost(
    product,
    costs,
    rawMaterialCostPer100L,
  );

  const baseDistributorPrice = factoryCost / (1 - ourMarginTarget / 100);
  const distributorPriceWithDiscount = baseDistributorPrice * (1 - volumeDiscount.discountPercent / 100);
  const finalMarginPercent = ((distributorPriceWithDiscount - factoryCost) / distributorPriceWithDiscount) * 100;
  const marginWarning = finalMarginPercent < 40;
  const suggestedPVP = distributorPriceWithDiscount / (1 - distributorMarginTarget / 100);
  const recommendedPVP70 = factoryCost / (1 - 0.70);
  const currentShopifyPrice = product.base_price;
  const priceDifference = suggestedPVP - currentShopifyPrice;
  const priceDifferencePercent = currentShopifyPrice > 0
    ? (priceDifference / currentShopifyPrice) * 100
    : 0;
  const ourMargin = ((baseDistributorPrice - factoryCost) / baseDistributorPrice) * 100;
  const distributorMargin = ((suggestedPVP - distributorPriceWithDiscount) / suggestedPVP) * 100;
  const totalProfit = (distributorPriceWithDiscount - factoryCost) * orderQuantity;

  return {
    product,
    rawMaterialCost,
    containerCost,
    packagingCost,
    labelCost,
    factoryCost,
    baseDistributorPrice,
    distributorPriceWithDiscount,
    finalMarginPercent,
    marginWarning,
    suggestedPVP,
    recommendedPVP70,
    currentShopifyPrice,
    priceDifference,
    priceDifferencePercent,
    ourMargin,
    distributorMargin,
    totalProfit,
  };
};
