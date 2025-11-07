import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  Coins,
  DollarSign
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, shadows, typography } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCompactCurrency } from '@/utils/formatting';

const S = 8;

interface Transaction {
  id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'trade' | 'fee' | 'dividend' | 'interest';
  status: string;
  amount: number;
  currency: string;
  symbol: string | null;
  quantity: number | null;
  price: number | null;
  description: string | null;
  created_at: string;
  completed_at: string | null;
  metadata: any;
}

interface RecentActivityProps {
  userId: string | undefined;
}

const TRANSACTION_CONFIG = {
  deposit: {
    icon: ArrowDownToLine,
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.2)',
    gradientColors: ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.04)'] as const,
    label: 'Deposit',
  },
  withdrawal: {
    icon: ArrowUpFromLine,
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.2)',
    gradientColors: ['rgba(245,158,11,0.08)', 'rgba(245,158,11,0.04)'] as const,
    label: 'Withdrawal',
  },
  transfer: {
    icon: ArrowRightLeft,
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.2)',
    gradientColors: ['rgba(59,130,246,0.08)', 'rgba(59,130,246,0.04)'] as const,
    label: 'Transfer',
  },
  trade: {
    icon: TrendingUp,
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.2)',
    gradientColors: ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.04)'] as const,
    label: 'Trade',
  },
  fee: {
    icon: DollarSign,
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.2)',
    gradientColors: ['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.04)'] as const,
    label: 'Fee',
  },
  dividend: {
    icon: Coins,
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.2)',
    gradientColors: ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.04)'] as const,
    label: 'Dividend',
  },
  interest: {
    icon: Coins,
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.2)',
    gradientColors: ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.04)'] as const,
    label: 'Interest',
  },
};

export function RecentActivity({ userId }: RecentActivityProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchRecentTransactions();
  }, [userId]);

  const fetchRecentTransactions = async () => {
    if (!userId) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['completed', 'executed'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[RecentActivity] Error:', error);
        setError('Failed to load recent activity');
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('[RecentActivity] Error:', error);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getTransactionDetails = (tx: Transaction) => {
    const config = TRANSACTION_CONFIG[tx.transaction_type] || TRANSACTION_CONFIG.trade;

    // For trades, check if buy or sell
    if (tx.transaction_type === 'trade' && tx.metadata?.trade_type) {
      const isSell = tx.metadata.trade_type === 'sell';
      return {
        ...config,
        icon: isSell ? TrendingDown : TrendingUp,
        color: isSell ? '#EF4444' : '#10B981',
        bgColor: isSell ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
        gradientColors: isSell
          ? (['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.04)'] as const)
          : (['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.04)'] as const),
      };
    }

    return config;
  };

  const getTransactionTitle = (tx: Transaction) => {
    if (tx.transaction_type === 'trade' && tx.symbol) {
      return tx.symbol;
    }
    if (tx.transaction_type === 'transfer') {
      const direction = tx.metadata?.direction || 'out';
      return direction === 'out' ? 'Transfer Out' : 'Transfer In';
    }
    return TRANSACTION_CONFIG[tx.transaction_type]?.label || tx.transaction_type;
  };

  const getTransactionSubtitle = (tx: Transaction) => {
    if (tx.description) {
      return tx.description;
    }

    if (tx.transaction_type === 'trade' && tx.quantity && tx.symbol) {
      const tradeType = tx.metadata?.trade_type?.toUpperCase() || 'TRADE';
      return `${tradeType} • ${tx.quantity} shares`;
    }

    if (tx.transaction_type === 'deposit') {
      const method = tx.metadata?.method || 'bank transfer';
      return `via ${method.replace('_', ' ')}`;
    }

    if (tx.transaction_type === 'withdrawal') {
      const method = tx.metadata?.method || 'bank transfer';
      return `via ${method.replace('_', ' ')}`;
    }

    return tx.status;
  };

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Clock size={18} color="#3B82F6" strokeWidth={2.5} />
            <Text style={styles.title}>Recent Activity</Text>
          </View>
        </View>
        <BlurView intensity={60} tint="dark" style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchRecentTransactions}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Retry loading recent activity"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  if (transactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock size={18} color="#3B82F6" strokeWidth={2.5} />
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        <TouchableOpacity
          style={styles.seeAllButton}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/history')}
          accessibilityRole="button"
          accessibilityLabel="See all transactions"
          accessibilityHint="Navigate to transaction history page"
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={14} color="#3B82F6" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.activities}>
        {transactions.map((tx) => {
          const config = getTransactionDetails(tx);
          const Icon = config.icon;
          const isPositive = tx.amount > 0;

          return (
            <TouchableOpacity
              key={tx.id}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Transaction: ${getTransactionTitle(tx)}, ${formatCompactCurrency(Math.abs(tx.amount))}`}
            >
              <BlurView intensity={60} tint="dark" style={styles.activityCard}>
                <LinearGradient
                  colors={config.gradientColors}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.activityContent}>
                  <View style={styles.activityLeft}>
                    <View style={[styles.activityIcon, { backgroundColor: config.bgColor }]}>
                      <Icon size={16} color={config.color} strokeWidth={2.5} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activitySymbol} numberOfLines={1}>
                        {getTransactionTitle(tx)}
                      </Text>
                      <Text style={styles.activityDetails} numberOfLines={1}>
                        {getTransactionSubtitle(tx)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.activityRight}>
                    <Text
                      style={[
                        styles.activityAmount,
                        isPositive ? styles.positiveAmount : styles.negativeAmount
                      ]}
                    >
                      {isPositive ? '+' : ''}{formatCompactCurrency(tx.amount)}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatTime(tx.created_at)}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: S * 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S * 1.5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 0.5,
    paddingVertical: S * 0.75,
    paddingHorizontal: S,
    minHeight: 44,
  },
  seeAllText: {
    fontSize: typography.size.sm,
    color: '#3B82F6',
    fontWeight: typography.weight.semibold,
  },
  activities: {
    gap: S * 1.25,
  },
  activityCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: S * 1.75,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: S * 1.5,
    minWidth: 0,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
  },
  activitySymbol: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  activityRight: {
    alignItems: 'flex-end',
    marginLeft: S,
  },
  activityAmount: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginBottom: 2,
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: colors.white,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
  },
  errorCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    padding: S * 3,
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    marginBottom: S * 2,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: S * 3,
    paddingVertical: S * 1.5,
    backgroundColor: '#3B82F6',
    borderRadius: radius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
});
