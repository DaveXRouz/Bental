import { MarketDataProvider, Quote, Candle } from '../types';

// Realistic mock data for popular symbols
const MOCK_QUOTES: Record<string, Partial<Quote>> = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', price: 178.45, change: 2.34, changePercent: 1.33 },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.87, change: -1.23, changePercent: -0.85 },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corp.', price: 412.34, change: 5.67, changePercent: 1.39 },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.84, change: -3.45, changePercent: -1.40 },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.23, change: 1.89, changePercent: 1.07 },
  BTC: { symbol: 'BTC', name: 'Bitcoin', price: 67234.50, change: 1234.50, changePercent: 1.87 },
  ETH: { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -45.23, changePercent: -1.29 },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 12.45, changePercent: 1.44 },
  META: { symbol: 'META', name: 'Meta Platforms', price: 486.73, change: -5.67, changePercent: -1.15 },
  NFLX: { symbol: 'NFLX', name: 'Netflix Inc.', price: 598.42, change: 8.34, changePercent: 1.41 },
};

class MockProvider implements MarketDataProvider {
  name = 'Mock Data Provider';

  isAvailable(): boolean {
    return true; // Always available
  }

  async getQuote(symbol: string): Promise<Quote> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const baseQuote = MOCK_QUOTES[symbol] || {
      symbol,
      name: `${symbol} Mock`,
      price: Math.random() * 100 + 50,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 3,
    };

    // Add slight random variation to price
    const priceVariation = (Math.random() - 0.5) * 0.5;
    const price = (baseQuote.price || 100) + priceVariation;
    const change = (baseQuote.change || 0) + (Math.random() - 0.5) * 0.2;
    const changePercent = (change / (price - change)) * 100;

    return {
      symbol: baseQuote.symbol || symbol,
      name: baseQuote.name || `${symbol} Stock`,
      price,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 10000000),
      high: price * 1.02,
      low: price * 0.98,
      open: price - change,
      previousClose: price - change,
      timestamp: Date.now(),
    };
  }

  async getCandles(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<Candle[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const basePrice = MOCK_QUOTES[symbol]?.price || 100;
    const points = range === '1D' ? 78 : range === '1W' ? 35 : range === '1M' ? 30 : 252;
    const candles: Candle[] = [];

    let currentPrice = basePrice * 0.95; // Start slightly lower
    const volatility = 0.02; // 2% daily volatility

    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 1000000) + 500000;

      candles.push({
        timestamp: Date.now() - (points - i) * (range === '1D' ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000),
        open,
        high,
        low,
        close,
        volume,
      });

      currentPrice = close;
    }

    return candles;
  }

  subscribe?(symbols: string[], onTick: (symbol: string, price: number) => void): () => void {
    // Mock realtime updates every 3 seconds
    const interval = setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = MOCK_QUOTES[symbol]?.price || 100;
        const variation = (Math.random() - 0.5) * 0.5;
        onTick(symbol, basePrice + variation);
      });
    }, 3000);

    return () => clearInterval(interval);
  }
}

export default new MockProvider();
