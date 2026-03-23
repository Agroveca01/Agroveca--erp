/*
  # Fix Remaining Function Search Paths (v3)

  ## Summary
  This migration fixes the remaining functions that have SECURITY INVOKER
  or missing search_path configurations.

  ## Functions Fixed
  - calculate_optimal_price (overloaded version)
  - calculate_shopify_commission (overloaded version)
  - calculate_units_per_batch (overloaded version)
  - calculate_vat_credit (trigger function)
  - generate_vip_discount_code (overloaded version)
  - log_email_event (overloaded version)
  - update_updated_at_column

  ## Security Improvement
  All functions now have:
  - SECURITY DEFINER to run with schema owner privileges
  - search_path = 'public, pg_temp' to prevent search_path attacks
*/

-- Drop overloaded versions that need fixing
DROP FUNCTION IF EXISTS public.calculate_optimal_price(numeric, numeric, numeric, numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_shopify_commission(numeric, numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_units_per_batch(text, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_vat_credit() CASCADE;
DROP FUNCTION IF EXISTS public.generate_vip_discount_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.log_email_event(uuid, uuid, text, text, text, boolean, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Recreate with secure search_path

CREATE FUNCTION public.calculate_optimal_price(
  unit_cost numeric,
  packaging_cost numeric,
  shipping_cost numeric,
  target_margin numeric DEFAULT 0.70,
  commission_pct numeric DEFAULT 5.0
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  total_cost numeric;
  optimal_price numeric;
BEGIN
  total_cost := unit_cost + packaging_cost + shipping_cost;
  optimal_price := total_cost / (1 - target_margin - (commission_pct / 100));
  RETURN ROUND(optimal_price, 2);
END;
$$;

CREATE FUNCTION public.calculate_shopify_commission(
  total_amount numeric,
  commission_pct numeric DEFAULT 2.00,
  gateway_pct numeric DEFAULT 2.50
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN ROUND(total_amount * ((commission_pct + gateway_pct) / 100), 2);
END;
$$;

CREATE FUNCTION public.calculate_units_per_batch(
  product_format text,
  batch_size_liters numeric DEFAULT 100
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  unit_size numeric;
BEGIN
  unit_size := CASE 
    WHEN product_format = '60ml' THEN 0.06
    WHEN product_format = '120ml' THEN 0.12
    WHEN product_format = '250ml' THEN 0.25
    WHEN product_format = '500ml' THEN 0.50
    WHEN product_format = '1L' THEN 1.00
    ELSE 0.25
  END;
  
  RETURN FLOOR(batch_size_liters / unit_size);
END;
$$;

CREATE FUNCTION public.calculate_vat_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  vat_rate numeric := 16;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    NEW.vat_credit := ROUND(NEW.total_net * (vat_rate / 100), 2);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Recreate trigger for calculate_vat_credit
CREATE TRIGGER calculate_vat_credit_trigger
  BEFORE INSERT OR UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_vat_credit();

CREATE FUNCTION public.generate_vip_discount_code(customer_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  code_prefix text := 'VIP';
  random_suffix text;
  final_code text;
BEGIN
  random_suffix := upper(substring(md5(random()::text || customer_name) from 1 for 6));
  final_code := code_prefix || random_suffix;
  RETURN final_code;
END;
$$;

CREATE FUNCTION public.log_email_event(
  p_customer_id uuid,
  p_discount_code_id uuid,
  p_email_type text,
  p_recipient_email text,
  p_subject text,
  p_delivered boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.email_logs (
    customer_id,
    discount_code_id,
    email_type,
    recipient_email,
    subject,
    status,
    error_message,
    sent_at
  )
  VALUES (
    p_customer_id,
    p_discount_code_id,
    p_email_type,
    p_recipient_email,
    p_subject,
    CASE WHEN p_delivered THEN 'delivered' ELSE 'failed' END,
    p_error_message,
    NOW()
  );
END;
$$;

CREATE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers that were dropped with CASCADE
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = pg_tables.tablename 
      AND column_name = 'updated_at'
    )
  LOOP
    BEGIN
      EXECUTE format('
        CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column()
      ', r.tablename, r.tablename);
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END $$;