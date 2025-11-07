/*
  # Fix Infinite Recursion in user_roles RLS Policies

  ## Problem
  The `user_roles` table has RLS policies that query the `user_roles` table itself
  to check if a user has admin privileges. This creates infinite recursion:
  
  Policy checks user_roles → triggers same policy → checks user_roles → infinite loop

  ## Solution
  1. Create a SECURITY DEFINER function that bypasses RLS to check admin status
  2. Replace recursive policies with non-recursive ones using the new function
  3. Use the existing `admin_roles` table as the source of truth for admin checks

  ## Tables Affected
  - user_roles (policies fixed)
  
  ## Security Notes
  - Admin status is determined by `admin_roles` table (not `user_roles`)
  - Users can view their own role assignments
  - Only admins (in admin_roles) can manage all role assignments
  - No circular dependencies in RLS policies
*/

-- =====================================================
-- STEP 1: Create helper function to check admin status
-- =====================================================

-- This function bypasses RLS by using SECURITY DEFINER
-- It checks the admin_roles table to determine admin status
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- If no user_id provided, check current user
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  -- Check admin_roles table (this bypasses RLS due to SECURITY DEFINER)
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE id = target_user_id
    AND is_active = true
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- =====================================================
-- STEP 2: Drop problematic recursive policies
-- =====================================================

DROP POLICY IF EXISTS "User roles view access" ON public.user_roles;
DROP POLICY IF EXISTS "User roles admin manage" ON public.user_roles;

-- Also drop any other existing policies that might exist
DROP POLICY IF EXISTS "Admins can manage all role assignments" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role assignments" ON public.user_roles;

-- =====================================================
-- STEP 3: Create new non-recursive policies
-- =====================================================

-- Policy 1: Users can view their own role assignments
-- Admins (from admin_roles) can view all role assignments
CREATE POLICY "Users can view own roles or admins view all"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    is_admin_user()
  );

-- Policy 2: Only admins can insert role assignments
CREATE POLICY "Admins can insert role assignments"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

-- Policy 3: Only admins can update role assignments
CREATE POLICY "Admins can update role assignments"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Policy 4: Only admins can delete role assignments
CREATE POLICY "Admins can delete role assignments"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- =====================================================
-- STEP 4: Verify the fix
-- =====================================================

-- This comment documents that the policies are now safe from recursion:
-- 1. is_admin_user() checks admin_roles (not user_roles)
-- 2. No policy on user_roles queries user_roles
-- 3. Users can view their own records without admin checks
-- 4. Admin checks use SECURITY DEFINER to bypass RLS

-- =====================================================
-- STEP 5: Update is_admin() function for consistency
-- =====================================================

-- Update the global is_admin() function to use our new helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN is_admin_user(auth.uid());
END;
$$;
