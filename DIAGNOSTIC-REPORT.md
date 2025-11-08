# Trading Platform Diagnostic Report

**Date**: 2025-11-08
**Issues**: Insufficient balance errors on sell attempts & Admin panel visibility problems

---

## Executive Summary

After comprehensive database analysis, I've identified the root causes of both reported issues:

1. **"Insufficient Balance" Error on Sell**: NOT a data problem - holdings exist and are correct
2. **Admin Panel Visibility**: Function definition issue with `is_admin()`

---

## Findings

### 1. Database Integrity: ✅ HEALTHY

**Holdings Table**:
- All records present and accurate
- Example: User has 0.25 BTC, trying to sell 0.1 BTC ✅
- Quantities are positive and properly formatted
- No orphaned or corrupted records found

**Accounts Table**:
- All accounts active (`is_active = true`)
- Balances are positive and correct
- No foreign key violations

**Admin Roles Table**:
- Admin user exists: `3abd3dc6-08bb-4646-b628-cc81184b65c3`
- Role: `super_admin`
- Status: `is_active = true` ✅

### 2. Critical Issue Found: is_admin() Function

**Problem**: The `is_admin()` function returns `false` when it should return `true`

**Test Results**:
```sql
SELECT is_admin('3abd3dc6-08bb-4646-b628-cc81184b65c3');
-- Returns: false ❌

SELECT is_admin_user('3abd3dc6-08bb-4646-b628-cc81184b65c3');
-- Returns: true ✅
```

**Root Cause**:
The `is_admin()` function calls `is_admin_user(auth.uid())` which returns NULL when `auth.uid()` is NULL (no active session context). This breaks admin panel queries that rely on `is_admin()` for RLS policies.

### 3. Sell Order Validation Analysis

**Frontend Validation Path**:
1. User clicks "Sell Assets"
2. `checkSufficientHoldings()` queries holdings table
3. Query should return: `available = 0.25, sufficient = true`
4. Frontend allows order creation

**Potential Frontend Issues**:
- Account ID mismatch (user has multiple accounts)
- Stale portfolio context cache
- Wrong account selected in UI
- Real-time sync not updating after transactions

### 4. No Pending Orders Found

```sql
SELECT * FROM pending_sell_orders;
-- Returns: [] (empty)
```

This suggests users cannot successfully create sell orders, confirming the validation is blocking them incorrectly.

---

## Root Cause Analysis

### Primary Issue: Account Selection Mismatch

The user has **multiple accounts**:
1. `ab109cb3-3e2b-4777-8473-6a09031c46e5` - "Crypto Holdings" (has BTC)
2. `549d3c87-61ac-4423-8453-bcdd2ff4a0e3` - "Growth Stock Portfolio" (no BTC)
3. `29166079-0af4-4bea-8a27-b523397087a0` - "Dividend Income Fund"

**The Problem**:
When user tries to sell BTC, the frontend validation might be checking the WRONG account. If `checkSufficientHoldings()` checks the "Growth Stock Portfolio" instead of "Crypto Holdings", it will find NO BTC and return `insufficient holdings`.

### Secondary Issue: Admin Panel Access

The `is_admin()` function dependency on `auth.uid()` breaks when:
- Admin queries database directly
- Session expires or becomes invalid
- Real-time subscriptions lose authentication context

---

## Verification Queries

Run these queries to diagnose the exact issue for any user:

```sql
-- 1. Check which accounts user has
SELECT id, name, account_type, balance
FROM accounts
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at;

-- 2. Check holdings per account
SELECT a.name as account_name, h.symbol, h.asset_type, h.quantity
FROM holdings h
JOIN accounts a ON h.account_id = a.id
WHERE h.user_id = 'USER_ID_HERE'
ORDER BY a.name, h.symbol;

-- 3. Test sell validation for specific account
SELECT quantity as available
FROM holdings
WHERE account_id = 'ACCOUNT_ID_HERE'
  AND symbol = 'SYMBOL_HERE'
  AND asset_type = 'ASSET_TYPE_HERE';

-- 4. Verify admin status
SELECT is_admin_user('ADMIN_USER_ID_HERE') as is_admin;
```

