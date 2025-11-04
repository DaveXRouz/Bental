import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCache } from './useCache';

interface Holding {
  id: string;
  account_id: string;
  symbol: string;
  asset_type: string;
  quantity: number;
  average_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  updated_at: string;
}

/**
 * Custom hook for managing portfolio holdings
 *
 * Fetches and caches holdings for a specific account with automatic refresh.
 * Uses in-memory caching with 30-second TTL and 60-second refetch interval.
 *
 * @param {string} [accountId] - Optional account ID to fetch holdings for
 * @returns {Object} Holdings management object
 * @returns {Holding[]} holdings - Array of holdings for the account
 * @returns {boolean} loading - Loading state
 * @returns {string | null} error - Error message if fetch fails
 * @returns {Function} refetch - Manual refetch function
 * @returns {Function} getTotalValue - Calculate total market value
 * @returns {Function} getTotalPnL - Calculate total unrealized profit/loss
 *
 * @example
 * ```tsx
 * const { holdings, loading, getTotalValue, getTotalPnL } = useHoldings(accountId);
 *
 * const totalValue = getTotalValue();
 * const totalPnL = getTotalPnL();
 * const totalReturn = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;
 *
 * return (
 *   <View>
 *     <Text>Portfolio Value: ${totalValue.toFixed(2)}</Text>
 *     <Text style={{ color: totalPnL >= 0 ? 'green' : 'red' }}>
 *       P&L: ${totalPnL.toFixed(2)} ({totalReturn.toFixed(2)}%)
 *     </Text>
 *     {holdings.map(holding => (
 *       <HoldingCard key={holding.id} holding={holding} />
 *     ))}
 *   </View>
 * );
 * ```
 */
export function useHoldings(accountId?: string) {
  const {
    data: holdings,
    isLoading: loading,
    error: cacheError,
    refetch,
  } = useCache<Holding[]>({
    key: `holdings-${accountId || 'none'}`,
    fetcher: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('account_id', accountId)
        .order('market_value', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
    ttl: 30000,
    memory: true,
    prefix: 'holdings',
    refetchInterval: 60000,
  });

  const error = cacheError ? cacheError.message : null;

  const getTotalValue = () => {
    if (!holdings) return 0;
    return holdings.reduce((sum, holding) => sum + Number(holding.market_value), 0);
  };

  const getTotalPnL = () => {
    if (!holdings) return 0;
    return holdings.reduce((sum, holding) => sum + Number(holding.unrealized_pnl), 0);
  };

  return { holdings: holdings || [], loading, error, refetch, getTotalValue, getTotalPnL };
}
