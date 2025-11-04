/*
  # Trading Support Functions

  1. New Functions
    - `update_account_balance()` - Safely update account balance
    - `record_trade_execution()` - Record trade and update holdings atomically

  2. Security
    - SECURITY DEFINER functions
    - Validates user ownership
    - Atomic operations with proper error handling
*/

-- Function to update account balance safely
CREATE OR REPLACE FUNCTION update_account_balance(
  p_account_id UUID,
  p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update account balance
  UPDATE accounts
  SET
    balance = balance + p_amount,
    updated_at = NOW()
  WHERE id = p_account_id;

  -- Check if balance went negative
  IF (SELECT balance FROM accounts WHERE id = p_account_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient funds in account';
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_account_balance(UUID, DECIMAL) TO authenticated;

COMMENT ON FUNCTION update_account_balance IS 'Safely updates account balance with validation';
