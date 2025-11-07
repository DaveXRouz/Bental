/*
  # Fix Notifications Duplicate RLS Policy

  ## Problem
  The notifications table has TWO SELECT policies that conflict:
  1. "Users can view own notifications" - simple policy checking user_id = auth.uid()
  2. "Users can view own notifications or admins can view all" - calls is_admin() which has conflicting function signatures

  The is_admin() function has two definitions:
  - is_admin() with no parameters
  - is_admin(user_id uuid) with a parameter
  
  When PostgreSQL tries to evaluate the policy, it encounters ambiguity about which function to call.

  ## Solution
  Simply drop the duplicate/problematic policy. The remaining policies are sufficient:
  - "Users can view own notifications" handles regular users
  - "Admins can view all notifications" handles admin users with proper EXISTS check
  
  This removes the ambiguous is_admin() call while maintaining all necessary access control.

  ## Changes
  - Drop "Users can view own notifications or admins can view all" policy
  - Keep all other existing policies unchanged
*/

-- Drop the problematic duplicate policy
DROP POLICY IF EXISTS "Users can view own notifications or admins can view all" ON public.notifications;

-- Verify: The following policies remain and provide complete access control:
-- SELECT: "Users can view own notifications" (for regular users)
-- SELECT: "Admins can view all notifications" (for admin users via user_roles check)
-- UPDATE: "Users can update own notifications" (for marking as read)
-- UPDATE: "Admins can update all notifications" (for admin management)
-- DELETE: "Users can delete own notifications" (for user cleanup)
-- DELETE: "Admins can delete all notifications" (for admin management)
-- INSERT: "Admins can create notifications" (for creating notifications)
