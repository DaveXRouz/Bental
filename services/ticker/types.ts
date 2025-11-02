export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  lastUpdate: number;
  source: 'binance' | 'stooq' | 'fx';
}

export interface TickerState {
  tickers: Record<string, TickerData>;
  isConnected: boolean;
  lastUpdate: number;
  error: string | null;
}
