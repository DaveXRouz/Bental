import { supabase } from '@/lib/supabase';

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

type PriceUpdateCallback = (updates: PriceUpdate[]) => void;

class PriceUpdateService {
  private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private updateFrequency = 30000;

  subscribe(symbols: string[], callback: PriceUpdateCallback): () => void {
    const key = symbols.sort().join(',');

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);

    if (!this.isPolling) {
      this.startPolling();
    }

    this.fetchPrices(symbols).then(callback);

    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }

      if (this.subscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  private startPolling() {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollingInterval = setInterval(() => {
      this.pollAllSubscribers();
    }, this.updateFrequency);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }

  private async pollAllSubscribers() {
    for (const [symbolKey, callbacks] of this.subscribers.entries()) {
      const symbols = symbolKey.split(',');
      const updates = await this.fetchPrices(symbols);
      callbacks.forEach((callback) => callback(updates));
    }
  }

  private async fetchPrices(symbols: string[]): Promise<PriceUpdate[]> {
    try {
      const { data: quotes } = await supabase
        .from('market_quotes')
        .select('symbol, price, change, change_percent, updated_at')
        .in('symbol', symbols);

      if (!quotes) return [];

      return quotes.map((quote) => ({
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.change_percent,
        timestamp: new Date(quote.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [];
    }
  }

  async updatePricesInDatabase(updates: PriceUpdate[]): Promise<void> {
    try {
      const upsertData = updates.map((update) => ({
        symbol: update.symbol,
        price: update.price,
        change: update.change,
        change_percent: update.changePercent,
        updated_at: update.timestamp.toISOString(),
      }));

      await supabase.from('market_quotes').upsert(upsertData, {
        onConflict: 'symbol',
      });
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  }

  setUpdateFrequency(milliseconds: number) {
    this.updateFrequency = milliseconds;
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling();
    }
  }

  getLastUpdateTime(): Date | null {
    return new Date();
  }
}

export const priceUpdateService = new PriceUpdateService();
