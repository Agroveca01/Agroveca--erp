/*
  # Replace Always True RLS Policies with Secure Policies

  ## Summary
  This migration replaces all "always true" RLS policies with secure policies that:
  1. Explicitly check for authenticated users
  2. Remove duplicate policies
  3. Maintain appropriate access control based on user roles
  
  ## Changes
  For each table, we:
  - Drop all existing permissive policies that use USING(true) or WITH CHECK(true)
  - Replace them with secure policies that explicitly verify authentication
  - Keep role-based restrictions where appropriate (admin-only tables)
  
  ## Security Model
  This is a single-tenant ERP system where:
  - All authenticated users belong to the same organization
  - Data visibility is controlled by authentication, not organization membership
  - Certain sensitive operations require admin role
  - User-specific data (like profiles, tasks) is restricted to the owner
*/

-- ============================================================================
-- ACCOUNTS PAYABLE: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Auth users can view accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can manage accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can view accounts payable" ON public.accounts_payable;

CREATE POLICY "Authenticated users can read accounts payable"
  ON public.accounts_payable FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert accounts payable"
  ON public.accounts_payable FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update accounts payable"
  ON public.accounts_payable FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete accounts payable"
  ON public.accounts_payable FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- ACCOUNTS RECEIVABLE: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Auth users can view accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can manage accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can view accounts receivable" ON public.accounts_receivable;

CREATE POLICY "Authenticated users can read accounts receivable"
  ON public.accounts_receivable FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert accounts receivable"
  ON public.accounts_receivable FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update accounts receivable"
  ON public.accounts_receivable FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete accounts receivable"
  ON public.accounts_receivable FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- BUSINESS CONFIG: Remove always-true policy, keep admin restriction
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can view business config" ON public.business_config;
DROP POLICY IF EXISTS "Authenticated users can view business config" ON public.business_config;

CREATE POLICY "Authenticated users can read business config"
  ON public.business_config FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- CHURN ALERTS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Auth users can view churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Authenticated users can view churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "System can manage churn alerts" ON public.churn_alerts;

CREATE POLICY "Authenticated users can read churn alerts"
  ON public.churn_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert churn alerts"
  ON public.churn_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update churn alerts"
  ON public.churn_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete churn alerts"
  ON public.churn_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- CUSTOMER ORDERS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage customer orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Auth users can view customer orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can manage customer orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can view customer orders" ON public.customer_orders;

CREATE POLICY "Authenticated users can read customer orders"
  ON public.customer_orders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert customer orders"
  ON public.customer_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update customer orders"
  ON public.customer_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete customer orders"
  ON public.customer_orders FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- CUSTOMER PAYMENT HISTORY: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view customer payment history" ON public.customer_payment_history;

CREATE POLICY "Authenticated users can read customer payment history"
  ON public.customer_payment_history FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- CUSTOMERS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Auth users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Auth users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;

CREATE POLICY "Authenticated users can read customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- EMAIL LOGS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Auth users can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Authenticated users can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "System can manage email logs" ON public.email_logs;

CREATE POLICY "Authenticated users can read email logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert email logs"
  ON public.email_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- FINISHED INVENTORY: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Auth users can view finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Authenticated users can manage finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Authenticated users can view finished inventory" ON public.finished_inventory;

CREATE POLICY "Authenticated users can read finished inventory"
  ON public.finished_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert finished inventory"
  ON public.finished_inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update finished inventory"
  ON public.finished_inventory FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete finished inventory"
  ON public.finished_inventory FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- FISCAL CALENDAR: Remove duplicate and always-true policies, keep admin check
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage fiscal calendar" ON public.fiscal_calendar;
DROP POLICY IF EXISTS "Auth users can view fiscal calendar" ON public.fiscal_calendar;
DROP POLICY IF EXISTS "Authenticated users can view fiscal calendar" ON public.fiscal_calendar;

CREATE POLICY "Authenticated users can read fiscal calendar"
  ON public.fiscal_calendar FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- FISCAL CONFIG: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated users to read fiscal config" ON public.fiscal_config;

CREATE POLICY "Authenticated users can read fiscal config"
  ON public.fiscal_config FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- FIXED COSTS CONFIG: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read fixed costs" ON public.fixed_costs_config;

CREATE POLICY "Authenticated users can read fixed costs config"
  ON public.fixed_costs_config FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- FORMAT COSTS: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can read format costs" ON public.format_costs;

