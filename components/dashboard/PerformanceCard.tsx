import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { CurrencyDisplay, PercentageDisplay } from '@/components/ui';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 72;

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

interface PerformanceCardProps {
  data: Array<{ date: string; value: number }>;
  currentValue: number;
  onTimeRangeChange?: (range: TimeRange) => void;
  loading?: boolean;
}

const S = 8;

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export const PerformanceCard = React.memo(({
  data,
  currentValue,
  onTimeRangeChange,
  loading = false,
}: PerformanceCardProps) => {
  const [activeRange, setActiveRange] = useState<TimeRange>('1M');
  const [isChangingRange, setIsChangingRange] = useState(false);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setIsChangingRange(true);
    setActiveRange(range);
    onTimeRangeChange?.(range);
    setTimeout(() => setIsChangingRange(false), 100);
  }, [onTimeRangeChange]);

  const chartData = useMemo(() => {
    return data.map(d => d.value);
  }, [data]);

  const minValue = useMemo(() => Math.min(...data.map(d => d.value)) * 0.98, [data]);
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)) * 1.02, [data]);

  const lastValue = useMemo(() => {
    if (data.length === 0) return currentValue || 0;
    return data[data.length - 1].value;
  }, [data, currentValue]);

  const change = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0].value;
    const last = data[data.length - 1].value;
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  }, [data]);

  const changeAmount = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0].value;
    const last = data[data.length - 1].value;
    return last - first;
  }, [data]);

  const isPositive = change >= 0;

  if (loading) {
    return (
      <BlurView intensity={15} tint="dark" style={styles.container}>
        <Text style={styles.title}>Performance</Text>
        <GlassSkeleton width="100%" height={200} style={{ marginTop: S * 2 }} />
      </BlurView>
    );
  }

  if (data.length === 0) {
    return (
      <BlurView intensity={15} tint="dark" style={styles.container}>
        <Text style={styles.title}>Performance</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No performance data yet</Text>
          <Text style={styles.emptySubtext}>Add funds to your portfolio to track performance</Text>
        </View>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance</Text>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.valueLabel}>Current</Text>
        <CurrencyDisplay
          value={lastValue}
          size="large"
          style={styles.value}
        />
        <View style={styles.changeRow}>
          <PercentageDisplay
            value={change}
            colorize
            style={styles.change}
          />
          <Text style={[styles.changeAmount, isPositive ? styles.changePositive : styles.changeNegative]}>
            {' '}(
          </Text>
          <CurrencyDisplay
            value={changeAmount}
            showSign
            color={isPositive ? colors.success : colors.danger}
            style={styles.changeAmount}
          />
          <Text style={[styles.changeAmount, isPositive ? styles.changePositive : styles.changeNegative]}>
            )
          </Text>
        </View>
      </View>

      <View style={styles.timeRangeRow}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.rangeButton, activeRange === range && styles.rangeButtonActive]}
            onPress={() => handleRangeChange(range)}
            accessibilityLabel={`Select ${range} time range`}
            accessibilityRole="button"
            accessibilityState={{ selected: activeRange === range }}
          >
            <Text style={[styles.rangeText, activeRange === range && styles.rangeTextActive]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chartContainer}>
        <Sparkline
          data={chartData}
          width={CHART_WIDTH}
          height={180}
          color={isPositive ? '#10B981' : '#EF4444'}
          fillColor={isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
        />
      </View>
    </BlurView>
  );
});

PerformanceCard.displayName = 'PerformanceCard';

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    marginBottom: S * 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S * 2,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  valueContainer: {
    marginBottom: S * 2,
  },
  valueLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: S * 0.5,
  },
  value: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.white,
    marginBottom: S * 0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  change: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  changeAmount: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  changePositive: {
    color: '#10B981',
  },
  changeNegative: {
    color: '#EF4444',
  },
  timeRangeRow: {
    flexDirection: 'row',
    gap: S,
    marginBottom: S * 2,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: S,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  rangeButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  rangeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.textMuted,
  },
  rangeTextActive: {
    color: colors.white,
    fontWeight: typography.weight.semibold,
  },
  chartContainer: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: S * 6,
  },
  emptyText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginBottom: S,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
