/*
  # Corregir Cálculos de Costos Unitarios

  ## Problema Identificado
  El sistema estaba asignando el costo de 100 litros (lote completo) a una sola unidad de venta,
  generando márgenes negativos incorrectos.

  ## Cambios Realizados
  
  1. Nueva Función: `calculate_units_per_batch`
    - Extrae el volumen del formato (ej: "200cc" → 200, "RTU-500 cc" → 500)
    - Calcula cuántas unidades se producen por lote de 100L
    - Ejemplos:
      * 200cc → 500 unidades (100,000ml / 200ml)
      * 500cc RTU → 200 unidades (100,000ml / 500ml)
      * 1L → 100 unidades (100,000ml / 1,000ml)

  2. Nueva Función: `calculate_optimal_price`
    - Calcula el precio de venta óptimo para alcanzar 70% de margen neto
    - Fórmula: Precio = (Costo Total) / (1 - Margen Target - Comisión%)
    - Considera: Costo MP Unitario + Empaque + Envío + Comisión 5%

  3. Nueva Función: `recalculate_product_pricing`
    - Recalcula y actualiza automáticamente los precios de todos los productos
    - Aplica el margen objetivo del 70%
    - Actualiza base_price en la tabla products

  4. Nuevas Columnas en products
    - `units_per_batch`: Cantidad de unidades que produce un lote de 100L
    - `unit_raw_material_cost`: Costo de materia prima por unidad individual
    - `packaging_cost`: Costo de empaque por unidad ($250)
    - `shipping_cost_per_unit`: Costo de envío por unidad ($750)

  ## Costos Fijos por Unidad
  - Empaque: $250
  - Envío: $750
  - Comisión: 5% del precio de venta

  ## Objetivo
  Todos los productos deben alcanzar un margen neto del 70%
*/

-- Agregar nuevas columnas para cálculos unitarios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'units_per_batch'
  ) THEN
    ALTER TABLE products ADD COLUMN units_per_batch numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit_raw_material_cost'
  ) THEN
    ALTER TABLE products ADD COLUMN unit_raw_material_cost numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'packaging_cost'
  ) THEN
    ALTER TABLE products ADD COLUMN packaging_cost numeric DEFAULT 250;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'shipping_cost_per_unit'
  ) THEN
    ALTER TABLE products ADD COLUMN shipping_cost_per_unit numeric DEFAULT 750;
  END IF;
END $$;

-- Función para calcular unidades por lote basado en el formato
CREATE OR REPLACE FUNCTION calculate_units_per_batch(product_format text, batch_size_liters numeric DEFAULT 100)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  volume_ml numeric;
  batch_ml numeric;
  units numeric;
BEGIN
  -- Convertir lote a mililitros
  batch_ml := batch_size_liters * 1000;
  
  -- Extraer volumen del formato (ej: "200cc", "RTU-500 cc", "1L", "500ml")
  -- Buscar patrón de números seguidos de unidad
  
  -- Caso 1: Formato con "cc" (ej: "200cc", "RTU-500 cc")
  IF product_format ~* '\d+\s*cc' THEN
    volume_ml := (regexp_match(product_format, '(\d+)\s*cc', 'i'))[1]::numeric;
  
  -- Caso 2: Formato con "ml" (ej: "500ml", "500 ml")
  ELSIF product_format ~* '\d+\s*ml' THEN
    volume_ml := (regexp_match(product_format, '(\d+)\s*ml', 'i'))[1]::numeric;
  
  -- Caso 3: Formato con "L" (ej: "1L", "5L", "1 L")
  ELSIF product_format ~* '\d+\.?\d*\s*L' THEN
    volume_ml := (regexp_match(product_format, '(\d+\.?\d*)\s*L', 'i'))[1]::numeric * 1000;
  
  -- Default: Asumir 200ml si no se puede determinar
  ELSE
    volume_ml := 200;
  END IF;

  -- Calcular unidades
  IF volume_ml > 0 THEN
    units := FLOOR(batch_ml / volume_ml);
  ELSE
    units := 0;
  END IF;

  RETURN units;
END;
$$;

