/*
  # Portfolio Analytics System

  1. New Tables
    - `portfolio_snapshots`
      - Stores daily portfolio value snapshots
      - Used for performance calculations over time
      - Includes total value, cash, investments, returns
    
    - `portfolio_metrics`
      - Stores calculated metrics (daily/weekly/monthly/yearly)
      - Includes returns, volatility, sharpe ratio, max drawdown
      - Cached calculations for performance
    
    - `asset_allocations`
      - Tracks allocation by asset type, sector, geography
      - Historical allocation tracking
      - Used for diversification analysis
    
    - `performance_benchmarks`
      - Stores benchmark data (S&P 500, etc.)
      - Used for relative performance comparison
    
    - `tax_lots`
      - Tracks individual purchase lots for tax reporting
      - Cost basis tracking
      - FIFO/LIFO calculation support

  2. Security
    - Enable RLS on all tables
    - Users can only access their own portfolio data
    - Read-only policies for performance

  3. Functions
    - Function to calculate portfolio metrics
    - Function to create daily snapshots
    - Function to calculate tax implications
*/

-- Portfolio Snapshots Table
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date date NOT NULL,
  total_value decimal(20,2) NOT NULL DEFAULT 0,
  cash_balance decimal(20,2) NOT NULL DEFAULT 0,
  investments_value decimal(20,2) NOT NULL DEFAULT 0,
  day_change decimal(20,2) DEFAULT 0,
  day_change_percent decimal(10,4) DEFAULT 0,
  total_return decimal(20,2) DEFAULT 0,
  total_return_percent decimal(10,4) DEFAULT 0,
  total_deposits decimal(20,2) DEFAULT 0,
  total_withdrawals decimal(20,2) DEFAULT 0,
  realized_gains decimal(20,2) DEFAULT 0,
  unrealized_gains decimal(20,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date DESC);

-- Portfolio Metrics Table
CREATE TABLE IF NOT EXISTS portfolio_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period varchar(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  starting_value decimal(20,2) NOT NULL,
  ending_value decimal(20,2) NOT NULL,
  net_deposits decimal(20,2) DEFAULT 0,
  total_return decimal(20,2) NOT NULL,
  return_percent decimal(10,4) NOT NULL,
  volatility decimal(10,4) DEFAULT 0,
  sharpe_ratio decimal(10,4) DEFAULT 0,
  max_drawdown decimal(10,4) DEFAULT 0,
  max_drawdown_date date,
  best_day_return decimal(10,4) DEFAULT 0,
  worst_day_return decimal(10,4) DEFAULT 0,
  winning_days integer DEFAULT 0,
  losing_days integer DEFAULT 0,
  avg_daily_return decimal(10,4) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_metrics_user_period ON portfolio_metrics(user_id, period, period_end DESC);

-- Asset Allocations Table
CREATE TABLE IF NOT EXISTS asset_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date date NOT NULL,
  allocation_type varchar(20) NOT NULL CHECK (allocation_type IN ('asset_class', 'sector', 'geography', 'security')),
  category varchar(100) NOT NULL,
  value decimal(20,2) NOT NULL,
  percentage decimal(10,4) NOT NULL,
  quantity decimal(20,8) DEFAULT 0,
  cost_basis decimal(20,2) DEFAULT 0,
  unrealized_gain decimal(20,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, snapshot_date, allocation_type, category)
);

CREATE INDEX IF NOT EXISTS idx_asset_allocations_user_date ON asset_allocations(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_asset_allocations_type ON asset_allocations(allocation_type, category);

-- Performance Benchmarks Table
CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_code varchar(20) NOT NULL,
  benchmark_name varchar(100) NOT NULL,
  benchmark_date date NOT NULL,
  close_price decimal(20,6) NOT NULL,
  day_change_percent decimal(10,4) DEFAULT 0,
  ytd_return decimal(10,4) DEFAULT 0,
  one_year_return decimal(10,4) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(benchmark_code, benchmark_date)
);

CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_code_date ON performance_benchmarks(benchmark_code, benchmark_date DESC);

