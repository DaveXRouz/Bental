declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_ENV: 'dev' | 'prod';
      EXPO_PUBLIC_DEMO_MODE: string;
      EXPO_PUBLIC_LOCALE_DEFAULT: 'en' | 'fr';

      // Market Data APIs
      EXPO_PUBLIC_FINNHUB_API_KEY?: string;
      EXPO_PUBLIC_ALPHAVANTAGE_API_KEY?: string;
      EXPO_PUBLIC_TWELVEDATA_API_KEY?: string;
      EXPO_PUBLIC_POLYGON_API_KEY?: string;

      // Cryptocurrency
      EXPO_PUBLIC_BINANCE_WS: string;
      EXPO_PUBLIC_COINGECKO_BASE: string;

      // Foreign Exchange
      EXPO_PUBLIC_EXCHANGERATE_BASE: string;

      // News & Media
      EXPO_PUBLIC_NEWSAPI_KEY?: string;
      EXPO_PUBLIC_UNSPLASH_ACCESS_KEY?: string;

      // Monitoring & Analytics
      EXPO_PUBLIC_EXPO_PROJECT_ID?: string;
      SENTRY_DSN?: string;
      EXPO_PUBLIC_POSTHOG_KEY?: string;
    }
  }
}

export {};
