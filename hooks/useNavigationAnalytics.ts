import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type EventType = 'tab_view' | 'tab_switch' | 'fab_press' | 'long_press' | 'swipe' | 'quick_action';

interface AnalyticsEvent {
  event_type: EventType;
  from_tab?: string;
  to_tab?: string;
  action_id?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

interface AnalyticsStats {
  most_visited_tab: string | null;
  avg_session_duration: number;
  total_interactions: number;
  favorite_actions: string[];
  peak_usage_hour: number | null;
}

export function useNavigationAnalytics(userId: string | undefined) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const sessionStart = useRef<number>(Date.now());
  const currentTab = useRef<string | null>(null);
  const tabStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const trackEvent = async (event: AnalyticsEvent) => {
    if (!userId) return;

    try {
      await supabase.from('navigation_analytics').insert({
        user_id: userId,
        event_type: event.event_type,
        from_tab: event.from_tab,
        to_tab: event.to_tab,
        action_id: event.action_id,
        duration_ms: event.duration_ms,
        metadata: event.metadata || {},
      });
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  };

  const trackTabView = async (tabId: string) => {
    const now = Date.now();
    const duration = currentTab.current ? now - tabStartTime.current : 0;

    if (currentTab.current && duration > 0) {
      await trackEvent({
        event_type: 'tab_view',
        from_tab: currentTab.current,
        to_tab: tabId,
        duration_ms: duration,
      });
    }

    currentTab.current = tabId;
    tabStartTime.current = now;
  };

  const trackTabSwitch = async (fromTab: string, toTab: string, method: 'tap' | 'swipe' = 'tap') => {
    await trackEvent({
      event_type: method === 'swipe' ? 'swipe' : 'tab_switch',
      from_tab: fromTab,
      to_tab: toTab,
      metadata: { method },
    });
  };

  const trackFABPress = async (expanded: boolean = false) => {
    await trackEvent({
      event_type: 'fab_press',
      metadata: { expanded },
    });
  };

  const trackLongPress = async (tabId: string) => {
    await trackEvent({
      event_type: 'long_press',
      from_tab: tabId,
      metadata: { context: 'tab_bar' },
    });
  };

  const trackQuickAction = async (actionId: string, tabId: string) => {
    await trackEvent({
      event_type: 'quick_action',
      from_tab: tabId,
      action_id: actionId,
    });
  };

  const loadStats = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('navigation_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const tabCounts: Record<string, number> = {};
        const actionCounts: Record<string, number> = {};
        const hourCounts: Record<number, number> = {};
        let totalDuration = 0;

        data.forEach((event: any) => {
          if (event.to_tab) {
            tabCounts[event.to_tab] = (tabCounts[event.to_tab] || 0) + 1;
          }

          if (event.action_id) {
            actionCounts[event.action_id] = (actionCounts[event.action_id] || 0) + 1;
          }

          if (event.duration_ms) {
            totalDuration += event.duration_ms;
          }

          const hour = new Date(event.timestamp).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const mostVisitedTab = Object.entries(tabCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        const favoriteActions = Object.entries(actionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([action]) => action);
        const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

        setStats({
          most_visited_tab: mostVisitedTab,
          avg_session_duration: data.length > 0 ? totalDuration / data.length : 0,
          total_interactions: data.length,
          favorite_actions: favoriteActions,
          peak_usage_hour: peakHour ? parseInt(peakHour) : null,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsights = () => {
    if (!stats) return [];

    const insights: string[] = [];

    if (stats.most_visited_tab) {
      insights.push(`You visit ${stats.most_visited_tab} most frequently`);
    }

    if (stats.peak_usage_hour !== null) {
      const hour = stats.peak_usage_hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      insights.push(`You're most active around ${displayHour}${period}`);
    }

    if (stats.total_interactions > 100) {
      insights.push('You are a power user!');
    }

    if (stats.favorite_actions.length > 0) {
      insights.push(`Your go-to action: ${stats.favorite_actions[0]}`);
    }

    return insights;
  };

  return {
    stats,
    loading,
    trackTabView,
    trackTabSwitch,
    trackFABPress,
    trackLongPress,
    trackQuickAction,
    loadStats,
    getInsights,
  };
}
