/*
  # Normalize user roles to canonical values

  1. Goals
    - Normalize legacy role values to canonical lowercase roles
    - Allow only `admin`, `operario`, `vendedor`
    - Ensure new users default to `operario`

  2. Notes
    - Legacy values handled: `operator`, `ADMIN`, `OPERARIO`, `VENTAS`
    - Existing admin policies remain valid because `admin` is preserved
*/

UPDATE public.user_profiles
SET role = CASE LOWER(COALESCE(role, ''))
  WHEN 'admin' THEN 'admin'
  WHEN 'operator' THEN 'operario'
  WHEN 'operario' THEN 'operario'
  WHEN 'ventas' THEN 'vendedor'
  WHEN 'vendedor' THEN 'vendedor'
  ELSE 'operario'
END;

ALTER TABLE public.user_profiles
  ALTER COLUMN role SET DEFAULT 'operario';

ALTER TABLE public.user_profiles
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'operario', 'vendedor'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := CASE LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'operario'))
    WHEN 'admin' THEN 'admin'
    WHEN 'operator' THEN 'operario'
    WHEN 'operario' THEN 'operario'
    WHEN 'ventas' THEN 'vendedor'
    WHEN 'vendedor' THEN 'vendedor'
    ELSE 'operario'
  END;

  INSERT INTO public.user_profiles (id, user_id, email, full_name, role, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_role,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
END;
$$;
