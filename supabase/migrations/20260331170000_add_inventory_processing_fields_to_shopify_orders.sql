ALTER TABLE public.shopify_orders
ADD COLUMN IF NOT EXISTS inventory_processed_at timestamptz,
ADD COLUMN IF NOT EXISTS inventory_processing_error text;

CREATE INDEX IF NOT EXISTS idx_shopify_orders_inventory_processed_at
  ON public.shopify_orders(inventory_processed_at);
