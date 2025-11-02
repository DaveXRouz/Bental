import { create } from 'zustand';
import { Account, Holding, Trade } from '@/types/models';

interface PortfolioStore {
  accounts: Account[];
  holdings: Holding[];
  recentTrades: Trade[];
  totalValue: number;
  todayPnl: number;
  todayPnlPct: number;
  isLoading: boolean;

  setAccounts: (accounts: Account[]) => void;
  setHoldings: (holdings: Holding[]) => void;
  setRecentTrades: (trades: Trade[]) => void;
  setTotalValue: (value: number) => void;
  setTodayPnl: (pnl: number, pnlPct: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  accounts: [],
  holdings: [],
  recentTrades: [],
  totalValue: 0,
  todayPnl: 0,
  todayPnlPct: 0,
  isLoading: false,

  setAccounts: (accounts) => set({ accounts }),
  setHoldings: (holdings) => set({ holdings }),
  setRecentTrades: (trades) => set({ recentTrades: trades }),
  setTotalValue: (value) => set({ totalValue: value }),
  setTodayPnl: (pnl, pnlPct) => set({ todayPnl: pnl, todayPnlPct: pnlPct }),
  setLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({
      accounts: [],
      holdings: [],
      recentTrades: [],
      totalValue: 0,
      todayPnl: 0,
      todayPnlPct: 0,
      isLoading: false,
    }),
}));
