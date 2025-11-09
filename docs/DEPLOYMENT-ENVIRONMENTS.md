# Deployment Environments Guide

## Overview

This application uses multiple Supabase projects to separate development, staging, and production environments. This ensures data safety and allows for proper testing before releasing to production.

---

## Available Environments

### 1. Local Development
- **Environment**: `local`
- **Database**: Staging project (safe for development)
- **File**: `.env`
- **Use Case**: Day-to-day development on your local machine

### 2. Development
- **Environment**: `dev`
- **Database**: Staging project
- **File**: `.env.development`
- **Use Case**: Development builds with staging data

### 3. Staging
- **Environment**: `staging`
- **Database**: Staging project (`tnjgqdpxvkciiqdrdkyz`)
- **File**: `.env.staging`
- **Use Case**: Testing and QA before production release

### 4. Production
- **Environment**: `prod`
- **Database**: Production project (`urkokrimzciotxhykics`)
- **File**: `.env.production`
- **Use Case**: Live application used by real users

---

## Supabase Projects

### Staging Project
- **Project ID**: `tnjgqdpxvkciiqdrdkyz`
- **URL**: `https://tnjgqdpxvkciiqdrdkyz.supabase.co`
- **Purpose**: Safe environment for development and testing
- **Dashboard**: https://supabase.com/dashboard/project/tnjgqdpxvkciiqdrdkyz

### Production Project
- **Project ID**: `urkokrimzciotxhykics`
- **URL**: `https://urkokrimzciotxhykics.supabase.co`
- **Purpose**: Live production data
- **Dashboard**: https://supabase.com/dashboard/project/urkokrimzciotxhykics

⚠️ **IMPORTANT**: The old project `oanohrjkniduqkkahmel` no longer exists and has been completely removed from the codebase.

---

## Environment Configuration

### Environment Files

Each environment has its own configuration file:

```
.env                  → Local development (default)
.env.development      → Development builds
.env.staging          → Staging environment
.env.production       → Production environment
.env.local.example    → Template with documentation
```

### Required Environment Variables

All environment files must include:

```bash
# Environment identifier
APP_ENV=local|dev|staging|prod

# Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Feature flags
ENABLE_ADMIN=true|false
ENABLE_TRADING_BOT_UI=true|false
ENABLE_LIVE_MARKET=true|false
ENABLE_NEWS=true|false
ENABLE_REALTIME_WS=true|false
ENABLE_PUSH_NOTIFICATIONS=true|false

# Optional: Market data provider
MARKET_PROVIDER=mock|finnhub
FINNHUB_API_KEY=

# Locale
EXPO_PUBLIC_LOCALE_DEFAULT=en
```

---

## Switching Environments

### Method 1: Copy Environment File

```bash
# Switch to staging
cp .env.staging .env

# Switch to production
cp .env.production .env

# Switch to development
cp .env.development .env
```

After copying, restart your development server:
```bash
npm run dev
```

### Method 2: Set APP_ENV Variable

You can also override the environment by setting the `APP_ENV` variable:

```bash
APP_ENV=staging npm run dev
```

---

## Building for Different Environments

### Using EAS Build

We use Expo Application Services (EAS) for building and deploying:

```bash
# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to EAS
eas login

# Build for staging
eas build --profile staging --platform ios
eas build --profile staging --platform android

# Build for production
eas build --profile production --platform ios
eas build --profile production --platform android

# Development build
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Build Profiles

Defined in `eas.json`:

**Development Profile**:
- Development client enabled
- Internal distribution
- Uses staging database

**Staging Profile**:
- Internal distribution
- Staging channel
- Uses staging Supabase project
- Different bundle identifier for iOS/Android

**Production Profile**:
- Store distribution
- Production channel
- Uses production Supabase project
- Production bundle identifiers

---

## Security Best Practices

### ✅ DO:
- Use staging environment for all development and testing
- Test thoroughly in staging before deploying to production
- Use environment variables for all sensitive configuration
- Keep production credentials secure and separate
- Review changes in staging before production deployment
- Use Row Level Security (RLS) policies for database access

### ❌ DON'T:
- Never commit `.env` files to version control (they're in `.gitignore`)
- Never use production credentials in development
- Never hardcode Supabase URLs or keys in source code
- Never expose service role keys in client applications
- Never bypass environment validation checks
- Never test destructive operations in production

---

## Environment Validation

The application automatically validates your environment configuration on startup. It checks for:

1. **Missing Credentials**: Ensures `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
2. **Invalid Project**: Prevents use of the old/non-existent project
3. **Environment Mismatch**: Warns if `APP_ENV` doesn't match the Supabase project

