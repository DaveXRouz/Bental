import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  ArrowRightLeft,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
} from 'lucide-react-native';
import { QuantumFieldBackground } from '@/components/backgrounds';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransfers } from '@/hooks/useTransfers';
import { colors, radius, spacing, shadows, Typography, zIndex } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency } from '@/utils/formatting';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { BottomInsetSpacer } from '@/components/ui/BottomInsetSpacer';
import TransferModal from '@/components/modals/TransferModal';
import UnifiedDepositModal from '@/components/modals/UnifiedDepositModal';
import UnifiedWithdrawModal from '@/components/modals/UnifiedWithdrawModal';
import CreateAccountModal from '@/components/modals/CreateAccountModal';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

export default function AccountsScreen() {
  const { user } = useAuth();
  const { accounts, loading, refetch } = useAccounts();
  const { transfers } = useTransfers();
  const [refreshing, setRefreshing] = useState(false);
  const [balancesHidden, setBalancesHidden] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [createAccountModalVisible, setCreateAccountModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.clear();
      setTransferModalVisible(false);
      setDepositModalVisible(false);
      setWithdrawModalVisible(false);
      setCreateAccountModalVisible(false);
    }, [])
  );

  const onRefresh = useCallback(async () => {
    console.clear();
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const toggleBalanceVisibility = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setBalancesHidden(!balancesHidden);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const activeAccounts = accounts.filter(acc => acc.is_active).length;

  const getAccountPerformance = (accountId: string) => {
    const accountTransfers = transfers.filter(
      t => t.from_account_id === accountId || t.to_account_id === accountId
    );

    const inflow = accountTransfers
      .filter(t => t.to_account_id === accountId)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const outflow = accountTransfers
      .filter(t => t.from_account_id === accountId)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { inflow, outflow, net: inflow - outflow };
  };

  const handleAccountAction = (accountId: string, action: 'deposit' | 'withdraw' | 'transfer') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSelectedAccountId(accountId);

    switch (action) {
      case 'deposit':
        setDepositModalVisible(true);
        break;
      case 'withdraw':
        setWithdrawModalVisible(true);
        break;
      case 'transfer':
        setTransferModalVisible(true);
        break;
    }
  };

  return (
    <View style={styles.container}>
      <QuantumFieldBackground />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Wallet size={28} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.greeting}>My Accounts</Text>
            <Text style={styles.headerTitle}>Account Manager</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.hideBalanceButton}
          onPress={toggleBalanceVisibility}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={balancesHidden ? 'Show balances' : 'Hide balances'}
        >
          <BlurView intensity={40} tint="dark" style={styles.hideBalanceBlur}>
            {balancesHidden ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </BlurView>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        {/* Summary Card */}
        <BlurView intensity={60} tint="dark" style={styles.summaryCard}>
          <LinearGradient
            colors={['rgba(59,130,246,0.08)', 'rgba(139,92,246,0.08)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Balance</Text>
              {balancesHidden ? (
                <Text style={styles.summaryValue}>••••••</Text>
              ) : (
                <CurrencyDisplay
                  value={totalBalance}
                  size="large"
                  compact={totalBalance >= 100000}
                  style={styles.summaryValue}
                />
              )}
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summarySubLabel}>Active Accounts</Text>
              <Text style={styles.summarySubValue}>{activeAccounts}</Text>
            </View>
          </View>
        </BlurView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setDepositModalVisible(true)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Deposit funds"
          >
            <BlurView intensity={50} tint="dark" style={styles.quickActionBlur}>
              <Download size={20} color="#10B981" />
              <Text style={styles.quickActionText}>Deposit</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setWithdrawModalVisible(true)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Withdraw funds"
          >
            <BlurView intensity={50} tint="dark" style={styles.quickActionBlur}>
              <Upload size={20} color="#EF4444" />
              <Text style={styles.quickActionText}>Withdraw</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setTransferModalVisible(true)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Transfer between accounts"
          >
            <BlurView intensity={50} tint="dark" style={styles.quickActionBlur}>
              <ArrowRightLeft size={20} color="#3B82F6" />
              <Text style={styles.quickActionText}>Transfer</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Accounts List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Accounts</Text>
            {accounts.length > 0 && (
              <TouchableOpacity
                style={styles.createAccountHeaderButton}
                onPress={() => setCreateAccountModalVisible(true)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Create new account"
              >
                <Plus size={18} color="#10B981" />
                <Text style={styles.createAccountHeaderText}>New</Text>
              </TouchableOpacity>
            )}
          </View>

          {accounts.map((account) => {
            const performance = getAccountPerformance(account.id);
            const isPositive = performance.net >= 0;

            return (
              <BlurView
                key={account.id}
                intensity={50}
                tint="dark"
                style={styles.accountCard}
              >
                <View style={styles.accountHeader}>
                  <View style={styles.accountHeaderLeft}>
                    <View style={styles.accountIconContainer}>
                      <Wallet size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.accountHeaderInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountType}>
                        {account.account_type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.accountHeaderRight}>
                    {balancesHidden ? (
                      <Text style={styles.accountBalance}>••••••</Text>
                    ) : (
                      <CurrencyDisplay
                        value={Number(account.balance)}
                        size="medium"
                        compact={Number(account.balance) >= 100000}
                        style={styles.accountBalance}
                      />
                    )}
                    {performance.net !== 0 && (
                      <View style={styles.performanceRow}>
                        {isPositive ? (
                          <TrendingUp size={12} color="#10B981" />
                        ) : (
                          <TrendingDown size={12} color="#EF4444" />
                        )}
                        {balancesHidden ? (
                          <Text style={[styles.performanceText, { color: isPositive ? '#10B981' : '#EF4444' }]}>
                            •••
                          </Text>
                        ) : (
                          <CurrencyDisplay
                            value={Math.abs(performance.net)}
                            size="small"
                            compact={Math.abs(performance.net) >= 100000}
                            style={[styles.performanceText, { color: isPositive ? '#10B981' : '#EF4444' }]}
                          />
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Account Stats */}
                <View style={styles.accountStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Inflow</Text>
                    {balancesHidden ? (
                      <Text style={styles.statValue}>•••</Text>
                    ) : (
                      <CurrencyDisplay
                        value={performance.inflow}
                        size="small"
                        compact={performance.inflow >= 100000}
                        style={styles.statValue}
                      />
                    )}
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Outflow</Text>
                    {balancesHidden ? (
                      <Text style={styles.statValue}>•••</Text>
                    ) : (
                      <CurrencyDisplay
                        value={performance.outflow}
                        size="small"
                        compact={performance.outflow >= 100000}
                        style={styles.statValue}
                      />
                    )}
                  </View>
                </View>

                {/* Account Actions */}
                <View style={styles.accountActions}>
                  <TouchableOpacity
                    style={styles.accountActionButton}
                    onPress={() => handleAccountAction(account.id, 'deposit')}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Deposit to ${account.name}`}
                  >
                    <Download size={16} color="#10B981" />
                    <Text style={styles.accountActionText}>Deposit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accountActionButton}
                    onPress={() => handleAccountAction(account.id, 'withdraw')}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Withdraw from ${account.name}`}
                  >
                    <Upload size={16} color="#EF4444" />
                    <Text style={styles.accountActionText}>Withdraw</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accountActionButton}
                    onPress={() => handleAccountAction(account.id, 'transfer')}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Transfer from ${account.name}`}
                  >
                    <ArrowRightLeft size={16} color="#3B82F6" />
                    <Text style={styles.accountActionText}>Transfer</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            );
          })}

          {accounts.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Wallet size={48} color={colors.textMuted} />
              <Text style={styles.emptyStateTitle}>No Accounts Yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first account to start managing your funds
              </Text>
              <TouchableOpacity
                style={styles.createAccountButton}
                activeOpacity={0.8}
                onPress={() => setCreateAccountModalVisible(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Create your first account"
              >
                <LinearGradient
                  colors={['#3B82F6', '#8B5CF6']}
                  style={styles.createAccountGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.createAccountText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <BottomInsetSpacer />
      </ScrollView>

      {/* Modals */}
      <TransferModal
        visible={transferModalVisible}
        onClose={() => {
          setTransferModalVisible(false);
          setSelectedAccountId(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />

      <UnifiedDepositModal
        visible={depositModalVisible}
        onClose={() => {
          setDepositModalVisible(false);
          setSelectedAccountId(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />

      <UnifiedWithdrawModal
        visible={withdrawModalVisible}
        onClose={() => {
          setWithdrawModalVisible(false);
          setSelectedAccountId(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />

      <CreateAccountModal
        visible={createAccountModalVisible}
        onClose={() => setCreateAccountModalVisible(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: isTablet ? spacing.xl : spacing.lg,
    zIndex: zIndex.content,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  headerIcon: {
    width: isTablet ? 56 : 48,
    height: isTablet ? 56 : 48,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: isTablet ? Typography.size.sm : 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: isTablet ? Typography.size.xxl : 22,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  hideBalanceButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  hideBalanceBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isTablet ? spacing.xl : spacing.lg,
  },
  summaryCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    marginBottom: spacing.lg,
    ...shadows.glass,
  },
  summaryContent: {
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    color: colors.text,
  },
  summarySubLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summarySubValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  quickActionBlur: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  createAccountHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  createAccountHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  accountCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.glass,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  accountHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  accountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountHeaderInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  accountHeaderRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    color: colors.text,
    marginBottom: 4,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performanceText: {
    fontWeight: '600',
  },
  accountStats: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: GLASS.border,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: GLASS.border,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
  },
  accountActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  accountActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  accountActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  createAccountButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.glass,
  },
  createAccountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  createAccountText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
