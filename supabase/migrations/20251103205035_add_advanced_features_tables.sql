/*
  # Add Advanced Features Tables

  Creates tables for alerts, insights, social, and analytics features.
*/

-- User Alerts Table
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  symbol TEXT,
  condition TEXT NOT NULL,
  target_value DECIMAL(15, 2),
  is_active BOOLEAN DEFAULT true,
  triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alerts" ON user_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Portfolio Insights Table
CREATE TABLE IF NOT EXISTS portfolio_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3, 2),
  impact_level TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_user_id ON portfolio_insights(user_id);
ALTER TABLE portfolio_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own insights" ON portfolio_insights FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own insights" ON portfolio_insights FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Performance Analytics Table
CREATE TABLE IF NOT EXISTS performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  starting_value DECIMAL(15, 2),
  ending_value DECIMAL(15, 2),
  percentage_return DECIMAL(10, 4),
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON performance_analytics(user_id);
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own analytics" ON performance_analytics FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
