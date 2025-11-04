/*
  # Create Complete Transfers System
  
  1. **New Tables**
     - `transfers` - Account-to-account transfers with full audit trail
  
  2. **Key Features**
     - Reference number generation for tracking
     - Status tracking (instant completion by default)
     - Prevents transfers to same account
     - Atomic balance updates
     - Complete audit trail
  
  3. **Security**
     - RLS enabled with user-specific policies
     - Validates both accounts belong to user
     - Checks sufficient balance
     - Atomic transaction handling
  
  4. **Functions**
     - `execute_transfer()` - Handles complete transfer flow atomically
     - `get_transfer_history()` - Retrieves user transfer history
*/

-- Create transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_number text UNIQUE NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_accounts CHECK (from_account_id != to_account_id)
);

-- Enable RLS
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transfers"
  ON transfers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transfers"
  ON transfers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_reference ON transfers(reference_number);

-- Function to execute transfer atomically
CREATE OR REPLACE FUNCTION execute_transfer(
  p_user_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_from_balance numeric;
  v_reference_number text;
  v_transfer_id uuid;
BEGIN
  -- Validate accounts are different
  IF p_from_account_id = p_to_account_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot transfer to the same account'
    );
  END IF;

  -- Validate both accounts belong to user
  IF NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = p_from_account_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Source account not found or does not belong to user'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = p_to_account_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Destination account not found or does not belong to user'
    );
  END IF;

  -- Check sufficient balance (with row lock)
  SELECT balance INTO v_from_balance
  FROM accounts
  WHERE id = p_from_account_id
  FOR UPDATE;

  IF v_from_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds in source account'
    );
  END IF;

  -- Generate reference number
  v_reference_number := 'TXF-' || 
    upper(substring(md5(random()::text) from 1 for 8)) || '-' ||
    to_char(now(), 'YYYYMMDD');

  -- Create transfer record
  INSERT INTO transfers (
    user_id,
    from_account_id,
    to_account_id,
    amount,
    status,
    reference_number,
    notes
  )
  VALUES (
    p_user_id,
    p_from_account_id,
    p_to_account_id,
    p_amount,
    'completed',
    v_reference_number,
    p_notes
  )
  RETURNING id INTO v_transfer_id;

  -- Update account balances atomically
  UPDATE accounts
  SET 
    balance = balance - p_amount,
    updated_at = now()
  WHERE id = p_from_account_id;

  UPDATE accounts
  SET 
    balance = balance + p_amount,
    updated_at = now()
  WHERE id = p_to_account_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'reference_number', v_reference_number,
    'message', 'Transfer completed successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to get transfer history with account names
CREATE OR REPLACE FUNCTION get_transfer_history(
  p_user_id uuid,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  from_account_id uuid,
  from_account_name text,
  to_account_id uuid,
  to_account_name text,
  amount numeric,
  status text,
  reference_number text,
  notes text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    t.id,
    t.from_account_id,
    fa.name AS from_account_name,
    t.to_account_id,
    ta.name AS to_account_name,
    t.amount,
    t.status,
    t.reference_number,
    t.notes,
    t.created_at
  FROM transfers t
  LEFT JOIN accounts fa ON t.from_account_id = fa.id
  LEFT JOIN accounts ta ON t.to_account_id = ta.id
  WHERE t.user_id = p_user_id
  ORDER BY t.created_at DESC
  LIMIT p_limit;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_transfers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transfers_updated_at ON transfers;
CREATE TRIGGER transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_transfers_updated_at();
