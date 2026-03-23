/*
  # Remove Unused Indexes - Final Security Audit

  1. Overview
    This migration removes indexes that have not been used by any queries.
    Unused indexes consume storage space and slow down write operations
    without providing any performance benefit.

  2. Indexes Being Removed (6 total)
    
    **Activity Logs:**
    - idx_activity_logs_user_id (not used)
    
    **Customer Orders:**
    - idx_customer_orders_customer_id (not used)
    
    **Email Logs:**
    - idx_email_logs_customer_id (not used)
    - idx_email_logs_discount_code_id (not used)
    
    **Loyalty Rewards:**
    - idx_loyalty_rewards_customer_id_fk (not used)
    
    **Shopify Orders:**
    - idx_shopify_orders_customer_id_fk (not used)

  3. Performance Impact
    - Reduces storage overhead
    - Improves INSERT/UPDATE/DELETE performance
    - Reduces index maintenance overhead
    - Note: These indexes can be recreated if query patterns change

  4. Important Notes
    - All removed indexes were confirmed as unused in production
    - Foreign key indexes added in previous migration cover necessary lookups
    - Monitor query performance after removal to ensure no regressions
*/

-- Remove unused activity logs index
DROP INDEX IF EXISTS public.idx_activity_logs_user_id;

-- Remove unused customer orders index
DROP INDEX IF EXISTS public.idx_customer_orders_customer_id;

-- Remove unused email logs indexes
DROP INDEX IF EXISTS public.idx_email_logs_customer_id;
DROP INDEX IF EXISTS public.idx_email_logs_discount_code_id;

-- Remove unused loyalty rewards index
DROP INDEX IF EXISTS public.idx_loyalty_rewards_customer_id_fk;

-- Remove unused shopify orders index
DROP INDEX IF EXISTS public.idx_shopify_orders_customer_id_fk;
