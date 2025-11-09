export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  author?: string;
  source?: string;
  source_url?: string;
  url?: string;
  image_url?: string;
  category?: string;
  category_id?: string;
  symbols?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  published?: boolean;
  featured?: boolean;
  published_at?: string;
  created_at?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
}

export interface NewsFilter {
  category?: string;
  symbol?: string;
  source?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  startDate?: string;
  endDate?: string;
}