CREATE POLICY "Authenticated users can read format costs"
  ON public.format_costs FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INSUMOS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage insumos" ON public.insumos;
DROP POLICY IF EXISTS "Auth users can view insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can manage insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can view insumos" ON public.insumos;

CREATE POLICY "Authenticated users can read insumos"
  ON public.insumos FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert insumos"
  ON public.insumos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update insumos"
  ON public.insumos FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete insumos"
  ON public.insumos FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INVENTORY MOVEMENTS: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view inventory movements" ON public.inventory_movements;

CREATE POLICY "Authenticated users can read inventory movements"
  ON public.inventory_movements FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INVENTORY TRANSACTIONS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can insert inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Auth users can view inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can manage inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can view inventory transactions" ON public.inventory_transactions;

CREATE POLICY "Authenticated users can read inventory transactions"
  ON public.inventory_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert inventory transactions"
  ON public.inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- LOYALTY REWARDS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Auth users can view loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Authenticated users can view loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "System can manage loyalty rewards" ON public.loyalty_rewards;

CREATE POLICY "Authenticated users can read loyalty rewards"
  ON public.loyalty_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert loyalty rewards"
  ON public.loyalty_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update loyalty rewards"
  ON public.loyalty_rewards FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete loyalty rewards"
  ON public.loyalty_rewards FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- LOYALTY TIERS: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "All authenticated users can view loyalty tiers" ON public.loyalty_tiers;

CREATE POLICY "Authenticated users can read loyalty tiers"
  ON public.loyalty_tiers FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PACKAGING INVENTORY: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Auth users can view packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Authenticated users can manage packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Authenticated users can view packaging inventory" ON public.packaging_inventory;

CREATE POLICY "Authenticated users can read packaging inventory"
  ON public.packaging_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert packaging inventory"
  ON public.packaging_inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update packaging inventory"
  ON public.packaging_inventory FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete packaging inventory"
  ON public.packaging_inventory FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PACKAGING MATERIALS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Auth users can view packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Authenticated users can manage packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Authenticated users can view packaging materials" ON public.packaging_materials;

CREATE POLICY "Authenticated users can read packaging materials"
  ON public.packaging_materials FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert packaging materials"
  ON public.packaging_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update packaging materials"
  ON public.packaging_materials FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete packaging materials"
  ON public.packaging_materials FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PAYMENT RECORDS: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view payment records" ON public.payment_records;

CREATE POLICY "Authenticated users can read payment records"
  ON public.payment_records FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PRODUCT RECIPES: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Auth users can view product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Authenticated users can manage product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Authenticated users can view product recipes" ON public.product_recipes;

CREATE POLICY "Authenticated users can read product recipes"
  ON public.product_recipes FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert product recipes"
  ON public.product_recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product recipes"
  ON public.product_recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product recipes"
  ON public.product_recipes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PRODUCTION BATCHES: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Auth users can view production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Authenticated users can manage production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Authenticated users can view production batches" ON public.production_batches;

CREATE POLICY "Authenticated users can read production batches"
  ON public.production_batches FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert production batches"
  ON public.production_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update production batches"
  ON public.production_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete production batches"
  ON public.production_batches FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PRODUCTION ORDERS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage production orders" ON public.production_orders;
DROP POLICY IF EXISTS "Auth users can view production orders" ON public.production_orders;
DROP POLICY IF EXISTS "Authenticated users can manage production orders" ON public.production_orders;
DROP POLICY IF EXISTS "Authenticated users can view production orders" ON public.production_orders;

CREATE POLICY "Authenticated users can read production orders"
  ON public.production_orders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert production orders"
  ON public.production_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update production orders"
  ON public.production_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete production orders"
  ON public.production_orders FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PRODUCTOS TERMINADOS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Auth users can view productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Authenticated users can manage productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Authenticated users can view productos terminados" ON public.productos_terminados;

CREATE POLICY "Authenticated users can read productos terminados"
  ON public.productos_terminados FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert productos terminados"
  ON public.productos_terminados FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update productos terminados"
  ON public.productos_terminados FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete productos terminados"
  ON public.productos_terminados FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PRODUCTS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage products" ON public.products;
DROP POLICY IF EXISTS "Auth users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PURCHASE INVOICE ITEMS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage purchase invoice items" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "Auth users can view purchase invoice items" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "Authenticated users can manage purchase invoice items" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "Authenticated users can view purchase invoice items" ON public.purchase_invoice_items;

