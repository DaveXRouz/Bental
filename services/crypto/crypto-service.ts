export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  supply: number;
  rank: number;
  timestamp: number;
}

export interface CryptoCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class CryptoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private cacheTTL = 30000;

  private readonly supportedCoins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'ripple', symbol: 'XRP', name: 'Ripple' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
    { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
    { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },
    { id: 'stellar', symbol: 'XLM', name: 'Stellar' },
  ];

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

  private async fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  getCoinId(symbol: string): string | null {
    const coin = this.supportedCoins.find(c => c.symbol === symbol.toUpperCase());
    return coin?.id || null;
  }

  getCoinSymbol(id: string): string | null {
    const coin = this.supportedCoins.find(c => c.id === id);
    return coin?.symbol || null;
  }

  getSupportedCoins() {
    return [...this.supportedCoins];
  }

  async getQuote(symbol: string): Promise<CryptoQuote> {
    const cacheKey = this.getCacheKey('getQuote', symbol);
    const cached = this.getFromCache<CryptoQuote>(cacheKey);
    if (cached) return cached;

    const coinId = this.getCoinId(symbol);
    if (!coinId) {
      throw new Error(`Unsupported cryptocurrency: ${symbol}`);
    }

    try {
      const url = `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
      const data = await this.fetchWithRetry(url);

      const quote: CryptoQuote = {
        symbol: symbol.toUpperCase(),
        name: data.name,
        price: data.market_data.current_price.usd || 0,
        change24h: data.market_data.price_change_24h || 0,
        changePercent24h: data.market_data.price_change_percentage_24h || 0,
        marketCap: data.market_data.market_cap.usd || 0,
        volume24h: data.market_data.total_volume.usd || 0,
        high24h: data.market_data.high_24h.usd || 0,
        low24h: data.market_data.low_24h.usd || 0,
        supply: data.market_data.circulating_supply || 0,
        rank: data.market_cap_rank || 0,
        timestamp: Date.now(),
      };

      this.setCache(cacheKey, quote);
      return quote;
    } catch (error) {
      throw new Error(`Failed to fetch crypto quote: ${error}`);
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<CryptoQuote[]> {
    const cacheKey = this.getCacheKey('getMultipleQuotes', symbols.sort());
    const cached = this.getFromCache<CryptoQuote[]>(cacheKey);
    if (cached) return cached;

    const coinIds = symbols
      .map(s => this.getCoinId(s))
      .filter(id => id !== null) as string[];

    if (coinIds.length === 0) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&sparkline=false`;
      const data = await this.fetchWithRetry(url);

      const quotes: CryptoQuote[] = data.map((coin: any) => ({
        symbol: this.getCoinSymbol(coin.id) || coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        change24h: coin.price_change_24h || 0,
        changePercent24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.total_volume || 0,
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
        supply: coin.circulating_supply || 0,
        rank: coin.market_cap_rank || 0,
        timestamp: Date.now(),
      }));

      this.setCache(cacheKey, quotes);
      return quotes;
    } catch (error) {
      throw new Error(`Failed to fetch multiple quotes: ${error}`);
    }
  }

  async getCandles(
    symbol: string,
    days: number = 1
  ): Promise<CryptoCandle[]> {
    const cacheKey = this.getCacheKey('getCandles', symbol, days);
    const cached = this.getFromCache<CryptoCandle[]>(cacheKey);
    if (cached) return cached;

    const coinId = this.getCoinId(symbol);
    if (!coinId) {
      throw new Error(`Unsupported cryptocurrency: ${symbol}`);
    }

    try {
      const url = `${this.baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
      const data = await this.fetchWithRetry(url);

      const candles: CryptoCandle[] = data.map((candle: number[]) => ({
        time: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: 0,
      }));

      this.setCache(cacheKey, candles, 60000);
      return candles;
    } catch (error) {
      throw new Error(`Failed to fetch crypto candles: ${error}`);
    }
  }

  async getTrending(): Promise<CryptoQuote[]> {
    const cacheKey = this.getCacheKey('getTrending');
    const cached = this.getFromCache<CryptoQuote[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/search/trending`;
      const data = await this.fetchWithRetry(url);

      const trendingSymbols = data.coins
        .slice(0, 10)
        .map((item: any) => item.item.symbol)
        .filter((symbol: string) => this.getCoinId(symbol) !== null);

      if (trendingSymbols.length === 0) {
        return [];
      }

      const quotes = await this.getMultipleQuotes(trendingSymbols);
      this.setCache(cacheKey, quotes, 300000);
      return quotes;
    } catch (error) {
      return [];
    }
  }

  async getGlobalData(): Promise<{
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    activeCryptocurrencies: number;
  }> {
    const cacheKey = this.getCacheKey('getGlobalData');
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/global`;
      const data = await this.fetchWithRetry(url);

      const globalData = {
        totalMarketCap: data.data.total_market_cap.usd || 0,
        totalVolume24h: data.data.total_volume.usd || 0,
        btcDominance: data.data.market_cap_percentage.btc || 0,
        activeCryptocurrencies: data.data.active_cryptocurrencies || 0,
      };

      this.setCache(cacheKey, globalData, 120000);
      return globalData;
    } catch (error) {
      throw new Error(`Failed to fetch global data: ${error}`);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new CryptoService();
