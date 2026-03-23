/*
  # Corrección del cálculo de margen
  
  1. Cambios
    - Corregir fórmula de margen: ((precio_venta - costo_produccion) / costo_produccion * 100)
    - Margen sobre costo, no sobre precio de venta
    - Evitar división por cero
  
  2. Notas
    - Margen = (Precio - Costo) / Costo * 100
    - Ejemplo: Costo $100, Precio $150 → Margen 50%
*/

-- Eliminar columna margen actual
ALTER TABLE productos_terminados 
DROP COLUMN IF EXISTS margen;

-- Agregar columna margen con cálculo corregido
ALTER TABLE productos_terminados
ADD COLUMN margen numeric GENERATED ALWAYS AS (
  CASE 
    WHEN costo_produccion > 0 THEN 
      ROUND(((precio_venta - costo_produccion) / costo_produccion * 100)::numeric, 2)
    ELSE 0 
  END
) STORED;