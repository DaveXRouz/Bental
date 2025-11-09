const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Multi-environment support
// Use command line argument to specify environment: node test-query.js [staging|production]
// Or set SUPABASE_ENV environment variable
const targetEnv = process.argv[2] || process.env.SUPABASE_ENV || 'staging';

const environments = {
  staging: {
    url: 'https://tnjgqdpxvkciiqdrdkyz.supabase.co',
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTY1NzIsImV4cCI6MjA3NzY5MjU3Mn0.fzuasx1yM-PkjO-d4OowSPNfMMeLmtAeci2skmCZS5k'
  },
  production: {
    url: 'https://urkokrimzciotxhykics.supabase.co',
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD || 'YOUR_PRODUCTION_ANON_KEY_HERE'
  }
};

const config = environments[targetEnv];

if (!config) {
  console.error(`❌ Invalid environment: ${targetEnv}`);
  console.error('Valid options: staging, production');
  process.exit(1);
}

console.log(`🔍 Testing ${targetEnv.toUpperCase()} environment`);
console.log(`   URL: ${config.url}\n`);

const supabase = createClient(config.url, config.key);

async function testQuery() {
  console.log('Testing pending_sell_orders → profiles join...\n');
  
  const startTime = Date.now();
  
  const { data, error } = await supabase
    .from('pending_sell_orders')
    .select(`
      *,
      profiles (
        full_name,
        email
      ),
      accounts (
        name,
        account_type
      )
    `)
    .eq('status', 'pending')
    .limit(1);
  
  const duration = Date.now() - startTime;
  
  if (error) {
    console.error('❌ Query FAILED:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    console.error('Duration:', duration + 'ms\n');
    
    if (error.message.includes('schema cache') || error.message.includes('relationship')) {
      console.error('⚠️  This is a SCHEMA CACHE ERROR');
      console.error('The NOTIFY command was sent, but may need more time to propagate.');
      console.error('Or you may need to manually reload via Supabase Dashboard.\n');
    }
    
    process.exit(1);
  }
  
  console.log('✅ Query SUCCEEDED!');
  console.log('Duration:', duration + 'ms');
  console.log('Records found:', data?.length || 0);
  
  if (data && data.length > 0) {
    console.log('\nSample data:');
    console.log('- Order ID:', data[0].id);
    console.log('- Symbol:', data[0].symbol);
    console.log('- User:', data[0].profiles?.full_name || 'N/A');
    console.log('- Email:', data[0].profiles?.email || 'N/A');
    console.log('- Account:', data[0].accounts?.name || 'N/A');
  }
  
  console.log('\n✨ Schema cache is working correctly!\n');
  process.exit(0);
}

testQuery();
