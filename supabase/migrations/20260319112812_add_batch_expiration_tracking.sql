/*
  # Add Batch Expiration Tracking

  ## Overview
  Adds expiration tracking for production batches, especially for biological materials.

  ## Changes
  
  1. Production Batches Table Updates
    - Add `production_date` column (defaults to batch_date)
    - Add `expiration_date` column (calculated based on product type)
    - Add `shelf_life_months` column (12 months for substrates with biologicals)
    
  2. Expiration Alerts View
    - Creates a view to easily query batches nearing expiration
    - Alerts trigger at 75% of shelf life (9 months for 12-month products)

  ## Security
  - RLS policies already cover these columns
*/

-- Add expiration tracking columns to production_batches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_batches' AND column_name = 'production_date'
  ) THEN
    ALTER TABLE production_batches ADD COLUMN production_date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_batches' AND column_name = 'expiration_date'
  ) THEN
    ALTER TABLE production_batches ADD COLUMN expiration_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_batches' AND column_name = 'shelf_life_months'
  ) THEN
    ALTER TABLE production_batches ADD COLUMN shelf_life_months integer DEFAULT 12;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_batches' AND column_name = 'alert_threshold_months'
  ) THEN
    ALTER TABLE production_batches ADD COLUMN alert_threshold_months integer DEFAULT 9;
  END IF;
END $$;

-- Create view for expiration alerts
CREATE OR REPLACE VIEW batch_expiration_alerts AS
SELECT 
  pb.id,
  pb.batch_number,
  pb.production_date,
  pb.expiration_date,
  pb.shelf_life_months,
  pb.alert_threshold_months,
  p.name as product_name,
  p.product_id,
  p.product_type,
  CURRENT_DATE - pb.production_date as age_days,
  pb.expiration_date - CURRENT_DATE as days_until_expiration,
  CASE 
    WHEN pb.expiration_date IS NULL THEN 'no_expiration'
    WHEN CURRENT_DATE >= pb.expiration_date THEN 'expired'
    WHEN CURRENT_DATE >= (pb.production_date + (pb.alert_threshold_months || ' months')::interval) THEN 'warning'
    ELSE 'good'
  END as status
FROM production_batches pb
JOIN products p ON pb.product_id = p.id
WHERE pb.expiration_date IS NOT NULL
ORDER BY pb.expiration_date ASC;

-- Grant access to the view
GRANT SELECT ON batch_expiration_alerts TO authenticated;

-- Update existing batches to set expiration dates
UPDATE production_batches
SET 
  production_date = batch_date,
  expiration_date = batch_date + (shelf_life_months || ' months')::interval
WHERE expiration_date IS NULL;
