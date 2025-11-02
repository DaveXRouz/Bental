import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface KPIData {
  todayPL: number;
  todayPLPct: number;
  mtdReturn: number;
  mtdReturnPct: number;
  winRate: number;
  maxDD: number;
  tradesCount: number;
  loading: boolean;
  error: string | null;
}

export function useBotKPIs(
  userId: string | undefined,
  botKey: string | null,
  allocatedAmount: number
): KPIData {
  const [kpis, setKpis] = useState<KPIData>({
    todayPL: 0,
    todayPLPct: 0,
    mtdReturn: 0,
    mtdReturnPct: 0,
    winRate: 0,
    maxDD: 0,
    tradesCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId || !botKey) {
      setKpis(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchKPIs = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];

        const { data: summaries, error: summaryError } = await supabase
          .from('bot_daily_summary')
          .select('*')
          .eq('user_id', userId)
          .eq('bot_key', botKey)
          .gte('date', monthStartStr)
          .order('date', { ascending: false });

        if (summaryError) throw summaryError;

        if (summaries && summaries.length > 0) {
          const todaySummary = summaries.find(s => s.date === today);

          const mtdPnlUsd = summaries.reduce((sum, s) => sum + Number(s.pnl_usd || 0), 0);
          const mtdPnlPct = summaries.reduce((sum, s) => sum + Number(s.pnl_pct || 0), 0);

          const totalTrades = summaries.reduce((sum, s) => sum + Number(s.trades_count || 0), 0);
          const avgWinRate = summaries.length > 0
            ? summaries.reduce((sum, s) => sum + Number(s.win_rate_pct || 0), 0) / summaries.length
            : 0;

          const maxDrawdown = Math.max(...summaries.map(s => Number(s.max_dd_pct || 0)));

          setKpis({
            todayPL: Number(todaySummary?.pnl_usd || 0),
            todayPLPct: Number(todaySummary?.pnl_pct || 0),
            mtdReturn: mtdPnlUsd,
            mtdReturnPct: mtdPnlPct,
            winRate: avgWinRate,
            maxDD: maxDrawdown,
            tradesCount: totalTrades,
            loading: false,
            error: null,
          });
        } else {
          setKpis({
            todayPL: 0,
            todayPLPct: 0,
            mtdReturn: 0,
            mtdReturnPct: 0,
            winRate: 0,
            maxDD: 0,
            tradesCount: 0,
            loading: false,
            error: null,
          });
        }
      } catch (err: any) {
        console.error('[useBotKPIs] Error:', err);
        setKpis(prev => ({
          ...prev,
          loading: false,
          error: err.message,
        }));
      }
    };

    fetchKPIs();
  }, [userId, botKey, allocatedAmount]);

  return kpis;
}
