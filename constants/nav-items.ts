import {
  Home,
  PieChart,
  TrendingUp,
  History,
  Bot,
  Download,
  Upload,
  HelpCircle,
  FileText,
  Building2,
  Bell,
  User,
  Settings,
  MoreHorizontal,
  Newspaper,
  Trophy,
  Search,
  Receipt,
  BarChart3,
} from 'lucide-react-native';

export type DockItemId =
  | 'home'
  | 'portfolio'
  | 'markets'
  | 'more'
  | 'history'
  | 'ai'
  | 'deposits'
  | 'withdrawals'
  | 'support'
  | 'documents'
  | 'connect_bank'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'alerts'
  | 'news'
  | 'leaderboard'
  | 'bots'
  | 'screener'
  | 'tax'
  | 'analytics';

export type NavItemCapability = 'linkedBank' | 'kycDone' | 'aiEnabled';

export interface NavItem {
  id: DockItemId;
  label: string;
  route: string;
  icon: typeof Home;
  iconColor: string;
  requires?: NavItemCapability[];
  badge?: 'notifCount' | null;
  featureFlag?: string;
  description?: string;
}

export const NAV_ITEMS: Record<DockItemId, NavItem> = {
  home: {
    id: 'home',
    label: 'Home',
    route: '/(tabs)/index',
    icon: Home,
    iconColor: '#3B82F6',
    description: 'Dashboard overview',
  },
  portfolio: {
    id: 'portfolio',
    label: 'Portfolio',
    route: '/(tabs)/portfolio',
    icon: PieChart,
    iconColor: '#10B981',
    description: 'Your holdings',
  },
  markets: {
    id: 'markets',
    label: 'Markets',
    route: '/(tabs)/markets',
    icon: TrendingUp,
    iconColor: '#F59E0B',
    description: 'Explore stocks',
  },
  history: {
    id: 'history',
    label: 'History',
    route: '/(tabs)/history',
    icon: History,
    iconColor: '#06B6D4',
    description: 'Transaction history',
  },
  ai: {
    id: 'ai',
    label: 'AI Trading',
    route: '/(tabs)/ai-assistant',
    icon: Bot,
    iconColor: '#8B5CF6',
    description: 'Auto trading bots',
  },
  deposits: {
    id: 'deposits',
    label: 'Deposit',
    route: '/(tabs)/more',
    icon: Download,
    iconColor: '#10B981',
    description: 'Add funds',
  },
  withdrawals: {
    id: 'withdrawals',
    label: 'Withdraw',
    route: '/(tabs)/more',
    icon: Upload,
    iconColor: '#3B82F6',
    description: 'Transfer money out',
  },
  support: {
    id: 'support',
    label: 'Support',
    route: '/(tabs)/support',
    icon: HelpCircle,
    iconColor: '#10B981',
    description: 'Get help',
  },
  documents: {
    id: 'documents',
    label: 'Documents',
    route: '/(tabs)/more',
    icon: FileText,
    iconColor: '#3B82F6',
    description: 'Statements & forms',
  },
  connect_bank: {
    id: 'connect_bank',
    label: 'Connect Bank',
    route: '/(tabs)/more',
    icon: Building2,
    iconColor: '#06B6D4',
    requires: [],
    description: 'Link bank account',
  },
  notifications: {
    id: 'notifications',
    label: 'Alerts',
    route: '/(tabs)/more',
    icon: Bell,
    iconColor: '#F59E0B',
    badge: 'notifCount',
    description: 'Your notifications',
  },
  profile: {
    id: 'profile',
    label: 'Profile',
    route: '/(tabs)/profile',
    icon: User,
    iconColor: '#64748B',
    description: 'Account settings',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    route: '/(tabs)/more',
    icon: Settings,
    iconColor: '#64748B',
    description: 'App preferences',
  },
  more: {
    id: 'more',
    label: 'More',
    route: '/(tabs)/more',
    icon: MoreHorizontal,
    iconColor: '#64748B',
    description: 'Additional options',
  },
  alerts: {
    id: 'alerts',
    label: 'Alerts',
    route: '/(tabs)/alerts',
    icon: Bell,
    iconColor: '#F59E0B',
    description: 'Price alerts',
  },
  news: {
    id: 'news',
    label: 'News',
    route: '/(tabs)/news',
    icon: Newspaper,
    iconColor: '#3B82F6',
    description: 'Market news',
  },
  leaderboard: {
    id: 'leaderboard',
    label: 'Leaderboard',
    route: '/(tabs)/leaderboard',
    icon: Trophy,
    iconColor: '#F59E0B',
    description: 'Top traders',
  },
  bots: {
    id: 'bots',
    label: 'Bot Store',
    route: '/(tabs)/bot-marketplace',
    icon: Bot,
    iconColor: '#8B5CF6',
    description: 'Trading bots',
  },
  screener: {
    id: 'screener',
    label: 'Screener',
    route: '/(tabs)/screener',
    icon: Search,
    iconColor: '#3B82F6',
    description: 'Stock screener',
  },
  tax: {
    id: 'tax',
    label: 'Tax Reports',
    route: '/(tabs)/tax-reports',
    icon: Receipt,
    iconColor: '#10B981',
    description: 'Tax documents',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    route: '/(tabs)/analytics',
    icon: BarChart3,
    iconColor: '#06B6D4',
    description: 'Portfolio analytics',
  },
};

export const DEFAULT_DOCK_ITEMS: DockItemId[] = ['home', 'portfolio', 'ai', 'more'];

export const MAX_DOCK_ITEMS = 5;
export const MIN_DOCK_ITEMS = 4;

export function getNavItem(id: DockItemId): NavItem | undefined {
  return NAV_ITEMS[id];
}

export function isValidDockItem(id: string): id is DockItemId {
  return id in NAV_ITEMS;
}

export function getAllAvailableItems(): NavItem[] {
  return Object.values(NAV_ITEMS);
}

export function getAvailableItems(currentItems: DockItemId[]): NavItem[] {
  return Object.values(NAV_ITEMS).filter(item => !currentItems.includes(item.id));
}
