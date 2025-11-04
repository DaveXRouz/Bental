/*
  # Comprehensive Demo Data Seeding v3
  
  Populates market quotes, watchlists, news, and updates holdings.
*/

-- =====================================================
-- 1. MARKET QUOTES - 35+ symbols
-- =====================================================

INSERT INTO market_quotes (symbol, price, change, change_percent, previous_close, open, high, low, volume, source, asset_type, updated_at)
VALUES
  ('AAPL', 178.50, 2.30, 1.31, 176.20, 177.00, 179.80, 176.50, 52340000, 'demo', 'stock', NOW()),
  ('MSFT', 378.90, 5.20, 1.39, 373.70, 375.00, 380.50, 374.20, 28450000, 'demo', 'stock', NOW()),
  ('GOOGL', 141.80, -0.90, -0.63, 142.70, 142.50, 143.20, 141.20, 19870000, 'demo', 'stock', NOW()),
  ('AMZN', 151.30, 1.80, 1.20, 149.50, 150.20, 152.10, 149.80, 38920000, 'demo', 'stock', NOW()),
  ('META', 485.20, 8.50, 1.78, 476.70, 478.00, 487.30, 477.20, 15430000, 'demo', 'stock', NOW()),
  ('TSLA', 242.80, -3.40, -1.38, 246.20, 245.50, 247.80, 241.90, 95340000, 'demo', 'stock', NOW()),
  ('NVDA', 495.70, 12.30, 2.54, 483.40, 485.00, 498.20, 484.50, 48670000, 'demo', 'stock', NOW()),
  ('NFLX', 445.60, 3.20, 0.72, 442.40, 443.50, 447.80, 442.10, 6780000, 'demo', 'stock', NOW()),
  ('JPM', 157.80, 1.20, 0.77, 156.60, 157.00, 158.50, 156.80, 11230000, 'demo', 'stock', NOW()),
  ('BAC', 33.45, 0.15, 0.45, 33.30, 33.35, 33.60, 33.25, 42340000, 'demo', 'stock', NOW()),
  ('GS', 385.20, 2.80, 0.73, 382.40, 383.50, 386.90, 382.10, 2140000, 'demo', 'stock', NOW()),
  ('V', 258.90, 1.70, 0.66, 257.20, 257.80, 259.50, 257.40, 6890000, 'demo', 'stock', NOW()),
  ('JNJ', 156.20, -0.80, -0.51, 157.00, 156.80, 157.40, 155.90, 8450000, 'demo', 'stock', NOW()),
  ('UNH', 524.80, 4.60, 0.88, 520.20, 521.50, 526.30, 520.80, 3120000, 'demo', 'stock', NOW()),
  ('PFE', 28.75, -0.15, -0.52, 28.90, 28.85, 29.10, 28.60, 35670000, 'demo', 'stock', NOW()),
  ('WMT', 166.40, 1.90, 1.15, 164.50, 165.20, 167.10, 164.80, 7890000, 'demo', 'stock', NOW()),
  ('KO', 59.80, 0.30, 0.50, 59.50, 59.60, 60.10, 59.40, 14230000, 'demo', 'stock', NOW()),
  ('MCD', 289.60, 2.40, 0.84, 287.20, 288.00, 290.50, 287.50, 2890000, 'demo', 'stock', NOW()),
  ('NKE', 105.70, -0.90, -0.84, 106.60, 106.30, 107.20, 105.40, 8760000, 'demo', 'stock', NOW()),
  ('XOM', 102.30, 0.80, 0.79, 101.50, 101.80, 102.90, 101.40, 18450000, 'demo', 'stock', NOW()),
  ('CVX', 145.60, 1.20, 0.83, 144.40, 144.80, 146.20, 144.50, 9230000, 'demo', 'stock', NOW()),
  ('BTC', 43250.00, 850.00, 2.00, 42400.00, 42500.00, 43600.00, 42350.00, 28500000000, 'demo', 'crypto', NOW()),
  ('ETH', 2285.50, 45.80, 2.04, 2239.70, 2250.00, 2310.00, 2235.00, 15200000000, 'demo', 'crypto', NOW()),
  ('BNB', 312.40, 5.60, 1.83, 306.80, 308.00, 315.20, 306.50, 890000000, 'demo', 'crypto', NOW()),
  ('SOL', 98.75, 3.25, 3.40, 95.50, 96.20, 99.80, 95.30, 2340000000, 'demo', 'crypto', NOW()),
  ('ADA', 0.52, 0.01, 1.96, 0.51, 0.51, 0.53, 0.51, 450000000, 'demo', 'crypto', NOW()),
  ('XRP', 0.58, 0.02, 3.57, 0.56, 0.56, 0.59, 0.56, 1230000000, 'demo', 'crypto', NOW()),
  ('DOT', 7.32, 0.18, 2.52, 7.14, 7.18, 7.45, 7.12, 345000000, 'demo', 'crypto', NOW()),
  ('AVAX', 36.80, 1.20, 3.37, 35.60, 35.80, 37.20, 35.50, 678000000, 'demo', 'crypto', NOW()),
  ('EURUSD', 1.0875, 0.0025, 0.23, 1.0850, 1.0860, 1.0890, 1.0845, 0, 'demo', 'forex', NOW()),
  ('GBPUSD', 1.2645, 0.0035, 0.28, 1.2610, 1.2620, 1.2665, 1.2605, 0, 'demo', 'forex', NOW()),
  ('USDJPY', 149.85, -0.45, -0.30, 150.30, 150.20, 150.50, 149.70, 0, 'demo', 'forex', NOW()),
  ('AUDUSD', 0.6580, 0.0020, 0.30, 0.6560, 0.6565, 0.6595, 0.6555, 0, 'demo', 'forex', NOW()),
  ('XAUUSD', 2035.50, 12.30, 0.61, 2023.20, 2028.00, 2040.80, 2022.50, 0, 'demo', 'commodity', NOW()),
  ('XAGUSD', 24.15, 0.35, 1.47, 23.80, 23.90, 24.30, 23.75, 0, 'demo', 'commodity', NOW()),
  ('WTIUSD', 78.45, 1.25, 1.62, 77.20, 77.50, 78.90, 77.10, 0, 'demo', 'commodity', NOW())
