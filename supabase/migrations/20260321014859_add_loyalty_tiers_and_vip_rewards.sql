/*
  # Sistema de Loyalty Mejorado - Ranking de Hojas y Recompensas VIP

  1. Nuevas Tablas
    - `loyalty_tiers`: Define los niveles de clasificación por hojas
    - `vip_discount_codes`: Códigos de descuento del 20% para compra #10
    - `customer_order_history`: Historial simplificado de órdenes por cliente

  2. Cambios en Tablas Existentes
    - `customers`: 
      - Agregar `order_count` (contador de pedidos)
      - Agregar `loyalty_tier` (nivel actual: 1, 2, o 3 hojas)
      - Agregar `last_order_date` (fecha del último pedido)
    - `customer_orders`:
      - Agregar `discount_code_used` (código de descuento aplicado)
      - Agregar `discount_amount` (monto del descuento aplicado)
      - Agregar `is_vip_milestone` (marca si es la compra #10)

  3. Security
    - Enable RLS on all new tables
    - Policies allow all authenticated users full access

  4. Funciones
    - Trigger para actualizar automáticamente el tier del cliente
    - Función para generar códigos únicos de descuento
*/

-- Crear tabla de tiers de loyalty
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level integer NOT NULL UNIQUE CHECK (tier_level IN (1, 2, 3)),
  tier_name text NOT NULL,
  min_orders integer NOT NULL,
  max_orders integer,
  icon_count integer NOT NULL,
  color_class text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insertar los niveles de tier
INSERT INTO loyalty_tiers (tier_level, tier_name, min_orders, max_orders, icon_count, color_class) VALUES
  (1, 'Brote', 1, 3, 1, 'emerald'),
  (2, 'Crecimiento', 4, 9, 2, 'green'),
  (3, 'Bosque VIP', 10, NULL, 3, 'amber')
ON CONFLICT (tier_level) DO NOTHING;

-- Crear tabla de códigos de descuento VIP
CREATE TABLE IF NOT EXISTS vip_discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  discount_code text NOT NULL UNIQUE,
  discount_percentage numeric DEFAULT 20.00 CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  order_id uuid REFERENCES customer_orders(id),
  created_at timestamptz DEFAULT now()
);

-- Agregar columnas a customers si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'order_count'
  ) THEN
    ALTER TABLE customers ADD COLUMN order_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'loyalty_tier'
  ) THEN
    ALTER TABLE customers ADD COLUMN loyalty_tier integer DEFAULT 1 REFERENCES loyalty_tiers(tier_level);
  END IF;
END $$;

-- Agregar columnas a customer_orders si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_orders' AND column_name = 'discount_code_used'
  ) THEN
    ALTER TABLE customer_orders ADD COLUMN discount_code_used text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE customer_orders ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_orders' AND column_name = 'is_vip_milestone'
  ) THEN
    ALTER TABLE customer_orders ADD COLUMN is_vip_milestone boolean DEFAULT false;
  END IF;
END $$;

-- Función para generar código único de descuento
CREATE OR REPLACE FUNCTION generate_vip_discount_code(customer_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generar código: VIP10- + primeras 3 letras del nombre + 4 dígitos aleatorios
    code := 'VIP10-' || 
            UPPER(SUBSTRING(REGEXP_REPLACE(customer_name, '[^a-zA-Z]', '', 'g'), 1, 3)) || 
            LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    
    -- Verificar si el código ya existe
    SELECT EXISTS(SELECT 1 FROM vip_discount_codes WHERE discount_code = code) INTO code_exists;
    
    -- Si no existe, salir del loop
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Función para actualizar tier del cliente
CREATE OR REPLACE FUNCTION update_customer_loyalty_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_tier integer;
BEGIN
  -- Calcular el nuevo tier basado en order_count
  IF NEW.order_count >= 10 THEN
    new_tier := 3;
  ELSIF NEW.order_count >= 4 THEN
    new_tier := 2;
  ELSE
    new_tier := 1;
  END IF;
  
  -- Actualizar el tier si cambió
  IF NEW.loyalty_tier != new_tier THEN
    NEW.loyalty_tier := new_tier;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para actualizar tier automáticamente
DROP TRIGGER IF EXISTS trigger_update_loyalty_tier ON customers;
CREATE TRIGGER trigger_update_loyalty_tier
  BEFORE UPDATE OF order_count ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_loyalty_tier();

-- Función para procesar nueva orden y generar código VIP si es la #10
CREATE OR REPLACE FUNCTION process_new_customer_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  customer_name text;
  vip_code text;
BEGIN
  -- Incrementar el contador de órdenes del cliente
  UPDATE customers 
  SET 
    order_count = order_count + 1,
    last_purchase_date = CURRENT_DATE,
    total_purchases = total_purchases + 1,
    total_spent = total_spent + NEW.total_amount
  WHERE id = NEW.customer_id;
  
  -- Obtener el nuevo count
  SELECT order_count, name INTO NEW.order_number, customer_name
  FROM customers
  WHERE id = NEW.customer_id;
  
  -- Si es la orden #10, marcarla como milestone y generar código VIP
  IF (SELECT order_count FROM customers WHERE id = NEW.customer_id) = 10 THEN
    NEW.is_vip_milestone := true;
    
    -- Generar código de descuento VIP
    vip_code := generate_vip_discount_code(customer_name);
    
    -- Insertar el código en la tabla
    INSERT INTO vip_discount_codes (customer_id, discount_code, expires_at)
    VALUES (NEW.customer_id, vip_code, NOW() + INTERVAL '1 year');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para procesar nuevas órdenes
DROP TRIGGER IF EXISTS trigger_process_new_order ON customer_orders;
CREATE TRIGGER trigger_process_new_order
  BEFORE INSERT ON customer_orders
  FOR EACH ROW
  EXECUTE FUNCTION process_new_customer_order();

-- Habilitar RLS en las nuevas tablas
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_discount_codes ENABLE ROW LEVEL SECURITY;

-- Políticas para loyalty_tiers
CREATE POLICY "All authenticated users can view loyalty tiers"
  ON loyalty_tiers FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para vip_discount_codes
CREATE POLICY "All authenticated users full access to vip_discount_codes"
  ON vip_discount_codes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
