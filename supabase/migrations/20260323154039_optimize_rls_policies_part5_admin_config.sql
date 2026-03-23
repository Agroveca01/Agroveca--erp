/*
  # Optimize RLS Policies Part 5: Admin, Config, and Remaining Tables

  ## Summary
  Final part of RLS optimization - wrapping auth.uid() in SELECT subqueries
  for all remaining tables including admin, config, and user management tables.

  ## Tables Optimized (Part 5)
  - suppliers (4 policies)
  - purchase_invoices (4 policies)
  - purchase_invoice_items (4 policies)
  - business_config (1 admin policy)
  - fiscal_calendar (1 admin policy)
  - fixed_costs_config (1 policy)
  - format_costs (1 policy)
  - shipping_config (1 policy)
  - fiscal_config (1 policy)
  - purchases (1 policy)
  - loyalty_tiers (1 policy)
  - user_profiles (1 policy)
  - system_announcements (4 admin policies)
  - daily_tasks (4 admin policies)
  - task_completions (1 policy)
*/

-- ============================================================================
-- SUPPLIERS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;

CREATE POLICY "Authenticated users can read suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert suppliers"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update suppliers"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete suppliers"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PURCHASE INVOICES
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Authenticated users can insert purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Authenticated users can update purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Authenticated users can delete purchase invoices" ON public.purchase_invoices;

CREATE POLICY "Authenticated users can read purchase invoices"
  ON public.purchase_invoices FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert purchase invoices"
  ON public.purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update purchase invoices"
  ON public.purchase_invoices FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete purchase invoices"
  ON public.purchase_invoices FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PURCHASE INVOICE ITEMS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read purchase invoice items" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "Authenticated users can insert purchase invoice items" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "Authenticated users can update purchase invoice items" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "Authenticated users can delete purchase invoice items" ON public.purchase_invoice_items;

CREATE POLICY "Authenticated users can read purchase invoice items"
  ON public.purchase_invoice_items FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert purchase invoice items"
  ON public.purchase_invoice_items FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update purchase invoice items"
  ON public.purchase_invoice_items FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete purchase invoice items"
  ON public.purchase_invoice_items FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- BUSINESS CONFIG (Admin only)
-- ============================================================================
DROP POLICY IF EXISTS "Admins only can manage business config" ON public.business_config;

CREATE POLICY "Admins only can manage business config"
  ON public.business_config
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE user_id = (SELECT auth.uid())) = 'admin'
  );

-- ============================================================================
-- FISCAL CALENDAR (Admin only)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage fiscal calendar" ON public.fiscal_calendar;

CREATE POLICY "Admins can manage fiscal calendar"
  ON public.fiscal_calendar
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- CONFIG TABLES (Read-only for authenticated)
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read fixed costs config" ON public.fixed_costs_config;
CREATE POLICY "Authenticated users can read fixed costs config"
  ON public.fixed_costs_config FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read format costs" ON public.format_costs;
CREATE POLICY "Authenticated users can read format costs"
  ON public.format_costs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read shipping config" ON public.shipping_config;
CREATE POLICY "Authenticated users can read shipping config"
  ON public.shipping_config FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read fiscal config" ON public.fiscal_config;
CREATE POLICY "Authenticated users can read fiscal config"
  ON public.fiscal_config FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read purchases" ON public.purchases;
CREATE POLICY "Authenticated users can read purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read loyalty tiers" ON public.loyalty_tiers;
CREATE POLICY "Authenticated users can read loyalty tiers"
  ON public.loyalty_tiers FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- USER PROFILES
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read user profiles" ON public.user_profiles;
CREATE POLICY "Authenticated users can read user profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- SYSTEM ANNOUNCEMENTS (Admin management + role-based view)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.system_announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.system_announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.system_announcements;
DROP POLICY IF EXISTS "Users can view announcements for their target role" ON public.system_announcements;

CREATE POLICY "Admins can delete announcements"
  ON public.system_announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert announcements"
  ON public.system_announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update announcements"
  ON public.system_announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can view announcements for their target role"
  ON public.system_announcements FOR SELECT
  TO authenticated
  USING (
    target_role = 'all' OR 
    target_role = (
      SELECT role FROM public.user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- DAILY TASKS (Admin management + role-based view)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Users can view tasks for their assigned role" ON public.daily_tasks;

CREATE POLICY "Admins can delete tasks"
  ON public.daily_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert tasks"
  ON public.daily_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update tasks"
  ON public.daily_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can view tasks for their assigned role"
  ON public.daily_tasks FOR SELECT
  TO authenticated
  USING (
    assigned_role = 'all' OR 
    assigned_role = (
      SELECT role FROM public.user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- TASK COMPLETIONS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read task completions" ON public.task_completions;
CREATE POLICY "Authenticated users can read task completions"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);