import { useState, useCallback, useEffect } from 'react';
import {
  getAllPendingSellOrders,
  approveSellOrder,
  rejectSellOrder,
  type ApprovalRequest,
  type RejectionRequest,
} from '@/services/portfolio/portfolio-operations-service';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';

interface PendingSellOrderWithDetails {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  asset_type: string;
  quantity: number;
  estimated_price: number;
  estimated_total: number;
  status: string;
  approval_status: string;
  submitted_at: string;
  user_notes?: string;
  expires_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  accounts?: {
    name: string;
    account_type: string;
  };
}

/**
 * Hook for admin portfolio operations
 * Provides methods for reviewing and approving/rejecting pending sell orders
 */
export function useAdminPortfolio() {
  const [pendingOrders, setPendingOrders] = useState<PendingSellOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  /**
   * Fetch all pending sell orders for review
   */
  const fetchPendingOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const orders = await getAllPendingSellOrders();
      setPendingOrders(orders as PendingSellOrderWithDetails[]);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch pending orders';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Approve a pending sell order
   */
  const approveSell = useCallback(
    async (request: ApprovalRequest) => {
      setLoading(true);
      setError(null);

      try {
        const result = await approveSellOrder(request);

        if (result.success) {
          showToast('Sell order approved and executed successfully', 'success');
          // Refresh the list
          await fetchPendingOrders();
          return result;
        } else {
          setError(result.error || 'Failed to approve sell order');
          showToast(result.error || 'Failed to approve sell order', 'error');
          return null;
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to approve sell order';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchPendingOrders]
  );

  /**
   * Reject a pending sell order
   */
  const rejectSell = useCallback(
    async (request: RejectionRequest) => {
      setLoading(true);
      setError(null);

      try {
        const result = await rejectSellOrder(request);

        if (result.success) {
          showToast('Sell order rejected successfully', 'success');
          // Refresh the list
          await fetchPendingOrders();
          return result;
        } else {
          setError(result.error || 'Failed to reject sell order');
          showToast(result.error || 'Failed to reject sell order', 'error');
          return null;
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to reject sell order';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchPendingOrders]
  );

  /**
   * Set up real-time subscription for new pending orders
   */
  useEffect(() => {
    const channel = supabase
      .channel('pending_sell_orders_admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_sell_orders',
          filter: 'status=eq.pending',
        },
        (payload) => {
          console.log('Pending order change detected:', payload);
          // Refresh the list when changes occur
          fetchPendingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingOrders]);

  return {
    pendingOrders,
    loading,
    error,
    fetchPendingOrders,
    approveSell,
    rejectSell,
  };
}

/**
 * Hook for getting statistics about pending orders
 */
export function usePendingOrderStats() {
  const [stats, setStats] = useState({
    total: 0,
    pending_review: 0,
    under_review: 0,
    total_value: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('pending_sell_orders')
        .select('approval_status, estimated_total')
        .eq('status', 'pending');

      if (error) throw error;

      if (data) {
        const total = data.length;
        const pending_review = data.filter((o) => o.approval_status === 'pending_review').length;
        const under_review = data.filter((o) => o.approval_status === 'under_review').length;
        const total_value = data.reduce((sum, o) => sum + Number(o.estimated_total), 0);

        setStats({
          total,
          pending_review,
          under_review,
          total_value,
        });
      }
    } catch (err) {
      console.error('Failed to fetch pending order stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription
    const channel = supabase
      .channel('pending_orders_stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_sell_orders',
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
