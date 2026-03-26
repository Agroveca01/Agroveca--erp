import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SHOPIFY_CONFIG_FORM,
  getShopifyOrdersSummary,
  mapShopifyConfigToForm,
} from './shopifyIntegrationHelpers';

describe('shopifyIntegrationHelpers', () => {
  it('provides stable default Shopify config form values', () => {
    expect(DEFAULT_SHOPIFY_CONFIG_FORM).toEqual({
      shop_domain: '',
      access_token: '',
      api_version: '2024-01',
      webhook_secret: '',
      commission_percentage: 2,
      payment_gateway_fee: 2.5,
    });
  });

  it('maps stored Shopify config into editable form state', () => {
    expect(
      mapShopifyConfigToForm({
        id: 'cfg-1',
        shop_domain: 'agroveca.myshopify.com',
        access_token: 'secret',
        api_version: '2024-04',
        webhook_secret: 'hook',
        commission_percentage: 3,
        payment_gateway_fee: 2.9,
        is_active: true,
        last_sync_at: '2026-03-26T00:00:00.000Z',
        created_at: '2026-03-01T00:00:00.000Z',
      }),
    ).toEqual({
      shop_domain: 'agroveca.myshopify.com',
      access_token: 'secret',
      api_version: '2024-04',
      webhook_secret: 'hook',
      commission_percentage: 3,
      payment_gateway_fee: 2.9,
    });
  });

  it('summarizes Shopify orders into dashboard metrics', () => {
    expect(
      getShopifyOrdersSummary([
        { total_amount: 10000, commission_amount: 500, net_amount: 9500 },
        { total_amount: 15000, commission_amount: 750, net_amount: 14250 },
      ]),
    ).toEqual({
      totalOrders: 2,
      totalRevenue: 25000,
      totalCommissions: 1250,
      totalNet: 23750,
    });
  });
});
