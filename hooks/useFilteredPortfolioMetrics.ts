import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { portfolioCalculator, PortfolioMetrics } from '@/services/portfolio/portfolio-calculator';

export function useFilteredPortfolioMetrics(selectedAccountIds: string[] = []) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalValue: 0,
    cashBalance: 0,
    investmentBalance: 0,
    todayChange: 0,
    todayChangePercent: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    dayChangeByHolding: new Map()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateFilteredMetrics = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const isAllAccounts = selectedAccountIds.length === 0;

      if (isAllAccounts) {
        const calculatedMetrics = await portfolioCalculator.calculatePortfolioMetrics(user.id);
        setMetrics(calculatedMetrics);
      } else {
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, balance')
          .eq('user_id', user.id)
          .in('id', selectedAccountIds)
          .eq('status', 'active');

        const accountsList = accounts || [];

        const cashBalance = accountsList.reduce((sum, acc) => sum + Number(acc.balance), 0);

        const { data: holdings } = await supabase
          .from('holdings')
          .select('asset_type, market_value, unrealized_pnl, day_change, symbol, quantity, average_cost')
          .in('account_id', selectedAccountIds.length > 0 ? selectedAccountIds : ['00000000-0000-0000-0000-000000000000']);

        const holdingsList = holdings || [];

        const investmentBalance = holdingsList.reduce((sum, h) => sum + Number(h.market_value), 0);
        const totalValue = cashBalance + investmentBalance;

        const todayChange = holdingsList.reduce((sum, h) => sum + Number(h.day_change || 0), 0);
        const totalReturn = holdingsList.reduce((sum, h) => sum + Number(h.unrealized_pnl || 0), 0);

        const todayChangePercent = investmentBalance > 0 ? (todayChange / investmentBalance) * 100 : 0;

        const costBasis = holdingsList.reduce((sum, h) => {
          const marketValue = Number(h.market_value);
          const unrealizedPnl = Number(h.unrealized_pnl || 0);
          return sum + (marketValue - unrealizedPnl);
        }, 0);

        const totalReturnPercent = costBasis > 0 ? (totalReturn / costBasis) * 100 : 0;

        const dayChangeByHolding = new Map<string, number>();
        holdingsList.forEach(h => {
          dayChangeByHolding.set(h.symbol, Number(h.day_change || 0));
        });

        setMetrics({
          totalValue,
          cashBalance,
          investmentBalance,
          todayChange,
          todayChangePercent,
          totalReturn,
          totalReturnPercent,
          dayChangeByHolding,
        });
      }
    } catch (err: any) {
      console.error('Failed to calculate filtered portfolio metrics:', err);
      setError(err.message || 'Failed to calculate metrics');
    } finally {
      setLoading(false);
    }
  }, [user?.id, JSON.stringify(selectedAccountIds)]);

  useEffect(() => {
    calculateFilteredMetrics();

    const interval = setInterval(() => {
      calculateFilteredMetrics();
    }, 60000);

    return () => clearInterval(interval);
  }, [calculateFilteredMetrics]);

  const refetch = useCallback(() => {
    setLoading(true);
    calculateFilteredMetrics();
  }, [calculateFilteredMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch
  };
}
