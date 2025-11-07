/*
  # Portfolio Operation Functions

  ## Overview
  This migration creates the core business logic functions for portfolio operations:
  
  1. `create_pending_sell_order` - User submits sell order for admin approval
  2. `approve_sell_order` - Admin approves and executes sell order
  3. `reject_sell_order` - Admin rejects sell order
  4. `execute_instant_buy` - Execute instant buy order
  5. `get_user_portfolio_state` - Get complete portfolio state
  6. `cancel_pending_sell_order` - User cancels their own pending order

  ## Security
  All functions use SECURITY DEFINER with proper authentication checks.
  Functions validate user ownership and admin privileges where appropriate.
*/

-- =====================================================
-- FUNCTION: create_pending_sell_order
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
  
  IF v_holding.quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient holdings', 'available', v_holding.quantity);
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
    jsonb_build_object('order_type', 'pending_sell', 'estimated_price', p_estimated_price)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'estimated_total', v_estimated_total,
    'message', 'Sell order submitted for admin review'
  );
END;
$$;

COMMENT ON FUNCTION create_pending_sell_order IS 'Creates a pending sell order that requires admin approval';

-- =====================================================
-- FUNCTION: approve_sell_order
-- =====================================================
CREATE OR REPLACE FUNCTION approve_sell_order(
  p_order_id uuid,
  p_actual_price numeric,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_order record;
  v_actual_total numeric;
  v_new_balance numeric;
  v_trade_id uuid;
  v_holding record;
  v_new_quantity numeric;
  v_new_market_value numeric;
BEGIN
  -- Get authenticated admin user
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify admin privileges
  IF NOT is_admin(v_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges');
  END IF;

  -- Get order details
  SELECT * INTO v_order
  FROM pending_sell_orders
  WHERE id = p_order_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or already processed');
  END IF;

  -- Calculate actual total
  v_actual_total := v_order.quantity * p_actual_price;

  -- Get current holding
  SELECT * INTO v_holding
  FROM holdings
  WHERE account_id = v_order.account_id
    AND symbol = v_order.symbol
    AND asset_type = v_order.asset_type;
  
  IF NOT FOUND OR v_holding.quantity < v_order.quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient holdings to execute sell');
  END IF;

  -- Update account balance
  UPDATE accounts
  SET balance = balance + v_actual_total,
      updated_at = now()
  WHERE id = v_order.account_id
  RETURNING balance INTO v_new_balance;

  -- Update or delete holding
  v_new_quantity := v_holding.quantity - v_order.quantity;
  
  IF v_new_quantity > 0 THEN
    v_new_market_value := v_new_quantity * p_actual_price;
    UPDATE holdings
    SET quantity = v_new_quantity,
        market_value = v_new_market_value,
        current_price = p_actual_price,
        unrealized_pnl = v_new_market_value - (v_new_quantity * average_cost),
        unrealized_pnl_percent = CASE
          WHEN v_new_quantity * average_cost > 0
          THEN ((v_new_market_value - (v_new_quantity * average_cost)) / (v_new_quantity * average_cost)) * 100
          ELSE 0
        END,
        updated_at = now()
    WHERE id = v_holding.id;
  ELSE
    DELETE FROM holdings WHERE id = v_holding.id;
  END IF;

  -- Create trade record
  INSERT INTO trades (
    account_id,
    user_id,
    symbol,
    asset_type,
    trade_type,
    side,
    quantity,
    price,
    total_amount,
    fees,
    status
  ) VALUES (
    v_order.account_id,
    v_order.user_id,
    v_order.symbol,
    v_order.asset_type,
    'sell',
    'sell',
    v_order.quantity,
    p_actual_price,
    v_actual_total,
    0,
    'executed'
  )
  RETURNING id INTO v_trade_id;

  -- Update pending order
  UPDATE pending_sell_orders
  SET status = 'approved',
      approval_status = 'approved',
      actual_price = p_actual_price,
      actual_total = v_actual_total,
      reviewed_at = now(),
      reviewed_by = v_admin_id,
      executed_at = now(),
      admin_notes = p_admin_notes,
      updated_at = now()
  WHERE id = p_order_id;

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
    balance_after,
    related_order_id,
    metadata
  ) VALUES (
    v_order.user_id,
    v_order.account_id,
    'sell',
    'completed',
    v_actual_total,
    v_order.symbol,
    v_order.quantity,
    v_new_balance - v_actual_total,
    v_new_balance,
    p_order_id,
    jsonb_build_object(
      'order_type', 'approved_sell',
      'actual_price', p_actual_price,
      'trade_id', v_trade_id,
      'reviewed_by', v_admin_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'trade_id', v_trade_id,
    'actual_total', v_actual_total,
    'new_balance', v_new_balance,
    'message', 'Sell order approved and executed'
  );
END;
$$;

COMMENT ON FUNCTION approve_sell_order IS 'Admin function to approve and execute a pending sell order';

-- =====================================================
-- FUNCTION: reject_sell_order
-- =====================================================
CREATE OR REPLACE FUNCTION reject_sell_order(
  p_order_id uuid,
  p_rejection_reason text,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_order record;
BEGIN
  -- Get authenticated admin user
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify admin privileges
  IF NOT is_admin(v_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges');
  END IF;

  -- Get order details
  SELECT * INTO v_order
  FROM pending_sell_orders
  WHERE id = p_order_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or already processed');
  END IF;

  -- Update pending order
  UPDATE pending_sell_orders
  SET status = 'rejected',
      approval_status = 'rejected',
      reviewed_at = now(),
      reviewed_by = v_admin_id,
      rejection_reason = p_rejection_reason,
      admin_notes = p_admin_notes,
      updated_at = now()
  WHERE id = p_order_id;

  -- Create audit log
  INSERT INTO portfolio_operations_audit (
    user_id,
    account_id,
    operation_type,
    operation_status,
    amount,
    symbol,
    quantity,
    related_order_id,
    metadata
  ) VALUES (
    v_order.user_id,
    v_order.account_id,
    'sell',
    'cancelled',
    v_order.estimated_total,
    v_order.symbol,
    v_order.quantity,
    p_order_id,
    jsonb_build_object(
      'order_type', 'rejected_sell',
      'rejection_reason', p_rejection_reason,
      'reviewed_by', v_admin_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'message', 'Sell order rejected'
  );
END;
$$;

COMMENT ON FUNCTION reject_sell_order IS 'Admin function to reject a pending sell order';

-- =====================================================
-- FUNCTION: execute_instant_buy
-- =====================================================
CREATE OR REPLACE FUNCTION execute_instant_buy(
  p_account_id uuid,
  p_symbol text,
  p_asset_type text,
  p_quantity numeric,
  p_price numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_total_cost numeric;
  v_account_balance numeric;
  v_new_balance numeric;
  v_trade_id uuid;
  v_holding record;
  v_new_quantity numeric;
  v_new_average_cost numeric;
  v_new_market_value numeric;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Calculate total cost
  v_total_cost := p_quantity * p_price;

  -- Validate account and balance
  SELECT balance INTO v_account_balance
  FROM accounts
  WHERE id = p_account_id AND user_id = v_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account not found or inactive');
  END IF;
  
  IF v_account_balance < v_total_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'required', v_total_cost,
      'available', v_account_balance
    );
  END IF;

  -- Update account balance
  UPDATE accounts
  SET balance = balance - v_total_cost,
      updated_at = now()
  WHERE id = p_account_id
  RETURNING balance INTO v_new_balance;

  -- Create trade record
  INSERT INTO trades (
    account_id,
    user_id,
    symbol,
    asset_type,
    trade_type,
    side,
    quantity,
    price,
    total_amount,
    fees,
    status
  ) VALUES (
    p_account_id,
    v_user_id,
    p_symbol,
    p_asset_type,
    'buy',
    'buy',
    p_quantity,
    p_price,
    v_total_cost,
    0,
    'executed'
  )
  RETURNING id INTO v_trade_id;

  -- Update or create holding
  SELECT * INTO v_holding
  FROM holdings
  WHERE account_id = p_account_id
    AND symbol = p_symbol
    AND asset_type = p_asset_type;
  
  IF FOUND THEN
    -- Update existing holding
    v_new_quantity := v_holding.quantity + p_quantity;
    v_new_average_cost := ((v_holding.quantity * v_holding.average_cost) + v_total_cost) / v_new_quantity;
    v_new_market_value := v_new_quantity * p_price;
    
    UPDATE holdings
    SET quantity = v_new_quantity,
        average_cost = v_new_average_cost,
        current_price = p_price,
        market_value = v_new_market_value,
        unrealized_pnl = v_new_market_value - (v_new_quantity * v_new_average_cost),
        unrealized_pnl_percent = CASE
          WHEN v_new_quantity * v_new_average_cost > 0
          THEN ((v_new_market_value - (v_new_quantity * v_new_average_cost)) / (v_new_quantity * v_new_average_cost)) * 100
          ELSE 0
        END,
        updated_at = now()
    WHERE id = v_holding.id;
  ELSE
    -- Create new holding
    v_new_market_value := p_quantity * p_price;
    
    INSERT INTO holdings (
      account_id,
      user_id,
      symbol,
      asset_type,
      quantity,
      average_cost,
      current_price,
      market_value,
      unrealized_pnl,
      unrealized_pnl_percent
    ) VALUES (
      p_account_id,
      v_user_id,
      p_symbol,
      p_asset_type,
      p_quantity,
      p_price,
      p_price,
      v_new_market_value,
      0,
      0
    );
  END IF;

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
    balance_after,
    related_order_id,
    metadata
  ) VALUES (
    v_user_id,
    p_account_id,
    'buy',
    'completed',
    v_total_cost,
    p_symbol,
    p_quantity,
    v_account_balance,
    v_new_balance,
    v_trade_id,
    jsonb_build_object('order_type', 'instant_buy', 'price', p_price, 'trade_id', v_trade_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'trade_id', v_trade_id,
    'total_cost', v_total_cost,
    'new_balance', v_new_balance,
    'message', 'Buy order executed successfully'
  );
END;
$$;

COMMENT ON FUNCTION execute_instant_buy IS 'Executes an instant buy order with balance validation and holdings update';

-- =====================================================
-- FUNCTION: cancel_pending_sell_order
-- =====================================================
CREATE OR REPLACE FUNCTION cancel_pending_sell_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get order and verify ownership
  SELECT * INTO v_order
  FROM pending_sell_orders
  WHERE id = p_order_id AND user_id = v_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or cannot be cancelled');
  END IF;

  -- Update order status
  UPDATE pending_sell_orders
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_order_id;

  -- Create audit log
  INSERT INTO portfolio_operations_audit (
    user_id,
    account_id,
    operation_type,
    operation_status,
    amount,
    symbol,
    quantity,
    related_order_id,
    metadata
  ) VALUES (
    v_user_id,
    v_order.account_id,
    'sell',
    'cancelled',
    v_order.estimated_total,
    v_order.symbol,
    v_order.quantity,
    p_order_id,
    jsonb_build_object('order_type', 'user_cancelled', 'cancelled_by', v_user_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'message', 'Sell order cancelled successfully'
  );
END;
$$;

COMMENT ON FUNCTION cancel_pending_sell_order IS 'User function to cancel their own pending sell order';

-- =====================================================
-- FUNCTION: get_user_portfolio_state
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_portfolio_state(p_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_account record;
  v_holdings jsonb;
  v_total_holdings_value numeric;
  v_total_pnl numeric;
  v_pending_orders jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get account
  SELECT * INTO v_account
  FROM accounts
  WHERE id = p_account_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account not found');
  END IF;

  -- Get holdings
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', h.id,
      'symbol', h.symbol,
      'asset_type', h.asset_type,
      'quantity', h.quantity,
      'average_cost', h.average_cost,
      'current_price', h.current_price,
      'market_value', h.market_value,
      'unrealized_pnl', h.unrealized_pnl,
      'unrealized_pnl_percent', h.unrealized_pnl_percent
    )
  ), '[]'::jsonb) INTO v_holdings
  FROM holdings h
  WHERE h.account_id = p_account_id;

  -- Calculate totals
  SELECT
    COALESCE(SUM(market_value), 0),
    COALESCE(SUM(unrealized_pnl), 0)
  INTO v_total_holdings_value, v_total_pnl
  FROM holdings
  WHERE account_id = p_account_id;

  -- Get pending orders
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'symbol', o.symbol,
      'quantity', o.quantity,
      'estimated_price', o.estimated_price,
      'estimated_total', o.estimated_total,
      'status', o.status,
      'submitted_at', o.submitted_at
    )
  ), '[]'::jsonb) INTO v_pending_orders
  FROM pending_sell_orders o
  WHERE o.account_id = p_account_id AND o.status = 'pending';

  RETURN jsonb_build_object(
    'success', true,
    'account', jsonb_build_object(
      'id', v_account.id,
      'name', v_account.name,
      'balance', v_account.balance,
      'currency', v_account.currency
    ),
    'holdings', v_holdings,
    'total_holdings_value', v_total_holdings_value,
    'total_portfolio_value', v_account.balance + v_total_holdings_value,
    'total_pnl', v_total_pnl,
    'pending_orders', v_pending_orders
  );
END;
$$;

COMMENT ON FUNCTION get_user_portfolio_state IS 'Returns complete portfolio state including account, holdings, and pending orders';
