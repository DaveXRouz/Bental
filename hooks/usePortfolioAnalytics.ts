import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { portfolioAnalyticsService, PortfolioSnapshot, PerformanceSummary, AssetAllocation } from '@/services/analytics/portfolio-analytics-service';

export function usePortfolioAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    console.clear();
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const [snapshotsData, summaryData] = await Promise.all([
        portfolioAnalyticsService.getSnapshots(user.id),
        portfolioAnalyticsService.getPerformanceSummary(user.id),
      ]);

      setSnapshots(snapshotsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching portfolio analytics:', err);
      setError('Failed to load portfolio analytics');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createSnapshot = useCallback(async (date?: string) => {
    console.clear();
    if (!user?.id) return null;

    try {
      const snapshotId = await portfolioAnalyticsService.createSnapshot(user.id, date);
      if (snapshotId) {
        await fetchData();
      }
      return snapshotId;
    } catch (err) {
      console.error('Error creating snapshot:', err);
      return null;
    }
  }, [user?.id, fetchData]);

  const exportReport = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    if (!user?.id) return '';
    return portfolioAnalyticsService.exportPerformanceReport(user.id, format);
  }, [user?.id]);

  return {
    loading,
    snapshots,
    summary,
    error,
    refresh: fetchData,
    createSnapshot,
    exportReport,
  };
}

export function useAssetAllocation(date?: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<AssetAllocation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    console.clear();
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await portfolioAnalyticsService.getAssetAllocations(user.id, date);
      setAllocations(data);
    } catch (err) {
      console.error('Error fetching asset allocations:', err);
      setError('Failed to load asset allocations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, date]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  return {
    loading,
    allocations,
    error,
    refresh: fetchAllocations,
  };
}

export function usePerformanceChart(period: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month') {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    console.clear();
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const today = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(today);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(2020, 0, 1);
          break;
      }

      const snapshots = await portfolioAnalyticsService.getSnapshots(
        user.id,
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      const data = snapshots
        .reverse()
        .map(snapshot => ({
          date: snapshot.snapshot_date,
          value: snapshot.total_value,
        }));

      setChartData(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, period]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  return {
    loading,
    chartData,
    error,
    refresh: fetchChartData,
  };
}
