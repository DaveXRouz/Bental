/*
  # Bot Allocations System - Single Active Bot Architecture

  1. New Tables
    - `bot_allocations`
      - Single active bot per user enforced by UNIQUE constraint
      - Tracks allocated capital, current value, and status
      - Links to bot templates and manages lifecycle states
      - Includes margin call threshold for risk management

    - `bot_guardrails`
      - Risk management settings per allocation
      - Max drawdown, position size, trade frequency limits
      - Auto-pause triggers for capital protection

    - `bot_margin_calls`
      - Logs margin call events and resolutions
      - Tracks shortfall amounts and timestamps
      - Audit trail for capital management

  2. Security
    - Enable RLS on all tables
    - Users can only access their own bot data
    - Proper foreign key constraints
    - Check constraints for valid states

  3. Important Notes
    - Only ONE active bot per user allowed
    - Real money allocations only (no paper trading)
    - Margin call system auto-pauses bots when balance too low
    - All fund movements tracked in transactions table
*/

-- ============================================================
-- BOT ALLOCATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  bot_id UUID REFERENCES bots(id) ON DELETE SET NULL,

  -- Allocation Details
  bot_name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  allocated_amount DECIMAL(15, 2) NOT NULL CHECK (allocated_amount > 0),
  current_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  minimum_balance_threshold DECIMAL(15, 2),

  -- Performance Metrics
  total_return DECIMAL(15, 2) DEFAULT 0,
  total_return_percent DECIMAL(10, 4) DEFAULT 0,
  profit_loss DECIMAL(15, 2) DEFAULT 0,
  profit_loss_percent DECIMAL(10, 4) DEFAULT 0,

  -- Trading Statistics
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,

  -- Status Management
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'margin_call', 'stopped')),
  risk_level TEXT DEFAULT 'moderate' CHECK (risk_level IN ('conservative', 'moderate', 'aggressive')),

  -- Trading Configuration
  symbols TEXT[] DEFAULT '{}',
  percent DECIMAL(5, 2) DEFAULT 100 CHECK (percent > 0 AND percent <= 100),

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- CRITICAL: Only one active bot per user
  CONSTRAINT unique_active_bot_per_user UNIQUE (user_id, status)
    WHERE status = 'active'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bot_allocations_user ON bot_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_allocations_status ON bot_allocations(status);
CREATE INDEX IF NOT EXISTS idx_bot_allocations_user_active ON bot_allocations(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bot_allocations_account ON bot_allocations(account_id);
CREATE INDEX IF NOT EXISTS idx_bot_allocations_bot ON bot_allocations(bot_id);

-- ============================================================
-- BOT GUARDRAILS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  allocation_id UUID REFERENCES bot_allocations(id) ON DELETE CASCADE,
  bot_key TEXT NOT NULL DEFAULT 'default',

  -- Risk Limits
  max_dd_pct DECIMAL(5, 2) NOT NULL DEFAULT 5.0 CHECK (max_dd_pct > 0 AND max_dd_pct <= 100),
  max_pos_pct DECIMAL(5, 2) NOT NULL DEFAULT 15.0 CHECK (max_pos_pct > 0 AND max_pos_pct <= 100),
  max_loss_per_trade DECIMAL(15, 2),
  max_daily_loss DECIMAL(15, 2),

  -- Trading Controls
  trade_freq TEXT NOT NULL DEFAULT 'moderate' CHECK (trade_freq IN ('conservative', 'moderate', 'aggressive')),
  max_trades_per_day INTEGER DEFAULT 10,
  min_time_between_trades INTEGER DEFAULT 300, -- seconds

  -- Auto-Pause Settings
  auto_pause BOOLEAN DEFAULT true,
  pause_on_loss_streak INTEGER DEFAULT 3,
  pause_on_drawdown_pct DECIMAL(5, 2) DEFAULT 10.0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_guardrails_user ON bot_guardrails(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_guardrails_allocation ON bot_guardrails(allocation_id);

-- ============================================================
-- BOT MARGIN CALLS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_margin_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID REFERENCES bot_allocations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Margin Call Details
  triggered_value DECIMAL(15, 2) NOT NULL,
  threshold_value DECIMAL(15, 2) NOT NULL,
  shortfall_amount DECIMAL(15, 2) NOT NULL,

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'stopped')),
  resolution_type TEXT CHECK (resolution_type IN ('capital_added', 'bot_stopped', 'auto_recovered')),
  capital_added DECIMAL(15, 2),

  -- Timestamps
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bot_margin_calls_allocation ON bot_margin_calls(allocation_id);
CREATE INDEX IF NOT EXISTS idx_bot_margin_calls_user ON bot_margin_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_margin_calls_status ON bot_margin_calls(status) WHERE status = 'pending';

