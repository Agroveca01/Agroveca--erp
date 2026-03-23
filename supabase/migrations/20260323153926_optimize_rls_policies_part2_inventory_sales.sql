/*
  # Optimize RLS Policies Part 2: Inventory and Sales

  ## Summary
  Continues optimizing RLS policies by wrapping auth.uid() in SELECT subqueries.

  ## Tables Optimized (Part 2)
  - inventory_transactions (2 policies)
  - sales_orders (4 policies)
  - finished_inventory (4 policies)
  - packaging_inventory (4 policies)
  - inventory_movements (1 policy)
  - production_orders (4 policies)
*/

-- ============================================================================
-- INVENTORY TRANSACTIONS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert inventory transactions" ON public.inventory_transactions;

CREATE POLICY "Authenticated users can read inventory transactions"
  ON public.inventory_transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert inventory transactions"
  ON public.inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- SALES ORDERS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Authenticated users can insert sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Authenticated users can update sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Authenticated users can delete sales orders" ON public.sales_orders;

CREATE POLICY "Authenticated users can read sales orders"
  ON public.sales_orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert sales orders"
  ON public.sales_orders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update sales orders"
  ON public.sales_orders FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete sales orders"
  ON public.sales_orders FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- FINISHED INVENTORY
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Authenticated users can update finished inventory" ON public.finished_inventory;
DROP POLICY IF EXISTS "Authenticated users can delete finished inventory" ON public.finished_inventory;

CREATE POLICY "Authenticated users can read finished inventory"
  ON public.finished_inventory FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert finished inventory"
  ON public.finished_inventory FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update finished inventory"
  ON public.finished_inventory FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete finished inventory"
  ON public.finished_inventory FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PACKAGING INVENTORY
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Authenticated users can update packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Authenticated users can delete packaging inventory" ON public.packaging_inventory;

CREATE POLICY "Authenticated users can read packaging inventory"
  ON public.packaging_inventory FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert packaging inventory"
  ON public.packaging_inventory FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update packaging inventory"
  ON public.packaging_inventory FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete packaging inventory"
  ON public.packaging_inventory FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- INVENTORY MOVEMENTS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read inventory movements" ON public.inventory_movements;

CREATE POLICY "Authenticated users can read inventory movements"
  ON public.inventory_movements FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PRODUCTION ORDERS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read production orders" ON public.production_orders;
DROP POLICY IF EXISTS "Authenticated users can insert production orders" ON public.production_orders;
DROP POLICY IF EXISTS "Authenticated users can update production orders" ON public.production_orders;
DROP POLICY IF EXISTS "Authenticated users can delete production orders" ON public.production_orders;

CREATE POLICY "Authenticated users can read production orders"
  ON public.production_orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert production orders"
  ON public.production_orders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update production orders"
  ON public.production_orders FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete production orders"
  ON public.production_orders FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);