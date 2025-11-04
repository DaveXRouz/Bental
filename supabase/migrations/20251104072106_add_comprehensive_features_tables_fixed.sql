/*
  # Comprehensive Features - All Tables (Fixed)
  
  1. Price Alerts, News, Social Trading, Watchlist, Bot Marketplace, 
     Multi-Currency, Tax Reports, Push Notifications
  
  All with admin management capabilities
*/

-- ============================================================
-- PRICE ALERTS
-- ============================================================

CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below', 'equals', 'percent_change')),
  target_price DECIMAL(15, 2),
  percent_change DECIMAL(5, 2),
  current_price DECIMAL(15, 2),
  active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT false,
  repeat_alert BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(active) WHERE active = true;

-- ============================================================
-- NEWS SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS news_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  author TEXT,
  source TEXT,
  source_url TEXT,
  image_url TEXT,
  category_id UUID REFERENCES news_categories(id),
  symbols TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_news_symbols ON news_articles USING GIN(symbols);

-- ============================================================
-- SOCIAL TRADING & LEADERBOARD
-- ============================================================

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  rank INTEGER,
  total_return_percent DECIMAL(10, 4) DEFAULT 0,
  total_return_amount DECIMAL(15, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  portfolio_value DECIMAL(15, 2) DEFAULT 0,
  public BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank) WHERE public = true;
CREATE INDEX IF NOT EXISTS idx_leaderboard_featured ON leaderboard(featured) WHERE featured = true;

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- ============================================================
-- ENHANCED WATCHLIST
-- ============================================================

CREATE TABLE IF NOT EXISTS watchlist_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_groups_user ON watchlist_groups(user_id);

CREATE TABLE IF NOT EXISTS watchlist_items_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES watchlist_groups(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  notes TEXT,
  price_target DECIMAL(15, 2),
  alert_enabled BOOLEAN DEFAULT false,
  color_tag TEXT,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_items_group ON watchlist_items_enhanced(group_id);

-- ============================================================
-- BOT MARKETPLACE
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  expected_return_percent DECIMAL(5, 2),
  min_investment DECIMAL(15, 2) DEFAULT 1000,
  price_monthly DECIMAL(10, 2) DEFAULT 0,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}',
  backtesting_results JSONB,
  creator_id UUID REFERENCES auth.users(id),
  subscribers_count INTEGER DEFAULT 0,
  total_return DECIMAL(10, 4),
  win_rate DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_templates_published ON bot_templates(published, featured);

CREATE TABLE IF NOT EXISTS bot_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES bot_templates(id) ON DELETE CASCADE NOT NULL,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_subscriptions_user ON bot_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS bot_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_return DECIMAL(10, 4),
  trades_count INTEGER,
  win_rate DECIMAL(5, 2),
  portfolio_value DECIMAL(15, 2),
  UNIQUE(bot_id, date)
);

CREATE INDEX IF NOT EXISTS idx_bot_performance_bot_date ON bot_performance_history(bot_id, date DESC);

-- ============================================================
-- MULTI-CURRENCY
-- ============================================================

CREATE TABLE IF NOT EXISTS currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(15, 6) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);

CREATE TABLE IF NOT EXISTS user_currency_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TAX REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  total_gains DECIMAL(15, 2),
  total_losses DECIMAL(15, 2),
  net_gain_loss DECIMAL(15, 2),
  short_term_gains DECIMAL(15, 2),
  long_term_gains DECIMAL(15, 2),
  report_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_tax_reports_user_year ON tax_reports(user_id, year DESC);

-- ============================================================
-- PUSH NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_info JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_notification_tokens(active) WHERE active = true;

-- ============================================================
-- SEED DEFAULT DATA
-- ============================================================

INSERT INTO currencies (code, name, symbol, display_order) VALUES
  ('USD', 'US Dollar', '$', 1),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 3),
  ('JPY', 'Japanese Yen', '¥', 4),
  ('CAD', 'Canadian Dollar', 'C$', 5),
  ('AUD', 'Australian Dollar', 'A$', 6),
  ('CHF', 'Swiss Franc', 'CHF', 7),
  ('CNY', 'Chinese Yuan', '¥', 8)
ON CONFLICT (code) DO NOTHING;

INSERT INTO news_categories (name, slug, description, icon, color, display_order) VALUES
  ('Market News', 'market', 'General market updates', 'TrendingUp', '#3b82f6', 1),
  ('Earnings', 'earnings', 'Company earnings reports', 'DollarSign', '#10b981', 2),
  ('IPOs', 'ipos', 'Initial public offerings', 'Rocket', '#8b5cf6', 3),
  ('FDA Approvals', 'fda', 'FDA drug approvals', 'Shield', '#06b6d4', 4),
  ('M&A', 'mergers', 'Mergers and acquisitions', 'Users', '#f59e0b', 5),
  ('Economic', 'economic', 'Economic indicators', 'BarChart', '#ef4444', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own alerts" ON price_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own alerts" ON price_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own alerts" ON price_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own alerts" ON price_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "View published news" ON news_articles FOR SELECT USING (published = true OR auth.uid() = created_by);
CREATE POLICY "View active categories" ON news_categories FOR SELECT USING (active = true);

CREATE POLICY "View public leaderboard" ON leaderboard FOR SELECT USING (public = true);
CREATE POLICY "View own leaderboard" ON leaderboard FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Update own leaderboard" ON leaderboard FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "View all follows" ON user_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create follows" ON user_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Delete own follows" ON user_follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE POLICY "View own achievements" ON achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Manage own watchlist groups" ON watchlist_groups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own watchlist items" ON watchlist_items_enhanced FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM watchlist_groups WHERE watchlist_groups.id = watchlist_items_enhanced.group_id AND watchlist_groups.user_id = auth.uid())
);

CREATE POLICY "View published templates" ON bot_templates FOR SELECT USING (published = true);
CREATE POLICY "Manage own subscriptions" ON bot_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "View active currencies" ON currencies FOR SELECT USING (active = true);
CREATE POLICY "View exchange rates" ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "Manage own currency prefs" ON user_currency_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "View own tax reports" ON tax_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own push tokens" ON push_notification_tokens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
