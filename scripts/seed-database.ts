/**
 * Database Seeding Script
 * Generates realistic test data for 10 complete user accounts
 *
 * Run with: npx ts-node scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Supabase configuration
const SUPABASE_URL = 'https://tnjgqdpxvkciiqdrdkyz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjExNjU3MiwiZXhwIjoyMDc3NjkyNTcyfQ.q5bcaIT4zCqKZW0Tkx8zFsvfWJYz62q_L6iW7x5dADk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test user data
const TEST_USERS = [
  { email: 'alice.johnson@example.com', fullName: 'Alice Johnson', phone: '+1-555-0101' },
  { email: 'bob.smith@example.com', fullName: 'Bob Smith', phone: '+1-555-0102' },
  { email: 'carol.williams@example.com', fullName: 'Carol Williams', phone: '+1-555-0103' },
  { email: 'david.brown@example.com', fullName: 'David Brown', phone: '+1-555-0104' },
  { email: 'emma.davis@example.com', fullName: 'Emma Davis', phone: '+1-555-0105' },
  { email: 'frank.miller@example.com', fullName: 'Frank Miller', phone: '+1-555-0106' },
  { email: 'grace.wilson@example.com', fullName: 'Grace Wilson', phone: '+1-555-0107' },
  { email: 'henry.moore@example.com', fullName: 'Henry Moore', phone: '+1-555-0108' },
  { email: 'iris.taylor@example.com', fullName: 'Iris Taylor', phone: '+1-555-0109' },
  { email: 'jack.anderson@example.com', fullName: 'Jack Anderson', phone: '+1-555-0110' },
];

// Common stock symbols
const SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  'AMD', 'INTC', 'BABA', 'DIS', 'BA', 'JPM', 'GS', 'V', 'MA',
  'BTC', 'ETH', 'BNB', 'SOL', 'ADA'
];

// Bot strategy types
const BOT_STRATEGIES = ['scalping', 'swing', 'momentum', 'mean_reversion', 'breakout'];

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePassword(): string {
  return randomBytes(16).toString('hex');
}

async function createUser(userData: typeof TEST_USERS[0]) {
  const password = 'Test123456!'; // All test users use this password

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(`Failed to create user ${userData.email}: ${authError.message}`);
  }

  const userId = authData.user.id;

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: userData.email,
      full_name: userData.fullName,
      phone: userData.phone,
      country: randomElement(['US', 'CA', 'UK', 'AU', 'DE']),
      preferred_language: randomElement(['en', 'fr']),
      theme_preference: randomElement(['auto', 'light', 'dark']),
    });

  if (profileError) {
    throw new Error(`Failed to create profile for ${userData.email}: ${profileError.message}`);
  }

  return userId;
}

async function createAccounts(userId: string) {
  const accountTypes = ['demo_cash', 'live_cash', 'retirement'];
  const accounts = [];

  for (let i = 0; i < randomInt(1, 3); i++) {
    const accountType = randomElement(accountTypes);
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        account_type: accountType,
        name: `${accountType.replace('_', ' ').toUpperCase()} Account ${i + 1}`,
        balance: randomFloat(10000, 500000, 2),
        currency: 'USD',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    accounts.push(data);
  }

  return accounts;
}

async function createHoldings(accountId: string, count: number) {
  const holdings = [];
  const selectedSymbols: string[] = [];

  // Select unique random symbols
  while (selectedSymbols.length < count) {
    const symbol = randomElement(SYMBOLS);
    if (!selectedSymbols.includes(symbol)) {
      selectedSymbols.push(symbol);
    }
  }

  for (const symbol of selectedSymbols) {
    const assetType = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'].includes(symbol) ? 'crypto' : 'stock';
    const avgCost = randomFloat(50, 500, 2);
    const currentPrice = avgCost * randomFloat(0.8, 1.3, 2);
    const quantity = randomFloat(1, 100, assetType === 'crypto' ? 8 : 2);
    const marketValue = quantity * currentPrice;
    const unrealizedPnl = (currentPrice - avgCost) * quantity;
    const unrealizedPnlPercent = (unrealizedPnl / (avgCost * quantity)) * 100;

    const { error } = await supabase
      .from('holdings')
      .insert({
        account_id: accountId,
        symbol,
        asset_type: assetType,
        quantity,
        average_cost: avgCost,
        current_price: currentPrice,
        market_value: marketValue,
        unrealized_pnl: unrealizedPnl,
        unrealized_pnl_percent: unrealizedPnlPercent,
      });

    if (error) throw error;
    holdings.push({ symbol, quantity, avgCost, currentPrice });
  }

  return holdings;
}

async function createTransactions(accountId: string, holdings: any[], count: number) {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  for (let i = 0; i < count; i++) {
    const holding = randomElement(holdings);
    const type = randomElement(['buy', 'sell']);
    const quantity = randomFloat(1, holding.quantity / 2, 2);
    const price = holding.avgCost * randomFloat(0.9, 1.1, 2);
    const totalAmount = quantity * price;
    const fee = totalAmount * 0.0001;

    const { error } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        transaction_type: type,
        symbol: holding.symbol,
        asset_type: ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'].includes(holding.symbol) ? 'crypto' : 'stock',
        quantity,
        price,
        total_amount: totalAmount,
        fee,
        status: 'completed',
        created_at: randomDate(sixMonthsAgo, now).toISOString(),
      });

    if (error) throw error;
  }
}

async function createBotAllocations(userId: string, accountId: string, count: number) {
  const bots = [];

  for (let i = 0; i < count; i++) {
    const strategy = randomElement(BOT_STRATEGIES);
    const allocatedAmount = randomFloat(5000, 50000, 2);
    const currentValue = allocatedAmount * randomFloat(0.85, 1.25, 2);
    const profitLoss = currentValue - allocatedAmount;
    const profitLossPercent = (profitLoss / allocatedAmount) * 100;

    const { data, error } = await supabase
      .from('bot_allocations')
      .insert({
        user_id: userId,
        account_id: accountId,
        bot_name: `${strategy.toUpperCase()} Bot ${i + 1}`,
        strategy,
        allocated_amount: allocatedAmount,
        current_value: currentValue,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent,
        is_active: randomFloat(0, 1) > 0.2,
        risk_level: randomElement(['low', 'medium', 'high']),
        symbols: Array.from({ length: randomInt(3, 8) }, () => randomElement(SYMBOLS)),
      })
      .select()
      .single();

    if (error) throw error;
    bots.push(data);
  }

  return bots;
}

async function createBotTrades(botAllocationId: string, count: number) {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  for (let i = 0; i < count; i++) {
    const symbol = randomElement(SYMBOLS);
    const side = randomElement(['buy', 'sell']);
    const quantity = randomFloat(1, 20, 2);
    const entryPrice = randomFloat(50, 500, 2);
    const exitPrice = side === 'buy'
      ? entryPrice * randomFloat(1.01, 1.08, 2)
      : entryPrice * randomFloat(0.92, 0.99, 2);
    const profitLoss = side === 'buy'
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;

    const { error } = await supabase
      .from('bot_trades')
      .insert({
        bot_allocation_id: botAllocationId,
        symbol,
        side,
        quantity,
        entry_price: entryPrice,
        exit_price: exitPrice,
        profit_loss: profitLoss,
        status: 'closed',
        opened_at: randomDate(thirtyDaysAgo, now).toISOString(),
        closed_at: randomDate(thirtyDaysAgo, now).toISOString(),
      });

    if (error) throw error;
  }
}

async function createWatchlist(userId: string) {
  const watchlistSymbols = Array.from(
    { length: randomInt(5, 12) },
    () => randomElement(SYMBOLS)
  ).filter((val, index, self) => self.indexOf(val) === index);

  for (const symbol of watchlistSymbols) {
    const { error } = await supabase
      .from('watchlist')
      .insert({
        user_id: userId,
        symbol,
        asset_type: ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'].includes(symbol) ? 'crypto' : 'stock',
        notes: randomElement([null, 'High potential', 'Watch for dip', 'Long-term hold']),
      });

    if (error) throw error;
  }
}

async function createNotifications(userId: string, count: number) {
  const notificationTypes = [
    'trade_executed',
    'price_alert',
    'bot_performance',
    'account_activity',
    'security_alert',
  ];

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  for (let i = 0; i < count; i++) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: randomElement(notificationTypes),
        title: `Notification ${i + 1}`,
        message: `This is a test notification message for user.`,
        is_read: randomFloat(0, 1) > 0.5,
        created_at: randomDate(sevenDaysAgo, now).toISOString(),
      });

    if (error) throw error;
  }
}

async function seedUser(userData: typeof TEST_USERS[0], index: number) {
  try {
    console.log(`\n[${index + 1}/10] Creating user: ${userData.email}`);

    // Create user and profile
    const userId = await createUser(userData);
    console.log(`  ✓ User created with ID: ${userId}`);

    // Create accounts
    const accounts = await createAccounts(userId);
    console.log(`  ✓ Created ${accounts.length} account(s)`);

    // For each account, create holdings, transactions, and bots
    for (const account of accounts) {
      const holdingsCount = randomInt(5, 15);
      const holdings = await createHoldings(account.id, holdingsCount);
      console.log(`  ✓ Created ${holdingsCount} holdings for account ${account.name}`);

      const transactionCount = randomInt(50, 200);
      await createTransactions(account.id, holdings, transactionCount);
      console.log(`  ✓ Created ${transactionCount} transactions`);

      const botCount = randomInt(2, 5);
      const bots = await createBotAllocations(userId, account.id, botCount);
      console.log(`  ✓ Created ${botCount} trading bot(s)`);

      // Create trades for each bot
      for (const bot of bots) {
        const tradesCount = randomInt(20, 100);
        await createBotTrades(bot.id, tradesCount);
      }
      console.log(`  ✓ Created bot trades`);
    }

    // Create watchlist
    await createWatchlist(userId);
    console.log(`  ✓ Created watchlist`);

    // Create notifications
    const notificationCount = randomInt(10, 30);
    await createNotifications(userId, notificationCount);
    console.log(`  ✓ Created ${notificationCount} notifications`);

    console.log(`✓ Successfully seeded user: ${userData.email}`);
    console.log(`  Login: ${userData.email} / Test123456!`);

  } catch (error) {
    console.error(`✗ Error seeding user ${userData.email}:`, error);
    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  DATABASE SEEDING SCRIPT');
  console.log('  Generating test data for 10 users');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Database URL:', SUPABASE_URL);
  console.log('Starting seed process...\n');

  const startTime = Date.now();

  for (let i = 0; i < TEST_USERS.length; i++) {
    await seedUser(TEST_USERS[i], i);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  SEEDING COMPLETE!');
  console.log(`  Duration: ${duration} seconds`);
  console.log('═══════════════════════════════════════════════════\n');
  console.log('Test User Credentials:');
  console.log('Email: alice.johnson@example.com (or any user from list)');
  console.log('Password: Test123456!');
  console.log('\nAll users share the same password for testing.\n');
}

// Run the seeding script
main()
  .then(() => {
    console.log('✓ Seeding script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Seeding script failed:', error);
    process.exit(1);
  });
