import { useEffect, useState } from 'react';
import {
  performanceMonitor,
  PerformanceReport,
  getMemoryUsage,
  MemoryUsage,
  networkMonitor,
} from '@/utils/performance-monitoring';

export function usePerformanceMonitor(metricName?: string) {
  const [report, setReport] = useState<PerformanceReport>(() =>
    performanceMonitor.getReport(metricName)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setReport(performanceMonitor.getReport(metricName));
    }, 1000);

    return () => clearInterval(interval);
  }, [metricName]);

  return report;
}

export function useMemoryMonitor(interval: number = 5000) {
  const [memory, setMemory] = useState<MemoryUsage>(() => getMemoryUsage());

  useEffect(() => {
    const timer = setInterval(() => {
      setMemory(getMemoryUsage());
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return memory;
}

export function useNetworkMonitor() {
  const [avgDuration, setAvgDuration] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAvgDuration(networkMonitor.getAverageDuration());
      setFailedCount(networkMonitor.getFailedRequests().length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return {
    avgDuration,
    failedCount,
  };
}

export function usePerformanceScore() {
  const [score, setScore] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setScore(performanceMonitor.getPerformanceScore());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return score;
}
