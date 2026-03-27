import { describe, expect, it } from 'vitest';

import {
  buildProductionBatchConsumptionPlan,
  calculateProductionBatchCosts,
  getEstimatedRawMaterialUnitCost,
  getRecipeCostPer100Liters,
  getUnitsPerStandardBatch,
} from './productionModuleHelpers';

const recipes = [
  {
    id: 'r1',
    product_id: 'p1',
    raw_material_id: 'm1',
    quantity_per_100l: 2,
    created_at: '2026-03-26T00:00:00.000Z',
    raw_materials: {
      current_cost: 1000,
    },
  },
  {
    id: 'r2',
    product_id: 'p1',
    raw_material_id: 'm2',
    quantity_per_100l: 1.5,
    created_at: '2026-03-26T00:00:00.000Z',
    raw_materials: {
      current_cost: 2000,
    },
  },
];

describe('productionModuleHelpers', () => {
  it('calculates recipe raw material cost per 100 liters', () => {
    expect(getRecipeCostPer100Liters(recipes)).toBe(5000);
  });

  it('derives units per standard batch from supported formats', () => {
    expect(getUnitsPerStandardBatch('500cc')).toBe(200);
    expect(getUnitsPerStandardBatch('1L')).toBe(100);
    expect(getUnitsPerStandardBatch('sin formato')).toBe(0);
  });

  it('estimates raw material unit cost from recipe totals and product format', () => {
    expect(getEstimatedRawMaterialUnitCost(recipes, '500cc')).toBe(25);
    expect(getEstimatedRawMaterialUnitCost(recipes, 'sin formato')).toBe(5000);
  });

  it('calculates production batch totals with packaging cost', () => {
    expect(calculateProductionBatchCosts(recipes, 150, 240)).toEqual({
      rawMaterialCost: 7500,
      packagingCost: 60000,
      totalCost: 67500,
      costPerUnit: 281.25,
    });
  });

  it('builds raw material consumption plan for a production batch', () => {
    expect(buildProductionBatchConsumptionPlan(recipes, 150, 'BATCH-CTP-001-123')).toEqual([
      {
        rawMaterialId: 'm1',
        quantityUsed: 3,
        notes: 'Usado en lote BATCH-CTP-001-123',
      },
      {
        rawMaterialId: 'm2',
        quantityUsed: 2.25,
        notes: 'Usado en lote BATCH-CTP-001-123',
      },
    ]);
  });
});
