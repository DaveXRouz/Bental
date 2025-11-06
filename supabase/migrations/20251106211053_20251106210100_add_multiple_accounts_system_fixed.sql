/*
  # Multi-Account System Implementation (Fixed)
  
  ## Overview
  This migration implements a comprehensive multi-account system that allows users to:
  - Create multiple accounts with different purposes (Cash, Equity, Crypto, Retirement)
  - Manage account types with predefined configurations
  - Set default accounts for quick access
  - Track account features and capabilities
  
  ## Changes Made
  
  ### 1. Account Types Reference Table
  - Creates `account_types` table with metadata for each account type
  - Includes type name, description, icon, color, and feature flags
  
  ### 2. Enhanced Accounts Table
  - Removes old CHECK constraint on account_type
  - Adds new account type values to support diverse account types
  - Adds `account_description` for custom descriptions
  - Adds `account_features` JSON field for feature flags
  - Adds `is_default` boolean to mark primary account
  - Adds `status` field (active, frozen, closed)
  
  ### 3. Seed Multiple Accounts for Existing Users
  - Fixes amanda.taylor@demo.com to have multiple diverse accounts
  - Adds accounts for all demo users with proper naming
  
  ### 4. Security
  - Updates RLS policies to support multiple accounts
  - Adds check to limit maximum accounts per user (10)
*/

-- =====================================================
-- 1. Create Account Types Reference Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.account_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cash', 'investment', 'specialized')),
  features JSONB DEFAULT '{}',
  min_balance DECIMAL(20, 2) DEFAULT 0,
  allows_deposits BOOLEAN DEFAULT true,
  allows_withdrawals BOOLEAN DEFAULT true,
  allows_trading BOOLEAN DEFAULT false,
  allows_crypto BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined account types
INSERT INTO public.account_types (id, name, description, icon, color, category, features, allows_deposits, allows_withdrawals, allows_trading, allows_crypto, display_order)
VALUES
  ('primary_cash', 'Primary Cash', 'Main account for deposits, withdrawals, and daily transactions', 'Wallet', '#10B981', 'cash', '{"interest_earning": false, "instant_transfers": true}', true, true, false, false, 1),
  ('savings_cash', 'Savings Account', 'High-yield savings account for storing cash reserves', 'PiggyBank', '#059669', 'cash', '{"interest_earning": true, "instant_transfers": false}', true, true, false, false, 2),
  ('trading_cash', 'Trading Cash', 'Cash account specifically for active trading', 'TrendingUp', '#10B981', 'cash', '{"instant_transfers": true, "linked_to_trading": true}', true, true, false, false, 3),
  ('equity_trading', 'Equity Trading', 'Trade stocks, ETFs, and equity securities', 'LineChart', '#3B82F6', 'investment', '{"stock_trading": true, "options_trading": false, "margin_trading": false}', true, true, true, false, 4),
  ('crypto_portfolio', 'Crypto Portfolio', 'Buy, sell, and hold cryptocurrencies', 'Bitcoin', '#F59E0B', 'investment', '{"crypto_trading": true, "staking": true, "defi": false}', true, true, false, true, 5),
  ('dividend_income', 'Dividend Portfolio', 'Income-focused portfolio with dividend stocks', 'DollarSign', '#8B5CF6', 'investment', '{"dividend_reinvestment": true, "income_tracking": true}', true, false, true, false, 6),
  ('retirement_fund', 'Retirement Account', 'Tax-advantaged retirement savings (IRA, 401k)', 'Home', '#EC4899', 'specialized', '{"tax_advantaged": true, "early_withdrawal_penalty": true}', true, false, true, false, 7),
  ('margin_trading', 'Margin Account', 'Trade with leverage and borrowed funds', 'Zap', '#EF4444', 'specialized', '{"margin_trading": true, "options_trading": true, "advanced_orders": true}', true, true, true, false, 8)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on account_types
ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read account types
DROP POLICY IF EXISTS "Anyone can view account types" ON public.account_types;
CREATE POLICY "Anyone can view account types"
  ON public.account_types FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 2. Enhance Accounts Table
-- =====================================================

-- Drop the old CHECK constraint
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_account_type_check;

