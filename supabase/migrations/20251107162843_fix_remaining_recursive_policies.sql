/*
  # Fix Remaining Recursive Policies

  ## Problem
  Two policies were missed in the previous fix and still use the recursive pattern:
  - permissions: "Admins can manage permissions"
  - role_audit_log: "Admins can view all audit logs"

  These policies query `user_roles JOIN roles` which can trigger the infinite recursion.

  ## Solution
  Replace these policies with ones that use `is_admin_user()` function.

  ## Security Notes
  - Maintains same access control as before
  - Eliminates all remaining recursive patterns
  - Uses SECURITY DEFINER function that bypasses RLS safely
*/

-- =====================================================
-- Fix permissions table
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- =====================================================
-- Fix role_audit_log table
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.role_audit_log;

CREATE POLICY "Admins can view all audit logs"
  ON public.role_audit_log FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_admin_user()
  );

-- Verify: No more recursive patterns should exist
-- All admin checks now use is_admin_user() which queries admin_roles table
