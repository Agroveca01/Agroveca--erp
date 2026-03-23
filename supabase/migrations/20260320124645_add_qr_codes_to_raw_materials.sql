/*
  # Agregar Códigos QR a Materias Primas

  1. Cambios en Tablas
    - Agregar columna `qr_code` a `raw_materials`
      - Almacena un identificador único para el código QR
      - Se genera automáticamente si no existe
    - Agregar columna `location` para ubicación física del material

  2. Notas
    - El QR code es un UUID único que identifica cada materia prima
    - Este código se puede imprimir y escanear desde dispositivos móviles
*/

-- Agregar columnas para QR y ubicación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'qr_code'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN qr_code text UNIQUE DEFAULT gen_random_uuid()::text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'location'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN location text;
  END IF;
END $$;

-- Generar QR codes para materiales existentes que no tengan uno
UPDATE raw_materials 
SET qr_code = gen_random_uuid()::text 
WHERE qr_code IS NULL;

-- Crear índice para búsquedas rápidas por QR
CREATE INDEX IF NOT EXISTS idx_raw_materials_qr_code ON raw_materials(qr_code);