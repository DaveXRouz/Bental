import { TickerData } from './types';
import { safeWebSocketJson } from '@/utils/safe-json-parser';

const BINANCE_WS = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';
const WATCHED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

export class BinanceTickerService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private onDataCallback: ((data: TickerData[]) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  connect(
    onData: (data: TickerData[]) => void,
    onError?: (error: Error) => void
  ) {
    this.onDataCallback = onData;
    this.onErrorCallback = onError || null;

    try {
      this.ws = new WebSocket(BINANCE_WS);

      this.ws.onopen = () => {
        console.log('[Binance] WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = safeWebSocketJson(event.data, {
            errorContext: 'Binance WebSocket',
            logOnError: true,
            allowEmpty: false,
          });

          if (Array.isArray(data)) {
            const tickers = data
              .filter((item: any) => WATCHED_SYMBOLS.includes(item.s))
              .map((item: any) => this.parseTickerData(item));

            if (tickers.length > 0 && this.onDataCallback) {
              this.onDataCallback(tickers);
            }
          }
        } catch (error: any) {
          console.error('[Binance] WebSocket parse error:', {
            error: error.message,
            type: error.type,
          });
        }
      };

      this.ws.onerror = (error) => {
        console.log('[Binance] WebSocket error (expected in dev):', error.type);
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error('WebSocket connection error'));
        }
      };

      this.ws.onclose = () => {
        console.log('[Binance] WebSocket closed');
        this.attemptReconnect();
      };
    } catch (error) {
      console.log('[Binance] Connection error (expected in dev):', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
    }
  }

  private parseTickerData(item: any): TickerData {
    const price = parseFloat(item.c);
    const change = parseFloat(item.p);
    const changePercent = parseFloat(item.P);

    return {
      symbol: item.s.replace('USDT', ''),
      price,
      change,
      changePercent,
      volume: parseFloat(item.v),
      lastUpdate: Date.now(),
      source: 'binance',
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[Binance] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );

      setTimeout(() => {
        if (this.onDataCallback) {
          this.connect(this.onDataCallback, this.onErrorCallback || undefined);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[Binance] Max reconnection attempts reached');
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('Failed to reconnect after multiple attempts'));
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const binanceService = new BinanceTickerService();
