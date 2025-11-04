import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface WatchlistGroup {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  display_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  items?: WatchlistItem[];
}

export interface WatchlistItem {
  id: string;
  group_id: string;
  symbol: string;
  notes?: string;
  price_target?: number;
  alert_enabled: boolean;
  color_tag?: string;
  display_order: number;
  added_at: string;
}

export function useWatchlistGroups() {
  const [groups, setGroups] = useState<WatchlistGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
    setupRealtimeSync();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('watchlist_groups')
        .select(`
          *,
          items:watchlist_items_enhanced(*)
        `)
        .order('display_order');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching watchlist groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSync = () => {
    const channel = supabase
      .channel('watchlist-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist_groups' }, fetchGroups)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist_items_enhanced' }, fetchGroups)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const createGroup = async (group: Partial<WatchlistGroup>) => {
    try {
      const { data, error } = await supabase
        .from('watchlist_groups')
        .insert([group])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const updateGroup = async (id: string, updates: Partial<WatchlistGroup>) => {
    try {
      const { data, error } = await supabase
        .from('watchlist_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('watchlist_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const addItemToGroup = async (groupId: string, item: Partial<WatchlistItem>) => {
    try {
      const { data, error } = await supabase
        .from('watchlist_items_enhanced')
        .insert([{ ...item, group_id: groupId }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const removeItemFromGroup = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('watchlist_items_enhanced')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const updateItem = async (itemId: string, updates: Partial<WatchlistItem>) => {
    try {
      const { data, error } = await supabase
        .from('watchlist_items_enhanced')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    addItemToGroup,
    removeItemFromGroup,
    updateItem,
    refresh: fetchGroups,
  };
}
