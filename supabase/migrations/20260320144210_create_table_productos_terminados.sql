/*
  # Migración: Crear tabla productos_terminados
    1. Descripción
        - Crear tabla para almacenar productos terminados con campos básicos.
    2. Campos
        - id: UUID, clave primaria, valor por defecto generado automáticamente.
        - nombre: Texto, no nulo, nombre del producto.
        - precio_venta: Numérico, no nulo, precio de venta del producto.
        - costo_produccion: Numérico, no nulo, costo de producción del producto
        - created_at: Timestamp con zona horaria, valor por defecto la fecha y hora actual.
    3. Notas
        - La tabla se puede expandir en el futuro con campos adicionales como descripción, categoría, etc.
*/

CREATE TABLE IF NOT EXISTS productos_terminados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio_venta NUMERIC NOT NULL,
  costo_produccion NUMERIC NOT NULL,
  -- agrega aquí otras columnas necesarias
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);