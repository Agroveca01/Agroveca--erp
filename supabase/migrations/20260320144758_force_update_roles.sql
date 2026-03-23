/*
  # Forzar actualización de roles
  
  1. Cambios
    - Eliminar constraint existente completamente
    - Actualizar datos a nuevos roles
    - Crear nuevo constraint
    - Agregar user_id y políticas
*/

-- Eliminar constraint con CASCADE
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_role_check CASCADE;

-- Actualizar datos existentes primero
UPDATE user_profiles SET role = 'ADMIN' WHERE role = 'admin';
UPDATE user_profiles SET role = 'OPERARIO' WHERE role = 'operator';
UPDATE user_profiles SET role = 'ADMIN' WHERE role NOT IN ('ADMIN', 'OPERARIO', 'VENTAS');

-- Agregar nuevo constraint
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('ADMIN', 'OPERARIO', 'VENTAS'));

-- Agregar columna user_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN user_id uuid;
    UPDATE user_profiles SET user_id = id;
    ALTER TABLE user_profiles ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Índice
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Eliminar políticas
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can update roles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Funciones
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()),
    'OPERARIO'
  );
$$;

-- Políticas
CREATE POLICY "Authenticated users can view profiles"
  ON user_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can update roles"
  ON user_profiles FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can insert profiles"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());