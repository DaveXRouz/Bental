import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://tnjgqdpxvkciiqdrdkyz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTY1NzIsImV4cCI6MjA3NzY5MjU3Mn0.fzuasx1yM-PkjO-d4OowSPNfMMeLmtAeci2skmCZS5k';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjExNjU3MiwiZXhwIjoyMDc3NjkyNTcyfQ.q5bcaIT4zCqKZW0Tkx8zFsvfWJYz62q_L6iW7x5dADk';

// Supabase configuration validation occurs during build

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
