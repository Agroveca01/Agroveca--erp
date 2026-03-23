/*
  # Cuida Tu Planta ERP Schema

  ## Overview
  Complete database schema for CTP's ERP system covering inventory, production, costing, and sales.

  ## Tables Created
  
  ### 1. business_config
  Stores business rules and configuration
  - shopify_commission_pct: Commission percentage
  - meta_ads_budget: Monthly advertising budget
  - target_monthly_sales: Sales target in units
  - shipping_cost: Shipping and packaging cost per order
  - default_margin_target: Target profit margin

  ### 2. raw_materials
  All ingredients and raw materials used in production
  - name, unit, current_cost, stock_quantity
  - category: 'chemical', 'natural', 'base', 'fragrance', 'colorant'

  ### 3. packaging_materials
  Packaging items used for finished products
  - name, cost, stock_quantity

  ### 4. products
  Finished products (concentrados and substrates)
  - name, product_id, format, type, color, aroma, ph_target
  - production_unit_liters: Standard batch size

  ### 5. product_recipes
  Recipe ingredients for each product
  - Links products to raw materials with quantities per 100L

  ### 6. production_batches
  Production records
  - product, batch_date, quantity_produced, cost_per_unit

  ### 7. inventory_transactions
  Track all inventory movements
  - type: 'purchase', 'production', 'sale', 'adjustment'

  ### 8. sales_orders
  Sales transactions
  - product, quantity, unit_price, total_amount, channel, date

  ## Security
  All tables have RLS enabled with appropriate policies for authenticated users
*/

-- Business Configuration
CREATE TABLE IF NOT EXISTS business_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Cuida Tu Planta',
  currency text NOT NULL DEFAULT 'CLP',
  shopify_commission_pct decimal(5,2) NOT NULL DEFAULT 5.0,
  meta_ads_budget decimal(12,2) NOT NULL DEFAULT 500000,
  target_monthly_sales integer NOT NULL DEFAULT 300,
  shipping_cost decimal(10,2) NOT NULL DEFAULT 750,
  default_margin_target decimal(5,2) NOT NULL DEFAULT 0.70,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business config"
  ON business_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update business config"
  ON business_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Raw Materials
CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('chemical', 'natural', 'base', 'fragrance', 'colorant', 'substrate_component')),
  unit text NOT NULL DEFAULT 'L',
  current_cost decimal(12,2) NOT NULL DEFAULT 0,
  stock_quantity decimal(12,2) NOT NULL DEFAULT 0,
  min_stock_alert decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view raw materials"
  ON raw_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert raw materials"
  ON raw_materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update raw materials"
  ON raw_materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete raw materials"
  ON raw_materials FOR DELETE
  TO authenticated
  USING (true);

-- Packaging Materials
CREATE TABLE IF NOT EXISTS packaging_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cost decimal(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  min_stock_alert integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE packaging_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view packaging materials"
  ON packaging_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert packaging materials"
  ON packaging_materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update packaging materials"
  ON packaging_materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete packaging materials"
  ON packaging_materials FOR DELETE
  TO authenticated
  USING (true);

-- Products (Concentrados and Substrates)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_id text UNIQUE NOT NULL,
  format text NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('concentrado', 'substrate')),
  color text,
  aroma text,
  ph_target decimal(4,2),
  production_unit_liters decimal(10,2) NOT NULL DEFAULT 100,
  packaging_material_id uuid REFERENCES packaging_materials(id),
  base_price decimal(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Product Recipes
CREATE TABLE IF NOT EXISTS product_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id uuid REFERENCES raw_materials(id),
  quantity_per_100l decimal(12,3) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product recipes"
  ON product_recipes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert product recipes"
  ON product_recipes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update product recipes"
  ON product_recipes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete product recipes"
  ON product_recipes FOR DELETE
  TO authenticated
  USING (true);

-- Production Batches
CREATE TABLE IF NOT EXISTS production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  batch_number text NOT NULL,
  batch_date date NOT NULL DEFAULT CURRENT_DATE,
  quantity_liters decimal(12,2) NOT NULL,
  units_produced integer NOT NULL,
  raw_material_cost decimal(12,2) NOT NULL DEFAULT 0,
  packaging_cost decimal(12,2) NOT NULL DEFAULT 0,
  total_cost decimal(12,2) NOT NULL DEFAULT 0,
  cost_per_unit decimal(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view production batches"
  ON production_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert production batches"
  ON production_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update production batches"
  ON production_batches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete production batches"
  ON production_batches FOR DELETE
  TO authenticated
  USING (true);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'production_use', 'production_output', 'sale', 'adjustment')),
  raw_material_id uuid REFERENCES raw_materials(id),
  product_id uuid REFERENCES products(id),
  quantity decimal(12,2) NOT NULL,
  unit_cost decimal(12,2),
  reference_id uuid,
  notes text,
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sales Orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price decimal(12,2) NOT NULL,
  subtotal decimal(12,2) NOT NULL,
  commission decimal(12,2) NOT NULL DEFAULT 0,
  shipping_cost decimal(12,2) NOT NULL DEFAULT 0,
  total_amount decimal(12,2) NOT NULL,
  channel text NOT NULL CHECK (channel IN ('shopify', 'direct', 'wholesale', 'other')),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales orders"
  ON sales_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert sales orders"
  ON sales_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update sales orders"
  ON sales_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete sales orders"
  ON sales_orders FOR DELETE
  TO authenticated
  USING (true);

-- Finished Product Inventory
CREATE TABLE IF NOT EXISTS finished_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) UNIQUE,
  quantity integer NOT NULL DEFAULT 0,
  min_stock_alert integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE finished_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view finished inventory"
  ON finished_inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert finished inventory"
  ON finished_inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update finished inventory"
  ON finished_inventory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_recipes_product ON product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_material ON product_recipes(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_product ON production_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_date ON production_batches(batch_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_product ON sales_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);

-- Insert initial business configuration
INSERT INTO business_config (
  company_name,
  currency,
  shopify_commission_pct,
  meta_ads_budget,
  target_monthly_sales,
  shipping_cost,
  default_margin_target
) VALUES (
  'Cuida Tu Planta (CTP)',
  'CLP',
  5.0,
  500000,
  300,
  750,
  0.70
) ON CONFLICT DO NOTHING;