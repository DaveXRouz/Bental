import { supabase } from '@/lib/supabase';
import marketDataService from '@/services/marketData';

export interface TradeOrder {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  accountId: string;
}

export interface TradeResult {
  success: boolean;
  tradeId?: string;
  message: string;
  executedPrice?: number;
  executedQuantity?: number;
  totalCost?: number;
  error?: string;
}

export interface TradeValidation {
  valid: boolean;
  error?: string;
  currentPrice?: number;
  estimatedCost?: number;
  availableBalance?: number;
  availableShares?: number;
}

class TradeExecutor {
  /**
   * Validate a trade before execution
   */
  async validateTrade(order: TradeOrder, userId: string): Promise<TradeValidation> {
    try {
      // Get current market price
      const quote = await marketDataService.getQuote(order.symbol);
      const currentPrice = quote.price;

      if (!currentPrice || currentPrice <= 0) {
        return {
          valid: false,
          error: 'Unable to fetch current market price for this symbol',
        };
      }

      // Calculate execution price
      const executionPrice = order.orderType === 'limit' && order.limitPrice
        ? order.limitPrice
        : currentPrice;

      // Validate quantity
      if (order.quantity <= 0) {
        return {
          valid: false,
          error: 'Quantity must be greater than zero',
        };
      }

      if (order.side === 'buy') {
        // Validate buying power
        const { data: account } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', order.accountId)
          .eq('user_id', userId)
          .single();

        if (!account) {
          return {
            valid: false,
            error: 'Account not found',
          };
        }

        const estimatedCost = executionPrice * order.quantity;
        const availableBalance = Number(account.balance);

        if (availableBalance < estimatedCost) {
          return {
            valid: false,
            error: 'Insufficient buying power',
            currentPrice,
            estimatedCost,
            availableBalance,
          };
        }

        return {
          valid: true,
          currentPrice,
          estimatedCost,
          availableBalance,
        };
      } else {
        // Validate selling - check if user owns enough shares
        const { data: holding } = await supabase
          .from('holdings')
          .select('quantity')
          .eq('account_id', order.accountId)
          .eq('symbol', order.symbol)
          .maybeSingle();

        const availableShares = holding ? Number(holding.quantity) : 0;

        if (availableShares < order.quantity) {
          return {
            valid: false,
            error: `Insufficient shares. You own ${availableShares} shares`,
            currentPrice,
            availableShares,
          };
        }

        return {
          valid: true,
          currentPrice,
          estimatedCost: executionPrice * order.quantity,
          availableShares,
        };
      }
    } catch (error: any) {
      console.error('Trade validation error:', error);
      return {
        valid: false,
        error: error.message || 'Validation failed',
      };
    }
  }

