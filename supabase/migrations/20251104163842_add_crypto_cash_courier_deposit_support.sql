/*
  # Add Crypto and Cash Courier Deposit Support
  
  1. **Updates to deposits table**
     - Add crypto_currency column for cryptocurrency type (BTC, ETH, USDT, etc.)
     - Add deposit_address column for crypto wallet address
     - Add tx_hash column for blockchain transaction hash
     - Add confirmations column for blockchain confirmations
     - Add required_confirmations column
     - Add courier_service column for cash courier provider
     - Add pickup_address column for cash courier pickup location
     - Add pickup_time column for scheduled pickup time
     - Add tracking_number column for courier tracking
     - Add method column if not exists
  
  2. **Updates to withdrawals table**
     - Add crypto_destination column for withdrawal address
     - Add crypto_currency column for cryptocurrency type
     - Add method column if not exists
  
  3. **Security**
     - Maintains existing RLS policies
     - Adds validation constraints where appropriate
*/

-- Add new columns to deposits table
DO $$ 
BEGIN
  -- Crypto-related columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'crypto_currency') THEN
    ALTER TABLE deposits ADD COLUMN crypto_currency TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'deposit_address') THEN
    ALTER TABLE deposits ADD COLUMN deposit_address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'tx_hash') THEN
    ALTER TABLE deposits ADD COLUMN tx_hash TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'confirmations') THEN
    ALTER TABLE deposits ADD COLUMN confirmations INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'required_confirmations') THEN
    ALTER TABLE deposits ADD COLUMN required_confirmations INT;
  END IF;

  -- Cash courier-related columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'courier_service') THEN
    ALTER TABLE deposits ADD COLUMN courier_service TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'pickup_address') THEN
    ALTER TABLE deposits ADD COLUMN pickup_address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'pickup_time') THEN
    ALTER TABLE deposits ADD COLUMN pickup_time TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'tracking_number') THEN
    ALTER TABLE deposits ADD COLUMN tracking_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'insurance_amount') THEN
    ALTER TABLE deposits ADD COLUMN insurance_amount NUMERIC;
  END IF;

  -- Method column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'method') THEN
    ALTER TABLE deposits ADD COLUMN method TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'reference_number') THEN
    ALTER TABLE deposits ADD COLUMN reference_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'bank_name') THEN
    ALTER TABLE deposits ADD COLUMN bank_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'account_number_last4') THEN
    ALTER TABLE deposits ADD COLUMN account_number_last4 TEXT;
  END IF;
END $$;

-- Update deposits table to use 'method' instead of 'payment_method' if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'payment_method') THEN
    -- Copy data from payment_method to method if method is empty
    UPDATE deposits SET method = payment_method WHERE method IS NULL;
  END IF;
END $$;

-- Add new columns to withdrawals table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'crypto_destination') THEN
    ALTER TABLE withdrawals ADD COLUMN crypto_destination TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'crypto_currency') THEN
    ALTER TABLE withdrawals ADD COLUMN crypto_currency TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'method') THEN
    ALTER TABLE withdrawals ADD COLUMN method TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'reference_number') THEN
    ALTER TABLE withdrawals ADD COLUMN reference_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'bank_name') THEN
    ALTER TABLE withdrawals ADD COLUMN bank_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'account_number_last4') THEN
    ALTER TABLE withdrawals ADD COLUMN account_number_last4 TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'routing_number') THEN
    ALTER TABLE withdrawals ADD COLUMN routing_number TEXT;
  END IF;
END $$;

-- Add constraints for valid deposit methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_deposit_method'
  ) THEN
    ALTER TABLE deposits
    ADD CONSTRAINT valid_deposit_method
    CHECK (method IN (
      'bank_transfer',
      'wire',
      'check',
      'card',
      'crypto',
      'cash_courier'
    ));
  END IF;
END $$;

-- Add constraints for valid withdrawal methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_withdrawal_method'
  ) THEN
    ALTER TABLE withdrawals
    ADD CONSTRAINT valid_withdrawal_method
    CHECK (method IN (
      'bank_transfer',
      'wire',
      'check',
      'crypto'
    ));
  END IF;
END $$;

-- Create index for crypto transactions lookup
CREATE INDEX IF NOT EXISTS idx_deposits_tx_hash ON deposits(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deposits_crypto_currency ON deposits(crypto_currency) WHERE crypto_currency IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deposits_tracking_number ON deposits(tracking_number) WHERE tracking_number IS NOT NULL;
