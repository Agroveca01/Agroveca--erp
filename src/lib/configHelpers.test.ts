import { describe, expect, it } from 'vitest';

import {
  DEFAULT_BUSINESS_CONFIG_FORM,
  getConfigSummary,
  mapBusinessConfigToForm,
} from './configHelpers';

describe('configHelpers', () => {
  it('provides stable default business config values', () => {
    expect(DEFAULT_BUSINESS_CONFIG_FORM).toEqual({
      company_name: '',
      currency: 'CLP',
      shopify_commission_pct: 5,
      meta_ads_budget: 500000,
      target_monthly_sales: 300,
      shipping_cost: 750,
      default_margin_target: 0.7,
    });
  });

  it('maps persisted business config into editable form state', () => {
    expect(
      mapBusinessConfigToForm({
        id: 'cfg-1',
      company_name: 'Cuida Tu Planta',
      currency: 'CLP',
      shopify_commission_pct: 6.5,
      meta_ads_budget: 750000,
      target_monthly_sales: 500,
      shipping_cost: 990,
      default_margin_target: 0.55,
    }),
    ).toEqual({
      company_name: 'Cuida Tu Planta',
      currency: 'CLP',
      shopify_commission_pct: 6.5,
      meta_ads_budget: 750000,
      target_monthly_sales: 500,
      shipping_cost: 990,
      default_margin_target: 0.55,
    });
  });

  it('builds summary labels from current config values', () => {
    const summary = getConfigSummary(
      {
        company_name: 'Cuida Tu Planta',
        currency: 'CLP',
        shopify_commission_pct: 5,
        meta_ads_budget: 500000,
        target_monthly_sales: 300,
        shipping_cost: 750,
        default_margin_target: 0.7,
      },
      (amount) => `$${amount}`,
    );

    expect(summary).toEqual({
      shopifyCommissionLabel: 'Shopify: 5%',
      shippingCostLabel: 'Envío: $750',
      metaAdsBudgetLabel: 'Meta Ads: $500000/mes',
      targetMonthlySalesLabel: 'Ventas: 300 unidades/mes',
      marginLabel: 'Margen: 70%',
    });
  });
});
