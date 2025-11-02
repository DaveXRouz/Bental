import { useMockData } from '@/config/env';
import { MarketDataProvider, Quote, Candle } from './types';
import mockProvider from './providers/mock';
import demoProvider from './providers/demo';

// Only import finnhub if needed (tree-shaking)
let finnhubProvider: MarketDataProvider | null = null;

class MarketDataService {
  private provider: MarketDataProvider;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private cacheTTL = 60000;

  constructor() {
    this.provider = this.selectProvider();
  }

  private selectProvider(): MarketDataProvider {
    // Use mock data in local mode or if explicitly disabled
    if (useMockData) {
      return mockProvider;
    }

    // Lazy load finnhub only if needed
    if (process.env.FINNHUB_API_KEY) {
      if (!finnhubProvider) {
        try {
          finnhubProvider = require('./providers/finnhub').default;
        } catch (error) {
          // Finnhub provider not available
        }
      }
      if (finnhubProvider && finnhubProvider.isAvailable()) {
        return finnhubProvider;
      }
    }

    // Fallback to mock or demo provider
    return mockProvider;
  }

  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}:${JSON.stringify(args)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = this.cacheTTL): void {
    this.cache.set(key, { data, expires: Date.now() + ttl });
  }

  async getQuote(symbol: string): Promise<Quote> {
    const cacheKey = this.getCacheKey('getQuote', symbol);
    const cached = this.getFromCache<Quote>(cacheKey);
    if (cached) return cached;

    try {
      const quote = await this.provider.getQuote(symbol);
      this.setCache(cacheKey, quote);
      return quote;
    } catch (error) {
      // Silent fallback to mock for better UX
      return mockProvider.getQuote(symbol);
    }
  }

  async getCandles(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<Candle[]> {
    const cacheKey = this.getCacheKey('getCandles', symbol, range);
    const cached = this.getFromCache<Candle[]>(cacheKey);
    if (cached) return cached;

    try {
      const candles = await this.provider.getCandles(symbol, range);
      this.setCache(cacheKey, candles, 300000);
      return candles;
    } catch (error) {
      return mockProvider.getCandles(symbol, range);
    }
  }

  subscribe(symbols: string[], onTick: (symbol: string, price: number) => void): () => void {
    if (!this.provider.subscribe) {
      return () => {};
    }

    try {
      return this.provider.subscribe(symbols, onTick);
    } catch (error) {
      return () => {};
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new MarketDataService();