You'll see console output like:
```
[ENV] Environment validation passed - Using staging environment
[ENV] Supabase project: tnjgqdpxvkciiqdrdkyz
```

If there's an error:
```
[ENV] Critical configuration errors:
⚠️ INVALID SUPABASE PROJECT: The project "oanohrjkniduqkkahmel" does not exist.
Please update your .env file to use either:
  - Staging: tnjgqdpxvkciiqdrdkyz.supabase.co
  - Production: urkokrimzciotxhykics.supabase.co
```

---

## Testing Database Connectivity

Use the test query script to verify your database connection:

```bash
# Test staging (default)
node test-query.js

# Test staging explicitly
node test-query.js staging

# Test production
node test-query.js production
```

The script will:
- Connect to the specified Supabase project
- Run a sample query
- Report connection status and query results
- Help diagnose schema cache issues

---

## Troubleshooting

### Problem: App won't start - Missing credentials error

**Solution**: Ensure you have a valid `.env` file:
```bash
cp .env.local.example .env
# Edit .env and add your Supabase credentials
```

### Problem: "INVALID SUPABASE PROJECT" error

**Solution**: You're using the old project URL. Update your `.env` file:
```bash
# Replace this:
EXPO_PUBLIC_SUPABASE_URL=https://oanohrjkniduqkkahmel.supabase.co

# With staging:
EXPO_PUBLIC_SUPABASE_URL=https://tnjgqdpxvkciiqdrdkyz.supabase.co

# Or production:
EXPO_PUBLIC_SUPABASE_URL=https://urkokrimzciotxhykics.supabase.co
```

### Problem: Environment mismatch warning

**Solution**: Your `APP_ENV` doesn't match your Supabase project:
- If `APP_ENV=prod`, use production project (`urkokrimzciotxhykics`)
- If `APP_ENV=staging`, use staging project (`tnjgqdpxvkciiqdrdkyz`)

### Problem: Changes not taking effect

**Solution**: Restart your development server after changing environment files:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Problem: Can't connect to Supabase

**Solution**:
1. Check your internet connection
2. Verify credentials in Supabase dashboard
3. Ensure the anon key matches the project URL
4. Run the test script: `node test-query.js staging`

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass in staging environment
- [ ] Database migrations applied to production
- [ ] Environment variables verified in production `.env` file
- [ ] Production Supabase project configured correctly
- [ ] RLS policies tested and working
- [ ] API keys and secrets rotated if needed
- [ ] Build successful with production profile
- [ ] Smoke tests completed in production build

---

## Quick Reference

### Environment URLs
| Environment | Supabase Project | URL |
|------------|------------------|-----|
| Development/Staging | tnjgqdpxvkciiqdrdkyz | https://tnjgqdpxvkciiqdrdkyz.supabase.co |
| Production | urkokrimzciotxhykics | https://urkokrimzciotxhykics.supabase.co |

### Common Commands
```bash
# Switch to staging
cp .env.staging .env && npm run dev

# Switch to production
cp .env.production .env && npm run dev

# Test database connection
node test-query.js staging
node test-query.js production

# Build for staging
eas build --profile staging --platform all

# Build for production
eas build --profile production --platform all
```

---

## Support

If you encounter issues:
1. Check this documentation
2. Review console logs for validation errors
3. Run `node test-query.js` to verify database connectivity
4. Check Supabase dashboard for project status
5. Review `.env` file configuration

For additional help, contact the development team or refer to the [Supabase Documentation](https://supabase.com/docs).
