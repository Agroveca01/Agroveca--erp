/*
  # Sistema Completo de Proveedores, Facturación y Cuentas por Pagar/Cobrar

  1. Nuevas Tablas
    - `suppliers`
      - Base de datos de proveedores con RUT, razón social, contacto
    - `purchase_invoices`
      - Facturas de compra con múltiples ítems
    - `purchase_invoice_items`
      - Líneas de detalle de cada factura
    - `accounts_payable`
      - Cuentas por pagar con gestión de crédito
    - `payment_records`
      - Registro de pagos a proveedores
    - `accounts_receivable`
      - Cuentas por cobrar de distribuidores
    - `customer_payment_history`
      - Historial de pagos de clientes

  2. Security
    - Enable RLS en todas las tablas
    - Políticas para usuarios autenticados
*/

-- Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rut text UNIQUE NOT NULL,
  business_name text NOT NULL,
  trade_name text,
  business_activity text,
  address text,
  phone text,
  email text,
  contact_person text,
  payment_terms_days integer DEFAULT 30,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Facturas de Compra
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id),
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  payment_condition text NOT NULL DEFAULT 'cash',
  credit_days integer DEFAULT 0,
  due_date date,
  subtotal numeric DEFAULT 0,
  vat_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  paid_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(supplier_id, invoice_number)
);

ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage purchase invoices"
  ON purchase_invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Líneas de Factura de Compra
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_name text NOT NULL,
  format text,
  quantity numeric NOT NULL,
  unit_price_net numeric NOT NULL,
  line_total_net numeric NOT NULL,
  packaging_inventory_id uuid REFERENCES packaging_inventory(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase invoice items"
  ON purchase_invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage purchase invoice items"
  ON purchase_invoice_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Cuentas por Pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id),
  amount_due numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  due_date date NOT NULL,
  status text DEFAULT 'pending',
  aging_category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts payable"
  ON accounts_payable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage accounts payable"
  ON accounts_payable FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Registro de Pagos
CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payable_id uuid REFERENCES accounts_payable(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date timestamptz DEFAULT now(),
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment records"
  ON payment_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create payment records"
  ON payment_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Cuentas por Cobrar
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid REFERENCES sales_orders(id),
  customer_id uuid REFERENCES customers(id),
  customer_name text NOT NULL,
  invoice_number text,
  amount_due numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  due_date date NOT NULL,
  status text DEFAULT 'pending',
  days_overdue integer DEFAULT 0,
  payment_score text DEFAULT 'A',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts receivable"
  ON accounts_receivable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage accounts receivable"
  ON accounts_receivable FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Historial de Pagos de Clientes
CREATE TABLE IF NOT EXISTS customer_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid REFERENCES accounts_receivable(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date timestamptz DEFAULT now(),
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customer payment history"
  ON customer_payment_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create customer payment history"
  ON customer_payment_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Función para calcular totales de factura
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal := (
    SELECT COALESCE(SUM(line_total_net), 0)
    FROM purchase_invoice_items
    WHERE invoice_id = NEW.id
  );
  NEW.vat_amount := NEW.subtotal * 0.19;
  NEW.total_amount := NEW.subtotal + NEW.vat_amount;
  
  IF NEW.payment_condition = 'credit' AND NEW.invoice_date IS NOT NULL THEN
    NEW.due_date := NEW.invoice_date + (NEW.credit_days || ' days')::interval;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON purchase_invoices;
CREATE TRIGGER calculate_invoice_totals_trigger
  BEFORE INSERT OR UPDATE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

-- Función para actualizar antigüedad de deuda
CREATE OR REPLACE FUNCTION update_aging_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date < CURRENT_DATE THEN
    NEW.aging_category := 'overdue';
  ELSIF NEW.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.aging_category := 'due_soon';
  ELSE
    NEW.aging_category := 'current';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_aging_category_trigger ON accounts_payable;
CREATE TRIGGER update_aging_category_trigger
  BEFORE INSERT OR UPDATE ON accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION update_aging_category();

-- Función para calcular días de atraso
CREATE OR REPLACE FUNCTION update_days_overdue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date < CURRENT_DATE THEN
    NEW.days_overdue := CURRENT_DATE - NEW.due_date;
  ELSE
    NEW.days_overdue := 0;
  END IF;
  
  IF NEW.days_overdue = 0 THEN
    NEW.payment_score := 'A';
  ELSIF NEW.days_overdue <= 15 THEN
    NEW.payment_score := 'B';
  ELSE
    NEW.payment_score := 'C';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_days_overdue_trigger ON accounts_receivable;
CREATE TRIGGER update_days_overdue_trigger
  BEFORE INSERT OR UPDATE ON accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION update_days_overdue();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);
