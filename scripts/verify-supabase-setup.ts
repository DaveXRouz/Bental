/**
 * Supabase Setup Verification Script
 *
 * This script verifies that all Supabase configuration is correct:
 * - Tables exist and are accessible
 * - RLS policies are properly configured
 * - Anon role has appropriate permissions
 * - Realtime subscriptions work
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔍 Supabase Setup Verification\n');
console.log('Configuration:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTableAccess(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ ${tableName}: ${error.message}`);
      if (error.message.includes('schema cache')) {
        console.error('   💡 Solution: Go to Supabase Dashboard → Project Settings → API → Refresh Schema Cache');
      }
      if (error.message.includes('Could not find')) {
        console.error('   💡 Solution: Table may not exist or not be exposed in the API');
      }
      if (error.code === '42501') {
        console.error('   💡 Solution: Check RLS policies - anon role may not have SELECT permission');
      }
      return false;
    }

    console.log(`✅ ${tableName}: Accessible (${data?.length || 0} rows returned)`);
    return true;
  } catch (err: any) {
    console.error(`❌ ${tableName}: Exception - ${err.message}`);
    return false;
  }
}

async function verifyAppConfig(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_configuration')
      .select('key, value')
      .in('key', ['app_name', 'maintenance_mode', 'trading_enabled']);

    if (error) {
      console.error(`❌ app_configuration query failed: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️  app_configuration table is empty`);
      return false;
    }

    console.log(`✅ app_configuration: ${data.length} config values found`);
    data.forEach((config) => {
      console.log(`   - ${config.key}: ${JSON.stringify(config.value)}`);
    });
    return true;
  } catch (err: any) {
    console.error(`❌ app_configuration verification failed: ${err.message}`);
    return false;
  }
}

async function verifyRealtimeConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('Testing Realtime WebSocket connection...');

    const channel = supabase
      .channel('test-connection')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_configuration',
      }, () => {
        // No-op
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime: WebSocket connected successfully');
          supabase.removeChannel(channel);
          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`❌ Realtime: Connection failed (${status})`);
          console.error('   💡 Solution: Check Project Settings → Realtime → Enable DB changes');
          supabase.removeChannel(channel);
          resolve(false);
        }
      });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.error('❌ Realtime: Connection timeout');
      supabase.removeChannel(channel);
      resolve(false);
    }, 10000);
  });
}

async function runVerification() {
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📋 Testing Table Access (with anon role)\n');

  const tables = [
    'profiles',
    'app_configuration',
    'accounts',
    'holdings',
    'transactions',
    'watchlist',
  ];

  const results: Record<string, boolean> = {};

  for (const table of tables) {
    results[table] = await verifyTableAccess(table);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('🔧 Testing App Configuration\n');

  const configOk = await verifyAppConfig();

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('🔴 Testing Realtime Connection\n');

  const realtimeOk = await verifyRealtimeConnection();

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📊 Summary\n');

  const totalTests = Object.keys(results).length + 2; // tables + config + realtime
  const passedTests = Object.values(results).filter(Boolean).length +
                       (configOk ? 1 : 0) +
                       (realtimeOk ? 1 : 0);

  console.log(`Tests Passed: ${passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('\n✅ All verifications passed! Your Supabase setup is correct.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some verifications failed. Please review the errors above.\n');
    console.log('Common solutions:');
    console.log('1. Refresh schema cache: Dashboard → Settings → API → Refresh Schema Cache');
    console.log('2. Check RLS policies: Ensure anon role has SELECT permission');
    console.log('3. Verify exposed schemas: Settings → API → Exposed schemas includes "public"');
    console.log('4. Enable Realtime: Settings → Realtime → Enable for your tables');
    console.log('');
    process.exit(1);
  }
}

// Run verification
runVerification().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
