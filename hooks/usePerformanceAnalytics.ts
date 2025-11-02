import { useState, useEffect, useCallback } from 'react';
import { performanceTracker } from '@/services/analytics/performance-tracker';

export interface PerformanceTrendPoint {
  recorded_at: string;
  overall_score: number;
  cache_hit_rate: number;
  avg_response_time: number;
}

export interface PerformanceAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  threshold_value: number;
  actual_value: number;
  status: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export function usePerformanceAnalytics() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [trend, setTrend] = useState<PerformanceTrendPoint[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [recentMetrics, trendData, activeAlerts] = await Promise.all([
        performanceTracker.getRecentMetrics(50),
        performanceTracker.getPerformanceTrend(),
        performanceTracker.getActiveAlerts(),
      ]);

      setMetrics(recentMetrics);
      setTrend(trendData);
      setAlerts(activeAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('[usePerformanceAnalytics] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();

    // Refresh every 5 minutes
    const interval = setInterval(loadAnalytics, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadAnalytics]);

  const acknowledgeAlert = useCallback(async (alertId: string, userId: string) => {
    try {
      await performanceTracker.acknowledgeAlert(alertId, userId);
      await loadAnalytics(); // Refresh alerts
    } catch (err) {
      console.error('[usePerformanceAnalytics] Error acknowledging alert:', err);
      throw err;
    }
  }, [loadAnalytics]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await performanceTracker.resolveAlert(alertId);
      await loadAnalytics(); // Refresh alerts
    } catch (err) {
      console.error('[usePerformanceAnalytics] Error resolving alert:', err);
      throw err;
    }
  }, [loadAnalytics]);

  const getLatestMetric = useCallback(() => {
    return metrics.length > 0 ? metrics[0] : null;
  }, [metrics]);

  const getAverageScore = useCallback(() => {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + (m.overall_score || 0), 0);
    return Math.round(sum / metrics.length);
  }, [metrics]);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(a => a.severity === 'critical');
  }, [alerts]);

  const getWarningAlerts = useCallback(() => {
    return alerts.filter(a => a.severity === 'warning' || a.severity === 'error');
  }, [alerts]);

  return {
    metrics,
    trend,
    alerts,
    loading,
    error,
    refresh: loadAnalytics,
    acknowledgeAlert,
    resolveAlert,
    getLatestMetric,
    getAverageScore,
    getCriticalAlerts,
    getWarningAlerts,
  };
}

export function usePerformanceTracking(autoStart: boolean = false) {
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (autoStart) {
      performanceTracker.startTracking(60000); // Track every minute
      setIsTracking(true);

      return () => {
        performanceTracker.stopTracking();
        setIsTracking(false);
      };
    }
  }, [autoStart]);

  const startTracking = useCallback((intervalMs: number = 60000) => {
    performanceTracker.startTracking(intervalMs);
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    performanceTracker.stopTracking();
    setIsTracking(false);
  }, []);

  const trackNow = useCallback(async () => {
    await performanceTracker.trackCurrentMetrics();
  }, []);

  return {
    isTracking,
    startTracking,
    stopTracking,
    trackNow,
  };
}
