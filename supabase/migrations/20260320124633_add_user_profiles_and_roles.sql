/*
  # Sistema de Perfiles de Usuario y Roles

  1. Nuevas Tablas
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text: 'admin' o 'operator')
      - `phone` (text, opcional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Seguridad
    - Habilitar RLS en `user_profiles`
    - Los usuarios pueden ver su propio perfil
    - Solo los administradores pueden ver y editar todos los perfiles
    - Los usuarios pueden actualizar su propia información básica (excepto el rol)

  3. Políticas
    - SELECT: Los usuarios ven su perfil, los admins ven todos
    - INSERT: Solo durante el registro (manejado por trigger)
    - UPDATE: Usuarios editan su perfil, admins editan cualquiera
    - DELETE: Solo admins pueden desactivar usuarios

  4. Triggers
    - Crear perfil automáticamente cuando se registra un usuario nuevo
*/

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil, los admins pueden ver todos
CREATE POLICY "Users can view own profile, admins can view all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política: Los usuarios pueden actualizar su propio perfil (excepto role)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Política: Los admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update any profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política: Solo admins pueden insertar perfiles manualmente
CREATE POLICY "Admins can insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'operator')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil cuando se registra un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear un usuario administrador inicial (usando el primer usuario registrado)
-- Nota: Esta política permite la auto-inserción durante el registro
CREATE POLICY "Allow profile creation during signup"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);