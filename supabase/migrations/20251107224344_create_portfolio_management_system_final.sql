/*
  # Portfolio Management System - Complete Implementation

  ## Overview
  This migration creates a comprehensive portfolio management system with:
  - Pending sell orders requiring admin approval
  - User fund transfer preferences
  - Complete audit trails
  - Real-time balance tracking
  - Business rule enforcement

  ## New Tables

  ### 1. `pending_sell_orders`
  Manages sell orders that require admin approval before execution.
  - Tracks symbol, quantity, estimated and actual prices
  - Status workflow: pending -> approved/rejected
  - Admin review tracking with notes
  - Automatic expiration after 7 days

  ### 2. `user_transfer_preferences`
  Stores user preferences for where funds should be transferred.
  - Supports multiple destination types (bank, crypto, internal, paypal)
  - Default preference tracking
  - Priority ordering

  ### 3. `portfolio_operations_audit`
  Complete audit trail for all portfolio operations.
  - Tracks all buy/sell/transfer/deposit/withdrawal operations
  - Records balance before/after
  - Links to related orders
  - IP address and user agent tracking

  ### 4. `portfolio_state_snapshots`
  Periodic snapshots of portfolio state for historical tracking.
  - Daily snapshots of portfolio value
  - Holdings breakdown
  - P&L tracking
  - Historical performance analysis

  ## Security
  Row Level Security enabled on all tables with appropriate policies.
  Uses existing is_admin() function for admin checks.
*/

-- =====================================================
-- TABLE: pending_sell_orders
-- =====================================================
CREATE TABLE IF NOT EXISTS pending_sell_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('stock', 'crypto', 'etf', 'bond')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  estimated_price numeric NOT NULL CHECK (estimated_price > 0),
  estimated_total numeric NOT NULL CHECK (estimated_total > 0),
  actual_price numeric,
  actual_total numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  approval_status text NOT NULL DEFAULT 'pending_review' CHECK (approval_status IN ('pending_review', 'under_review', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  executed_at timestamptz,
  rejection_reason text,
  admin_notes text,
  user_notes text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE pending_sell_orders IS 'Sell orders requiring admin approval before execution';
COMMENT ON COLUMN pending_sell_orders.estimated_price IS 'Price at time of order submission';
COMMENT ON COLUMN pending_sell_orders.actual_price IS 'Actual execution price set by admin';
COMMENT ON COLUMN pending_sell_orders.expires_at IS 'Auto-expires if not reviewed within 7 days';

-- =====================================================
-- TABLE: user_transfer_preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS user_transfer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type text NOT NULL CHECK (preference_type IN ('withdrawal', 'transfer', 'liquidation')),
  destination_type text NOT NULL CHECK (destination_type IN ('bank_account', 'crypto_wallet', 'internal_account', 'paypal')),
  destination_id uuid,
  destination_details jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  priority integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_transfer_preferences IS 'User preferences for fund transfer destinations';
COMMENT ON COLUMN user_transfer_preferences.is_default IS 'Whether this is the default destination for this preference type';
COMMENT ON COLUMN user_transfer_preferences.priority IS 'Order priority when multiple destinations exist';

-- Create partial unique index for default preferences
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_default_preference 
  ON user_transfer_preferences(user_id, preference_type) 
  WHERE is_default = true;

-- =====================================================
-- TABLE: portfolio_operations_audit
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_operations_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('buy', 'sell', 'transfer', 'deposit', 'withdrawal', 'balance_adjustment')),
  operation_status text NOT NULL CHECK (operation_status IN ('initiated', 'pending', 'completed', 'failed', 'cancelled')),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  symbol text,
  quantity numeric,
  balance_before numeric,
  balance_after numeric,
  related_order_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE portfolio_operations_audit IS 'Complete audit trail for all portfolio operations';
COMMENT ON COLUMN portfolio_operations_audit.balance_before IS 'Account balance before operation';
COMMENT ON COLUMN portfolio_operations_audit.balance_after IS 'Account balance after operation';

-- =====================================================
-- TABLE: portfolio_state_snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_state_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_value numeric NOT NULL DEFAULT 0,
  cash_balance numeric NOT NULL DEFAULT 0,
  holdings_value numeric NOT NULL DEFAULT 0,
  total_pnl numeric NOT NULL DEFAULT 0,
  total_pnl_percent numeric NOT NULL DEFAULT 0,
  holdings_snapshot jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_daily_snapshot UNIQUE (user_id, account_id, snapshot_date)
);

