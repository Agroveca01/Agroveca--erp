/*
  # Fix Security and Performance Issues - Part 4: Function Search Path Protection (Group 3)

  1. Add search_path protection to remaining functions
*/

DROP FUNCTION IF EXISTS public.update_aging_category() CASCADE;
CREATE FUNCTION public.update_aging_category()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.days_overdue = 0 THEN
    NEW.aging_category := 'current';
  ELSIF NEW.days_overdue BETWEEN 1 AND 30 THEN
    NEW.aging_category := '1-30';
  ELSIF NEW.days_overdue BETWEEN 31 AND 60 THEN
    NEW.aging_category := '31-60';
  ELSIF NEW.days_overdue BETWEEN 61 AND 90 THEN
    NEW.aging_category := '61-90';
  ELSE
    NEW.aging_category := '90+';
  END IF;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.update_days_overdue() CASCADE;
CREATE FUNCTION public.update_days_overdue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.due_date < CURRENT_DATE THEN
    NEW.days_overdue := CURRENT_DATE - NEW.due_date;
  ELSE
    NEW.days_overdue := 0;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_daily_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM daily_tasks WHERE task_date < CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_daily_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM task_completions WHERE completed_at < CURRENT_DATE;
END;
$$;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operario')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.update_customer_statistics() CASCADE;
CREATE FUNCTION public.update_customer_statistics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_count integer;
  v_avg_order numeric;
BEGIN
  SELECT
    COUNT(*),
    AVG(total_amount)
  INTO v_order_count, v_avg_order
  FROM customer_orders
  WHERE customer_id = NEW.customer_id;

  UPDATE customers
  SET
    total_orders = v_order_count,
    average_order_value = v_avg_order,
    last_order_date = NEW.order_date
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_churn_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO churn_alerts (customer_id, alert_type, days_since_purchase)
  SELECT
    id,
    CASE
      WHEN CURRENT_DATE - last_order_date > 180 THEN 'high_risk'
      WHEN CURRENT_DATE - last_order_date > 120 THEN 'medium_risk'
      ELSE 'low_risk'
    END,
    CURRENT_DATE - last_order_date
  FROM customers
  WHERE last_order_date IS NOT NULL
    AND CURRENT_DATE - last_order_date > 90
    AND NOT EXISTS (
      SELECT 1 FROM churn_alerts ca
      WHERE ca.customer_id = customers.id
        AND ca.created_at > CURRENT_DATE - 30
    );
END;
$$;
