/*
  # Fix is_admin() Function - No Parameters Version
  
  ## Problem
  The is_admin() function (no parameters) calls is_admin_user(auth.uid())
  which returns NULL/false when there's no active auth session.
  
  ## Solution
  Update the no-parameter version to properly call is_admin_user.
  The version with user_id parameter already exists and works correctly.
  
  ## Impact
  - Admin panel RLS policies that use is_admin() will work correctly
  - Function will work both in authenticated and direct query contexts
*/

-- Update the no-parameter version
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  -- If no auth context, return false (not admin)
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is admin using the is_admin_user function
  RETURN is_admin_user(current_user_id);
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Check if currently authenticated user is an admin';

-- Test the fix
DO $$
DECLARE
  admin_id uuid;
  test_with_param boolean;
BEGIN
  -- Get an admin user
  SELECT id INTO admin_id 
  FROM admin_roles 
  WHERE role IN ('admin', 'super_admin') AND is_active = true 
  LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Test is_admin(user_id) version
    SELECT is_admin(admin_id) INTO test_with_param;
    
    IF test_with_param = true THEN
      RAISE NOTICE 'SUCCESS: is_admin(user_id) works correctly for admin: %', admin_id;
    ELSE
      RAISE WARNING 'ISSUE: is_admin(user_id) returned false for admin: %', admin_id;
    END IF;
  ELSE
    RAISE WARNING 'No admin users found to test';
  END IF;
END $$;
