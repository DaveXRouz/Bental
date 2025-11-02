import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface NavigationPreferences {
  id?: string;
  user_id: string;
  tab_order: string[];
  hidden_tabs: string[];
  favorite_actions: string[];
  last_visited_tab: string | null;
  navigation_history: Array<{ tab: string; timestamp: string }>;
}

export function useNavigationPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<NavigationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('navigation_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setPreferences(data as NavigationPreferences);
      } else {
        const defaultPrefs = {
          user_id: userId,
          tab_order: ['index', 'portfolio', 'markets', 'more'],
          hidden_tabs: [],
          favorite_actions: [],
          last_visited_tab: null,
          navigation_history: [],
        };
        setPreferences(defaultPrefs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateTabOrder = async (newOrder: string[]) => {
    if (!userId || !preferences) return;

    try {
      const updated = { ...preferences, tab_order: newOrder };

      const { error: upsertError } = await supabase
        .from('navigation_preferences')
        .upsert({
          user_id: userId,
          tab_order: newOrder,
          hidden_tabs: preferences.hidden_tabs,
          favorite_actions: preferences.favorite_actions,
          last_visited_tab: preferences.last_visited_tab,
          navigation_history: preferences.navigation_history,
        });

      if (upsertError) throw upsertError;

      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tab order');
    }
  };

  const toggleTabVisibility = async (tabId: string) => {
    if (!userId || !preferences) return;

    try {
      const hiddenTabs = preferences.hidden_tabs.includes(tabId)
        ? preferences.hidden_tabs.filter(id => id !== tabId)
        : [...preferences.hidden_tabs, tabId];

      const updated = { ...preferences, hidden_tabs: hiddenTabs };

      const { error: upsertError } = await supabase
        .from('navigation_preferences')
        .upsert({
          user_id: userId,
          tab_order: preferences.tab_order,
          hidden_tabs: hiddenTabs,
          favorite_actions: preferences.favorite_actions,
          last_visited_tab: preferences.last_visited_tab,
          navigation_history: preferences.navigation_history,
        });

      if (upsertError) throw upsertError;

      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle tab visibility');
    }
  };

  const addToFavorites = async (actionId: string) => {
    if (!userId || !preferences) return;

    try {
      const favoriteActions = preferences.favorite_actions.includes(actionId)
        ? preferences.favorite_actions
        : [...preferences.favorite_actions, actionId];

      const updated = { ...preferences, favorite_actions: favoriteActions };

      const { error: upsertError } = await supabase
        .from('navigation_preferences')
        .upsert({
          user_id: userId,
          tab_order: preferences.tab_order,
          hidden_tabs: preferences.hidden_tabs,
          favorite_actions: favoriteActions,
          last_visited_tab: preferences.last_visited_tab,
          navigation_history: preferences.navigation_history,
        });

      if (upsertError) throw upsertError;

      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to favorites');
    }
  };

  const trackNavigation = async (tabId: string) => {
    if (!userId || !preferences) return;

    try {
      const newHistory = [
        { tab: tabId, timestamp: new Date().toISOString() },
        ...preferences.navigation_history.slice(0, 19),
      ];

      const updated = {
        ...preferences,
        last_visited_tab: tabId,
        navigation_history: newHistory,
      };

      const { error: upsertError } = await supabase
        .from('navigation_preferences')
        .upsert({
          user_id: userId,
          tab_order: preferences.tab_order,
          hidden_tabs: preferences.hidden_tabs,
          favorite_actions: preferences.favorite_actions,
          last_visited_tab: tabId,
          navigation_history: newHistory,
        });

      if (upsertError) throw upsertError;

      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track navigation');
    }
  };

  const getPredictedNextTab = (): string | null => {
    if (!preferences || preferences.navigation_history.length < 3) return null;

    const recentHistory = preferences.navigation_history.slice(0, 10);
    const tabCounts: Record<string, number> = {};

    recentHistory.forEach(entry => {
      tabCounts[entry.tab] = (tabCounts[entry.tab] || 0) + 1;
    });

    const sortedTabs = Object.entries(tabCounts).sort((a, b) => b[1] - a[1]);

    if (sortedTabs.length > 0 && sortedTabs[0][0] !== preferences.last_visited_tab) {
      return sortedTabs[0][0];
    }

    return sortedTabs.length > 1 ? sortedTabs[1][0] : null;
  };

  return {
    preferences,
    loading,
    error,
    updateTabOrder,
    toggleTabVisibility,
    addToFavorites,
    trackNavigation,
    getPredictedNextTab,
    refresh: fetchPreferences,
  };
}
