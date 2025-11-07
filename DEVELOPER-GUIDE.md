# Developer Quick Reference Guide

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Clone the repository (if not already done)
git clone <repository-url>
cd minimal-trading-app

# 2. Switch to correct Node version
nvm use

# 3. Install dependencies
npm ci

# 4. Copy and configure environment file
cp .env.local.example .env
# Edit .env with your Supabase credentials

# 5. Run pre-flight checks
npm run preflight

# 6. Start development server
npm run dev
```

---

## 📦 Available NPM Scripts

### Development

```bash
npm run dev              # Start Expo development server
npm run preflight        # Validate development environment
npm run setup            # Complete setup: install + preflight + dev
```

### Building

```bash
npm run build:web        # Build for web deployment
npm run typecheck        # Run TypeScript type checking
npm run lint             # Run ESLint
```

### Cleaning

```bash
npm run clean            # Remove node_modules, cache, build files
npm run clean:all        # Clean + remove package-lock.json
npm run reset            # Full project reset (interactive)
```

### Database

```bash
npm run seed             # Seed database with 10 complete demo users
npm run seed:existing    # Add data to existing demo users
npm run db:migrate       # Run database migrations (currently no-op)
npm run codegen          # Generate types (currently no-op)
```

### Testing

```bash
npm test                 # Run tests (not yet configured)
```

---

## 🔧 Reset Script Usage

The reset script completely resets your development environment:

```bash
# Interactive mode (asks for confirmation)
npm run reset

# Automatic mode (skip confirmations)
bash scripts/reset-project.sh --yes
```

**What it does:**
1. ✓ Stops all running dev servers
2. ✓ Cleans cache and build directories
3. ✓ Verifies Node version matches .nvmrc
4. ✓ Checks .env file exists
5. ✓ Reinstalls dependencies from lockfile
6. ✓ Runs code generation (if needed)
7. ✓ Runs database migrations (if needed)
8. ✓ Validates environment with pre-flight checks
9. ✓ Optionally seeds database

**When to use:**
- After switching branches
- When dependencies are causing issues
- After updating package.json
- When cache is corrupted
- For a clean start

---

## 🌱 Database Seeding

### Seed New Users

Creates 10 complete demo user accounts with:
- User profiles
- Multiple accounts (demo, live, retirement)
- Holdings (stocks and crypto)
- Transaction history
- AI trading bots
- Bot trades
- Watchlists
- Notifications

```bash
npm run seed
```

**Test Credentials:**
- Email: alice.johnson@example.com (or any user from list)
- Password: Test123456!

### Seed Existing Users

Adds data to existing demo users (users with @demo.com emails):

```bash
npm run seed:existing
```

---

## 🔍 Pre-flight Checks

The pre-flight script validates your environment before starting:

```bash
npm run preflight
```

**Checks performed:**
- ✓ Node version matches .nvmrc
- ✓ npm is installed and working
- ✓ node_modules directory exists
- ✓ .env file has required variables
- ✓ TypeScript compiles without errors
- ✓ package-lock.json exists
- ✓ Expo configuration is valid
- ✓ Required ports are available
- ✓ Sufficient disk space

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid argument not valid semver"

**Solution:** This is a harmless React DevTools browser extension error.
See: [REACT-DEVTOOLS-WORKAROUND.md](./REACT-DEVTOOLS-WORKAROUND.md)

**Quick fix:** Disable React DevTools Chrome extension or filter console errors.

---

### Issue: Node version mismatch

**Error:** "Node version mismatch: current=v22.x.x, expected=20.20.0"

**Solution:**
```bash
nvm use 20.20.0
# or
nvm install 20.20.0
nvm use 20.20.0
```

---

### Issue: Port 8081 already in use

**Error:** "Port 8081 appears to be in use"

**Solution:**
```bash
# Kill all node processes
pkill -f node

