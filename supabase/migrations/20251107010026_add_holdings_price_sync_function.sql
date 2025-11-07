/*
  # Add Holdings Price Sync Function
  
  1. New Function
    - `sync_holdings_prices_from_quotes()` - Automatically sync holdings prices from market_quotes table
    - Updates current_price, previous_close, and triggers recalculation of P&L
    - Returns the number of holdings updated
  
  2. Purpose
    - Ensure holdings always reflect latest market data
    - Automatically calculate day_change based on previous_close
    - Keep portfolio metrics up-to-date
*/

CREATE OR REPLACE FUNCTION sync_holdings_prices_from_quotes()
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER := 0;
  v_holding RECORD;
  v_quote RECORD;
BEGIN
  -- Loop through all holdings with positive quantities
  FOR v_holding IN 
    SELECT id, symbol, quantity, current_price 
    FROM holdings 
    WHERE quantity > 0
  LOOP
    -- Get latest quote for this symbol
    SELECT price, previous_close, updated_at
    INTO v_quote
    FROM market_quotes
    WHERE symbol = v_holding.symbol
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If we found a quote, update the holding
    IF FOUND THEN
      UPDATE holdings
      SET 
        current_price = v_quote.price,
        previous_close = COALESCE(v_quote.previous_close, current_price),
        last_price_update = v_quote.updated_at,
        updated_at = NOW()
      WHERE id = v_holding.id;
      
      v_updated := v_updated + 1;
    END IF;
  END LOOP;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Create a convenience function to sync prices for specific user
CREATE OR REPLACE FUNCTION sync_user_holdings_prices(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER := 0;
  v_holding RECORD;
  v_quote RECORD;
BEGIN
  -- Loop through user's holdings
  FOR v_holding IN 
    SELECT id, symbol, quantity, current_price 
    FROM holdings 
    WHERE user_id = p_user_id AND quantity > 0
  LOOP
    -- Get latest quote for this symbol
    SELECT price, previous_close, updated_at
    INTO v_quote
    FROM market_quotes
    WHERE symbol = v_holding.symbol
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If we found a quote, update the holding
    IF FOUND THEN
      UPDATE holdings
      SET 
        current_price = v_quote.price,
        previous_close = COALESCE(v_quote.previous_close, current_price),
        last_price_update = v_quote.updated_at,
        updated_at = NOW()
      WHERE id = v_holding.id;
      
      v_updated := v_updated + 1;
    END IF;
  END LOOP;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;
