import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PortfolioSnapshot {
  id: string;
  snapshot_date: string;
  total_value: number;
  cash_value: number;
  investment_value: number;
  daily_change: number;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export function usePortfolioSnapshots(userId: string | undefined, timeRange: TimeRange = '1M') {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDaysFromRange = (range: TimeRange): number => {
    switch (range) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '1Y': return 365;
      case 'ALL': return 3650;
      default: return 30;
    }
  };

  const fetchSnapshots = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const days = getDaysFromRange(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      setSnapshots(data || []);
      setError(null);
    } catch (err) {
      console.error('[usePortfolioSnapshots] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch snapshots');
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  const createSnapshot = useCallback(async (
    totalValue: number,
    cashValue: number,
    investmentValue: number
  ): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('portfolio_snapshots')
        .upsert({
          user_id: userId,
          snapshot_date: today,
          total_value: totalValue,
          cash_value: cashValue,
          investment_value: investmentValue,
          daily_change: 0,
        }, {
          onConflict: 'user_id,snapshot_date'
        });

      if (error) throw error;

      await fetchSnapshots();
    } catch (err) {
      console.error('[usePortfolioSnapshots] Error creating snapshot:', err);
      throw err;
    }
  }, [userId, fetchSnapshots]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  return {
    snapshots,
    loading,
    error,
    createSnapshot,
    refreshSnapshots: fetchSnapshots,
  };
}
