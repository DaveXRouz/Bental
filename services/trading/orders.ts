import { supabase } from '@/lib/supabase';

export interface OrderRequest {
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
}

export interface Order {
  id: string;
  account_id: string;
  symbol: string;
  asset_type: string;
  order_type: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  stop_price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  filled_quantity: number;
  created_at: string;
  updated_at: string;
  filled_at?: string;
  cancelled_at?: string;
}

export async function placeOrder(request: OrderRequest): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const { data, error} = await supabase
      .from('orders')
      .insert({
        account_id: request.accountId,
        symbol: request.symbol.toUpperCase(),
        asset_type: 'stock',
        order_type: request.type,
        side: request.side,
        quantity: request.quantity,
        filled_quantity: 0,
        price: request.limitPrice || 0,
        stop_price: request.stopPrice,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, order: data as Order };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to place order' };
  }
}

export async function getAccountOrders(accountId: string, limit: number = 50): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return data as Order[];
  } catch (error) {
    return [];
  }
}

export async function cancelOrder(orderId: string, accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('account_id', accountId)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to cancel order' };
  }
}

export async function getOrderById(orderId: string, accountId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('account_id', accountId)
      .single();

    if (error) {
      return null;
    }

    return data as Order;
  } catch (error) {
    return null;
  }
}

export function calculateOrderEstimate(
  quantity: number,
  price: number,
  side: 'buy' | 'sell'
): { total: number; commission: number; net: number } {
  const total = quantity * price;
  const commission = Math.max(total * 0.0001, 1);
  const net = side === 'buy' ? total + commission : total - commission;

  return { total, commission, net };
}
