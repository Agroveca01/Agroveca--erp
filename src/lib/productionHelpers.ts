import { PackagingInventory, Product, ProductionBatch, ProductionOrder } from './supabase';

const RTU_CONCENTRATE_RATIO = 0.01;

export interface ProductionMix {
  totalVolumeLiters: number;
  concentrateRequired: number;
  waterRequired: number;
}

export interface ProductionValidationResult {
  product: Product;
  targetUnits: number;
  totalVolumeLiters: number;
  concentrateRequired: number;
  waterRequired: number;
  envase?: PackagingInventory;
  tapa?: PackagingInventory;
  etiqueta?: PackagingInventory;
  errors: string[];
  passed: boolean;
}

export interface ProductionCompletionSummary {
  successfulUnits: number;
  successfulLiters: number;
  batchDate: string;
  expirationDate: string | null;
  shelfLifeMonths: number | null;
  alertThresholdMonths: number | null;
}

export interface PackagingConsumptionPlan {
  packagingItemId: string;
  nextStock: number;
  movementQuantity: number;
  itemLabel: string;
  notes: string;
}

export interface ProductionCompletionPlan {
  summary: ProductionCompletionSummary;
  packagingConsumptions: PackagingConsumptionPlan[];
  batchInsert: Omit<ProductionBatch, 'id'>;
}

export interface ProductionOrderInsert {
  order_number: string;
  product_id: string;
  target_units: number;
  concentrate_required_liters: number;
  water_required_liters: number;
  status: 'pending';
  validation_passed: true;
  validation_errors: null;
  started_at: string;
}

export const parseFormatToLiters = (format: string): number | null => {
  const normalizedFormat = format.trim().toLowerCase();
  const numericMatch = normalizedFormat.match(/(\d+(?:[.,]\d+)?)/);

  if (!numericMatch) return null;

  const amount = parseFloat(numericMatch[1].replace(',', '.'));
  if (Number.isNaN(amount) || amount <= 0) return null;

  if (normalizedFormat.includes('cc') || normalizedFormat.includes('ml')) {
    return amount / 1000;
  }

  if (normalizedFormat.includes('l')) {
    return amount;
  }

  return null;
};

export const getUnitVolumeLiters = (product: Product): number => {
  const parsedFormat = parseFormatToLiters(product.format);

  if (parsedFormat && parsedFormat > 0) {
    return parsedFormat;
  }

  return product.production_unit_liters > 0 ? product.production_unit_liters : 0;
};

export const getRequiredMix = (product: Product, targetUnits: number): ProductionMix => {
  const totalVolumeLiters = getUnitVolumeLiters(product) * targetUnits;

  return {
    totalVolumeLiters,
    concentrateRequired: totalVolumeLiters * RTU_CONCENTRATE_RATIO,
    waterRequired: totalVolumeLiters * (1 - RTU_CONCENTRATE_RATIO),
  };
};

export const getBatchShelfLifeMonths = (product: Product) => {
  return product.product_type === 'sustrato' ? 12 : null;
};

export const findPackagingMatch = (
  inventory: PackagingInventory[],
  format: string,
  itemTypes: string[],
): PackagingInventory | undefined => {
  const normalizedFormat = format.toLowerCase();

  return inventory.find(
    (item) => itemTypes.includes(item.item_type) && item.format && normalizedFormat.includes(item.format.toLowerCase()),
  );
};

