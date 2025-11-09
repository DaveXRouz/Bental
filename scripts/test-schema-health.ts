#!/usr/bin/env ts-node

/**
 * Schema Health Check Test Script
 *
 * Run this script to diagnose database schema and relationship issues.
 *
 * Usage:
 *   npx ts-node scripts/test-schema-health.ts
 *
 * Or add to package.json:
 *   "scripts": {
 *     "test:schema": "npx ts-node scripts/test-schema-health.ts"
 *   }
 */

import { runSchemaHealthCheck } from '../services/diagnostics/schema-health-check';

async function main() {
  console.log('Starting Schema Health Check...\n');

  try {
    const report = await runSchemaHealthCheck();

    // Exit with appropriate code
    if (report.overallStatus === 'HEALTHY') {
      console.log('✅ All checks passed! Schema is healthy.\n');
      process.exit(0);
    } else if (report.overallStatus === 'DEGRADED') {
      console.log('⚠️  Some checks failed. Schema has issues but may be functional.\n');
      process.exit(1);
    } else {
      console.log('❌ Critical checks failed. Schema is unhealthy.\n');
      process.exit(2);
    }
  } catch (error) {
    console.error('Fatal error running health check:', error);
    process.exit(3);
  }
}

main();
