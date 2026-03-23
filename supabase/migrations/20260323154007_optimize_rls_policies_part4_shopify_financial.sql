/*
  # Optimize RLS Policies Part 4: Shopify and Financial

  ## Summary
  Continues optimizing RLS policies by wrapping auth.uid() in SELECT subqueries.

  ## Tables Optimized (Part 4)
  - shopify_orders (4 policies)
  - shopify_customer_mapping (4 policies)
  - shopify_config (5 policies with role checks)
  - stock_sync_log (2 policies)
  - accounts_payable (4 policies)
  - accounts_receivable (4 policies)
  - payment_records (1 policy)
  - customer_payment_history (1 policy)
*/

-- ============================================================================
-- SHOPIFY ORDERS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read shopify orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "Authenticated users can insert shopify orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "Authenticated users can update shopify orders" ON public.shopify_orders;
DROP POLICY IF EXISTS "Authenticated users can delete shopify orders" ON public.shopify_orders;

CREATE POLICY "Authenticated users can read shopify orders"
  ON public.shopify_orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert shopify orders"
  ON public.shopify_orders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update shopify orders"
  ON public.shopify_orders FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete shopify orders"
  ON public.shopify_orders FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- SHOPIFY CUSTOMER MAPPING
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read shopify customer mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "Authenticated users can insert shopify customer mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "Authenticated users can update shopify customer mapping" ON public.shopify_customer_mapping;
DROP POLICY IF EXISTS "Authenticated users can delete shopify customer mapping" ON public.shopify_customer_mapping;

CREATE POLICY "Authenticated users can read shopify customer mapping"
  ON public.shopify_customer_mapping FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert shopify customer mapping"
  ON public.shopify_customer_mapping FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update shopify customer mapping"
  ON public.shopify_customer_mapping FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete shopify customer mapping"
  ON public.shopify_customer_mapping FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- SHOPIFY CONFIG (Admin only - optimize role checks)
-- ============================================================================
DROP POLICY IF EXISTS "Admins only can access shopify config" ON public.shopify_config;

CREATE POLICY "Admins only can access shopify config"
  ON public.shopify_config
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE user_id = (SELECT auth.uid())) = 'admin'
  );

-- ============================================================================
-- STOCK SYNC LOG
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read stock sync log" ON public.stock_sync_log;
DROP POLICY IF EXISTS "Authenticated users can insert stock sync log" ON public.stock_sync_log;

CREATE POLICY "Authenticated users can read stock sync log"
  ON public.stock_sync_log FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert stock sync log"
  ON public.stock_sync_log FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- ACCOUNTS PAYABLE
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can insert accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can update accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can delete accounts payable" ON public.accounts_payable;

CREATE POLICY "Authenticated users can read accounts payable"
  ON public.accounts_payable FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert accounts payable"
  ON public.accounts_payable FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update accounts payable"
  ON public.accounts_payable FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete accounts payable"
  ON public.accounts_payable FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- ACCOUNTS RECEIVABLE
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can insert accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can update accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can delete accounts receivable" ON public.accounts_receivable;

CREATE POLICY "Authenticated users can read accounts receivable"
  ON public.accounts_receivable FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert accounts receivable"
  ON public.accounts_receivable FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update accounts receivable"
  ON public.accounts_receivable FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete accounts receivable"
  ON public.accounts_receivable FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PAYMENT RECORDS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read payment records" ON public.payment_records;

CREATE POLICY "Authenticated users can read payment records"
  ON public.payment_records FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- CUSTOMER PAYMENT HISTORY
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read customer payment history" ON public.customer_payment_history;

CREATE POLICY "Authenticated users can read customer payment history"
  ON public.customer_payment_history FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);