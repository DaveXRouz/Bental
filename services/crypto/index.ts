import cryptoService from './crypto-service';

export { default as cryptoService } from './crypto-service';
export type { CryptoQuote, CryptoCandle } from './crypto-service';

import { ENV, isDemoMode } from '@/config/env';
import { Quote } from '../marketData/types';
import { safeWebSocketJson } from '@/utils/safe-json-parser';

class CryptoService {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private cacheTTL = 30000;

  private getCacheKey(symbol: string): string {
    return `crypto:${symbol}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheTTL,
    });
  }

  async getQuote(symbol: string): Promise<Quote> {
    if (isDemoMode) {
      return this.getDemoQuote(symbol);
    }

    const cacheKey = this.getCacheKey(symbol);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const quote = await cryptoService.getQuote(symbol);

      const result: Quote = {
        price: quote.price,
        change: quote.change24h,
        changePct: quote.changePercent24h,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.getDemoQuote(symbol);
    }
  }

  private symbolToCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      BNB: 'binancecoin',
      ADA: 'cardano',
      SOL: 'solana',
      XRP: 'ripple',
      DOT: 'polkadot',
      DOGE: 'dogecoin',
      AVAX: 'avalanche-2',
      MATIC: 'matic-network',
    };

    return mapping[symbol] || symbol.toLowerCase();
  }

  private getDemoQuote(symbol: string): Quote {
    const demoData: Record<string, { basePrice: number; volatility: number }> = {
      BTC: { basePrice: 43250, volatility: 1200 },
      ETH: { basePrice: 2280, volatility: 85 },
      BNB: { basePrice: 312, volatility: 12 },
      ADA: { basePrice: 0.58, volatility: 0.03 },
      SOL: { basePrice: 102, volatility: 5 },
      XRP: { basePrice: 0.63, volatility: 0.02 },
      DOT: { basePrice: 7.2, volatility: 0.3 },
      DOGE: { basePrice: 0.085, volatility: 0.005 },
      AVAX: { basePrice: 38, volatility: 2 },
      MATIC: { basePrice: 0.92, volatility: 0.05 },
    };

    const data = demoData[symbol] || { basePrice: 100, volatility: 5 };
    const price = data.basePrice + (Math.random() - 0.5) * data.volatility;
    const changePct = (Math.random() - 0.5) * 10;

    return {
      price: Number(price.toFixed(symbol === 'BTC' ? 0 : 2)),
      change: 0,
      changePct: Number(changePct.toFixed(2)),
    };
  }

  subscribeBinance(
    symbols: string[],
    onTick: (symbol: string, price: number) => void
  ): () => void {
    if (isDemoMode) {
      // Demo mode simulation
      const intervals = symbols.map((symbol) => {
        return setInterval(() => {
          const quote = this.getDemoQuote(symbol);
          onTick(symbol, quote.price);
        }, 3000);
      });

      return () => {
        intervals.forEach((interval) => clearInterval(interval));
      };
    }

    try {
      const streams = symbols.map((s) => `${s.toLowerCase()}usdt@trade`).join('/');
      const ws = new WebSocket(`${ENV.crypto.binanceWs}/${streams}`);

      ws.onmessage = (event) => {
        try {
          const data = safeWebSocketJson(event.data, {
            errorContext: 'Binance Crypto WebSocket',
            logOnError: true,
            allowEmpty: false,
          });

          if (data.e === 'trade') {
            const symbol = data.s.replace('USDT', '');
            onTick(symbol, parseFloat(data.p));
          }
        } catch (error: any) {
          console.error('[Crypto] WebSocket parse error:', error.message);
        }
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('[Crypto] WebSocket error:', error);
      return () => {};
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new CryptoService();
