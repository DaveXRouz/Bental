# Schema Cache Error - Resolution Guide

## Problem

You're seeing this error in the console:

```
❌ Schema verification failed: Could not find the table 'public.profiles' in the schema cache
```

## What This Means

**Good News:** Your database is fine! The tables exist and contain data.

**The Issue:** Supabase's PostgREST service has a stale schema cache that needs to be refreshed.

## Quick Fix (5 Minutes)

### Step 1: Access Supabase Dashboard

Go to the Supabase Dashboard for your project:

- **Staging Project:** https://supabase.com/dashboard/project/oanohrjkniduqkkahmel
- **Production Project:** https://supabase.com/dashboard/project/urkokrimzciotxhykics

### Step 2: Navigate to Schema Settings

1. Click **Settings** (gear icon) in the left sidebar
2. Click **Database**
3. Click the **Schema** tab

### Step 3: Reload Schema Cache

1. Find the **"Reload Schema"** button (usually top right)
2. Click **"Reload Schema"**
3. Wait for confirmation message

### Step 4: Wait for Propagation

**Important:** Wait **60 seconds** minimum. The schema cache needs time to propagate across all PostgREST instances.

### Step 5: Test

1. Clear your browser cache (`Ctrl+Shift+Del`)
2. Reload the application
3. Check console - you should see:
   ```
   ✅ Schema verified successfully
   ✅ All critical tables accessible
   ```

## Alternative Solutions

### Option A: Clear Browser Cache

Sometimes browser caching causes this issue:

**Chrome/Edge/Brave:**
1. Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Reload the page

**Hard Reload:**
1. Open DevTools (`F12`)
2. Right-click the reload button
3. Select "Empty Cache and Hard Reload"

### Option B: Use Incognito Mode

1. Open a new Incognito/Private window
2. Navigate to your app
3. Check if the error persists

### Option C: Clear LocalStorage

Open browser console (`F12`) and run:

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Why This Happens

PostgREST (Supabase's API layer) caches the database schema for performance. After migrations or schema changes, this cache can become stale. The cache doesn't automatically detect schema changes and requires manual intervention to reload.

**Common Triggers:**
- Running database migrations
- Adding/modifying tables
- Changing foreign key relationships
- Adding/updating RLS policies
- Database restarts or maintenance

## Verification

After reloading the schema, you should see these logs in the console:

```
🔍 Verifying schema (attempt 1/3)...
✅ Schema verified successfully
✅ All critical tables accessible
```

If you still see errors, try:
1. Wait another 60 seconds (cache propagation can be slow)
2. Clear browser cache completely
3. Try incognito mode
4. Check that you're connected to the correct Supabase project

## Environment Configuration

Make sure your `.env` file points to the correct Supabase project:

**Staging:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://oanohrjkniduqkkahmel.supabase.co
```

**Production:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://urkokrimzciotxhykics.supabase.co
```

## Prevention

After any database migration or schema change:

1. ✅ Reload schema cache in Supabase Dashboard
2. ✅ Wait 60 seconds for propagation
3. ✅ Clear browser cache
4. ✅ Test in incognito mode first
5. ✅ Verify console logs show successful schema verification

## Still Having Issues?

If the schema cache reload doesn't resolve the issue:

1. **Restart PostgREST:**
   - Settings → API → Restart PostgREST
   - Wait 2-3 minutes

2. **Check Database Connection:**
   - Verify your Supabase project is active
   - Check project billing status
   - Ensure database isn't paused

3. **Verify Table Exists:**
   - Go to Table Editor in Supabase Dashboard
   - Confirm `profiles` and `accounts` tables exist
   - Check they're in the `public` schema

4. **Contact Support:**
   - If none of the above work, contact Supabase support
   - Provide project ID and error message

## Technical Details

**Error Code:** PGRST200 (PostgREST schema cache error)

**Affected Tables:**
- `public.profiles`
- `public.accounts`
- `public.holdings`
- Any table with foreign key relationships

**Root Cause:** PostgREST schema cache staleness after database schema modifications.

**Fix:** Manual schema cache reload through Supabase Dashboard or PostgREST restart.

---

**Last Updated:** November 9, 2025

**Status:** ✅ Enhanced error detection and resolution guidance implemented
