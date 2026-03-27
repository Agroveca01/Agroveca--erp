import { parseFormatToLiters } from './productionHelpers';

export interface RecipeWithCost {
  quantity_per_100l: number;
  raw_materials?: {
    current_cost: number;
  } | null;
}

export interface ProductionCostSummary {
  rawMaterialCost: number;
  packagingCost: number;
  totalCost: number;
  costPerUnit: number;
}

export interface ProductionBatchConsumptionPlan {
  rawMaterialId: string;
  quantityUsed: number;
  notes: string;
}

export const getRecipeCostPer100Liters = (recipes: RecipeWithCost[]): number => {
  return recipes.reduce((total, recipe) => {
    return total + (recipe.raw_materials?.current_cost || 0) * recipe.quantity_per_100l;
  }, 0);
};

export const getUnitsPerStandardBatch = (format: string): number => {
  const unitVolumeLiters = parseFormatToLiters(format);

  if (!unitVolumeLiters || unitVolumeLiters <= 0) {
    return 0;
  }

  return Math.floor(100 / unitVolumeLiters);
};

export const getEstimatedRawMaterialUnitCost = (
  recipes: RecipeWithCost[],
  format: string,
): number => {
  const totalCost100L = getRecipeCostPer100Liters(recipes);
  const unitsPerBatch = getUnitsPerStandardBatch(format);

  return unitsPerBatch > 0 ? totalCost100L / unitsPerBatch : totalCost100L;
};

export const calculateProductionBatchCosts = (
  recipes: RecipeWithCost[],
  quantityLiters: number,
  unitsProduced: number,
  packagingCostPerUnit = 250,
): ProductionCostSummary => {
  const multiplier = quantityLiters / 100;
  const rawMaterialCost = recipes.reduce((total, recipe) => {
    const quantity = recipe.quantity_per_100l * multiplier;
    const cost = recipe.raw_materials?.current_cost || 0;
    return total + quantity * cost;
  }, 0);
  const packagingCost = unitsProduced * packagingCostPerUnit;
  const totalCost = rawMaterialCost + packagingCost;

  return {
    rawMaterialCost,
    packagingCost,
    totalCost,
    costPerUnit: unitsProduced > 0 ? totalCost / unitsProduced : 0,
  };
};

export const buildProductionBatchConsumptionPlan = (
  recipes: (RecipeWithCost & { raw_material_id: string })[],
  quantityLiters: number,
  batchNumber: string,
): ProductionBatchConsumptionPlan[] => {
  const multiplier = quantityLiters / 100;

  return recipes.map((recipe) => ({
    rawMaterialId: recipe.raw_material_id,
    quantityUsed: recipe.quantity_per_100l * multiplier,
    notes: `Usado en lote ${batchNumber}`,
  }));
};
