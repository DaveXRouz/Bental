import { supabase } from '@/lib/supabase';

export interface AIInsight {
  user_id: string;
  insight_type: 'market_update' | 'risk_alert' | 'opportunity' | 'portfolio_review';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  is_read: boolean;
}

export class AIInsightsGenerator {
  private static readonly MARKET_INSIGHTS = [
    {
      type: 'market_update' as const,
      title: 'Tech Sector Rally Continues',
      content: 'The Nasdaq Composite gained 2.3% today, driven by strong earnings from major tech companies. Your technology holdings (AAPL, MSFT, NVDA) benefited from this momentum.',
      priority: 'medium' as const,
    },
    {
      type: 'market_update' as const,
      title: 'Federal Reserve Holds Rates Steady',
      content: 'The Fed maintained interest rates at 5.25%-5.50%, signaling a data-dependent approach. This stability benefits your bond positions and dividend-paying stocks.',
      priority: 'medium' as const,
    },
    {
      type: 'market_update' as const,
      title: 'Energy Sector Volatility',
      content: 'Oil prices fluctuated 3.5% this week due to geopolitical tensions. Consider reviewing your energy sector exposure for potential rebalancing opportunities.',
      priority: 'low' as const,
    },
    {
      type: 'market_update' as const,
      title: 'Bitcoin Surges Past $65,000.00',
      content: 'Cryptocurrency markets rallied strongly with Bitcoin gaining 8.2% and Ethereum up 6.5%. Your crypto portfolio (BTC, ETH, SOL) shows significant gains.',
      priority: 'high' as const,
    },
  ];

  private static readonly RISK_ALERTS = [
    {
      type: 'risk_alert' as const,
      title: 'High Concentration in Tech',
      content: 'Analysis shows 45% of your portfolio is concentrated in the technology sector. Consider diversifying into other sectors to reduce concentration risk.',
      priority: 'high' as const,
    },
    {
      type: 'risk_alert' as const,
      title: 'Low Cash Reserve Detected',
      content: 'Your cash holdings represent only 5% of total portfolio value. Maintaining 10-15% cash provides flexibility for opportunistic investments and emergencies.',
      priority: 'medium' as const,
    },
    {
      type: 'risk_alert' as const,
      title: 'Increased Portfolio Volatility',
      content: 'Portfolio volatility has increased 18% over the past 30 days. Review risk tolerance and consider adding more stable, dividend-paying securities.',
      priority: 'medium' as const,
    },
    {
      type: 'risk_alert' as const,
      title: 'Single Stock Over 15% Allocation',
      content: 'NVDA currently represents 17% of your portfolio. Individual holdings above 15% may expose you to significant company-specific risk.',
      priority: 'high' as const,
    },
  ];

  private static readonly OPPORTUNITIES = [
    {
      type: 'opportunity' as const,
      title: 'Dividend Opportunity: JPM',
      content: 'JPMorgan Chase (JPM) offers a 3.2% dividend yield with ex-dividend date in 5 days. Historical analysis shows strong dividend growth and stability.',
      priority: 'low' as const,
    },
    {
      type: 'opportunity' as const,
      title: 'Value Stock Alert: CVX',
      content: 'Chevron (CVX) trading at 12x P/E ratio, below 5-year average. Strong fundamentals and 3.8% dividend yield present potential value opportunity.',
      priority: 'medium' as const,
    },
    {
      type: 'opportunity' as const,
      title: 'Bond Opportunity: Treasury Yields',
      content: '10-year Treasury yields at 4.5% offer attractive risk-adjusted returns for portfolio stabilization. Consider allocating 15-20% to fixed income.',
      priority: 'medium' as const,
    },
    {
      type: 'opportunity' as const,
      title: 'Growth Stock: Emerging EV Market',
      content: 'Electric vehicle sector shows 28% growth trajectory. TSLA down 8% from highs may present accumulation opportunity for long-term investors.',
      priority: 'low' as const,
    },
    {
      type: 'opportunity' as const,
      title: 'Rebalancing Opportunity',
      content: 'Portfolio drift detected: Tech +8%, Healthcare -3% from target allocations. Rebalancing now could improve risk-adjusted returns.',
      priority: 'medium' as const,
    },
  ];

