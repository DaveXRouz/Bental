import { useEffect, useState, useCallback } from 'react';
import { priceUpdateService, PriceUpdate } from '@/services/realtime/price-updater';

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
