/*
  # Seed Complete Demo User Data
  
  Creates comprehensive test data for existing demo users:
  - Profile updates with contact information
  - Trading accounts with realistic balances
  - Diverse portfolio holdings (stocks & crypto)
  - Active trading bots with strategies
  - Bot trade history with P&L
  - Personalized watchlists
  - Recent notifications
  
  Provides 10 fully-populated demo accounts for testing.
*/

-- Update demo user profiles with complete information
UPDATE profiles SET
  full_name = 'Sarah Johnson',
  phone = '+1-555-1001',
  country_code = 'US',
  preferred_language = 'en',
  theme_mode = 'auto',
  preferred_currency = 'USD'
WHERE email = 'sarah.johnson@demo.com';

UPDATE profiles SET
  full_name = 'Michael Chen',
  phone = '+1-555-1002',
  country_code = 'US',
  preferred_language = 'en',
  theme_mode = 'dark',
  preferred_currency = 'USD'
WHERE email = 'michael.chen@demo.com';

UPDATE profiles SET
  full_name = 'Emily Rodriguez',
  phone = '+1-555-1003',
  country_code = 'CA',
  preferred_language = 'en',
  theme_mode = 'light',
  preferred_currency = 'CAD'
WHERE email = 'emily.rodriguez@demo.com';

UPDATE profiles SET
  full_name = 'David Williams',
  phone = '+1-555-1004',
  country_code = 'UK',
  preferred_language = 'en',
  theme_mode = 'auto',
  preferred_currency = 'GBP'
WHERE email = 'david.williams@demo.com';

UPDATE profiles SET
  full_name = 'Jessica Patel',
  phone = '+1-555-1005',
  country_code = 'US',
  preferred_language = 'en',
  theme_mode = 'dark',
  preferred_currency = 'USD'
WHERE email = 'jessica.patel@demo.com';

-- Sarah Johnson - Active Trader
DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_bot_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'sarah.johnson@demo.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Create demo cash account
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (v_user_id, 'demo_cash', 'Main Trading Account', 52438.75, 'USD', true)
    RETURNING id INTO v_account_id;
    
    -- Create diverse holdings
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'AAPL', 'stock', 25.00, 175.50, 189.25, 4731.25, 343.75, 7.83),
    (v_account_id, 'GOOGL', 'stock', 15.00, 142.30, 151.80, 2277.00, 142.50, 6.68),
    (v_account_id, 'MSFT', 'stock', 30.00, 380.20, 398.50, 11955.00, 549.00, 4.81),
    (v_account_id, 'NVDA', 'stock', 10.00, 520.00, 585.00, 5850.00, 650.00, 12.50),
    (v_account_id, 'BTC', 'crypto', 0.15, 42000.00, 43500.00, 6525.00, 225.00, 3.57),
    (v_account_id, 'ETH', 'crypto', 2.50, 2800.00, 2950.00, 7375.00, 375.00, 5.36);
    
    -- Create momentum trading bot
    INSERT INTO bot_allocations (user_id, account_id, bot_name, strategy, allocated_amount, current_value, profit_loss, profit_loss_percent, is_active, risk_level, symbols)
    VALUES (v_user_id, v_account_id, 'Momentum Scanner', 'momentum', 10000.00, 11250.00, 1250.00, 12.50, true, 'medium', ARRAY['AAPL', 'GOOGL', 'MSFT', 'NVDA'])
    RETURNING id INTO v_bot_id;
    
    -- Create successful bot trades
    INSERT INTO bot_trades (bot_allocation_id, symbol, side, quantity, entry_price, exit_price, profit_loss, status, opened_at, closed_at) VALUES
    (v_bot_id, 'AAPL', 'buy', 10.00, 180.00, 189.00, 90.00, 'closed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
    (v_bot_id, 'GOOGL', 'buy', 8.00, 145.00, 151.50, 52.00, 'closed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'),
    (v_bot_id, 'MSFT', 'sell', 12.00, 395.00, 390.00, 60.00, 'closed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),
    (v_bot_id, 'NVDA', 'buy', 5.00, 550.00, 585.00, 175.00, 'closed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day');
    
    -- Create watchlist
    INSERT INTO watchlist (user_id, symbol, asset_type, notes) VALUES
    (v_user_id, 'TSLA', 'stock', 'Watching for entry point'),
    (v_user_id, 'META', 'stock', 'AI growth potential'),
    (v_user_id, 'AMZN', 'stock', 'Long-term hold'),
    (v_user_id, 'SOL', 'crypto', 'High volatility'),
    (v_user_id, 'AMD', 'stock', NULL);
    
    -- Create notifications
    INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at) VALUES
    (v_user_id, 'trade_executed', 'Trade Executed', 'Momentum Scanner bought 10 shares of AAPL at $180.00', false, NOW() - INTERVAL '1 day'),
    (v_user_id, 'price_alert', 'Price Alert', 'NVDA reached your target price of $585.00', true, NOW() - INTERVAL '3 days'),
    (v_user_id, 'bot_performance', 'Bot Performance', 'Momentum Scanner is up 12.5% this month', false, NOW() - INTERVAL '2 hours');
  END IF;
END $$;

-- Michael Chen - Crypto Focused
DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_bot_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'michael.chen@demo.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (v_user_id, 'live_cash', 'Crypto Trading', 78250.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'BTC', 'crypto', 0.85, 40500.00, 43500.00, 36975.00, 2550.00, 7.41),
    (v_account_id, 'ETH', 'crypto', 12.00, 2600.00, 2950.00, 35400.00, 4200.00, 13.46),
    (v_account_id, 'NVDA', 'stock', 20.00, 520.00, 585.00, 11700.00, 1300.00, 12.50);
    
    -- Create scalping bot for crypto
    INSERT INTO bot_allocations (user_id, account_id, bot_name, strategy, allocated_amount, current_value, profit_loss, profit_loss_percent, is_active, risk_level, symbols)
    VALUES (v_user_id, v_account_id, 'Crypto Scalper', 'scalping', 15000.00, 16875.00, 1875.00, 12.50, true, 'high', ARRAY['BTC', 'ETH', 'SOL'])
    RETURNING id INTO v_bot_id;
    
    INSERT INTO bot_trades (bot_allocation_id, symbol, side, quantity, entry_price, exit_price, profit_loss, status, opened_at, closed_at) VALUES
    (v_bot_id, 'BTC', 'buy', 0.05, 42800.00, 43500.00, 35.00, 'closed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
    (v_bot_id, 'ETH', 'buy', 2.00, 2900.00, 2950.00, 100.00, 'closed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days');
    
    INSERT INTO watchlist (user_id, symbol, asset_type, notes) VALUES
    (v_user_id, 'SOL', 'crypto', 'Breakout potential'),
    (v_user_id, 'AAPL', 'stock', 'Diversification'),
    (v_user_id, 'BNB', 'crypto', NULL);
    
    INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at) VALUES
    (v_user_id, 'trade_executed', 'Trade Alert', 'Crypto Scalper sold ETH at $2,950', false, NOW() - INTERVAL '6 hours'),
    (v_user_id, 'bot_performance', 'Daily Summary', 'Your bots generated $125 today', true, NOW() - INTERVAL '1 day');
  END IF;
END $$;

-- Emily Rodriguez - Conservative Investor
DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'emily.rodriguez@demo.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (v_user_id, 'demo_cash', 'Growth Portfolio', 42150.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'AMZN', 'stock', 25.00, 155.00, 168.50, 4212.50, 337.50, 8.71),
    (v_account_id, 'META', 'stock', 30.00, 315.00, 342.00, 10260.00, 810.00, 8.57),
    (v_account_id, 'GOOGL', 'stock', 40.00, 142.00, 151.80, 6072.00, 392.00, 6.90),
    (v_account_id, 'MSFT', 'stock', 20.00, 375.00, 398.50, 7970.00, 470.00, 6.27);
    
    INSERT INTO watchlist (user_id, symbol, asset_type, notes) VALUES
    (v_user_id, 'AAPL', 'stock', 'Waiting for correction'),
    (v_user_id, 'TSLA', 'stock', 'Long-term potential'),
    (v_user_id, 'BTC', 'crypto', 'Research phase');
    
    INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at) VALUES
    (v_user_id, 'account_activity', 'Monthly Report', 'Your portfolio is up 8.2% this month', false, NOW() - INTERVAL '12 hours');
  END IF;
