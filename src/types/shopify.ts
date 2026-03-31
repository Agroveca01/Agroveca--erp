// Tipos compartidos para integración Shopify, ERP y descubrimiento

export interface ShopifyApiProduct {
  id: string;
  title: string;
  variants: Array<{
    id: string;
    title: string;
    sku: string;
  }>;
}

export interface Product {
  id: string;
  name: string;
  product_id: string;
  format: string;
  product_type: string;
  color: string | null;
  aroma: string | null;
  ph_target: number | null;
  production_unit_liters: number;
  base_price: number;
  shopify_product_id?: string | null;
  shopify_variant_id?: string | null;
  units_per_batch?: number | null;
}

export interface UnmappedShopifyProduct {
  shopifyProduct: ShopifyApiProduct;
  variant: { id: string; sku: string };
  suggestedMatch: Product | null;
}

export interface ShopifyDiscoveryResponse {
  unmapped: UnmappedShopifyProduct[];
}
