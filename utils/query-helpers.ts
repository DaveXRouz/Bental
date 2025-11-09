/**
 * Query Helpers
 *
 * Utilities for working with Supabase queries and debugging relationship issues.
 *
 * IMPORTANT: Understanding Foreign Key Relationships
 *
 * In this application, several tables reference auth.users.id but NOT profiles.id directly:
 * - pending_sell_orders.user_id → auth.users.id
 * - withdrawals.user_id → auth.users.id
 * - deposits.user_id → auth.users.id
 * - holdings.user_id → auth.users.id
 *
 * The profiles table has a special relationship:
 * - profiles.id → auth.users.id (1:1 relationship, profiles.id IS the auth.users.id)
 *
 * This means:
 * - There is NO direct foreign key from pending_sell_orders to profiles
 * - However, both tables share the same user_id value (auth.users.id)
 * - Supabase can automatically join them based on matching column names
 *
 * CORRECT Query Pattern (Implicit Join):
 * ```typescript
 * supabase
 *   .from('pending_sell_orders')
 *   .select(`
 *     *,
 *     profiles (full_name, email),
 *     accounts (name, balance)
 *   `)
 * ```
 *
 * INCORRECT Query Pattern (Foreign Key Hint):
 * ```typescript
 * supabase
 *   .from('pending_sell_orders')
 *   .select(`
 *     *,
 *     profiles!pending_sell_orders_user_id_fkey (full_name, email)
 *   `)
 * ```
 * ❌ This fails because pending_sell_orders_user_id_fkey points to auth.users, not profiles!
 *
 * When to use Foreign Key Hints:
 * - Only use hints when there are MULTIPLE foreign keys to the same table
 * - Example: If a table has both "created_by" and "updated_by" referencing auth.users
 * - In such cases, specify which FK to use: `profiles!table_created_by_fkey(name)`
 *
 * When to use Implicit Joins:
 * - When there's only ONE possible join path between tables (most cases)
 * - When both tables reference the same UUID (even through different FKs)
 * - This is simpler, more maintainable, and less error-prone
 */

/**
 * Log detailed query error information for debugging
 */
export function logQueryError(
  queryName: string,
  error: any,
  additionalContext?: Record<string, any>
) {
  console.error(`[Query Error] ${queryName}:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    ...additionalContext,
  });
}

/**
 * Validate that a query result has the expected joined data
 */
export function validateJoinedData<T extends Record<string, any>>(
  data: T[],
  expectedJoins: string[]
): { valid: boolean; missing: string[] } {
  if (!data || data.length === 0) {
    return { valid: true, missing: [] };
  }

  const firstItem = data[0];
  const missing = expectedJoins.filter(join => !(join in firstItem));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Common table relationships in the application
 */
export const TABLE_RELATIONSHIPS = {
  // Tables that reference auth.users.id directly (NOT profiles.id)
  AUTH_USER_REFERENCES: [
    'pending_sell_orders',
    'withdrawals',
    'deposits',
    'holdings',
    'accounts',
    'transactions',
    'watchlist',
    'bots',
    'bot_trades',
    'user_transfer_preferences',
    'portfolio_operations_audit',
    'portfolio_state_snapshots',
  ],

  // Tables that reference other tables
  ACCOUNT_REFERENCES: [
    'holdings',
    'pending_sell_orders',
    'withdrawals',
    'deposits',
    'transactions',
    'portfolio_state_snapshots',
  ],

  // Notes about the profiles table
  PROFILES_NOTE: `
    The profiles table is special:
    - profiles.id = auth.users.id (they are the SAME UUID)
    - This is a 1:1 relationship
    - To join with profiles, use implicit joins: profiles(columns)
    - Do NOT use foreign key hints unless you know the exact FK name
  `,
} as const;

/**
 * Example of correct query patterns
 */
export const QUERY_EXAMPLES = {
  // ✅ Correct: Implicit join
  CORRECT_IMPLICIT_JOIN: `
    const { data } = await supabase
      .from('pending_sell_orders')
      .select(\`
        *,
        profiles (full_name, email),
        accounts (name, balance)
      \`);
  `,

  // ❌ Incorrect: Non-existent foreign key hint
  INCORRECT_FK_HINT: `
    const { data } = await supabase
      .from('pending_sell_orders')
      .select(\`
        *,
        profiles!pending_sell_orders_user_id_fkey (full_name, email)
      \`);
    // Error: Could not find a relationship between 'pending_sell_orders' and 'profiles'
  `,

  // ✅ Correct: Foreign key hint when needed
  CORRECT_FK_HINT_WHEN_NEEDED: `
    // Only when table has MULTIPLE FKs to the same table
    const { data } = await supabase
      .from('audit_log')
      .select(\`
        *,
        created_by:profiles!audit_log_created_by_fkey (full_name),
        reviewed_by:profiles!audit_log_reviewed_by_fkey (full_name)
      \`);
  `,
} as const;
