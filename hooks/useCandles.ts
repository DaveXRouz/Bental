import { useState, useEffect } from 'react';
import { Candle } from '@/types/models';
import marketDataService from '@/services/marketData';

export function useCandles(symbol: string, range: '1D' | '1W' | '1M' | '1Y') {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchCandles() {
      try {
        setLoading(true);
        setError(null);

        const data = await marketDataService.getCandles(symbol, range);

        if (mounted) {
          setCandles(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch candles');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchCandles();

    return () => {
      mounted = false;
    };
  }, [symbol, range]);

  return { candles, loading, error };
}
