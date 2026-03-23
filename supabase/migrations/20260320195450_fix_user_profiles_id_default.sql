/*
  # Fix user_profiles id column

  1. Changes
    - Add default UUID generation for id column
    - This fixes the signup error where id was required but not provided

  2. Security
    - No security changes, maintaining existing RLS policies
*/

-- Add default UUID generation to id column
ALTER TABLE user_profiles 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
