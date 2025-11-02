import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Share, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Download, Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency, formatDate } from '@/utils/formatting';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/contexts/ToastContext';

type TransactionType = 'all' | 'trades' | 'deposits' | 'withdrawals' | 'transfers';

interface Transaction {
  id: string;
  type: 'trade' | 'deposit' | 'withdrawal' | 'transfer';
  date: string;
  symbol?: string;
  amount: number;
  quantity?: number;
  status: string;
  description: string;
}

export default function TransactionHistoryScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<TransactionType>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);

    try {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id);

      if (!accounts || accounts.length === 0) {
        setTransactions([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const accountIds = accounts.map(a => a.id);
      const allTransactions: Transaction[] = [];

      if (filterType === 'all' || filterType === 'trades') {
        const { data: trades } = await supabase
          .from('trades')
          .select('*')
          .in('account_id', accountIds)
          .order('executed_at', { ascending: false })
          .limit(100);

        if (trades) {
          trades.forEach(trade => {
            allTransactions.push({
              id: trade.id,
              type: 'trade',
              date: trade.executed_at || trade.created_at,
              symbol: trade.symbol,
              amount: Number(trade.filled_quantity) * Number(trade.filled_price),
              quantity: Number(trade.filled_quantity),
              status: trade.status,
              description: `${trade.side === 'buy' ? 'Bought' : 'Sold'} ${trade.symbol}`,
            });
          });
        }
      }

      if (filterType === 'all' || filterType === 'deposits') {
        try {
          const { data: deposits, error: depositsError } = await supabase
            .from('deposits')
            .select('*')
            .in('account_id', accountIds)
            .order('created_at', { ascending: false })
            .limit(100);

          if (!depositsError && deposits) {
            deposits.forEach(deposit => {
              allTransactions.push({
                id: deposit.id,
                type: 'deposit',
                date: deposit.created_at,
                amount: Number(deposit.amount),
                status: deposit.status,
                description: 'Deposit',
              });
            });
          }
        } catch (err) {
          console.log('Deposits table not available');
        }
      }

      if (filterType === 'all' || filterType === 'withdrawals') {
        try {
          const { data: withdrawals, error: withdrawalsError } = await supabase
            .from('withdrawals')
            .select('*')
            .in('account_id', accountIds)
            .order('created_at', { ascending: false })
            .limit(100);

          if (!withdrawalsError && withdrawals) {
            withdrawals.forEach(withdrawal => {
              allTransactions.push({
                id: withdrawal.id,
                type: 'withdrawal',
                date: withdrawal.created_at,
                amount: Number(withdrawal.amount),
                status: withdrawal.status,
                description: 'Withdrawal',
              });
            });
          }
        } catch (err) {
          console.log('Withdrawals table not available');
        }
      }

      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, filterType]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExportCSV = async () => {
    try {
      let csv = 'Date,Type,Symbol,Amount,Quantity,Status\n';

      transactions.forEach(txn => {
        const date = formatDate(txn.date);
        const symbol = txn.symbol || '';
        const amount = txn.amount.toFixed(2);
        const quantity = txn.quantity?.toString() || '';
        const status = txn.status;

        csv += `${date},${txn.type},${symbol},${amount},${quantity},${status}\n`;
      });

      await Share.share({
        message: csv,
        title: 'Transaction History',
      });

      toast.success('Transaction history exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header} accessible={true} accessibilityLabel="Transaction history page header">
          <Text style={styles.headerTitle}>Transaction History</Text>
        </View>
        <View style={styles.content}>
          {[1, 2, 3, 4, 5].map(i => (
            <GlassSkeleton key={i} width="100%" height={80} style={{ marginBottom: 12 }} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header} accessible={true} accessibilityLabel="Transaction history page header">
          <Text style={styles.headerTitle}>Transaction History</Text>
        </View>
        <ErrorState
          type="server"
          message={error}
          onRetry={fetchTransactions}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header} accessible={true} accessibilityLabel="Transaction history page header">
        <Text style={styles.headerTitle}>Transaction History</Text>
        {transactions.length > 0 && (
          <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV} activeOpacity={0.7}>
            <BlurView intensity={60} tint="dark" style={styles.exportButtonInner}>
              <Download size={16} color={colors.text} />
            </BlurView>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Transaction history main content"
      >
        <View style={styles.filterContainer}>
          {(['all', 'trades', 'deposits', 'withdrawals'] as TransactionType[]).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type)}
              activeOpacity={0.7}
            >
              <BlurView intensity={filterType === type ? 80 : 40} tint="dark" style={styles.filterChipInner}>
                <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>

        {transactions.length === 0 ? (
          <BlurView intensity={40} tint="dark" style={styles.emptyState}>
            <Calendar size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No Transactions</Text>
            <Text style={styles.emptySubtext}>
              Your transaction history will appear here
            </Text>
          </BlurView>
        ) : (
          <>
            <Text style={styles.countText}>{transactions.length} Transactions</Text>
            {transactions.map(txn => (
              <TransactionCard key={txn.id} transaction={txn} />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const isPositive = transaction.type === 'deposit' || (transaction.type === 'trade' && transaction.description.includes('Sold'));
  const isNegative = transaction.type === 'withdrawal' || (transaction.type === 'trade' && transaction.description.includes('Bought'));

  const getIcon = () => {
    if (isPositive) return <ArrowDownLeft size={20} color="#10B981" />;
    if (isNegative) return <ArrowUpRight size={20} color="#EF4444" />;
    return <RefreshCw size={20} color="#3B82F6" />;
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
      case 'filled':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
      case 'failed':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.7}>
      <BlurView intensity={40} tint="dark" style={styles.transactionCard}>
        <LinearGradient
          colors={
            isPositive
              ? ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.02)']
              : isNegative
              ? ['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.02)']
              : ['rgba(59,130,246,0.08)', 'rgba(59,130,246,0.02)']
          }
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.transactionContent}>
          <View style={styles.iconContainer}>{getIcon()}</View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
            <View style={styles.transactionMeta}>
              <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, isPositive && styles.amountPositive, isNegative && styles.amountNegative]}>
              {isPositive ? '+' : isNegative ? '-' : ''}
              {formatCurrency(Math.abs(transaction.amount))}
            </Text>
            {transaction.quantity && (
              <Text style={styles.quantity}>{transaction.quantity} shares</Text>
            )}
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 32 : 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '700',
    color: colors.text,
  },
  exportButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  exportButtonInner: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? 24 : 16,
    paddingBottom: 120,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: isTablet ? 8 : 6,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterChip: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  filterChipInner: {
    paddingVertical: isTablet ? 8 : 7,
    paddingHorizontal: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  filterChipActive: {},
  filterChipText: {
    fontSize: isTablet ? 13 : 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  countText: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  emptyState: {
    padding: isTablet ? 48 : 32,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
    gap: 12,
    marginTop: isTablet ? 40 : 24,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  transactionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? 16 : 12,
    gap: isTablet ? 12 : 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 6,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  amountPositive: {
    color: '#10B981',
  },
  amountNegative: {
    color: '#EF4444',
  },
  quantity: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
