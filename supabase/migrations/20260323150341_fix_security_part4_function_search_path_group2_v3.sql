/*
  # Fix Security and Performance Issues - Part 4: Function Search Path Protection (Group 2)

  1. Add search_path protection to functions (continued)
*/

DROP FUNCTION IF EXISTS public.mark_vip_email_sent(uuid);
CREATE FUNCTION public.mark_vip_email_sent(p_code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE vip_discount_codes
  SET email_sent = true, sent_at = now()
  WHERE id = p_code_id;
END;
$$;

DROP FUNCTION IF EXISTS public.log_email_event(uuid, uuid, text, jsonb);
CREATE FUNCTION public.log_email_event(
  p_customer_id uuid,
  p_discount_code_id uuid,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO email_logs (customer_id, discount_code_id, event_type, metadata)
  VALUES (p_customer_id, p_discount_code_id, p_event_type, p_metadata);
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_units_per_batch(numeric, numeric);
CREATE FUNCTION public.calculate_units_per_batch(
  p_batch_volume_ml numeric,
  p_unit_volume_ml numeric
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN floor(p_batch_volume_ml / p_unit_volume_ml)::integer;
END;
$$;

DROP FUNCTION IF EXISTS public.send_vip_email_notification() CASCADE;
CREATE FUNCTION public.send_vip_email_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-vip-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object(
      'discount_code_id', NEW.id,
      'customer_id', NEW.customer_id,
      'code', NEW.code,
      'discount_percentage', NEW.discount_percentage
    )
  );

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_optimal_price(uuid, numeric);
CREATE FUNCTION public.calculate_optimal_price(
  p_product_id uuid,
  p_desired_margin_percent numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_unit_cost numeric;
BEGIN
  SELECT unit_cost INTO v_unit_cost FROM products WHERE id = p_product_id;
  RETURN v_unit_cost * (1 + p_desired_margin_percent / 100);
END;
$$;

DROP FUNCTION IF EXISTS public.recalculate_product_pricing() CASCADE;
CREATE FUNCTION public.recalculate_product_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM recalculate_product_cost(NEW.product_id);
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_vat_credit(numeric, numeric);
CREATE FUNCTION public.calculate_vat_credit(net_amount numeric, vat_rate numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN net_amount * (vat_rate / 100);
END;
$$;

DROP FUNCTION IF EXISTS public.update_packaging_timestamp() CASCADE;
CREATE FUNCTION public.update_packaging_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_invoice_totals() CASCADE;
CREATE FUNCTION public.calculate_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_subtotal numeric;
  v_vat numeric;
BEGIN
  SELECT
    COALESCE(SUM(net_amount), 0),
    COALESCE(SUM(vat_amount), 0)
  INTO v_subtotal, v_vat
  FROM purchase_invoice_items
  WHERE invoice_id = NEW.invoice_id;

  UPDATE purchase_invoices
  SET
    subtotal = v_subtotal,
    vat = v_vat,
    total = v_subtotal + v_vat
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$;