# Or use the reset script
npm run reset
```

---

### Issue: TypeScript errors after pulling changes

**Solution:**
```bash
npm run clean
npm ci
npm run typecheck
```

---

### Issue: Expo cache causing issues

**Solution:**
```bash
# Clear Expo cache
rm -rf .expo .cache
npm run dev -- --clear
```

---

### Issue: Metro bundler not updating changes

**Solution:**
```bash
# Clear Metro bundler cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-native-*
npm run dev
```

---

## 🏗️ Project Structure

```
minimal-trading-app/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Authentication screens
│   ├── (tabs)/              # Main app tabs
│   └── admin-panel/         # Admin screens
├── components/              # Reusable components
│   ├── accessible/         # Accessibility components
│   ├── charts/             # Chart components
│   ├── dashboard/          # Dashboard components
│   ├── glass/              # Glassmorphism components
│   └── ui/                 # UI primitives
├── contexts/               # React contexts
├── hooks/                  # Custom React hooks
├── services/               # Backend services
├── lib/                    # Shared libraries
├── utils/                  # Utility functions
├── constants/              # App constants
├── types/                  # TypeScript types
├── scripts/                # Build and dev scripts
└── supabase/              # Supabase migrations
```

---

## 🌐 Environment Variables

Required variables in `.env`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
EXPO_PUBLIC_CALENDLY_URL=https://calendly.com/your-link
```

---

## 🧪 Testing

Currently, no tests are configured. This will be added in future iterations.

**Planned:**
- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox

---

## 📝 Code Style

- TypeScript for all code
- ESLint for linting
- Prettier for formatting (via .prettierrc)
- 2-space indentation
- No semicolons (enforced by Prettier)

**Run checks:**
```bash
npm run lint        # Check linting
npm run typecheck   # Check TypeScript
```

---

## 🚢 Deployment

### Web Build

```bash
npm run build:web
```

Output will be in the `dist/` directory.

---

## 🔒 Security Notes

- Never commit `.env` file
- Use environment variables for secrets
- Supabase keys are already configured securely
- RLS (Row Level Security) is enabled on all database tables

---

## 📚 Documentation

- [Start Here](./START-HERE.md) - Project overview
- [Quick Start Guide](./QUICK-START-GUIDE.md) - Getting started
- [React DevTools Workaround](./REACT-DEVTOOLS-WORKAROUND.md) - Fix console errors
- [Authentication Credentials](./AUTHENTICATION-CREDENTIALS.md) - Test accounts
- [Deployment Guide](./DEPLOYMENT-GUIDE.md) - How to deploy

---

## 🆘 Getting Help

1. Check this guide first
2. Review error messages in console
3. Run `npm run preflight` to diagnose issues
4. Check existing documentation in `/docs`
5. Search for similar issues in project history

---

## 🎯 Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull

# 2. Check for dependency updates
npm ci

# 3. Run pre-flight checks
npm run preflight

# 4. Start development
npm run dev
```

### Before Committing

```bash
# 1. Run type checks
npm run typecheck

# 2. Run linting
npm run lint

# 3. Test your changes manually

# 4. Commit with clear message
git add .
git commit -m "feat: add new feature"
git push
```

### After Pulling Changes

```bash
# If you see dependency changes
npm ci

# If you see database changes
npm run db:migrate

# If things are broken
npm run reset
```

---

## 📱 Platform Support

- ✅ Web (Primary platform)
- ✅ iOS (via Expo Go)
- ✅ Android (via Expo Go)

**Note:** Some features (Haptics, Local Auth) are only available on native platforms.

---

## 🔗 Useful Commands

```bash
# View package versions
npm list --depth=0

# Check for outdated packages
npm outdated

# Update a specific package
npm update <package-name>

# Check bundle size
npm run build:web
du -sh dist/

# Clear everything and start fresh
npm run clean:all && npm ci && npm run dev
```

---

**Last Updated:** 2025-11-07
**Node Version:** 20.20.0
**React Version:** 19.2.0
**React Native Version:** 0.82.1
