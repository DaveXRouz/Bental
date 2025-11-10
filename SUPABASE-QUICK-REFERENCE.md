# Supabase Quick Reference

## Status: ✅ ALL SYSTEMS OPERATIONAL

Your Supabase configuration is complete and fully functional.

## Quick Commands

```bash
# Verify Supabase setup
npm run verify

# Start development server
npm run dev

# Seed database with test data
npm run seed

# Run preflight checks
npm run preflight
```

## Your Credentials

**Location**: `.env` file in project root

```env
EXPO_PUBLIC_SUPABASE_URL=https://oanohrjkniduqkkahmel.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI... (your key)
```

## Supabase Dashboard

**URL**: https://supabase.com/dashboard/project/oanohrjkniduqkkahmel

### Key Sections

1. **Table Editor**: View/edit data directly
2. **SQL Editor**: Run custom queries
3. **Authentication**: Manage users
4. **Database → Replication**: Manage realtime tables
5. **Project Settings → API**: Refresh schema cache, view keys

## Important Tables

| Table | Purpose | Accessible by |
|-------|---------|---------------|
| profiles | User profiles | anon (read), user (own) |
| app_configuration | App settings | anon (read), admin (write) |
| accounts | User accounts | user (own), admin (all) |
| holdings | Portfolio positions | user (own), admin (all) |
| transactions | Transaction history | user (own), admin (all) |

## Schema Cache Refresh

**When to refresh**: After running migrations or schema changes

**How to refresh**:
1. Go to: Settings → API
2. Click: "Refresh PostgREST schema cache"
3. Wait: ~60 seconds
4. Test: Run `npm run verify`

## Realtime Configuration

**Current status**: ✅ Enabled and working

**Enabled tables**:
- app_configuration
- profiles

**To enable more tables**:
1. Settings → Realtime
2. Toggle "Enable Realtime" for desired tables
3. Update publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.your_table;
```

## Common SQL Queries

### View All Configuration
```sql
SELECT key, value, category, data_type
FROM app_configuration
ORDER BY category, key;
```

### Check RLS Policies
```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### View Recent Logins
```sql
SELECT email, attempt_time, success
FROM login_attempts
ORDER BY attempt_time DESC
LIMIT 10;
```

### Check Table Permissions
```sql
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;
```

## Troubleshooting

### Issue: 404 errors for tables

**Check**:
```bash
npm run verify
```

**Fix**:
1. Refresh schema cache (see above)
2. Check RLS policies allow anon SELECT
3. Verify table exists in Table Editor

### Issue: Realtime not working

**Check WebSocket**:
- Console should show "WebSocket connected"

**Fix**:
1. Settings → Realtime → Enable for table
2. Add to publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.your_table;
```

### Issue: Can't modify configuration

**Check**:
- User must have 'admin' role
- Check user_roles table

**Fix**:
```sql
-- Add admin role (in SQL Editor)
INSERT INTO user_roles (user_id, role_id)
SELECT 'user-uuid-here', id
FROM roles
WHERE name = 'admin';
```

## Security Checklist

- [x] RLS enabled on all tables
- [x] Anon role limited to SELECT only
- [x] User data isolated by user_id
- [x] Admin actions logged
- [x] Failed login attempts tracked
- [ ] Anon key rotated (optional but recommended)

## Key Anon Key Rotation

**When**: Periodically or if exposed publicly

**How**:
1. Dashboard → Settings → API
2. Click "Regenerate anon key"
3. Update in all `.env` files
4. Restart dev server

**Impact**: None (anon keys are meant to be public)

## Migration Files

All migrations are in: `supabase/migrations/`

**Recent important migrations**:
- `add_anon_policies_for_app_config` - Allows public config access
- Previous migrations created all tables and policies

## Client-Side Usage

### Fetch Configuration
```typescript
import { useAppConfig } from '@/hooks/useAppConfig';

function MyComponent() {
  const { app_name, trading_enabled, loading } = useAppConfig();

  if (loading) return <LoadingSpinner />;

  return <Text>{app_name}</Text>;
}
```

### Query with Supabase Client
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('app_configuration')
  .select('key, value')
  .eq('category', 'features');
```

### Subscribe to Changes
```typescript
const channel = supabase
  .channel('config-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'app_configuration',
  }, (payload) => {
    console.log('Config updated:', payload.new);
  })
  .subscribe();
```

## Admin Panel Access

**URL**: `/admin-panel/configuration`

**Features**:
- View all configuration values
- Toggle boolean settings
- Edit string/number values
- Real-time updates
- Change history tracking

**Requirements**:
- Logged in user
- User has 'admin' role

## Support Resources

- **Verification Script**: `npm run verify`
- **Full Documentation**: `SUPABASE-SETUP-COMPLETE.md`
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Status**: https://status.supabase.com

## Quick Health Check

Run these commands to verify everything:

```bash
# 1. Verify Supabase connection
npm run verify

# 2. Check no TypeScript errors
npm run typecheck

# 3. Start development server
npm run dev
```

Expected output:
- ✅ All 8/8 tests pass
- ✅ No type errors
- ✅ Server starts successfully

---

**Last Updated**: November 2025
**Status**: All systems operational ✅
