/*
  # Fix Security and Performance Issues - Part 5: Fix Security Definer View

  1. Replace SECURITY DEFINER view with SECURITY INVOKER
    - Prevents privilege escalation through views
    - Users will only see data they have permission to access
*/

DROP VIEW IF EXISTS public.batch_expiration_alerts;
CREATE VIEW public.batch_expiration_alerts
WITH (security_invoker = true)
AS
SELECT
  pb.id,
  pb.batch_number,
  pb.product_id,
  p.name as product_name,
  pb.production_date,
  pb.expiration_date,
  pb.units_produced,
  CURRENT_DATE - pb.expiration_date as days_expired
FROM production_batches pb
JOIN products p ON pb.product_id = p.id
WHERE pb.expiration_date <= CURRENT_DATE + interval '30 days'
  AND pb.expiration_date >= CURRENT_DATE - interval '7 days'
ORDER BY pb.expiration_date ASC;
