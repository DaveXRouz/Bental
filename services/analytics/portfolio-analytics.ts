export interface PortfolioMetrics {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
  allTimeChange: number;
  allTimeChangePercent: number;
}

export interface RiskMetrics {
  sharpeRatio: number;
  volatility: number;
  beta: number;
  alpha: number;
  maxDrawdown: number;
  valueAtRisk: number;
  diversificationScore: number;
}

export interface PerformanceMetrics {
  roi: number;
  annualizedReturn: number;
  totalGainLoss: number;
  realizedGains: number;
  unrealizedGains: number;
  dividendIncome: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export interface AllocationMetrics {
  byAssetType: { type: string; value: number; percent: number }[];
  bySector: { sector: string; value: number; percent: number }[];
  byRisk: { level: string; value: number; percent: number }[];
  topHoldings: { symbol: string; value: number; percent: number }[];
}

class PortfolioAnalyticsService {
  calculatePortfolioMetrics(
    holdings: any[],
    historicalData: Map<string, any[]>
  ): PortfolioMetrics {
    const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.cost_basis || 0), 0);

    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    const dayChange = this.calculatePeriodChange(holdings, historicalData, 1);
    const weekChange = this.calculatePeriodChange(holdings, historicalData, 7);
    const monthChange = this.calculatePeriodChange(holdings, historicalData, 30);
    const yearChange = this.calculatePeriodChange(holdings, historicalData, 365);

