import { useEffect, useState, useCallback } from 'react';
import { marketPriceUpdater } from '@/services/portfolio/market-price-updater';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook for managing automatic market price updates
 *
 * Automatically starts/stops price updates based on authentication state.
 * Provides manual control and update status information.
 *
 * @param {boolean} [enabled=true] - Enable/disable automatic updates
 * @param {number} [frequency=30000] - Update frequency in milliseconds (default 30s)
 * @returns {Object} Price updater control object
 * @returns {Date | null} lastUpdate - Timestamp of last update
 * @returns {boolean} isRunning - Whether updater is currently running
 * @returns {Function} update - Manually trigger price update
 * @returns {Function} start - Start automatic updates
 * @returns {Function} stop - Stop automatic updates
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { lastUpdate, isRunning, update } = useMarketPriceUpdater();
 *
 *   return (
 *     <View>
 *       <StatusIndicator active={isRunning} />
 *       <Text>Last update: {lastUpdate?.toLocaleTimeString()}</Text>
 *       <Button onPress={update} title="Refresh Prices" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useMarketPriceUpdater(enabled = true, frequency = 30000) {
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!enabled || !user) {
      stop();
      return;
    }

    // Start automatic updates
    marketPriceUpdater.start(frequency);
    setIsRunning(true);

    // Get initial last update time
    marketPriceUpdater.getLastUpdateTime().then((time) => {
      if (time) setLastUpdate(time);
    });

    // Cleanup on unmount
    return () => {
      marketPriceUpdater.stop();
      setIsRunning(false);
    };
  }, [enabled, user, frequency]);

  const update = useCallback(async () => {
    const count = await marketPriceUpdater.update();
    if (count > 0) {
      const time = await marketPriceUpdater.getLastUpdateTime();
      if (time) setLastUpdate(time);
    }
    return count;
  }, []);

  const start = useCallback(() => {
    marketPriceUpdater.start(frequency);
    setIsRunning(true);
  }, [frequency]);

  const stop = useCallback(() => {
    marketPriceUpdater.stop();
    setIsRunning(false);
  }, []);

  return {
    lastUpdate,
    isRunning,
    update,
    start,
    stop,
  };
}
