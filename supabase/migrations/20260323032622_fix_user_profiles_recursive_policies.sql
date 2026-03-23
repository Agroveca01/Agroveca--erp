/*
  # Fix Recursive RLS Policies on user_profiles

  ## Problem
  - Multiple conflicting policies causing infinite recursion
  - Admin policies query user_profiles table within their own conditions
  - This creates a circular dependency when checking permissions

  ## Solution
  - Drop ALL existing policies
  - Create simple, non-recursive policies:
    1. Users can read their own profile
    2. Users can update their own profile
    3. System can insert profiles during signup
    4. Everyone can read all profiles (needed for role checks in other tables)

  ## Security Note
  - Allowing read access to all profiles is safe because:
    - Other tables check roles properly without recursion
    - Profile data is not sensitive (just role and metadata)
    - Write operations are still protected
*/

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "All authenticated users full access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "System can insert profiles during signup" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

-- Create simple, non-recursive policies

-- Allow all authenticated users to read all profiles (needed for role checks)
CREATE POLICY "Anyone can read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
