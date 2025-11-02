import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Bot {
  id: string;
  key: string;
  name: string;
  logo_url: string | null;
  strategy: string | null;
  work_days: number[] | null;
  description: string;
}

interface BotAllocation {
  id: string;
  bot_id: string;
  bot_key: string | null;
  allocated_amount: number;
  current_value: number;
  total_return: number;
  total_return_percent: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  stop_loss_pct: number;
  expected_daily_return_pct: number;
  daily_hours: string | null;
  management_fee_bp: number;
  performance_fee_pct: number;
  risk_level: string;
  percent: number;
}

interface Guardrails {
  max_dd_pct: number;
  max_pos_pct: number;
  trade_freq: string;
  auto_pause: boolean;
}

interface DashboardData {
  bot: Bot | null;
  allocation: BotAllocation | null;
  guardrails: Guardrails | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBotDashboard(userId: string | undefined): DashboardData {
  const [bot, setBot] = useState<Bot | null>(null);
  const [allocation, setAllocation] = useState<BotAllocation | null>(null);
  const [guardrails, setGuardrails] = useState<Guardrails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const { data: allocationData, error: allocError } = await supabase
        .from('bot_allocations')
        .select(`
          id,
          bot_id,
          bot_key,
          allocated_amount,
          current_value,
          total_return,
          total_return_percent,
          status,
          start_date,
          end_date,
          stop_loss_pct,
          expected_daily_return_pct,
          daily_hours,
          management_fee_bp,
          performance_fee_pct,
          risk_level,
          percent,
          bots (
            id,
            key,
            name,
            logo_url,
            strategy,
            work_days,
            description
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (allocError) throw allocError;

      if (allocationData && allocationData.bots) {
        const botData = allocationData.bots as any;

        setBot({
          id: botData.id,
          key: botData.key || 'default',
          name: botData.name,
          logo_url: botData.logo_url,
          strategy: botData.strategy,
          work_days: botData.work_days,
          description: botData.description,
        });

        setAllocation({
          id: allocationData.id,
          bot_id: allocationData.bot_id,
          bot_key: allocationData.bot_key || botData.key || 'default',
          allocated_amount: Number(allocationData.allocated_amount),
          current_value: Number(allocationData.current_value),
          total_return: Number(allocationData.total_return),
          total_return_percent: Number(allocationData.total_return_percent),
          status: allocationData.status,
          start_date: allocationData.start_date,
          end_date: allocationData.end_date,
          stop_loss_pct: Number(allocationData.stop_loss_pct || 10),
          expected_daily_return_pct: Number(allocationData.expected_daily_return_pct || 0.5),
          daily_hours: allocationData.daily_hours,
          management_fee_bp: allocationData.management_fee_bp || 0,
          performance_fee_pct: Number(allocationData.performance_fee_pct || 0),
          risk_level: allocationData.risk_level || 'moderate',
          percent: Number(allocationData.percent || 100),
        });

        const botKey = allocationData.bot_key || botData.key || 'default';

        const { data: guardrailsData } = await supabase
          .from('bot_guardrails')
          .select('*')
          .eq('user_id', userId)
          .eq('bot_key', botKey)
          .maybeSingle();

        if (guardrailsData) {
          setGuardrails({
            max_dd_pct: Number(guardrailsData.max_dd_pct),
            max_pos_pct: Number(guardrailsData.max_pos_pct),
            trade_freq: guardrailsData.trade_freq,
            auto_pause: guardrailsData.auto_pause,
          });
        }
      } else {
        setBot(null);
        setAllocation(null);
        setGuardrails(null);
      }
    } catch (err: any) {
      console.error('[useBotDashboard] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [userId]);

  return {
    bot,
    allocation,
    guardrails,
    loading,
    error,
    refresh: fetchDashboard,
  };
}
