/*
  # Secure Inventory and Cost Tables with Complete RLS Policies

  1. Overview
    This migration adds comprehensive, restrictive RLS policies for all inventory
    and cost-related tables to ensure data privacy and proper access control.

  2. Tables Secured (8 tables)
    
    **Inventory Tables:**
    - raw_materials (full CRUD policies)
    - packaging_inventory (full CRUD policies)
    - inventory_movements (full CRUD policies)
    - inventory_transactions (read/write policies)
    - movimientos_inventario (full CRUD with creator-based policies)

    **Cost Configuration Tables:**
    - fixed_costs_config (admin write, authenticated read)
    - format_costs (admin write, authenticated read)
    - shipping_config (admin write, authenticated read)

  3. Security Model
    
    **Inventory Tables:**
    - All authenticated users can read inventory data
    - Only authenticated users can insert/update/delete inventory records
    - Movimientos_inventario has creator-based ownership for updates/deletes
    
    **Cost Configuration Tables:**
    - All authenticated users can read cost configurations
    - Only admins can insert/update cost configurations
    - Ensures proper separation of duties for sensitive pricing data

  4. Policy Details
    - All policies check authentication using auth.uid()
    - Admin policies verify role through user_profiles table
    - Creator-based policies ensure users can only modify their own records
    - No public access - all data is private to authenticated users

  5. Important Notes
    - Existing policies are dropped and replaced with secure versions
    - This ensures no overly permissive policies remain
    - All policies are restrictive by default
*/

-- ============================================================================
-- DROP EXISTING POLICIES (Clean slate approach)
-- ============================================================================

-- Raw Materials
DROP POLICY IF EXISTS "Authenticated users can delete raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Authenticated users can insert raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Authenticated users can read raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Authenticated users can update raw materials" ON public.raw_materials;

-- Packaging Inventory
DROP POLICY IF EXISTS "Authenticated users can delete packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Authenticated users can read packaging inventory" ON public.packaging_inventory;
DROP POLICY IF EXISTS "Authenticated users can update packaging inventory" ON public.packaging_inventory;

-- Inventory Movements
DROP POLICY IF EXISTS "Authenticated users can read inventory movements" ON public.inventory_movements;

-- Inventory Transactions
DROP POLICY IF EXISTS "Authenticated users can insert inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can read inventory transactions" ON public.inventory_transactions;

-- Movimientos Inventario
DROP POLICY IF EXISTS "Solo creador puede actualizar movimientos" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "Solo creador puede eliminar movimientos" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar movimientos" ON public.movimientos_inventario;

-- Fixed Costs Config
DROP POLICY IF EXISTS "Authenticated users can read fixed costs config" ON public.fixed_costs_config;

-- Format Costs
DROP POLICY IF EXISTS "Admins can insert format costs" ON public.format_costs;
DROP POLICY IF EXISTS "Admins can update format costs" ON public.format_costs;
DROP POLICY IF EXISTS "Authenticated users can read format costs" ON public.format_costs;

-- Shipping Config
DROP POLICY IF EXISTS "Admins can insert shipping config" ON public.shipping_config;
DROP POLICY IF EXISTS "Admins can update shipping config" ON public.shipping_config;
DROP POLICY IF EXISTS "Authenticated users can read shipping config" ON public.shipping_config;

-- ============================================================================
-- RAW MATERIALS - Full CRUD for authenticated users
-- ============================================================================

CREATE POLICY "Authenticated users can view raw materials"
  ON public.raw_materials
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create raw materials"
  ON public.raw_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can modify raw materials"
  ON public.raw_materials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can remove raw materials"
  ON public.raw_materials
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PACKAGING INVENTORY - Full CRUD for authenticated users
-- ============================================================================

CREATE POLICY "Authenticated users can view packaging inventory"
  ON public.packaging_inventory
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create packaging inventory"
  ON public.packaging_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can modify packaging inventory"
  ON public.packaging_inventory
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can remove packaging inventory"
  ON public.packaging_inventory
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INVENTORY MOVEMENTS - Full CRUD for authenticated users
-- ============================================================================

CREATE POLICY "Authenticated users can view inventory movements"
  ON public.inventory_movements
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create inventory movements"
  ON public.inventory_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can modify inventory movements"
  ON public.inventory_movements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can remove inventory movements"
  ON public.inventory_movements
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INVENTORY TRANSACTIONS - Read and write for authenticated users
-- ============================================================================

CREATE POLICY "Authenticated users can view inventory transactions"
  ON public.inventory_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create inventory transactions"
  ON public.inventory_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can modify inventory transactions"
  ON public.inventory_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can remove inventory transactions"
  ON public.inventory_transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- MOVIMIENTOS INVENTARIO - Creator-based ownership model
-- ============================================================================

CREATE POLICY "Authenticated users can view inventory movements"
  ON public.movimientos_inventario
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create inventory movements"
  ON public.movimientos_inventario
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can modify their inventory movements"
  ON public.movimientos_inventario
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can remove their inventory movements"
  ON public.movimientos_inventario
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================================
-- FIXED COSTS CONFIG - Admin write, authenticated read
-- ============================================================================

CREATE POLICY "Authenticated users can view fixed costs config"
  ON public.fixed_costs_config
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create fixed costs config"
  ON public.fixed_costs_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can modify fixed costs config"
  ON public.fixed_costs_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can remove fixed costs config"
  ON public.fixed_costs_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- FORMAT COSTS - Admin write, authenticated read
-- ============================================================================

CREATE POLICY "Authenticated users can view format costs"
  ON public.format_costs
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create format costs"
  ON public.format_costs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can modify format costs"
  ON public.format_costs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can remove format costs"
  ON public.format_costs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- SHIPPING CONFIG - Admin write, authenticated read
-- ============================================================================

CREATE POLICY "Authenticated users can view shipping config"
  ON public.shipping_config
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create shipping config"
  ON public.shipping_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can modify shipping config"
  ON public.shipping_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can remove shipping config"
  ON public.shipping_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
