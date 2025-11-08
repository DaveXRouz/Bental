# Trading Platform Troubleshooting Guide

**Issues Resolved**: ✅ Insufficient balance errors & ✅ Admin panel visibility

---

## Quick Fix Summary

### ✅ Admin Panel Issue - FIXED

**Problem**: Admins couldn't see pending orders or admin panel data.

**Root Cause**: The `is_admin()` database function was checking the wrong table (profiles instead of admin_roles).

**Solution Applied**: Updated both versions of `is_admin()` function to correctly query the admin_roles table.

**What to do now**:
1. Log out of admin panel
2. Log back in to refresh your session
3. Navigate to Pending Orders - you should now see all pending orders ✅

---

### ⚠️ "Insufficient Balance" on Sell - IDENTIFIED

**Problem**: Users get "insufficient balance" error when trying to sell assets they own.

**Root Cause**: Users have multiple accounts, and the wrong account is selected when attempting to sell.

**Example**:
- User has BTC in "Crypto Holdings" account
- User tries to sell BTC while "Growth Stock Portfolio" account is selected
- System checks the selected account, finds no BTC → shows "insufficient balance" error

**This is NOT a bug - it's a UX issue!** The system is working correctly.

---

## For Users: How to Sell Assets Successfully

### Step 1: Verify Which Account Holds Your Asset

Before selling, check which account contains the asset:

1. Go to **Portfolio** screen
2. Look at your holdings list
3. Note which account name appears under each asset
4. If you have multiple accounts, each will show separately

**Example**:
```
📊 Crypto Holdings (Account)
├─ BTC: 0.25 ($16,808.64)
└─ ETH: 2.50 ($8,641.70)

💼 Growth Stock Portfolio (Account)
├─ META: 25.00 ($12,170.00)
└─ TSLA: 35.00 ($8,494.15)
```

### Step 2: Select the Correct Account

**Method A: Click on the specific holding card**
1. Find the asset you want to sell in the holdings list
2. **Tap directly on that holding card**
3. This opens the Position Detail Modal
4. Click "Sell" button in the modal
5. The system will automatically use the correct account ✅

**Method B: Switch accounts manually**
1. Look for the account selector (usually at top of screen)
2. Select the account that holds the asset
3. Verify you see the asset in the holdings list
4. Now click "Sell Assets" button

### Step 3: Complete the Sell Order

1. Trading modal opens with asset pre-selected
2. Enter quantity to sell (must be ≤ available quantity)
3. Add optional notes for admin review
4. Click "Submit for Approval"
5. Order goes to admin for review ✅

### Troubleshooting Sell Errors

**Error: "Insufficient balance"**
→ You selected the wrong account. Go back and use Method A above.

**Error: "No holdings found"**
→ You're on the wrong account. Switch to the account that actually holds this asset.

**Error: "Asset not found in this account"**
→ Use the account selector to switch to the correct account, or tap the holding card directly.

**Can't find the asset I want to sell**
→ Check all your accounts. You may have multiple accounts and the asset is in a different one.

---

## For Admins: How to Review Pending Orders

### Access Admin Panel

