/*
  # Fix Security and Performance Issues - Part 2: RLS Optimizations

  1. Optimize RLS Policies
    - Fix auth function initialization with (select auth.uid())
    - Prevents re-evaluation of auth functions for each row
*/

-- ============================================================================
-- OPTIMIZE RLS POLICIES - FIX AUTH FUNCTION INITIALIZATION
-- ============================================================================

-- movimientos_inventario policies
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar movimientos" ON public.movimientos_inventario;
CREATE POLICY "Usuarios autenticados pueden insertar movimientos"
  ON public.movimientos_inventario FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Solo creador puede actualizar movimientos" ON public.movimientos_inventario;
CREATE POLICY "Solo creador puede actualizar movimientos"
  ON public.movimientos_inventario FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Solo creador puede eliminar movimientos" ON public.movimientos_inventario;
CREATE POLICY "Solo creador puede eliminar movimientos"
  ON public.movimientos_inventario FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- shopify_config policies
DROP POLICY IF EXISTS "Only admins can view shopify config" ON public.shopify_config;
CREATE POLICY "Only admins can view shopify config"
  ON public.shopify_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can modify shopify config" ON public.shopify_config;
CREATE POLICY "Only admins can modify shopify config"
  ON public.shopify_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- format_costs policies
DROP POLICY IF EXISTS "Admins can insert format costs" ON public.format_costs;
CREATE POLICY "Admins can insert format costs"
  ON public.format_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update format costs" ON public.format_costs;
CREATE POLICY "Admins can update format costs"
  ON public.format_costs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- shipping_config policies
DROP POLICY IF EXISTS "Admins can insert shipping config" ON public.shipping_config;
CREATE POLICY "Admins can insert shipping config"
  ON public.shipping_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update shipping config" ON public.shipping_config;
CREATE POLICY "Admins can update shipping config"
  ON public.shipping_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- system_announcements policies
DROP POLICY IF EXISTS "Users can view announcements for their role" ON public.system_announcements;
CREATE POLICY "Users can view announcements for their role"
  ON public.system_announcements FOR SELECT
  TO authenticated
  USING (
    target_role = 'all' OR
    target_role = (SELECT role FROM public.user_profiles WHERE id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.system_announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.system_announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- announcement_reads policies
DROP POLICY IF EXISTS "Users can view own reads" ON public.announcement_reads;
CREATE POLICY "Users can view own reads"
  ON public.announcement_reads FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can mark announcements as read" ON public.announcement_reads;
CREATE POLICY "Users can mark announcements as read"
  ON public.announcement_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- daily_tasks policies
DROP POLICY IF EXISTS "Users can view tasks for their role" ON public.daily_tasks;
CREATE POLICY "Users can view tasks for their role"
  ON public.daily_tasks FOR SELECT
  TO authenticated
  USING (
    assigned_role = 'all' OR
    assigned_role = (SELECT role FROM public.user_profiles WHERE id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can manage tasks" ON public.daily_tasks;
CREATE POLICY "Admins can manage tasks"
  ON public.daily_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- task_completions policies
DROP POLICY IF EXISTS "Users can complete their role tasks" ON public.task_completions;
CREATE POLICY "Users can complete their role tasks"
  ON public.task_completions FOR INSERT
  TO authenticated
  WITH CHECK (completed_by = (select auth.uid()));

-- activity_logs policies
DROP POLICY IF EXISTS "Users can view activity logs" ON public.activity_logs;
CREATE POLICY "Users can view activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- weekly_kpis policies
DROP POLICY IF EXISTS "Users can view own KPIs" ON public.weekly_kpis;
CREATE POLICY "Users can view own KPIs"
  ON public.weekly_kpis FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- user_profiles policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (id = (select auth.uid()));
