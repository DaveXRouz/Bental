import { supabase } from '@/lib/supabase';
import marketDataService from '@/services/marketData';

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  previous_close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  source: string;
  asset_type: 'stock' | 'crypto' | 'forex' | 'commodity';
}

class MarketPriceUpdater {
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private updateFrequency = 30000; // 30 seconds

  /**
   * Start automatic price updates
   */
  start(frequency: number = 30000) {
    if (this.updateInterval) {
      this.stop();
    }

    this.updateFrequency = frequency;
    this.performUpdate();

    this.updateInterval = setInterval(() => {
      this.performUpdate();
    }, this.updateFrequency);

    console.log(`Market price updater started (every ${frequency / 1000}s)`);
  }

  /**
   * Stop automatic price updates
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('Market price updater stopped');
  }

  /**
   * Manually trigger a price update
   */
  async update(): Promise<number> {
    return this.performUpdate();
  }

  /**
   * Perform the actual price update
   */
  private async performUpdate(): Promise<number> {
    if (this.isUpdating) {
      return 0;
    }

    this.isUpdating = true;

    try {
      // Get all unique symbols from holdings
      const symbols = await this.getUniqueSymbolsFromHoldings();

      if (symbols.length === 0) {
        return 0;
      }

      // Fetch quotes from market data service
      const quotes = await this.fetchQuotesForSymbols(symbols);

      if (quotes.length === 0) {
        return 0;
      }

      // Update database
      const updated = await this.updateDatabaseQuotes(quotes);

      return updated;
    } catch (error) {
      console.error('Error updating market prices:', error);
      return 0;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Get unique symbols from all user holdings
   */
  private async getUniqueSymbolsFromHoldings(): Promise<string[]> {
    try {
      const { data: holdings } = await supabase
        .from('holdings')
        .select('symbol')
        .gt('quantity', 0);

      if (!holdings) return [];

      const uniqueSymbols = [...new Set(holdings.map((h) => h.symbol))];
      return uniqueSymbols;
    } catch (error) {
      console.error('Error fetching holdings symbols:', error);
      return [];
    }
  }

  /**
   * Fetch quotes for multiple symbols from market data service
   */
  private async fetchQuotesForSymbols(symbols: string[]): Promise<MarketQuote[]> {
    const quotes: MarketQuote[] = [];

    // Fetch quotes in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      const batchQuotes = await Promise.allSettled(
        batch.map(async (symbol) => {
          try {
            const quote = await marketDataService.getQuote(symbol);

            // Determine asset type
            const asset_type = this.determineAssetType(symbol);

            return {
              symbol,
              price: quote.price,
              change: quote.change,
              change_percent: quote.changePct,
              previous_close: quote.price - quote.change,
              open: quote.price - quote.change, // Approximate
              high: quote.price,
              low: quote.price,
              volume: 0,
              source: marketDataService.getProviderName(),
              asset_type,
            };
          } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            return null;
          }
        })
      );

      batchQuotes.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          quotes.push(result.value);
        }
      });

      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return quotes;
  }

  /**
   * Determine asset type from symbol
   */
  private determineAssetType(symbol: string): 'stock' | 'crypto' | 'forex' | 'commodity' {
    const cryptoSymbols = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT'];

    if (cryptoSymbols.includes(symbol)) {
      return 'crypto';
    }

    if (symbol.includes('/')) {
      return 'forex';
    }

    return 'stock';
  }

  /**
   * Update market quotes in database using batch function
   */
  private async updateDatabaseQuotes(quotes: MarketQuote[]): Promise<number> {
    try {
      // Call the database function to batch update
      const { data, error } = await supabase.rpc('batch_update_market_quotes', {
        quotes: JSON.stringify(quotes),
      });

      if (error) {
        console.error('Error updating database quotes:', error);
        return 0;
      }

      console.log(`Updated ${data || 0} market quotes`);
      return data || 0;
    } catch (error) {
      console.error('Error calling batch_update_market_quotes:', error);
      return 0;
    }
  }

  /**
   * Update prices for specific symbols only
   */
  async updateSymbols(symbols: string[]): Promise<number> {
    if (symbols.length === 0) return 0;

    try {
      const quotes = await this.fetchQuotesForSymbols(symbols);
      const updated = await this.updateDatabaseQuotes(quotes);
      return updated;
    } catch (error) {
      console.error('Error updating specific symbols:', error);
      return 0;
    }
  }

  /**
   * Get last update timestamp from database
   */
  async getLastUpdateTime(): Promise<Date | null> {
    try {
      const { data } = await supabase
        .from('market_quotes')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      return data ? new Date(data.updated_at) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if updater is currently running
   */
  isRunning(): boolean {
    return this.updateInterval !== null;
  }

  /**
   * Get update frequency in milliseconds
   */
  getUpdateFrequency(): number {
    return this.updateFrequency;
  }
}

export const marketPriceUpdater = new MarketPriceUpdater();
