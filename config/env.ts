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
  env: (process.env.APP_ENV || 'local') as 'local' | 'dev' | 'staging' | 'prod',
  localeDefault: (process.env.EXPO_PUBLIC_LOCALE_DEFAULT || 'en') as 'en' | 'fr',

  // SECURITY: Load from environment variables - NO FALLBACKS
  // These MUST be set in your .env file for the application to work
  // Available projects:
  // - Staging: tnjgqdpxvkciiqdrdkyz.supabase.co
  // - Production: urkokrimzciotxhykics.supabase.co
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
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
export const isStaging = ENV.env === 'staging';

// Determine environment from Supabase URL
export function getEnvironmentFromUrl(): 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'LOCAL' {
  const url = ENV.supabase.url;

  if (!url) return 'LOCAL';

  if (url.includes('tnjgqdpxvkciiqdrdkyz')) return 'STAGING';
  if (url.includes('urkokrimzciotxhykics')) return 'PRODUCTION';
  if (url.includes('oanohrjkniduqkkahmel')) return 'DEVELOPMENT';

  return 'LOCAL';
}

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
  const errors: string[] = [];

  requiredVars.forEach(({ key, value }) => {
    if (!value) {
      missing.push(key);
    }
  });

  // Note: All three Supabase projects are valid:
  // - oanohrjkniduqkkahmel (current/development) ✅
  // - tnjgqdpxvkciiqdrdkyz (staging) ✅
  // - urkokrimzciotxhykics (production) ✅
  // Previous validation was incorrectly blocking the development project.

  // Validate environment configuration matches project
  if (ENV.env === 'prod' && !ENV.supabase.url.includes('urkokrimzciotxhykics')) {
    warnings.push(
      '⚠️ Environment mismatch: APP_ENV is set to "prod" but not using production Supabase project'
    );
  }

  if (ENV.env === 'staging' && !ENV.supabase.url.includes('tnjgqdpxvkciiqdrdkyz')) {
    warnings.push(
      '⚠️ Environment mismatch: APP_ENV is set to "staging" but not using staging Supabase project'
    );
  }

  // Optional but recommended
  if (!ENV.fx.exchangeRateBase) {
    warnings.push('FX_API_URL not set - using default exchange rate API');
  }

  if (errors.length > 0) {
    console.error('[ENV] Critical configuration errors:', errors);
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  if (missing.length > 0) {
    console.error('[ENV] Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('[ENV] Configuration warnings:', warnings);
  }

  console.log(`[ENV] ✅ Environment validation passed - Using ${ENV.env} environment`);
  console.log(`[ENV] 🔗 Supabase URL: ${ENV.supabase.url}`);
  console.log(`[ENV] 🔑 Supabase Key: ${ENV.supabase.anonKey.substring(0, 20)}...`);
  return true;
}
