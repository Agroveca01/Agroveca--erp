/*
  # Optimize RLS Policies Part 3: Customers and CRM

  ## Summary
  Continues optimizing RLS policies by wrapping auth.uid() in SELECT subqueries.

  ## Tables Optimized (Part 3)
  - customers (4 policies)
  - customer_orders (4 policies)
  - loyalty_rewards (4 policies)
  - churn_alerts (4 policies)
  - vip_discount_codes (4 policies)
  - email_logs (2 policies)
*/

-- ============================================================================
-- CUSTOMERS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

CREATE POLICY "Authenticated users can read customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- CUSTOMER ORDERS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read customer orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can insert customer orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can update customer orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Authenticated users can delete customer orders" ON public.customer_orders;

CREATE POLICY "Authenticated users can read customer orders"
  ON public.customer_orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert customer orders"
  ON public.customer_orders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update customer orders"
  ON public.customer_orders FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete customer orders"
  ON public.customer_orders FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- LOYALTY REWARDS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Authenticated users can insert loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Authenticated users can update loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Authenticated users can delete loyalty rewards" ON public.loyalty_rewards;

CREATE POLICY "Authenticated users can read loyalty rewards"
  ON public.loyalty_rewards FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert loyalty rewards"
  ON public.loyalty_rewards FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update loyalty rewards"
  ON public.loyalty_rewards FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete loyalty rewards"
  ON public.loyalty_rewards FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- CHURN ALERTS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Authenticated users can update churn alerts" ON public.churn_alerts;
DROP POLICY IF EXISTS "Authenticated users can delete churn alerts" ON public.churn_alerts;

CREATE POLICY "Authenticated users can read churn alerts"
  ON public.churn_alerts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert churn alerts"
  ON public.churn_alerts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update churn alerts"
  ON public.churn_alerts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete churn alerts"
  ON public.churn_alerts FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- VIP DISCOUNT CODES
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read vip discount codes" ON public.vip_discount_codes;
DROP POLICY IF EXISTS "Authenticated users can insert vip discount codes" ON public.vip_discount_codes;
DROP POLICY IF EXISTS "Authenticated users can update vip discount codes" ON public.vip_discount_codes;
DROP POLICY IF EXISTS "Authenticated users can delete vip discount codes" ON public.vip_discount_codes;

CREATE POLICY "Authenticated users can read vip discount codes"
  ON public.vip_discount_codes FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert vip discount codes"
  ON public.vip_discount_codes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update vip discount codes"
  ON public.vip_discount_codes FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete vip discount codes"
  ON public.vip_discount_codes FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- EMAIL LOGS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Authenticated users can insert email logs" ON public.email_logs;

CREATE POLICY "Authenticated users can read email logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert email logs"
  ON public.email_logs FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);