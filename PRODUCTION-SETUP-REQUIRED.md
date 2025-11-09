# ⚠️ Production Setup Required

## Action Needed: Get Production Anon Key

The production environment is configured but requires the actual anon key from your production Supabase project.

---

## Current Status

✅ **Staging**: Fully configured and ready to use
❌ **Production**: Needs anon key

---

## Steps to Complete Production Setup

### 1. Access Production Project Dashboard

Open your production Supabase project:
https://supabase.com/dashboard/project/urkokrimzciotxhykics

### 2. Get the Anon Key

1. Navigate to **Settings** → **API**
2. Find the **Project API keys** section
3. Copy the `anon` `public` key (NOT the service_role key)

### 3. Update .env.production

Edit `.env.production` and replace the placeholder:

**Current (placeholder)**:
```bash
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PRODUCTION_ANON_KEY_HERE
```

**Update to**:
```bash
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Test Production Connection

```bash
# Copy production config
cp .env.production .env

# Test database connection
node test-query.js production

# Start app (if test succeeds)
npm run dev
```

### 5. Secure the Key

- ✅ DO: Keep the key in `.env.production` file (already in .gitignore)
- ✅ DO: Use EAS secrets for build-time injection
- ❌ DON'T: Commit the key to version control
- ❌ DON'T: Share the key publicly

---

## Security Reminder

**The anon key is safe to expose in client applications** because:
- It only allows operations permitted by Row Level Security (RLS) policies
- All database access is controlled by RLS policies
- Users can only access data they're authorized to see

**NEVER expose the service_role key** because:
- It bypasses ALL Row Level Security
- It grants full database access
- It should ONLY be used in secure server environments

---

## After Setup

Once you've added the production anon key:

1. Verify the configuration:
   ```bash
   node test-query.js production
   ```

2. Test the application:
   ```bash
   cp .env.production .env
   npm run dev
   ```

3. Build for production:
   ```bash
   eas build --profile production --platform all
   ```

4. Delete this reminder file:
   ```bash
   rm PRODUCTION-SETUP-REQUIRED.md
   ```

---

## Need Help?

- **Environment Guide**: [docs/DEPLOYMENT-ENVIRONMENTS.md](docs/DEPLOYMENT-ENVIRONMENTS.md)
- **Migration Summary**: [SUPABASE-MIGRATION-COMPLETE.md](SUPABASE-MIGRATION-COMPLETE.md)
- **Production Dashboard**: https://supabase.com/dashboard/project/urkokrimzciotxhykics
- **Staging Dashboard**: https://supabase.com/dashboard/project/tnjgqdpxvkciiqdrdkyz

---

**Next**: Get your production anon key and update `.env.production`, then delete this file.
