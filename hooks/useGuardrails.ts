import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface GuardrailsData {
  maxDD: number;
  maxPos: number;
  tradeFreq: string;
  autoPause: boolean;
  currentDD: number;
  breaches: string[];
  loading: boolean;
  error: string | null;
}

export function useGuardrails(
  userId: string | undefined,
  botKey: string | null,
  currentValue: number,
  allocatedAmount: number
): GuardrailsData {
  const [data, setData] = useState<GuardrailsData>({
    maxDD: 5.0,
    maxPos: 15.0,
    tradeFreq: 'moderate',
    autoPause: false,
    currentDD: 0,
    breaches: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId || !botKey) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchGuardrails = async () => {
      try {
        const { data: guardrails, error: guardError } = await supabase
          .from('bot_guardrails')
          .select('*')
          .eq('user_id', userId)
          .eq('bot_key', botKey)
          .maybeSingle();

        if (guardError && guardError.code !== 'PGRST116') throw guardError;

        const currentDD = allocatedAmount > 0
          ? ((allocatedAmount - currentValue) / allocatedAmount) * 100
          : 0;

        const maxDD = guardrails?.max_dd_pct || 5.0;
        const maxPos = guardrails?.max_pos_pct || 15.0;
        const tradeFreq = guardrails?.trade_freq || 'moderate';
        const autoPause = guardrails?.auto_pause || false;

        const breaches: string[] = [];
        if (currentDD > maxDD) {
          breaches.push('Max Drawdown Exceeded');
        }

        setData({
          maxDD,
          maxPos,
          tradeFreq,
          autoPause,
          currentDD: Math.max(0, currentDD),
          breaches,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        console.error('[useGuardrails] Error:', err);
        setData(prev => ({
          ...prev,
          loading: false,
          error: err.message,
        }));
      }
    };

    fetchGuardrails();
  }, [userId, botKey, currentValue, allocatedAmount]);

  return data;
}
