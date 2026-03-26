import { describe, expect, it } from 'vitest';

import {
  getShopifyStockSyncPayloads,
  isSyncableShopifyProduct,
  toShopifyStockSyncPayload,
} from './shopifySync';

describe('shopify sync helpers', () => {
  it('accepts only products with both Shopify ids and a numeric stock quantity', () => {
    expect(isSyncableShopifyProduct({
      id: 'p1',
      stock_quantity: 12,
      shopify_product_id: 'sp1',
      shopify_variant_id: 'sv1',
    })).toBe(true);

    expect(isSyncableShopifyProduct({
      id: 'p1',
      stock_quantity: 12,
      shopify_product_id: 'sp1',
      shopify_variant_id: null,
    })).toBe(false);

    expect(isSyncableShopifyProduct({
      id: 'p1',
      stock_quantity: Number.NaN,
      shopify_product_id: 'sp1',
      shopify_variant_id: 'sv1',
    })).toBe(false);
  });

  it('builds the payload expected by the stock sync function', () => {
    expect(toShopifyStockSyncPayload({
      id: 'p1',
      stock_quantity: 8,
      shopify_product_id: 'sp1',
      shopify_variant_id: 'sv1',
    })).toEqual({
      product_id: 'p1',
      quantity: 8,
    });
  });

  it('filters out incomplete products before syncing', () => {
    expect(getShopifyStockSyncPayloads([
      {
        id: 'p1',
        stock_quantity: 8,
        shopify_product_id: 'sp1',
        shopify_variant_id: 'sv1',
      },
      {
        id: 'p2',
        stock_quantity: 3,
        shopify_product_id: 'sp2',
        shopify_variant_id: null,
      },
      {
        id: 'p3',
        stock_quantity: undefined,
        shopify_product_id: 'sp3',
        shopify_variant_id: 'sv3',
      },
    ])).toEqual([
      {
        product_id: 'p1',
        quantity: 8,
      },
    ]);
  });
});
