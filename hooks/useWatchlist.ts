import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCache } from './useCache';

interface WatchlistItem {
  id: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  created_at: string;
}

export function useWatchlist(userId: string | undefined) {
  const {
    data: items,
    isLoading: loading,
    error: cacheError,
    refetch,
    invalidate,
  } = useCache<WatchlistItem[]>({
    key: `watchlist-${userId || 'none'}`,
    fetcher: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    ttl: 60000,
    memory: true,
    prefix: 'watchlist',
  });

  const error = cacheError ? cacheError.message : null;

  const addToWatchlist = useCallback(async (symbol: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('watchlist')
        .insert({
          user_id: userId,
          symbol: symbol.toUpperCase(),
          current_price: 0,
          price_change_24h: 0,
        });

      if (error) throw error;

      await invalidate();
    } catch (err) {
      console.error('[useWatchlist] Error adding to watchlist:', err);
      throw err;
    }
  }, [userId, invalidate]);

  const removeFromWatchlist = useCallback(async (id: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      await invalidate();
    } catch (err) {
      console.error('[useWatchlist] Error removing from watchlist:', err);
      throw err;
    }
  }, [userId, invalidate]);

  return {
    items: items || [],
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    refreshWatchlist: refetch,
  };
}
