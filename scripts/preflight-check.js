#!/usr/bin/env node
/**
 * Pre-flight Check Script
 * Validates the development environment before starting the app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkMark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossMark() {
  return `${colors.red}✗${colors.reset}`;
}

function warnMark() {
  return `${colors.yellow}⚠${colors.reset}`;
}

let errors = 0;
let warnings = 0;

console.log('');
log('═══════════════════════════════════════════════════', 'cyan');
log('  PRE-FLIGHT ENVIRONMENT CHECK', 'cyan');
log('═══════════════════════════════════════════════════', 'cyan');
console.log('');

// 1. Check Node version
log('🔍 Checking Node version...', 'blue');
try {
  const nodeVersion = process.version;
  const expectedVersion = fs.readFileSync(path.join(__dirname, '..', '.nvmrc'), 'utf-8').trim();

  if (nodeVersion.startsWith('v' + expectedVersion)) {
    log(`${checkMark()} Node version: ${nodeVersion} (matches .nvmrc)`, 'green');
  } else {
    log(`${warnMark()} Node version: ${nodeVersion} (expected v${expectedVersion})`, 'yellow');
    log(`   Run: nvm use ${expectedVersion}`, 'yellow');
    warnings++;
  }
} catch (err) {
  log(`${crossMark()} Could not verify Node version`, 'red');
  errors++;
}

// 2. Check npm version
log('\n🔍 Checking npm version...', 'blue');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  log(`${checkMark()} npm version: ${npmVersion}`, 'green');
} catch (err) {
  log(`${crossMark()} npm not found`, 'red');
  errors++;
}

// 3. Check if node_modules exists
log('\n🔍 Checking node_modules...', 'blue');
if (fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
  log(`${checkMark()} node_modules directory exists`, 'green');
} else {
  log(`${crossMark()} node_modules not found - run: npm install`, 'red');
  errors++;
}

// 4. Check .env file
log('\n🔍 Checking environment variables...', 'blue');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');

  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ];

  let missingVars = [];
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length === 0) {
    log(`${checkMark()} .env file exists with required variables`, 'green');
  } else {
    log(`${warnMark()} .env file missing variables: ${missingVars.join(', ')}`, 'yellow');
    warnings++;
  }
} else {
  log(`${crossMark()} .env file not found`, 'red');
  log('   Copy .env.local.example to .env and fill in values', 'red');
  errors++;
}

// 5. Check TypeScript configuration
log('\n🔍 Checking TypeScript...', 'blue');
if (fs.existsSync(path.join(__dirname, '..', 'tsconfig.json'))) {
  log(`${checkMark()} tsconfig.json exists`, 'green');

  try {
    execSync('npx tsc --noEmit', { stdio: 'ignore' });
    log(`${checkMark()} TypeScript compiles without errors`, 'green');
  } catch (err) {
    log(`${warnMark()} TypeScript has compilation errors (run: npm run typecheck)`, 'yellow');
    warnings++;
  }
} else {
  log(`${crossMark()} tsconfig.json not found`, 'red');
  errors++;
}

// 6. Check package-lock.json
log('\n🔍 Checking package-lock.json...', 'blue');
if (fs.existsSync(path.join(__dirname, '..', 'package-lock.json'))) {
  log(`${checkMark()} package-lock.json exists`, 'green');
} else {
  log(`${warnMark()} package-lock.json not found - dependencies may not be locked`, 'yellow');
  warnings++;
}

// 7. Check Expo configuration
log('\n🔍 Checking Expo configuration...', 'blue');
if (fs.existsSync(path.join(__dirname, '..', 'app.json'))) {
  log(`${checkMark()} app.json exists`, 'green');
} else {
  log(`${crossMark()} app.json not found`, 'red');
  errors++;
}

// 8. Check for common port conflicts
log('\n🔍 Checking for port conflicts...', 'blue');
try {
  const netstat = execSync('lsof -i :8081 2>/dev/null || true', { encoding: 'utf-8' });
  if (netstat.trim()) {
    log(`${warnMark()} Port 8081 (Metro) appears to be in use`, 'yellow');
    log('   You may need to kill existing processes', 'yellow');
    warnings++;
  } else {
    log(`${checkMark()} Port 8081 is available`, 'green');
  }
} catch (err) {
  log(`${warnMark()} Could not check port availability`, 'yellow');
  warnings++;
}

// 9. Check disk space
log('\n🔍 Checking disk space...', 'blue');
try {
  const df = execSync('df -h . | tail -1', { encoding: 'utf-8' });
  const match = df.match(/(\d+)%/);
  if (match) {
    const usage = parseInt(match[1]);
    if (usage > 90) {
      log(`${warnMark()} Disk usage is ${usage}% - consider freeing up space`, 'yellow');
      warnings++;
    } else {
      log(`${checkMark()} Disk usage is ${usage}%`, 'green');
    }
  }
} catch (err) {
  // Skip on systems where df doesn't work
}

// Summary
console.log('');
log('═══════════════════════════════════════════════════', 'cyan');
log('  PRE-FLIGHT CHECK SUMMARY', 'cyan');
log('═══════════════════════════════════════════════════', 'cyan');
console.log('');

if (errors === 0 && warnings === 0) {
  log(`${checkMark()} All checks passed! You're ready to start development.`, 'green');
  console.log('');
  log('Run: npm run dev', 'cyan');
  console.log('');
  process.exit(0);
} else {
  if (errors > 0) {
    log(`${crossMark()} ${errors} error(s) found - please fix before continuing`, 'red');
  }
  if (warnings > 0) {
    log(`${warnMark()} ${warnings} warning(s) found - consider addressing these`, 'yellow');
  }
  console.log('');

  if (errors > 0) {
    process.exit(1);
  } else {
    log('Proceeding with warnings...', 'yellow');
    console.log('');
    process.exit(0);
  }
}
