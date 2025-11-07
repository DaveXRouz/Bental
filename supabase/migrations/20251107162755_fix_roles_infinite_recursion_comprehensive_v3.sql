/*
  # Fix Infinite Recursion in Roles Table and All Dependent Policies

  ## Problem
  The `roles` table has an RLS policy that creates infinite recursion:
  - Policy on `roles` checks: EXISTS (SELECT FROM user_roles JOIN roles...)
  - To evaluate this, PostgreSQL must SELECT from `roles`
  - Which triggers the policy again → infinite loop
  
  This affects ANY table with admin policies that query `user_roles` JOIN `roles`,
  including: notifications, app_configuration, feature_flags, system_notifications,
  user_management_queue, admin_activity_log, analytics_events, error_logs,
  performance_metrics, news_articles, crypto_wallet_addresses, permissions,
  role_audit_log, feedback, and withdrawals.

  ## Solution
  1. Use the existing `is_admin_user()` function which bypasses RLS via SECURITY DEFINER
  2. Replace all recursive `EXISTS (SELECT FROM user_roles JOIN roles...)` patterns
  3. Make `roles` table readable by all authenticated users (it's reference data)
  4. Restrict roles modification to admins using `is_admin_user()`
  5. Update all affected tables to use `is_admin_user()` instead of recursive queries

  ## Tables Fixed
  - roles (the root cause)
  - notifications (reported error)
  - app_configuration
  - feature_flags
  - system_notifications
  - user_management_queue
  - admin_activity_log
  - analytics_events
  - error_logs
  - performance_metrics
  - news_articles
  - crypto_wallet_addresses
  - permissions
  - role_audit_log
  - feedback
  - withdrawals

  ## Security Notes
  - Admin status determined by `admin_roles` table (not `user_roles`)
  - `is_admin_user()` uses SECURITY DEFINER to bypass RLS safely
  - No circular dependencies in any policy
  - Users can still view their own data
  - Admins can view/manage all data
*/

-- =====================================================
-- STEP 1: Fix the root cause - roles table policies
-- =====================================================

-- Drop existing problematic policies on roles table
DROP POLICY IF EXISTS "Roles view all" ON public.roles;
DROP POLICY IF EXISTS "Roles admin manage" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "All authenticated users can view roles" ON public.roles;

-- Allow all authenticated users to view roles (reference data)
CREATE POLICY "All users can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify roles (using non-recursive is_admin_user function)
CREATE POLICY "Admins can insert roles"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update roles"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete roles"
  ON public.roles FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- =====================================================
-- STEP 2: Fix notifications table (reported error)
-- =====================================================

-- Drop all existing admin policies that use recursive pattern
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete all notifications" ON public.notifications;

-- Recreate using is_admin_user() function
CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update all notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can delete all notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- =====================================================
-- STEP 3: Fix app_configuration table
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all configurations" ON public.app_configuration;

CREATE POLICY "Admins can manage all configurations"
  ON public.app_configuration FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- =====================================================
-- STEP 4: Fix feature_flags table
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- =====================================================
-- STEP 5: Fix system_notifications table
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage system notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Users can view active notifications for them" ON public.system_notifications;

CREATE POLICY "Admins can manage system notifications"
  ON public.system_notifications FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Simplified policy - just check if active and within time window
CREATE POLICY "Users can view active notifications"
  ON public.system_notifications FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (start_time IS NULL OR start_time <= now())
    AND (end_time IS NULL OR end_time >= now())
  );

-- =====================================================
-- STEP 6: Fix user_management_queue table
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage user queue" ON public.user_management_queue;

CREATE POLICY "Admins can manage user queue"
  ON public.user_management_queue FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- =====================================================
-- STEP 7: Fix admin_activity_log table
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.admin_activity_log;

CREATE POLICY "Admins can insert activity logs"
  ON public.admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can view all activity logs"
  ON public.admin_activity_log FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- =====================================================
-- STEP 8: Fix analytics_events table
-- =====================================================

DROP POLICY IF EXISTS "Analytics events admin access" ON public.analytics_events;

CREATE POLICY "Analytics events admin access"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_admin_user()
  );

