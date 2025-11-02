import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors, Spacing, Typography } from '@/constants/theme';
import { formatCompactCurrency, safePercentage } from '@/utils/formatting';
import PerformanceLineChart from '@/components/charts/PerformanceLineChart';

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

interface DataPoint {
  date: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  currentValue: number;
  onTimeRangeChange?: (range: TimeRange) => void;
}

const generateSampleData = (days: number, baseValue: number): DataPoint[] => {
  const data: DataPoint[] = [];
  const today = new Date();
  let currentValue = baseValue * 0.95;

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const volatility = (Math.random() - 0.48) * (baseValue * 0.02);
    currentValue += volatility;
    data.push({
      date: date.toISOString(),
      value: Math.max(currentValue, baseValue * 0.8),
    });
  }

  return data;
};

export function PerformanceChart({ data, currentValue, onTimeRangeChange }: Props) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [chartData, setChartData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (data.length === 0 && currentValue > 0) {
      setChartData(generateSampleData(30, currentValue));
    } else {
      setChartData(data);
    }
  }, [data, currentValue]);

  const handleRangeChange = (range: string) => {
    const timeRange = range as TimeRange;
    setSelectedRange(timeRange);
    if (data.length === 0 && currentValue > 0) {
      const daysMap: Record<TimeRange, number> = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '1Y': 365,
        'ALL': 730,
      };
      setChartData(generateSampleData(daysMap[timeRange], currentValue));
    }
    onTimeRangeChange?.(timeRange);
  };

  if (chartData.length === 0) {
    return null;
  }

  const firstValue = chartData[0]?.value || 0;
  const lastValue = chartData[chartData.length - 1]?.value || currentValue;
  const change = lastValue - firstValue;
  const changePercent = firstValue > 0 ? ((change / firstValue) * 100) : 0;
  const isPositive = change >= 0;

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance</Text>
          <View style={styles.changeContainer}>
            {isPositive ? (
              <TrendingUp size={18} color="#10B981" />
            ) : (
              <TrendingDown size={18} color="#EF4444" />
            )}
            <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
              {isPositive ? '+' : ''}{formatCompactCurrency(change)} ({isPositive ? '+' : ''}{safePercentage(changePercent)}%)
            </Text>
          </View>
        </View>

        <PerformanceLineChart
          data={chartData}
          onPeriodChange={handleRangeChange}
        />
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeText: {
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
});
