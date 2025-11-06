import { supabase } from '@/lib/supabase';

export interface AssetBreakdown {
  cash: number;
  stocks: number;
  crypto: number;
  bonds: number;
  other: number;
}

export interface DetailedPortfolioMetrics {
  totalValue: number;
  cashBalance: number;
  investmentBalance: number;

  // Detailed breakdown
  assetBreakdown: AssetBreakdown;

  // By account type
  cashAccountsTotal: number;
  equityAccountsTotal: number;
  cryptoAccountsTotal: number;

  // Holdings by asset type
  stockHoldingsTotal: number;
  cryptoHoldingsTotal: number;
  bondHoldingsTotal: number;

  // Performance metrics
  todayChange: number;
  todayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChangeByHolding: Map<string, number>;
}

export class PortfolioAggregationService {
  /**
   * Get complete portfolio breakdown for a user
   * This properly categorizes cash vs investments and breaks down by asset type
   */
  async getDetailedPortfolioMetrics(userId: string): Promise<DetailedPortfolioMetrics> {
    // Get all accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('account_type, balance, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Get all holdings with asset types
    const { data: holdings } = await supabase
      .from('holdings')
      .select('asset_type, market_value, unrealized_pnl, day_change, symbol')
      .eq('user_id', userId);

    const accountsList = accounts || [];
    const holdingsList = holdings || [];

    // Categorize accounts by type
    const cashAccountTypes = ['primary_cash', 'savings_cash', 'trading_cash'];
    const equityAccountTypes = ['equity_trading', 'dividend_income', 'margin_trading'];
    const cryptoAccountTypes = ['crypto_portfolio'];

    // Calculate cash account balances (truly liquid cash)
    const cashAccountsTotal = accountsList
      .filter(a => cashAccountTypes.includes(a.account_type))
      .reduce((sum, a) => sum + Number(a.balance), 0);

    // Calculate equity account balances (cash in trading accounts)
    const equityAccountsTotal = accountsList
      .filter(a => equityAccountTypes.includes(a.account_type))
      .reduce((sum, a) => sum + Number(a.balance), 0);

    // Calculate crypto account balances (cash in crypto accounts)
    const cryptoAccountsTotal = accountsList
      .filter(a => cryptoAccountTypes.includes(a.account_type))
      .reduce((sum, a) => sum + Number(a.balance), 0);

    // Calculate holdings by asset type
    const stockHoldingsTotal = holdingsList
      .filter(h => h.asset_type === 'stock')
      .reduce((sum, h) => sum + Number(h.market_value), 0);

    const cryptoHoldingsTotal = holdingsList
      .filter(h => h.asset_type === 'crypto')
      .reduce((sum, h) => sum + Number(h.market_value), 0);

    const bondHoldingsTotal = holdingsList
      .filter(h => h.asset_type === 'bond')
      .reduce((sum, h) => sum + Number(h.market_value), 0);

    const otherHoldingsTotal = holdingsList
      .filter(h => !['stock', 'crypto', 'bond'].includes(h.asset_type))
      .reduce((sum, h) => sum + Number(h.market_value), 0);

    // Asset breakdown for allocation chart
    const assetBreakdown: AssetBreakdown = {
      // Cash = only true cash accounts
      cash: cashAccountsTotal,

      // Stocks = holdings + uninvested cash in equity accounts
      stocks: stockHoldingsTotal + equityAccountsTotal,

      // Crypto = holdings + uninvested cash in crypto accounts
      crypto: cryptoHoldingsTotal + cryptoAccountsTotal,

      // Bonds = holdings only
      bonds: bondHoldingsTotal,

      // Other
      other: otherHoldingsTotal,
    };

    // Total portfolio value
    const totalValue = assetBreakdown.cash + assetBreakdown.stocks + assetBreakdown.crypto + assetBreakdown.bonds + assetBreakdown.other;

    // Investment balance (everything except pure cash accounts)
    const investmentBalance = assetBreakdown.stocks + assetBreakdown.crypto + assetBreakdown.bonds + assetBreakdown.other;

    // Performance calculations
    const todayChange = holdingsList.reduce((sum, h) => sum + Number(h.day_change || 0), 0);
    const totalReturn = holdingsList.reduce((sum, h) => sum + Number(h.unrealized_pnl || 0), 0);

    const holdingsValue = stockHoldingsTotal + cryptoHoldingsTotal + bondHoldingsTotal + otherHoldingsTotal;
    const todayChangePercent = holdingsValue > 0 ? (todayChange / holdingsValue) * 100 : 0;

    // Calculate cost basis for return percentage
    const costBasis = holdingsList.reduce((sum, h) => {
      const marketValue = Number(h.market_value);
      const unrealizedPnl = Number(h.unrealized_pnl || 0);
      return sum + (marketValue - unrealizedPnl);
    }, 0);

    const totalReturnPercent = costBasis > 0 ? (totalReturn / costBasis) * 100 : 0;

    const dayChangeByHolding = new Map<string, number>();
    holdingsList.forEach(h => {
      dayChangeByHolding.set(h.symbol, Number(h.day_change || 0));
    });

    return {
      totalValue,
      cashBalance: assetBreakdown.cash,
      investmentBalance,

      assetBreakdown,

      cashAccountsTotal,
      equityAccountsTotal,
      cryptoAccountsTotal,

      stockHoldingsTotal,
      cryptoHoldingsTotal,
      bondHoldingsTotal,

      todayChange,
      todayChangePercent,
      totalReturn,
      totalReturnPercent,
      dayChangeByHolding,
    };
  }

  /**
   * Get asset allocation for donut chart
   */
  async getAssetAllocation(userId: string) {
    const metrics = await this.getDetailedPortfolioMetrics(userId);
    const { assetBreakdown, totalValue } = metrics;

    return [
      {
        label: 'Cash',
        value: assetBreakdown.cash,
        percent: totalValue > 0 ? (assetBreakdown.cash / totalValue) * 100 : 0,
        color: '#9CA3AF',
        type: 'cash' as const,
      },
      {
        label: 'Stocks',
        value: assetBreakdown.stocks,
        percent: totalValue > 0 ? (assetBreakdown.stocks / totalValue) * 100 : 0,
        color: '#3B82F6',
        type: 'equities' as const,
      },
      {
        label: 'Crypto',
        value: assetBreakdown.crypto,
        percent: totalValue > 0 ? (assetBreakdown.crypto / totalValue) * 100 : 0,
        color: '#F59E0B',
        type: 'crypto' as const,
      },
      {
        label: 'Bonds',
        value: assetBreakdown.bonds,
        percent: totalValue > 0 ? (assetBreakdown.bonds / totalValue) * 100 : 0,
        color: '#10B981',
        type: 'bonds' as const,
      },
    ].filter(a => a.value > 0);
  }
}

export const portfolioAggregationService = new PortfolioAggregationService();
