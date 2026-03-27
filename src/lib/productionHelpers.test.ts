import { describe, expect, it } from 'vitest';

import {
  buildProductionOrderInsert,
  buildProductionCompletionPlan,
  findPackagingMatch,
  getBatchShelfLifeMonths,
  getRequiredMix,
  getUnitVolumeLiters,
  parseFormatToLiters,
  validateProductionInput,
} from './productionHelpers';

describe('productionHelpers', () => {
  it('parses supported product formats into liters', () => {
    expect(parseFormatToLiters('500cc')).toBe(0.5);
    expect(parseFormatToLiters('1.5L')).toBe(1.5);
    expect(parseFormatToLiters('750 ml')).toBe(0.75);
    expect(parseFormatToLiters('sin formato')).toBeNull();
  });

  it('calculates unit volume and required mix for RTU production', () => {
    const product = {
      id: 'p1',
      name: 'Limpiador',
      product_id: 'CTP-001',
      format: '500cc',
      product_type: 'rtu-gatillo' as const,
      color: null,
      aroma: null,
      ph_target: null,
      production_unit_liters: 0.5,
      base_price: 5990,
    };

    expect(getUnitVolumeLiters(product)).toBe(0.5);
    expect(getRequiredMix(product, 24)).toEqual({
      totalVolumeLiters: 12,
      concentrateRequired: 0.12,
      waterRequired: 11.879999999999999,
    });
  });

  it('falls back to production_unit_liters when format cannot be parsed', () => {
    const product = {
      id: 'p-fallback',
      name: 'Base Concentrada',
      product_id: 'CTP-003',
      format: 'bolsa industrial',
      product_type: 'concentrado' as const,
      color: null,
      aroma: null,
      ph_target: null,
      production_unit_liters: 20,
      base_price: 12990,
    };

    expect(getUnitVolumeLiters(product)).toBe(20);
  });

  it('matches packaging items by type and format substring', () => {
    const inventory = [
      {
        id: 'i-envase',
        item_type: 'envase',
        item_name: 'Botella 500cc',
        format: '500cc',
        current_stock: 50,
        min_stock_alert: 10,
        optimal_stock: 100,
        unit_cost_net: 200,
        location: null,
        last_updated: '2026-03-26T00:00:00.000Z',
        created_at: '2026-03-26T00:00:00.000Z',
      },
      {
        id: 'i-tapa',
        item_type: 'tapa',
        item_name: 'Tapa 500cc',
        format: '500cc',
        current_stock: 50,
        min_stock_alert: 10,
        optimal_stock: 100,
        unit_cost_net: 50,
        location: null,
        last_updated: '2026-03-26T00:00:00.000Z',
        created_at: '2026-03-26T00:00:00.000Z',
      },
    ];

    expect(findPackagingMatch(inventory, 'Limpiador 500cc', ['envase'])?.id).toBe('i-envase');
    expect(findPackagingMatch(inventory, 'Limpiador 500cc', ['gatillo'])).toBeUndefined();
  });

  it('validates packaging availability and shelf life rules', () => {
    const product = {
      id: 'p2',
      name: 'Sustrato Premium',
      product_id: 'CTP-002',
      format: '5L',
      product_type: 'sustrato' as const,
      color: null,
      aroma: null,
      ph_target: null,
      production_unit_liters: 5,
      base_price: 8990,
    };

    const validation = validateProductionInput(
      product,
      [
        {
          id: 'i1',
          item_type: 'envase',
          item_name: 'Bidon',
          format: '5L',
          current_stock: 10,
          min_stock_alert: 2,
          optimal_stock: 20,
          unit_cost_net: 1000,
          location: null,
          last_updated: '2026-03-26T00:00:00.000Z',
          created_at: '2026-03-26T00:00:00.000Z',
        },
        {
          id: 'i2',
          item_type: 'tapa',
          item_name: 'Tapa 5L',
          format: '5L',
          current_stock: 8,
          min_stock_alert: 2,
          optimal_stock: 20,
          unit_cost_net: 150,
          location: null,
          last_updated: '2026-03-26T00:00:00.000Z',
          created_at: '2026-03-26T00:00:00.000Z',
        },
      ],
      12,
    );

    expect(validation.passed).toBe(false);
    expect(validation.errors).toEqual([
      'Envases insuficientes. Necesitas 12, tienes 10',
      'Tapas/Gatillos insuficientes. Necesitas 12, tienes 8',
      'Etiquetas insuficientes. Necesitas 12, tienes 0',
    ]);
    expect(getBatchShelfLifeMonths(product)).toBe(12);
  });

  it('builds the production order insert payload from a passed validation', () => {
    expect(
      buildProductionOrderInsert(
        {
          product: {
            id: 'p1',
            name: 'Limpiador',
            product_id: 'CTP-001',
            format: '500cc',
            product_type: 'rtu-gatillo',
            color: null,
            aroma: null,
            ph_target: null,
            production_unit_liters: 0.5,
            base_price: 5990,
          },
          targetUnits: 24,
          totalVolumeLiters: 12,
          concentrateRequired: 0.12,
          waterRequired: 11.88,
          envase: undefined,
          tapa: undefined,
          etiqueta: undefined,
          errors: [],
          passed: true,
        },
        'PROD-123',
        '2026-03-27T13:00:00.000Z',
      ),
    ).toEqual({
      order_number: 'PROD-123',
      product_id: 'p1',
      target_units: 24,
      concentrate_required_liters: 0.12,
      water_required_liters: 11.88,
      status: 'pending',
      validation_passed: true,
      validation_errors: null,
      started_at: '2026-03-27T13:00:00.000Z',
    });
  });

  it('builds the production completion plan with batch metadata and packaging consumption', () => {
    const product = {
      id: 'p2',
      name: 'Sustrato Premium',
      product_id: 'CTP-002',
      format: '5L',
      product_type: 'sustrato' as const,
      color: null,
      aroma: null,
      ph_target: null,
      production_unit_liters: 5,
      base_price: 8990,
    };

    const completionPlan = buildProductionCompletionPlan(
      {
        id: 'o1',
        order_number: 'PROD-1001',
        product_id: 'p2',
        target_units: 12,
        concentrate_required_liters: 0.6,
        water_required_liters: 59.4,
        status: 'pending',
        validation_passed: true,
        validation_errors: null,
        started_at: '2026-03-27T00:00:00.000Z',
        completed_at: null,
        waste_units: 0,
        waste_liters: 0,
        notes: null,
        created_at: '2026-03-27T00:00:00.000Z',
        products: product,
      },
      [
        {
          id: 'i1',
          item_type: 'envase',
          item_name: 'Bidon',
          format: '5L',
          current_stock: 20,
          min_stock_alert: 2,
          optimal_stock: 30,
          unit_cost_net: 1000,
          location: null,
          last_updated: '2026-03-26T00:00:00.000Z',
          created_at: '2026-03-26T00:00:00.000Z',
        },
        {
          id: 'i2',
          item_type: 'tapa',
          item_name: 'Tapa 5L',
          format: '5L',
          current_stock: 20,
          min_stock_alert: 2,
          optimal_stock: 30,
          unit_cost_net: 150,
          location: null,
          last_updated: '2026-03-26T00:00:00.000Z',
          created_at: '2026-03-26T00:00:00.000Z',
        },
        {
          id: 'i3',
          item_type: 'etiqueta',
          item_name: 'Etiqueta 5L',
          format: '5L',
          current_stock: 20,
          min_stock_alert: 2,
          optimal_stock: 30,
          unit_cost_net: 50,
          location: null,
          last_updated: '2026-03-26T00:00:00.000Z',
          created_at: '2026-03-26T00:00:00.000Z',
        },
      ],
      2,
      5,
      '2026-03-27T15:30:00.000Z',
      'BATCH-CTP-002-123',
    );

    expect(completionPlan).not.toBeNull();
    expect(completionPlan?.summary).toEqual({
      successfulUnits: 10,
      successfulLiters: 55,
      batchDate: '2026-03-27',
      expirationDate: '2027-03-27',
      shelfLifeMonths: 12,
      alertThresholdMonths: 9,
    });
    expect(completionPlan?.packagingConsumptions).toEqual([
      {
        packagingItemId: 'i1',
        nextStock: 8,
        movementQuantity: -12,
        itemLabel: 'Envases',
        notes: 'Envases usado en orden PROD-1001',
      },
      {
        packagingItemId: 'i2',
        nextStock: 8,
        movementQuantity: -12,
        itemLabel: 'Tapas/Gatillos',
        notes: 'Tapas/Gatillos usado en orden PROD-1001',
      },
      {
        packagingItemId: 'i3',
        nextStock: 8,
        movementQuantity: -12,
        itemLabel: 'Etiquetas',
        notes: 'Etiquetas usado en orden PROD-1001',
      },
    ]);
    expect(completionPlan?.batchInsert).toMatchObject({
      product_id: 'p2',
      production_order_id: 'o1',
      batch_number: 'BATCH-CTP-002-123',
      batch_date: '2026-03-27',
      production_date: '2026-03-27',
      expiration_date: '2027-03-27',
      shelf_life_months: 12,
      alert_threshold_months: 9,
      quantity_liters: 55,
      units_produced: 10,
      notes: 'Generado desde orden PROD-1001. Lote RTU producido - 10 unidades',
    });
  });
});
