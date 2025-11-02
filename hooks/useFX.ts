import { useState, useEffect } from 'react';
import fxService from '@/services/fx';

export function useFX(base: string, targets: string[]) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchRates() {
      try {
        setLoading(true);
        setError(null);

        const ratesData: Record<string, number> = {};

        for (const target of targets) {
          const rate = await fxService.getExchangeRate(base, target);
          ratesData[target] = rate;
        }

        if (mounted) {
          setRates(ratesData);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchRates();

    return () => {
      mounted = false;
    };
  }, [base, JSON.stringify(targets)]);

  return { rates, loading, error };
}
