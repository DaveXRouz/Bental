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

/**
 * Custom hook for managing user watchlist
 *
 * Provides CRUD operations for the user's watchlist with automatic caching.
 * Uses 60-second TTL cache and automatically invalidates on mutations.
 *
 * @param {string | undefined} userId - User ID to fetch watchlist for
 * @returns {Object} Watchlist management object
 * @returns {WatchlistItem[]} items - Array of watchlist items
 * @returns {boolean} loading - Loading state
 * @returns {string | null} error - Error message if operation fails
 * @returns {Function} addToWatchlist - Add symbol to watchlist
 * @returns {Function} removeFromWatchlist - Remove item from watchlist
 * @returns {Function} refreshWatchlist - Manually refresh watchlist
 *
 * @example
 * ```tsx
 * const { items, loading, addToWatchlist, removeFromWatchlist } = useWatchlist(userId);
 *
 * const handleAdd = async () => {
 *   try {
 *     await addToWatchlist('AAPL');
 *     toast.success('Added to watchlist');
 *   } catch (error) {
 *     toast.error('Failed to add to watchlist');
 *   }
 * };
 *
 * return (
 *   <View>
 *     {items.map(item => (
 *       <WatchlistCard
 *         key={item.id}
 *         item={item}
 *         onRemove={() => removeFromWatchlist(item.id)}
 *       />
 *     ))}
 *   </View>
 * );
 * ```
 */
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
