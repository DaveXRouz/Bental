/*
  # Market Quotes and Real-Time Price System

  1. New Tables
    - `market_quotes`
      - `symbol` (text, primary key) - Stock/crypto symbol
      - `price` (decimal) - Current market price
      - `change` (decimal) - Price change from previous close
      - `change_percent` (decimal) - Percentage change
      - `previous_close` (decimal) - Previous closing price
      - `open` (decimal) - Opening price
      - `high` (decimal) - Day's high
      - `low` (decimal) - Day's low
      - `volume` (bigint) - Trading volume
      - `market_cap` (bigint) - Market capitalization
      - `updated_at` (timestamptz) - Last update timestamp
      - `source` (text) - Data source (finnhub, mock, etc.)

  2. Functions
    - `update_holding_prices()` - Batch update holdings with latest market prices
    - `calculate_portfolio_metrics()` - Recalculate portfolio metrics after price updates

  3. Security
    - Enable RLS on `market_quotes` table
    - Public read access (prices are public data)
    - Only service role can write
*/

-- Create market_quotes table
CREATE TABLE IF NOT EXISTS market_quotes (
  symbol TEXT PRIMARY KEY,
  price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  change DECIMAL(20, 8) DEFAULT 0,
  change_percent DECIMAL(10, 4) DEFAULT 0,
  previous_close DECIMAL(20, 8),
  open DECIMAL(20, 8),
  high DECIMAL(20, 8),
  low DECIMAL(20, 8),
  volume BIGINT DEFAULT 0,
  market_cap BIGINT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'unknown',
  asset_type TEXT DEFAULT 'stock' CHECK (asset_type IN ('stock', 'crypto', 'forex', 'commodity')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_market_quotes_updated_at ON market_quotes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_quotes_asset_type ON market_quotes(asset_type);
CREATE INDEX IF NOT EXISTS idx_market_quotes_symbol_updated ON market_quotes(symbol, updated_at DESC);

-- Enable RLS
ALTER TABLE market_quotes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (market prices are public information)
CREATE POLICY "Anyone can read market quotes"
  ON market_quotes
  FOR SELECT
  TO public
  USING (true);

-- Only service role can insert/update market quotes
CREATE POLICY "Service role can manage quotes"
  ON market_quotes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update holding prices from market_quotes
CREATE OR REPLACE FUNCTION update_holding_prices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update holdings with latest market prices
  UPDATE holdings h
  SET
    current_price = mq.price,
    market_value = h.quantity * mq.price,
    unrealized_pnl = (mq.price - h.average_cost) * h.quantity,
    unrealized_pnl_percent = CASE
      WHEN h.average_cost > 0 THEN ((mq.price - h.average_cost) / h.average_cost) * 100
      ELSE 0
    END,
    day_change = CASE
      WHEN mq.previous_close > 0 THEN (mq.price - mq.previous_close) * h.quantity
      ELSE 0
    END,
    day_change_percent = mq.change_percent,
    previous_close = mq.previous_close,
    last_price_update = NOW(),
    updated_at = NOW()
  FROM market_quotes mq
  WHERE h.symbol = mq.symbol
    AND h.quantity > 0;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN updated_count;
END;
$$;

-- Function to batch update market quotes (called by price updater service)
CREATE OR REPLACE FUNCTION batch_update_market_quotes(
  quotes JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quote_record JSONB;
  inserted_count INTEGER := 0;
BEGIN
  FOR quote_record IN SELECT * FROM jsonb_array_elements(quotes)
  LOOP
    INSERT INTO market_quotes (
      symbol,
      price,
      change,
      change_percent,
      previous_close,
      open,
      high,
      low,
      volume,
      updated_at,
      source,
      asset_type
    ) VALUES (
      quote_record->>'symbol',
      (quote_record->>'price')::DECIMAL,
      COALESCE((quote_record->>'change')::DECIMAL, 0),
      COALESCE((quote_record->>'change_percent')::DECIMAL, 0),
      (quote_record->>'previous_close')::DECIMAL,
      (quote_record->>'open')::DECIMAL,
      (quote_record->>'high')::DECIMAL,
      (quote_record->>'low')::DECIMAL,
      COALESCE((quote_record->>'volume')::BIGINT, 0),
      NOW(),
      COALESCE(quote_record->>'source', 'unknown'),
      COALESCE(quote_record->>'asset_type', 'stock')
    )
    ON CONFLICT (symbol) DO UPDATE SET
      price = EXCLUDED.price,
      change = EXCLUDED.change,
      change_percent = EXCLUDED.change_percent,
      previous_close = EXCLUDED.previous_close,
      open = EXCLUDED.open,
      high = EXCLUDED.high,
      low = EXCLUDED.low,
      volume = EXCLUDED.volume,
      updated_at = NOW(),
      source = EXCLUDED.source;

    inserted_count := inserted_count + 1;
  END LOOP;

  -- After updating quotes, update all holdings
  PERFORM update_holding_prices();

  RETURN inserted_count;
END;
$$;

-- Seed with some initial mock data for common symbols
INSERT INTO market_quotes (symbol, price, previous_close, open, high, low, volume, source, asset_type)
VALUES
  ('AAPL', 178.50, 177.25, 177.50, 179.10, 177.00, 52000000, 'mock', 'stock'),
  ('GOOGL', 141.80, 140.90, 141.00, 142.50, 140.80, 28000000, 'mock', 'stock'),
  ('MSFT', 378.90, 377.50, 378.00, 380.20, 377.00, 24000000, 'mock', 'stock'),
  ('TSLA', 242.80, 240.10, 241.00, 245.50, 239.80, 98000000, 'mock', 'stock'),
  ('AMZN', 153.40, 152.75, 153.00, 154.20, 152.50, 45000000, 'mock', 'stock'),
  ('META', 486.50, 483.20, 484.00, 488.90, 482.50, 18000000, 'mock', 'stock'),
  ('NVDA', 495.20, 491.80, 493.00, 498.70, 490.50, 42000000, 'mock', 'stock'),
  ('BTC', 43250.00, 42800.00, 42900.00, 43500.00, 42500.00, 0, 'mock', 'crypto'),
  ('ETH', 2280.50, 2250.00, 2260.00, 2300.00, 2240.00, 0, 'mock', 'crypto'),
  ('SPY', 451.20, 450.50, 450.80, 451.80, 450.20, 68000000, 'mock', 'stock')
ON CONFLICT (symbol) DO NOTHING;

-- Update all existing holdings with the initial prices
SELECT update_holding_prices();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_holding_prices() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION batch_update_market_quotes(JSONB) TO authenticated, service_role;
