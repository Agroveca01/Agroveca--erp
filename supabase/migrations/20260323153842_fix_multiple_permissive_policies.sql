/*
  # Fix Multiple Permissive Policies

  ## Summary
  Removes duplicate permissive policies that cause multiple policy evaluation
  for the same action, keeping only the most appropriate policy for each table.

  ## Tables Fixed
  - business_config: Keep only admin management policy
  - fiscal_calendar: Keep only admin management policy  
  - shopify_config: Keep only consolidated admin policy
  - system_announcements: Keep only role-based view policy
*/

-- ============================================================================
-- BUSINESS CONFIG: Remove duplicates, keep admin policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage business config" ON public.business_config;
DROP POLICY IF EXISTS "Authenticated users can read business config" ON public.business_config;

-- Keep "Admins only can manage business config" for all admin operations
-- The read policy is covered by the admin management policy

-- ============================================================================
-- FISCAL CALENDAR: Remove duplicate read policy
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read fiscal calendar" ON public.fiscal_calendar;

-- Keep "Admins can manage fiscal calendar" which includes SELECT

-- ============================================================================
-- SHOPIFY CONFIG: Remove individual operation policies
-- ============================================================================
DROP POLICY IF EXISTS "Only admins can delete shopify config" ON public.shopify_config;
DROP POLICY IF EXISTS "Only admins can insert shopify config" ON public.shopify_config;
DROP POLICY IF EXISTS "Only admins can read shopify config" ON public.shopify_config;
DROP POLICY IF EXISTS "Only admins can update shopify config" ON public.shopify_config;

-- Keep "Admins only can access shopify config" which covers all operations

-- ============================================================================
-- SYSTEM ANNOUNCEMENTS: Remove less specific view policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view relevant announcements" ON public.system_announcements;

-- Keep "Users can view announcements for their target role" which is more specific