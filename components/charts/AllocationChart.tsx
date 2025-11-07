import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, breakpoints } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatSmartCurrency } from '@/utils/formatting';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface AllocationItem {
  label: string;
  value: number;
  percent: number;
  color: string;
  type: 'cash' | 'stocks' | 'crypto' | 'bonds';
}

interface AllocationChartProps {
  allocations: AllocationItem[];
  totalValue: number;
  showTitle?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const S = 8;

export const ALLOCATION_COLORS = {
  cash: '#9CA3AF',
  stocks: '#3B82F6',
  crypto: '#F59E0B',
  bonds: '#10B981',
};

const ALLOCATION_LABELS = {
  cash: 'Cash',
  stocks: 'Stocks',
  crypto: 'Crypto',
  bonds: 'Bonds',
};

export const AllocationChart = React.memo(({
  allocations,
  totalValue,
  showTitle = true,
  size = 'medium'
}: AllocationChartProps) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= breakpoints.tablet;
  const isMobile = width < breakpoints.tablet;
  const reducedMotion = useReducedMotion();

  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  const handleLegendTap = useCallback((type: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const visibleAllocations = useMemo(() => {
    return allocations.filter(a => !hiddenTypes.has(a.type));
  }, [allocations, hiddenTypes]);

  const visibleTotal = useMemo(() => {
    return visibleAllocations.reduce((sum, a) => sum + a.value, 0);
  }, [visibleAllocations]);

  const chartSegments = useMemo(() => {
    const total = visibleTotal;
    if (total === 0) return [];

    let currentAngle = -90;
    return visibleAllocations.map(item => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const segment = {
        percentage,
        startAngle: currentAngle,
        angle,
        color: item.color,
        label: item.label,
      };
      currentAngle += angle;
      return segment;
    });
  }, [visibleAllocations, visibleTotal]);

  const formatAmount = useCallback((amount: number) => {
    return formatSmartCurrency(amount);
  }, []);

  const chartSize = useMemo(() => {
    if (size === 'small') return isMobile ? 180 : 200;
    if (size === 'large') return isMobile ? 240 : 280;
    return isMobile ? 200 : 240;
  }, [size, isMobile]);

  const chartRadius = chartSize / 2 - 20;
  const innerRadius = chartSize * 0.32;
  const circumference = 2 * Math.PI * chartRadius;

  if (allocations.length === 0) {
    return (
      <BlurView intensity={15} tint="dark" style={styles.container}>
        {showTitle && <Text style={styles.title}>Asset Allocation</Text>}
        <View style={[styles.emptyState, { height: chartSize + 100 }]}>
          <Text style={styles.emptyText}>No assets yet</Text>
          <Text style={styles.emptySubtext}>Your allocation will appear here once you add holdings</Text>
        </View>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      {showTitle && <Text style={styles.title}>Asset Allocation</Text>}

      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize}>
          <G>
            {chartSegments.map((segment, index) => {
              const strokeDasharray = `${(segment.angle / 360) * circumference} ${circumference}`;
              const strokeDashoffset = -((segment.startAngle + 90) / 360) * circumference;

              return (
                <Circle
                  key={index}
                  cx={chartSize / 2}
                  cy={chartSize / 2}
                  r={chartRadius}
                  stroke={segment.color}
                  strokeWidth={chartRadius - innerRadius}
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={[styles.centerValue, { fontSize: isTablet ? 20 : 18 }]}>
            {formatAmount(visibleTotal)}
          </Text>
          <Text style={styles.centerText}>
            {hiddenTypes.size > 0 ? 'Visible' : 'Total'}
          </Text>
        </View>
      </View>

      <View style={styles.legendContainer}>
        {allocations.map((item) => {
          const isHidden = hiddenTypes.has(item.type);
          return (
            <TouchableOpacity
              key={item.type}
              style={[styles.legendRow, isHidden && styles.legendRowHidden]}
              onPress={() => handleLegendTap(item.type)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} allocation ${item.percent.toFixed(1)} percent, ${formatAmount(item.value)}, tap to ${isHidden ? 'show' : 'hide'}`}
              accessibilityState={{ selected: !isHidden }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.legendLeft}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: item.color },
                    isHidden && styles.colorDotHidden
                  ]}
                />
                <Text style={[styles.legendLabel, isHidden && styles.legendLabelHidden]}>
                  {item.label}
                </Text>
              </View>
              <Text style={[styles.legendAmount, isHidden && styles.legendAmountHidden]}>
                {formatAmount(item.value)}
              </Text>
              <Text style={[styles.legendPercent, isHidden && styles.legendPercentHidden]}>
                {item.percent.toFixed(1)}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
});

AllocationChart.displayName = 'AllocationChart';

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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S * 2,
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontWeight: typography.weight.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  centerText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: S * 0.5,
  },
  legendContainer: {
    gap: S * 1.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: S,
    paddingHorizontal: S * 0.5,
    minHeight: 44,
    borderRadius: radius.md,
  },
  legendRowHidden: {
    opacity: 0.4,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 1.5,
    flex: 1,
  },
  colorDot: {
    width: S * 1.5,
    height: S * 1.5,
    borderRadius: S * 0.75,
    borderWidth: 0,
  },
  colorDotHidden: {
    opacity: 0.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  legendLabel: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  legendLabelHidden: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  legendAmount: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
    marginRight: S * 2,
  },
  legendAmountHidden: {
    color: colors.textMuted,
  },
  legendPercent: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  legendPercentHidden: {
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: S,
  },
  emptyText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: S * 4,
  },
});
