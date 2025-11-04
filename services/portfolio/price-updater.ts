import { supabase } from '@/lib/supabase';

interface PriceData {
  symbol: string;
  currentPrice: number;
  previousClose?: number;
}

export class PriceUpdater {
  async updateHoldingPrice(holdingId: string, priceData: PriceData): Promise<void> {
    const updates: any = {
      current_price: priceData.currentPrice,
      last_price_update: new Date().toISOString()
    };

    if (priceData.previousClose) {
      updates.previous_close = priceData.previousClose;
    }

    const { error } = await supabase
      .from('holdings')
      .update(updates)
      .eq('id', holdingId);

    if (error) {
      console.error(`Failed to update price for holding ${holdingId}:`, error);
      throw error;
    }
  }

  async updateAllHoldingsPrices(userId: string, priceMap: Map<string, PriceData>): Promise<void> {
    const { data: holdings, error } = await supabase
      .from('holdings')
      .select('id, symbol')
      .eq('user_id', userId);

    if (error || !holdings) {
      console.error('Failed to fetch holdings:', error);
      return;
    }

    const updatePromises = holdings
      .filter(h => priceMap.has(h.symbol))
      .map(h => {
        const priceData = priceMap.get(h.symbol)!;
        return this.updateHoldingPrice(h.id, priceData);
      });

    await Promise.allSettled(updatePromises);
  }

  async updateSingleHoldingPrice(
    userId: string,
    symbol: string,
    currentPrice: number,
    previousClose?: number
  ): Promise<void> {
    const { error } = await supabase
      .from('holdings')
      .update({
        current_price: currentPrice,
        previous_close: previousClose,
        last_price_update: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('symbol', symbol);

    if (error) {
      console.error(`Failed to update price for ${symbol}:`, error);
      throw error;
    }
  }

  async batchUpdatePrices(updates: Array<{
    userId: string;
    symbol: string;
    currentPrice: number;
    previousClose?: number;
  }>): Promise<void> {
    const promises = updates.map(update =>
      this.updateSingleHoldingPrice(
        update.userId,
        update.symbol,
        update.currentPrice,
        update.previousClose
      )
    );

    await Promise.allSettled(promises);
  }

  async setPreviousClosePrices(userId: string): Promise<void> {
    const { data: holdings, error } = await supabase
      .from('holdings')
      .select('id, current_price, previous_close')
      .eq('user_id', userId);

    if (error || !holdings) {
      return;
    }

    const updates = holdings
      .filter(h => h.current_price && !h.previous_close)
      .map(h => supabase
        .from('holdings')
        .update({ previous_close: h.current_price })
        .eq('id', h.id)
      );

    await Promise.allSettled(updates);
  }
}

export const priceUpdater = new PriceUpdater();