-- Add new columns to accounts table
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS account_description TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS account_features JSONB DEFAULT '{}';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Add new CHECK constraint with expanded account types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounts_account_type_check_new'
  ) THEN
    ALTER TABLE public.accounts ADD CONSTRAINT accounts_account_type_check_new
      CHECK (account_type IN (
        'demo_cash', 'demo_crypto', 'demo_equity', 'live_cash', 'live_equity',
        'primary_cash', 'savings_cash', 'trading_cash', 'equity_trading', 
        'crypto_portfolio', 'dividend_income', 'retirement_fund', 'margin_trading'
      ));
  END IF;
END $$;

-- Add CHECK constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounts_status_check'
  ) THEN
    ALTER TABLE public.accounts ADD CONSTRAINT accounts_status_check
      CHECK (status IN ('active', 'frozen', 'closed'));
  END IF;
END $$;

-- Add index for faster default account lookup
CREATE INDEX IF NOT EXISTS idx_accounts_user_default ON public.accounts(user_id) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status) WHERE status = 'active';

-- =====================================================
-- 3. Seed Multiple Accounts for Demo Users
-- =====================================================

DO $$
DECLARE
  demo_user RECORD;
BEGIN
  -- Amanda Taylor - Growth investor with diverse portfolio
  SELECT id INTO demo_user FROM auth.users WHERE email = 'amanda.taylor@demo.com';
  IF demo_user.id IS NOT NULL THEN
    -- Delete existing accounts to recreate with better structure
    DELETE FROM public.holdings WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = demo_user.id);
    DELETE FROM public.accounts WHERE user_id = demo_user.id;
    
    -- Create multiple diverse accounts
    INSERT INTO public.accounts (user_id, account_type, name, account_description, balance, currency, is_active, is_default, status) VALUES
      (demo_user.id, 'primary_cash', 'Primary Cash Account', 'Main account for deposits and withdrawals', 15250.00, 'USD', true, true, 'active'),
      (demo_user.id, 'equity_trading', 'Growth Stock Portfolio', 'High-growth technology and innovation stocks', 45680.00, 'USD', true, false, 'active'),
      (demo_user.id, 'crypto_portfolio', 'Crypto Holdings', 'Bitcoin, Ethereum, and altcoin investments', 18750.00, 'USD', true, false, 'active'),
      (demo_user.id, 'dividend_income', 'Dividend Income Fund', 'Stable dividend-paying stocks for passive income', 28900.00, 'USD', true, false, 'active');
    
    -- Add holdings to equity account
    INSERT INTO public.holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent)
    SELECT a.id, 'TSLA', 'stock', 35.00, 250.00, 268.50, 9397.50, 647.50, 7.40
    FROM public.accounts a WHERE a.user_id = demo_user.id AND a.account_type = 'equity_trading';
    
    INSERT INTO public.holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent)
    SELECT a.id, 'META', 'stock', 25.00, 320.00, 342.00, 8550.00, 550.00, 6.88
    FROM public.accounts a WHERE a.user_id = demo_user.id AND a.account_type = 'equity_trading';
    
    -- Add crypto holdings
    INSERT INTO public.holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent)
    SELECT a.id, 'BTC', 'crypto', 0.25, 42000.00, 43500.00, 10875.00, 375.00, 3.57
    FROM public.accounts a WHERE a.user_id = demo_user.id AND a.account_type = 'crypto_portfolio';
    
    INSERT INTO public.holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent)
    SELECT a.id, 'ETH', 'crypto', 2.50, 2800.00, 2950.00, 7375.00, 375.00, 5.36
    FROM public.accounts a WHERE a.user_id = demo_user.id AND a.account_type = 'crypto_portfolio';
  END IF;

  -- Sarah Johnson - Conservative balanced investor
  SELECT id INTO demo_user FROM auth.users WHERE email = 'sarah.johnson@demo.com';
  IF demo_user.id IS NOT NULL THEN
    DELETE FROM public.holdings WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = demo_user.id);
    DELETE FROM public.accounts WHERE user_id = demo_user.id;
    
    INSERT INTO public.accounts (user_id, account_type, name, account_description, balance, currency, is_active, is_default, status) VALUES
      (demo_user.id, 'primary_cash', 'Main Checking', 'Primary cash account', 12500.00, 'USD', true, true, 'active'),
      (demo_user.id, 'savings_cash', 'Emergency Fund', 'High-yield savings for emergencies', 25000.00, 'USD', true, false, 'active'),
      (demo_user.id, 'equity_trading', 'Balanced Portfolio', 'Mix of growth and value stocks', 35600.00, 'USD', true, false, 'active');
    
    INSERT INTO public.holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent)
    SELECT a.id, 'AAPL', 'stock', 25.00, 175.50, 189.25, 4731.25, 343.75, 7.83
    FROM public.accounts a WHERE a.user_id = demo_user.id AND a.account_type = 'equity_trading';
    
    INSERT INTO public.holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent)
    SELECT a.id, 'GOOGL', 'stock', 15.00, 142.30, 151.80, 2277.00, 142.50, 6.68
    FROM public.accounts a WHERE a.user_id = demo_user.id AND a.account_type = 'equity_trading';
  END IF;

  -- Michael Chen - Crypto enthusiast
  SELECT id INTO demo_user FROM auth.users WHERE email = 'michael.chen@demo.com';
  IF demo_user.id IS NOT NULL THEN
    DELETE FROM public.holdings WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = demo_user.id);
    DELETE FROM public.accounts WHERE user_id = demo_user.id;
    
    INSERT INTO public.accounts (user_id, account_type, name, account_description, balance, currency, is_active, is_default, status) VALUES
      (demo_user.id, 'primary_cash', 'Operating Cash', 'Daily transactions', 8500.00, 'USD', true, true, 'active'),
      (demo_user.id, 'crypto_portfolio', 'Main Crypto Portfolio', 'Bitcoin and Ethereum holdings', 58200.00, 'USD', true, false, 'active'),
      (demo_user.id, 'crypto_portfolio', 'Altcoin Portfolio', 'Alternative cryptocurrency investments', 24750.00, 'USD', true, false, 'active'),
      (demo_user.id, 'equity_trading', 'Tech Stocks', 'Technology sector equities', 18900.00, 'USD', true, false, 'active');
    
    INSERT INTO public.holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent)
    SELECT a.id, 'BTC', 'crypto', 0.85, 40500.00, 43500.00, 36975.00, 2550.00, 7.41
    FROM public.accounts a WHERE a.user_id = demo_user.id AND a.name = 'Main Crypto Portfolio';
    
    INSERT INTO public.holdings (account_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl, unrealized_pnl_percent)
    SELECT a.id, 'ETH', 'crypto', 7.00, 2600.00, 2950.00, 20650.00, 2450.00, 13.46
    FROM public.accounts a WHERE a.user_id = demo_user.id AND a.name = 'Main Crypto Portfolio';
  END IF;

