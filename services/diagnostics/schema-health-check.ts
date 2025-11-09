import { supabase } from '@/lib/supabase';

/**
 * Schema Health Check Service
 *
 * Provides diagnostics for database schema and relationship issues.
 * Useful for debugging "schema cache" and "relationship not found" errors.
 */

export interface HealthCheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  duration?: number;
  error?: string;
  details?: any;
}

export interface HealthCheckReport {
  timestamp: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  checks: HealthCheckResult[];
  recommendations: string[];
}

/**
 * Run a comprehensive health check on database schema and relationships
 */
export async function runSchemaHealthCheck(): Promise<HealthCheckReport> {
  const startTime = Date.now();
  const checks: HealthCheckResult[] = [];
  const recommendations: string[] = [];

  console.log('🔍 Starting schema health check...\n');

  // Check 1: pending_sell_orders table access
  checks.push(await checkTableAccess('pending_sell_orders'));

  // Check 2: profiles table access
  checks.push(await checkTableAccess('profiles'));

  // Check 3: accounts table access
  checks.push(await checkTableAccess('accounts'));

  // Check 4: pending_sell_orders → profiles join
  checks.push(await checkPendingOrdersProfilesJoin());

  // Check 5: pending_sell_orders → accounts join
  checks.push(await checkPendingOrdersAccountsJoin());

  // Check 6: Complete join (all tables)
  checks.push(await checkCompleteJoin());

  // Check 7: Data integrity
  checks.push(await checkDataIntegrity());

  // Determine overall status
  const failedChecks = checks.filter(c => c.status === 'FAIL' || c.status === 'ERROR');
  const overallStatus = failedChecks.length === 0 ? 'HEALTHY' :
                       failedChecks.length <= 2 ? 'DEGRADED' : 'UNHEALTHY';

  // Generate recommendations
  if (failedChecks.length > 0) {
    if (failedChecks.some(c => c.error?.includes('schema cache') ||
                              c.error?.includes('relationship'))) {
      recommendations.push('Reload Supabase schema cache (Settings → Database → Schema → Reload Schema)');
      recommendations.push('Wait 60 seconds after reloading for cache propagation');
    }

    if (failedChecks.some(c => c.error?.includes('permission') ||
                              c.error?.includes('policy'))) {
      recommendations.push('Review Row Level Security (RLS) policies for affected tables');
      recommendations.push('Ensure admin users have appropriate permissions');
    }

    if (failedChecks.some(c => c.name.includes('integrity'))) {
      recommendations.push('Check for orphaned records (orders without profiles)');
      recommendations.push('Verify foreign key constraints are properly defined');
    }
  }

  const totalDuration = Date.now() - startTime;

  const report: HealthCheckReport = {
    timestamp: new Date().toISOString(),
    overallStatus,
    checks,
    recommendations
  };

  // Print report
  console.log('\n' + '='.repeat(60));
  console.log('SCHEMA HEALTH CHECK REPORT');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall Status: ${getStatusEmoji(overallStatus)} ${overallStatus}`);
  console.log(`Duration: ${totalDuration}ms`);
  console.log('\nCHECKS:');
  console.log('-'.repeat(60));

  checks.forEach((check, i) => {
    console.log(`${i + 1}. ${check.name}`);
    console.log(`   Status: ${getStatusEmoji(check.status)} ${check.status}`);
    if (check.duration) console.log(`   Duration: ${check.duration}ms`);
    if (check.error) console.log(`   Error: ${check.error}`);
    if (check.details) console.log(`   Details: ${JSON.stringify(check.details)}`);
  });

  if (recommendations.length > 0) {
    console.log('\nRECOMMENDATIONS:');
    console.log('-'.repeat(60));
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  console.log('='.repeat(60) + '\n');

  return report;
}

/**
 * Check if a table is accessible
 */
async function checkTableAccess(tableName: string): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    const duration = Date.now() - startTime;

    if (error) {
      return {
        name: `Table access: ${tableName}`,
        status: 'FAIL',
        duration,
        error: error.message
      };
    }

    return {
      name: `Table access: ${tableName}`,
      status: 'PASS',
      duration,
      details: { recordCount: data?.length || 0 }
    };

  } catch (err: any) {
    return {
      name: `Table access: ${tableName}`,
      status: 'ERROR',
      duration: Date.now() - startTime,
      error: err.message
    };
  }
}

/**
 * Check pending_sell_orders → profiles join
 */
async function checkPendingOrdersProfilesJoin(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('pending_sell_orders')
      .select('id, user_id, profiles (id, full_name, email)')
      .limit(1);

    const duration = Date.now() - startTime;

    if (error) {
      return {
        name: 'Join: pending_sell_orders → profiles',
        status: 'FAIL',
        duration,
        error: error.message
      };
    }

    return {
      name: 'Join: pending_sell_orders → profiles',
      status: 'PASS',
      duration,
      details: { joinSuccessful: true }
    };

  } catch (err: any) {
    return {
      name: 'Join: pending_sell_orders → profiles',
      status: 'ERROR',
      duration: Date.now() - startTime,
      error: err.message
    };
  }
}

/**
 * Check pending_sell_orders → accounts join
 */
async function checkPendingOrdersAccountsJoin(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('pending_sell_orders')
      .select('id, account_id, accounts (id, name)')
      .limit(1);

    const duration = Date.now() - startTime;

    if (error) {
      return {
        name: 'Join: pending_sell_orders → accounts',
        status: 'FAIL',
        duration,
        error: error.message
      };
    }

    return {
      name: 'Join: pending_sell_orders → accounts',
      status: 'PASS',
      duration,
      details: { joinSuccessful: true }
    };

  } catch (err: any) {
    return {
      name: 'Join: pending_sell_orders → accounts',
      status: 'ERROR',
      duration: Date.now() - startTime,
      error: err.message
    };
  }
}

/**
 * Check complete join (all tables together)
 */
async function checkCompleteJoin(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('pending_sell_orders')
      .select(`
        *,
        profiles (full_name, email),
        accounts (name, account_type)
      `)
      .limit(1);

    const duration = Date.now() - startTime;

    if (error) {
      return {
        name: 'Complete join: pending_sell_orders + profiles + accounts',
        status: 'FAIL',
        duration,
        error: error.message
      };
    }

    return {
      name: 'Complete join: pending_sell_orders + profiles + accounts',
      status: 'PASS',
      duration,
      details: { allJoinsSuccessful: true }
    };

  } catch (err: any) {
    return {
      name: 'Complete join: pending_sell_orders + profiles + accounts',
      status: 'ERROR',
      duration: Date.now() - startTime,
      error: err.message
    };
  }
}

/**
 * Check data integrity (orders without profiles)
 */
async function checkDataIntegrity(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Get all pending order user_ids
    const { data: orders, error: ordersError } = await supabase
      .from('pending_sell_orders')
      .select('user_id')
      .eq('status', 'pending');

    if (ordersError) {
      return {
        name: 'Data integrity: orphaned records check',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: ordersError.message
      };
    }

    if (!orders || orders.length === 0) {
      return {
        name: 'Data integrity: orphaned records check',
        status: 'PASS',
        duration: Date.now() - startTime,
        details: { message: 'No pending orders to check' }
      };
    }

    // Check if profiles exist for all user_ids
    const userIds = [...new Set(orders.map(o => o.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', userIds);

    const duration = Date.now() - startTime;

    if (profilesError) {
      return {
        name: 'Data integrity: orphaned records check',
        status: 'FAIL',
        duration,
        error: profilesError.message
      };
    }

    const profileIds = new Set(profiles?.map(p => p.id) || []);
    const missingProfiles = userIds.filter(id => !profileIds.has(id));

    if (missingProfiles.length > 0) {
      return {
        name: 'Data integrity: orphaned records check',
        status: 'FAIL',
        duration,
        error: `Found ${missingProfiles.length} orders with missing profiles`,
        details: { missingProfileIds: missingProfiles }
      };
    }

    return {
      name: 'Data integrity: orphaned records check',
      status: 'PASS',
      duration,
      details: {
        totalOrders: orders.length,
        uniqueUsers: userIds.length,
        allProfilesExist: true
      }
    };

  } catch (err: any) {
    return {
      name: 'Data integrity: orphaned records check',
      status: 'ERROR',
      duration: Date.now() - startTime,
      error: err.message
    };
  }
}

/**
 * Get emoji for status
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'PASS':
    case 'HEALTHY':
      return '✅';
    case 'FAIL':
    case 'DEGRADED':
      return '⚠️';
    case 'ERROR':
    case 'UNHEALTHY':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Quick check - returns true if system is healthy
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('pending_sell_orders')
      .select('*, profiles(id), accounts(id)')
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
