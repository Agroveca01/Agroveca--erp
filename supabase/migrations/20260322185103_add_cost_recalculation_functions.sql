/*
  # Funciones para Recalcular Costos Automáticamente

  1. Funciones RPC
    - `recalculate_all_product_costs`: Recalcula los costos de todos los productos cuando cambian costos de materias primas
    - `recalculate_product_cost`: Recalcula el costo de un producto específico

  2. Notas
    - Estas funciones se llaman automáticamente cuando se actualizan costos de materias primas
    - Recalculan los costos de producción basándose en las fórmulas actuales
    - Mantienen los datos sincronizados en tiempo real
*/

-- Función para recalcular el costo de un producto específico
CREATE OR REPLACE FUNCTION recalculate_product_cost(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_cost numeric := 0;
BEGIN
  -- Calcular el costo total basado en la receta (por 100L)
  SELECT COALESCE(SUM(pr.quantity_per_100l * rm.current_cost), 0)
  INTO total_cost
  FROM product_recipes pr
  JOIN raw_materials rm ON pr.raw_material_id = rm.id
  WHERE pr.product_id = p_product_id;

  -- Actualizar el producto con el nuevo costo de producción
  UPDATE products
  SET 
    production_cost_per_100l = total_cost,
    updated_at = now()
  WHERE id = p_product_id;

  RAISE NOTICE 'Costo recalculado para producto %: $%', p_product_id, total_cost;
END;
$$;

-- Función para recalcular los costos de todos los productos
CREATE OR REPLACE FUNCTION recalculate_all_product_costs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record record;
  products_updated integer := 0;
BEGIN
  -- Recalcular cada producto que tenga recetas
  FOR product_record IN 
    SELECT DISTINCT product_id 
    FROM product_recipes
  LOOP
    PERFORM recalculate_product_cost(product_record.product_id);
    products_updated := products_updated + 1;
  END LOOP;

  RAISE NOTICE 'Costos recalculados para % productos', products_updated;
END;
$$;

-- Agregar columna para guardar el costo de producción si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'production_cost_per_100l'
  ) THEN
    ALTER TABLE products ADD COLUMN production_cost_per_100l numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE products ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Función trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para actualizar updated_at en productos
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON FUNCTION recalculate_product_cost(uuid) IS 
'Recalcula el costo de producción de un producto específico basándose en su fórmula actual y los costos actuales de materias primas.';

COMMENT ON FUNCTION recalculate_all_product_costs() IS 
'Recalcula los costos de producción de todos los productos. Se debe llamar cuando se actualizan costos de materias primas.';