export const validateProductionInput = (
  product: Product,
  inventory: PackagingInventory[],
  targetUnits: number,
): ProductionValidationResult => {
  const format = product.format.toLowerCase();
  const mix = getRequiredMix(product, targetUnits);
  const errors: string[] = [];

  const envase = findPackagingMatch(inventory, format, ['envase']);
  const tapa = findPackagingMatch(inventory, format, ['tapa', 'gatillo']);
  const etiqueta = findPackagingMatch(inventory, format, ['etiqueta']);

  if (!envase || envase.current_stock < targetUnits) {
    errors.push(`Envases insuficientes. Necesitas ${targetUnits}, tienes ${envase?.current_stock || 0}`);
  }
  if (!tapa || tapa.current_stock < targetUnits) {
    errors.push(`Tapas/Gatillos insuficientes. Necesitas ${targetUnits}, tienes ${tapa?.current_stock || 0}`);
  }
  if (!etiqueta || etiqueta.current_stock < targetUnits) {
    errors.push(`Etiquetas insuficientes. Necesitas ${targetUnits}, tienes ${etiqueta?.current_stock || 0}`);
  }

  return {
    product,
    targetUnits,
    totalVolumeLiters: mix.totalVolumeLiters,
    concentrateRequired: mix.concentrateRequired,
    waterRequired: mix.waterRequired,
    envase,
    tapa,
    etiqueta,
    errors,
    passed: errors.length === 0,
  };
};

export const buildProductionOrderInsert = (
  validation: ProductionValidationResult,
  orderNumber: string,
  startedAt: string,
): ProductionOrderInsert => {
  return {
    order_number: orderNumber,
    product_id: validation.product.id,
    target_units: validation.targetUnits,
    concentrate_required_liters: validation.concentrateRequired,
    water_required_liters: validation.waterRequired,
    status: 'pending',
    validation_passed: true,
    validation_errors: null,
    started_at: startedAt,
  };
};

export const buildProductionCompletionPlan = (
  order: ProductionOrder & { products?: Product },
  inventory: PackagingInventory[],
  wasteUnits: number,
  wasteLiters: number,
  completedAt: string,
  batchNumber: string,
): ProductionCompletionPlan | null => {
  const product = order.products;
  if (!product) return null;

  const successfulUnits = Math.max(0, order.target_units - wasteUnits);
  const successfulLiters = Math.max(
    0,
    order.concentrate_required_liters + order.water_required_liters - wasteLiters,
  );
  const batchDate = completedAt.split('T')[0];
  const shelfLifeMonths = getBatchShelfLifeMonths(product);
  const alertThresholdMonths = shelfLifeMonths ? Math.max(1, shelfLifeMonths - 3) : null;
  const expirationDate = shelfLifeMonths
    ? new Date(new Date(batchDate).setMonth(new Date(batchDate).getMonth() + shelfLifeMonths))
        .toISOString()
        .split('T')[0]
    : null;

  const format = product.format.toLowerCase();
  const packagingMatches = [
    { item: findPackagingMatch(inventory, format, ['envase']), itemLabel: 'Envases' },
    { item: findPackagingMatch(inventory, format, ['tapa', 'gatillo']), itemLabel: 'Tapas/Gatillos' },
    { item: findPackagingMatch(inventory, format, ['etiqueta']), itemLabel: 'Etiquetas' },
  ];

  const packagingConsumptions = packagingMatches
    .filter((match): match is { item: PackagingInventory; itemLabel: string } => Boolean(match.item))
    .map(({ item, itemLabel }) => ({
      packagingItemId: item.id,
      nextStock: Math.max(0, item.current_stock - order.target_units),
      movementQuantity: -order.target_units,
      itemLabel,
      notes: `${itemLabel} usado en orden ${order.order_number}`,
    }));

  return {
    summary: {
      successfulUnits,
      successfulLiters,
      batchDate,
      expirationDate,
      shelfLifeMonths,
      alertThresholdMonths,
    },
    packagingConsumptions,
    batchInsert: {
      product_id: product.id,
      production_order_id: order.id,
      batch_number: batchNumber,
      batch_date: batchDate,
      production_date: batchDate,
      expiration_date: expirationDate,
      shelf_life_months: shelfLifeMonths,
      alert_threshold_months: alertThresholdMonths,
      quantity_liters: successfulLiters,
      units_produced: successfulUnits,
      raw_material_cost: 0,
      packaging_cost: 0,
      total_cost: 0,
      cost_per_unit: 0,
      notes: `Generado desde orden ${order.order_number}. Lote RTU producido - ${successfulUnits} unidades`,
      products: product,
    },
  };
};
