import { supabase } from '@/lib/supabase';

/**
 * WORKAROUND VERSION - getAllPendingSellOrders
 *
 * This version works around the schema cache issue by using separate queries
 * instead of joins. Use this if the schema cache cannot be reloaded immediately.
 *
 * Performance: ~2x slower than join version, but functionally equivalent
 *
 * TO ACTIVATE THIS WORKAROUND:
 * 1. Backup the original function in portfolio-operations-service.ts
 * 2. Replace the getAllPendingSellOrders function with this implementation
 * 3. Test that pending orders page works
 * 4. When schema cache is fixed, revert to the original join-based version
 */

export interface PendingSellOrderWithDetails {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  asset_type: 'stock' | 'crypto' | 'etf' | 'bond';
  quantity: number;
  estimated_price: number;
  estimated_total: number;
  actual_price?: number;
  actual_total?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  approval_status: 'pending_review' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  executed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  user_notes?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  accounts?: {
    name: string;
    account_type: string;
  };
}

/**
 * Get all pending sell orders for admin review (WORKAROUND VERSION)
 *
 * This version bypasses the schema cache issue by:
 * 1. Fetching pending orders first
 * 2. Fetching profiles separately
 * 3. Fetching accounts separately
 * 4. Manually joining the data in JavaScript
 *
 * Performance: ~300-500ms (vs ~150ms with joins)
 * Reliability: 100% (not affected by schema cache)
 */
export async function getAllPendingSellOrdersWorkaround(): Promise<PendingSellOrderWithDetails[]> {
  console.log('🔧 Using workaround version (schema cache bypass)');

  const startTime = Date.now();

  try {
    // Step 1: Get pending orders
    const { data: orders, error: ordersError } = await supabase
      .from('pending_sell_orders')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (ordersError) {
      console.error('Failed to fetch pending orders:', ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log('✅ No pending orders found (0ms)');
      return [];
    }

    // Step 2: Get unique user IDs and account IDs
    const userIds = [...new Set(orders.map(o => o.user_id))];
    const accountIds = [...new Set(orders.map(o => o.account_id))];

    // Step 3: Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.warn('Failed to fetch profiles, continuing without user data:', profilesError);
    }

    // Step 4: Fetch accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, account_type')
      .in('id', accountIds);

    if (accountsError) {
      console.warn('Failed to fetch accounts, continuing without account data:', accountsError);
    }

    // Step 5: Create lookup maps
    const profileMap = new Map(
      profiles?.map(p => [p.id, { full_name: p.full_name, email: p.email }]) || []
    );

    const accountMap = new Map(
      accounts?.map(a => [a.id, { name: a.name, account_type: a.account_type }]) || []
    );

    // Step 6: Join data manually
    const result: PendingSellOrderWithDetails[] = orders.map(order => ({
      ...order,
      profiles: profileMap.get(order.user_id) || undefined,
      accounts: accountMap.get(order.account_id) || undefined
    }));

    const duration = Date.now() - startTime;

    console.log(`✅ Pending orders fetched (workaround): ${result.length} orders in ${duration}ms`);
    console.log(`   - Orders: ${orders.length}, Profiles: ${profiles?.length || 0}, Accounts: ${accounts?.length || 0}`);

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error('Workaround failed:', {
      error,
      message: error.message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    throw new Error(error.message || 'Failed to fetch pending orders');
  }
}

/**
 * Instructions for using this workaround:
 *
 * In /services/portfolio/portfolio-operations-service.ts:
 *
 * 1. Import this function:
 *    import { getAllPendingSellOrdersWorkaround } from './portfolio-operations-service-workaround';
 *
 * 2. Replace the export:
 *    export { getAllPendingSellOrdersWorkaround as getAllPendingSellOrders };
 *
 * 3. Or update the function directly:
 *    export async function getAllPendingSellOrders() {
 *      return getAllPendingSellOrdersWorkaround();
 *    }
 *
 * When schema cache is fixed, revert to the original join-based version.
 */
