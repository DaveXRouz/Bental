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
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
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

interface MarginCallDetails {
  id: string;
  shortfall_amount: number;
  triggered_value: number;
  threshold_value: number;
  triggered_at: string;
  status: string;
}

interface UseBotReturn {
  hasBot: boolean;
  bot: Bot | null;
  allocation: BotAllocation | null;
  guardrails: BotGuardrails | null;
  isMarginCall: boolean;
  marginCallDetails: MarginCallDetails | null;
  todayPnL: number;
  loading: boolean;
  error: string | null;
  updateStatus: (status: string) => Promise<void>;
  updateAllocation: (percent: number) => Promise<void>;
  updateRiskLevel: (riskLevel: string) => Promise<void>;
  updateGuardrails: (updates: Partial<BotGuardrails>) => Promise<void>;
  addCapital: (amount: number) => Promise<void>;
  stopBot: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useBot(userId: string | undefined): UseBotReturn {
  const [bot, setBot] = useState<Bot | null>(null);
  const [allocation, setAllocation] = useState<BotAllocation | null>(null);
  const [guardrails, setGuardrails] = useState<BotGuardrails | null>(null);
  const [marginCallDetails, setMarginCallDetails] = useState<MarginCallDetails | null>(null);
  const [todayPnL, setTodayPnL] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBotData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setBot(null);
      setAllocation(null);
      setGuardrails(null);
      setMarginCallDetails(null);
      setTodayPnL(0);

      const { data: allocationData, error: allocError } = await supabase
        .from('bot_allocations')
        .select(`
          id,
          bot_id,
          bot_name,
          strategy,
          allocated_amount,
          current_value,
          total_return,
          total_return_percent,
          profit_loss,
          profit_loss_percent,
          total_trades,
          winning_trades,
          losing_trades,
          win_rate,
          status,
          risk_level,
          percent,
          minimum_balance_threshold,
          bots (
            id,
            name,
            description,
            strategy,
            risk_level
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'paused', 'margin_call'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (allocError) throw allocError;

      if (allocationData) {
        const botData = allocationData.bots as any;

        if (botData) {
          setBot({
            id: botData.id,
            name: botData.name,
            description: botData.description,
            strategy_type: botData.strategy || allocationData.strategy,
            risk_level: botData.risk_level || allocationData.risk_level,
          });
        }

        setAllocation({
          id: allocationData.id,
          bot_id: allocationData.bot_id,
          allocated_amount: Number(allocationData.allocated_amount),
          current_value: Number(allocationData.current_value),
          total_return: Number(allocationData.total_return || 0),
          total_return_percent: Number(allocationData.total_return_percent || 0),
          total_trades: Number(allocationData.total_trades || 0),
          winning_trades: Number(allocationData.winning_trades || 0),
          losing_trades: Number(allocationData.losing_trades || 0),
          win_rate: Number(allocationData.win_rate || 0),
          status: allocationData.status,
          risk_level: allocationData.risk_level || 'moderate',
          percent: Number(allocationData.percent || 100),
          bot: botData,
        });

        if (allocationData.status === 'margin_call') {
          const { data: marginCall } = await supabase
            .from('bot_margin_calls')
            .select('*')
            .eq('allocation_id', allocationData.id)
            .eq('status', 'pending')
            .order('triggered_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (marginCall) {
            setMarginCallDetails({
              id: marginCall.id,
              shortfall_amount: Number(marginCall.shortfall_amount),
              triggered_value: Number(marginCall.triggered_value),
              threshold_value: Number(marginCall.threshold_value),
              triggered_at: marginCall.triggered_at,
              status: marginCall.status,
            });
          }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayTrades } = await supabase
          .from('bot_trades')
          .select('profit_loss')
          .eq('bot_allocation_id', allocationData.id)
          .eq('status', 'closed')
          .gte('closed_at', today.toISOString());

        if (todayTrades && todayTrades.length > 0) {
          const totalPnL = todayTrades.reduce((sum, trade) => sum + Number(trade.profit_loss || 0), 0);
          setTodayPnL(totalPnL);
        }
      }

      if (allocationData) {
        const { data: guardrailsData, error: guardError } = await supabase
          .from('bot_guardrails')
          .select('*')
          .eq('user_id', userId)
          .eq('allocation_id', allocationData.id)
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

  const addCapital = async (amount: number) => {
    if (!allocation) return;

    try {
      const newValue = allocation.current_value + amount;

      const { error } = await supabase
        .from('bot_allocations')
        .update({
          current_value: newValue,
          allocated_amount: allocation.allocated_amount + amount,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', allocation.id);

      if (error) throw error;

      if (marginCallDetails) {
        await supabase
          .from('bot_margin_calls')
          .update({
            status: 'resolved',
            resolution_type: 'capital_added',
            capital_added: amount,
            resolved_at: new Date().toISOString()
          })
          .eq('id', marginCallDetails.id);
      }

      await fetchBotData();
    } catch (err: any) {
      console.error('[useBot] Add capital error:', err);
      throw err;
    }
  };

  const stopBot = async () => {
    if (!allocation) return;

    try {
      const { error } = await supabase
        .from('bot_allocations')
        .update({
          status: 'stopped',
          stopped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', allocation.id);

      if (error) throw error;

      if (marginCallDetails) {
        await supabase
          .from('bot_margin_calls')
          .update({
            status: 'resolved',
            resolution_type: 'bot_stopped',
            resolved_at: new Date().toISOString()
          })
          .eq('id', marginCallDetails.id);
      }

      await fetchBotData();
    } catch (err: any) {
      console.error('[useBot] Stop bot error:', err);
      throw err;
    }
  };

  const hasBot = allocation !== null;
  const isMarginCall = allocation?.status === 'margin_call';

  return {
    hasBot,
    bot,
    allocation,
    guardrails,
    isMarginCall,
    marginCallDetails,
    todayPnL,
    loading,
    error,
    updateStatus,
    updateAllocation,
    updateRiskLevel,
    updateGuardrails,
    addCapital,
    stopBot,
    refresh: fetchBotData,
  };
}
