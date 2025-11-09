import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ENV } from '@/config/env';

// SECURITY: Load credentials from environment variables
// NEVER expose service role keys in client code - they grant full database access
// These values MUST be set in environment files (.env, .env.staging, .env.production)
const supabaseUrl = ENV.supabase.url;
const supabaseAnonKey = ENV.supabase.anonKey;

// Validate that credentials are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Project validation (commented out - all projects are valid)
// if (supabaseUrl.includes('oanohrjkniduqkkahmel')) {
//   throw new Error(
//     '⚠️ INVALID SUPABASE PROJECT: You are trying to use a non-existent project. Please update your .env file to use either staging (tnjgqdpxvkciiqdrdkyz) or production (urkokrimzciotxhykics) project.'
//   );
// }

// Use localStorage for web, AsyncStorage for native
const storage = Platform.OS === 'web' ? {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return Promise.resolve();
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return Promise.resolve();
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
} : AsyncStorage;

// Client instance with Row Level Security (RLS) enforcement
// All database operations use authenticated user context with RLS policies
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
