import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Bot {
  id: string;
  name: string;
  description: string;
  strategy_type: string;
  risk_level: string;
}

interface BotAllocation {
  id: string;
  bot_id: string;
  allocated_amount: number;
  current_value: number;
  total_return: number;
  total_return_percent: number;
  status: string;
  risk_level: string;
  percent: number;
  bot: Bot;
}

interface BotGuardrails {
  id: string;
  max_dd_pct: number;
  max_pos_pct: number;
  trade_freq: string;
  auto_pause: boolean;
}

interface UseBotReturn {
  bot: Bot | null;
  allocation: BotAllocation | null;
  guardrails: BotGuardrails | null;
  loading: boolean;
  error: string | null;
  updateStatus: (status: string) => Promise<void>;
  updateAllocation: (percent: number) => Promise<void>;
  updateRiskLevel: (riskLevel: string) => Promise<void>;
  updateGuardrails: (updates: Partial<BotGuardrails>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useBot(userId: string | undefined): UseBotReturn {
  const [bot, setBot] = useState<Bot | null>(null);
  const [allocation, setAllocation] = useState<BotAllocation | null>(null);
  const [guardrails, setGuardrails] = useState<BotGuardrails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBotData = async () => {
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
          allocated_amount,
          current_value,
          total_return,
          total_return_percent,
          status,
          risk_level,
          percent,
          bots (
            id,
            name,
            description,
            strategy_type,
            risk_level
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (allocError) throw allocError;

      if (allocationData) {
        const botData = allocationData.bots as any;
        setBot({
          id: botData.id,
          name: botData.name,
          description: botData.description,
          strategy_type: botData.strategy_type,
          risk_level: botData.risk_level,
        });
        setAllocation({
          id: allocationData.id,
          bot_id: allocationData.bot_id,
          allocated_amount: Number(allocationData.allocated_amount),
          current_value: Number(allocationData.current_value),
          total_return: Number(allocationData.total_return),
          total_return_percent: Number(allocationData.total_return_percent),
          status: allocationData.status,
          risk_level: allocationData.risk_level || 'moderate',
          percent: Number(allocationData.percent || 100),
          bot: botData,
        });
      }

      const { data: guardrailsData, error: guardError } = await supabase
        .from('bot_guardrails')
        .select('*')
        .eq('user_id', userId)
        .eq('bot_key', 'default')
        .maybeSingle();

      if (guardError && guardError.code !== 'PGRST116') throw guardError;

      if (guardrailsData) {
        setGuardrails({
          id: guardrailsData.id,
          max_dd_pct: Number(guardrailsData.max_dd_pct),
          max_pos_pct: Number(guardrailsData.max_pos_pct),
          trade_freq: guardrailsData.trade_freq,
          auto_pause: guardrailsData.auto_pause,
        });
      } else {
        const { data: newGuardrails } = await supabase
          .from('bot_guardrails')
          .insert({
            user_id: userId,
            bot_key: 'default',
            max_dd_pct: 5.0,
            max_pos_pct: 15.0,
            trade_freq: 'moderate',
            auto_pause: true,
          })
          .select()
          .single();

        if (newGuardrails) {
          setGuardrails({
            id: newGuardrails.id,
            max_dd_pct: Number(newGuardrails.max_dd_pct),
            max_pos_pct: Number(newGuardrails.max_pos_pct),
            trade_freq: newGuardrails.trade_freq,
            auto_pause: newGuardrails.auto_pause,
          });
        }
      }
    } catch (err: any) {
      console.error('[useBot] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotData();
  }, [userId]);

  const updateStatus = async (status: string) => {
    if (!allocation) return;

    try {
      const { error } = await supabase
        .from('bot_allocations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', allocation.id);

      if (error) throw error;

      setAllocation({ ...allocation, status });
    } catch (err: any) {
      console.error('[useBot] Update status error:', err);
      throw err;
    }
  };

  const updateAllocation = async (percent: number) => {
    if (!allocation) return;

    try {
      const { error } = await supabase
        .from('bot_allocations')
        .update({ percent, updated_at: new Date().toISOString() })
        .eq('id', allocation.id);

      if (error) throw error;

      setAllocation({ ...allocation, percent });
    } catch (err: any) {
      console.error('[useBot] Update allocation error:', err);
      throw err;
    }
  };

  const updateRiskLevel = async (riskLevel: string) => {
    if (!allocation) return;

    try {
      const { error } = await supabase
        .from('bot_allocations')
        .update({ risk_level: riskLevel, updated_at: new Date().toISOString() })
        .eq('id', allocation.id);

      if (error) throw error;

      setAllocation({ ...allocation, risk_level: riskLevel });
    } catch (err: any) {
      console.error('[useBot] Update risk level error:', err);
      throw err;
    }
  };

  const updateGuardrails = async (updates: Partial<BotGuardrails>) => {
    if (!guardrails) return;

    try {
      const { error } = await supabase
        .from('bot_guardrails')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', guardrails.id);

      if (error) throw error;

      setGuardrails({ ...guardrails, ...updates });
    } catch (err: any) {
      console.error('[useBot] Update guardrails error:', err);
      throw err;
    }
  };

  return {
    bot,
    allocation,
    guardrails,
    loading,
    error,
    updateStatus,
    updateAllocation,
    updateRiskLevel,
    updateGuardrails,
    refresh: fetchBotData,
  };
}
