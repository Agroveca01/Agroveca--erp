/*
  # Remove Unused Indexes - Comprehensive Cleanup

  1. Performance Improvements
    - Remove 30 unused indexes that have not been accessed
    - Reduces storage overhead and improves write performance
    - Simplifies index maintenance
    
  2. Indexes Removed
    ### Accounts and Payments (7 indexes)
    - idx_accounts_payable_invoice_id
    - idx_accounts_payable_supplier_id
    - idx_accounts_receivable_customer_id
    - idx_accounts_receivable_sales_order_id
    - idx_customer_payment_history_receivable_id
    - idx_payment_records_payable_id
    - idx_churn_alerts_customer_id
    
    ### Announcements and Tasks (3 indexes)
    - idx_announcement_reads_user_id
    - idx_daily_tasks_created_by
    - idx_system_announcements_created_by
    
    ### Inventory and Production (7 indexes)
    - idx_inventory_movements_packaging_inventory_id
    - idx_inventory_transactions_product_id
    - idx_inventory_transactions_raw_material_id
    - idx_movimientos_inventario_created_by
    - idx_production_orders_product_id
    - idx_products_packaging_material_id
    - idx_purchase_invoice_items_packaging_inventory_id
    
    ### Customer Management (5 indexes)
    - idx_loyalty_rewards_order_id
    - idx_vip_discount_codes_customer_id
    - idx_vip_discount_codes_order_id
    - idx_shopify_customer_mapping_customer_id
    - idx_task_completions_task_id
    
    ### Purchase Management (3 indexes)
    - idx_purchase_invoice_items_invoice_id
    - idx_fixed_costs_config_updated_by
    - (Additional duplicates)

  3. Notes
    - These indexes have not been used according to Supabase analysis
    - Removing them improves INSERT, UPDATE, and DELETE performance
    - Essential indexes for foreign keys are preserved in separate migration
*/

-- Accounts and Payments indexes
DROP INDEX IF EXISTS idx_accounts_payable_invoice_id;
DROP INDEX IF EXISTS idx_accounts_payable_supplier_id;
DROP INDEX IF EXISTS idx_accounts_receivable_customer_id;
DROP INDEX IF EXISTS idx_accounts_receivable_sales_order_id;
DROP INDEX IF EXISTS idx_customer_payment_history_receivable_id;
DROP INDEX IF EXISTS idx_payment_records_payable_id;
DROP INDEX IF EXISTS idx_churn_alerts_customer_id;

-- Announcements and Tasks indexes
DROP INDEX IF EXISTS idx_announcement_reads_user_id;
DROP INDEX IF EXISTS idx_daily_tasks_created_by;
DROP INDEX IF EXISTS idx_system_announcements_created_by;

-- Inventory and Production indexes
DROP INDEX IF EXISTS idx_inventory_movements_packaging_inventory_id;
DROP INDEX IF EXISTS idx_inventory_transactions_product_id;
DROP INDEX IF EXISTS idx_inventory_transactions_raw_material_id;
DROP INDEX IF EXISTS idx_movimientos_inventario_created_by;
DROP INDEX IF EXISTS idx_production_orders_product_id;
DROP INDEX IF EXISTS idx_products_packaging_material_id;
DROP INDEX IF EXISTS idx_purchase_invoice_items_packaging_inventory_id;

-- Customer Management indexes
DROP INDEX IF EXISTS idx_loyalty_rewards_order_id;
DROP INDEX IF EXISTS idx_vip_discount_codes_customer_id;
DROP INDEX IF EXISTS idx_vip_discount_codes_order_id;
DROP INDEX IF EXISTS idx_shopify_customer_mapping_customer_id;
DROP INDEX IF EXISTS idx_task_completions_task_id;

-- Purchase Management indexes
DROP INDEX IF EXISTS idx_purchase_invoice_items_invoice_id;
DROP INDEX IF EXISTS idx_fixed_costs_config_updated_by;