1. Log in with your admin credentials
2. Navigate to **Admin Panel** (should appear in navigation if you're an admin)
3. Go to **Pending Orders** section

### Review and Approve/Reject Orders

**View Order Details**:
- User name and email
- Symbol, quantity, and estimated price
- Submission time
- User notes (if provided)
- Account name

**Approve Order**:
1. Click "Approve" button
2. Enter the actual execution price
3. Add admin notes (optional)
4. Confirm approval
5. System executes the trade:
   - Updates user's holdings
   - Credits cash to account
   - Sends notification to user
   - Creates audit trail

**Reject Order**:
1. Click "Reject" button
2. Enter rejection reason (required)
3. Add admin notes (optional)
4. Confirm rejection
5. System notifies user with reason
6. Holdings remain unchanged

### Admin Panel Not Showing Data?

**If you can't see pending orders after logging in**:
1. Verify you're logged in as an admin account
2. Check you're on the correct admin panel URL
3. Try logging out and back in to refresh session
4. Check with system administrator if your admin role is active

**Database Verification** (for system admins):
```sql
-- Check if you're an admin
SELECT is_admin('YOUR_USER_ID_HERE');
-- Should return: true

-- View all pending orders
SELECT * FROM pending_sell_orders WHERE status = 'pending';
```

---

## Technical Details (For Developers)

### Database Functions Fixed

**is_admin() - No Parameters**
- Used by: RLS policies that check current session
- Was: Returning false for valid admins
- Now: Correctly queries admin_roles table via is_admin_user()

**is_admin(user_id) - With Parameter**
- Used by: Direct database queries and admin panel
- Was: Checking profiles.email patterns (incorrect)
- Now: Correctly queries admin_roles table via is_admin_user()

**is_admin_user(user_id)**
- Core function that queries admin_roles table
- Always worked correctly
- Now used by both is_admin() variants

### Account Selection Architecture

Users can have multiple accounts:
- Crypto Holdings (for crypto assets)
- Stock Portfolio (for stocks)
- Dividend Income Fund (for dividend stocks)
- etc.

Each holding is tied to a specific account. When selling:
1. Frontend must check `checkSufficientHoldings(account_id, symbol, asset_type, quantity)`
2. The `account_id` parameter must match the account that actually holds the asset
3. If wrong account_id is passed, validation correctly fails with "insufficient holdings"

### Sell Order Flow

```
User clicks sell → Frontend validates → Creates pending_sell_order → Admin reviews → Trade executed
```

**Frontend Validation**:
```typescript
// Check if user has sufficient holdings in the SELECTED account
const result = await checkSufficientHoldings(
  selectedAccountId,  // ← This MUST be the account with the asset!
  symbol,
  assetType,
  quantity
);
```

**Backend Validation** (in `create_pending_sell_order`):
```sql
-- Checks holdings in specified account
SELECT * FROM holdings
WHERE account_id = p_account_id  -- ← Must match account with asset
  AND symbol = p_symbol
  AND asset_type = p_asset_type;
```

---

## Prevention & Best Practices

### For Users

1. **Always sell from the holding card** - tap the specific asset you want to sell
2. **Check account name** before clicking "Sell Assets" button
3. **Use account selector** if you need to switch accounts
4. **Note account badges** next to each holding for quick reference

### For Admins

1. **Review orders promptly** - users are waiting for approval
2. **Check market prices** before setting execution price
3. **Provide clear rejection reasons** if rejecting orders
4. **Use admin notes** to document decision rationale
5. **Monitor pending orders dashboard** for alerts

### For Developers

1. **Pre-select correct account** when user taps a holding card
2. **Show account name prominently** in sell modal
3. **Add account validation** before opening sell modal
4. **Improve error messages** to mention account mismatch
5. **Add account switcher** in sell modal UI
6. **Show "wrong account" warning** instead of "insufficient balance"

---

## Common Scenarios

### Scenario 1: User has BTC in Crypto account but Stock account is selected

**What happens**:
- User tries to sell BTC
- System checks Stock account
- Finds no BTC in Stock account
- Returns "insufficient balance"

**Solution**:
- Tap the BTC holding card directly (Method A)
- OR switch to Crypto account first (Method B)

### Scenario 2: Admin can't see pending orders

**What happens**:
- Admin logs in
- Navigates to pending orders
- Page is empty or shows error

**Solution**:
- ✅ FIXED by updating is_admin() functions
- Log out and log back in
- Should now see all pending orders

### Scenario 3: User has multiple accounts and gets confused

**What happens**:
- User has 3 accounts
- Different assets in each
- Tries to sell from wrong account
- Gets "insufficient balance"

**Solution**:
- Always sell by tapping the holding card directly
- This auto-selects the correct account
- Alternatively, use account selector to switch first

---

## Testing & Verification

### Test User Sell Flow

1. Create test account with holdings
2. Navigate to portfolio
3. Tap a specific holding card
4. Click "Sell" in position modal
5. Enter quantity and submit
6. Verify order appears in pending orders
7. As admin, approve the order
8. Verify holdings updated and cash credited

### Test Admin Panel

1. Log in as admin
2. Navigate to pending orders
3. Should see list of orders with user details
4. Approve or reject test order
5. Verify user receives notification
6. Check audit log for proper trail

### Verify Database Functions

```sql
-- Test admin check
SELECT
  id,
  is_admin(id) as is_admin_result,
  role
FROM admin_roles
WHERE is_active = true;

-- Should return true for all active admin users
```

---

## Support & Contact

**For User Issues**:
- Check this guide first
- Try the troubleshooting steps
- Contact support if still experiencing issues

**For Admin Issues**:
- Verify your admin role is active
- Check database admin_roles table
- Contact system administrator

**For Developers**:
- Review DIAGNOSTIC-REPORT.md for technical details
- Check migration files in supabase/migrations/
- Test with SQL queries in Supabase dashboard

---

## Summary

✅ **Admin panel visibility**: FIXED - is_admin() functions updated
⚠️ **Insufficient balance on sell**: NOT A BUG - use correct account selection

**Key Takeaway**: Always sell assets by tapping the holding card directly, not the general "Sell Assets" button. This ensures the correct account is used.
