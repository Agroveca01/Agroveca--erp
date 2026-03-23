/*
  # Add Missing Foreign Key Indexes - Final Security Audit

  1. Overview
    This migration adds indexes for all foreign keys that are currently unindexed
    to improve query performance and prevent suboptimal query execution plans.

  2. Foreign Key Indexes Added (24 total)
    
    **Accounts Payable & Receivable:**
    - accounts_payable.invoice_id
    - accounts_payable.supplier_id
    - accounts_receivable.customer_id
    - accounts_receivable.sales_order_id
    - customer_payment_history.receivable_id
    - payment_records.payable_id

    **Customer Relationship Management:**
    - churn_alerts.customer_id
    - announcement_reads.user_id
    - vip_discount_codes.customer_id
    - vip_discount_codes.order_id
    - shopify_customer_mapping.customer_id
    - loyalty_rewards.order_id

    **Inventory & Production:**
    - inventory_movements.packaging_inventory_id
    - inventory_transactions.product_id
    - inventory_transactions.raw_material_id
    - production_orders.product_id
    - products.packaging_material_id
    - purchase_invoice_items.invoice_id
    - purchase_invoice_items.packaging_inventory_id

    **System & User Management:**
    - daily_tasks.created_by
    - fixed_costs_config.updated_by
    - movimientos_inventario.created_by
    - system_announcements.created_by
    - task_completions.task_id

  3. Performance Impact
    - Improves JOIN performance for foreign key lookups
    - Speeds up CASCADE operations on DELETE/UPDATE
    - Optimizes queries filtering by foreign key columns
    - Reduces query planning time for complex queries
*/

-- Accounts Payable & Receivable Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_payable_invoice_id 
  ON public.accounts_payable(invoice_id);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_supplier_id 
  ON public.accounts_payable(supplier_id);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer_id 
  ON public.accounts_receivable(customer_id);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_sales_order_id 
  ON public.accounts_receivable(sales_order_id);

CREATE INDEX IF NOT EXISTS idx_customer_payment_history_receivable_id 
  ON public.customer_payment_history(receivable_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_payable_id 
  ON public.payment_records(payable_id);

-- Customer Relationship Management Indexes
CREATE INDEX IF NOT EXISTS idx_churn_alerts_customer_id 
  ON public.churn_alerts(customer_id);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id 
  ON public.announcement_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_vip_discount_codes_customer_id 
  ON public.vip_discount_codes(customer_id);

CREATE INDEX IF NOT EXISTS idx_vip_discount_codes_order_id 
  ON public.vip_discount_codes(order_id);

CREATE INDEX IF NOT EXISTS idx_shopify_customer_mapping_customer_id 
  ON public.shopify_customer_mapping(customer_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_order_id 
  ON public.loyalty_rewards(order_id);

-- Inventory & Production Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_packaging_inventory_id 
  ON public.inventory_movements(packaging_inventory_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id 
  ON public.inventory_transactions(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_raw_material_id 
  ON public.inventory_transactions(raw_material_id);

CREATE INDEX IF NOT EXISTS idx_production_orders_product_id 
  ON public.production_orders(product_id);

CREATE INDEX IF NOT EXISTS idx_products_packaging_material_id 
  ON public.products(packaging_material_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id 
  ON public.purchase_invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_packaging_inventory_id 
  ON public.purchase_invoice_items(packaging_inventory_id);

-- System & User Management Indexes
CREATE INDEX IF NOT EXISTS idx_daily_tasks_created_by 
  ON public.daily_tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_fixed_costs_config_updated_by 
  ON public.fixed_costs_config(updated_by);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_created_by 
  ON public.movimientos_inventario(created_by);

CREATE INDEX IF NOT EXISTS idx_system_announcements_created_by 
  ON public.system_announcements(created_by);

CREATE INDEX IF NOT EXISTS idx_task_completions_task_id 
  ON public.task_completions(task_id);
