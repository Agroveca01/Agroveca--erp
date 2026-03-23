/*
  # Agregar Configuración de Costos por Formato y Envío Mayorista

  1. Nueva Tabla: format_costs
    - `id` (uuid, clave primaria)
    - `format_name` (text) - Nombre del formato (100cc, 200cc, 500cc RTU)
    - `container_cost` (numeric) - Costo del envase
    - `label_cost` (numeric) - Costo de la etiqueta
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Nueva Tabla: shipping_config
    - `id` (uuid, clave primaria)
    - `min_units` (integer) - Cantidad mínima de unidades
    - `shipping_cost` (numeric) - Costo de envío total
    - `description` (text) - Descripción del nivel
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  3. Datos Iniciales
    - Insertar costos por formato (100cc, 200cc, 500cc RTU)
    - Insertar configuración de envío por volumen

  4. Seguridad
    - Enable RLS en ambas tablas
    - Permitir lectura a usuarios autenticados
    - Solo admins pueden modificar
*/

-- Crear tabla de costos por formato
CREATE TABLE IF NOT EXISTS format_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_name text UNIQUE NOT NULL,
  container_cost numeric NOT NULL DEFAULT 0,
  label_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de configuración de envío
CREATE TABLE IF NOT EXISTS shipping_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_units integer NOT NULL,
  shipping_cost numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar costos por formato
INSERT INTO format_costs (format_name, container_cost, label_cost)
VALUES 
  ('100cc', 350, 80),
  ('200cc', 450, 100),
  ('500cc RTU', 550, 150)
ON CONFLICT (format_name) DO UPDATE
SET 
  container_cost = EXCLUDED.container_cost,
  label_cost = EXCLUDED.label_cost,
  updated_at = now();

-- Insertar configuración de envío
INSERT INTO shipping_config (min_units, shipping_cost, description)
VALUES 
  (1, 750, 'Envío individual'),
  (50, 15000, 'Caja Master - Envío fijo $15.000')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE format_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_config ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
CREATE POLICY "Users can read format costs"
  ON format_costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read shipping config"
  ON shipping_config FOR SELECT
  TO authenticated
  USING (true);

-- Políticas de escritura para admins
CREATE POLICY "Admins can insert format costs"
  ON format_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update format costs"
  ON format_costs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert shipping config"
  ON shipping_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update shipping config"
  ON shipping_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
