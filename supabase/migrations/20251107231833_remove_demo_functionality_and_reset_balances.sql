/*
  # Remove Demo Functionality and Reset Balances to $0.00

  This migration removes all demo-related functionality from the system and ensures
  that new user accounts start with $0.00 balance.

  ## Changes Made

  1. **Trigger and Function Removal**
     - Drop `on_auth_user_created_account` trigger that auto-creates accounts with $100,000
     - Drop `handle_new_user_account()` function that inserts demo accounts

  2. **Account Type Cleanup**
     - Remove all account types with "demo" prefix
     - Update existing accounts with demo types to standard types

  3. **Balance Reset**
     - Reset all accounts with exactly $100,000.00 balance to $0.00
     - Reset all accounts with demo account types to $0.00
     - Create audit trail of all balance resets

  4. **Data Integrity**
     - Add constraint to prevent accounts from being created with balance > 0
     - Update default balance for accounts table to 0.00

  ## Security Notes

  - All balance modifications are logged in portfolio_operation_audit table
  - RLS policies remain in place to protect user data
  - Admin approval required for deposits (existing workflow)
*/

-- =====================================================
-- STEP 1: Drop Automatic Account Creation Trigger
-- =====================================================

-- Drop the trigger that creates accounts automatically on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_account ON auth.users;

-- Drop the function that inserts demo accounts with $100,000 balance
DROP FUNCTION IF EXISTS public.handle_new_user_account();

-- =====================================================
-- STEP 2: Create Audit Log for Balance Resets
-- =====================================================

-- Log all accounts that will be reset (for audit trail)
INSERT INTO public.portfolio_operation_audit (
  user_id,
  account_id,
  operation_type,
  operation_status,
  amount,
  currency,
  balance_before,
  balance_after,
  metadata
)
SELECT
  user_id,
  id as account_id,
  'balance_adjustment',
  'completed',
  balance * -1 as amount,
  currency,
  balance as balance_before,
  0.00 as balance_after,
  jsonb_build_object(
    'reason', 'Demo functionality removal - reset to zero',
    'original_account_type', account_type,
    'migration_timestamp', NOW()
  ) as metadata
FROM public.accounts
WHERE
  (balance = 100000.00 OR account_type LIKE 'demo_%')
  AND balance > 0;

-- =====================================================
-- STEP 3: Reset All Demo Account Balances to $0.00
-- =====================================================

-- Reset accounts with exactly $100,000.00 (likely auto-assigned demo balances)
UPDATE public.accounts
SET
  balance = 0.00,
  updated_at = NOW()
WHERE balance = 100000.00;

-- Reset all accounts with demo account types
UPDATE public.accounts
SET
  balance = 0.00,
  updated_at = NOW()
WHERE account_type LIKE 'demo_%' AND balance > 0;

-- =====================================================
-- STEP 4: Update Demo Account Types to Standard Types
-- =====================================================

-- Convert demo_cash to cash
UPDATE public.accounts
SET
  account_type = 'cash',
  updated_at = NOW()
WHERE account_type = 'demo_cash';

-- Convert demo_crypto to crypto (if exists)
UPDATE public.accounts
SET
  account_type = 'crypto',
  updated_at = NOW()
WHERE account_type = 'demo_crypto';

-- Convert demo_equity to equity (if exists)
UPDATE public.accounts
SET
  account_type = 'equity',
  updated_at = NOW()
WHERE account_type = 'demo_equity';

-- =====================================================
-- STEP 5: Remove Demo Account Types from account_types Table
-- =====================================================

-- Deactivate demo account types if they exist in account_types table
UPDATE public.account_types
SET
  is_active = false,
  updated_at = NOW()
WHERE id LIKE 'demo_%';

-- Or delete them entirely if the table exists
DELETE FROM public.account_types
WHERE id LIKE 'demo_%';

-- =====================================================
-- STEP 6: Add Database Constraints for Future Protection
-- =====================================================

-- Add check constraint to prevent accounts from being created with balance > 0
-- This ensures all new accounts start at $0.00
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'accounts_initial_balance_zero'
  ) THEN
    ALTER TABLE public.accounts
    ADD CONSTRAINT accounts_initial_balance_zero
    CHECK (
      (created_at = updated_at AND balance = 0) OR
      (created_at < updated_at)
    );
  END IF;
END $$;

-- =====================================================
-- STEP 7: Update Accounts Table Default Balance
-- =====================================================

-- Set default balance to 0.00 for future inserts
ALTER TABLE public.accounts
ALTER COLUMN balance SET DEFAULT 0.00;

-- =====================================================
-- STEP 8: Create Function to Validate Account Creation
-- =====================================================

-- Create function to ensure accounts are created with zero balance
CREATE OR REPLACE FUNCTION public.validate_account_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure new accounts always start with $0.00 balance
  IF NEW.balance <> 0 THEN
    RAISE EXCEPTION 'New accounts must be created with $0.00 balance. Use deposit workflow to add funds.';
  END IF;

  -- Prevent demo account types
  IF NEW.account_type LIKE 'demo_%' THEN
    RAISE EXCEPTION 'Demo account types are not allowed. Use standard account types (cash, equity, crypto).';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to validate account creation
DROP TRIGGER IF EXISTS validate_account_creation_trigger ON public.accounts;
CREATE TRIGGER validate_account_creation_trigger
  BEFORE INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_account_creation();

-- =====================================================
-- STEP 9: Add Notification for Affected Users
-- =====================================================

-- Notify users whose accounts were reset (if notifications table exists)
DO $$
DECLARE
  affected_user RECORD;
BEGIN
  FOR affected_user IN
    SELECT DISTINCT user_id
    FROM public.accounts
    WHERE balance = 0.00
    AND (account_type = 'cash' OR account_type = 'equity' OR account_type = 'crypto')
    AND updated_at > NOW() - INTERVAL '1 minute'
  LOOP
    -- Insert notification if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
      INSERT INTO public.notifications (
        user_id,
        notification_type,
        title,
        message,
        is_read,
        created_at
      ) VALUES (
        affected_user.user_id,
        'system_update',
        'Account Balance Update',
        'Your account balances have been reset as part of our transition from demo mode to live trading. Please use the deposit feature to add funds to your account. All deposits require admin approval before being credited.',
        false,
        NOW()
      );
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- VERIFICATION QUERIES (for manual checking)
-- =====================================================

-- Count accounts with non-zero balances
-- SELECT COUNT(*) as accounts_with_balance, SUM(balance) as total_balance
-- FROM public.accounts
-- WHERE balance > 0;

-- Count accounts by type
-- SELECT account_type, COUNT(*) as count, SUM(balance) as total_balance
-- FROM public.accounts
-- GROUP BY account_type
-- ORDER BY count DESC;

-- Check for any remaining demo account types
-- SELECT COUNT(*) as demo_accounts
-- FROM public.accounts
-- WHERE account_type LIKE 'demo_%';

-- =====================================================
-- SUMMARY
-- =====================================================

-- Log completion message
DO $$
BEGIN
  RAISE NOTICE 'Demo functionality removal complete:';
  RAISE NOTICE '- Automatic account creation trigger removed';
  RAISE NOTICE '- All demo account balances reset to $0.00';
  RAISE NOTICE '- Demo account types converted to standard types';
  RAISE NOTICE '- Protection constraint added to prevent future demo accounts';
  RAISE NOTICE '- All new accounts will start with $0.00 balance';
  RAISE NOTICE '- Users must use deposit workflow (with admin approval) to add funds';
END $$;
