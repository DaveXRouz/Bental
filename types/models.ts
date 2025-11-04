export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  preferred_language: 'en' | 'fr';
  preferred_currency: string;
  theme_mode: 'light' | 'dark';
  notifications_enabled: boolean;
  analytics_enabled: boolean;
  expo_push_token?: string;
  created_at: string;
  updated_at: string;
}

export interface CashCourierDeposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'submitted' | 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
  address_json: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  scheduled_at?: string;
  notes?: string;
  created_at: string;
}

export interface CryptoDeposit {
  id: string;
  user_id: string;
  asset: string;
  network: string;
  address: string;
  tx_hash?: string;
  amount?: number;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  confirmations: number;
  created_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  institution: string;
  account_type: 'checking' | 'savings';
  last4: string;
  connected_via: 'manual' | 'plaid' | 'teller';
  status: 'active' | 'pending' | 'disconnected';
  created_at: string;
}

export interface SuitabilityAssessment {
  id: string;
  user_id: string;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
  investment_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  investment_horizon: 'short' | 'medium' | 'long';
  annual_income_range?: string;
  net_worth_range?: string;
  investment_objectives: string[];
  completed_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_type: 'demo_cash' | 'demo_crypto' | 'demo_equity' | 'live_cash' | 'live_equity';
  name: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Holding {
  id: string;
  account_id: string;
  symbol: string;
  asset_type: 'stock' | 'crypto' | 'etf' | 'bond';
  quantity: number;
  average_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  updated_at: string;
}

export interface Trade {
  id: string;
  account_id: string;
  symbol: string;
  asset_type: 'stock' | 'crypto' | 'etf' | 'bond';
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  fees: number;
  status: 'pending' | 'executed' | 'cancelled';
  executed_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  account_id: string;
  symbol: string;
  asset_type: 'stock' | 'crypto' | 'etf' | 'bond';
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  stop_price?: number;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  filled_quantity: number;
  created_at: string;
  updated_at: string;
  filled_at?: string;
  cancelled_at?: string;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  strategy_type: string;
  min_capital: number;
  projected_annual_return: number;
  projected_volatility: number;
  is_active: boolean;
  created_at: string;
}

export interface BotAllocation {
  id: string;
  user_id: string;
  bot_id: string;
  allocated_amount: number;
  current_value: number;
  total_return: number;
  total_return_percent: number;
  status: 'active' | 'paused' | 'closed';
  started_at: string;
  updated_at: string;
}

export interface BotPerformanceHistory {
  id: string;
  bot_id: string;
  date: string;
  value: number;
  return_percent: number;
}

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: 'market_update' | 'risk_alert' | 'opportunity' | 'portfolio_review';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  document_type: 'statement' | 'tax_form' | 'report' | 'contract' | 'other';
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  sent_at: string;
}

export interface MarketDataCache {
  id: string;
  symbol: string;
  data: any;
  expires_at: string;
  updated_at: string;
}

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getCandles(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<Candle[]>;
  subscribe?(symbols: string[], onTick: (symbol: string, price: number) => void): () => void;
}
