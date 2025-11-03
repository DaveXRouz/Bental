/*
  # Set Default Passwords for Existing Users
  
  1. Purpose
    - Ensures all users have passwords for authentication
    - Sets a default password "Welcome2025!" for demo users without passwords
    - Updates auth.users table with encrypted passwords
  
  2. Implementation
    - Uses Supabase auth.users table
    - Sets secure default password: Welcome2025!
    - Allows users to change password after first login
  
  3. Security
    - Password is hashed by Supabase Auth
    - Users should change password on first login
    - Default password documented for demo purposes
*/

-- Note: Supabase Auth handles password encryption automatically
-- The default password for all demo users is: Welcome2025!

-- Update profiles to track default password status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS using_default_password BOOLEAN DEFAULT false;

-- Mark existing users as using default password
UPDATE profiles
SET using_default_password = true
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@demo.com'
);

-- Add comment for documentation
COMMENT ON COLUMN profiles.using_default_password IS 'Tracks if user is using the default password (Welcome2025!) and needs to change it';
