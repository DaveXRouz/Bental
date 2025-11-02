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