  /**
   * Execute a buy order
   */
  private async executeBuy(
    order: TradeOrder,
    userId: string,
    executionPrice: number
  ): Promise<TradeResult> {
    try {
      const totalCost = executionPrice * order.quantity;

      // 1. Create trade record
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: userId,
          account_id: order.accountId,
          symbol: order.symbol,
          side: 'buy',
          order_type: order.orderType,
          quantity: order.quantity,
          filled_quantity: order.quantity,
          price: order.orderType === 'limit' ? order.limitPrice : null,
          filled_price: executionPrice,
          avg_price: executionPrice,
          total: totalCost,
          fee: 0,
          status: 'filled',
          executed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // 2. Deduct from account balance
      const { error: balanceError } = await supabase.rpc('update_account_balance', {
        p_account_id: order.accountId,
        p_amount: -totalCost,
      });

      if (balanceError) {
        // Rollback trade if balance update fails
        await supabase.from('trades').delete().eq('id', trade.id);
        throw new Error('Failed to update account balance');
      }

      // 3. Update or create holding
      const { data: existingHolding } = await supabase
        .from('holdings')
        .select('*')
        .eq('account_id', order.accountId)
        .eq('symbol', order.symbol)
        .maybeSingle();

      if (existingHolding) {
        // Update existing holding
        const currentQty = Number(existingHolding.quantity);
        const currentCost = Number(existingHolding.average_cost);
        const newQty = currentQty + order.quantity;
        const newAvgCost = ((currentQty * currentCost) + (order.quantity * executionPrice)) / newQty;

        const { error: updateError } = await supabase
          .from('holdings')
          .update({
            quantity: newQty,
            average_cost: newAvgCost,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingHolding.id);

        if (updateError) throw updateError;
      } else {
        // Create new holding
        const { error: createError } = await supabase
          .from('holdings')
          .insert({
            account_id: order.accountId,
            user_id: userId,
            symbol: order.symbol,
            asset_type: 'stock',
            quantity: order.quantity,
            average_cost: executionPrice,
            current_price: executionPrice,
            market_value: totalCost,
          });

        if (createError) throw createError;
      }

      return {
        success: true,
        tradeId: trade.id,
        message: `Successfully purchased ${order.quantity} shares of ${order.symbol}`,
        executedPrice: executionPrice,
        executedQuantity: order.quantity,
        totalCost,
      };
    } catch (error: any) {
      console.error('Buy execution error:', error);
      return {
        success: false,
        message: 'Failed to execute buy order',
        error: error.message,
      };
    }
  }

  /**
   * Execute a sell order
   */
  private async executeSell(
    order: TradeOrder,
    userId: string,
    executionPrice: number
  ): Promise<TradeResult> {
    try {
      const totalProceeds = executionPrice * order.quantity;

      // 1. Create trade record
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: userId,
          account_id: order.accountId,
          symbol: order.symbol,
          side: 'sell',
          order_type: order.orderType,
          quantity: order.quantity,
          filled_quantity: order.quantity,
          price: order.orderType === 'limit' ? order.limitPrice : null,
          filled_price: executionPrice,
          avg_price: executionPrice,
          total: totalProceeds,
          fee: 0,
          status: 'filled',
          executed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // 2. Add to account balance
      const { error: balanceError } = await supabase.rpc('update_account_balance', {
        p_account_id: order.accountId,
        p_amount: totalProceeds,
      });

      if (balanceError) {
        // Rollback trade if balance update fails
        await supabase.from('trades').delete().eq('id', trade.id);
        throw new Error('Failed to update account balance');
      }

      // 3. Update holding (decrease quantity)
      const { data: holding } = await supabase
        .from('holdings')
        .select('*')
        .eq('account_id', order.accountId)
        .eq('symbol', order.symbol)
        .single();

      if (!holding) {
        throw new Error('Holding not found');
      }

      const newQty = Number(holding.quantity) - order.quantity;

      if (newQty <= 0) {
        // Delete holding if quantity reaches zero
        const { error: deleteError } = await supabase
          .from('holdings')
          .delete()
          .eq('id', holding.id);

        if (deleteError) throw deleteError;
      } else {
        // Update quantity
        const { error: updateError } = await supabase
          .from('holdings')
          .update({
            quantity: newQty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', holding.id);

        if (updateError) throw updateError;
      }

      return {
        success: true,
        tradeId: trade.id,
        message: `Successfully sold ${order.quantity} shares of ${order.symbol}`,
        executedPrice: executionPrice,
        executedQuantity: order.quantity,
        totalCost: totalProceeds,
      };
    } catch (error: any) {
      console.error('Sell execution error:', error);
      return {
        success: false,
        message: 'Failed to execute sell order',
        error: error.message,
      };
    }
  }

  /**
   * Execute a trade order
   */
  async executeTrade(order: TradeOrder, userId: string): Promise<TradeResult> {
    try {
      // 1. Validate trade
      const validation = await this.validateTrade(order, userId);

      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Trade validation failed',
          error: validation.error,
        };
      }

      // 2. Determine execution price
      const executionPrice = order.orderType === 'limit' && order.limitPrice
        ? order.limitPrice
        : validation.currentPrice!;

      // 3. Execute based on side
      if (order.side === 'buy') {
        return await this.executeBuy(order, userId, executionPrice);
      } else {
        return await this.executeSell(order, userId, executionPrice);
      }
    } catch (error: any) {
      console.error('Trade execution error:', error);
      return {
        success: false,
        message: 'Trade execution failed',
        error: error.message,
      };
    }
  }

  /**
   * Get recent trades for a user
   */
  async getRecentTrades(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      return [];
    }
  }
}

export const tradeExecutor = new TradeExecutor();
