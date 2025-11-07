export const ALLOCATION_TYPES = {
  CASH: 'cash',
  STOCKS: 'stocks',
  CRYPTO: 'crypto',
  BONDS: 'bonds',
} as const;

export type AllocationType = typeof ALLOCATION_TYPES[keyof typeof ALLOCATION_TYPES];

export const ALLOCATION_COLORS: Record<AllocationType, string> = {
  cash: '#9CA3AF',
  stocks: '#3B82F6',
  crypto: '#F59E0B',
  bonds: '#10B981',
};

export const ALLOCATION_LABELS: Record<AllocationType, string> = {
  cash: 'Cash',
  stocks: 'Stocks',
  crypto: 'Crypto',
  bonds: 'Bonds',
};

export const ALLOCATION_DESCRIPTIONS: Record<AllocationType, string> = {
  cash: 'Liquid cash in savings and checking accounts',
  stocks: 'Equity holdings and trading account balances',
  crypto: 'Cryptocurrency holdings and wallet balances',
  bonds: 'Fixed income securities and bond holdings',
};
