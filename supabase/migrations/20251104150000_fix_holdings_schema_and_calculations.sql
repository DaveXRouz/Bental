/*
  # Fix Holdings Schema and Add Calculation Functions

  1. Schema Changes
    - Add `user_id` column to holdings for easier queries
    - Add `day_change` column for daily price change amount
    - Add `day_change_percent` column for daily price change percentage
    - Add `previous_close` column to track previous day's closing price
    - Add `last_price_update` column to track when price was last updated
    - Add `account_type` to accounts table for code compatibility

  2. Functions
    - Calculate holdings metrics automatically
    - Update portfolio snapshots
    - Calculate leaderboard rankings

  3. New Tables
    - portfolio_snapshots
    - trades
    - deposits
    - withdrawals
*/

-- ============================================================
-- 1. ADD MISSING COLUMNS TO HOLDINGS TABLE
-- ============================================================

-- Add user_id for easier querying
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add daily change tracking
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS day_change DECIMAL(20, 2) DEFAULT 0;
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS day_change_percent DECIMAL(10, 4) DEFAULT 0;
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS previous_close DECIMAL(20, 2);
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ;

-- Populate user_id from account_id
UPDATE holdings h
SET user_id = a.user_id
FROM accounts a
WHERE h.account_id = a.id AND h.user_id IS NULL;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);

-- ============================================================
-- 2. CREATE FUNCTION TO CALCULATE HOLDING METRICS
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_holding_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync user_id from account
  IF NEW.account_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id FROM accounts WHERE id = NEW.account_id;
  END IF;

  -- Calculate market value if current_price and quantity are set
  IF NEW.current_price IS NOT NULL AND NEW.quantity IS NOT NULL THEN
    NEW.market_value := NEW.current_price * NEW.quantity;
  END IF;

  -- Calculate unrealized P&L
  IF NEW.market_value IS NOT NULL AND NEW.quantity IS NOT NULL AND NEW.average_cost IS NOT NULL THEN
    NEW.unrealized_pnl := NEW.market_value - (NEW.quantity * NEW.average_cost);

    -- Calculate percentage gain/loss
    IF (NEW.quantity * NEW.average_cost) > 0 THEN
      NEW.unrealized_pnl_percent := (NEW.unrealized_pnl / (NEW.quantity * NEW.average_cost)) * 100;
    END IF;
  END IF;

  -- Calculate day change if previous_close is set
  IF NEW.current_price IS NOT NULL AND NEW.previous_close IS NOT NULL AND NEW.quantity IS NOT NULL THEN
    NEW.day_change := (NEW.current_price - NEW.previous_close) * NEW.quantity;

    IF NEW.previous_close > 0 THEN
      NEW.day_change_percent := ((NEW.current_price - NEW.previous_close) / NEW.previous_close) * 100;
    END IF;
  END IF;

  -- Update timestamp
  NEW.last_price_update := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. CREATE TRIGGER FOR AUTOMATIC CALCULATION
-- ============================================================

DROP TRIGGER IF EXISTS calculate_holding_metrics_trigger ON holdings;

CREATE TRIGGER calculate_holding_metrics_trigger
  BEFORE INSERT OR UPDATE ON holdings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_holding_metrics();

