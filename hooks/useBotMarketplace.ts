import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface BotTemplate {
  id: string;
  name: string;
  description?: string;
  strategy_type: string;
  risk_level: 'low' | 'medium' | 'high';
  expected_return_percent?: number;
  min_investment: number;
  price_monthly: number;
  published: boolean;
  featured: boolean;
  configuration: any;
  backtesting_results?: any;
  subscribers_count: number;
  total_return?: number;
  win_rate?: number;
  created_at: string;
}

export interface BotSubscription {
  id: string;
  user_id: string;
  template_id: string;
  bot_id?: string;
  status: 'active' | 'paused' | 'cancelled';
  started_at: string;
  cancelled_at?: string;
  templates?: BotTemplate;
}

export function useBotMarketplace() {
  const [templates, setTemplates] = useState<BotTemplate[]>([]);
  const [subscriptions, setSubscriptions] = useState<BotSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
    fetchSubscriptions();
    setupRealtimeSync();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('bot_templates')
        .select('*')
        .eq('published', true)
        .order('featured', { ascending: false })
        .order('subscribers_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching bot templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('bot_subscriptions')
        .select(`
          *,
          templates:template_id (*)
        `)
        .eq('status', 'active');

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const setupRealtimeSync = () => {
    const channel = supabase
      .channel('bot-marketplace-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_templates' }, fetchTemplates)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_subscriptions' }, fetchSubscriptions)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const subscribe = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('bot_subscriptions')
        .insert([{ template_id: templateId, status: 'active' }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('bot_templates')
        .update({ subscribers_count: supabase.sql`subscribers_count + 1` })
        .eq('id', templateId);

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const unsubscribe = async (subscriptionId: string) => {
    try {
      const { data, error } = await supabase
        .from('bot_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  return {
    templates,
    subscriptions,
    loading,
    subscribe,
    unsubscribe,
    refresh: fetchTemplates,
  };
}
