import { PackagingInventory, Product } from './supabase';

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
