export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

export interface Quote {
  price: number;
  change: number;
  changePct: number;
}

export interface MarketDataProvider {
  name: string;
  isAvailable: () => boolean;
  getQuote(symbol: string): Promise<Quote>;
  getCandles(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<Candle[]>;
  subscribe?(symbols: string[], onTick: (symbol: string, price: number) => void): () => void;
}
