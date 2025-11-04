/*
  # Deposits & Withdrawals System

  1. New Tables
    - `deposits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `account_id` (uuid, references accounts)
      - `amount` (numeric)
      - `method` (text) - 'bank_transfer', 'wire', 'check', 'card'
      - `status` (text) - 'pending', 'processing', 'completed', 'failed', 'cancelled'
      - `reference_number` (text)
      - `bank_name` (text, optional)
      - `account_number_last4` (text, optional)
      - `notes` (text, optional)
      - `processed_at` (timestamptz, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `withdrawals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `account_id` (uuid, references accounts)
      - `amount` (numeric)
      - `method` (text) - 'bank_transfer', 'wire', 'check'
      - `status` (text) - 'pending', 'processing', 'completed', 'failed', 'cancelled'
      - `reference_number` (text)
      - `bank_name` (text)
      - `account_number_last4` (text)
      - `routing_number` (text, optional)
      - `notes` (text, optional)
      - `processed_at` (timestamptz, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - View their own deposits/withdrawals
      - Create new deposits/withdrawals
      - Cannot modify or delete (audit trail)

  3. Functions
    - `process_deposit()` - Updates account balance when deposit is completed
    - `process_withdrawal()` - Updates account balance when withdrawal is completed
    - `cancel_withdrawal()` - Refunds account balance if withdrawal is cancelled

  4. Indexes
    - Index on user_id for both tables
    - Index on account_id for both tables
    - Index on status for both tables
    - Index on created_at for both tables
*/

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('bank_transfer', 'wire', 'check', 'card')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference_number text NOT NULL,
  bank_name text,
  account_number_last4 text,
  notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('bank_transfer', 'wire', 'check')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference_number text NOT NULL,
  bank_name text NOT NULL,
  account_number_last4 text NOT NULL,
  routing_number text,
  notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deposits
CREATE POLICY "Users can view own deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits"
  ON deposits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for withdrawals
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals"
  ON withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_account_id ON deposits(account_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_account_id ON withdrawals(account_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- Function to process a completed deposit
CREATE OR REPLACE FUNCTION process_deposit(p_deposit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit deposits;
BEGIN
  -- Get deposit details
  SELECT * INTO v_deposit FROM deposits WHERE id = p_deposit_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;

  IF v_deposit.status != 'pending' AND v_deposit.status != 'processing' THEN
    RAISE EXCEPTION 'Deposit cannot be processed in current status: %', v_deposit.status;
  END IF;

  -- Update account balance
  UPDATE accounts
  SET balance = balance + v_deposit.amount,
      updated_at = now()
  WHERE id = v_deposit.account_id;

  -- Update deposit status
  UPDATE deposits
  SET status = 'completed',
      processed_at = now(),
      updated_at = now()
  WHERE id = p_deposit_id;
END;
$$;

-- Function to process a completed withdrawal
CREATE OR REPLACE FUNCTION process_withdrawal(p_withdrawal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawals;
  v_current_balance numeric;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_withdrawal.status != 'pending' AND v_withdrawal.status != 'processing' THEN
    RAISE EXCEPTION 'Withdrawal cannot be processed in current status: %', v_withdrawal.status;
  END IF;

  -- Check account balance
  SELECT balance INTO v_current_balance FROM accounts WHERE id = v_withdrawal.account_id;

  IF v_current_balance < v_withdrawal.amount THEN
    -- Mark as failed
    UPDATE withdrawals
    SET status = 'failed',
        notes = COALESCE(notes || E'\n', '') || 'Insufficient funds',
        updated_at = now()
    WHERE id = p_withdrawal_id;
    RAISE EXCEPTION 'Insufficient funds for withdrawal';
  END IF;

  -- Update account balance
  UPDATE accounts
  SET balance = balance - v_withdrawal.amount,
      updated_at = now()
  WHERE id = v_withdrawal.account_id;

  -- Update withdrawal status
  UPDATE withdrawals
  SET status = 'completed',
      processed_at = now(),
      updated_at = now()
  WHERE id = p_withdrawal_id;
END;
$$;

-- Function to cancel a withdrawal and refund if already deducted
CREATE OR REPLACE FUNCTION cancel_withdrawal(p_withdrawal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawals;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_withdrawal.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot cancel completed withdrawal';
  END IF;

  IF v_withdrawal.status = 'cancelled' THEN
    RAISE EXCEPTION 'Withdrawal already cancelled';
  END IF;

  -- If withdrawal was processing, refund the amount
  IF v_withdrawal.status = 'processing' THEN
    UPDATE accounts
    SET balance = balance + v_withdrawal.amount,
        updated_at = now()
    WHERE id = v_withdrawal.account_id;
  END IF;

  -- Update withdrawal status
  UPDATE withdrawals
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_withdrawal_id;
END;
$$;

-- Add updated_at trigger for deposits
CREATE OR REPLACE FUNCTION update_deposits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deposits_updated_at
  BEFORE UPDATE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_deposits_updated_at();

-- Add updated_at trigger for withdrawals
CREATE OR REPLACE FUNCTION update_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_withdrawals_updated_at();
