import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheConfig {
  ttl: number;
  prefix?: string;
  memory?: boolean; // Use in-memory cache
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  keys: string[];
}

class CacheService {
  private prefix: string = 'app_cache';
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  private getKey(key: string, prefix?: string): string {
    return `${prefix || this.prefix}:${key}`;
  }

  async get<T>(key: string, config?: { prefix?: string; memory?: boolean }): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key, config?.prefix);

      // Try memory cache first
      if (config?.memory !== false) {
        const memoryEntry = this.memoryCache.get(cacheKey);
        if (memoryEntry) {
          const now = Date.now();
          if (now - memoryEntry.timestamp <= memoryEntry.ttl) {
            this.stats.hits++;
            memoryEntry.hits = (memoryEntry.hits || 0) + 1;
            return memoryEntry.data as T;
          } else {
            this.memoryCache.delete(cacheKey);
          }
        }
      }

      // Fall back to persistent storage
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        this.stats.misses++;
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      if (now - entry.timestamp > entry.ttl) {
        await AsyncStorage.removeItem(cacheKey);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      // Promote to memory cache if configured
      if (config?.memory !== false) {
        this.memoryCache.set(cacheKey, entry);
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    try {
      const cacheKey = this.getKey(key, config.prefix);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: config.ttl,
        hits: 0,
      };

      // Set in memory cache if configured
      if (config.memory) {
        this.memoryCache.set(cacheKey, entry);
      }

      // Always persist to storage
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(key: string, config?: { prefix?: string }): Promise<void> {
    try {
      const cacheKey = this.getKey(key, config?.prefix);

      // Remove from memory cache
      this.memoryCache.delete(cacheKey);

      // Remove from persistent storage
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  async invalidatePattern(pattern: string, config?: { prefix?: string }): Promise<void> {
    try {
      const prefix = config?.prefix || this.prefix;

      // Remove from memory cache
      const memoryKeys = Array.from(this.memoryCache.keys());
      memoryKeys.forEach(key => {
        if (key.startsWith(`${prefix}:${pattern}`)) {
          this.memoryCache.delete(key);
        }
      });

      // Remove from persistent storage
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(k => k.startsWith(`${prefix}:${pattern}`));
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    try {
      // Remove from memory cache
      const memoryKeys = Array.from(this.memoryCache.keys());
      memoryKeys.forEach(key => {
        if (key.startsWith(`${prefix}:`)) {
          this.memoryCache.delete(key);
        }
      });

      // Remove from persistent storage
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(k => k.startsWith(`${prefix}:`));
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      console.error('Cache invalidate prefix error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear persistent storage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(`${this.prefix}:`));
      await AsyncStorage.multiRemove(cacheKeys);

      // Reset stats
      this.stats = { hits: 0, misses: 0 };
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const cached = await this.get<T>(key, { prefix: config.prefix, memory: config.memory });

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, config);
    return data;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get memory cache size in bytes (approximate)
   */
  getMemorySize(): number {
    let size = 0;
    this.memoryCache.forEach((entry) => {
      size += JSON.stringify(entry).length;
    });
    return size;
  }

  /**
   * Prune expired entries from memory cache
   */
  pruneMemoryCache(): number {
    const now = Date.now();
    let pruned = 0;

    this.memoryCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        pruned++;
      }
    });

    return pruned;
  }

  /**
   * Get most accessed items
   */
  getTopItems(limit: number = 10): Array<{ key: string; hits: number; size: number; timestamp: number }> {
    const items: Array<{ key: string; hits: number; size: number; timestamp: number }> = [];

    this.memoryCache.forEach((entry, key) => {
      const size = JSON.stringify(entry.data).length;
      items.push({
        key,
        hits: entry.hits || 0,
        size,
        timestamp: entry.timestamp
      });
    });

    return items.sort((a, b) => b.hits - a.hits).slice(0, limit);
  }

  /**
   * Warm cache with data
   */
  async warm<T>(items: Array<{ key: string; data: T; config: CacheConfig }>): Promise<void> {
    await Promise.all(
      items.map(item => this.set(item.key, item.data, item.config))
    );
  }
}

export const cacheService = new CacheService();

export const CACHE_TTL = {
  INSTANT: 10 * 1000, // 10 seconds
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
  WEEK: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const CACHE_PREFIX = {
  CRM: 'crm',
  ADMIN: 'admin',
  USER: 'user',
  MARKET: 'market',
  METRICS: 'metrics',
  PORTFOLIO: 'portfolio',
  BOT: 'bot',
  NEWS: 'news',
};
