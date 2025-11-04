import { supabase } from '@/lib/supabase';

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_value: number;
  cash_balance: number;
  investments_value: number;
  day_change: number;
  day_change_percent: number;
  total_return: number;
  total_return_percent: number;
  total_deposits: number;
  total_withdrawals: number;
  realized_gains: number;
  unrealized_gains: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PortfolioMetrics {
  id: string;
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time';
  period_start: string;
  period_end: string;
  starting_value: number;
  ending_value: number;
  net_deposits: number;
  total_return: number;
  return_percent: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  max_drawdown_date: string | null;
  best_day_return: number;
  worst_day_return: number;
  winning_days: number;
  losing_days: number;
  avg_daily_return: number;
  metadata: Record<string, any>;
  calculated_at: string;
  created_at: string;
}

export interface AssetAllocation {
  id: string;
  user_id: string;
  snapshot_date: string;
  allocation_type: 'asset_class' | 'sector' | 'geography' | 'security';
  category: string;
  value: number;
  percentage: number;
  quantity: number;
  cost_basis: number;
  unrealized_gain: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TaxLot {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  acquisition_date: string;
  quantity: number;
  cost_basis_per_share: number;
  total_cost_basis: number;
  remaining_quantity: number;
  disposition_date: string | null;
  disposition_price: number | null;
  realized_gain: number | null;
  holding_period: 'short_term' | 'long_term' | null;
  trade_id: string | null;
  status: 'open' | 'partial' | 'closed';
  lot_method: 'fifo' | 'lifo' | 'hifo' | 'specific';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PerformanceSummary {
  current_value: number;
  total_return: number;
  total_return_percent: number;
  day_change: number;
  day_change_percent: number;
  week_return: number;
  week_return_percent: number;
  month_return: number;
  month_return_percent: number;
  year_return: number;
  year_return_percent: number;
  all_time_return: number;
  all_time_return_percent: number;
}

class PortfolioAnalyticsService {
  async createSnapshot(userId: string, snapshotDate?: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_portfolio_snapshot', {
        p_user_id: userId,
        p_snapshot_date: snapshotDate || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating portfolio snapshot:', error);
      return null;
    }
  }

  async getSnapshots(userId: string, startDate?: string, endDate?: string): Promise<PortfolioSnapshot[]> {
    try {
      let query = supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false });

      if (startDate) {
        query = query.gte('snapshot_date', startDate);
      }
      if (endDate) {
        query = query.lte('snapshot_date', endDate);
      }

      const { data, error } = await query.limit(365);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching portfolio snapshots:', error);
      return [];
    }
  }

  async getMetrics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time'
  ): Promise<PortfolioMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('portfolio_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching portfolio metrics:', error);
      return null;
    }
  }

  async calculateMetrics(
    userId: string,
    period: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('calculate_portfolio_metrics', {
        p_user_id: userId,
        p_period: period,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
      return null;
    }
  }

  async getAssetAllocations(userId: string, date?: string): Promise<AssetAllocation[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('asset_allocations')
        .select('*')
        .eq('user_id', userId)
        .eq('snapshot_date', targetDate)
        .order('percentage', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching asset allocations:', error);
      return [];
    }
  }

  async getTaxLots(userId: string, symbol?: string): Promise<TaxLot[]> {
    try {
      let query = supabase
        .from('tax_lots')
        .select('*')
        .eq('user_id', userId)
        .order('acquisition_date', { ascending: true });

      if (symbol) {
        query = query.eq('symbol', symbol);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tax lots:', error);
      return [];
    }
  }

  async getPerformanceSummary(userId: string): Promise<PerformanceSummary | null> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];

      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const yearAgoStr = yearAgo.toISOString().split('T')[0];

      const snapshots = await this.getSnapshots(userId);

      if (snapshots.length === 0) {
        return null;
      }

      const currentSnapshot = snapshots[0];
      const yesterdaySnapshot = snapshots.find(s => s.snapshot_date < todayStr);
      const weekSnapshot = snapshots.find(s => s.snapshot_date <= weekAgoStr);
      const monthSnapshot = snapshots.find(s => s.snapshot_date <= monthAgoStr);
      const yearSnapshot = snapshots.find(s => s.snapshot_date <= yearAgoStr);
      const firstSnapshot = snapshots[snapshots.length - 1];

      const calculateReturn = (current: number, previous: number | undefined, deposits: number = 0) => {
        if (!previous || previous === 0) return { value: 0, percent: 0 };
        const netReturn = current - previous - deposits;
        const percent = (netReturn / previous) * 100;
        return { value: netReturn, percent };
      };

      const dayReturn = calculateReturn(
        currentSnapshot.total_value,
        yesterdaySnapshot?.total_value
      );

      const weekReturn = calculateReturn(
        currentSnapshot.total_value,
        weekSnapshot?.total_value
      );

      const monthReturn = calculateReturn(
        currentSnapshot.total_value,
        monthSnapshot?.total_value
      );

      const yearReturn = calculateReturn(
        currentSnapshot.total_value,
        yearSnapshot?.total_value
      );

      const allTimeReturn = calculateReturn(
        currentSnapshot.total_value,
        firstSnapshot?.total_value
      );

      return {
        current_value: currentSnapshot.total_value,
        total_return: currentSnapshot.total_return || 0,
        total_return_percent: currentSnapshot.total_return_percent || 0,
        day_change: dayReturn.value,
        day_change_percent: dayReturn.percent,
        week_return: weekReturn.value,
        week_return_percent: weekReturn.percent,
        month_return: monthReturn.value,
        month_return_percent: monthReturn.percent,
        year_return: yearReturn.value,
        year_return_percent: yearReturn.percent,
        all_time_return: allTimeReturn.value,
        all_time_return_percent: allTimeReturn.percent,
      };
    } catch (error) {
      console.error('Error calculating performance summary:', error);
      return null;
    }
  }

  async calculateAllocationsByType(
    userId: string,
    holdings: any[],
    quotes: Map<string, number>
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const allocations: Omit<AssetAllocation, 'id' | 'user_id' | 'created_at'>[] = [];

      let totalValue = 0;
      const securityValues = new Map<string, number>();

      holdings.forEach(holding => {
        const currentPrice = quotes.get(holding.symbol) || holding.average_cost;
        const value = holding.quantity * currentPrice;
        totalValue += value;
        securityValues.set(holding.symbol, value);
      });

      holdings.forEach(holding => {
        const currentPrice = quotes.get(holding.symbol) || holding.average_cost;
        const value = securityValues.get(holding.symbol) || 0;
        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
        const costBasis = holding.quantity * holding.average_cost;
        const unrealizedGain = value - costBasis;

        allocations.push({
          snapshot_date: today,
          allocation_type: 'security',
          category: holding.symbol,
          value,
          percentage,
          quantity: holding.quantity,
          cost_basis: costBasis,
          unrealized_gain: unrealizedGain,
          metadata: {},
        });
      });

      if (allocations.length > 0) {
        const { error } = await supabase
          .from('asset_allocations')
          .upsert(
            allocations.map(a => ({ ...a, user_id: userId })),
            { onConflict: 'user_id,snapshot_date,allocation_type,category' }
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error calculating allocations:', error);
    }
  }

  async exportPerformanceReport(userId: string, format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const snapshots = await this.getSnapshots(userId);
      const summary = await this.getPerformanceSummary(userId);
      const allocations = await this.getAssetAllocations(userId);

      if (format === 'json') {
        return JSON.stringify({ snapshots, summary, allocations }, null, 2);
      }

      let csv = 'Date,Total Value,Cash,Investments,Day Change,Day Change %,Total Return,Total Return %\n';

      snapshots.forEach(snapshot => {
        csv += `${snapshot.snapshot_date},${snapshot.total_value},${snapshot.cash_balance},${snapshot.investments_value},${snapshot.day_change},${snapshot.day_change_percent},${snapshot.total_return},${snapshot.total_return_percent}\n`;
      });

      return csv;
    } catch (error) {
      console.error('Error exporting performance report:', error);
      return '';
    }
  }
}

export const portfolioAnalyticsService = new PortfolioAnalyticsService();
