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

  supabase: {
    url: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  market: {
    provider: (process.env.MARKET_PROVIDER || 'mock') as 'mock' | 'finnhub',
    finnhubKey: process.env.FINNHUB_API_KEY,
    coinStatsKey: process.env.COINSTATS_API_KEY,
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
  const missingKeys: string[] = [];

  if (!ENV.supabase.url) missingKeys.push('SUPABASE_URL');
  if (!ENV.supabase.anonKey) missingKeys.push('SUPABASE_ANON_KEY');

  if (missingKeys.length > 0) {
    console.warn(`Missing environment variables: ${missingKeys.join(', ')}`);
    console.warn('App will run in offline mode with mock data');
  }

  return true;
}
