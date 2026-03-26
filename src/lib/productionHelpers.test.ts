import { describe, expect, it } from 'vitest';

import {
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
});
