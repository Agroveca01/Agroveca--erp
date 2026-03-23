/*
  # Remove Unused Indexes from Previous Run

  ## Summary
  Removes 6 unused indexes that were created in the previous security fix
  but are not being used by the query planner.

  ## Indexes Removed
  - idx_activity_logs_user_id
  - idx_customer_orders_customer_id
  - idx_email_logs_customer_id
  - idx_email_logs_discount_code_id
  - idx_loyalty_rewards_customer_id
  - idx_shopify_orders_customer_id
*/

DROP INDEX IF EXISTS public.idx_activity_logs_user_id;
DROP INDEX IF EXISTS public.idx_customer_orders_customer_id;
DROP INDEX IF EXISTS public.idx_email_logs_customer_id;
DROP INDEX IF EXISTS public.idx_email_logs_discount_code_id;
DROP INDEX IF EXISTS public.idx_loyalty_rewards_customer_id;
DROP INDEX IF EXISTS public.idx_shopify_orders_customer_id;