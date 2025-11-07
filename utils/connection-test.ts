import { supabase } from '@/lib/supabase';

export interface ConnectionTestResult {
  success: boolean;
  authenticated: boolean;
  canFetchData: boolean;
  error?: string;
  details?: any;
}

/**
 * Tests the Supabase connection and authentication
 * Returns detailed information about what's working and what's not
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const result: ConnectionTestResult = {
    success: false,
    authenticated: false,
    canFetchData: false,
  };

  try {
    // Test 1: Check if we can get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      result.error = `Session error: ${sessionError.message}`;
      result.details = sessionError;
      return result;
    }

    if (!session) {
      result.error = 'Not authenticated - no active session';
      return result;
    }

    result.authenticated = true;

    // Test 2: Try a simple query to test database connectivity
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (queryError) {
      result.error = `Query error: ${queryError.message}`;
      result.details = {
        code: queryError.code,
        hint: queryError.hint,
        details: queryError.details,
      };
      return result;
    }

    result.canFetchData = true;
    result.success = true;

    return result;
  } catch (error: any) {
    result.error = `Connection test failed: ${error.message || 'Unknown error'}`;
    result.details = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    };
    return result;
  }
}

/**
 * Quick check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}

/**
 * Get detailed authentication status
 */
export async function getAuthStatus() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return {
        authenticated: false,
        error: error.message,
        details: error,
      };
    }

    if (!session) {
      return {
        authenticated: false,
        error: 'No active session',
      };
    }

    return {
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at,
    };
  } catch (error: any) {
    return {
      authenticated: false,
      error: error.message || 'Unknown error',
      details: error,
    };
  }
}
