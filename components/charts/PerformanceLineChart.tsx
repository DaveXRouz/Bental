import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatting';

interface DataPoint {
  date: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  onPeriodChange?: (period: string) => void;
}

type Period = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 200;
const PADDING = 20;

export default function PerformanceLineChart({ data, onPeriodChange }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1M');

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = PADDING + (index / (data.length - 1)) * (CHART_WIDTH - 2 * PADDING);
    const y =
      CHART_HEIGHT -
      PADDING -
      ((point.value - minValue) / valueRange) * (CHART_HEIGHT - 2 * PADDING);
    return { x, y };
  });

  const linePath = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  const underFillPath =
    linePath +
    ` L ${points[points.length - 1].x} ${CHART_HEIGHT - PADDING}` +
    ` L ${points[0].x} ${CHART_HEIGHT - PADDING}` +
    ' Z';

  const currentValue = values[values.length - 1];
  const previousValue = values[0];
  const change = currentValue - previousValue;
  const changePercent = ((change / previousValue) * 100).toFixed(2);
  const isPositive = change >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.value}>{formatCurrency(currentValue)}</Text>
          <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
            {isPositive ? '+' : ''}
            {formatCurrency(change)} ({isPositive ? '+' : ''}
            {changePercent}%)
          </Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <SvgGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0} />
            </SvgGradient>
          </Defs>

          <Path d={underFillPath} fill="url(#gradient)" />

          <Path
            d={linePath}
            stroke={isPositive ? '#10B981' : '#EF4444'}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <View style={styles.periodSelector}>
        {PERIODS.map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
            onPress={() => handlePeriodChange(period)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === period && styles.periodTextActive,
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    marginBottom: Spacing.lg,
  },
  value: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: Spacing.xs,
  },
  change: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  chartWrapper: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.2)',
  },
  periodText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  periodTextActive: {
    color: '#3B82F6',
  },
  emptyState: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: Typography.size.md,
    color: colors.textMuted,
  },
});
