#!/usr/bin/env node

/**
 * Environment and Login Test
 * Tests if environment variables are loaded and if authentication works
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('\n' + '='.repeat(60));
console.log('🔍 ENVIRONMENT & LOGIN TEST');
console.log('='.repeat(60));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('  EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NOT SET');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('\n❌ ERROR: Environment variables not set!');
  console.log('\nMake sure .env file contains:');
  console.log('  EXPO_PUBLIC_SUPABASE_URL=https://oanohrjkniduqkkahmel.supabase.co');
  console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
  process.exit(1);
}

console.log('\n✅ Environment variables loaded successfully');

// Test Supabase connection
const supabase = createClient(url, key);

async function testLogin() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing Login with amanda.taylor@demo.com');
  console.log('='.repeat(60));

  const email = 'amanda.taylor@demo.com';
  const password = 'Welcome2025!';

  console.log('\n📤 Login attempt:');
  console.log('  Email:', email);
  console.log('  Password:', password);
  console.log('  Password length:', password.length);
  console.log('  Password chars:', Array.from(password).map(c => c.charCodeAt(0)).join(','));

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log('\n❌ LOGIN FAILED');
    console.log('  Error:', error.message);
    console.log('  Status:', error.status);
    return false;
  }

  console.log('\n✅ LOGIN SUCCESS');
  console.log('  User ID:', data.user?.id);
  console.log('  Email:', data.user?.email);

  // Check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile) {
    console.log('  Name:', profile.full_name);
    console.log('  Role:', profile.role);
  }

  await supabase.auth.signOut();
  return true;
}

// Run test
testLogin()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ ALL TESTS PASSED');
      console.log('\nConclusion:');
      console.log('  - Environment variables are loaded correctly');
      console.log('  - Supabase connection works');
      console.log('  - Password authentication works');
      console.log('\n  The issue must be in the app\'s runtime environment!');
    } else {
      console.log('❌ TESTS FAILED');
    }
    console.log('='.repeat(60) + '\n');
  })
  .catch(err => {
    console.error('\n❌ UNEXPECTED ERROR:', err);
  });
