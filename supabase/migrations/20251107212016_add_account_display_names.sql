/*
  # Add Display Names for Account Optimization

  ## Overview
  This migration adds a `display_name` column to the accounts table for shortened,
  user-friendly account names that display well in the UI.

  ## Changes Made

  ### 1. Add display_name Column
  - Adds optional `display_name` VARCHAR(30) field to accounts table
  - Allows NULL values so existing accounts aren't affected
  - Creates index for faster lookups

  ### 2. Update Existing Accounts with Optimized Names
  - Sets shortened display names for all existing demo accounts
  - Uses concise, readable names (4-10 characters)
  - Follows consistent naming convention

  ### 3. Naming Convention
  - Cash accounts: "Cash", "Savings", "Trading"
  - Equity accounts: "Stocks", "Growth", "Dividends", "Income"
  - Crypto accounts: "Crypto", "Bitcoin", "Altcoins"
  - Other: "Retirement", "Margin"

  ## Security
  - No changes to RLS policies (inherited from accounts table)
  - Display names are optional and don't affect core functionality
*/

-- =====================================================
-- 1. Add display_name Column to Accounts Table
-- =====================================================

ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(30);

-- Add comment to column
COMMENT ON COLUMN public.accounts.display_name IS 'Shortened display name for UI (optional, max 30 chars)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_display_name 
ON public.accounts(display_name) 
WHERE display_name IS NOT NULL;

-- =====================================================
-- 2. Update Existing Demo Accounts with Display Names
-- =====================================================

-- Update accounts with optimized display names based on account type and current name
DO $$
BEGIN
  -- Amanda Taylor's accounts
  UPDATE public.accounts
  SET display_name = 'Stocks'
  WHERE account_type = 'equity_trading' 
    AND name = 'Growth Stock Portfolio'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'amanda.taylor@demo.com');

  UPDATE public.accounts
  SET display_name = 'Dividends'
  WHERE account_type = 'dividend_income' 
    AND name = 'Dividend Income Fund'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'amanda.taylor@demo.com');

  UPDATE public.accounts
  SET display_name = 'Crypto'
  WHERE account_type = 'crypto_portfolio' 
    AND name = 'Crypto Holdings'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'amanda.taylor@demo.com');

  UPDATE public.accounts
  SET display_name = 'Cash'
  WHERE account_type = 'primary_cash' 
    AND name = 'Primary Cash Account'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'amanda.taylor@demo.com');

  -- Sarah Johnson's accounts
  UPDATE public.accounts
  SET display_name = 'Cash'
  WHERE account_type = 'primary_cash' 
    AND name = 'Main Checking'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'sarah.johnson@demo.com');

  UPDATE public.accounts
  SET display_name = 'Savings'
  WHERE account_type = 'savings_cash' 
    AND name = 'Emergency Fund'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'sarah.johnson@demo.com');

  UPDATE public.accounts
  SET display_name = 'Stocks'
  WHERE account_type = 'equity_trading' 
    AND name = 'Balanced Portfolio'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'sarah.johnson@demo.com');

  -- Michael Chen's accounts
  UPDATE public.accounts
  SET display_name = 'Cash'
  WHERE account_type = 'primary_cash' 
    AND name = 'Operating Cash'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'michael.chen@demo.com');

  UPDATE public.accounts
  SET display_name = 'Crypto'
  WHERE account_type = 'crypto_portfolio' 
    AND name = 'Main Crypto Portfolio'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'michael.chen@demo.com');

  UPDATE public.accounts
  SET display_name = 'Altcoins'
  WHERE account_type = 'crypto_portfolio' 
    AND name = 'Altcoin Portfolio'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'michael.chen@demo.com');

  UPDATE public.accounts
  SET display_name = 'Tech'
  WHERE account_type = 'equity_trading' 
    AND name = 'Tech Stocks'
    AND user_id IN (SELECT id FROM auth.users WHERE email = 'michael.chen@demo.com');

END $$;

-- =====================================================
-- 3. Create Helper Function to Generate Display Name
-- =====================================================

-- Function to auto-generate display name if not set
CREATE OR REPLACE FUNCTION public.generate_account_display_name(p_account_type TEXT, p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return shortened name based on account type
  CASE p_account_type
    WHEN 'primary_cash' THEN RETURN 'Cash';
    WHEN 'savings_cash' THEN RETURN 'Savings';
    WHEN 'trading_cash' THEN RETURN 'Trading';
    WHEN 'equity_trading' THEN RETURN 'Stocks';
    WHEN 'crypto_portfolio' THEN RETURN 'Crypto';
    WHEN 'dividend_income' THEN RETURN 'Dividends';
    WHEN 'retirement_fund' THEN RETURN 'Retirement';
    WHEN 'margin_trading' THEN RETURN 'Margin';
    -- Legacy types
    WHEN 'demo_cash' THEN RETURN 'Cash';
    WHEN 'demo_equity' THEN RETURN 'Stocks';
    WHEN 'demo_crypto' THEN RETURN 'Crypto';
    WHEN 'live_cash' THEN RETURN 'Cash';
    WHEN 'live_equity' THEN RETURN 'Stocks';
    ELSE 
      -- Fallback: use first 20 chars of name
      RETURN SUBSTRING(p_name, 1, 20);
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.generate_account_display_name IS 'Auto-generates a shortened display name based on account type';
