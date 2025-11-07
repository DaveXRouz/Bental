import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Wallet, TrendingUp, Bitcoin, DollarSign, PiggyBank, Zap } from 'lucide-react-native';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
  displayName?: string;
}

interface AccountSplitProps {
  accounts: Account[];
  totalValue: number;
}

const S = 8;

// Color and icon mapping by account type
const ACCOUNT_STYLES: Record<string, { color: string; icon: any }> = {
  primary_cash: { color: '#10B981', icon: Wallet },
  savings_cash: { color: '#059669', icon: PiggyBank },
  trading_cash: { color: '#10B981', icon: Wallet },
  equity_trading: { color: '#3B82F6', icon: TrendingUp },
  crypto_portfolio: { color: '#F59E0B', icon: Bitcoin },
  dividend_income: { color: '#8B5CF6', icon: DollarSign },
  retirement_fund: { color: '#EC4899', icon: PiggyBank },
  margin_trading: { color: '#EF4444', icon: Zap },
  // Legacy types
  demo_cash: { color: '#10B981', icon: Wallet },
  demo_equity: { color: '#3B82F6', icon: TrendingUp },
  demo_crypto: { color: '#F59E0B', icon: Bitcoin },
  live_cash: { color: '#10B981', icon: Wallet },
  live_equity: { color: '#3B82F6', icon: TrendingUp },
};

// Get shortened display name based on account type and name
const getDisplayName = (account: Account): string => {
  // First priority: use database display_name if set
  if (account.displayName) return account.displayName;

  // Second priority: use predefined short names based on account type
  const typeToName: Record<string, string> = {
    primary_cash: 'Cash',
    savings_cash: 'Savings',
    trading_cash: 'Trading',
    equity_trading: 'Stocks',
    crypto_portfolio: 'Crypto',
    dividend_income: 'Dividends',
    retirement_fund: 'Retirement',
    margin_trading: 'Margin',
  };

  // Third priority: truncate account name if too long
  if (typeToName[account.account_type]) {
    return typeToName[account.account_type];
  }

  // Fallback: shorten name to max 15 characters
  return account.name.length > 15
    ? account.name.substring(0, 12) + '...'
    : account.name;
};

export const AccountSplit = React.memo(({ accounts, totalValue }: AccountSplitProps) => {
  // Sort accounts by balance (highest to lowest)
  const sortedAccounts = useMemo(() => {
    return [...accounts]
      .filter(acc => acc.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [accounts]);

  // Calculate percentages
  const accountsWithPercent = useMemo(() => {
    return sortedAccounts.map(account => ({
      ...account,
      percent: totalValue > 0 ? (account.balance / totalValue) * 100 : 0,
    }));
  }, [sortedAccounts, totalValue]);

  if (sortedAccounts.length === 0) {
    return (
      <BlurView intensity={15} tint="dark" style={styles.container}>
        <Text style={styles.title}>Account Split</Text>
        <Text style={styles.emptyText}>No active accounts</Text>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <Text style={styles.title}>Account Split</Text>

      {accountsWithPercent.map((account, index) => {
        const style = ACCOUNT_STYLES[account.account_type] || ACCOUNT_STYLES.primary_cash;
        const Icon = style.icon;
        const displayName = getDisplayName(account);

        return (
          <Animated.View
            key={account.id}
            entering={FadeIn.duration(400).delay(index * 100)}
          >
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <View style={[styles.iconContainer, { backgroundColor: `${style.color}20` }]}>
                  <Icon size={14} color={style.color} strokeWidth={2} />
                </View>
                <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
                  {displayName}
                </Text>
              </View>
              <CurrencyDisplay
                value={account.balance}
                size="small"
                compact={account.balance >= 100000}
                style={styles.amount}
              />
              <Text style={styles.percent}>{account.percent.toFixed(1)}%</Text>
            </View>

            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${account.percent}%`,
                    backgroundColor: style.color,
                  },
                ]}
                entering={FadeIn.duration(600).delay(index * 100 + 200)}
              />
            </View>
          </Animated.View>
        );
      })}
    </BlurView>
  );
});

AccountSplit.displayName = 'AccountSplit';

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    marginBottom: S * 3,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.white,
    marginBottom: S * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S,
    flex: 1,
    minWidth: 0,
  },
  iconContainer: {
    width: S * 3,
    height: S * 3,
    borderRadius: S * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  amount: {
    color: colors.white,
    marginRight: S * 2,
  },
  percent: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: S * 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: S * 2,
  },
});