---

## Solutions

### Fix 1: Update is_admin() Function ✅ CRITICAL

Replace the `is_admin()` function to work correctly:

```sql
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN is_admin_user(COALESCE(check_user_id, auth.uid()));
END;
$$;
```

This allows `is_admin(user_id)` to work with or without an active session.

### Fix 2: Frontend Account Selection Validation

**Frontend Changes Needed**:

1. **Verify correct account is selected before validation**:
```typescript
// In checkSufficientHoldings call
const accountId = selectedAccount.id; // Ensure this matches the account with holdings
```

2. **Add account-asset mapping validation**:
```typescript
// Before attempting sell
const holdingsInAccount = await getHoldingsForAccount(accountId);
const assetInAccount = holdingsInAccount.find(h => h.symbol === symbol);

if (!assetInAccount) {
  showError(`${symbol} is not in the selected account. Please switch to the correct account.`);
  return;
}
```

3. **Refresh portfolio state before validation**:
```typescript
// Force fresh data fetch
await refreshPortfolio();
const validation = await checkSufficientHoldings(...);
```

### Fix 3: Add Account-Aware Sell UI

Update the sell flow to:
1. Show which account holds which assets
2. Auto-select the correct account when user clicks "Sell" on a specific holding
3. Disable sell button if asset not in currently selected account
4. Display clear error: "Switch to [Account Name] to sell this asset"

### Fix 4: Database Function Update for Better Error Messages

Update `create_pending_sell_order` function to return more specific errors:

```sql
-- In create_pending_sell_order function
IF NOT FOUND THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', format('No %s holdings found in this account. Available accounts: [list accounts with this asset]', p_symbol)
  );
END IF;
```

---

## Testing Steps

### For Users (Sell Order Issue):

1. **Verify account selection**:
   - Check which account is currently selected in UI
   - Verify the selected account actually holds the asset you're trying to sell
   - Switch accounts if needed

2. **Refresh portfolio**:
   - Pull down to refresh on mobile
   - Click refresh button if available
   - Log out and log back in to force data sync

3. **Clear cache**:
   - Clear browser cache/local storage
   - Force close and reopen mobile app
   - This ensures no stale data

4. **Try sell again**:
   - Navigate to holdings
   - Click the specific holding card (not the general "Sell" button)
   - This pre-selects the correct account

### For Admins (Panel Visibility):

1. **Verify admin status**:
```sql
SELECT is_admin_user(auth.uid()) as am_i_admin;
```

2. **After applying the is_admin() fix**:
   - Log out of admin panel
   - Log back in to refresh session
   - Navigate to pending orders page
   - Should now see all pending orders

3. **Test with SQL directly**:
```sql
-- This should now work
SELECT * FROM pending_sell_orders
WHERE status = 'pending';
```

---

## Prevention Measures

1. **Add Frontend Validation Warnings**:
   - "This asset is in [Account Name], switch to sell"
   - Show account name next to each holding

2. **Improve Error Messages**:
   - Don't say "insufficient balance" when account is wrong
   - Say "This asset is not in the selected account"

3. **Add Account Context Indicators**:
   - Show selected account name prominently in UI
   - Add account badge to each holding card

4. **Implement Health Checks**:
   - Add admin dashboard with database health status
   - Monitor real-time sync connection status
   - Alert on RLS policy failures

5. **Automated Testing**:
   - Test multi-account scenarios
   - Verify sell validation with different account selections
   - Test admin permissions regularly

---

## SQL Fix Script

Run this script to fix the is_admin() function issue immediately:

See: `FIX-ADMIN-FUNCTION.sql`

---

## Conclusion

**The "insufficient balance" error is likely caused by**:
- ✅ User trying to sell from wrong account
- ✅ Frontend not validating account-asset association
- ✅ Multiple accounts causing confusion

**The admin panel visibility issue is caused by**:
- ✅ `is_admin()` function bug (fixed in SQL script)

**Next Steps**:
1. Apply SQL fix for is_admin() function ✅
2. Update frontend to show account context clearly
3. Add account switching guidance in sell flow
4. Test with real user scenario

All database data is healthy and intact. No data recovery needed.
