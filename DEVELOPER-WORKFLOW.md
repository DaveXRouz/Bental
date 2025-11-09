# Developer Workflow - Essential Commands

Quick reference for commands to run when making changes or updates to the project.

---

## 🔄 After Making Code Changes

### 1. Type Check (Always Run First)
```bash
npm run typecheck
```
**When**: After any TypeScript changes
**Purpose**: Catch type errors before runtime
**Expected**: No errors

---

### 2. Lint Code
```bash
npm run lint
```
**When**: Before committing changes
**Purpose**: Ensure code follows style guidelines
**Expected**: No linting errors

---

### 3. Build for Web (Critical)
```bash
npm run build:web
```
**When**: Before deploying or after major changes
**Purpose**: Verify production build works
**Expected**: Build completes successfully

---

### 4. Restart Development Server
```bash
# Stop current server (Ctrl+C), then:
npm run dev
```
**When**: After changing environment files or dependencies
**Purpose**: Apply environment changes
**Expected**: Server starts without errors

---

## 🗄️ After Database Changes

### 1. Test Database Connection
```bash
node test-query.js staging
```
**When**: After schema changes or migrations
**Purpose**: Verify database connectivity
**Expected**: Query succeeds with results

---

### 2. Verify Schema (if using migrations)
```bash
# Connect to Supabase dashboard and check schema
# Or run a test query against affected tables
```
**When**: After applying migrations
**Purpose**: Ensure schema matches expectations

---

## 📦 After Dependency Changes

### 1. Install Dependencies
```bash
npm install
# or for clean install
npm ci
```
**When**: After adding/removing packages in package.json
**Purpose**: Sync dependencies

---

### 2. Clear Cache (if issues occur)
```bash
npm run clean
npm install
```
**When**: After dependency issues or build errors
**Purpose**: Clean start

---

## 🌍 After Environment Changes

### 1. Verify Environment Configuration
```bash
cat .env | grep "SUPABASE_URL"
```
**When**: After changing .env files
**Purpose**: Confirm correct project is configured
**Expected**: Should show correct Supabase project URL

---

### 2. Restart Development Server
```bash
# Stop server (Ctrl+C), then:
npm run dev
```
**When**: After any .env file changes
**Purpose**: Load new environment variables
**Required**: Always restart after .env changes

---

### 3. Test Database with New Environment
```bash
node test-query.js staging
# or
node test-query.js production
```
**When**: After switching environments
**Purpose**: Verify database connection works

---

## 🚀 Before Committing Changes

Run this sequence before every commit:

```bash
# 1. Type check
npm run typecheck

# 2. Lint
npm run lint

# 3. Build
npm run build:web

# 4. Test database (if applicable)
node test-query.js staging
```

**All must pass before committing!**

---

## 🏗️ Before Deploying

### Staging Deployment

```bash
# 1. Ensure using staging environment
cp .env.staging .env

# 2. Type check
npm run typecheck

# 3. Lint
npm run lint

# 4. Build
npm run build:web

# 5. Test database
node test-query.js staging

# 6. Build with EAS (if using)
eas build --profile staging --platform all
```

---

### Production Deployment

```bash
# 1. Switch to production environment
cp .env.production .env

# 2. Type check
npm run typecheck

# 3. Lint
npm run lint

# 4. Build
npm run build:web

# 5. Test database connection
node test-query.js production

# 6. Verify environment
cat .env | grep "SUPABASE_URL"
# Should show: urkokrimzciotxhykics

# 7. Build with EAS
eas build --profile production --platform all
```

---

## 🧪 After Fixing Bugs

```bash
# 1. Type check
npm run typecheck

# 2. Test the specific functionality
npm run dev
# Then manually test the fix

# 3. Build to ensure no production issues
npm run build:web
```

---

## 📝 After Updating Documentation

```bash
# 1. Verify markdown syntax (optional)
# Check files render correctly in preview

# 2. Commit with clear message
git add .
git commit -m "docs: update deployment guide"
```

---

## 🔧 Complete Workflow Example

Here's a complete workflow for a typical code change:

```bash
# 1. Make your code changes
# ... edit files ...

# 2. Type check
npm run typecheck

# 3. Lint
npm run lint

# 4. Test locally
npm run dev
# ... test in browser/app ...

# 5. Build for production
npm run build:web

# 6. If database changes, test connection
node test-query.js staging

# 7. Commit changes
git add .
git commit -m "feat: add new feature"

# 8. Deploy to staging (if ready)
cp .env.staging .env
eas build --profile staging --platform all
```

---

## 🚨 Emergency Commands

### Server Won't Start
```bash
npm run clean
npm install
npm run dev
```

### Build Failing
```bash
npm run clean
npm ci
npm run typecheck
npm run build:web
```

### Database Connection Issues
```bash
# Verify environment
cat .env | grep "SUPABASE"

# Test connection
node test-query.js staging

# Check Supabase dashboard
# Visit: https://supabase.com/dashboard/project/tnjgqdpxvkciiqdrdkyz
```

### Environment Issues
```bash
# Reset to staging
cp .env.staging .env

# Restart server
npm run dev

# Verify
cat .env | head -20
```

---

## 📊 Quick Checklist Format

Print this and keep it visible:

```
Before Every Commit:
☐ npm run typecheck
☐ npm run lint
☐ npm run build:web
☐ Test manually in browser/app

After Environment Changes:
☐ Restart development server
☐ Verify .env shows correct project
☐ Test database connection

Before Staging Deploy:
☐ cp .env.staging .env
☐ npm run typecheck
☐ npm run lint
☐ npm run build:web
☐ node test-query.js staging

Before Production Deploy:
☐ cp .env.production .env
☐ All staging checks ✓
☐ node test-query.js production
☐ Double-check environment
☐ Create backup of production DB
```

---

## 💡 Pro Tips

### Use npm scripts for common workflows:

Add to `package.json`:
```json
"scripts": {
  "check": "npm run typecheck && npm run lint",
  "verify": "npm run check && npm run build:web",
  "test:db:staging": "node test-query.js staging",
  "test:db:prod": "node test-query.js production",
  "switch:staging": "cp .env.staging .env && npm run dev",
  "switch:prod": "cp .env.production .env && npm run dev"
}
```

Then use:
```bash
npm run verify          # Run all checks
npm run test:db:staging # Test staging DB
npm run switch:staging  # Switch to staging
```

---

## 📱 Development Cycle Summary

**Standard Development**:
```bash
npm run dev             # Start server
# Make changes
npm run typecheck       # Check types
npm run lint            # Check style
npm run build:web       # Verify build
```

**Environment Switch**:
```bash
cp .env.staging .env    # Copy environment
npm run dev             # Restart (required!)
node test-query.js staging  # Test DB
```

**Pre-Deploy**:
```bash
npm run typecheck       # Types ✓
npm run lint            # Style ✓
npm run build:web       # Build ✓
node test-query.js [env] # DB ✓
```

---

## 🔗 Related Documentation

- **Environment Guide**: [docs/DEPLOYMENT-ENVIRONMENTS.md](docs/DEPLOYMENT-ENVIRONMENTS.md)
- **Quick Reference**: [ENVIRONMENT-QUICK-REF.md](ENVIRONMENT-QUICK-REF.md)
- **Migration Info**: [SUPABASE-MIGRATION-COMPLETE.md](SUPABASE-MIGRATION-COMPLETE.md)

---

**Remember**: Type check → Lint → Build → Test DB → Deploy

Keep this workflow consistent and your deployments will be smooth!
