// shopifyProductDiscovery.ts
// Helper para obtención y análisis de catálogo Shopify (stub + lógica de matches no mapeados ERP)
// Implementación inicial del flujo Escenario 2

import { Product } from "./supabase.ts";

function getEnv(name: string): string | undefined {
  return typeof Deno !== "undefined" ? Deno.env.get(name) : undefined;
}

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
  // NOTA: Actualmente el modelo Product no tiene shopify_product_id/shopify_variant_id,
// por lo que la comparación se hace sólo por SKU (product_id de ERP vs sku de Shopify).
// TODO: Extender Product y persistencia para soportar referencias directas a productos/variantes Shopify (automatización completa).

  const erpProductIds = new Set(erp.map(p => p.product_id));

  const unmappedSuggestions: Array<{ shopifyProduct: ShopifyApiProduct; variant: {id: string; sku: string}; suggestedMatch: Product | null }> = [];

  for (const product of shopify) {
    for (const variant of product.variants) {
      // Si la SKU de variante Shopify no existe actualmente como product_id en ERP, proponer mapping
      if (!erpProductIds.has(variant.sku)) {
        // Sugerir match si SKU parece coincidir (es igual al product_id ERP)
        const match = erp.find(p => p.product_id === variant.sku);
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

/**
 * Obtiene el catálogo real de productos activos desde Shopify usando la API GraphQL Admin.
 * Pagina automáticamente, incluye variantes y mapea al modelo existente.
 */
// Acceso a token Shopify con client credentials grant (cachea temporalmente en memoria)
let _shopifyAccessToken: string | undefined;
let _tokenExpiresAt = 0;

async function getShopifyAccessToken(): Promise<string> {
  const SHOP = getEnv("SHOPIFY_SHOP");
  const CLIENT_ID = getEnv("SHOPIFY_CLIENT_ID");
  const CLIENT_SECRET = getEnv("SHOPIFY_CLIENT_SECRET");
  if (!SHOP || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Faltan variables: SHOPIFY_SHOP, SHOPIFY_CLIENT_ID y/o SHOPIFY_CLIENT_SECRET en el entorno");
  }
  if (_shopifyAccessToken && Date.now() < _tokenExpiresAt - 60000) {
    return _shopifyAccessToken;
  }
  const resp = await fetch(`https://${SHOP}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });
  if (!resp.ok) throw new Error(`Error obteniendo token Shopify: ${resp.status} - ${await resp.text()}`);
  const { access_token, expires_in } = await resp.json();
  _shopifyAccessToken = access_token;
  _tokenExpiresAt = Date.now() + (Number(expires_in) || 86400) * 1000;
  return access_token;
}

export async function fetchShopifyProducts(): Promise<ShopifyApiProduct[]> {
  const SHOP = getEnv("SHOPIFY_SHOP");
  if (!SHOP) {
    throw new Error("Falta configuración de entorno: SHOPIFY_SHOP.");
  }
  const endpoint = `https://${SHOP}.myshopify.com/admin/api/2026-01/graphql.json`;
  const products: ShopifyApiProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  const PAGE_SIZE = 100;

  while (hasNextPage) {
    const accessToken = await getShopifyAccessToken();
    const query = `
      query GetProducts($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: ID) {
          edges {
            cursor
            node {
              id
              title
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    sku
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;
    const variables: Record<string, any> = { first: PAGE_SIZE };
    if (cursor) variables.after = cursor;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${err}`);
    }
    const data = await response.json();
    if (data.errors) {
      throw new Error(`Shopify GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const edges = data.data.products.edges;
    for (const edge of edges) {
      const node = edge.node;
      const variants = (node.variants.edges || []).map((v: any) => ({
        id: v.node.id,
        title: v.node.title,
        sku: v.node.sku,
      }));
      products.push({
        id: node.id,
        title: node.title,
        variants,
      });
    }

    hasNextPage = data.data.products.pageInfo.hasNextPage;
    cursor = hasNextPage && edges.length > 0 ? edges[edges.length - 1].cursor : null;
  }

  return products;
}