END $$;

-- =====================================================
-- 4. Update RLS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create own accounts with limit" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own accounts with limit"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (SELECT COUNT(*) FROM public.accounts WHERE user_id = auth.uid() AND status != 'closed') < 10
  );

CREATE POLICY "Users can update own accounts"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND balance = 0);

-- =====================================================
-- 5. Helper Functions
-- =====================================================

-- Function to get default account for a user
CREATE OR REPLACE FUNCTION public.get_default_account(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE user_id = p_user_id 
    AND is_default = true 
    AND status = 'active'
  LIMIT 1;
  
  -- If no default, return first active account
  IF v_account_id IS NULL THEN
    SELECT id INTO v_account_id
    FROM public.accounts
    WHERE user_id = p_user_id 
      AND status = 'active'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN v_account_id;
END;
$$;

-- Function to set default account
CREATE OR REPLACE FUNCTION public.set_default_account(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id for the account
  SELECT user_id INTO v_user_id
  FROM public.accounts
  WHERE id = p_account_id AND auth.uid() = user_id;
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Remove default from all user accounts
  UPDATE public.accounts
  SET is_default = false
  WHERE user_id = v_user_id;
  
  -- Set new default
  UPDATE public.accounts
  SET is_default = true
  WHERE id = p_account_id;
  
  RETURN true;
END;
$$;

-- Function to count active accounts for a user
CREATE OR REPLACE FUNCTION public.count_active_accounts(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.accounts
  WHERE user_id = p_user_id 
    AND status = 'active';
  
  RETURN v_count;
END;
$$;