import { useEffect, useState, useCallback } from 'react';
import { priceUpdateService, PriceUpdate } from '@/services/realtime/price-updater';

/**
 * Custom hook for real-time price updates
 *
 * Subscribes to real-time price updates for multiple symbols.
 * Automatically manages WebSocket connections and cleanup.
 *
 * @param {string[]} symbols - Array of symbols to track
 * @param {boolean} [enabled=true] - Enable/disable real-time updates
 * @returns {Object} Real-time price data
 * @returns {Map<string, PriceUpdate>} prices - Map of symbol to price update
 * @returns {Function} getPrice - Get price for specific symbol
 * @returns {Date | null} lastUpdate - Timestamp of last update
 * @returns {boolean} isConnected - WebSocket connection status
 * @returns {Function} refresh - Manually refresh prices
 *
 * @example
 * ```tsx
 * const { prices, getPrice, isConnected, lastUpdate } = useRealtimePrices(
 *   ['AAPL', 'GOOGL', 'MSFT'],
 *   true
 * );
 *
 * const aaplPrice = getPrice('AAPL');
 *
 * return (
 *   <View>
 *     <StatusIndicator connected={isConnected} />
 *     <Text>Last update: {lastUpdate?.toLocaleTimeString()}</Text>
 *     {aaplPrice && (
 *       <PriceCard
 *         symbol="AAPL"
 *         price={aaplPrice.price}
 *         change={aaplPrice.change}
 *       />
 *     )}
 *   </View>
 * );
 * ```
 */
export function useRealtimePrices(symbols: string[], enabled = true) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);

    const unsubscribe = priceUpdateService.subscribe(symbols, (updates) => {
      setPrices((prev) => {
        const newPrices = new Map(prev);
        updates.forEach((update) => {
          newPrices.set(update.symbol, update);
        });
        return newPrices;
      });
      setLastUpdate(new Date());
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [symbols, enabled]);

  const getPrice = useCallback(
    (symbol: string): PriceUpdate | undefined => {
      return prices.get(symbol);
    },
    [prices]
  );

  const refresh = useCallback(() => {
    if (symbols.length > 0) {
      priceUpdateService.subscribe(symbols, (updates) => {
        setPrices((prev) => {
          const newPrices = new Map(prev);
          updates.forEach((update) => {
            newPrices.set(update.symbol, update);
          });
          return newPrices;
        });
        setLastUpdate(new Date());
      })();
    }
  }, [symbols]);

  return {
    prices,
    getPrice,
    lastUpdate,
    isConnected,
    refresh,
  };
}
