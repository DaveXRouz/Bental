import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  rank: number;
  total_return_percent: number;
  total_return_amount: number;
  win_rate: number;
  total_trades: number;
  portfolio_value: number;
  public: boolean;
  featured: boolean;
  badges: string[];
  profiles?: {
    full_name: string;
    avatar_url?: string;
    trading_passport: string;
  };
}

export function useLeaderboard(limit: number = 100) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
    setupRealtimeSync();
  }, [limit]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url, trading_passport)
        `)
        .eq('public', true)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url, trading_passport)
        `)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserRank(data);
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  const setupRealtimeSync = () => {
    const channel = supabase
      .channel('leaderboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, fetchLeaderboard)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const togglePublicProfile = async (isPublic: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('leaderboard')
        .upsert({ user_id: user.id, public: isPublic })
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchUserRank();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    entries,
    userRank,
    loading,
    togglePublicProfile,
    refresh: fetchLeaderboard,
  };
}
