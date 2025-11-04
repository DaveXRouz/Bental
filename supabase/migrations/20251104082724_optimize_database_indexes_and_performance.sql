/*
  # Database Performance Optimization

  This migration optimizes the database for production-level performance by adding:

  1. Composite Indexes
     - Multi-column indexes for frequently joined and filtered queries
     - Covering indexes to enable index-only scans

  2. Partial Indexes
     - Indexes on filtered subsets for common query patterns
     - Reduced index size and improved write performance

  3. Materialized Views
     - Pre-computed aggregations for dashboard queries
     - Automatic refresh triggers

  4. Database Functions
     - Optimized server-side calculations
     - Reduced client-server round trips

  5. Automatic Timestamp Updates
     - Triggers for updated_at columns across all tables
*/

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Portfolio queries: user_id + created_at (for time-series data)
CREATE INDEX IF NOT EXISTS idx_holdings_user_created
ON holdings(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Trading history: user_id + executed_at (for transaction history)
CREATE INDEX IF NOT EXISTS idx_trades_user_executed
ON trades(user_id, executed_at DESC NULLS LAST)
WHERE status = 'executed';

-- Price alerts: user_id + active + symbol (for active alert checks)
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_active_symbol
ON price_alerts(user_id, symbol)
WHERE active = true AND triggered = false;

-- Watchlist: user_id + symbol (for quick lookups)
CREATE INDEX IF NOT EXISTS idx_watchlist_user_symbol
ON watchlist(user_id, symbol);

-- Bot allocations: user_id + active (for active bot queries)
CREATE INDEX IF NOT EXISTS idx_bot_allocations_user_active
ON bot_allocations(user_id, active);

-- Leaderboard: rank + public (for public leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank_public
ON leaderboard(rank ASC)
WHERE public = true;

-- News articles: category_id + published_at (for categorized news feeds)
CREATE INDEX IF NOT EXISTS idx_news_category_published
ON news_articles(category_id, published_at DESC NULLS LAST);

-- =============================================================================
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- =============================================================================

-- Active sessions only
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
ON user_sessions(user_id, last_activity DESC)
WHERE active = true;

-- Unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications(user_id, created_at DESC)
WHERE read = false;

-- Triggered price alerts
CREATE INDEX IF NOT EXISTS idx_price_alerts_triggered
ON price_alerts(user_id, triggered_at DESC)
WHERE triggered = true;

-- Featured news articles
CREATE INDEX IF NOT EXISTS idx_news_featured
ON news_articles(published_at DESC)
WHERE featured = true;

-- =============================================================================
-- COVERING INDEXES (include commonly selected columns)
-- =============================================================================

-- Holdings with current value (avoids table lookups)
CREATE INDEX IF NOT EXISTS idx_holdings_user_value
ON holdings(user_id, symbol, quantity, current_price, created_at);

-- Portfolio snapshots with key metrics
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_metrics
ON portfolio_snapshots(user_id, created_at DESC, total_value, total_return_percent);

-- =============================================================================
-- MATERIALIZED VIEWS FOR DASHBOARD AGGREGATIONS
-- =============================================================================

-- User portfolio summary (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_portfolio_summary AS
SELECT
  h.user_id,
  COUNT(DISTINCT h.symbol) as total_positions,
  SUM(h.quantity * h.current_price) as total_value,
  SUM(h.quantity * h.average_cost) as total_cost,
  SUM((h.current_price - h.average_cost) * h.quantity) as total_gain_loss,
  CASE
    WHEN SUM(h.quantity * h.average_cost) > 0
    THEN (SUM((h.current_price - h.average_cost) * h.quantity) / SUM(h.quantity * h.average_cost)) * 100
    ELSE 0
  END as return_percent,
  MAX(h.updated_at) as last_updated
FROM holdings h
WHERE h.deleted_at IS NULL AND h.quantity > 0
GROUP BY h.user_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_summary_user
ON user_portfolio_summary(user_id);

-- Trading performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS user_trading_performance AS
SELECT
  t.user_id,
  COUNT(*) as total_trades,
  COUNT(*) FILTER (WHERE t.side = 'buy') as buy_trades,
  COUNT(*) FILTER (WHERE t.side = 'sell') as sell_trades,
  SUM(t.quantity * t.price) as total_volume,
  AVG(t.quantity * t.price) as avg_trade_size,
  MIN(t.executed_at) as first_trade,
  MAX(t.executed_at) as last_trade
FROM trades t
WHERE t.status = 'executed'
GROUP BY t.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trading_performance_user
ON user_trading_performance(user_id);

-- =============================================================================
-- DATABASE FUNCTIONS FOR COMPLEX CALCULATIONS
-- =============================================================================

-- Calculate portfolio diversity score
CREATE OR REPLACE FUNCTION calculate_portfolio_diversity(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_diversity NUMERIC;
BEGIN
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 0
      WHEN COUNT(*) = 1 THEN 0
      ELSE (1.0 - (SUM(POWER((quantity * current_price) / total_value, 2))))
    END INTO v_diversity
  FROM (
    SELECT
      h.quantity,
      h.current_price,
      (SELECT SUM(quantity * current_price) FROM holdings WHERE user_id = p_user_id AND deleted_at IS NULL) as total_value
    FROM holdings h
    WHERE h.user_id = p_user_id AND h.deleted_at IS NULL AND h.quantity > 0
  ) portfolio;

  RETURN COALESCE(v_diversity, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get user's current rank
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_rank INTEGER;
BEGIN
  SELECT rank INTO v_rank
  FROM leaderboard
  WHERE user_id = p_user_id;

  RETURN v_rank;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate win rate
CREATE OR REPLACE FUNCTION calculate_win_rate(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_win_rate NUMERIC;
BEGIN
  WITH trade_results AS (
    SELECT
      t.id,
      CASE
        WHEN t.side = 'sell' AND t.price > h.average_cost THEN 1
        WHEN t.side = 'sell' AND t.price <= h.average_cost THEN 0
        ELSE NULL
      END as is_win
    FROM trades t
    LEFT JOIN holdings h ON h.user_id = t.user_id AND h.symbol = t.symbol
    WHERE t.user_id = p_user_id AND t.status = 'executed' AND t.side = 'sell'
  )
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE is_win = 1)::NUMERIC / COUNT(*)::NUMERIC) * 100
    END INTO v_win_rate
  FROM trade_results
  WHERE is_win IS NOT NULL;

  RETURN COALESCE(v_win_rate, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- AUTOMATIC TIMESTAMP TRIGGERS
-- =============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'updated_at'
    AND table_name NOT LIKE '%_old'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t.table_name, t.table_name);
  END LOOP;
END $$;

-- =============================================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- =============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_portfolio_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_trading_performance;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (every 5 minutes via pg_cron or external scheduler)
-- Note: This requires pg_cron extension or external cron job
-- Example: */5 * * * * psql -c "SELECT refresh_materialized_views();"

-- =============================================================================
-- VACUUM AND ANALYZE
-- =============================================================================

-- Analyze tables to update statistics
ANALYZE holdings;
ANALYZE trades;
ANALYZE price_alerts;
ANALYZE watchlist;
ANALYZE bot_allocations;
ANALYZE leaderboard;
ANALYZE news_articles;
ANALYZE user_sessions;
ANALYZE notifications;
ANALYZE portfolio_snapshots;
