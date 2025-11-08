/*
  # Fix is_admin(user_id) Function
  
  ## Problem
  The is_admin(user_id) function was checking profiles table email patterns
  instead of properly querying the admin_roles table. This causes it to 
  return false for legitimate admins.
  
  ## Solution
  Update is_admin(user_id) to use the is_admin_user() function which
  correctly queries the admin_roles table.
  
  ## Impact
  - Admins will be correctly identified
  - Admin panel access will work properly
  - All admin RLS policies will function correctly
*/

-- Fix the is_admin(user_id) function to use admin_roles table
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Use the is_admin_user function which properly checks admin_roles table
  RETURN is_admin_user(user_id);
END;
$$;

COMMENT ON FUNCTION public.is_admin(user_id uuid) IS 'Check if specified user is an admin by querying admin_roles table';

-- Verify the fix
DO $$
DECLARE
  admin_id uuid;
  test_result boolean;
BEGIN
  -- Get an admin user
  SELECT id INTO admin_id 
  FROM admin_roles 
  WHERE role IN ('admin', 'super_admin') AND is_active = true 
  LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Test the function
    SELECT is_admin(admin_id) INTO test_result;
    
    IF test_result = true THEN
      RAISE NOTICE 'SUCCESS: is_admin(user_id) now correctly returns true for admin: %', admin_id;
    ELSE
      RAISE WARNING 'FAILED: is_admin(user_id) still returns false for admin: %', admin_id;
    END IF;
  END IF;
END $$;