ON CONFLICT (symbol) DO UPDATE SET
  price = EXCLUDED.price,
  change = EXCLUDED.change,
  change_percent = EXCLUDED.change_percent,
  previous_close = EXCLUDED.previous_close,
  open = EXCLUDED.open,
  high = EXCLUDED.high,
  low = EXCLUDED.low,
  volume = EXCLUDED.volume,
  updated_at = NOW();

-- =====================================================
-- 2. WATCHLISTS
-- =====================================================

INSERT INTO watchlist (user_id, symbol)
SELECT 
  u.id,
  sym.symbol
FROM auth.users u
CROSS JOIN (VALUES 
  ('AAPL'), ('MSFT'), ('GOOGL'), ('AMZN'), ('TSLA'), 
  ('NVDA'), ('META'), ('BTC'), ('ETH'), ('SOL')
) AS sym(symbol)
WHERE u.email LIKE '%@demo.com'
AND RANDOM() < 0.6
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. NEWS ARTICLES
-- =====================================================

INSERT INTO news_articles (title, summary, source, source_url, image_url, published_at, symbols, sentiment, published)
VALUES
  ('Tech Stocks Rally on Strong Earnings', 'Major tech companies report better-than-expected quarterly results', 'MarketWatch', 'https://example.com/1', 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg', NOW() - INTERVAL '2 hours', ARRAY['AAPL', 'MSFT', 'GOOGL'], 'positive', true),
  ('Bitcoin Surges Past $43,000', 'Cryptocurrency market sees renewed investor interest', 'CoinDesk', 'https://example.com/2', 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg', NOW() - INTERVAL '4 hours', ARRAY['BTC', 'ETH'], 'positive', true),
  ('Federal Reserve Holds Interest Rates', 'Fed maintains current rates amid mixed signals', 'Bloomberg', 'https://example.com/3', 'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg', NOW() - INTERVAL '6 hours', ARRAY['SPY'], 'neutral', true),
  ('NVIDIA Announces New AI Chip', 'Graphics chip maker unveils next-generation processor', 'TechCrunch', 'https://example.com/4', 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg', NOW() - INTERVAL '1 day', ARRAY['NVDA'], 'positive', true),
  ('Gold Prices Hit 6-Month High', 'Precious metals rally on safe-haven demand', 'Reuters', 'https://example.com/5', 'https://images.pexels.com/photos/128867/coins-currency-investment-insurance-128867.jpeg', NOW() - INTERVAL '1 day', ARRAY['XAUUSD'], 'positive', true),
  ('Tesla Expands Production', 'Electric vehicle maker opens new facility', 'CNBC', 'https://example.com/6', 'https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg', NOW() - INTERVAL '2 days', ARRAY['TSLA'], 'positive', true),
  ('Ethereum 2.0 Upgrade Shows Promise', 'Network improvements lead to faster transactions', 'CryptoNews', 'https://example.com/7', 'https://images.pexels.com/photos/844127/pexels-photo-844127.jpeg', NOW() - INTERVAL '3 days', ARRAY['ETH'], 'positive', true),
  ('Dollar Weakens Against Majors', 'Foreign exchange markets see dollar decline', 'FX Street', 'https://example.com/8', 'https://images.pexels.com/photos/210679/pexels-photo-210679.jpeg', NOW() - INTERVAL '3 days', ARRAY['EURUSD', 'GBPUSD'], 'negative', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. Update holdings prices
-- =====================================================

SELECT update_holding_prices();
