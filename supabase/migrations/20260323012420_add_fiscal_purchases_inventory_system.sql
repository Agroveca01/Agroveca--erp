/*
  # Sistema Completo de Gestión Fiscal, Compras e Inventario

  1. Nuevas Tablas
    - `fiscal_config`
      - Configuración de PPM y parámetros fiscales
    - `purchases`
      - Registro de compras de insumos con IVA Crédito
    - `packaging_inventory`
      - Inventario detallado de envases, tapas, gatillos, etiquetas
    - `inventory_movements`
      - Movimientos de entrada/salida de inventario
    - `production_orders`
      - Órdenes de producción con validación de insumos
    - `fiscal_calendar`
      - Recordatorios y obligaciones fiscales

  2. Security
    - Enable RLS en todas las tablas
    - Políticas para usuarios autenticados
*/

-- Configuración Fiscal
CREATE TABLE IF NOT EXISTS fiscal_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ppm_percentage numeric DEFAULT 1.0,
  estimated_vat_credit_monthly numeric DEFAULT 0,
  payment_day_reminder integer DEFAULT 20,
  closure_day_reminder integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fiscal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read fiscal config"
  ON fiscal_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update fiscal config"
  ON fiscal_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Registro de Compras
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date timestamptz DEFAULT now(),
  supplier_name text NOT NULL,
  item_type text NOT NULL,
  item_name text NOT NULL,
  quantity numeric NOT NULL,
  unit_price_gross numeric NOT NULL,
  total_gross numeric NOT NULL,
  total_net numeric NOT NULL,
  vat_credit numeric NOT NULL,
  invoice_number text,
  notes text,
  inventory_updated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inventario de Envases y Materiales
CREATE TABLE IF NOT EXISTS packaging_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_name text NOT NULL,
  format text,
  current_stock numeric DEFAULT 0,
  min_stock_alert numeric DEFAULT 24,
  optimal_stock numeric DEFAULT 100,
  unit_cost_net numeric DEFAULT 0,
  location text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_type, item_name, format)
);

ALTER TABLE packaging_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view packaging inventory"
  ON packaging_inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage packaging inventory"
  ON packaging_inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Movimientos de Inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packaging_inventory_id uuid REFERENCES packaging_inventory(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity numeric NOT NULL,
  reference_id uuid,
  reference_type text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory movements"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create inventory movements"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Órdenes de Producción
CREATE TABLE IF NOT EXISTS production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  product_id uuid REFERENCES products(id),
  target_units numeric NOT NULL,
  concentrate_required_liters numeric NOT NULL,
  water_required_liters numeric NOT NULL,
  status text DEFAULT 'pending',
  validation_passed boolean DEFAULT false,
  validation_errors jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  waste_units numeric DEFAULT 0,
  waste_liters numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view production orders"
  ON production_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage production orders"
  ON production_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Calendario Fiscal
CREATE TABLE IF NOT EXISTS fiscal_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_date date NOT NULL,
  reminder_type text NOT NULL,
  title text NOT NULL,
  description text,
  amount_estimated numeric DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fiscal_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fiscal calendar"
  ON fiscal_calendar FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage fiscal calendar"
  ON fiscal_calendar FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insertar configuración fiscal por defecto
INSERT INTO fiscal_config (ppm_percentage, estimated_vat_credit_monthly, payment_day_reminder, closure_day_reminder)
VALUES (1.0, 0, 20, 10)
ON CONFLICT DO NOTHING;

-- Insertar items de inventario base
INSERT INTO packaging_inventory (item_type, item_name, format, current_stock, min_stock_alert, optimal_stock) VALUES
  ('envase', 'Botella PET', '100cc', 0, 24, 100),
  ('envase', 'Botella PET', '200cc', 0, 24, 100),
  ('envase', 'Botella PET', '500cc', 0, 24, 100),
  ('tapa', 'Tapa Rosca', '100cc', 0, 24, 100),
  ('tapa', 'Tapa Rosca', '200cc', 0, 24, 100),
  ('gatillo', 'Gatillo Spray', '500cc', 0, 24, 100),
  ('etiqueta', 'Etiqueta', '100cc', 0, 24, 100),
  ('etiqueta', 'Etiqueta', '200cc', 0, 24, 100),
  ('etiqueta', 'Etiqueta', '500cc', 0, 24, 100)
ON CONFLICT (item_type, item_name, format) DO NOTHING;

-- Función para calcular IVA Crédito automáticamente
CREATE OR REPLACE FUNCTION calculate_vat_credit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_net := NEW.total_gross / 1.19;
  NEW.vat_credit := NEW.total_gross - NEW.total_net;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_vat_credit_trigger ON purchases;
CREATE TRIGGER calculate_vat_credit_trigger
  BEFORE INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION calculate_vat_credit();

-- Función para actualizar stock timestamp
CREATE OR REPLACE FUNCTION update_packaging_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_packaging_timestamp_trigger ON packaging_inventory;
CREATE TRIGGER update_packaging_timestamp_trigger
  BEFORE UPDATE ON packaging_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_packaging_timestamp();
