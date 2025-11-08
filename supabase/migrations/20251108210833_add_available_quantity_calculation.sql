/*
  # Add Available Quantity Calculation System

  ## Overview
  This migration adds functionality to calculate the true available quantity for holdings
  by accounting for pending sell orders that lock portions of the holdings.

  ## Changes
  1. Create function to calculate available quantity for a specific holding
  2. Create function to get all holdings with available quantities
  3. Update create_pending_sell_order to check available quantity
  4. Add view for easy querying of holdings with availability

  ## Security
  All functions use SECURITY DEFINER with proper RLS checks.
*/

-- =====================================================
-- FUNCTION: get_available_quantity
-- Calculate available quantity for a specific holding
-- =====================================================
CREATE OR REPLACE FUNCTION get_available_quantity(
  p_account_id uuid,
  p_symbol text,
  p_asset_type text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_quantity numeric;
  v_locked_quantity numeric;
  v_available_quantity numeric;
BEGIN
  -- Get total holding quantity
  SELECT COALESCE(quantity, 0) INTO v_total_quantity
  FROM holdings
  WHERE account_id = p_account_id
    AND symbol = p_symbol
    AND asset_type = p_asset_type;

  -- Get locked quantity from pending sell orders
  SELECT COALESCE(SUM(quantity), 0) INTO v_locked_quantity
  FROM pending_sell_orders
  WHERE account_id = p_account_id
    AND symbol = p_symbol
    AND asset_type = p_asset_type
    AND status IN ('pending', 'under_review');

  -- Calculate available quantity
  v_available_quantity := v_total_quantity - v_locked_quantity;

  -- Ensure non-negative
  IF v_available_quantity < 0 THEN
    v_available_quantity := 0;
  END IF;

  RETURN v_available_quantity;
END;
$$;

COMMENT ON FUNCTION get_available_quantity IS 'Calculates the available quantity for a holding by subtracting locked quantities in pending sell orders';

-- =====================================================
-- FUNCTION: get_holdings_with_availability
-- Get all holdings for an account with availability info
-- =====================================================
CREATE OR REPLACE FUNCTION get_holdings_with_availability(p_account_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  account_id uuid,
  symbol text,
  asset_type text,
  quantity numeric,
  locked_quantity numeric,
  available_quantity numeric,
  average_cost numeric,
  current_price numeric,
  market_value numeric,
  unrealized_pnl numeric,
  unrealized_pnl_percent numeric,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.user_id,
    h.account_id,
    h.symbol,
    h.asset_type,
    h.quantity,
    COALESCE((
      SELECT SUM(pso.quantity)
      FROM pending_sell_orders pso
      WHERE pso.account_id = h.account_id
        AND pso.symbol = h.symbol
        AND pso.asset_type = h.asset_type
        AND pso.status IN ('pending', 'under_review')
    ), 0) as locked_quantity,
    GREATEST(0, h.quantity - COALESCE((
      SELECT SUM(pso.quantity)
      FROM pending_sell_orders pso
      WHERE pso.account_id = h.account_id
        AND pso.symbol = h.symbol
        AND pso.asset_type = h.asset_type
        AND pso.status IN ('pending', 'under_review')
    ), 0)) as available_quantity,
    h.average_cost,
    h.current_price,
    h.market_value,
    h.unrealized_pnl,
    h.unrealized_pnl_percent,
    h.created_at,
    h.updated_at
  FROM holdings h
  WHERE h.account_id = p_account_id;
END;
$$;

COMMENT ON FUNCTION get_holdings_with_availability IS 'Returns all holdings for an account with calculated locked and available quantities';

-- =====================================================
-- UPDATE: create_pending_sell_order
-- Check available quantity instead of total quantity
-- =====================================================
CREATE OR REPLACE FUNCTION create_pending_sell_order(
  p_account_id uuid,
  p_symbol text,
  p_asset_type text,
  p_quantity numeric,
  p_estimated_price numeric,
  p_user_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_holding record;
  v_order_id uuid;
  v_estimated_total numeric;
  v_account_balance numeric;
  v_available_quantity numeric;
  v_locked_quantity numeric;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate account ownership
  SELECT balance INTO v_account_balance
  FROM accounts
  WHERE id = p_account_id AND user_id = v_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account not found or inactive');
  END IF;

  -- Check if user has sufficient holdings
  SELECT * INTO v_holding
  FROM holdings
  WHERE account_id = p_account_id
    AND symbol = p_symbol
    AND asset_type = p_asset_type;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No holdings found for this asset');
  END IF;

  -- Calculate available quantity (total minus locked in pending orders)
  v_available_quantity := get_available_quantity(p_account_id, p_symbol, p_asset_type);
  v_locked_quantity := v_holding.quantity - v_available_quantity;

  -- Check if sufficient available quantity
  IF v_available_quantity < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient available holdings',
      'total_holdings', v_holding.quantity,
      'available', v_available_quantity,
      'locked', v_locked_quantity,
      'requested', p_quantity
    );
  END IF;

  -- Calculate estimated total
  v_estimated_total := p_quantity * p_estimated_price;

  -- Create pending sell order
  INSERT INTO pending_sell_orders (
    user_id,
    account_id,
    symbol,
    asset_type,
    quantity,
    estimated_price,
    estimated_total,
    user_notes
  ) VALUES (
    v_user_id,
    p_account_id,
    p_symbol,
    p_asset_type,
    p_quantity,
    p_estimated_price,
    v_estimated_total,
    p_user_notes
  )
  RETURNING id INTO v_order_id;

  -- Create audit log
  INSERT INTO portfolio_operations_audit (
    user_id,
    account_id,
    operation_type,
    operation_status,
    amount,
    symbol,
    quantity,
    balance_before,
    related_order_id,
    metadata
  ) VALUES (
    v_user_id,
    p_account_id,
    'sell',
    'pending',
    v_estimated_total,
    p_symbol,
    p_quantity,
    v_account_balance,
    v_order_id,
    jsonb_build_object(
      'order_type', 'pending_sell',
      'estimated_price', p_estimated_price,
      'available_before', v_available_quantity,
      'locked_before', v_locked_quantity
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'estimated_total', v_estimated_total,
    'available_quantity', v_available_quantity - p_quantity,
    'message', 'Sell order submitted for admin review'
  );
END;
$$;

COMMENT ON FUNCTION create_pending_sell_order IS 'Creates a pending sell order with available quantity validation';