END $$;

-- David Williams - Day Trader
DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_bot_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'david.williams@demo.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (v_user_id, 'live_cash', 'Day Trading', 95750.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'TSLA', 'stock', 50.00, 245.00, 268.50, 13425.00, 1175.00, 9.59),
    (v_account_id, 'NVDA', 'stock', 25.00, 550.00, 585.00, 14625.00, 875.00, 6.36),
    (v_account_id, 'AMD', 'stock', 100.00, 125.00, 138.50, 13850.00, 1350.00, 10.80);
    
    -- Create swing trading bot
    INSERT INTO bot_allocations (user_id, account_id, bot_name, strategy, allocated_amount, current_value, profit_loss, profit_loss_percent, is_active, risk_level, symbols)
    VALUES (v_user_id, v_account_id, 'Swing Trader Pro', 'swing', 20000.00, 22400.00, 2400.00, 12.00, true, 'medium', ARRAY['TSLA', 'AMD', 'NVDA'])
    RETURNING id INTO v_bot_id;
    
    INSERT INTO bot_trades (bot_allocation_id, symbol, side, quantity, entry_price, exit_price, profit_loss, status, opened_at, closed_at) VALUES
    (v_bot_id, 'TSLA', 'buy', 15.00, 255.00, 268.00, 195.00, 'closed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days'),
    (v_bot_id, 'AMD', 'buy', 30.00, 128.00, 138.00, 300.00, 'closed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days');
    
    INSERT INTO watchlist (user_id, symbol, asset_type) VALUES
    (v_user_id, 'META', 'stock'),
    (v_user_id, 'AAPL', 'stock'),
    (v_user_id, 'GOOGL', 'stock');
  END IF;
END $$;

-- Jessica Patel - Balanced Portfolio
DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'jessica.patel@demo.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (v_user_id, 'demo_cash', 'Balanced Account', 58900.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'AAPL', 'stock', 35.00, 172.00, 189.25, 6623.75, 603.75, 10.02),
    (v_account_id, 'MSFT', 'stock', 25.00, 385.00, 398.50, 9962.50, 337.50, 3.51),
    (v_account_id, 'BTC', 'crypto', 0.20, 41000.00, 43500.00, 8700.00, 500.00, 6.10),
    (v_account_id, 'ETH', 'crypto', 3.00, 2750.00, 2950.00, 8850.00, 600.00, 7.27);
    
    INSERT INTO watchlist (user_id, symbol, asset_type, notes) VALUES
    (v_user_id, 'AMZN', 'stock', 'Potential buy'),
    (v_user_id, 'SOL', 'crypto', 'High growth');
    
    INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at) VALUES
    (v_user_id, 'price_alert', 'Target Reached', 'BTC reached $43,500', false, NOW() - INTERVAL '5 hours');
  END IF;
END $$;
