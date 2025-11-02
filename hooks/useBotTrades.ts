import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Trade {
  id: string;
  ts: string;
  symbol: string;
  side: string;
  qty: number;
  entry_price: number;
  exit_price: number | null;
  profit_loss: number;
  profit_loss_percent: number;
  pl_pct: number;
  stop_loss_pct: number | null;
  take_profit_pct: number | null;
  status: string;
}

interface UseBotTradesReturn {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useBotTrades(
  userId: string | undefined,
  botKey: string | null,
  range: '1D' | '1W' | '1M' | 'ALL' = '1D',
  limit: number = 20
): UseBotTradesReturn {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const getDateFilter = () => {
    const now = new Date();
    switch (range) {
      case '1D':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '1W':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '1M':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const fetchTrades = async (append: boolean = false) => {
    if (!userId || !botKey) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      if (!append) setLoading(true);

      let query = supabase
        .from('bot_trades')
        .select('*')
        .eq('user_id', userId)
        .eq('bot_key', botKey)
        .order('ts', { ascending: false });

      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('ts', dateFilter);
      }

      const currentOffset = append ? offset : 0;
      query = query.range(currentOffset, currentOffset + limit - 1);

      const { data, error: tradeError } = await query;

      if (tradeError) throw tradeError;

      if (data) {
        const formattedTrades = data.map(t => ({
          id: t.id,
          ts: t.ts || t.entry_time,
          symbol: t.symbol,
          side: t.side || t.direction,
          qty: Number(t.qty || t.quantity),
          entry_price: Number(t.entry_price),
          exit_price: t.exit_price ? Number(t.exit_price) : null,
          profit_loss: Number(t.profit_loss || 0),
          profit_loss_percent: Number(t.profit_loss_percent || t.pl_pct || 0),
          pl_pct: Number(t.pl_pct || t.profit_loss_percent || 0),
          stop_loss_pct: t.stop_loss_pct ? Number(t.stop_loss_pct) : null,
          take_profit_pct: t.take_profit_pct ? Number(t.take_profit_pct) : null,
          status: t.status || 'closed',
        }));

        if (append) {
          setTrades(prev => [...prev, ...formattedTrades]);
        } else {
          setTrades(formattedTrades);
        }

        setHasMore(data.length === limit);
        setOffset(currentOffset + data.length);
      }
    } catch (err: any) {
      console.error('[useBotTrades] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchTrades(false);
  }, [userId, botKey, range]);

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchTrades(true);
    }
  };

  const refresh = async () => {
    setOffset(0);
    await fetchTrades(false);
  };

  return {
    trades,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
