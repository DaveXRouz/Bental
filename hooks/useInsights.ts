import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Insight {
  id: string;
  ts: string;
  title: string;
  body: string;
  tags: string[];
  is_read: boolean;
}

interface UseInsightsReturn {
  insights: Insight[];
  loading: boolean;
  error: string | null;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  markAsRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useInsights(
  userId: string | undefined,
  botKey: string | null
): UseInsightsReturn {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fetchInsights = async () => {
    if (!userId || !botKey) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      let query = supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('bot_key', botKey)
        .order('ts', { ascending: false })
        .limit(50);

      if (selectedTags.length > 0) {
        query = query.overlaps('tags', selectedTags);
      }

      const { data, error: insightError } = await query;

      if (insightError) throw insightError;

      if (data) {
        setInsights(data.map(i => ({
          id: i.id,
          ts: i.ts || i.created_at,
          title: i.title,
          body: i.body || i.content,
          tags: i.tags || [],
          is_read: i.is_read || false,
        })));
      }
    } catch (err: any) {
      console.error('[useInsights] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [userId, botKey, selectedTags]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setInsights(prev =>
        prev.map(i => (i.id === id ? { ...i, is_read: true } : i))
      );
    } catch (err: any) {
      console.error('[useInsights] Mark as read error:', err);
    }
  };

  return {
    insights,
    loading,
    error,
    selectedTags,
    setSelectedTags,
    markAsRead,
    refresh: fetchInsights,
  };
}
