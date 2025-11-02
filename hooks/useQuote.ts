import { useState, useEffect } from 'react';
import { Quote } from '@/types/models';
import marketDataService from '@/services/marketData';
import cryptoService from '@/services/crypto';
import { useCache } from './useCache';

export function useQuote(symbol: string, isCrypto: boolean = false) {
  const cacheKey = `quote-${isCrypto ? 'crypto' : 'stock'}-${symbol}`;

  const {
    data: quote,
    isLoading: loading,
    error: cacheError,
  } = useCache<Quote>({
    key: cacheKey,
    fetcher: async () => {
      return isCrypto
        ? await cryptoService.getQuote(symbol)
        : await marketDataService.getQuote(symbol);
    },
    ttl: 15000,
    memory: true,
    prefix: 'quotes',
    refetchInterval: 30000,
  });

  const error = cacheError ? cacheError.message : null;

  return { quote, loading, error };
}
