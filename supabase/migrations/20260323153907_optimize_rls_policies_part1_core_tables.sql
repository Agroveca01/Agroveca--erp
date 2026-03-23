/*
  # Optimize RLS Policies Part 1: Core Tables

  ## Summary
  Optimizes RLS policies by wrapping auth.uid() in SELECT subqueries to prevent
  re-evaluation for each row, significantly improving query performance at scale.

  ## Tables Optimized (Part 1)
  - raw_materials (4 policies)
  - packaging_materials (4 policies)
  - products (4 policies)
  - product_recipes (4 policies)
  - production_batches (4 policies)
  - insumos (4 policies)
  - productos_terminados (4 policies)
*/

-- ============================================================================
-- RAW MATERIALS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Authenticated users can insert raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Authenticated users can update raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Authenticated users can delete raw materials" ON public.raw_materials;

CREATE POLICY "Authenticated users can read raw materials"
  ON public.raw_materials FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert raw materials"
  ON public.raw_materials FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update raw materials"
  ON public.raw_materials FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete raw materials"
  ON public.raw_materials FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PACKAGING MATERIALS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Authenticated users can insert packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Authenticated users can update packaging materials" ON public.packaging_materials;
DROP POLICY IF EXISTS "Authenticated users can delete packaging materials" ON public.packaging_materials;

CREATE POLICY "Authenticated users can read packaging materials"
  ON public.packaging_materials FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert packaging materials"
  ON public.packaging_materials FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update packaging materials"
  ON public.packaging_materials FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete packaging materials"
  ON public.packaging_materials FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PRODUCTS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PRODUCT RECIPES
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Authenticated users can insert product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Authenticated users can update product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Authenticated users can delete product recipes" ON public.product_recipes;

CREATE POLICY "Authenticated users can read product recipes"
  ON public.product_recipes FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert product recipes"
  ON public.product_recipes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update product recipes"
  ON public.product_recipes FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete product recipes"
  ON public.product_recipes FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PRODUCTION BATCHES
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Authenticated users can insert production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Authenticated users can update production batches" ON public.production_batches;
DROP POLICY IF EXISTS "Authenticated users can delete production batches" ON public.production_batches;

CREATE POLICY "Authenticated users can read production batches"
  ON public.production_batches FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert production batches"
  ON public.production_batches FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update production batches"
  ON public.production_batches FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete production batches"
  ON public.production_batches FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- INSUMOS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can insert insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can update insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can delete insumos" ON public.insumos;

CREATE POLICY "Authenticated users can read insumos"
  ON public.insumos FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert insumos"
  ON public.insumos FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update insumos"
  ON public.insumos FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete insumos"
  ON public.insumos FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- PRODUCTOS TERMINADOS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Authenticated users can insert productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Authenticated users can update productos terminados" ON public.productos_terminados;
DROP POLICY IF EXISTS "Authenticated users can delete productos terminados" ON public.productos_terminados;

CREATE POLICY "Authenticated users can read productos terminados"
  ON public.productos_terminados FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert productos terminados"
  ON public.productos_terminados FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update productos terminados"
  ON public.productos_terminados FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete productos terminados"
  ON public.productos_terminados FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);