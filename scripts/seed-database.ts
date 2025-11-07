/**
 * Database Seeding Script - DISABLED
 *
 * This script has been disabled to prevent creation of demo accounts
 * with pre-populated balances.
 *
 * All user accounts must start with $0.00 balance.
 * Users can deposit funds through the deposit workflow which requires admin approval.
 *
 * For development/testing purposes:
 * 1. Create users manually through the signup flow
 * 2. All accounts will start with $0.00 balance
 * 3. Test the deposit workflow (status: pending)
 * 4. Test the admin approval workflow
 * 5. Verify balance updates only after admin approval
 *
 * IMPORTANT SECURITY NOTE:
 * - Never seed production data with pre-populated balances
 * - All balance changes must go through proper approval workflows
 * - Maintain audit trails for all financial transactions
 */

console.log('⚠️  Database seeding disabled');
console.log('📋 All accounts must start with $0.00 balance');
console.log('💰 Use the deposit workflow (with admin approval) to add funds');
console.log('🔒 This protects against unauthorized balance assignments');
console.log('');
console.log('This script has been disabled to prevent demo account creation.');
console.log('');
console.log('For testing, please:');
console.log('1. Sign up users through the normal signup flow');
console.log('2. Create accounts through the account creation modal');
console.log('3. Test deposits with pending status');
console.log('4. Test admin approval workflow');

process.exit(0);
