export interface ShopifySyncCandidate {
  id: string | null | undefined;
  stock_quantity: number | null | undefined;
  shopify_product_id: string | null | undefined;
  shopify_variant_id: string | null | undefined;
}

export interface ShopifyStockSyncPayload {
  product_id: string;
  quantity: number;
}

export const isSyncableShopifyProduct = (product: ShopifySyncCandidate): boolean => {
  return Boolean(
    product.id &&
    product.shopify_product_id &&
    product.shopify_variant_id &&
    typeof product.stock_quantity === 'number' &&
    Number.isFinite(product.stock_quantity),
  );
};

export const toShopifyStockSyncPayload = (
  product: ShopifySyncCandidate,
): ShopifyStockSyncPayload | null => {
  const { id, stock_quantity: stockQuantity, shopify_product_id: shopifyProductId, shopify_variant_id: shopifyVariantId } = product;

  if (
    !id ||
    !shopifyProductId ||
    !shopifyVariantId ||
    typeof stockQuantity !== 'number' ||
    !Number.isFinite(stockQuantity)
  ) {
    return null;
  }

  return {
    product_id: id,
    quantity: stockQuantity,
  };
};

export const getShopifyStockSyncPayloads = (
  products: ShopifySyncCandidate[],
): ShopifyStockSyncPayload[] => {
  return products
    .map(toShopifyStockSyncPayload)
    .filter((payload): payload is ShopifyStockSyncPayload => payload !== null);
};