  private static readonly PORTFOLIO_REVIEWS = [
    {
      type: 'portfolio_review' as const,
      title: 'Strong Monthly Performance',
      content: 'Portfolio gained 4.2% this month, outperforming S&P 500 (+2.8%). Top performers: NVDA (+12%), MSFT (+6%), BTC (+15%). Excellent momentum across holdings.',
      priority: 'medium' as const,
    },
    {
      type: 'portfolio_review' as const,
      title: 'Quarterly Review: Q4 2025',
      content: 'Q4 portfolio return: +8.5% vs benchmark +6.2%. Year-to-date: +24.3%. Strong performance driven by tech and crypto allocations. Risk metrics remain within targets.',
      priority: 'high' as const,
    },
    {
      type: 'portfolio_review' as const,
      title: 'Dividend Income Summary',
      content: 'Total dividend income this quarter: $1,247.00. Annualized yield: 2.8%. Top payers: JPM ($320.00), CVX ($290.00), AAPL ($215.00). Consider reinvesting for compound growth.',
      priority: 'low' as const,
    },
    {
      type: 'portfolio_review' as const,
      title: 'Risk-Adjusted Returns Analysis',
      content: 'Sharpe ratio improved to 1.42 from 1.18 last quarter. Portfolio efficiency increasing with better risk-adjusted returns. Volatility remains elevated at 18%.',
      priority: 'medium' as const,
    },
    {
      type: 'portfolio_review' as const,
      title: 'Asset Allocation Check',
      content: 'Current allocation: Stocks 65%, Crypto 20%, Cash 10%, Bonds 5%. Slightly overweight equities vs 60/25/10/5 target. Consider minor rebalancing.',
      priority: 'low' as const,
    },
  ];

  static async generateInsightsForUser(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    const marketInsights = this.MARKET_INSIGHTS.slice(0, 2).map(insight => ({
      user_id: userId,
      insight_type: insight.type,
      title: insight.title,
      content: insight.content,
      priority: insight.priority,
      is_read: false,
    }));

    const riskAlerts = this.RISK_ALERTS.slice(0, 2).map(insight => ({
      user_id: userId,
      insight_type: insight.type,
      title: insight.title,
      content: insight.content,
      priority: insight.priority,
      is_read: false,
    }));

    const opportunities = this.OPPORTUNITIES.slice(0, 3).map(insight => ({
      user_id: userId,
      insight_type: insight.type,
      title: insight.title,
      content: insight.content,
      priority: insight.priority,
      is_read: false,
    }));

    const portfolioReviews = this.PORTFOLIO_REVIEWS.slice(0, 2).map(insight => ({
      user_id: userId,
      insight_type: insight.type,
      title: insight.title,
      content: insight.content,
      priority: insight.priority,
      is_read: false,
    }));

    insights.push(...marketInsights, ...riskAlerts, ...opportunities, ...portfolioReviews);

    return insights;
  }

  static async generateAndSaveInsights(userId: string): Promise<void> {
    const insights = await this.generateInsightsForUser(userId);

    for (const insight of insights) {
      await supabase.from('ai_insights').insert(insight);
    }
  }

  static async generateForAllUsers(): Promise<void> {
    const { data: profiles } = await supabase.from('profiles').select('id');

    if (!profiles) return;

    for (const profile of profiles) {
      const { count } = await supabase
        .from('ai_insights')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      if (count === 0 || count === null) {
        await this.generateAndSaveInsights(profile.id);
        console.log(`Generated insights for user ${profile.id}`);
      }
    }
  }
}
