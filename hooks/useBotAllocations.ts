import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface BotAllocation {
  id: string;
  user_id: string;
  bot_id: string;
  allocated_amount: number;
  current_value: number;
  total_return: number;
  total_return_percent: number;
  status: string;
  started_at: string;
  bot: {
    name: string;
    risk_level: string;
  };
}

export function useBotAllocations() {
  const { session } = useAuth();
  const [allocations, setAllocations] = useState<BotAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAllocations();
    }
  }, [session?.user?.id]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bot_allocations')
        .select(`
          *,
          bot:bots(name, risk_level)
        `)
        .eq('user_id', session?.user?.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (error) throw error;
      setAllocations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAllocated = () => {
    return allocations.reduce((sum, alloc) => sum + Number(alloc.current_value), 0);
  };

  const getTotalReturn = () => {
    return allocations.reduce((sum, alloc) => sum + Number(alloc.total_return), 0);
  };

  return { allocations, loading, error, refetch: fetchAllocations, getTotalAllocated, getTotalReturn };
}
