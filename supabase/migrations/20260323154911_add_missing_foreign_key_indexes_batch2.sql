/*
  # Add Missing Foreign Key Indexes - Batch 2

  1. Performance Improvements
    - Add indexes on foreign key columns that were previously missing
    - Improves query performance for JOINs and foreign key constraint checks
    
  2. New Indexes Added
    - `idx_activity_logs_user_id` on activity_logs(user_id)
    - `idx_customer_orders_customer_id` on customer_orders(customer_id)
    - `idx_email_logs_customer_id` on email_logs(customer_id)
    - `idx_email_logs_discount_code_id` on email_logs(discount_code_id)
    - `idx_loyalty_rewards_customer_id` on loyalty_rewards(customer_id)
    - `idx_shopify_orders_customer_id` on shopify_orders(customer_id)

  3. Notes
    - These indexes are critical for optimal query performance
    - They prevent full table scans when joining or filtering by foreign keys
*/

-- Add index for activity_logs.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
ON activity_logs(user_id);

-- Add index for customer_orders.customer_id foreign key
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_id 
ON customer_orders(customer_id);

-- Add index for email_logs.customer_id foreign key
CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id 
ON email_logs(customer_id);

-- Add index for email_logs.discount_code_id foreign key
CREATE INDEX IF NOT EXISTS idx_email_logs_discount_code_id 
ON email_logs(discount_code_id);

-- Add index for loyalty_rewards.customer_id foreign key (if not already present from previous migration)
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_customer_id_fk 
ON loyalty_rewards(customer_id);

-- Add index for shopify_orders.customer_id foreign key (if not already present from previous migration)
CREATE INDEX IF NOT EXISTS idx_shopify_orders_customer_id_fk 
ON shopify_orders(customer_id);