-- Tax Lots Table
CREATE TABLE IF NOT EXISTS tax_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  symbol varchar(10) NOT NULL,
  acquisition_date date NOT NULL,
  quantity decimal(20,8) NOT NULL,
  cost_basis_per_share decimal(20,6) NOT NULL,
  total_cost_basis decimal(20,2) NOT NULL,
  remaining_quantity decimal(20,8) NOT NULL,
  disposition_date date,
  disposition_price decimal(20,6),
  realized_gain decimal(20,2),
  holding_period varchar(20) CHECK (holding_period IN ('short_term', 'long_term')),
  trade_id uuid REFERENCES trades(id) ON DELETE SET NULL,
  status varchar(20) DEFAULT 'open' CHECK (status IN ('open', 'partial', 'closed')),
  lot_method varchar(20) DEFAULT 'fifo' CHECK (lot_method IN ('fifo', 'lifo', 'hifo', 'specific')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_lots_user_symbol ON tax_lots(user_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_tax_lots_account ON tax_lots(account_id, symbol);
CREATE INDEX IF NOT EXISTS idx_tax_lots_acquisition ON tax_lots(acquisition_date);

-- Enable RLS
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_lots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_snapshots
CREATE POLICY "Users can view own portfolio snapshots"
  ON portfolio_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio snapshots"
  ON portfolio_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio snapshots"
  ON portfolio_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for portfolio_metrics
CREATE POLICY "Users can view own portfolio metrics"
  ON portfolio_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio metrics"
  ON portfolio_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for asset_allocations
CREATE POLICY "Users can view own asset allocations"
  ON asset_allocations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asset allocations"
  ON asset_allocations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for performance_benchmarks (public read)
CREATE POLICY "Anyone can view performance benchmarks"
  ON performance_benchmarks FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for tax_lots
CREATE POLICY "Users can view own tax lots"
  ON tax_lots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax lots"
  ON tax_lots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax lots"
  ON tax_lots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate portfolio metrics
CREATE OR REPLACE FUNCTION calculate_portfolio_metrics(
  p_user_id uuid,
  p_period varchar(20),
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_starting_value decimal(20,2);
  v_ending_value decimal(20,2);
  v_net_deposits decimal(20,2);
  v_total_return decimal(20,2);
  v_return_percent decimal(10,4);
  v_result jsonb;
BEGIN
  -- Get starting value
  SELECT COALESCE(total_value, 0) INTO v_starting_value
  FROM portfolio_snapshots
  WHERE user_id = p_user_id 
    AND snapshot_date <= p_start_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  -- Get ending value
  SELECT COALESCE(total_value, 0) INTO v_ending_value
  FROM portfolio_snapshots
  WHERE user_id = p_user_id 
    AND snapshot_date <= p_end_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  -- Calculate net deposits/withdrawals in period
  SELECT COALESCE(SUM(
    CASE 
      WHEN status = 'completed' THEN amount 
      ELSE 0 
    END
  ), 0) INTO v_net_deposits
  FROM (
    SELECT amount, status FROM deposits 
    WHERE account_id IN (SELECT id FROM accounts WHERE user_id = p_user_id)
      AND created_at BETWEEN p_start_date AND p_end_date
    UNION ALL
    SELECT -amount, status FROM withdrawals 
    WHERE account_id IN (SELECT id FROM accounts WHERE user_id = p_user_id)
      AND created_at BETWEEN p_start_date AND p_end_date
  ) transactions;

  -- Calculate return
  v_total_return := v_ending_value - v_starting_value - v_net_deposits;
  
  IF v_starting_value > 0 THEN
    v_return_percent := (v_total_return / v_starting_value) * 100;
  ELSE
    v_return_percent := 0;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'starting_value', v_starting_value,
    'ending_value', v_ending_value,
    'net_deposits', v_net_deposits,
    'total_return', v_total_return,
    'return_percent', v_return_percent
  );

  RETURN v_result;
END;
$$;

-- Function to create daily portfolio snapshot
CREATE OR REPLACE FUNCTION create_portfolio_snapshot(p_user_id uuid, p_snapshot_date date DEFAULT CURRENT_DATE)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot_id uuid;
  v_total_cash decimal(20,2);
  v_total_investments decimal(20,2);
  v_total_value decimal(20,2);
  v_prev_value decimal(20,2);
  v_day_change decimal(20,2);
  v_day_change_percent decimal(10,4);
BEGIN
  -- Calculate total cash across all accounts
  SELECT COALESCE(SUM(cash_balance), 0) INTO v_total_cash
  FROM accounts
  WHERE user_id = p_user_id;

  -- Calculate total investment value
  SELECT COALESCE(SUM(h.quantity * COALESCE(mq.current_price, h.average_cost)), 0) INTO v_total_investments
  FROM holdings h
  LEFT JOIN market_quotes mq ON mq.symbol = h.symbol AND mq.quote_date = p_snapshot_date
  WHERE h.account_id IN (SELECT id FROM accounts WHERE user_id = p_user_id)
    AND h.quantity > 0;

  v_total_value := v_total_cash + v_total_investments;

  -- Get previous day's value
  SELECT total_value INTO v_prev_value
  FROM portfolio_snapshots
  WHERE user_id = p_user_id 
    AND snapshot_date < p_snapshot_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  IF v_prev_value IS NOT NULL AND v_prev_value > 0 THEN
    v_day_change := v_total_value - v_prev_value;
    v_day_change_percent := (v_day_change / v_prev_value) * 100;
  ELSE
    v_day_change := 0;
    v_day_change_percent := 0;
  END IF;

  -- Insert or update snapshot
  INSERT INTO portfolio_snapshots (
    user_id, snapshot_date, total_value, cash_balance, 
    investments_value, day_change, day_change_percent
  )
  VALUES (
    p_user_id, p_snapshot_date, v_total_value, v_total_cash,
    v_total_investments, v_day_change, v_day_change_percent
  )
  ON CONFLICT (user_id, snapshot_date) 
  DO UPDATE SET
    total_value = EXCLUDED.total_value,
    cash_balance = EXCLUDED.cash_balance,
    investments_value = EXCLUDED.investments_value,
    day_change = EXCLUDED.day_change,
    day_change_percent = EXCLUDED.day_change_percent
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;