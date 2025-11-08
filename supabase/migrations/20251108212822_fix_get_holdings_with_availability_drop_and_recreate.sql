/*
  # Fix get_holdings_with_availability Function

  ## Issue
  The function references h.created_at column which doesn't exist in the holdings table.
  The holdings table only has updated_at column.

  ## Changes
  - Drop the existing function
  - Recreate without created_at in return table definition
  - Remove h.created_at from the SELECT query
  - Keep updated_at as it exists in the table

  ## Impact
  This fixes the error preventing holdings from being displayed in the portfolio view.
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_holdings_with_availability(uuid);

-- =====================================================
-- FUNCTION: get_holdings_with_availability (FIXED)
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
    h.updated_at
  FROM holdings h
  WHERE h.account_id = p_account_id;
END;
$$;

COMMENT ON FUNCTION get_holdings_with_availability IS 'Returns all holdings for an account with calculated locked and available quantities (fixed to remove non-existent created_at column)';