-- ============================================================
-- 4. CREATE PORTFOLIO SNAPSHOTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_value DECIMAL(20, 2) NOT NULL,
  cash_balance DECIMAL(20, 2) DEFAULT 0,
  investment_balance DECIMAL(20, 2) DEFAULT 0,
  day_change DECIMAL(20, 2) DEFAULT 0,
  day_change_percent DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date DESC);

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own snapshots" ON portfolio_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own snapshots" ON portfolio_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. CREATE LEADERBOARD UPDATE FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_leaderboard(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_return_percent DECIMAL(10, 4);
  v_total_return_amount DECIMAL(15, 2);
  v_portfolio_value DECIMAL(15, 2);
  v_total_trades INTEGER;
  v_win_rate DECIMAL(5, 2);
  v_winning_trades INTEGER;
  v_cost_basis DECIMAL(20, 2);
BEGIN
  -- Calculate portfolio value from accounts
  SELECT COALESCE(SUM(balance), 0)
  INTO v_portfolio_value
  FROM accounts
  WHERE user_id = p_user_id;

  -- Add holdings market value
  SELECT v_portfolio_value + COALESCE(SUM(market_value), 0)
  INTO v_portfolio_value
  FROM holdings
  WHERE user_id = p_user_id;

  -- Calculate total return amount
  SELECT COALESCE(SUM(unrealized_pnl), 0)
  INTO v_total_return_amount
  FROM holdings
  WHERE user_id = p_user_id;

  -- Calculate cost basis
  SELECT COALESCE(SUM(quantity * average_cost), 0)
  INTO v_cost_basis
  FROM holdings
  WHERE user_id = p_user_id;

  -- Calculate total return percentage
  IF v_cost_basis > 0 THEN
    v_total_return_percent := (v_total_return_amount / v_cost_basis) * 100;
  ELSE
    v_total_return_percent := 0;
  END IF;

  -- Count filled trades (check if trades table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trades') THEN
    SELECT COUNT(*)
    INTO v_total_trades
    FROM trades
    WHERE user_id = p_user_id AND status = 'filled';

    -- Calculate win rate (trades where sell price > avg cost)
    SELECT COUNT(*)
    INTO v_winning_trades
    FROM trades
    WHERE user_id = p_user_id
      AND status = 'filled'
      AND side = 'sell'
      AND filled_price > COALESCE(avg_price, 0);

    IF v_total_trades > 0 THEN
      v_win_rate := (v_winning_trades::DECIMAL / v_total_trades) * 100;
    ELSE
      v_win_rate := 0;
    END IF;
  ELSE
    v_total_trades := 0;
    v_win_rate := 0;
  END IF;

  -- Upsert leaderboard entry
  INSERT INTO leaderboard (
    user_id,
    total_return_percent,
    total_return_amount,
    win_rate,
    total_trades,
    portfolio_value,
    updated_at
  ) VALUES (
    p_user_id,
    COALESCE(v_total_return_percent, 0),
    COALESCE(v_total_return_amount, 0),
    COALESCE(v_win_rate, 0),
    COALESCE(v_total_trades, 0),
    COALESCE(v_portfolio_value, 0),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_return_percent = COALESCE(v_total_return_percent, 0),
    total_return_amount = COALESCE(v_total_return_amount, 0),
    win_rate = COALESCE(v_win_rate, 0),
    total_trades = COALESCE(v_total_trades, 0),
    portfolio_value = COALESCE(v_portfolio_value, 0),
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. CREATE FUNCTION TO UPDATE LEADERBOARD RANKS
-- ============================================================

CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH ranked_users AS (
    SELECT
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_return_percent DESC, portfolio_value DESC) AS new_rank
    FROM leaderboard
    WHERE public = true
  )
  UPDATE leaderboard
  SET rank = ranked_users.new_rank
  FROM ranked_users
  WHERE leaderboard.user_id = ranked_users.user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. CREATE FUNCTION TO UPDATE ALL LEADERBOARDS
-- ============================================================

CREATE OR REPLACE FUNCTION update_all_leaderboards()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT DISTINCT user_id FROM accounts
  LOOP
    PERFORM update_user_leaderboard(v_user.user_id);
    v_count := v_count + 1;
  END LOOP;

  PERFORM update_leaderboard_ranks();

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. CREATE TRADES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  quantity DECIMAL(20, 8) NOT NULL,
  filled_quantity DECIMAL(20, 8) DEFAULT 0,
  price DECIMAL(20, 2),
  filled_price DECIMAL(20, 2),
  avg_price DECIMAL(20, 2),
  total DECIMAL(20, 2),
  fee DECIMAL(20, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partially_filled', 'cancelled', 'rejected')),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_executed ON trades(executed_at DESC);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trades" ON trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own trades" ON trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own trades" ON trades FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 9. CREATE DEPOSITS AND WITHDRAWALS TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  destination TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_account ON deposits(account_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_account ON withdrawals(account_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own deposits" ON deposits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own deposits" ON deposits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own withdrawals" ON withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own withdrawals" ON withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. ADD ACCOUNT_TYPE TO ACCOUNTS TABLE
-- ============================================================

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type TEXT;

-- Update account_type to mirror type
UPDATE accounts SET account_type = type WHERE account_type IS NULL;

-- Create trigger to keep both fields in sync
CREATE OR REPLACE FUNCTION sync_account_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IS NOT NULL THEN
    NEW.account_type := NEW.type;
  ELSIF NEW.account_type IS NOT NULL THEN
    NEW.type := NEW.account_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_account_type_trigger ON accounts;

CREATE TRIGGER sync_account_type_trigger
  BEFORE INSERT OR UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION sync_account_type();
