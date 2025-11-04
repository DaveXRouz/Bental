import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { portfolioCalculator, PortfolioMetrics } from '@/services/portfolio/portfolio-calculator';

export function usePortfolioMetrics() {
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

  const calculateMetrics = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const calculatedMetrics = await portfolioCalculator.calculatePortfolioMetrics(user.id);
      setMetrics(calculatedMetrics);

      await portfolioCalculator.createPortfolioSnapshot(user.id, calculatedMetrics);

      await portfolioCalculator.updateLeaderboard(user.id);
    } catch (err: any) {
      console.error('Failed to calculate portfolio metrics:', err);
      setError(err.message || 'Failed to calculate metrics');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    calculateMetrics();

    const interval = setInterval(() => {
      calculateMetrics();
    }, 60000);

    return () => clearInterval(interval);
  }, [calculateMetrics]);

  const refetch = useCallback(() => {
    setLoading(true);
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch
  };
}
