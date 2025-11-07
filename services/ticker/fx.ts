import { TickerData } from './types';
import { safeResponseJson } from '@/utils/safe-json-parser';

const FX_API_URL = 'https://api.exchangerate.host/latest?base=USD&symbols=CAD,EUR,CHF';
const CACHE_DURATION = 300000;

interface ExchangeRateResponse {
  base: string;
  rates: Record<string, number>;
  date: string;
}

export class FXTickerService {
  private cache: TickerData[] = [];
  private previousRates: Record<string, number> = {};
  private lastFetch = 0;
  private isFetching = false;

  async fetchRates(): Promise<TickerData[]> {
    const now = Date.now();

    if (now - this.lastFetch < CACHE_DURATION && this.cache.length > 0) {
      return this.cache;
    }

    if (this.isFetching) {
      return this.cache;
    }

    this.isFetching = true;

    try {
      const response = await fetch(FX_API_URL);
      const data: ExchangeRateResponse = await safeResponseJson(response, {
        errorContext: 'FX Ticker API',
        logOnError: true,
        allowEmpty: false,
      });

      if (!data.rates) {
        throw new Error('Invalid FX API response');
      }

      const tickers: TickerData[] = [];

      for (const [currency, rate] of Object.entries(data.rates)) {
        const previousRate = this.previousRates[currency] || rate;
        const change = rate - previousRate;
        const changePercent = ((change / previousRate) * 100);

        tickers.push({
          symbol: `USD${currency}`,
          price: rate,
          change,
          changePercent,
          lastUpdate: now,
          source: 'fx',
        });

        this.previousRates[currency] = rate;
      }

      this.cache = tickers;
      this.lastFetch = now;
      return tickers;
    } catch (error) {
      // Silently return cached data - FX API may be rate-limited or unavailable
      return this.cache;
    } finally {
      this.isFetching = false;
    }
  }

  getCachedRates(): TickerData[] {
    return this.cache;
  }

  isStale(): boolean {
    return Date.now() - this.lastFetch > CACHE_DURATION;
  }
}

export const fxService = new FXTickerService();
