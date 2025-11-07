import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

interface AccountSplitProps {
  cashBalance: number;
  investmentBalance: number;
  totalValue: number;
}

const S = 8;

export const AccountSplit = React.memo(({ cashBalance, investmentBalance, totalValue }: AccountSplitProps) => {
  const cashPercent = useMemo(() => {
    if (totalValue === 0) return 0;
    return (cashBalance / totalValue) * 100;
  }, [cashBalance, totalValue]);

  const investmentPercent = useMemo(() => {
    if (totalValue === 0) return 0;
    return (investmentBalance / totalValue) * 100;
  }, [investmentBalance, totalValue]);

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <Text style={styles.title}>Account Split</Text>

      <View style={styles.row}>
        <View style={styles.labelRow}>
          <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.label}>Cash</Text>
        </View>
        <CurrencyDisplay
          value={cashBalance}
          size="small"
          compact={cashBalance >= 100000}
          style={styles.amount}
        />
        <Text style={styles.percent}>{cashPercent.toFixed(1)}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${cashPercent}%`, backgroundColor: '#10B981' }]} />
      </View>

      <View style={styles.row}>
        <View style={styles.labelRow}>
          <View style={[styles.colorDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.label}>Investments</Text>
        </View>
        <CurrencyDisplay
          value={investmentBalance}
          size="small"
          compact={investmentBalance >= 100000}
          style={styles.amount}
        />
        <Text style={styles.percent}>{investmentPercent.toFixed(1)}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${investmentPercent}%`, backgroundColor: '#3B82F6' }]} />
      </View>
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
  },
  colorDot: {
    width: S * 1.5,
    height: S * 1.5,
    borderRadius: S * 0.75,
  },
  label: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
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
});
