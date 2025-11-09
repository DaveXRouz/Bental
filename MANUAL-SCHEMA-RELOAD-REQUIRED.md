# ⚠️ Manual Schema Reload Required

> ⚠️ **ARCHIVED DOCUMENT**: This guide references the old Supabase project (`oanohrjkniduqkkahmel`). For current schema reload instructions:
> - Staging: https://supabase.com/dashboard/project/tnjgqdpxvkciiqdrdkyz
> - Production: https://supabase.com/dashboard/project/urkokrimzciotxhykics
>
> See [docs/DEPLOYMENT-ENVIRONMENTS.md](docs/DEPLOYMENT-ENVIRONMENTS.md) for environment details.

---

## Current Status

The programmatic schema reload via `NOTIFY pgrst, 'reload schema'` was attempted but **did not resolve the issue**.

The error persists:
```
❌ Could not find a relationship between 'pending_sell_orders' and 'profiles' in the schema cache
Code: PGRST200
```

This confirms that the Supabase PostgREST schema cache is stale and requires **manual intervention**.

---

## Required Action: Manual Dashboard Reload

You MUST reload the schema cache through the Supabase Dashboard. Here's exactly how:

### Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/oanohrjkniduqkkahmel

2. **Navigate to Schema Settings**
   - Click: **Settings** (gear icon in left sidebar)
   - Click: **Database**
   - Click: **Schema** tab

3. **Reload Schema Cache**
   - Look for: **"Reload Schema"** button (usually near the top right)
   - Click: **Reload Schema**
   - Confirm if prompted

4. **Wait for Propagation**
   - Wait: **60 seconds** minimum
   - The cache needs time to propagate across all PostgREST instances

5. **Verify the Fix**
   - Run test: `node test-query.js`
   - Or navigate to: Admin Panel → Pending Orders
   - Should see: `✅ Query SUCCEEDED!`

---

## Alternative: Implement Workaround

If you cannot access the Dashboard immediately, I can implement a temporary workaround that uses a two-query approach instead of joins.

This workaround:
- ✅ Will work immediately
- ✅ Bypasses the schema cache issue
- ✅ Returns the same data
- ⚠️ Uses 2-3 queries instead of 1 (slightly slower)
- ⚠️ Is a temporary solution

**Would you like me to implement this workaround?**

---

## Why Manual Reload is Needed

Supabase's managed PostgREST instances:
- Have their own schema cache management
- Don't always respond to NOTIFY commands from user connections
- Require Dashboard-based reload for guaranteed cache refresh
- May cache schemas across multiple instances/regions

The NOTIFY command works for self-hosted PostgREST but not reliably on Supabase's managed platform.

---

## What Happens After Schema Reload

Once the schema is reloaded:

**Before:**
```
❌ Could not find a relationship between 'pending_sell_orders' and 'profiles'
```

**After:**
```
✅ Query SUCCEEDED!
Duration: 234ms
Records found: 1

Sample data:
- Order ID: 074ed00a-2453-4484-a589-f669c133536e
- Symbol: META
- User: Amanda Taylor
- Email: amanda.taylor@demo.com
- Account: Growth Stock Portfolio

✨ Schema cache is working correctly!
```

---

## Verification After Reload

Run this test to verify:
```bash
node test-query.js
```

Or test in the app:
1. Login as admin (admin@example.com)
2. Navigate to Admin Panel → Pending Orders
3. Verify orders display with user names and emails

---

## Next Steps

**Choose one:**

**Option A: Manual Dashboard Reload (Recommended)**
- Permanent fix
- Takes 5 minutes
- Follow steps above

**Option B: Implement Workaround**
- Immediate temporary fix
- Let me know and I'll implement it
- Can still do Dashboard reload later

---

## Support Information

**Project Details:**
- Supabase URL: https://oanohrjkniduqkkahmel.supabase.co
- Dashboard: https://supabase.com/dashboard/project/oanohrjkniduqkkahmel
- Error Code: PGRST200

**If Schema Reload Button Not Found:**
- Try: Settings → API → Restart PostgREST
- Or: Contact Supabase support with project ID

---

**Status:** ⏳ Awaiting Manual Schema Reload

Let me know if you'd like me to implement the workaround instead!
