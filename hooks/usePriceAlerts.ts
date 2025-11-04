import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  asset_type: 'stock' | 'crypto' | 'fx';
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
  target_price: number;
  current_price: number | null;
  triggered: boolean;
  triggered_at: string | null;
  active: boolean;
  repeat: boolean;
  notify_email: boolean;
  notify_push: boolean;
  notify_sms: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertParams {
  symbol: string;
  asset_type?: 'stock' | 'crypto' | 'fx';
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
  target_price: number;
  repeat?: boolean;
  notify_email?: boolean;
  notify_push?: boolean;
  notify_sms?: boolean;
}

export function usePriceAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAlerts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = async (params: CreateAlertParams): Promise<PriceAlert | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      const { data, error: createError } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          symbol: params.symbol.toUpperCase(),
          asset_type: params.asset_type || 'stock',
          condition: params.condition,
          target_price: params.target_price,
          repeat: params.repeat ?? false,
          notify_email: params.notify_email ?? true,
          notify_push: params.notify_push ?? true,
          notify_sms: params.notify_sms ?? false,
          active: true,
          triggered: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchAlerts();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateAlert = async (
    id: string,
    updates: Partial<PriceAlert>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchAlerts();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteAlert = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchAlerts();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const toggleAlert = async (id: string, active: boolean): Promise<boolean> => {
    return await updateAlert(id, { active });
  };

  const resetAlert = async (id: string): Promise<boolean> => {
    return await updateAlert(id, {
      triggered: false,
      triggered_at: null,
      active: true,
    });
  };

  const getActiveAlerts = (): PriceAlert[] => {
    return alerts.filter(alert => alert.active && !alert.triggered);
  };

  const getTriggeredAlerts = (): PriceAlert[] => {
    return alerts.filter(alert => alert.triggered);
  };

  const getAlertsBySymbol = (symbol: string): PriceAlert[] => {
    return alerts.filter(alert => alert.symbol === symbol.toUpperCase());
  };

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    resetAlert,
    getActiveAlerts,
    getTriggeredAlerts,
    getAlertsBySymbol,
  };
}
