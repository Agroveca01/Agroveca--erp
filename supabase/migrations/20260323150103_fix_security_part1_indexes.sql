/*
  # Fix Security and Performance Issues - Part 1: Indexes

  1. Add Missing Foreign Key Indexes
    - 24 new indexes for foreign keys to improve JOIN performance
  
  2. Remove Unused Indexes
    - 29 unused indexes to reduce storage and update overhead
*/

-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_payable_invoice_id ON public.accounts_payable(invoice_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_supplier_id ON public.accounts_payable(supplier_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer_id ON public.accounts_receivable(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_sales_order_id ON public.accounts_receivable(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON public.announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_alerts_customer_id ON public.churn_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payment_history_receivable_id ON public.customer_payment_history(receivable_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_created_by ON public.daily_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_config_updated_by ON public.fixed_costs_config(updated_by);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_packaging_inventory_id ON public.inventory_movements(packaging_inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_raw_material_id ON public.inventory_transactions(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_order_id ON public.loyalty_rewards(order_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_created_by ON public.movimientos_inventario(created_by);
CREATE INDEX IF NOT EXISTS idx_payment_records_payable_id ON public.payment_records(payable_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_product_id ON public.production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_products_packaging_material_id ON public.products(packaging_material_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id ON public.purchase_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_packaging_inventory_id ON public.purchase_invoice_items(packaging_inventory_id);
CREATE INDEX IF NOT EXISTS idx_shopify_customer_mapping_customer_id ON public.shopify_customer_mapping(customer_id);
CREATE INDEX IF NOT EXISTS idx_system_announcements_created_by ON public.system_announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON public.task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_vip_discount_codes_customer_id ON public.vip_discount_codes(customer_id);
CREATE INDEX IF NOT EXISTS idx_vip_discount_codes_order_id ON public.vip_discount_codes(order_id);

-- ============================================================================
-- DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_inventory_transactions_date;
DROP INDEX IF EXISTS public.idx_raw_materials_qr_code;
DROP INDEX IF EXISTS public.idx_user_profiles_user_id;
DROP INDEX IF EXISTS public.idx_email_logs_customer_id;
DROP INDEX IF EXISTS public.idx_email_logs_discount_code_id;
DROP INDEX IF EXISTS public.idx_email_logs_sent_at;
DROP INDEX IF EXISTS public.idx_vip_codes_email_sent;
DROP INDEX IF EXISTS public.idx_movimientos_item;
DROP INDEX IF EXISTS public.idx_movimientos_tipo_item;
DROP INDEX IF EXISTS public.idx_productos_tipo;
DROP INDEX IF EXISTS public.idx_productos_activo;
DROP INDEX IF EXISTS public.idx_insumos_categoria;
DROP INDEX IF EXISTS public.idx_insumos_activo;
DROP INDEX IF EXISTS public.idx_insumos_codigo_qr;
DROP INDEX IF EXISTS public.idx_movimientos_tipo;
DROP INDEX IF EXISTS public.idx_movimientos_fecha;
DROP INDEX IF EXISTS public.idx_customers_email;
DROP INDEX IF EXISTS public.idx_customers_loyalty_tier;
DROP INDEX IF EXISTS public.idx_customer_orders_customer_id;
DROP INDEX IF EXISTS public.idx_loyalty_rewards_customer_id;
DROP INDEX IF EXISTS public.idx_shopify_orders_customer;
DROP INDEX IF EXISTS public.idx_shopify_customer_mapping_email;
DROP INDEX IF EXISTS public.idx_products_shopify_id;
DROP INDEX IF EXISTS public.idx_purchase_invoices_supplier;
DROP INDEX IF EXISTS public.idx_purchase_invoices_status;
DROP INDEX IF EXISTS public.idx_accounts_receivable_due_date;
DROP INDEX IF EXISTS public.idx_announcements_target_role;
DROP INDEX IF EXISTS public.idx_activity_logs_user;
DROP INDEX IF EXISTS public.idx_weekly_kpis_user_week;
