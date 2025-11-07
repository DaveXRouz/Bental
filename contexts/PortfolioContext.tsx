import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAccountContext } from './AccountContext';
import { getPortfolioState, type PortfolioState } from '@/services/portfolio/portfolio-operations-service';
import { supabase } from '@/lib/supabase';

interface PortfolioContextType {
  portfolioState: PortfolioState | null;
  loading: boolean;
  error: string | null;
  refreshPortfolio: () => Promise<void>;
  hasBalance: boolean;
  hasHoldings: boolean;
  isEmpty: boolean;
  totalValue: number;
  cashBalance: number;
  holdingsValue: number;
  totalPnL: number;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { selectedAccounts } = useAccountContext();
  const [portfolioState, setPortfolioState] = useState<PortfolioState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the primary selected account (for now, we'll use the first selected account)
  const primaryAccountId = selectedAccounts.length > 0 ? selectedAccounts[0].id : null;

  const refreshPortfolio = useCallback(async () => {
    if (!primaryAccountId) {
      setPortfolioState(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const state = await getPortfolioState(primaryAccountId);
      setPortfolioState(state);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load portfolio';
      setError(errorMsg);
      console.error('Portfolio refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [primaryAccountId]);

  // Initial load
  useEffect(() => {
    if (user && primaryAccountId) {
      refreshPortfolio();
    }
  }, [user, primaryAccountId, refreshPortfolio]);

  // Set up real-time subscriptions for portfolio changes
  useEffect(() => {
    if (!primaryAccountId) return;

    // Subscribe to account balance changes
    const accountChannel = supabase
      .channel(`account_${primaryAccountId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accounts',
          filter: `id=eq.${primaryAccountId}`,
        },
        () => {
          console.log('Account balance updated');
          refreshPortfolio();
        }
      )
      .subscribe();

    // Subscribe to holdings changes
    const holdingsChannel = supabase
      .channel(`holdings_${primaryAccountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'holdings',
          filter: `account_id=eq.${primaryAccountId}`,
        },
        () => {
          console.log('Holdings updated');
          refreshPortfolio();
        }
      )
      .subscribe();

    // Subscribe to pending orders changes
    const ordersChannel = supabase
      .channel(`pending_orders_${primaryAccountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_sell_orders',
          filter: `account_id=eq.${primaryAccountId}`,
        },
        () => {
          console.log('Pending orders updated');
          refreshPortfolio();
        }
      )
      .subscribe();

    // Subscribe to trades
    const tradesChannel = supabase
      .channel(`trades_${primaryAccountId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `account_id=eq.${primaryAccountId}`,
        },
        () => {
          console.log('New trade executed');
          refreshPortfolio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(accountChannel);
      supabase.removeChannel(holdingsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tradesChannel);
    };
  }, [primaryAccountId, refreshPortfolio]);

  // Computed properties
  const hasBalance = portfolioState ? portfolioState.account.balance > 0 : false;
  const hasHoldings = portfolioState ? portfolioState.holdings.length > 0 : false;
  const isEmpty = !hasBalance && !hasHoldings;
  const totalValue = portfolioState ? portfolioState.total_portfolio_value : 0;
  const cashBalance = portfolioState ? portfolioState.account.balance : 0;
  const holdingsValue = portfolioState ? portfolioState.total_holdings_value : 0;
  const totalPnL = portfolioState ? portfolioState.total_pnl : 0;

  const value: PortfolioContextType = {
    portfolioState,
    loading,
    error,
    refreshPortfolio,
    hasBalance,
    hasHoldings,
    isEmpty,
    totalValue,
    cashBalance,
    holdingsValue,
    totalPnL,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
