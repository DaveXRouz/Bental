/**
 * Safe Supabase Utility
 * Provides defensive wrappers for Supabase calls with automatic error handling,
 * retry logic, and graceful degradation
 */

import { supabase } from '@/lib/supabase';

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
}

interface SafeCallOptions extends RetryOptions {
  fallbackValue?: any;
  logErrors?: boolean;
  throwOnError?: boolean;
}

/**
 * Safely execute a Supabase RPC function with error handling and retry logic
 */
export async function safeRpcCall<T = any>(
  functionName: string,
  params: Record<string, any> = {},
  options: SafeCallOptions = {}
): Promise<{ data: T | null; error: any; success: boolean }> {
  const {
    maxRetries = 2,
    delayMs = 1000,
    exponentialBackoff = true,
    fallbackValue = null,
    logErrors = true,
    throwOnError = false,
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.rpc(functionName, params);

      if (error) {
        lastError = error;

        // Don't retry on certain errors
        if (
          error.message?.includes('function') &&
          error.message?.includes('does not exist')
        ) {
          if (logErrors) {
            console.warn(
              `[SafeSupabase] RPC function "${functionName}" does not exist. Skipping retries.`
            );
          }
          break;
        }

        // Retry on network or temporary errors
        if (attempt < maxRetries) {
          const delay = exponentialBackoff
            ? delayMs * Math.pow(2, attempt)
            : delayMs;

          if (logErrors) {
            console.warn(
              `[SafeSupabase] RPC call "${functionName}" failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Success
        return { data, error: null, success: true };
      }
    } catch (err: any) {
      lastError = err;

      if (logErrors) {
        console.error(
          `[SafeSupabase] Exception in RPC call "${functionName}":`,
          err
        );
      }

      if (attempt < maxRetries) {
        const delay = exponentialBackoff
          ? delayMs * Math.pow(2, attempt)
          : delayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All attempts failed
  if (logErrors) {
    console.error(
      `[SafeSupabase] RPC call "${functionName}" failed after ${maxRetries + 1} attempts:`,
      lastError
    );
  }

  if (throwOnError) {
    throw lastError;
  }

  return {
    data: fallbackValue,
    error: lastError,
    success: false,
  };
}

/**
 * Safely execute a Supabase query with error handling
 */
export async function safeQuery<T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: SafeCallOptions = {}
): Promise<{ data: T | null; error: any; success: boolean }> {
  const {
    maxRetries = 2,
    delayMs = 1000,
    exponentialBackoff = true,
    fallbackValue = null,
    logErrors = true,
    throwOnError = false,
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await queryFn();

      if (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = exponentialBackoff
            ? delayMs * Math.pow(2, attempt)
            : delayMs;

          if (logErrors) {
            console.warn(
              `[SafeSupabase] Query failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } else {
        return { data, error: null, success: true };
      }
    } catch (err: any) {
      lastError = err;

      if (logErrors) {
        console.error('[SafeSupabase] Exception in query:', err);
      }

      if (attempt < maxRetries) {
        const delay = exponentialBackoff
          ? delayMs * Math.pow(2, attempt)
          : delayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  if (logErrors) {
    console.error(
      `[SafeSupabase] Query failed after ${maxRetries + 1} attempts:`,
      lastError
    );
  }

  if (throwOnError) {
    throw lastError;
  }

  return {
    data: fallbackValue,
    error: lastError,
    success: false,
  };
}

/**
 * Fire-and-forget Supabase operation (for logging, auditing, etc.)
 * Failures won't block the calling code
 */
export async function fireAndForget(
  operation: () => Promise<any>,
  operationName: string = 'operation'
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    console.warn(`[SafeSupabase] Fire-and-forget "${operationName}" failed:`, error);
    // Intentionally not throwing - this is fire-and-forget
  }
}

/**
 * Check if Supabase is reachable
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('[SafeSupabase] Health check failed:', error);
    return false;
  }
}

/**
 * Batch multiple Supabase operations with error handling
 */
export async function safeBatch<T = any>(
  operations: (() => Promise<any>)[],
  options: {
    stopOnError?: boolean;
    logErrors?: boolean;
  } = {}
): Promise<{ results: T[]; errors: any[]; allSucceeded: boolean }> {
  const { stopOnError = false, logErrors = true } = options;
  const results: T[] = [];
  const errors: any[] = [];

  for (let i = 0; i < operations.length; i++) {
    try {
      const result = await operations[i]();
      results.push(result);
      errors.push(null);
    } catch (error) {
      results.push(null as T);
      errors.push(error);

      if (logErrors) {
        console.error(`[SafeSupabase] Batch operation ${i + 1} failed:`, error);
      }

      if (stopOnError) {
        break;
      }
    }
  }

  return {
    results,
    errors,
    allSucceeded: errors.every((e) => e === null),
  };
}
