/*
  # Fix Security and Performance Issues - Part 3: Remove Overly Permissive Policies

  1. Remove duplicate and overly permissive RLS policies
    - Remove "All authenticated users full access" policies
    - Remove policies with USING (true) that bypass security
    - Keep only necessary restrictive policies
*/

-- ============================================================================
-- REMOVE OVERLY PERMISSIVE AND DUPLICATE POLICIES
-- ============================================================================

-- Remove "All authenticated users full access" policies (overly permissive)
DROP POLICY IF EXISTS "All authenticated users full access to business_config" ON public.business_config;
DROP POLICY IF EXISTS "All authenticated users full access to churn_alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "All authenticated users full access to customer_orders" ON public.customer_orders;
DROP POLICY IF EXISTS "All authenticated users full access to customers" ON public.customers;
DROP POLICY IF EXISTS "All authenticated users full access to email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "All authenticated users full access to finished_inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "All authenticated users full access to insumos" ON public.insumos;
DROP POLICY IF EXISTS "All authenticated users full access to inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "All authenticated users full access to loyalty_rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "All authenticated users full access to movimientos_inventario" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "All authenticated users full access to packaging_materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "All authenticated users full access to product_recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "All authenticated users full access to production_batches" ON public.production_batches;
DROP POLICY IF EXISTS "All authenticated users full access to productos_terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "All authenticated users full access to products" ON public.products;
DROP POLICY IF EXISTS "All authenticated users full access to raw_materials" ON public.raw_materials;
DROP POLICY IF EXISTS "All authenticated users full access to sales_orders" ON public.sales_orders;
DROP POLICY IF EXISTS "All authenticated users full access to shopify_config" ON public.shopify_config;
DROP POLICY IF EXISTS "All authenticated users full access to shopify_customer_mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "All authenticated users full access to shopify_orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "All authenticated users full access to stock_sync_log" ON public.stock_sync_log;
DROP POLICY IF EXISTS "All authenticated users full access to vip_discount_codes" ON public.vip_discount_codes;

-- Remove other overly permissive policies with USING (true)
DROP POLICY IF EXISTS "Authenticated users can view all churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Authenticated users can update churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Authenticated users can delete churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view all rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Authenticated users can insert rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Authenticated users can update rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Authenticated users can delete rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver insumos" ON public.insumos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar insumos" ON public.insumos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar insumos" ON public.insumos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar insumos" ON public.insumos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver movimientos" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Users can view packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Users can insert packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Users can update packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Users can delete packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Users can view product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Users can insert product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Users can update product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Users can delete product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Users can view production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Users can insert production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Users can update production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Users can delete production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Users can view products" ON public.products;
DROP POLICY IF EXISTS "Users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update products" ON public.products;
DROP POLICY IF EXISTS "Users can delete products" ON public.products;
DROP POLICY IF EXISTS "Users can view raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Users can insert raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Users can update raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Users can delete raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Users can view sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Users can insert sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Users can update sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Users can delete sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "System can manage customer mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "Authenticated users can view customer mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "Authenticated users can view shopify orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "System can insert shopify orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "Authenticated users can view sync log" ON public.stock_sync_log;
DROP POLICY IF EXISTS "System can insert sync log" ON public.stock_sync_log;
DROP POLICY IF EXISTS "Users can view finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Users can insert finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Users can update finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Users can view inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Users can insert inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Users can update business config" ON public.business_config;
DROP POLICY IF EXISTS "Users can view business config" ON public.business_config;
DROP POLICY IF EXISTS "Allow authenticated users to update fiscal config" ON public.fiscal_config;
DROP POLICY IF EXISTS "Authenticated users can insert fixed costs" ON public.fixed_costs_config;
DROP POLICY IF EXISTS "Authenticated users can update fixed costs" ON public.fixed_costs_config;
DROP POLICY IF EXISTS "Users can create inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Users can create customer payment history" ON public.customer_payment_history;
DROP POLICY IF EXISTS "Users can create payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update purchases" ON public.purchases;
DROP POLICY IF EXISTS "System can create activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can create KPIs" ON public.weekly_kpis;
DROP POLICY IF EXISTS "Users can manage accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can view accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can manage accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Users can view accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Users can manage fiscal calendar" ON public.fiscal_calendar;
DROP POLICY IF EXISTS "Users can view fiscal calendar" ON public.fiscal_calendar;
DROP POLICY IF EXISTS "Users can manage packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Users can view packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Users can manage production orders" ON public.production_orders;
DROP POLICY IF EXISTS "Users can view production orders" ON public.production_orders;
DROP POLICY IF EXISTS "Users can manage purchase invoice items" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "Users can view purchase invoice items" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "Users can manage purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can view purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view suppliers" ON public.suppliers;
