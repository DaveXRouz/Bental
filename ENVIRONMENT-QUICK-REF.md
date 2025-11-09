# Environment Quick Reference Card

Quick reference for switching between environments and deploying.

---

## 🏢 Projects

| Environment | Project ID | URL |
|------------|------------|-----|
| **Staging** | `tnjgqdpxvkciiqdrdkyz` | https://tnjgqdpxvkciiqdrdkyz.supabase.co |
| **Production** | `urkokrimzciotxhykics` | https://urkokrimzciotxhykics.supabase.co |

---

## 📁 Environment Files

| File | Purpose | Database |
|------|---------|----------|
| `.env` | Local development (default) | Staging |
| `.env.development` | Development builds | Staging |
| `.env.staging` | Staging environment | Staging |
| `.env.production` | Production environment | Production |

---

## 🔄 Switch Environments

```bash
# Local development (default - uses staging)
cp .env.staging .env && npm run dev

# Development
cp .env.development .env && npm run dev

# Staging
cp .env.staging .env && npm run dev

# Production (⚠️ use with caution)
cp .env.production .env && npm run dev
```

---

## 🧪 Test Database Connection

```bash
# Test staging
node test-query.js staging

# Test production
node test-query.js production
```

---

## 🏗️ Build with EAS

```bash
# Development build
eas build --profile development --platform all

# Staging build
eas build --profile staging --platform all

# Production build
eas build --profile production --platform all
```

---

## 🔍 Verify Configuration

```bash
# Check current environment
cat .env | grep "SUPABASE_URL"

# Validate environment variables
npm run preflight

# Check for old project references
rg "oanohrjkniduqkkahmel" --type ts --type tsx --type js
```

---

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| Missing credentials | `cp .env.local.example .env` and add keys |
| Old project error | Remove `oanohrjkniduqkkahmel` from `.env` |
| Environment mismatch | Ensure `APP_ENV` matches project |
| Changes not applying | Restart dev server after `.env` changes |

---

## 🔗 Quick Links

- **Full Guide**: [docs/DEPLOYMENT-ENVIRONMENTS.md](docs/DEPLOYMENT-ENVIRONMENTS.md)
- **Migration Summary**: [SUPABASE-MIGRATION-COMPLETE.md](SUPABASE-MIGRATION-COMPLETE.md)
- **Production Setup**: [PRODUCTION-SETUP-REQUIRED.md](PRODUCTION-SETUP-REQUIRED.md)

---

## 📋 Required Environment Variables

```bash
# App configuration
APP_ENV=local|dev|staging|prod

# Supabase (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Feature flags
ENABLE_ADMIN=true|false
ENABLE_TRADING_BOT_UI=true|false
ENABLE_LIVE_MARKET=true|false
ENABLE_NEWS=true|false

# Optional
MARKET_PROVIDER=mock|finnhub
FINNHUB_API_KEY=[optional]
```

---

## ✅ Pre-Deployment Checklist

- [ ] Test in staging: `node test-query.js staging`
- [ ] Verify environment: `cat .env | grep SUPABASE_URL`
- [ ] Check validation: `npm run preflight`
- [ ] Build succeeds: `npm run build:web`
- [ ] Database migrations applied to target environment
- [ ] RLS policies tested
- [ ] Production anon key configured (if deploying to prod)

---

**Keep this card handy for quick environment operations!**
