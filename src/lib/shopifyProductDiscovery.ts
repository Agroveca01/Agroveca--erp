// shopifyProductDiscovery.ts
// Helper para obtención y análisis de catálogo Shopify (stub + lógica de matches no mapeados ERP)
// Implementación inicial del flujo Escenario 2

import { Product } from './supabase';

export interface ShopifyApiProduct {
  id: string;
  title: string;
  variants: Array<{
    id: string;
    title: string;
    sku: string;
  }>;
  // ...otros campos relevantes
}

/**
 * Stub: Simula la obtención del catálogo de productos activos desde Shopify.
 * En producción, deberá ser reemplazado por una llamada real a la API GraphQL o REST de Shopify.
 */
export async function fetchShopifyProductsStub(): Promise<ShopifyApiProduct[]> {
  // Ejemplo de respuesta dummy. Reemplazar con integración real.
  return [
    {
      id: 'gid://shopify/Product/1001',
      title: 'Fertilizante Universal 1L',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/2001',
          title: '1L',
          sku: 'FERT-001-1L',
        },
      ],
    },
    {
      id: 'gid://shopify/Product/1002',
      title: 'Pack Primavera',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/2002',
          title: 'Pack x2',
          sku: 'PACK-PRIM-2',
        },
      ],
    },
    // ...otros productos
  ];
}

/**
 * Dada la lista de productos Shopify y del ERP,
 * detecta qué productos/variantes en Shopify aún no están mapeados en el ERP.
 */
export function findUnmappedShopifyProducts(
  shopify: ShopifyApiProduct[],
  erp: Product[],
): Array<{ shopifyProduct: ShopifyApiProduct; variant: {id: string; sku: string}; suggestedMatch: Product | null }> {
  const mappedVariantIds = new Set(
    erp
      .map((p) => p.shopify_variant_id)
      .filter((value): value is string => Boolean(value)),
  );

  const unmappedSuggestions: Array<{ shopifyProduct: ShopifyApiProduct; variant: {id: string; sku: string}; suggestedMatch: Product | null }> = [];

  for (const product of shopify) {
    for (const variant of product.variants) {
      if (!mappedVariantIds.has(variant.id)) {
        const match = erp.find(
          (p) => p.product_id === variant.sku && !p.shopify_variant_id,
        );
        unmappedSuggestions.push({
          shopifyProduct: product,
          variant: { id: variant.id, sku: variant.sku },
          suggestedMatch: match || null,
        });
      }
    }
  }

  return unmappedSuggestions;
}

// Ejemplo de integración (para cuando existan fuentes reales):
// const shopifyProducts = await fetchShopifyProducts();
// const unmapped = findUnmappedShopifyProducts(shopifyProducts, erpProducts);
// Mostrarlos en el panel, notificar, etc.
