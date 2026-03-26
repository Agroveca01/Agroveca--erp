import { describe, expect, it } from 'vitest';

import { calculateEditableMetrics, getFormatCostsByProduct } from './costingHelpers';

describe('costingHelpers', () => {
  it('matches format costs using normalized format names', () => {
    expect(
      getFormatCostsByProduct(
        {
          id: 'p1',
          name: 'Limpiador',
          product_id: 'CTP-001',
          format: '500cc RTU',
          product_type: 'rtu-gatillo',
          color: null,
          aroma: null,
          ph_target: null,
          production_unit_liters: 0.5,
          base_price: 5000,
        },
        [
          {
            id: 'f1',
            format_name: '500cc',
            container_cost: 800,
            label_cost: 120,
            created_at: '2026-03-26T00:00:00.000Z',
            updated_at: '2026-03-26T00:00:00.000Z',
          },
        ],
        null,
      ),
    ).toEqual({ container: 800, label: 120 });
  });

  it('falls back to fixed costs when no format-specific match exists', () => {
    expect(
      getFormatCostsByProduct(
        {
          id: 'p2',
          name: 'Sustrato',
          product_id: 'CTP-002',
          format: '5L',
          product_type: 'sustrato',
          color: null,
          aroma: null,
          ph_target: null,
          production_unit_liters: 5,
          base_price: 9000,
        },
        [],
        {
          id: 'fc1',
          container_cost: 450,
          packaging_cost: 500,
          label_cost: 150,
          shipping_cost: 750,
          updated_at: '2026-03-26T00:00:00.000Z',
          updated_by: null,
        },
      ),
    ).toEqual({ container: 450, label: 150 });
  });

  it('calculates editable metrics using commission and margin rules', () => {
    expect(
      calculateEditableMetrics(
        {
          rawMaterialCost: 1000,
          containerCost: 800,
          packagingCost: 500,
          labelCost: 120,
          shippingCost: 300,
          basePrice: 5000,
        },
        {
          id: 'bc1',
          company_name: 'Agroveca',
          currency: 'CLP',
          shopify_commission_pct: 5,
          meta_ads_budget: 0,
          target_monthly_sales: 0,
          shipping_cost: 750,
          default_margin_target: 60,
        },
      ),
    ).toEqual({
      totalCost: 2720,
      commission: 250,
      netProfit: 2030,
      netMargin: 40.6,
    });
  });
});
