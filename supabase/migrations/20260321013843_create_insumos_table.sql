CREATE TABLE IF NOT EXISTS insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria text NOT NULL,
  unidad text NOT NULL DEFAULT 'unidad',
  costo decimal(12,2) NOT NULL DEFAULT 0,
  stock decimal(12,2) NOT NULL DEFAULT 0,
  stock_minimo decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;