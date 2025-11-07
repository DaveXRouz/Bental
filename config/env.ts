import Constants from 'expo-constants';

// Feature flags
export const FEATURES = {
  admin: process.env.ENABLE_ADMIN === 'true',
  tradingBotUI: process.env.ENABLE_TRADING_BOT_UI !== 'false', // default true
  liveMarket: process.env.ENABLE_LIVE_MARKET === 'true',
  news: process.env.ENABLE_NEWS === 'true',
  realtimeWS: process.env.ENABLE_REALTIME_WS === 'true',
  pushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
};

export const ENV = {
  env: (process.env.APP_ENV || 'local') as 'local' | 'dev' | 'prod',
  localeDefault: (process.env.EXPO_PUBLIC_LOCALE_DEFAULT || 'en') as 'en' | 'fr',

  // SECURITY: In production apps, load these from environment variables
  // These are hardcoded for demo purposes only
  // Use process.env.EXPO_PUBLIC_SUPABASE_URL and process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://oanohrjkniduqkkahmel.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbm9ocmprbmlkdXFra2FobWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDIyOTEsImV4cCI6MjA3NzQxODI5MX0.Soav_sSh5Ww_BJ7AJywhToZhDIXemEb9X7hSj9xNmdo',
  },

  market: {
    provider: (process.env.MARKET_PROVIDER || 'mock') as 'mock' | 'finnhub',
    finnhubKey: process.env.FINNHUB_API_KEY,
    coinStatsKey: process.env.COINSTATS_API_KEY,
  },

  fx: {
    exchangeRateBase: process.env.EXPO_PUBLIC_FX_API_URL || 'https://api.exchangerate-api.com/v4/latest',
    fallbackProvider: 'https://api.exchangerate.host/latest',
  },
};

export const isLocal = ENV.env === 'local';
export const isDev = ENV.env === 'dev';
export const isProd = ENV.env === 'prod';

// Use mock data by default in local mode
export const useMockData = isLocal || !FEATURES.liveMarket;

// Legacy exports for backward compatibility
export const isDemoMode = useMockData;

export function validateEnvironment() {
  const requiredVars = [
    { key: 'EXPO_PUBLIC_SUPABASE_URL', value: ENV.supabase.url },
    { key: 'EXPO_PUBLIC_SUPABASE_ANON_KEY', value: ENV.supabase.anonKey },
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  requiredVars.forEach(({ key, value }) => {
    if (!value) {
      missing.push(key);
    }
  });

  // Optional but recommended
  if (!ENV.fx.exchangeRateBase) {
    warnings.push('FX_API_URL not set - using default exchange rate API');
  }

  if (missing.length > 0) {
    console.error('[ENV] Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('[ENV] Configuration warnings:', warnings);
  }

  console.log('[ENV] Environment validation passed');
  return true;
}