-- =====================================================
-- STEP 9: Fix error_logs table
-- =====================================================

DROP POLICY IF EXISTS "Error logs view access" ON public.error_logs;
DROP POLICY IF EXISTS "Admins update errors" ON public.error_logs;

CREATE POLICY "Error logs view access"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_admin_user()
  );

CREATE POLICY "Admins update errors"
  ON public.error_logs FOR UPDATE
  TO authenticated
  USING (is_admin_user());

-- =====================================================
-- STEP 10: Fix performance_metrics table
-- =====================================================

DROP POLICY IF EXISTS "Performance metrics view access" ON public.performance_metrics;

CREATE POLICY "Performance metrics view access"
  ON public.performance_metrics FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_admin_user()
  );

-- =====================================================
-- STEP 11: Fix news_articles table
-- =====================================================

DROP POLICY IF EXISTS "View published news" ON public.news_articles;

CREATE POLICY "View published news"
  ON public.news_articles FOR SELECT
  TO authenticated
  USING (published = true OR is_admin_user());

-- =====================================================
-- STEP 12: Fix crypto_wallet_addresses table
-- =====================================================

DROP POLICY IF EXISTS "Super admins can delete crypto wallet addresses" ON public.crypto_wallet_addresses;
DROP POLICY IF EXISTS "Super admins can insert crypto wallet addresses" ON public.crypto_wallet_addresses;
DROP POLICY IF EXISTS "Super admins can update crypto wallet addresses" ON public.crypto_wallet_addresses;
DROP POLICY IF EXISTS "Admins can delete crypto wallet addresses" ON public.crypto_wallet_addresses;
DROP POLICY IF EXISTS "Admins can insert crypto wallet addresses" ON public.crypto_wallet_addresses;
DROP POLICY IF EXISTS "Admins can update crypto wallet addresses" ON public.crypto_wallet_addresses;

-- Note: is_admin_user() checks for both 'admin' and 'super_admin'
CREATE POLICY "Admins can delete crypto wallet addresses"
  ON public.crypto_wallet_addresses FOR DELETE
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can insert crypto wallet addresses"
  ON public.crypto_wallet_addresses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update crypto wallet addresses"
  ON public.crypto_wallet_addresses FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- =====================================================
-- STEP 13: Fix permissions table
-- =====================================================

DROP POLICY IF EXISTS "Permissions view all" ON public.permissions;
DROP POLICY IF EXISTS "Permissions admin manage" ON public.permissions;

CREATE POLICY "Permissions view all"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permissions admin manage"
  ON public.permissions FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- =====================================================
-- STEP 14: Fix role_audit_log table
-- =====================================================

DROP POLICY IF EXISTS "Role audit view access" ON public.role_audit_log;

CREATE POLICY "Role audit view access"
  ON public.role_audit_log FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_admin_user()
  );

-- =====================================================
-- STEP 15: Fix feedback table
-- =====================================================

DROP POLICY IF EXISTS "Feedback view access" ON public.feedback;
DROP POLICY IF EXISTS "Feedback admin update" ON public.feedback;

CREATE POLICY "Feedback view access"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_admin_user()
  );

CREATE POLICY "Feedback admin update"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (is_admin_user());

-- =====================================================
-- STEP 16: Fix withdrawals table
-- =====================================================

DROP POLICY IF EXISTS "Withdrawals user access" ON public.withdrawals;

CREATE POLICY "Withdrawals user access"
  ON public.withdrawals FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_admin_user()
  );

-- =====================================================
-- STEP 17: Verification - Test the fix
-- =====================================================

-- This comment documents the fix:
-- 1. All policies now use is_admin_user() which checks admin_roles table
-- 2. No policy queries the roles table for admin checks
-- 3. roles table is readable by all authenticated users
-- 4. roles table modifications restricted to admins via is_admin_user()
-- 5. No circular dependencies exist

-- The recursion is eliminated because:
-- - is_admin_user() uses SECURITY DEFINER to bypass RLS
-- - is_admin_user() queries admin_roles (not user_roles or roles)
-- - roles table SELECT policy is simply USING (true)
-- - No policy references itself directly or indirectly
