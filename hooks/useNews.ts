import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  author?: string;
  source?: string;
  source_url?: string;
  image_url?: string;
  category_id?: string;
  symbols?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  published: boolean;
  featured: boolean;
  published_at?: string;
  created_at: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  active: boolean;
  display_order: number;
}

export function useNews(limit?: number, category?: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
    fetchCategories();
    setupRealtimeSync();
  }, [limit, category]);

  const fetchNews = async () => {
    try {
      let query = supabase
        .from('news_articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (category) {
        const { data: cat } = await supabase
          .from('news_categories')
          .select('id')
          .eq('slug', category)
          .single();
        if (cat) query = query.eq('category_id', cat.id);
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const setupRealtimeSync = () => {
    const channel = supabase
      .channel('news-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_articles' }, fetchNews)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_categories' }, fetchCategories)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  return { articles, categories, loading, refresh: fetchNews };
}
