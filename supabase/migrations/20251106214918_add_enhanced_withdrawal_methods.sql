/*
  # Enhanced Withdrawal Methods System

  1. Changes
    - Expand withdrawal methods to include modern payment options
    - Add support for: ACH, PayPal, Venmo, Crypto, Debit Card
    - Add new optional fields for different withdrawal types
    - Update validation constraints

  2. New Fields in withdrawals table
    - `email` (text, optional) - For PayPal and Venmo withdrawals
    - `crypto_address` (text, optional) - For cryptocurrency withdrawals
    - `crypto_currency` (text, optional) - BTC, ETH, USDT, USDC
    - `crypto_network` (text, optional) - Network details for crypto
    - `card_last4` (text, optional) - For debit card withdrawals

  3. Updated Constraints
    - Expand method CHECK constraint to include new options
    - Make bank_name and account_number_last4 optional (not all methods need them)

  4. Security
    - All existing RLS policies remain unchanged
    - New fields are protected by same user ownership policies

  5. Important Notes
    - ACH: Same as bank_transfer but typically faster (next-day vs 2-3 days)
    - PayPal/Venmo: Requires verified email, instant withdrawal
    - Crypto: Requires wallet address validation, irreversible
    - Debit Card: Instant, limited to $10,000, higher fees
*/

-- Add new columns to withdrawals table
DO $$
BEGIN
  -- Email for PayPal/Venmo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'email'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN email text;
  END IF;

  -- Crypto address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'crypto_address'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN crypto_address text;
  END IF;

  -- Crypto currency type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'crypto_currency'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN crypto_currency text;
  END IF;

  -- Crypto network
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'crypto_network'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN crypto_network text;
  END IF;

  -- Card last 4 digits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'card_last4'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN card_last4 text;
  END IF;
END $$;

-- Drop the old method constraint
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_method_check;

-- Add new method constraint with expanded options
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_method_check 
  CHECK (method IN ('bank_transfer', 'wire', 'check', 'ach', 'paypal', 'venmo', 'crypto', 'debit_card'));

-- Make bank_name and account_number_last4 nullable (they're not required for all methods)
ALTER TABLE withdrawals ALTER COLUMN bank_name DROP NOT NULL;
ALTER TABLE withdrawals ALTER COLUMN account_number_last4 DROP NOT NULL;

-- Add constraint to ensure crypto withdrawals have required fields
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_crypto_fields_check;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_crypto_fields_check
  CHECK (
    method != 'crypto' OR (
      crypto_address IS NOT NULL AND 
      crypto_currency IS NOT NULL AND
      crypto_currency IN ('BTC', 'ETH', 'USDT', 'USDC')
    )
  );

-- Add constraint to ensure PayPal/Venmo withdrawals have email
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_email_check;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_email_check
  CHECK (
    (method NOT IN ('paypal', 'venmo')) OR 
    (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
  );

-- Add constraint to ensure traditional banking methods have required fields
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_bank_fields_check;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_bank_fields_check
  CHECK (
    (method NOT IN ('bank_transfer', 'wire', 'check', 'ach')) OR 
    (bank_name IS NOT NULL AND account_number_last4 IS NOT NULL)
  );

-- Add constraint to ensure debit card withdrawals have card info
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_card_check;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_card_check
  CHECK (
    method != 'debit_card' OR card_last4 IS NOT NULL
  );

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_withdrawals_email ON withdrawals(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_withdrawals_crypto_address ON withdrawals(crypto_address) WHERE crypto_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_withdrawals_crypto_currency ON withdrawals(crypto_currency) WHERE crypto_currency IS NOT NULL;

-- Add comment explaining the withdrawal methods
COMMENT ON COLUMN withdrawals.method IS 'Withdrawal method: bank_transfer (2-3 days, free), wire (same day, $25), check (5-7 days, free), ach (next day, free), paypal (instant, 1% fee), venmo (instant, 1% fee), crypto (15-60 min, network fees), debit_card (instant, 2.9% fee, max $10k)';

-- Update the deposits table to include crypto and cash_courier if not already present
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_method_check;
ALTER TABLE deposits ADD CONSTRAINT deposits_method_check
  CHECK (method IN ('bank_transfer', 'wire', 'check', 'card', 'crypto', 'cash_courier'));