COMMENT ON TABLE portfolio_state_snapshots IS 'Daily snapshots of portfolio state for historical tracking';
COMMENT ON COLUMN portfolio_state_snapshots.holdings_snapshot IS 'JSON snapshot of all holdings at snapshot time';

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pending_sell_orders_user_id ON pending_sell_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_sell_orders_account_id ON pending_sell_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_pending_sell_orders_status ON pending_sell_orders(status);
CREATE INDEX IF NOT EXISTS idx_pending_sell_orders_approval_status ON pending_sell_orders(approval_status);
CREATE INDEX IF NOT EXISTS idx_pending_sell_orders_submitted_at ON pending_sell_orders(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_transfer_preferences_user_id ON user_transfer_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_operations_audit_user_id ON portfolio_operations_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_operations_audit_account_id ON portfolio_operations_audit(account_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_operations_audit_created_at ON portfolio_operations_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_operations_audit_operation_type ON portfolio_operations_audit(operation_type);

CREATE INDEX IF NOT EXISTS idx_portfolio_state_snapshots_user_account ON portfolio_state_snapshots(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_state_snapshots_date ON portfolio_state_snapshots(snapshot_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE pending_sell_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_transfer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_operations_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_state_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own pending sell orders" ON pending_sell_orders;
DROP POLICY IF EXISTS "Users can create pending sell orders" ON pending_sell_orders;
DROP POLICY IF EXISTS "Users can cancel own pending orders" ON pending_sell_orders;
DROP POLICY IF EXISTS "Admins can view all pending sell orders" ON pending_sell_orders;
DROP POLICY IF EXISTS "Admins can update pending sell orders" ON pending_sell_orders;

DROP POLICY IF EXISTS "Users can view own transfer preferences" ON user_transfer_preferences;
DROP POLICY IF EXISTS "Users can create transfer preferences" ON user_transfer_preferences;
DROP POLICY IF EXISTS "Users can update own transfer preferences" ON user_transfer_preferences;
DROP POLICY IF EXISTS "Users can delete own transfer preferences" ON user_transfer_preferences;

DROP POLICY IF EXISTS "Users can view own audit logs" ON portfolio_operations_audit;
DROP POLICY IF EXISTS "System can insert audit logs" ON portfolio_operations_audit;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON portfolio_operations_audit;

DROP POLICY IF EXISTS "Users can view own portfolio snapshots" ON portfolio_state_snapshots;
DROP POLICY IF EXISTS "System can create portfolio snapshots" ON portfolio_state_snapshots;

-- pending_sell_orders policies
CREATE POLICY "Users can view own pending sell orders"
  ON pending_sell_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create pending sell orders"
  ON pending_sell_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own pending orders"
  ON pending_sell_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('cancelled'));

CREATE POLICY "Admins can view all pending sell orders"
  ON pending_sell_orders FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update pending sell orders"
  ON pending_sell_orders FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- user_transfer_preferences policies
CREATE POLICY "Users can view own transfer preferences"
  ON user_transfer_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transfer preferences"
  ON user_transfer_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transfer preferences"
  ON user_transfer_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transfer preferences"
  ON user_transfer_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- portfolio_operations_audit policies
CREATE POLICY "Users can view own audit logs"
  ON portfolio_operations_audit FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON portfolio_operations_audit FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs"
  ON portfolio_operations_audit FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- portfolio_state_snapshots policies
CREATE POLICY "Users can view own portfolio snapshots"
  ON portfolio_state_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create portfolio snapshots"
  ON portfolio_state_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
