#!/usr/bin/env node

/**
 * Login Debug Test Script
 *
 * This script tests login functionality directly against Supabase
 * to help diagnose password authentication issues.
 */

const { createClient } = require('@supabase/supabase-js');

const url = 'https://oanohrjkniduqkkahmel.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbm9ocmprbmlkdXFra2FobWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDIyOTEsImV4cCI6MjA3NzQxODI5MX0.Soav_sSh5Ww_BJ7AJywhToZhDIXemEb9X7hSj9xNmdo';

const supabase = createClient(url, key);

// Test accounts and their correct passwords
const TEST_ACCOUNTS = [
  { email: 'michael.chen@demo.com', password: 'Welcome2025!', role: 'admin' },
  { email: 'amanda.taylor@demo.com', password: 'Welcome2025!', role: 'user' },
];

// Common password mistakes to test
const COMMON_MISTAKES = [
  'welcome2025!',     // lowercase w
  'WELCOME2025!',     // all caps
  'Welcome2025',      // missing !
  'Welcome2025 !',    // space before !
  ' Welcome2025!',    // leading space
  'Welcome2025! ',    // trailing space
  'Test123456!',      // old password
];

function analyzePassword(password) {
  console.log('\n📋 Password Analysis:');
  console.log(`  Length: ${password.length}`);
  console.log(`  First char: '${password.charAt(0)}' (code: ${password.charCodeAt(0)})`);
  console.log(`  Last char: '${password.charAt(password.length - 1)}' (code: ${password.charCodeAt(password.length - 1)})`);
  console.log(`  Has leading space: ${password !== password.trimStart()}`);
  console.log(`  Has trailing space: ${password !== password.trimEnd()}`);
  console.log(`  Trimmed length: ${password.trim().length}`);
  console.log(`  Character codes: [${Array.from(password).map(c => c.charCodeAt(0)).join(', ')}]`);
}

async function testLogin(email, password, description = '') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${description || email}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Email: ${email}`);
  console.log(`Password: "${password}" (showing with quotes to reveal spaces)`);

  analyzePassword(password);

  const startTime = Date.now();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  const duration = Date.now() - startTime;

  if (error) {
    console.log(`\n❌ FAILED (${duration}ms)`);
    console.log(`Error: ${error.message}`);
    console.log(`Status: ${error.status}`);
    return false;
  } else {
    console.log(`\n✅ SUCCESS (${duration}ms)`);
    console.log(`User ID: ${data.user?.id}`);
    console.log(`User Email: ${data.user?.email}`);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, using_default_password')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile) {
      console.log(`Full Name: ${profile.full_name}`);
      console.log(`Role: ${profile.role}`);
      console.log(`Using Default Password: ${profile.using_default_password}`);
    }

    // Sign out after successful test
    await supabase.auth.signOut();
    return true;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 LOGIN DEBUG TEST SCRIPT');
  console.log('='.repeat(60));
  console.log('\nThis script will test login functionality directly');
  console.log('to help diagnose password authentication issues.\n');

  // Test 1: Correct credentials
  console.log('\n📝 TEST SUITE 1: Correct Credentials');
  console.log('-'.repeat(60));

  for (const account of TEST_ACCOUNTS) {
    await testLogin(
      account.email,
      account.password,
      `${account.role.toUpperCase()} - Correct Password`
    );
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
  }

  // Test 2: Common mistakes
  console.log('\n\n📝 TEST SUITE 2: Common Password Mistakes');
  console.log('-'.repeat(60));
  console.log('Testing common password entry errors for amanda.taylor@demo.com\n');

  for (const wrongPassword of COMMON_MISTAKES) {
    await testLogin(
      'amanda.taylor@demo.com',
      wrongPassword,
      `Common Mistake: "${wrongPassword}"`
    );
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test 3: Password variations
  console.log('\n\n📝 TEST SUITE 3: Password Case Sensitivity');
  console.log('-'.repeat(60));

  const correctPassword = 'Welcome2025!';
  const variations = [
    correctPassword,
    correctPassword.toLowerCase(),
    correctPassword.toUpperCase(),
    correctPassword.charAt(0).toLowerCase() + correctPassword.slice(1),
  ];

  for (const variation of variations) {
    await testLogin(
      'amanda.taylor@demo.com',
      variation,
      `Case Variation: "${variation}"`
    );
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Correct Password: Welcome2025!');
  console.log('   - Capital W, lowercase rest');
  console.log('   - Ends with exclamation mark (!)');
  console.log('   - No spaces before or after');
  console.log('   - Exactly 12 characters');
  console.log('\n❌ Common mistakes that will FAIL:');
  console.log('   - welcome2025! (lowercase w)');
  console.log('   - WELCOME2025! (all caps)');
  console.log('   - Welcome2025 (missing !)');
  console.log('   - Spaces before or after password');
  console.log('   - Any other variation');
  console.log('\n💡 TIPS:');
  console.log('   1. Copy-paste the password from documentation');
  console.log('   2. Use password visibility toggle to verify');
  console.log('   3. Check browser saved passwords');
  console.log('   4. Try incognito mode to avoid autocomplete');
  console.log('   5. Manually type character by character if needed');
  console.log('\n' + '='.repeat(60));
}

// Run the tests
runTests().catch(console.error);
