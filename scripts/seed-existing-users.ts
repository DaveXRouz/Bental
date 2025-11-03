/**
 * Simplified Database Seeding Script
 * Populates data for existing demo users
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'BTC', 'ETH'];
const BOT_STRATEGIES = ['scalping', 'swing', 'momentum', 'mean_reversion', 'breakout'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  console.log('🌱 Seeding existing demo users with data...\n');

  // Get existing demo users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .like('email', '%@demo.com')
    .limit(10);

  if (error || !users || users.length === 0) {
    console.error('❌ No demo users found');
    process.exit(1);
  }

  console.log(`✅ Found ${users.length} demo users\n`);

  for (const user of users) {
    console.log(`📊 Seeding ${user.email}...`);

    // Update profile with full name if missing
    if (!user.full_name) {
      const name = user.email.split('@')[0].split('.').map((s: string) =>
        s.charAt(0).toUpperCase() + s.slice(1)
      ).join(' ');

      await supabase
        .from('profiles')
        .update({
          full_name: name,
          phone: `+1-555-${randomInt(1000, 9999)}`,
          country: randomElement(['US', 'CA', 'UK']),
          preferred_language: 'en',
          theme_preference: randomElement(['auto', 'light', 'dark'])
        })
        .eq('id', user.id);
    }

    // Create 1-2 accounts
    const accountCount = randomInt(1, 2);
    for (let i = 0; i < accountCount; i++) {
      const accountType = randomElement(['demo_cash', 'live_cash']);
      const { data: account } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          account_type: accountType,
          name: `${accountType.toUpperCase()} ${i + 1}`,
          balance: randomFloat(10000, 100000, 2),
          currency: 'USD',
          is_active: true,
        })
        .select()
        .single();

      if (account) {
        // Create 5-10 holdings
        const holdingsCount = randomInt(5, 10);
        for (let j = 0; j < holdingsCount; j++) {
          const symbol = randomElement(SYMBOLS);
          const avgCost = randomFloat(50, 500, 2);
          const currentPrice = avgCost * randomFloat(0.9, 1.2, 2);
          const quantity = randomFloat(1, 50, 2);
          const marketValue = quantity * currentPrice;
          const unrealizedPnl = (currentPrice - avgCost) * quantity;

          await supabase.from('holdings').insert({
            account_id: account.id,
            symbol,
            asset_type: ['BTC', 'ETH'].includes(symbol) ? 'crypto' : 'stock',
            quantity,
            average_cost: avgCost,
            current_price: currentPrice,
            market_value: marketValue,
            unrealized_pnl: unrealizedPnl,
            unrealized_pnl_percent: (unrealizedPnl / (avgCost * quantity)) * 100,
          });
        }

        // Create 2-3 bots
        const botCount = randomInt(2, 3);
        for (let k = 0; k < botCount; k++) {
          const strategy = randomElement(BOT_STRATEGIES);
          const allocatedAmount = randomFloat(5000, 25000, 2);
          const currentValue = allocatedAmount * randomFloat(0.9, 1.15, 2);
          const profitLoss = currentValue - allocatedAmount;

          const { data: bot } = await supabase
            .from('bot_allocations')
            .insert({
              user_id: user.id,
              account_id: account.id,
              bot_name: `${strategy.toUpperCase()} Bot ${k + 1}`,
              strategy,
              allocated_amount: allocatedAmount,
              current_value: currentValue,
              profit_loss: profitLoss,
              profit_loss_percent: (profitLoss / allocatedAmount) * 100,
              is_active: true,
              risk_level: randomElement(['low', 'medium', 'high']),
              symbols: Array.from({ length: randomInt(3, 6) }, () => randomElement(SYMBOLS)),
            })
            .select()
            .single();

          // Create 10-20 bot trades
          if (bot) {
            const tradesCount = randomInt(10, 20);
            for (let t = 0; t < tradesCount; t++) {
              const symbol = randomElement(bot.symbols as string[]);
              const side = randomElement(['buy', 'sell']);
              const quantity = randomFloat(1, 10, 2);
              const entryPrice = randomFloat(50, 500, 2);
              const exitPrice = entryPrice * randomFloat(0.95, 1.08, 2);
              const tradeProfit = side === 'buy'
                ? (exitPrice - entryPrice) * quantity
                : (entryPrice - exitPrice) * quantity;

              await supabase.from('bot_trades').insert({
                bot_allocation_id: bot.id,
                symbol,
                side,
                quantity,
                entry_price: entryPrice,
                exit_price: exitPrice,
                profit_loss: tradeProfit,
                status: 'closed',
                opened_at: new Date(Date.now() - randomInt(1, 30) * 86400000).toISOString(),
                closed_at: new Date(Date.now() - randomInt(0, 15) * 86400000).toISOString(),
              });
            }
          }
        }
      }
    }

    // Create watchlist
    const watchlistCount = randomInt(5, 10);
    for (let w = 0; w < watchlistCount; w++) {
      const symbol = randomElement(SYMBOLS);
      await supabase.from('watchlist').insert({
        user_id: user.id,
        symbol,
        asset_type: ['BTC', 'ETH'].includes(symbol) ? 'crypto' : 'stock',
        notes: randomElement([null, 'High potential', 'Watch for dip']),
      });
    }

    // Create notifications
    const notifCount = randomInt(5, 15);
    for (let n = 0; n < notifCount; n++) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        notification_type: randomElement(['trade_executed', 'price_alert', 'bot_performance']),
        title: `Notification ${n + 1}`,
        message: 'Test notification message',
        is_read: randomFloat(0, 1) > 0.5,
        created_at: new Date(Date.now() - randomInt(1, 7) * 86400000).toISOString(),
      });
    }

    console.log(`   ✅ Complete!\n`);
  }

  console.log('🎉 Seeding complete!\n');
  console.log('Test credentials:');
  console.log('Email: sarah.johnson@demo.com');
  console.log('Password: (use existing password)\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
