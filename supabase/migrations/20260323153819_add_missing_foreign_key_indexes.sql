/*
  # Add Missing Foreign Key Indexes

  ## Summary
  Adds covering indexes for all foreign keys that are missing them to improve query performance.

  ## Indexes Added (24 total)
  - accounts_payable: invoice_id, supplier_id
  - accounts_receivable: customer_id, sales_order_id
  - announcement_reads: user_id
  - churn_alerts: customer_id
  - customer_payment_history: receivable_id
  - daily_tasks: created_by
  - fixed_costs_config: updated_by
  - inventory_movements: packaging_inventory_id
  - inventory_transactions: product_id, raw_material_id
  - loyalty_rewards: order_id
  - movimientos_inventario: created_by
  - payment_records: payable_id
  - production_orders: product_id
  - products: packaging_material_id
  - purchase_invoice_items: invoice_id, packaging_inventory_id
  - shopify_customer_mapping: customer_id
  - system_announcements: created_by
  - task_completions: task_id
  - vip_discount_codes: customer_id, order_id
*/

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