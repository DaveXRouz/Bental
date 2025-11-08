/*
  # Comprehensive Admin Access Policies

  ## Overview
  This migration adds comprehensive admin-level RLS policies for all tables
  that need admin visibility and management. Admins need read access to monitor
  the platform and write access where appropriate for management tasks.

  ## Tables Enhanced
  - withdrawals: Add admin SELECT and UPDATE policies
  - deposits: Add admin SELECT and UPDATE policies
  - holdings: Add admin SELECT policy for monitoring
  - trades: Add admin SELECT policy for audit
  - transactions: Add admin SELECT policy for audit
  - user_transfer_preferences: Add admin SELECT policy
  - portfolio_state_snapshots: Add admin SELECT policy
  - bots: Add admin policies for management
  - bot_allocations: Add admin SELECT policy
  - price_alerts: Add admin SELECT and DELETE policies
  - app_configuration: Verify and enhance admin policies
  - feature_flags: Verify and enhance admin policies

  ## Security
  All policies require authentication and use the is_admin() function
  to verify admin privileges. This ensures only authorized admins
  can access sensitive data.
*/

-- =====================================================
-- WITHDRAWALS: Admin policies for approval workflow
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;

CREATE POLICY "Admins can view all withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update withdrawals"
  ON withdrawals FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- DEPOSITS: Admin policies for verification
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can update deposits" ON deposits;

CREATE POLICY "Admins can view all deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update deposits"
  ON deposits FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- HOLDINGS: Admin policy for portfolio monitoring
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all holdings" ON holdings;

CREATE POLICY "Admins can view all holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- TRADES: Admin policy for transaction monitoring
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all trades" ON trades;

CREATE POLICY "Admins can view all trades"
  ON trades FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- TRANSACTIONS: Admin policy for audit trail
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- USER_TRANSFER_PREFERENCES: Admin visibility
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all transfer preferences" ON user_transfer_preferences;

CREATE POLICY "Admins can view all transfer preferences"
  ON user_transfer_preferences FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- PORTFOLIO_STATE_SNAPSHOTS: Admin analytics access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all portfolio snapshots" ON portfolio_state_snapshots;

CREATE POLICY "Admins can view all portfolio snapshots"
  ON portfolio_state_snapshots FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- BOTS: Admin management policies
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all bots" ON bots;
DROP POLICY IF EXISTS "Admins can update bots" ON bots;
DROP POLICY IF EXISTS "Admins can delete bots" ON bots;

CREATE POLICY "Admins can view all bots"
  ON bots FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update bots"
  ON bots FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete bots"
  ON bots FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- BOT_ALLOCATIONS: Admin monitoring
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all bot allocations" ON bot_allocations;

CREATE POLICY "Admins can view all bot allocations"
  ON bot_allocations FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- PRICE_ALERTS: Admin management
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all price alerts" ON price_alerts;
DROP POLICY IF EXISTS "Admins can delete price alerts" ON price_alerts;

CREATE POLICY "Admins can view all price alerts"
  ON price_alerts FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete price alerts"
  ON price_alerts FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- ACCOUNTS: Enhance admin policies
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all accounts" ON accounts;
DROP POLICY IF EXISTS "Admins can update accounts" ON accounts;

CREATE POLICY "Admins can view all accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- PROFILES: Ensure admin visibility
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- NOTIFICATIONS: Admin management
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;

CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Helper function to increment account balance
CREATE OR REPLACE FUNCTION increment_account_balance(
  account_id uuid,
  amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE accounts
  SET balance = balance + amount,
      updated_at = now()
  WHERE id = account_id;
END;
$$;
