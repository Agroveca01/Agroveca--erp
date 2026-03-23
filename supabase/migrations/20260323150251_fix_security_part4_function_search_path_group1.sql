/*
  # Fix Security and Performance Issues - Part 4: Function Search Path Protection (Group 1)

  1. Add search_path protection to functions
    - Prevents SQL injection via search_path manipulation
    - Sets search_path = public, pg_temp for all SECURITY DEFINER functions
*/

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_product_cost(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE products
  SET unit_cost = COALESCE((
    SELECT SUM(pr.quantity * rm.cost_per_unit)
    FROM product_recipes pr
    JOIN raw_materials rm ON pr.raw_material_id = rm.id
    WHERE pr.product_id = p_product_id
  ), 0)
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT role FROM user_profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_all_product_costs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  product_record RECORD;
BEGIN
  FOR product_record IN SELECT id FROM products LOOP
    PERFORM recalculate_product_cost(product_record.id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_shopify_commission(order_total numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN order_total * 0.029 + 0.30;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_vip_discount_code(p_customer_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN 'VIP' || UPPER(substring(md5(random()::text) from 1 for 8));
END;
$$;

CREATE OR REPLACE FUNCTION public.update_customer_loyalty_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  total_spent numeric;
  new_tier text;
BEGIN
  SELECT COALESCE(SUM(total_amount), 0) INTO total_spent
  FROM customer_orders
  WHERE customer_id = NEW.customer_id;

  IF total_spent >= 1000000 THEN
    new_tier := 'platino';
  ELSIF total_spent >= 500000 THEN
    new_tier := 'oro';
  ELSIF total_spent >= 250000 THEN
    new_tier := 'plata';
  ELSIF total_spent >= 100000 THEN
    new_tier := 'bronce';
  ELSE
    new_tier := 'basico';
  END IF;

  UPDATE customers
  SET loyalty_tier = new_tier,
      total_spent = total_spent
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_new_customer_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (SELECT loyalty_tier FROM customers WHERE id = NEW.customer_id) = 'platino' THEN
    INSERT INTO vip_discount_codes (customer_id, order_id, code, discount_percentage)
    VALUES (NEW.customer_id, NEW.id, generate_vip_discount_code(NEW.customer_id), 15);
  END IF;

  RETURN NEW;
END;
$$;
