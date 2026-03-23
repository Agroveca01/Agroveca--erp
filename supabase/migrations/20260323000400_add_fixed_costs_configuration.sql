/*
  # Add Fixed Costs Configuration

  1. New Tables
    - `fixed_costs_config`
      - `id` (uuid, primary key)
      - `container_cost` (numeric) - Costo del envase (botella + gatillo/tapa)
      - `packaging_cost` (numeric) - Costo del empaque (caja/bolsa/cinta)
      - `label_cost` (numeric) - Costo de la etiqueta resistente
      - `shipping_cost` (numeric) - Costo de envío/logística
      - `updated_at` (timestamptz) - Fecha de última actualización
      - `updated_by` (uuid) - Usuario que actualizó

  2. Security
    - Enable RLS on `fixed_costs_config` table
    - Add policy for authenticated users to read fixed costs
    - Add policy for authenticated users to update fixed costs

  3. Initial Data
    - Insert default fixed costs configuration
*/

CREATE TABLE IF NOT EXISTS fixed_costs_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_cost numeric DEFAULT 450,
  packaging_cost numeric DEFAULT 500,
  label_cost numeric DEFAULT 150,
  shipping_cost numeric DEFAULT 750,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE fixed_costs_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fixed costs"
  ON fixed_costs_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update fixed costs"
  ON fixed_costs_config
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert fixed costs"
  ON fixed_costs_config
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM fixed_costs_config LIMIT 1) THEN
    INSERT INTO fixed_costs_config (container_cost, packaging_cost, label_cost, shipping_cost)
    VALUES (450, 500, 150, 750);
  END IF;
END $$;