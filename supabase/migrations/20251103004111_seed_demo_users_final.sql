/*
  # Seed Demo Users - Final Version
  
  Creates profiles, accounts, and portfolio holdings for 10 demo users.
  Provides realistic test data for application testing and demonstration.
*/

-- Create profiles for demo users
INSERT INTO profiles (id, email, full_name, phone, country_code, preferred_language, theme_mode, preferred_currency)
SELECT 
  u.id,
  u.email,
  INITCAP(REPLACE(SPLIT_PART(u.email, '@', 1), '.', ' ')),
  '+1-555-' || LPAD((1000 + ROW_NUMBER() OVER ())::text, 4, '0'),
  'US',
  'en',
  CASE WHEN ROW_NUMBER() OVER () % 2 = 0 THEN 'dark' ELSE 'light' END,
  'USD'
FROM auth.users u
WHERE u.email LIKE '%@demo.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Seed accounts and holdings for demo users
DO $$
DECLARE
  demo_user RECORD;
  v_account_id uuid;
BEGIN
  -- Sarah Johnson
  SELECT id INTO demo_user FROM auth.users WHERE email = 'sarah.johnson@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'demo_cash', 'Main Trading', 50000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'AAPL', 'stock', 25.00, 175.50, 189.25, 4731.25, 343.75, 7.83),
    (v_account_id, 'GOOGL', 'stock', 15.00, 142.30, 151.80, 2277.00, 142.50, 6.68),
    (v_account_id, 'BTC', 'crypto', 0.15, 42000.00, 43500.00, 6525.00, 225.00, 3.57);
    
    INSERT INTO watchlist (user_id, symbol) VALUES (demo_user.id, 'TSLA'), (demo_user.id, 'META');
  END IF;

  -- Michael Chen
  SELECT id INTO demo_user FROM auth.users WHERE email = 'michael.chen@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'live_cash', 'Crypto Trading', 75000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'BTC', 'crypto', 0.85, 40500.00, 43500.00, 36975.00, 2550.00, 7.41),
    (v_account_id, 'ETH', 'crypto', 12.00, 2600.00, 2950.00, 35400.00, 4200.00, 13.46),
    (v_account_id, 'NVDA', 'stock', 20.00, 520.00, 585.00, 11700.00, 1300.00, 12.50);
    
    INSERT INTO watchlist (user_id, symbol) VALUES (demo_user.id, 'AAPL');
  END IF;

  -- Emily Rodriguez
  SELECT id INTO demo_user FROM auth.users WHERE email = 'emily.rodriguez@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'demo_cash', 'Growth Portfolio', 40000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'AMZN', 'stock', 25.00, 155.00, 168.50, 4212.50, 337.50, 8.71),
    (v_account_id, 'META', 'stock', 30.00, 315.00, 342.00, 10260.00, 810.00, 8.57);
  END IF;

  -- David Williams
  SELECT id INTO demo_user FROM auth.users WHERE email = 'david.williams@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'live_cash', 'Day Trading', 90000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'TSLA', 'stock', 50.00, 245.00, 268.50, 13425.00, 1175.00, 9.59),
    (v_account_id, 'AMD', 'stock', 100.00, 125.00, 138.50, 13850.00, 1350.00, 10.80);
  END IF;

  -- Jessica Patel
  SELECT id INTO demo_user FROM auth.users WHERE email = 'jessica.patel@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'demo_cash', 'Balanced', 55000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'AAPL', 'stock', 35.00, 172.00, 189.25, 6623.75, 603.75, 10.02),
    (v_account_id, 'MSFT', 'stock', 25.00, 385.00, 398.50, 9962.50, 337.50, 3.51);
  END IF;

  -- Robert Kim
  SELECT id INTO demo_user FROM auth.users WHERE email = 'robert.kim@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'demo_cash', 'Tech Focus', 65000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'GOOGL', 'stock', 30.00, 142.00, 151.80, 4554.00, 294.00, 6.90),
    (v_account_id, 'NVDA', 'stock', 15.00, 520.00, 585.00, 8775.00, 975.00, 12.50);
  END IF;

  -- Lisa Martinez
  SELECT id INTO demo_user FROM auth.users WHERE email = 'lisa.martinez@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'live_cash', 'Mixed Portfolio', 48000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'MSFT', 'stock', 20.00, 380.00, 398.50, 7970.00, 370.00, 4.87),
    (v_account_id, 'ETH', 'crypto', 5.00, 2700.00, 2950.00, 14750.00, 1250.00, 9.26);
  END IF;

  -- James Anderson
  SELECT id INTO demo_user FROM auth.users WHERE email = 'james.anderson@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'demo_cash', 'Conservative', 35000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'AAPL', 'stock', 20.00, 180.00, 189.25, 3785.00, 185.00, 5.14),
    (v_account_id, 'GOOGL', 'stock', 25.00, 145.00, 151.80, 3795.00, 170.00, 4.69);
  END IF;

  -- Amanda Taylor
  SELECT id INTO demo_user FROM auth.users WHERE email = 'amanda.taylor@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'live_cash', 'Growth Stocks', 72000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'TSLA', 'stock', 35.00, 250.00, 268.50, 9397.50, 647.50, 7.40),
    (v_account_id, 'META', 'stock', 25.00, 320.00, 342.00, 8550.00, 550.00, 6.88);
  END IF;

  -- Christopher Lee
  SELECT id INTO demo_user FROM auth.users WHERE email = 'christopher.lee@demo.com';
  IF demo_user.id IS NOT NULL THEN
    INSERT INTO accounts (user_id, account_type, name, balance, currency, is_active)
    VALUES (demo_user.id, 'demo_cash', 'Diversified', 62000.00, 'USD', true)
    RETURNING id INTO v_account_id;
    
    INSERT INTO holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent) VALUES
    (v_account_id, 'AMZN', 'stock', 30.00, 158.00, 168.50, 5055.00, 315.00, 6.65),
    (v_account_id, 'BTC', 'crypto', 0.25, 41500.00, 43500.00, 10875.00, 500.00, 4.82),
    (v_account_id, 'MSFT', 'stock', 18.00, 390.00, 398.50, 7173.00, 153.00, 2.18);
  END IF;
END $$;
