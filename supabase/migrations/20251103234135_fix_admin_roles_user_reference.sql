/*
  # Fix Admin Roles User Reference
  
  1. Changes
    - The admin_roles table is missing a user_id column to link to profiles
    - The id column should reference auth.users/profiles
    - Update is_admin() function to use id instead of user_id
    - Add admin_roles entry for michael.chen@demo.com
  
  2. Security
    - Maintain existing RLS policies
*/

-- Fix the is_admin() function to use id instead of user_id
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE id = auth.uid()
    AND is_active = true
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Insert admin role for michael.chen if not exists
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Get michael.chen's user ID
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE email = 'michael.chen@demo.com';
  
  -- Insert into admin_roles if not exists
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO admin_roles (id, role, is_active, created_at, updated_at)
    VALUES (
      v_admin_id,
      'super_admin',
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin',
        is_active = true,
        updated_at = now();
  END IF;
END $$;
