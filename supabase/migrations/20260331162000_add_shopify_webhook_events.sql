CREATE TABLE IF NOT EXISTS shopify_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text,
  shop_domain text,
  shopify_webhook_id text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'rejected', 'accepted', 'processed', 'failed')),
  http_status integer,
  error_message text,
  payload jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view shopify webhook events"
  ON public.shopify_webhook_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert shopify webhook events"
  ON public.shopify_webhook_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update shopify webhook events"
  ON public.shopify_webhook_events FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_shopify_webhook_events_created_at
  ON public.shopify_webhook_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shopify_webhook_events_topic
  ON public.shopify_webhook_events(topic);

CREATE INDEX IF NOT EXISTS idx_shopify_webhook_events_status
  ON public.shopify_webhook_events(status);
