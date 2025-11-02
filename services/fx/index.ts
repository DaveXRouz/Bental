import { ENV, isDemoMode } from '@/config/env';

interface ExchangeRate {
  rate: number;
  timestamp: number;
}

function getProxyUrl(targetUrl: string): string {
  if (typeof window !== 'undefined') {
    return `/api/market-proxy?url=${encodeURIComponent(targetUrl)}`;
  }
  return targetUrl;
}

class FXService {
  private cache: Map<string, { data: ExchangeRate; expires: number }> = new Map();
  private cacheTTL = 3600000; // 1 hour cache for FX rates

  private getCacheKey(from: string, to: string): string {
    return `fx:${from}:${to}`;
  }

  private getFromCache(key: string): ExchangeRate | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: ExchangeRate): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheTTL,
    });
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    if (isDemoMode) {
      return this.getDemoRate(from, to);
    }

    const cacheKey = this.getCacheKey(from, to);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached.rate;

    try {
      const targetUrl = `${ENV.fx.exchangeRateBase}/convert?from=${from}&to=${to}&amount=1`;
      const proxyUrl = getProxyUrl(targetUrl);
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate ${from}/${to}`);
      }

      const data = await response.json();

      if (!data.success || !data.result) {
        throw new Error(`Invalid response for ${from}/${to}`);
      }

      const exchangeRate: ExchangeRate = {
        rate: data.result,
        timestamp: Date.now(),
      };

      this.setCache(cacheKey, exchangeRate);
      return exchangeRate.rate;
    } catch (error) {
      console.error(`[FX] Error fetching rate ${from}/${to}:`, error);
      return this.getDemoRate(from, to);
    }
  }

  async convertAmount(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }

  private getDemoRate(from: string, to: string): number {
    // Demo exchange rates (approximate)
    const demoRates: Record<string, Record<string, number>> = {
      USD: {
        EUR: 0.92,
        GBP: 0.79,
        CAD: 1.35,
        JPY: 149.5,
        CHF: 0.88,
        AUD: 1.52,
      },
      EUR: {
        USD: 1.09,
        GBP: 0.86,
        CAD: 1.47,
        JPY: 162.8,
        CHF: 0.96,
        AUD: 1.65,
      },
      GBP: {
        USD: 1.27,
        EUR: 1.16,
        CAD: 1.71,
        JPY: 189.3,
        CHF: 1.12,
        AUD: 1.92,
      },
      CAD: {
        USD: 0.74,
        EUR: 0.68,
        GBP: 0.59,
        JPY: 110.7,
        CHF: 0.65,
        AUD: 1.13,
      },
    };

    if (demoRates[from] && demoRates[from][to]) {
      return demoRates[from][to];
    }

    // If reverse rate exists
    if (demoRates[to] && demoRates[to][from]) {
      return 1 / demoRates[to][from];
    }

    // Default to 1 if no demo rate found
    return 1;
  }

  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'CHF', 'AUD'];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new FXService();
