export interface TradingBot {
  id: string;
  name: string;
  strategy: string;
  status: 'active' | 'paused' | 'stopped';
  allocation: number;
  totalReturn: number;
  totalReturnPercent: number;
  dailyReturn: number;
  dailyReturnPercent: number;
  tradesCount: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  createdAt: string;
}

export interface BotTrade {
  id: string;
  botId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  profit?: number;
  profitPercent?: number;
  timestamp: string;
}

class MockTradingBotService {
  private bots: TradingBot[] = [
    {
      id: 'bot-1',
      name: 'Conservative Growth',
      strategy: 'DCA + Trend Following',
      status: 'active',
      allocation: 10000,
      totalReturn: 1234.56,
      totalReturnPercent: 12.35,
      dailyReturn: 23.45,
      dailyReturnPercent: 0.21,
      tradesCount: 47,
      winRate: 68.5,
      sharpeRatio: 1.85,
      maxDrawdown: -5.2,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'bot-2',
      name: 'Aggressive Momentum',
      strategy: 'Momentum + RSI',
      status: 'active',
      allocation: 5000,
      totalReturn: 892.34,
      totalReturnPercent: 17.85,
      dailyReturn: 45.67,
      dailyReturnPercent: 0.87,
      tradesCount: 123,
      winRate: 62.3,
      sharpeRatio: 1.42,
      maxDrawdown: -12.8,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'bot-3',
      name: 'Balanced Portfolio',
      strategy: 'Index + Rebalancing',
      status: 'paused',
      allocation: 15000,
      totalReturn: 1567.89,
      totalReturnPercent: 10.45,
      dailyReturn: 0,
      dailyReturnPercent: 0,
      tradesCount: 34,
      winRate: 73.5,
      sharpeRatio: 2.12,
      maxDrawdown: -3.4,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  async getBots(): Promise<TradingBot[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...this.bots];
  }

  async getBot(id: string): Promise<TradingBot | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return this.bots.find(bot => bot.id === id) || null;
  }

  async getBotTrades(botId: string, limit: number = 20): Promise<BotTrade[]> {
    await new Promise(resolve => setTimeout(resolve, 250));

    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    const trades: BotTrade[] = [];

    for (let i = 0; i < limit; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const quantity = Math.floor(Math.random() * 10) + 1;
      const price = Math.random() * 200 + 50;
      const total = quantity * price;
      const profit = side === 'sell' ? (Math.random() - 0.3) * 100 : undefined;
      const profitPercent = profit ? (profit / total) * 100 : undefined;

      trades.push({
        id: `trade-${botId}-${i}`,
        botId,
        symbol,
        side,
        quantity,
        price,
        total,
        profit,
        profitPercent,
        timestamp: new Date(Date.now() - i * 3600 * 1000).toISOString(),
      });
    }

    return trades;
  }

  async toggleBotStatus(botId: string): Promise<TradingBot> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const bot = this.bots.find(b => b.id === botId);
    if (!bot) throw new Error('Bot not found');

    bot.status = bot.status === 'active' ? 'paused' : 'active';
    return bot;
  }
}

export const mockTradingBotService = new MockTradingBotService();
