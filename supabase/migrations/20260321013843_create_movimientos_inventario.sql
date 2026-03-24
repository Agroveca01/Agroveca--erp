CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_movimiento text NOT NULL CHECK (
    tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'produccion')
  ),
  item_id uuid,
  item_type text CHECK (
    item_type IN ('materia_prima', 'material_empaque', 'producto_terminado', 'insumo')
  ),
  cantidad numeric(12,2) NOT NULL,
  stock_anterior numeric(12,2),
  stock_nuevo numeric(12,2),
  motivo text,
  referencia_id uuid,
  referencia_tipo text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_item_id
  ON public.movimientos_inventario(item_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_created_at
  ON public.movimientos_inventario(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_created_by
  ON public.movimientos_inventario(created_by);