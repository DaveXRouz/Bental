/**
 * Performance Monitoring Utilities
 *
 * Provides tools for measuring and tracking application performance metrics.
 * Includes timing, memory, network, and render performance monitoring.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface TimingMark {
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timings: Map<string, TimingMark> = new Map();
  private observers: Set<(metric: PerformanceMetric) => void> = new Set();
  private maxMetrics: number = 1000;

  /**
   * Start timing an operation
   *
   * @param name - Unique name for the timing
   *
   * @example
   * ```tsx
   * performanceMonitor.startTiming('api-call');
   * await fetchData();
   * const duration = performanceMonitor.endTiming('api-call');
   * console.log(`API call took ${duration}ms`);
   * ```
   */
  startTiming(name: string): void {
    this.timings.set(name, {
      startTime: Date.now(),
    });
  }

  /**
   * End timing an operation and record the duration
   *
   * @param name - Name of the timing to end
   * @returns Duration in milliseconds
   */
  endTiming(name: string): number | null {
    const timing = this.timings.get(name);
    if (!timing) {
      console.warn(`[PerformanceMonitor] No timing found for: ${name}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - timing.startTime;

    timing.endTime = endTime;
    timing.duration = duration;

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: endTime,
    });

    this.timings.delete(name);
    return duration;
  }

  /**
   * Measure the execution time of a function
   *
   * @param name - Name for the measurement
   * @param fn - Function to measure
   * @returns Result of the function and duration
   *
   * @example
   * ```tsx
   * const { result, duration } = await performanceMonitor.measure(
   *   'heavy-calculation',
   *   () => calculateComplexValue()
   * );
   * ```
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.startTiming(name);
    const result = await fn();
    const duration = this.endTiming(name)!;
    return { result, duration };
  }

  /**
   * Record a custom metric
   *
   * @param metric - Metric to record
   *
   * @example
   * ```tsx
   * performanceMonitor.recordMetric({
   *   name: 'bundle-size',
   *   value: 5.37,
   *   unit: 'MB',
   *   timestamp: Date.now(),
   * });
   * ```
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Notify observers
    this.observers.forEach(observer => observer(metric));
  }

  /**
   * Get all recorded metrics
   *
   * @param filter - Optional filter function
   * @returns Array of metrics
   */
  getMetrics(filter?: (metric: PerformanceMetric) => boolean): PerformanceMetric[] {
    return filter ? this.metrics.filter(filter) : [...this.metrics];
  }

  /**
   * Get metrics by name
   *
   * @param name - Metric name to filter by
   * @returns Array of matching metrics
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average value for a metric
   *
   * @param name - Metric name
   * @returns Average value or null if no metrics found
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get percentile value for a metric
   *
   * @param name - Metric name
   * @param percentile - Percentile (0-100)
   * @returns Percentile value or null
   */
  getPercentile(name: string, percentile: number): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const sorted = metrics.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Subscribe to metric recordings
   *
   * @param observer - Callback function
   * @returns Unsubscribe function
   *
   * @example
   * ```tsx
   * const unsubscribe = performanceMonitor.subscribe((metric) => {
   *   console.log('New metric:', metric);
   *   if (metric.value > 1000) {
   *     alert('Slow operation detected!');
   *   }
   * });
   *
   * // Later
   * unsubscribe();
   * ```
   */
  subscribe(observer: (metric: PerformanceMetric) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timings.clear();
  }

  /**
   * Get summary statistics for all metrics
   *
   * @returns Summary object
   */
  getSummary(): Record<string, {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  }> {
    const summary: Record<string, any> = {};

    const uniqueNames = new Set(this.metrics.map(m => m.name));

    uniqueNames.forEach(name => {
      const metrics = this.getMetricsByName(name);
      const values = metrics.map(m => m.value).sort((a, b) => a - b);

      summary[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p50: this.getPercentile(name, 50) || 0,
        p95: this.getPercentile(name, 95) || 0,
        p99: this.getPercentile(name, 99) || 0,
      };
    });

    return summary;
  }

  /**
   * Export metrics as JSON
   *
   * @returns JSON string of all metrics
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getSummary(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

/**
 * Memory monitoring utilities
 */
export const MemoryMonitor = {
  /**
   * Get current memory usage (Web only)
   *
   * @returns Memory info or null if not available
   */
  getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; limit: number } | null {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory;
    }
    return null;
  },

  /**
   * Check if memory usage is high
   *
   * @param threshold - Threshold percentage (default: 90)
   * @returns True if usage exceeds threshold
   */
  isMemoryHigh(threshold: number = 90): boolean {
    const memory = this.getMemoryUsage();
    if (!memory) return false;

    const usagePercent = (memory.usedJSHeapSize / memory.limit) * 100;
    return usagePercent > threshold;
  },

  /**
   * Log memory usage
   */
  logMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    if (!memory) {
      console.log('[MemoryMonitor] Memory info not available');
      return;
    }

    const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const total = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const limit = (memory.limit / 1024 / 1024).toFixed(2);

    console.log(
      `[MemoryMonitor] Used: ${used}MB / Total: ${total}MB / Limit: ${limit}MB`
    );
  },
};

/**
 * Render performance monitoring
 */
export const RenderMonitor = {
  timings: new Map<string, number[]>(),

  /**
   * Track component render time
   *
   * @param componentName - Name of the component
   * @param renderTime - Time taken to render
   */
  trackRender(componentName: string, renderTime: number): void {
    if (!this.timings.has(componentName)) {
      this.timings.set(componentName, []);
    }
    this.timings.get(componentName)!.push(renderTime);
  },

  /**
   * Get render statistics for a component
   *
   * @param componentName - Component name
   * @returns Statistics object
   */
  getStats(componentName: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const timings = this.timings.get(componentName);
    if (!timings || timings.length === 0) return null;

    return {
      count: timings.length,
      avg: timings.reduce((a, b) => a + b, 0) / timings.length,
      min: Math.min(...timings),
      max: Math.max(...timings),
    };
  },

  /**
   * Get all render statistics
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, any> = {};
    this.timings.forEach((_, name) => {
      stats[name] = this.getStats(name);
    });
    return stats;
  },

  /**
   * Clear render timings
   */
  clear(): void {
    this.timings.clear();
  },
};

/**
 * Network performance monitoring
 */
export const NetworkMonitor = {
  requests: [] as Array<{
    url: string;
    method: string;
    duration: number;
    status?: number;
    size?: number;
    timestamp: number;
  }>,

  /**
   * Record a network request
   */
  recordRequest(
    url: string,
    method: string,
    duration: number,
    status?: number,
    size?: number
  ): void {
    this.requests.push({
      url,
      method,
      duration,
      status,
      size,
      timestamp: Date.now(),
    });

    // Keep last 100 requests
    if (this.requests.length > 100) {
      this.requests.shift();
    }
  },

  /**
   * Get average request duration
   */
  getAverageDuration(): number {
    if (this.requests.length === 0) return 0;
    const sum = this.requests.reduce((acc, r) => acc + r.duration, 0);
    return sum / this.requests.length;
  },

  /**
   * Get slow requests (> threshold ms)
   */
  getSlowRequests(threshold: number = 1000): typeof this.requests {
    return this.requests.filter(r => r.duration > threshold);
  },

  /**
   * Get failed requests
   */
  getFailedRequests(): typeof this.requests {
    return this.requests.filter(r => r.status && r.status >= 400);
  },

  /**
   * Clear request history
   */
  clear(): void {
    this.requests = [];
  },
};

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type { PerformanceMetric, TimingMark };
