import { supabase } from '@/lib/supabase';

/**
 * Portfolio Operations Service
 *
 * Handles all portfolio management operations including:
 * - Instant buy orders
 * - Pending sell orders with admin approval
 * - Portfolio state management
 * - Order cancellation
 */

export interface PendingSellOrder {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  asset_type: 'stock' | 'crypto' | 'etf' | 'bond';
  quantity: number;
  estimated_price: number;
  estimated_total: number;
  actual_price?: number;
  actual_total?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  approval_status: 'pending_review' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  executed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  user_notes?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioState {
  success: boolean;
  account: {
    id: string;
    name: string;
    balance: number;
    currency: string;
  };
  holdings: Array<{
    id: string;
    symbol: string;
    asset_type: string;
    quantity: number;
    average_cost: number;
    current_price: number;
    market_value: number;
    unrealized_pnl: number;
    unrealized_pnl_percent: number;
  }>;
  total_holdings_value: number;
  total_portfolio_value: number;
  total_pnl: number;
  pending_orders: Array<{
    id: string;
    symbol: string;
    quantity: number;
    estimated_price: number;
    estimated_total: number;
    status: string;
    submitted_at: string;
  }>;
}

export interface BuyOrderRequest {
  account_id: string;
  symbol: string;
  asset_type: 'stock' | 'crypto' | 'etf' | 'bond';
  quantity: number;
  price: number;
}

export interface SellOrderRequest {
  account_id: string;
  symbol: string;
  asset_type: 'stock' | 'crypto' | 'etf' | 'bond';
  quantity: number;
  estimated_price: number;
  user_notes?: string;
}

export interface ApprovalRequest {
  order_id: string;
  actual_price: number;
  admin_notes?: string;
}

export interface RejectionRequest {
  order_id: string;
  rejection_reason: string;
  admin_notes?: string;
}

/**
 * Execute an instant buy order
 * - Validates account balance
 * - Deducts funds from account
 * - Updates or creates holding
 * - Creates trade record
 * - Logs audit trail
 */
export async function executeInstantBuy(request: BuyOrderRequest) {
  try {
    const { data, error } = await supabase.rpc('execute_instant_buy', {
      p_account_id: request.account_id,
      p_symbol: request.symbol,
      p_asset_type: request.asset_type,
      p_quantity: request.quantity,
      p_price: request.price,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Execute instant buy error:', error);
    throw new Error(error.message || 'Failed to execute buy order');
  }
}

/**
 * Create a pending sell order that requires admin approval
 * - Validates user has sufficient holdings
 * - Creates pending order
 * - Logs audit trail
 * - Holdings remain locked until approval/rejection
 */
export async function createPendingSellOrder(request: SellOrderRequest) {
  try {
    const { data, error } = await supabase.rpc('create_pending_sell_order', {
      p_account_id: request.account_id,
      p_symbol: request.symbol,
      p_asset_type: request.asset_type,
      p_quantity: request.quantity,
      p_estimated_price: request.estimated_price,
      p_user_notes: request.user_notes || null,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Create pending sell order error:', error);
    throw new Error(error.message || 'Failed to create sell order');
  }
}

/**
 * Admin function to approve a pending sell order
 * - Validates admin privileges
 * - Executes the sell order
 * - Credits account balance
 * - Updates or removes holding
 * - Creates trade record
 * - Logs audit trail
 */
export async function approveSellOrder(request: ApprovalRequest) {
  try {
    const { data, error } = await supabase.rpc('approve_sell_order', {
      p_order_id: request.order_id,
      p_actual_price: request.actual_price,
      p_admin_notes: request.admin_notes || null,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Approve sell order error:', error);
    throw new Error(error.message || 'Failed to approve sell order');
  }
}

/**
 * Admin function to reject a pending sell order
 * - Validates admin privileges
 * - Updates order status to rejected
 * - Logs rejection reason
 * - Logs audit trail
 * - Holdings remain with user
 */
export async function rejectSellOrder(request: RejectionRequest) {
  try {
    const { data, error } = await supabase.rpc('reject_sell_order', {
      p_order_id: request.order_id,
      p_rejection_reason: request.rejection_reason,
      p_admin_notes: request.admin_notes || null,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Reject sell order error:', error);
    throw new Error(error.message || 'Failed to reject sell order');
  }
}

/**
 * Cancel a pending sell order (user action)
 * - Validates user ownership
 * - Only allows cancellation of pending orders
 * - Updates order status
 * - Logs audit trail
 */
export async function cancelPendingSellOrder(orderId: string) {
  try {
    const { data, error } = await supabase.rpc('cancel_pending_sell_order', {
      p_order_id: orderId,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Cancel pending sell order error:', error);
    throw new Error(error.message || 'Failed to cancel sell order');
  }
}

/**
 * Get complete portfolio state for an account
 * - Account balance
 * - All holdings with current values
 * - Total portfolio value
 * - Unrealized P&L
 * - Pending sell orders
 */
export async function getPortfolioState(accountId: string): Promise<PortfolioState> {
  try {
    const { data, error } = await supabase.rpc('get_user_portfolio_state', {
      p_account_id: accountId,
    });

    if (error) throw error;
    return data as PortfolioState;
  } catch (error: any) {
    console.error('Get portfolio state error:', error);
    throw new Error(error.message || 'Failed to get portfolio state');
  }
}

/**
 * Get holdings with availability information
 * Returns holdings with total, locked, and available quantities
 */
export async function getHoldingsWithAvailability(accountId: string) {
  try {
    const { data, error } = await supabase.rpc('get_holdings_with_availability', {
      p_account_id: accountId,
    });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get holdings with availability error:', error);
    throw new Error(error.message || 'Failed to fetch holdings');
  }
}

/**
 * Get all pending sell orders for a user
 */
export async function getUserPendingSellOrders(userId: string) {
  try {
    const { data, error } = await supabase
      .from('pending_sell_orders')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'under_review'])
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data as PendingSellOrder[];
  } catch (error: any) {
    console.error('Get user pending sell orders error:', error);
    throw new Error(error.message || 'Failed to fetch pending orders');
  }
}

/**
 * Get all pending sell orders for admin review
 *
 * Note: Uses implicit join with profiles table.
 * Both pending_sell_orders.user_id and profiles.id reference auth.users.id,
 * so Supabase can automatically infer the relationship.
 */
export async function getAllPendingSellOrders() {
  try {
    const { data, error } = await supabase
      .from('pending_sell_orders')
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        accounts (
          name,
          account_type
        )
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch pending sell orders:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Get all pending sell orders error:', error);
    throw new Error(error.message || 'Failed to fetch pending orders');
  }
}

/**
 * Get portfolio operations audit log
 */
export async function getPortfolioAuditLog(
  userId: string,
  accountId?: string,
  limit: number = 50
) {
  try {
    let query = supabase
      .from('portfolio_operations_audit')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Get portfolio audit log error:', error);
    throw new Error(error.message || 'Failed to fetch audit log');
  }
}

/**
 * Check if user has sufficient balance for a buy order
 */
export async function checkSufficientBalance(
  accountId: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; available: number }> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    const available = Number(data.balance);
    return {
      sufficient: available >= requiredAmount,
      available,
    };
  } catch (error: any) {
    console.error('Check sufficient balance error:', error);
    throw new Error(error.message || 'Failed to check balance');
  }
}

/**
 * Check if user has sufficient holdings for a sell order
 * Accounts for quantities locked in pending sell orders
 */
export async function checkSufficientHoldings(
  accountId: string,
  symbol: string,
  assetType: string,
  requiredQuantity: number
): Promise<{ sufficient: boolean; available: number; total?: number; locked?: number }> {
  try {
    // Use RPC to get available quantity (accounts for pending orders)
    const { data, error } = await supabase.rpc('get_available_quantity', {
      p_account_id: accountId,
      p_symbol: symbol,
      p_asset_type: assetType,
    });

    if (error) throw error;

    const available = data ? Number(data) : 0;

    // Also get total holdings for informational purposes
    const { data: holdingData } = await supabase
      .from('holdings')
      .select('quantity')
      .eq('account_id', accountId)
      .eq('symbol', symbol)
      .eq('asset_type', assetType)
      .maybeSingle();

    const total = holdingData ? Number(holdingData.quantity) : 0;
    const locked = total - available;

    return {
      sufficient: available >= requiredQuantity,
      available,
      total,
      locked,
    };
  } catch (error: any) {
    console.error('Check sufficient holdings error:', error);
    throw new Error(error.message || 'Failed to check holdings');
  }
}
