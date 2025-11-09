# Quick Commands Cheat Sheet

Print this and keep it visible while developing.

---

## 🔄 EVERY Time You Make Changes

```bash
npm run typecheck        # Check TypeScript errors
npm run lint             # Check code style
npm run build:web        # Verify production build works
```

**All 3 must pass before committing!**

---

## 🌍 After Changing .env Files

```bash
# Stop server (Ctrl+C), then:
npm run dev

# Verify correct environment:
cat .env | grep "SUPABASE_URL"

# Test database:
node test-query.js staging
```

**CRITICAL**: Always restart server after .env changes!

---

## 🗄️ After Database Schema Changes

```bash
node test-query.js staging     # Test staging
node test-query.js production  # Test production (careful!)
```

---

## 📦 After npm install / Dependency Changes

```bash
npm run dev    # Restart server
```

If issues persist:
```bash
npm run clean
npm install
npm run dev
```

---

## 🚀 Before Every Git Commit

```bash
npm run typecheck && npm run lint && npm run build:web
```

If all pass → Safe to commit
If any fail → Fix before committing

---

## 🏗️ Before Deploying to Staging

```bash
cp .env.staging .env
npm run typecheck
npm run lint
npm run build:web
node test-query.js staging
eas build --profile staging --platform all
```

---

## 🏭 Before Deploying to Production

```bash
cp .env.production .env
npm run typecheck
npm run lint
npm run build:web
node test-query.js production
cat .env | grep "urkokrimzciotxhykics"  # Verify!
eas build --profile production --platform all
```

---

## 🔄 Switch Environments Quickly

```bash
# To Staging:
cp .env.staging .env && npm run dev

# To Production (careful!):
cp .env.production .env && npm run dev
```

---

## 🚨 Emergency Fixes

**Server won't start:**
```bash
npm run clean && npm install && npm run dev
```

**Build failing:**
```bash
npm run clean && npm ci && npm run build:web
```

**Database issues:**
```bash
node test-query.js staging
```

---

## ✅ Daily Workflow

```
1. Make code changes
2. npm run typecheck
3. npm run lint
4. npm run dev (test manually)
5. npm run build:web
6. Commit changes
```

---

## 📋 Pre-Deploy Checklist

```
☐ npm run typecheck     ← No errors
☐ npm run lint          ← No warnings
☐ npm run build:web     ← Build succeeds
☐ node test-query.js    ← DB connected
☐ Manual testing done
☐ Correct .env loaded
☐ All tests passing
```

---

## 🎯 Key Commands to Memorize

| Command | When | Why |
|---------|------|-----|
| `npm run typecheck` | After code changes | Catch type errors |
| `npm run lint` | Before commit | Code style |
| `npm run build:web` | Before deploy | Production check |
| `npm run dev` | After .env changes | Apply environment |
| `node test-query.js staging` | After DB changes | Test connection |

---

## 🔗 Full Docs

**Complete workflow**: [DEVELOPER-WORKFLOW.md](DEVELOPER-WORKFLOW.md)
**Environment guide**: [docs/DEPLOYMENT-ENVIRONMENTS.md](docs/DEPLOYMENT-ENVIRONMENTS.md)

---

**Remember**: Type check → Lint → Build → Deploy