-- Función para calcular precio óptimo con margen del 70%
CREATE OR REPLACE FUNCTION calculate_optimal_price(
  unit_cost numeric,
  packaging_cost numeric,
  shipping_cost numeric,
  target_margin numeric DEFAULT 0.70,
  commission_pct numeric DEFAULT 5.0
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  total_unit_cost numeric;
  optimal_price numeric;
  commission_factor numeric;
BEGIN
  -- Costo total por unidad (sin comisión ni margen)
  total_unit_cost := unit_cost + packaging_cost + shipping_cost;
  
  -- Factor de comisión como decimal
  commission_factor := commission_pct / 100.0;
  
  -- Precio óptimo: Costo Total / (1 - Margen - Comisión)
  -- Esto asegura que después de restar costos y comisión, quede el margen deseado
  optimal_price := total_unit_cost / (1 - target_margin - commission_factor);
  
  -- Redondear a múltiplos de 100 (estándar para precios en Chile)
  optimal_price := CEIL(optimal_price / 100) * 100;
  
  RETURN optimal_price;
END;
$$;

-- Función para recalcular precios de todos los productos
CREATE OR REPLACE FUNCTION recalculate_product_pricing()
RETURNS TABLE(
  product_id uuid,
  product_name text,
  old_price numeric,
  new_price numeric,
  units_calculated numeric,
  unit_cost numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  product_record record;
  raw_material_cost_100l numeric;
  units_per_batch_calc numeric;
  unit_rm_cost numeric;
  new_optimal_price numeric;
BEGIN
  -- Recorrer cada producto
  FOR product_record IN 
    SELECT p.id, p.name, p.format, p.base_price, p.production_unit_liters,
           p.packaging_cost, p.shipping_cost_per_unit, p.production_cost_per_100l
    FROM products p
  LOOP
    -- Calcular costo de materia prima para 100L
    SELECT COALESCE(SUM(pr.quantity_per_100l * rm.current_cost), 0)
    INTO raw_material_cost_100l
    FROM product_recipes pr
    JOIN raw_materials rm ON pr.raw_material_id = rm.id
    WHERE pr.product_id = product_record.id;

    -- Si no hay costo, usar el almacenado
    IF raw_material_cost_100l = 0 THEN
      raw_material_cost_100l := COALESCE(product_record.production_cost_per_100l, 0);
    END IF;

    -- Calcular unidades por lote
    units_per_batch_calc := calculate_units_per_batch(
      product_record.format, 
      product_record.production_unit_liters
    );

    -- Calcular costo unitario de materia prima
    IF units_per_batch_calc > 0 THEN
      unit_rm_cost := raw_material_cost_100l / units_per_batch_calc;
    ELSE
      unit_rm_cost := raw_material_cost_100l; -- Fallback
    END IF;

    -- Calcular precio óptimo
    new_optimal_price := calculate_optimal_price(
      unit_rm_cost,
      COALESCE(product_record.packaging_cost, 250),
      COALESCE(product_record.shipping_cost_per_unit, 750),
      0.70,  -- 70% margen
      5.0    -- 5% comisión
    );

    -- Actualizar producto
    UPDATE products
    SET 
      units_per_batch = units_per_batch_calc,
      unit_raw_material_cost = unit_rm_cost,
      base_price = new_optimal_price,
      production_cost_per_100l = raw_material_cost_100l,
      updated_at = now()
    WHERE id = product_record.id;

    -- Retornar información para el log
    product_id := product_record.id;
    product_name := product_record.name;
    old_price := product_record.base_price;
    new_price := new_optimal_price;
    units_calculated := units_per_batch_calc;
    unit_cost := unit_rm_cost;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Comentarios para documentación
COMMENT ON FUNCTION calculate_units_per_batch(text, numeric) IS 
'Calcula cuántas unidades se producen por lote basándose en el formato del producto (ej: 200cc → 500 unidades de 100L)';

COMMENT ON FUNCTION calculate_optimal_price(numeric, numeric, numeric, numeric, numeric) IS 
'Calcula el precio de venta óptimo para alcanzar un margen neto objetivo (default 70%), considerando costos y comisión';

COMMENT ON FUNCTION recalculate_product_pricing() IS 
'Recalcula y actualiza los precios de todos los productos para alcanzar el margen objetivo del 70%';

-- Ejecutar recálculo inicial
-- Se puede comentar esta línea si se prefiere ejecutar manualmente
SELECT * FROM recalculate_product_pricing();
