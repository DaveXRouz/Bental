import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { binanceService } from '@/services/ticker/binance';
import { fxService } from '@/services/ticker/fx';
import { TickerData as ServiceTickerData } from '@/services/ticker/types';

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  lastUpdate: number;
  type: 'crypto' | 'stock' | 'fx';
}

interface TickerState {
  tickers: Record<string, TickerData>;
  loading: boolean;
  connected: boolean;
  error: string | null;

  initialize: () => () => void;
  updateFromService: (serviceTickers: ServiceTickerData[]) => void;
  setTicker: (symbol: string, data: TickerData) => void;
  setTickers: (tickers: Record<string, TickerData>) => void;
  getTicker: (symbol: string) => TickerData | undefined;
  getAllTickers: () => TickerData[];
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  loadFromCache: () => Promise<void>;
  saveToCache: () => Promise<void>;
  cleanup: () => void;
}

const CACHE_KEY = '@ticker_cache';

export const useTickerStore = create<TickerState>((set, get) => ({
  tickers: {},
  loading: false,
  connected: false,
  error: null,

  initialize: () => {
    console.log('[TickerStore] Initializing live data feeds...');

    get().loadFromCache();

    try {
      binanceService.connect(
        (tickers) => {
          try {
            get().updateFromService(tickers);
            get().setConnected(true);
          } catch (error) {
            console.error('[TickerStore] Error updating from Binance:', error);
          }
        },
        (error) => {
          console.log('[TickerStore] Binance error (expected):', error.message);
        }
      );
    } catch (error) {
      console.error('[TickerStore] Failed to connect to Binance:', error);
    }

    const fetchFXData = async () => {
      try {
        console.log('[TickerStore] Fetching FX rates...');
        const rates = await fxService.fetchRates();
        if (rates && rates.length > 0) {
          get().updateFromService(rates);
          console.log('[TickerStore] Updated FX rates:', rates.length);
        }
      } catch (error) {
        console.error('[TickerStore] FX error:', error);
        get().clearError();
      }
    };

    fetchFXData();

    const fxInterval = setInterval(fetchFXData, 300000);

    return () => {
      try {
        clearInterval(fxInterval);
        get().cleanup();
      } catch (error) {
        console.error('[TickerStore] Cleanup error:', error);
      }
    };
  },

  updateFromService: (serviceTickers) => {
    set((state) => {
      const updated = { ...state.tickers };

      serviceTickers.forEach((ticker) => {
        const type = ticker.source === 'binance' ? 'crypto' :
                     ticker.source === 'fx' ? 'fx' : 'stock';

        updated[ticker.symbol] = {
          symbol: ticker.symbol,
          price: ticker.price,
          change: ticker.change,
          changePercent: ticker.changePercent,
          volume: ticker.volume,
          lastUpdate: ticker.lastUpdate,
          type,
        };
      });

      return { tickers: updated };
    });
    get().saveToCache();
  },

  setTicker: (symbol, data) => {
    set((state) => ({
      tickers: {
        ...state.tickers,
        [symbol]: data,
      },
    }));
    get().saveToCache();
  },

  setTickers: (tickers) => {
    set({ tickers });
    get().saveToCache();
  },

  getTicker: (symbol) => {
    return get().tickers[symbol];
  },

  getAllTickers: () => {
    return Object.values(get().tickers).sort((a, b) =>
      Math.abs(b.changePercent) - Math.abs(a.changePercent)
    );
  },

  setLoading: (loading) => set({ loading }),

  setConnected: (connected) => set({ connected }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  loadFromCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const tickers = JSON.parse(cached);
        set({ tickers });
        console.log('[TickerStore] Loaded from cache:', Object.keys(tickers).length, 'tickers');
      }
    } catch (error) {
      console.error('Failed to load ticker cache:', error);
    }
  },

  saveToCache: async () => {
    try {
      const { tickers } = get();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(tickers));
    } catch (error) {
      console.error('Failed to save ticker cache:', error);
    }
  },

  cleanup: () => {
    binanceService.disconnect();
    console.log('[TickerStore] Cleaned up connections');
  },
}));
