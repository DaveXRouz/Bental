import { useState, useEffect } from 'react';
import { safeResponseJson, safeJsonParse } from '@/utils/safe-json-parser';

interface SentimentData {
  fearGreedValue: number;
  fearGreedLabel: string;
  vix: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const CACHE_KEY = 'sentiment_data';
const CACHE_DURATION = 30 * 60 * 1000;

interface CachedData {
  data: {
    fearGreedValue: number;
    fearGreedLabel: string;
    vix: number;
  };
  timestamp: number;
}

export function useSentiment(): SentimentData {
  const [fearGreedValue, setFearGreedValue] = useState(50);
  const [fearGreedLabel, setFearGreedLabel] = useState('Neutral');
  const [vix, setVix] = useState(15.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchSentimentData();
  }, []);

  const fetchSentimentData = async () => {
    try {
      const cached = getCachedData();
      if (cached) {
        setFearGreedValue(cached.data.fearGreedValue);
        setFearGreedLabel(cached.data.fearGreedLabel);
        setVix(cached.data.vix);
        setLastUpdated(new Date(cached.timestamp));
        setLoading(false);
        return;
      }

      setError(null);

      const [fngResponse, vixResponse] = await Promise.allSettled([
        fetch('https://api.alternative.me/fng/?limit=1&format=json'),
        fetch('https://stooq.com/q/l/?s=vix&f=sd2t2ohlcv&h=e'),
      ]);

      let fngValue = 50;
      let fngLabel = 'Neutral';

      if (fngResponse.status === 'fulfilled' && fngResponse.value.ok) {
        try {
          const fngData = await safeResponseJson(fngResponse.value, {
            errorContext: 'Fear & Greed Index API',
            logOnError: true,
            allowEmpty: true,
          });
          if (fngData?.data?.[0]) {
            fngValue = parseInt(fngData.data[0].value, 10);
            fngLabel = fngData.data[0].value_classification;
          }
        } catch (error) {
          console.warn('[Sentiment] Failed to parse Fear & Greed data:', error);
        }
      }

      let vixValue = 15.0;

      if (vixResponse.status === 'fulfilled' && vixResponse.value.ok) {
        const vixText = await vixResponse.value.text();
        const lines = vixText.trim().split('\n');
        if (lines.length > 1) {
          const data = lines[1].split(',');
          if (data.length > 4) {
            const closePrice = parseFloat(data[4]);
            if (!isNaN(closePrice)) {
              vixValue = closePrice;
            }
          }
        }
      }

      const sentimentData = {
        fearGreedValue: fngValue,
        fearGreedLabel: fngLabel,
        vix: vixValue,
      };

      setCachedData(sentimentData);

      setFearGreedValue(fngValue);
      setFearGreedLabel(fngLabel);
      setVix(vixValue);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('[useSentiment] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCachedData = (): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed: CachedData = safeJsonParse(cached, {
        errorContext: 'Sentiment cache',
        logOnError: false,
        allowEmpty: true,
        fallback: null,
      });

      if (!parsed) return null;

      const now = Date.now();

      if (now - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }

      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (error) {
      console.warn('[Sentiment] Cache read error:', error);
      return null;
    }
  };

  const setCachedData = (data: CachedData['data']) => {
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error('[useSentiment] Cache error:', err);
    }
  };

  return {
    fearGreedValue,
    fearGreedLabel,
    vix,
    loading,
    error,
    lastUpdated,
  };
}
