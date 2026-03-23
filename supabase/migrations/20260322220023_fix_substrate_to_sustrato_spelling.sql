/*
  # Fix Substrate to Sustrato spelling

  ## Changes Made
  1. Updates product_type constraint in products table
    - Changes 'substrate' to 'sustrato' to match correct Spanish spelling
    - Adds 'rtu-gatillo' as a new valid product type
  2. Migration Notes
    - Uses conditional logic to avoid errors if constraint already exists
    - Preserves all existing data
    - Updates check constraint to include new product types
*/

DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'products_product_type_check'
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_product_type_check;
  END IF;

  -- Add the new constraint with corrected spelling and new type
  ALTER TABLE products ADD CONSTRAINT products_product_type_check 
    CHECK (product_type IN ('concentrado', 'sustrato', 'rtu-gatillo'));
END $$;
