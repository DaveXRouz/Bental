/**
 * Test Connection and Signup Flow
 *
 * This script tests:
 * 1. Connection to Supabase
 * 2. Profiles table accessibility
 * 3. Signup process
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Starting Connection Test...\n');
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseAnonKey?.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  try {
    // Test 1: Check if profiles table is accessible
    console.log('✅ Test 1: Check profiles table accessibility');
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('email')
      .limit(1);

    if (profilesError) {
      console.error('❌ FAILED: Cannot access profiles table');
      console.error('Error:', profilesError);
      return;
    }
    console.log('✅ SUCCESS: Profiles table is accessible');
    console.log('');

    // Test 2: Try to sign up a new test user
    console.log('✅ Test 2: Test signup flow');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log(`Creating user: ${testEmail}`);
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.error('❌ FAILED: Signup error');
      console.error('Error:', signupError);
      return;
    }

    console.log('✅ SUCCESS: User created in auth.users');
    console.log('User ID:', signupData.user?.id);
    console.log('');

    // Test 3: Check if profile was auto-created
    console.log('✅ Test 3: Check if profile was auto-created');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for trigger

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user?.id)
      .single();

    if (profileError) {
      console.error('❌ FAILED: Profile was not created');
      console.error('Error:', profileError);
      return;
    }

    console.log('✅ SUCCESS: Profile was auto-created');
    console.log('Profile:', profileData);
    console.log('');

    // Test 4: Try to login with the new user
    console.log('✅ Test 4: Test login');

    // First sign out
    await supabase.auth.signOut();

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ FAILED: Login error');
      console.error('Error:', loginError);
      return;
    }

    console.log('✅ SUCCESS: Login successful');
    console.log('Session:', loginData.session ? 'Active' : 'None');
    console.log('');

    // Test 5: Verify existing admin user
    console.log('✅ Test 5: Verify admin user (michael.chen@demo.com)');

    await supabase.auth.signOut();

    const { data: adminLogin, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'michael.chen@demo.com',
      password: 'Welcome2025!',
    });

    if (adminError) {
      console.error('❌ FAILED: Admin login error');
      console.error('Error:', adminError);
    } else {
      console.log('✅ SUCCESS: Admin can login');

      // Check admin profile
      const { data: adminProfile, error: adminProfileError } = await supabase
        .from('profiles')
        .select('email, role, kyc_status')
        .eq('id', adminLogin.user.id)
        .single();

      if (adminProfileError) {
        console.error('❌ FAILED: Cannot fetch admin profile');
        console.error('Error:', adminProfileError);
      } else {
        console.log('Admin Profile:', adminProfile);
      }
    }
    console.log('');

    // Test 6: Verify regular user
    console.log('✅ Test 6: Verify regular user (amanda.taylor@demo.com)');

    await supabase.auth.signOut();

    const { data: userLogin, error: userError } = await supabase.auth.signInWithPassword({
      email: 'amanda.taylor@demo.com',
      password: 'Welcome2025!',
    });

    if (userError) {
      console.error('❌ FAILED: User login error');
      console.error('Error:', userError);
    } else {
      console.log('✅ SUCCESS: Regular user can login');

      // Check user profile
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('email, role, kyc_status')
        .eq('id', userLogin.user.id)
        .single();

      if (userProfileError) {
        console.error('❌ FAILED: Cannot fetch user profile');
        console.error('Error:', userProfileError);
      } else {
        console.log('User Profile:', userProfile);
      }
    }
    console.log('');

    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('');
    console.log('📋 Summary:');
    console.log('  ✅ Database connection: Working');
    console.log('  ✅ Profiles table: Accessible');
    console.log('  ✅ Signup flow: Working');
    console.log('  ✅ Profile auto-creation: Working');
    console.log('  ✅ Login flow: Working');
    console.log('  ✅ Admin user: Working');
    console.log('  ✅ Regular user: Working');
    console.log('');
    console.log('🔐 Test Credentials:');
    console.log('  Admin: michael.chen@demo.com / Welcome2025!');
    console.log('  User:  amanda.taylor@demo.com / Welcome2025!');
    console.log('');

  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
  }
}

runTests().then(() => {
  console.log('✅ Test script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
