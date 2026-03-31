-- Evita que una misma variante Shopify quede vinculada a más de un producto ERP.

UPDATE products
SET shopify_product_id = NULL
WHERE shopify_product_id IS NOT NULL
  AND btrim(shopify_product_id) = '';

UPDATE products
SET shopify_variant_id = NULL
WHERE shopify_variant_id IS NOT NULL
  AND btrim(shopify_variant_id) = '';

DO $$
DECLARE
  duplicate_variants text;
BEGIN
  SELECT string_agg(format('%s (%s usos)', shopify_variant_id, usage_count), ', ' ORDER BY shopify_variant_id)
  INTO duplicate_variants
  FROM (
    SELECT shopify_variant_id, count(*) AS usage_count
    FROM products
    WHERE shopify_variant_id IS NOT NULL
    GROUP BY shopify_variant_id
    HAVING count(*) > 1
  ) duplicates;

  IF duplicate_variants IS NOT NULL THEN
    RAISE EXCEPTION 'No se puede crear unicidad en products.shopify_variant_id. Variantes duplicadas: %', duplicate_variants;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_shopify_variant_id_unique
  ON products (shopify_variant_id)
  WHERE shopify_variant_id IS NOT NULL;
