import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Sparkline } from '@/components/ui/Sparkline';
import { CurrencyDisplay, PercentageDisplay } from '@/components/ui';
import { colors, radius, spacing, typography, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

interface BalanceHeroProps {
  totalValue: number;
  todayChange: number;
  todayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  sparklineData?: number[];
}

const S = 8;

export const BalanceHero = React.memo(({
  totalValue,
  todayChange,
  todayChangePercent,
  totalReturn,
  totalReturnPercent,
  sparklineData = [],
}: BalanceHeroProps) => {
  const todayPositive = todayChange >= 0;
  const totalPositive = totalReturn >= 0;

  return (
    <BlurView intensity={20} tint="dark" style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.label} accessibilityLabel="Total portfolio value label">
            Total Portfolio Value
          </Text>
          <CurrencyDisplay
            value={totalValue}
            size="hero"
            compact={totalValue >= 100000}
            style={styles.value}
            accessibilityLabel={`Portfolio value`}
            accessibilityRole="text"
          />

          <View style={styles.pillsRow}>
            <View
              style={[styles.pill, todayPositive ? styles.pillPositive : styles.pillNegative]}
              accessible={true}
              accessibilityLabel={`Today's change ${todayChangePercent >= 0 ? 'up' : 'down'} ${Math.abs(todayChangePercent).toFixed(2)} percent`}
            >
              {todayPositive ? (
                <TrendingUp size={14} color="#FFFFFF" />
              ) : (
                <TrendingDown size={14} color="#FFFFFF" />
              )}
              <PercentageDisplay
                value={todayChangePercent}
                size="small"
                style={styles.pillText}
                suffix=" Today"
              />
            </View>

            <View
              style={[styles.pill, totalPositive ? styles.pillPositive : styles.pillNegative]}
              accessible={true}
              accessibilityLabel={`Total return ${totalReturnPercent >= 0 ? 'up' : 'down'} ${Math.abs(totalReturnPercent).toFixed(2)} percent`}
            >
              {totalPositive ? (
                <TrendingUp size={14} color="#FFFFFF" />
              ) : (
                <TrendingDown size={14} color="#FFFFFF" />
              )}
              <PercentageDisplay
                value={totalReturnPercent}
                size="small"
                style={styles.pillText}
                suffix=" Total"
              />
            </View>
          </View>

          {sparklineData.length > 0 && (
            <View style={styles.sparklineContainer}>
              <Sparkline
                data={sparklineData}
                width={200}
                height={32}
                color={totalPositive ? '#10B981' : '#EF4444'}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </BlurView>
  );
});

BalanceHero.displayName = 'BalanceHero';

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    marginBottom: S * 2.5,
    ...shadows.glass,
  },
  gradient: {
    padding: spacing.xl,
  },
  content: {
    gap: S * 2,
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  value: {
    fontSize: 40,
    fontWeight: typography.weight.bold,
    color: colors.white,
    letterSpacing: -1,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: S * 1.5,
    marginTop: S,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 0.75,
    paddingHorizontal: S * 1.5,
    paddingVertical: S,
    borderRadius: radius.md,
    minHeight: 44,
  },
  pillPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  pillNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  pillText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  sparklineContainer: {
    alignItems: 'center',
    marginTop: S,
  },
});