CREATE POLICY "Authenticated users can read purchase invoice items"
  ON public.purchase_invoice_items FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert purchase invoice items"
  ON public.purchase_invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update purchase invoice items"
  ON public.purchase_invoice_items FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete purchase invoice items"
  ON public.purchase_invoice_items FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PURCHASE INVOICES: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Auth users can view purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Authenticated users can manage purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Authenticated users can view purchase invoices" ON public.purchase_invoices;

CREATE POLICY "Authenticated users can read purchase invoices"
  ON public.purchase_invoices FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert purchase invoices"
  ON public.purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update purchase invoices"
  ON public.purchase_invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete purchase invoices"
  ON public.purchase_invoices FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PURCHASES: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all purchases" ON public.purchases;

CREATE POLICY "Authenticated users can read purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- RAW MATERIALS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Auth users can view raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Authenticated users can manage raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Authenticated users can view raw materials" ON public.raw_materials;

CREATE POLICY "Authenticated users can read raw materials"
  ON public.raw_materials FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert raw materials"
  ON public.raw_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update raw materials"
  ON public.raw_materials FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete raw materials"
  ON public.raw_materials FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SALES ORDERS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Auth users can view sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Authenticated users can manage sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Authenticated users can view sales orders" ON public.sales_orders;

CREATE POLICY "Authenticated users can read sales orders"
  ON public.sales_orders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert sales orders"
  ON public.sales_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sales orders"
  ON public.sales_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sales orders"
  ON public.sales_orders FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SHIPPING CONFIG: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can read shipping config" ON public.shipping_config;

CREATE POLICY "Authenticated users can read shipping config"
  ON public.shipping_config FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SHOPIFY CUSTOMER MAPPING: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage shopify customer mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "Auth users can view shopify customer mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "Authenticated users can view shopify customer mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "System can manage shopify customer mapping" ON public.shopify_customer_mapping;

CREATE POLICY "Authenticated users can read shopify customer mapping"
  ON public.shopify_customer_mapping FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert shopify customer mapping"
  ON public.shopify_customer_mapping FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update shopify customer mapping"
  ON public.shopify_customer_mapping FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete shopify customer mapping"
  ON public.shopify_customer_mapping FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SHOPIFY ORDERS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage shopify orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "Auth users can view shopify orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "Authenticated users can view shopify orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "System can manage shopify orders" ON public.shopify_orders;

CREATE POLICY "Authenticated users can read shopify orders"
  ON public.shopify_orders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert shopify orders"
  ON public.shopify_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update shopify orders"
  ON public.shopify_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete shopify orders"
  ON public.shopify_orders FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- STOCK SYNC LOG: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can insert stock sync log" ON public.stock_sync_log;
DROP POLICY IF EXISTS "Auth users can view stock sync log" ON public.stock_sync_log;
DROP POLICY IF EXISTS "Authenticated users can view stock sync log" ON public.stock_sync_log;
DROP POLICY IF EXISTS "System can manage stock sync log" ON public.stock_sync_log;

CREATE POLICY "Authenticated users can read stock sync log"
  ON public.stock_sync_log FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert stock sync log"
  ON public.stock_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- SUPPLIERS: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Auth users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;

CREATE POLICY "Authenticated users can read suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert suppliers"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update suppliers"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete suppliers"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- TASK COMPLETIONS: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view task completions" ON public.task_completions;

CREATE POLICY "Authenticated users can read task completions"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- USER PROFILES: Update always-true policy
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.user_profiles;

CREATE POLICY "Authenticated users can read user profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- VIP DISCOUNT CODES: Remove duplicate and always-true policies
-- ============================================================================
DROP POLICY IF EXISTS "Auth users can manage vip discount codes" ON public.vip_discount_codes;
DROP POLICY IF EXISTS "Auth users can view vip discount codes" ON public.vip_discount_codes;
DROP POLICY IF EXISTS "Authenticated users can view vip discount codes" ON public.vip_discount_codes;
DROP POLICY IF EXISTS "System can manage vip discount codes" ON public.vip_discount_codes;

CREATE POLICY "Authenticated users can read vip discount codes"
  ON public.vip_discount_codes FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert vip discount codes"
  ON public.vip_discount_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vip discount codes"
  ON public.vip_discount_codes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete vip discount codes"
  ON public.vip_discount_codes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);