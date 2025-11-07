/*
  # Create Unified Transactions Table

  ## Overview
  Creates a unified transactions table that consolidates all financial activities
  (deposits, withdrawals, transfers, and trades) into a single queryable history.

  ## New Tables
    - `transactions`: Unified history of all financial activities

  ## Security
    - Enable RLS on transactions table
    - Users can only view their own transactions
    - Admins can view all transactions

  ## Indexes
    - Optimized indexes for common query patterns
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'trade', 'fee', 'dividend', 'interest')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'processing')),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  symbol text,
  quantity numeric,
  price numeric,
  fee numeric NOT NULL DEFAULT 0,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  related_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol) WHERE symbol IS NOT NULL;

-- RLS Policies
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Backfill existing data
DO $$
BEGIN
  -- Sync existing trades
  INSERT INTO transactions (
    user_id,
    account_id,
    transaction_type,
    status,
    amount,
    symbol,
    quantity,
    price,
    fee,
    description,
    metadata,
    created_at,
    completed_at
  )
  SELECT
    t.user_id,
    t.account_id,
    'trade',
    t.status,
    CASE
      WHEN t.trade_type = 'buy' THEN -(t.quantity * t.price + COALESCE(t.fee, 0))
      ELSE (t.quantity * t.price - COALESCE(t.fee, 0))
    END,
    t.symbol,
    t.quantity,
    t.price,
    COALESCE(t.fee, 0),
    UPPER(t.trade_type) || ' ' || t.quantity || ' ' || t.symbol || ' @ $' || t.price,
    jsonb_build_object(
      'trade_id', t.id,
      'trade_type', t.trade_type,
      'order_type', COALESCE(t.order_type, 'market')
    ),
    t.executed_at,
    CASE WHEN t.status = 'executed' THEN t.executed_at ELSE NULL END
  FROM trades t
  WHERE t.status = 'executed'
  ON CONFLICT DO NOTHING;

  -- Sync existing deposits
  INSERT INTO transactions (
    user_id,
    account_id,
    transaction_type,
    status,
    amount,
    currency,
    description,
    metadata,
    reference_id,
    created_at,
    completed_at
  )
  SELECT
    d.user_id,
    d.account_id,
    'deposit',
    d.status,
    d.amount,
    d.currency,
    'Deposit via ' || COALESCE(d.method, 'bank transfer'),
    jsonb_build_object('deposit_id', d.id, 'method', COALESCE(d.method, 'bank_transfer')),
    d.reference_number,
    d.created_at,
    d.completed_at
  FROM deposits d
  WHERE d.status = 'completed'
  ON CONFLICT DO NOTHING;

  -- Sync existing withdrawals
  INSERT INTO transactions (
    user_id,
    account_id,
    transaction_type,
    status,
    amount,
    currency,
    fee,
    description,
    metadata,
    reference_id,
    created_at,
    completed_at
  )
  SELECT
    w.user_id,
    w.account_id,
    'withdrawal',
    w.status,
    -w.amount,
    w.currency,
    COALESCE(w.network_fee, 0),
    'Withdrawal via ' || COALESCE(w.method, 'bank transfer'),
    jsonb_build_object('withdrawal_id', w.id, 'method', COALESCE(w.method, 'bank_transfer')),
    w.reference_number,
    w.created_at,
    w.released_at
  FROM withdrawals w
  WHERE w.status IN ('completed', 'approved')
  ON CONFLICT DO NOTHING;

  -- Sync existing transfers (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transfers') THEN
    INSERT INTO transactions (
      user_id,
      account_id,
      transaction_type,
      status,
      amount,
      currency,
      description,
      metadata,
      created_at,
      completed_at
    )
    SELECT
      tr.user_id,
      tr.from_account_id,
      'transfer',
      tr.status,
      -tr.amount,
      'USD',
      'Transfer to ' || (SELECT account_type FROM accounts WHERE id = tr.to_account_id),
      jsonb_build_object(
        'transfer_id', tr.id,
        'direction', 'out',
        'to_account_id', tr.to_account_id
      ),
      tr.created_at,
      tr.updated_at
    FROM transfers tr
    WHERE tr.status = 'completed'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
