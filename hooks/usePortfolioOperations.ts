import { useState, useCallback } from 'react';
import {
  executeInstantBuy,
  createPendingSellOrder,
  cancelPendingSellOrder,
  getPortfolioState,
  getUserPendingSellOrders,
  checkSufficientBalance,
  checkSufficientHoldings,
  type BuyOrderRequest,
  type SellOrderRequest,
  type PortfolioState,
  type PendingSellOrder,
} from '@/services/portfolio/portfolio-operations-service';
import { useToast } from '@/contexts/ToastContext';

/**
 * Hook for portfolio operations (buy/sell/cancel)
 * Provides methods for executing trades and managing pending orders
 */
export function usePortfolioOperations(accountId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  /**
   * Execute an instant buy order
   */
  const executeBuyOrder = useCallback(
    async (request: Omit<BuyOrderRequest, 'account_id'>) => {
      if (!accountId) {
        setError('No account selected');
        showToast('Please select an account', 'error');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Check balance first
        const totalCost = request.quantity * request.price;
        const balanceCheck = await checkSufficientBalance(accountId, totalCost);

        if (!balanceCheck.sufficient) {
          const errorMsg = `Insufficient balance. Required: $${totalCost.toFixed(
            2
          )}, Available: $${balanceCheck.available.toFixed(2)}`;
          setError(errorMsg);
          showToast(errorMsg, 'error');
          return null;
        }

        // Execute buy
        const result = await executeInstantBuy({
          ...request,
          account_id: accountId,
        });

        if (result.success) {
          showToast(
            `Successfully purchased ${request.quantity} ${request.symbol}`,
            'success'
          );
          return result;
        } else {
          setError(result.error || 'Failed to execute buy order');
          showToast(result.error || 'Failed to execute buy order', 'error');
          return null;
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to execute buy order';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accountId, showToast]
  );

  /**
   * Create a pending sell order for admin approval
   */
  const createSellOrder = useCallback(
    async (request: Omit<SellOrderRequest, 'account_id'>) => {
      if (!accountId) {
        setError('No account selected');
        showToast('Please select an account', 'error');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Check holdings first
        const holdingsCheck = await checkSufficientHoldings(
          accountId,
          request.symbol,
          request.asset_type,
          request.quantity
        );

        if (!holdingsCheck.sufficient) {
          const errorMsg = `Insufficient holdings. Required: ${request.quantity}, Available: ${holdingsCheck.available}`;
          setError(errorMsg);
          showToast(errorMsg, 'error');
          return null;
        }

        // Create pending sell order
        const result = await createPendingSellOrder({
          ...request,
          account_id: accountId,
        });

        if (result.success) {
          showToast(
            `Sell order submitted for ${request.quantity} ${request.symbol}. Awaiting admin approval.`,
            'info'
          );
          return result;
        } else {
          setError(result.error || 'Failed to create sell order');
          showToast(result.error || 'Failed to create sell order', 'error');
          return null;
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to create sell order';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accountId, showToast]
  );

  /**
   * Cancel a pending sell order
   */
  const cancelSellOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await cancelPendingSellOrder(orderId);

        if (result.success) {
          showToast('Sell order cancelled successfully', 'success');
          return result;
        } else {
          setError(result.error || 'Failed to cancel sell order');
          showToast(result.error || 'Failed to cancel sell order', 'error');
          return null;
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to cancel sell order';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  return {
    executeBuyOrder,
    createSellOrder,
    cancelSellOrder,
    loading,
    error,
  };
}

/**
 * Hook for fetching portfolio state
 */
export function usePortfolioState(accountId?: string) {
  const [portfolioState, setPortfolioState] = useState<PortfolioState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioState = useCallback(async () => {
    if (!accountId) return;

    setLoading(true);
    setError(null);

    try {
      const state = await getPortfolioState(accountId);
      setPortfolioState(state);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch portfolio state';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  return {
    portfolioState,
    loading,
    error,
    refresh: fetchPortfolioState,
  };
}

/**
 * Hook for managing user's pending sell orders
 */
export function usePendingSellOrders(userId?: string) {
  const [pendingOrders, setPendingOrders] = useState<PendingSellOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingOrders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const orders = await getUserPendingSellOrders(userId);
      setPendingOrders(orders);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch pending orders';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    pendingOrders,
    loading,
    error,
    refresh: fetchPendingOrders,
  };
}
