import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService, type CacheConfig } from '@/services/cache/cache-service';

export interface UseCacheOptions<T> extends CacheConfig {
  key: string;
  fetcher?: () => Promise<T>;
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseCacheReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
  set: (data: T) => Promise<void>;
}

/**
 * Hook for cached data with automatic fetching and invalidation
 */
export function useCache<T = any>(options: UseCacheOptions<T>): UseCacheReturn<T> {
  const {
    key,
    fetcher,
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    onSuccess,
    onError,
    ...cacheConfig
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchData = useCallback(async () => {
    if (!enabled || !fetcher) return;

    setIsLoading(true);
    setError(null);

    try {
      const cachedData = await cacheService.get<T>(key, {
        prefix: cacheConfig.prefix,
        memory: cacheConfig.memory,
      });

      if (cachedData !== null) {
        if (mountedRef.current) {
          setData(cachedData);
          setIsLoading(false);
          onSuccess?.(cachedData);
        }
        return;
      }

      // Cache miss, fetch new data
      const freshData = await fetcher();

      if (mountedRef.current) {
        setData(freshData);
        await cacheService.set(key, freshData, cacheConfig);
        onSuccess?.(freshData);
      }
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, fetcher, key, cacheConfig, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    await cacheService.invalidate(key, { prefix: cacheConfig.prefix });
    await fetchData();
  }, [key, cacheConfig.prefix, fetchData]);

  const set = useCallback(async (newData: T) => {
    await cacheService.set(key, newData, cacheConfig);
    setData(newData);
    onSuccess?.(newData);
  }, [key, cacheConfig, onSuccess]);

  // Initial fetch
  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    set,
  };
}

/**
 * Hook for multiple cached queries
 */
export function useCacheQueries<T = any>(
  queries: Array<UseCacheOptions<T>>
): Array<UseCacheReturn<T>> {
  const results = queries.map(query => useCache(query));
  return results;
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState(cacheService.getStats());
  const [hitRate, setHitRate] = useState(cacheService.getHitRate());
  const [memorySize, setMemorySize] = useState(cacheService.getMemorySize());

  const refresh = useCallback(() => {
    setStats(cacheService.getStats());
    setHitRate(cacheService.getHitRate());
    setMemorySize(cacheService.getMemorySize());
  }, []);

  const reset = useCallback(() => {
    cacheService.resetStats();
    refresh();
  }, [refresh]);

  const prune = useCallback(() => {
    const pruned = cacheService.pruneMemoryCache();
    refresh();
    return pruned;
  }, [refresh]);

  const clear = useCallback(async () => {
    await cacheService.clear();
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [refresh]);

  return {
    stats,
    hitRate,
    memorySize,
    refresh,
    reset,
    prune,
    clear,
    topItems: cacheService.getTopItems(),
  };
}

/**
 * Hook for prefetching data
 */
export function usePrefetch<T = any>() {
  const prefetch = useCallback(async (
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ) => {
    const cached = await cacheService.get<T>(key, {
      prefix: config.prefix,
      memory: config.memory,
    });

    if (cached === null) {
      const data = await fetcher();
      await cacheService.set(key, data, config);
      return data;
    }

    return cached;
  }, []);

  return { prefetch };
}
