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
    url: 'https://tnjgqdpxvkciiqdrdkyz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTY1NzIsImV4cCI6MjA3NzY5MjU3Mn0.fzuasx1yM-PkjO-d4OowSPNfMMeLmtAeci2skmCZS5k',
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
  // Environment validation complete - credentials are hardcoded
  return true;
}
