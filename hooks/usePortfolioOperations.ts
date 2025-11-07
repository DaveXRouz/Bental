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
import { useToast } from '@/components/ui/ToastManager';

/**
 * Hook for portfolio operations (buy/sell/cancel)
 * Provides methods for executing trades and managing pending orders
 */
export function usePortfolioOperations(accountId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError: showErrorToast, showInfo } = useToast();

  /**
   * Execute an instant buy order
   */
  const executeBuyOrder = useCallback(
    async (request: Omit<BuyOrderRequest, 'account_id'>) => {
      if (!accountId) {
        setError('No account selected');
        showErrorToast('No account selected');
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
          showErrorToast('Insufficient Balance', errorMsg);
          return null;
        }

        // Execute buy
        const result = await executeInstantBuy({
          ...request,
          account_id: accountId,
        });

        if (result.success) {
          showSuccess(
            'Purchase Successful',
            `Successfully purchased ${request.quantity} ${request.symbol}`
          );
          return result;
        } else {
          setError(result.error || 'Failed to execute buy order');
          showErrorToast('Purchase Failed', result.error || 'Failed to execute buy order');
          return null;
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to execute buy order';
        setError(errorMsg);
        showErrorToast('Purchase Failed', errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accountId, showSuccess, showErrorToast]
  );

  /**
   * Create a pending sell order for admin approval
   */
  const createSellOrder = useCallback(
    async (request: Omit<SellOrderRequest, 'account_id'>) => {
      if (!accountId) {
        setError('No account selected');
        showErrorToast('No account selected');
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
          showErrorToast('Insufficient Holdings', errorMsg);
          return null;
        }

        // Create pending sell order
        const result = await createPendingSellOrder({
          ...request,
          account_id: accountId,
        });

        if (result.success) {
          showInfo(
            'Sell Order Submitted',
            `Sell order for ${request.quantity} ${request.symbol} submitted. Awaiting admin approval.`
          );
          return result;
        } else {
          setError(result.error || 'Failed to create sell order');
          showErrorToast('Sell Order Failed', result.error || 'Failed to create sell order');
          return null;
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to create sell order';
        setError(errorMsg);
        showErrorToast('Sell Order Failed', errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accountId, showInfo, showErrorToast]
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
          showSuccess('Sell order cancelled successfully');
          return result;
        } else {
          setError(result.error || 'Failed to cancel sell order');
          showErrorToast('Cancellation Failed', result.error || 'Failed to cancel sell order');
          return null;
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to cancel sell order';
        setError(errorMsg);
        showErrorToast('Cancellation Failed', errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showSuccess, showErrorToast]
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
