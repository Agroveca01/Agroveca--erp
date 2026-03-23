/*
  # Integración con Shopify
  
  1. Nuevas Tablas
    - `shopify_config`
      - `id` (uuid, primary key)
      - `shop_domain` (text) - dominio de la tienda
      - `access_token` (text) - token de acceso encriptado
      - `api_version` (text) - versión de la API
      - `webhook_secret` (text) - secreto para validar webhooks
      - `commission_percentage` (numeric) - comisión de Shopify %
      - `payment_gateway_fee` (numeric) - comisión pasarela de pago %
      - `is_active` (boolean)
      - `last_sync_at` (timestamptz)
      - `created_at` (timestamptz)
      
    - `shopify_orders`
      - `id` (uuid, primary key)
      - `shopify_order_id` (text, unique) - ID de orden en Shopify
      - `order_number` (text) - número de orden
      - `customer_id` (uuid, foreign key a customers)
      - `total_amount` (numeric)
      - `commission_amount` (numeric) - comisión total
      - `net_amount` (numeric) - monto neto después de comisión
      - `order_data` (jsonb) - datos completos de la orden
      - `synced_at` (timestamptz)
      - `created_at` (timestamptz)
      
    - `shopify_customer_mapping`
      - `id` (uuid, primary key)
      - `shopify_customer_id` (text, unique)
      - `customer_id` (uuid, foreign key a customers)
      - `email` (text)
      - `created_at` (timestamptz)
      
    - `stock_sync_log`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key a products)
      - `shopify_product_id` (text)
      - `shopify_variant_id` (text)
      - `quantity_synced` (numeric)
      - `status` (text) - 'success', 'failed', 'pending'
      - `error_message` (text)
      - `created_at` (timestamptz)
  
  2. Seguridad
    - Enable RLS en todas las tablas
    - Solo ADMIN puede ver y modificar configuración
    - Logs accesibles para auditoria
*/

-- Tabla de configuración de Shopify
CREATE TABLE IF NOT EXISTS shopify_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain text NOT NULL,
  access_token text,
  api_version text DEFAULT '2024-01',
  webhook_secret text,
  commission_percentage numeric(5,2) DEFAULT 2.00,
  payment_gateway_fee numeric(5,2) DEFAULT 2.50,
  is_active boolean DEFAULT false,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shopify_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view shopify config"
  ON shopify_config FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Only admins can modify shopify config"
  ON shopify_config FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Tabla de órdenes de Shopify
CREATE TABLE IF NOT EXISTS shopify_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id text UNIQUE NOT NULL,
  order_number text NOT NULL,
  customer_id uuid REFERENCES customers(id),
  total_amount numeric(12,2) NOT NULL,
  commission_amount numeric(12,2) DEFAULT 0,
  net_amount numeric(12,2) NOT NULL,
  order_data jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view shopify orders"
  ON shopify_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert shopify orders"
  ON shopify_orders FOR INSERT TO authenticated
  WITH CHECK (true);

-- Tabla de mapeo de clientes
CREATE TABLE IF NOT EXISTS shopify_customer_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_customer_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shopify_customer_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customer mapping"
  ON shopify_customer_mapping FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage customer mapping"
  ON shopify_customer_mapping FOR ALL TO authenticated
  WITH CHECK (true);

-- Tabla de log de sincronización de stock
CREATE TABLE IF NOT EXISTS stock_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  shopify_product_id text,
  shopify_variant_id text,
  quantity_synced numeric(10,2),
  status text CHECK (status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sync log"
  ON stock_sync_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert sync log"
  ON stock_sync_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Agregar campo shopify_product_id a productos si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'shopify_product_id'
  ) THEN
    ALTER TABLE products ADD COLUMN shopify_product_id text;
    ALTER TABLE products ADD COLUMN shopify_variant_id text;
  END IF;
END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_shopify_orders_customer ON shopify_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_date ON shopify_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shopify_customer_mapping_email ON shopify_customer_mapping(email);
CREATE INDEX IF NOT EXISTS idx_stock_sync_log_product ON stock_sync_log(product_id);
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_product_id);

-- Función para calcular comisión
CREATE OR REPLACE FUNCTION calculate_shopify_commission(
  total_amount numeric,
  commission_pct numeric DEFAULT 2.00,
  gateway_pct numeric DEFAULT 2.50
)
RETURNS TABLE(
  commission_amount numeric,
  net_amount numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  commission numeric;
  net numeric;
BEGIN
  commission := total_amount * ((commission_pct + gateway_pct) / 100);
  net := total_amount - commission;
  
  RETURN QUERY SELECT commission, net;
END;
$$;