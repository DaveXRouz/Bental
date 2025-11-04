import { MarketDataProvider, Quote, Candle } from '../types';

class FinnhubProvider implements MarketDataProvider {
  name = 'Finnhub';
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  private wsUrl = 'wss://ws.finnhub.io';
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Set<(symbol: string, price: number) => void>>();

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_FINNHUB_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  }

  async getQuote(symbol: string): Promise<Quote> {
    const url = `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`;

    try {
      const data = await this.fetchWithRetry(url);

      return {
        price: data.c || 0,
        change: data.d || 0,
        changePct: data.dp || 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch quote for ${symbol}: ${error}`);
    }
  }

  async getCandles(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<Candle[]> {
    const now = Math.floor(Date.now() / 1000);
    let from: number;
    let resolution: string;

    switch (range) {
      case '1D':
        from = now - 86400;
        resolution = '5';
        break;
      case '1W':
        from = now - 604800;
        resolution = '30';
        break;
      case '1M':
        from = now - 2592000;
        resolution = '60';
        break;
      case '1Y':
        from = now - 31536000;
        resolution = 'D';
        break;
      default:
        from = now - 86400;
        resolution = '5';
    }

    const url = `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${this.apiKey}`;

    try {
      const data = await this.fetchWithRetry(url);

      if (data.s !== 'ok' || !data.c || data.c.length === 0) {
        throw new Error('No candle data available');
      }

      return data.c.map((close: number, i: number) => ({
        time: data.t[i] * 1000,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: close,
        volume: data.v[i],
      }));
    } catch (error) {
      throw new Error(`Failed to fetch candles for ${symbol}: ${error}`);
    }
  }

  subscribe(symbols: string[], onTick: (symbol: string, price: number) => void): () => void {
    if (!this.isAvailable()) {
      return () => {};
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.initWebSocket();
    }

    symbols.forEach(symbol => {
      if (!this.subscriptions.has(symbol)) {
        this.subscriptions.set(symbol, new Set());

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        }
      }
      this.subscriptions.get(symbol)!.add(onTick);
    });

    return () => {
      symbols.forEach(symbol => {
        const callbacks = this.subscriptions.get(symbol);
        if (callbacks) {
          callbacks.delete(onTick);
          if (callbacks.size === 0) {
            this.subscriptions.delete(symbol);
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
            }
          }
        }
      });
    };
  }

  private initWebSocket(): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`${this.wsUrl}?token=${this.apiKey}`);

    this.ws.onopen = () => {
      this.subscriptions.forEach((_, symbol) => {
        this.ws!.send(JSON.stringify({ type: 'subscribe', symbol }));
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'trade') {
          message.data?.forEach((trade: any) => {
            const callbacks = this.subscriptions.get(trade.s);
            if (callbacks) {
              callbacks.forEach(callback => callback(trade.s, trade.p));
            }
          });
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    this.ws.onerror = () => {
      setTimeout(() => this.initWebSocket(), 5000);
    };

    this.ws.onclose = () => {
      setTimeout(() => this.initWebSocket(), 5000);
    };
  }
}

export default new FinnhubProvider();
