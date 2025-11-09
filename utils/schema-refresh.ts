import { supabase } from '@/lib/supabase';

let schemaVerified = false;
let verificationAttempts = 0;
const MAX_ATTEMPTS = 3;

/**
 * Ensure Supabase schema is ready and accessible
 *
 * This function verifies that the database schema is properly loaded
 * in the Supabase client. It helps prevent "table not found" errors
 * caused by stale schema caches.
 *
 * @returns Promise<boolean> - true if schema is ready, false otherwise
 */
export async function ensureSchemaReady(): Promise<boolean> {
  // Return immediately if already verified
  if (schemaVerified) {
    return true;
  }

  // Prevent infinite loops
  if (verificationAttempts >= MAX_ATTEMPTS) {
    console.warn('⚠️ Schema verification failed after', MAX_ATTEMPTS, 'attempts');
    return false;
  }

  verificationAttempts++;

  try {
    console.log(`🔍 Verifying schema (attempt ${verificationAttempts}/${MAX_ATTEMPTS})...`);

    // Test connection to profiles table with a simple query
    // This query doesn't return data, just verifies the table exists
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(0);

    if (error) {
      console.error('❌ Schema verification failed:', error.message);

      // Check if this is a PostgREST schema cache issue
      if (error.message.includes('schema cache') ||
          error.message.includes('Could not find') ||
          error.message.includes('relationship')) {
        console.error('');
        console.error('⚠️  SCHEMA CACHE ERROR DETECTED');
        console.error('');
        console.error('The database tables exist, but Supabase PostgREST has a stale cache.');
        console.error('');
        console.error('RESOLUTION STEPS:');
        console.error('1. Open Supabase Dashboard: https://supabase.com/dashboard');
        console.error('2. Navigate to: Settings → Database → Schema');
        console.error('3. Click: "Reload Schema" button');
        console.error('4. Wait: 60 seconds for cache propagation');
        console.error('5. Reload this page');
        console.error('');
        console.error('Alternative: Clear browser cache and try incognito mode');
        console.error('');
      } else if (error.message.includes('relation') || error.message.includes('not found')) {
        console.error('🚨 CRITICAL: profiles table not accessible');
        console.error('💡 Try:');
        console.error('   1. Clear browser cache (Ctrl+Shift+Del)');
        console.error('   2. Open in Incognito/Private window');
        console.error('   3. Check .env file for correct SUPABASE_URL');
        console.error('   4. Verify database in Supabase dashboard');
      }

      return false;
    }

    // Also verify we can access accounts table
    const { error: accountsError } = await supabase
      .from('accounts')
      .select('id')
      .limit(0);

    if (accountsError) {
      console.error('❌ Accounts table not accessible:', accountsError.message);

      // Check for schema cache issues on accounts table too
      if (accountsError.message.includes('schema cache') ||
          accountsError.message.includes('Could not find')) {
        console.error('⚠️  This appears to be a PostgREST schema cache issue.');
        console.error('Please reload schema in Supabase Dashboard.');
      }

      return false;
    }

    schemaVerified = true;
    console.log('✅ Schema verified successfully');
    console.log('✅ All critical tables accessible');
    return true;

  } catch (error) {
    console.error('❌ Schema check exception:', error);
    return false;
  }
}

/**
 * Force a schema refresh by making a test query
 *
 * Use this function if you need to explicitly refresh the schema cache
 * after database changes or migrations.
 */
export async function refreshSchema(): Promise<void> {
  schemaVerified = false;
  verificationAttempts = 0;

  console.log('🔄 Refreshing schema cache...');

  const ready = await ensureSchemaReady();

  if (ready) {
    console.log('✅ Schema refresh complete');
  } else {
    console.error('❌ Schema refresh failed');
  }
}

/**
 * Reset schema verification state
 *
 * Call this when the app is reloaded or when you want to
 * force a fresh schema verification on next access.
 */
export function resetSchemaVerification(): void {
  schemaVerified = false;
  verificationAttempts = 0;
  console.log('🔄 Schema verification state reset');
}

// Auto-reset when the page is reloaded (browser only)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    resetSchemaVerification();
  });
}

// Export verification status
export function isSchemaVerified(): boolean {
  return schemaVerified;
}
