/*
  # Fix User Profiles Trigger - Add user_id Column

  ## Problem
  The handle_new_user() trigger function creates user_profiles records without setting the user_id column.
  RLS policies require user_id to match auth.uid(), but the trigger only sets the id column.

  ## Solution
  Update the handle_new_user() trigger function to also populate the user_id column with the same value as id.

  ## Changes
  1. Drop and recreate handle_new_user() function
  2. Add user_id to the INSERT statement
  3. Set user_id = new.id (same as id column)
*/

-- Update the trigger function to include user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_id, email, full_name, role)
  VALUES (
    new.id,
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'operario')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
