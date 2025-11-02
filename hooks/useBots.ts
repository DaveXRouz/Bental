import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Bot {
  id: string;
  name: string;
  description: string;
  risk_level: string;
  strategy_type: string;
  min_capital: number;
  projected_annual_return: number;
  projected_volatility: number;
  is_active: boolean;
}

export function useBots() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('is_active', true)
        .order('min_capital', { ascending: true });

      if (error) throw error;
      setBots(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { bots, loading, error, refetch: fetchBots };
}
