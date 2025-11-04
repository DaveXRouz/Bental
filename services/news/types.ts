export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  image_url?: string;
  source: string;
  published_at: string;
  category: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  symbols?: string[];
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
