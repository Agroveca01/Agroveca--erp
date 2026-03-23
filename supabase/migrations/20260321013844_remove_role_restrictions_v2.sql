/*
  # Remove role restrictions and simplify user system

  1. Changes
    - Make role column nullable and optional
    - Update RLS policies to allow all authenticated users full access to all tables
    - Remove role-based restrictions completely

  2. Security
    - All authenticated users can access and modify all data
    - No role-based restrictions
*/

-- Make role column nullable and remove CHECK constraint
ALTER TABLE user_profiles 
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN role DROP DEFAULT;

-- Drop the CHECK constraint on role
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Drop existing restrictive policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin users can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can insert new profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON user_profiles;

-- Create new open policies for user_profiles
CREATE POLICY "All authenticated users full access to user_profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update raw_materials policies
DROP POLICY IF EXISTS "Authenticated users can view raw materials" ON raw_materials;
DROP POLICY IF EXISTS "Admin users can insert raw materials" ON raw_materials;
DROP POLICY IF EXISTS "Admin users can update raw materials" ON raw_materials;
DROP POLICY IF EXISTS "Admin users can delete raw materials" ON raw_materials;

CREATE POLICY "All authenticated users full access to raw_materials"
  ON raw_materials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update products policies
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Admin users can insert products" ON products;
DROP POLICY IF EXISTS "Admin users can update products" ON products;
DROP POLICY IF EXISTS "Admin users can delete products" ON products;

CREATE POLICY "All authenticated users full access to products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update product_recipes policies
DROP POLICY IF EXISTS "Authenticated users can view recipes" ON product_recipes;
DROP POLICY IF EXISTS "Admin users can insert recipes" ON product_recipes;
DROP POLICY IF EXISTS "Admin users can update recipes" ON product_recipes;
DROP POLICY IF EXISTS "Admin users can delete recipes" ON product_recipes;

CREATE POLICY "All authenticated users full access to product_recipes"
  ON product_recipes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update production_batches policies
DROP POLICY IF EXISTS "Authenticated users can view production batches" ON production_batches;
DROP POLICY IF EXISTS "Operators can insert production batches" ON production_batches;
DROP POLICY IF EXISTS "Operators can update production batches" ON production_batches;

CREATE POLICY "All authenticated users full access to production_batches"
  ON production_batches FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update customers policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Sales users can insert customers" ON customers;
DROP POLICY IF EXISTS "Sales users can update customers" ON customers;

CREATE POLICY "All authenticated users full access to customers"
  ON customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update customer_orders policies
DROP POLICY IF EXISTS "Authenticated users can view orders" ON customer_orders;
DROP POLICY IF EXISTS "Sales users can insert orders" ON customer_orders;
DROP POLICY IF EXISTS "Sales users can update orders" ON customer_orders;

CREATE POLICY "All authenticated users full access to customer_orders"
  ON customer_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update inventory_transactions policies
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON inventory_transactions;
DROP POLICY IF EXISTS "Operators can insert inventory transactions" ON inventory_transactions;

CREATE POLICY "All authenticated users full access to inventory_transactions"
  ON inventory_transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update other tables
CREATE POLICY "All authenticated users full access to packaging_materials"
  ON packaging_materials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to finished_inventory"
  ON finished_inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to sales_orders"
  ON sales_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to loyalty_rewards"
  ON loyalty_rewards FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to churn_alerts"
  ON churn_alerts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to business_config"
  ON business_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to shopify_config"
  ON shopify_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to shopify_orders"
  ON shopify_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to stock_sync_log"
  ON stock_sync_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to shopify_customer_mapping"
  ON shopify_customer_mapping FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to insumos"
  ON insumos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to productos_terminados"
  ON productos_terminados FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users full access to movimientos_inventario"
  ON movimientos_inventario FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