-- ============================================================
-- BOT TRADES TABLE (if not exists from init.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_allocation_id UUID REFERENCES bot_allocations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Trade Details
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity DECIMAL(20, 8) NOT NULL,

  -- Pricing
  entry_price DECIMAL(20, 2) NOT NULL,
  exit_price DECIMAL(20, 2),

  -- Performance
  profit_loss DECIMAL(20, 2),
  profit_loss_percent DECIMAL(10, 4),

  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),

  -- Timestamps
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_trades_allocation ON bot_trades(bot_allocation_id);
CREATE INDEX IF NOT EXISTS idx_bot_trades_user ON bot_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_trades_status ON bot_trades(status);
CREATE INDEX IF NOT EXISTS idx_bot_trades_opened ON bot_trades(opened_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE bot_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_margin_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_trades ENABLE ROW LEVEL SECURITY;

-- Bot Allocations Policies
CREATE POLICY "Users can view own bot allocations"
  ON bot_allocations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bot allocations"
  ON bot_allocations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bot allocations"
  ON bot_allocations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bot allocations"
  ON bot_allocations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Bot Guardrails Policies
CREATE POLICY "Users can manage own bot guardrails"
  ON bot_guardrails FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bot Margin Calls Policies
CREATE POLICY "Users can view own margin calls"
  ON bot_margin_calls FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Bot Trades Policies
CREATE POLICY "Users can view own bot trades"
  ON bot_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update bot allocation metrics
CREATE OR REPLACE FUNCTION update_bot_allocation_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update trade counts and win rate
  UPDATE bot_allocations
  SET
    total_trades = (
      SELECT COUNT(*)
      FROM bot_trades
      WHERE bot_allocation_id = NEW.bot_allocation_id
    ),
    winning_trades = (
      SELECT COUNT(*)
      FROM bot_trades
      WHERE bot_allocation_id = NEW.bot_allocation_id
        AND profit_loss > 0
        AND status = 'closed'
    ),
    losing_trades = (
      SELECT COUNT(*)
      FROM bot_trades
      WHERE bot_allocation_id = NEW.bot_allocation_id
        AND profit_loss < 0
        AND status = 'closed'
    ),
    win_rate = CASE
      WHEN (SELECT COUNT(*) FROM bot_trades WHERE bot_allocation_id = NEW.bot_allocation_id AND status = 'closed') > 0
      THEN (
        SELECT (COUNT(*) FILTER (WHERE profit_loss > 0) * 100.0 / COUNT(*))::DECIMAL(5,2)
        FROM bot_trades
        WHERE bot_allocation_id = NEW.bot_allocation_id
          AND status = 'closed'
      )
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = NEW.bot_allocation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update metrics when trades close
DROP TRIGGER IF EXISTS update_bot_metrics_on_trade ON bot_trades;
CREATE TRIGGER update_bot_metrics_on_trade
  AFTER INSERT OR UPDATE ON bot_trades
  FOR EACH ROW
  WHEN (NEW.status = 'closed')
  EXECUTE FUNCTION update_bot_allocation_metrics();

-- Function to check and trigger margin calls
CREATE OR REPLACE FUNCTION check_margin_call()
RETURNS TRIGGER AS $$
BEGIN
  -- If current value drops below threshold, trigger margin call
  IF NEW.current_value < NEW.minimum_balance_threshold
     AND NEW.status = 'active'
     AND OLD.current_value >= NEW.minimum_balance_threshold THEN

    -- Update status to margin_call
    NEW.status := 'margin_call';
    NEW.updated_at := NOW();

    -- Create margin call record
    INSERT INTO bot_margin_calls (
      allocation_id,
      user_id,
      triggered_value,
      threshold_value,
      shortfall_amount,
      triggered_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.current_value,
      NEW.minimum_balance_threshold,
      NEW.minimum_balance_threshold - NEW.current_value,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-detect margin calls
DROP TRIGGER IF EXISTS auto_margin_call_detection ON bot_allocations;
CREATE TRIGGER auto_margin_call_detection
  BEFORE UPDATE ON bot_allocations
  FOR EACH ROW
  EXECUTE FUNCTION check_margin_call();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_bot_allocations_updated_at ON bot_allocations;
CREATE TRIGGER update_bot_allocations_updated_at
  BEFORE UPDATE ON bot_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_updated_at();

DROP TRIGGER IF EXISTS update_bot_guardrails_updated_at ON bot_guardrails;
CREATE TRIGGER update_bot_guardrails_updated_at
  BEFORE UPDATE ON bot_guardrails
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_updated_at();
