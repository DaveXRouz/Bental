import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

interface AllocationItem {
  label: string;
  value: number;
  percent: number;
  color: string;
  type: 'equities' | 'crypto' | 'bonds' | 'cash';
}

interface AllocationDonutProps {
  allocations: AllocationItem[];
  totalValue: number;
}

const S = 8;

const ALLOCATION_COLORS = {
  equities: '#3B82F6',
  crypto: '#8B5CF6',
  bonds: '#10B981',
  cash: '#9CA3AF',
};

export const AllocationDonut = React.memo(({ allocations, totalValue }: AllocationDonutProps) => {
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  const handleLegendTap = useCallback((type: string) => {
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

  const chartSegments = useMemo(() => {
    const total = visibleAllocations.reduce((sum, a) => sum + a.value, 0);
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
      };
      currentAngle += angle;
      return segment;
    });
  }, [visibleAllocations]);

  const formatAmount = (amount: number) => {
    if (amount >= 100000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const size = 220;
  const chartRadius = size / 2 - 20;
  const innerRadius = 70;
  const circumference = 2 * Math.PI * chartRadius;

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <Text style={styles.title}>Asset Allocation</Text>

      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G>
            {chartSegments.map((segment, index) => {
              const strokeDasharray = `${(segment.angle / 360) * circumference} ${circumference}`;
              const strokeDashoffset = -((segment.startAngle + 90) / 360) * circumference;

              return (
                <Circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
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
          <Text style={styles.centerValue}>{formatAmount(totalValue)}</Text>
          <Text style={styles.centerText}>Total</Text>
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
              accessibilityLabel={`${item.label} allocation ${item.percent.toFixed(1)} percent, tap to ${isHidden ? 'show' : 'hide'}`}
              accessibilityRole="button"
            >
              <View style={styles.legendLeft}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
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

AllocationDonut.displayName = 'AllocationDonut';

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
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.white,
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
    minHeight: 44,
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
  },
  legendLabel: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  legendLabelHidden: {
    textDecorationLine: 'line-through',
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
});