    return {
      totalValue,
      totalReturn,
      totalReturnPercent,
      dayChange,
      dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0,
      weekChange,
      weekChangePercent: totalValue > 0 ? (weekChange / totalValue) * 100 : 0,
      monthChange,
      monthChangePercent: totalValue > 0 ? (monthChange / totalValue) * 100 : 0,
      yearChange,
      yearChangePercent: totalValue > 0 ? (yearChange / totalValue) * 100 : 0,
      allTimeChange: totalReturn,
      allTimeChangePercent: totalReturnPercent,
    };
  }

  calculateRiskMetrics(
    holdings: any[],
    historicalReturns: number[],
    marketReturns: number[]
  ): RiskMetrics {
    const volatility = this.calculateVolatility(historicalReturns);
    const avgReturn = historicalReturns.reduce((a, b) => a + b, 0) / historicalReturns.length;
    const riskFreeRate = 0.02;

    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate / 252) / volatility : 0;

    const beta = this.calculateBeta(historicalReturns, marketReturns);
    const alpha = avgReturn - (riskFreeRate / 252 + beta * (marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length - riskFreeRate / 252));

    const maxDrawdown = this.calculateMaxDrawdown(historicalReturns);
    const valueAtRisk = this.calculateVaR(historicalReturns, 0.95);
    const diversificationScore = this.calculateDiversification(holdings);

    return {
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      volatility: Number((volatility * 100).toFixed(2)),
      beta: Number(beta.toFixed(2)),
      alpha: Number((alpha * 100).toFixed(2)),
      maxDrawdown: Number((maxDrawdown * 100).toFixed(2)),
      valueAtRisk: Number((valueAtRisk * 100).toFixed(2)),
      diversificationScore: Number((diversificationScore * 100).toFixed(1)),
    };
  }

  calculatePerformanceMetrics(trades: any[], holdings: any[]): PerformanceMetrics {
    const completedTrades = trades.filter(t => t.status === 'completed');

    const realizedGains = completedTrades
      .filter(t => t.type === 'sell')
      .reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    const unrealizedGains = holdings.reduce(
      (sum, h) => sum + ((h.value || 0) - (h.cost_basis || 0)),
      0
    );

    const totalGainLoss = realizedGains + unrealizedGains;

    const totalInvested = holdings.reduce((sum, h) => sum + (h.cost_basis || 0), 0);
    const roi = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    const firstTradeDate = completedTrades.length > 0
      ? new Date(Math.min(...completedTrades.map(t => new Date(t.executed_at).getTime())))
      : new Date();
    const yearsSinceStart = (Date.now() - firstTradeDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const annualizedReturn = yearsSinceStart > 0
      ? Math.pow(1 + roi / 100, 1 / yearsSinceStart) - 1
      : 0;

    const wins = completedTrades.filter(t => (t.profit_loss || 0) > 0);
    const losses = completedTrades.filter(t => (t.profit_loss || 0) < 0);

    const winRate = completedTrades.length > 0
      ? (wins.length / completedTrades.length) * 100
      : 0;

    const avgWin = wins.length > 0
      ? wins.reduce((sum, t) => sum + t.profit_loss, 0) / wins.length
      : 0;

    const avgLoss = losses.length > 0
      ? losses.reduce((sum, t) => sum + Math.abs(t.profit_loss), 0) / losses.length
      : 0;

    return {
      roi: Number(roi.toFixed(2)),
      annualizedReturn: Number((annualizedReturn * 100).toFixed(2)),
      totalGainLoss: Number(totalGainLoss.toFixed(2)),
      realizedGains: Number(realizedGains.toFixed(2)),
      unrealizedGains: Number(unrealizedGains.toFixed(2)),
      dividendIncome: 0,
      winRate: Number(winRate.toFixed(1)),
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
    };
  }

  calculateAllocationMetrics(holdings: any[]): AllocationMetrics {
    const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);

    const byAssetType = this.groupByKey(holdings, 'asset_type', totalValue);
    const bySector = this.groupByKey(holdings, 'sector', totalValue);

    const byRisk = holdings.map(h => ({
      ...h,
      risk_level: this.determineRiskLevel(h),
    }));
    const riskAllocation = this.groupByKey(byRisk, 'risk_level', totalValue);

    const topHoldings = holdings
      .map(h => ({
        symbol: h.symbol,
        value: h.value || 0,
        percent: totalValue > 0 ? ((h.value || 0) / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      byAssetType,
      bySector,
      byRisk: riskAllocation,
      topHoldings,
    };
  }

  private calculatePeriodChange(
    holdings: any[],
    historicalData: Map<string, any[]>,
    days: number
  ): number {
    return holdings.reduce((sum, holding) => {
      const history = historicalData.get(holding.symbol);
      if (!history || history.length < days) return sum;

      const oldPrice = history[history.length - days]?.close || holding.avg_price;
      const currentPrice = holding.current_price || holding.avg_price;
      const quantity = holding.quantity || 0;

      return sum + (currentPrice - oldPrice) * quantity;
    }, 0);
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;

    return Math.sqrt(variance);
  }

  private calculateBeta(returns: number[], marketReturns: number[]): number {
    if (returns.length !== marketReturns.length || returns.length === 0) return 1;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < returns.length; i++) {
      covariance += (returns[i] - meanReturn) * (marketReturns[i] - meanMarket);
      marketVariance += Math.pow(marketReturns[i] - meanMarket, 2);
    }

    covariance /= returns.length;
    marketVariance /= returns.length;

    return marketVariance > 0 ? covariance / marketVariance : 1;
  }

  private calculateMaxDrawdown(returns: number[]): number {
    if (returns.length === 0) return 0;

    let peak = 1;
    let maxDrawdown = 0;
    let cumulative = 1;

    for (const ret of returns) {
      cumulative *= 1 + ret;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = (peak - cumulative) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;

    const sorted = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sorted.length);

    return sorted[index] || 0;
  }

  private calculateDiversification(holdings: any[]): number {
    if (holdings.length === 0) return 0;

    const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);

    const herfindahlIndex = holdings.reduce((sum, h) => {
      const weight = totalValue > 0 ? (h.value || 0) / totalValue : 0;
      return sum + Math.pow(weight, 2);
    }, 0);

    return 1 - herfindahlIndex;
  }

  private determineRiskLevel(holding: any): string {
    const volatility = holding.volatility || 0;

    if (volatility < 0.15) return 'Low Risk';
    if (volatility < 0.25) return 'Medium Risk';
    return 'High Risk';
  }

  private groupByKey(
    items: any[],
    key: string,
    totalValue: number
  ): { type?: string; sector?: string; level?: string; value: number; percent: number }[] {
    const groups = new Map<string, number>();

    items.forEach(item => {
      const groupKey = item[key] || 'Other';
      const value = item.value || 0;
      groups.set(groupKey, (groups.get(groupKey) || 0) + value);
    });

    return Array.from(groups.entries())
      .map(([name, value]) => ({
        [key === 'asset_type' ? 'type' : key === 'sector' ? 'sector' : 'level']: name,
        value: Number(value.toFixed(2)),
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }
}

export default new PortfolioAnalyticsService();
