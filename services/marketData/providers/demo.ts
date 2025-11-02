import { MarketDataProvider, Quote, Candle } from '../types';

// Demo provider with seeded data for testing
class DemoProvider implements MarketDataProvider {
  name = 'Demo';

  private demoData: Record<string, { basePrice: number; volatility: number }> = {
    AAPL: { basePrice: 178.5, volatility: 2.5 },
    GOOGL: { basePrice: 141.2, volatility: 3.0 },
    MSFT: { basePrice: 378.9, volatility: 2.8 },
    TSLA: { basePrice: 242.8, volatility: 5.5 },
    AMZN: { basePrice: 153.4, volatility: 3.2 },
    META: { basePrice: 478.5, volatility: 4.0 },
    NVDA: { basePrice: 495.3, volatility: 6.0 },
    JPM: { basePrice: 165.5, volatility: 1.8 },
    BTC: { basePrice: 43250, volatility: 8.0 },
    ETH: { basePrice: 2280, volatility: 7.5 },
    BNB: { basePrice: 312, volatility: 6.5 },
  };

  isAvailable(): boolean {
    return true;
  }

  async getQuote(symbol: string): Promise<Quote> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const data = this.demoData[symbol] || { basePrice: 100, volatility: 2 };
    const price = data.basePrice + (Math.random() - 0.5) * data.volatility;
    const change = (Math.random() - 0.5) * data.volatility;
    const changePct = (change / price) * 100;

    return {
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePct: Number(changePct.toFixed(2)),
    };
  }

  async getCandles(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<Candle[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const data = this.demoData[symbol] || { basePrice: 100, volatility: 2 };
    const intervals: Record<string, { points: number; timeStep: number }> = {
      '1D': { points: 78, timeStep: 300000 }, // 5 min
      '1W': { points: 168, timeStep: 3600000 }, // 1 hour
      '1M': { points: 30, timeStep: 86400000 }, // 1 day
      '1Y': { points: 252, timeStep: 86400000 }, // 1 day
    };

    const { points, timeStep } = intervals[range];
    const now = Date.now();
    const candles: Candle[] = [];

    let currentPrice = data.basePrice;

    for (let i = points; i >= 0; i--) {
      const timestamp = now - i * timeStep;
      const volatility = data.volatility;

      const open = currentPrice;
      const change = (Math.random() - 0.5) * volatility * 2;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      const volume = Math.random() * 1000000 + 500000;

      candles.push({
        t: timestamp,
        o: Number(open.toFixed(2)),
        h: Number(high.toFixed(2)),
        l: Number(low.toFixed(2)),
        c: Number(close.toFixed(2)),
        v: Math.floor(volume),
      });

      currentPrice = close;
    }

    return candles;
  }

  subscribe(symbols: string[], onTick: (symbol: string, price: number) => void): () => void {
    const intervals = symbols.map((symbol) => {
      return setInterval(() => {
        const data = this.demoData[symbol] || { basePrice: 100, volatility: 2 };
        const price = data.basePrice + (Math.random() - 0.5) * data.volatility;
        onTick(symbol, Number(price.toFixed(2)));
      }, 3000);
    });

    return () => {
      intervals.forEach((interval) => clearInterval(interval));
    };
  }
}

export default new DemoProvider();
