import { supabase } from '@/lib/supabase';

export interface PortfolioMetrics {
  totalValue: number;
  cashBalance: number;
  investmentBalance: number;
  todayChange: number;
  todayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChangeByHolding: Map<string, number>;
}

export class PortfolioCalculator {
  async calculatePortfolioMetrics(userId: string): Promise<PortfolioMetrics> {
    const [accountsResult, holdingsResult] = await Promise.all([
      supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId),
      supabase
        .from('holdings')
        .select('market_value, unrealized_pnl, day_change, quantity, average_cost, symbol')
        .eq('user_id', userId)
    ]);

    const accounts = accountsResult.data || [];
    const holdings = holdingsResult.data || [];

    const cashBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    const investmentBalance = holdings.reduce((sum, h) => sum + Number(h.market_value), 0);

    const totalValue = cashBalance + investmentBalance;

    const todayChange = holdings.reduce((sum, h) => sum + Number(h.day_change || 0), 0);

    const totalReturn = holdings.reduce((sum, h) => sum + Number(h.unrealized_pnl || 0), 0);

    const costBasis = holdings.reduce((sum, h) =>
      sum + (Number(h.quantity) * Number(h.average_cost)), 0
    );

    const todayChangePercent = investmentBalance > 0
      ? (todayChange / investmentBalance) * 100
      : 0;

    const totalReturnPercent = costBasis > 0
      ? (totalReturn / costBasis) * 100
      : 0;

    const dayChangeByHolding = new Map<string, number>();
    holdings.forEach(h => {
      dayChangeByHolding.set(h.symbol, Number(h.day_change || 0));
    });

    return {
      totalValue,
      cashBalance,
      investmentBalance,
      todayChange,
      todayChangePercent,
      totalReturn,
      totalReturnPercent,
      dayChangeByHolding
    };
  }

  async updateLeaderboard(userId: string): Promise<void> {
    await supabase.rpc('update_user_leaderboard', { p_user_id: userId });
  }

  async createPortfolioSnapshot(userId: string, metrics: PortfolioMetrics): Promise<void> {
    const { error } = await supabase
      .from('portfolio_snapshots')
      .upsert({
        user_id: userId,
        snapshot_date: new Date().toISOString().split('T')[0],
        total_value: metrics.totalValue,
        cash_balance: metrics.cashBalance,
        investment_balance: metrics.investmentBalance,
        day_change: metrics.todayChange,
        day_change_percent: metrics.todayChangePercent,
      }, {
        onConflict: 'user_id,snapshot_date'
      });

    if (error) {
      console.error('Failed to create portfolio snapshot:', error);
    }
  }

  async getHistoricalSnapshots(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch historical snapshots:', error);
      return [];
    }

    return data || [];
  }
}

export const portfolioCalculator = new PortfolioCalculator();
