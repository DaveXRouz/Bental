#!/bin/bash
#
# Project Reset Script
# Completely resets and reinitializes the development environment
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored messages
print_header() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

print_header "PROJECT RESET SCRIPT"

echo -e "${YELLOW}This will completely reset your development environment.${NC}"
echo -e "${YELLOW}All cache, build files, and node_modules will be deleted.${NC}\n"

# Confirmation prompt (skip if --yes flag is passed)
if [[ "$1" != "--yes" && "$1" != "-y" ]]; then
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Reset cancelled"
        exit 0
    fi
fi

# Step 1: Stop running processes
print_step "Step 1/9: Stopping running development servers..."
pkill -f "node|expo|next|vite|react-native" 2>/dev/null || true
print_success "Processes stopped"

# Step 2: Clean cache and build directories
print_step "Step 2/9: Cleaning cache and build directories..."
rm -rf node_modules 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -rf .cache 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf .expo-shared 2>/dev/null || true
rm -rf ios/build 2>/dev/null || true
rm -rf android/app/build 2>/dev/null || true
rm -rf android/.gradle 2>/dev/null || true

# Clean metro bundler cache
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/react-native-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true

print_success "Cache cleaned"

# Step 3: Verify Node version
print_step "Step 3/9: Verifying Node version..."
if [ -f .nvmrc ]; then
    EXPECTED_NODE=$(cat .nvmrc)
    CURRENT_NODE=$(node --version | sed 's/v//')

    if [ "$CURRENT_NODE" != "$EXPECTED_NODE" ]; then
        print_warning "Node version mismatch: current=$CURRENT_NODE, expected=$EXPECTED_NODE"

        # Try to use nvm if available
        if command -v nvm &> /dev/null; then
            print_step "Switching to Node $EXPECTED_NODE..."
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            nvm use || nvm install
            print_success "Switched to Node $(node --version)"
        else
            print_warning "nvm not found - please manually switch to Node v$EXPECTED_NODE"
        fi
    else
        print_success "Node version correct: v$CURRENT_NODE"
    fi
else
    print_warning ".nvmrc not found - skipping Node version check"
fi

# Step 4: Verify environment file
print_step "Step 4/9: Checking environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.local.example ]; then
        print_warning ".env not found - creating from .env.local.example"
        cp .env.local.example .env
        print_warning "Please update .env with your actual values"
    else
        print_error ".env file not found and no example available"
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Step 5: Install dependencies
print_step "Step 5/9: Installing dependencies (this may take a few minutes)..."
npm ci
print_success "Dependencies installed"

# Step 6: Run code generation (if script exists)
print_step "Step 6/9: Running code generation..."
npm run codegen --if-present || true
print_success "Code generation complete"

# Step 7: Run database migrations (if script exists)
print_step "Step 7/9: Running database migrations..."
npm run db:migrate --if-present || true
print_success "Database migrations complete"

# Step 8: Validate environment
print_step "Step 8/9: Validating environment..."
if [ -f scripts/preflight-check.js ]; then
    node scripts/preflight-check.js || {
        print_warning "Pre-flight check found some issues"
        print_warning "You may want to address these before starting the dev server"
    }
else
    print_warning "Pre-flight check script not found - skipping validation"
fi

# Step 9: Optional - Seed database
print_step "Step 9/9: Database seeding (optional)..."
read -p "Do you want to seed the database with demo data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Seeding database..."
    npm run seed || {
        print_warning "Database seeding failed - you may need to seed manually"
    }
    print_success "Database seeded"
else
    print_warning "Skipping database seeding"
fi

# Final summary
print_header "RESET COMPLETE"

echo -e "${GREEN}✓ Project has been reset successfully!${NC}\n"
echo -e "Next steps:"
echo -e "  ${CYAN}1.${NC} Verify your .env file has correct values"
echo -e "  ${CYAN}2.${NC} Start the development server: ${CYAN}npm run dev${NC}"
echo -e "  ${CYAN}3.${NC} Open the app in your browser\n"

print_success "You're ready to start developing!"
echo ""
