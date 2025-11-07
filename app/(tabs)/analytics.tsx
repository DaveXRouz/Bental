import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Download, Calendar, PieChart, BarChart3, Activity } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency } from '@/utils/formatting';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/ui/ToastManager';
import { usePortfolioAnalytics, useAssetAllocation, usePerformanceChart } from '@/hooks/usePortfolioAnalytics';
import PerformanceLineChart from '@/components/charts/PerformanceLineChart';
import AllocationDonutChart from '@/components/charts/AllocationDonutChart';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';

export default function AnalyticsScreen() {
  const toast = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const { loading, summary, error, refresh, exportReport } = usePortfolioAnalytics();
  const { allocations, loading: allocationsLoading } = useAssetAllocation();
  const { chartData, loading: chartLoading } = usePerformanceChart(selectedPeriod);

  const handleExport = async () => {
    console.clear();
    try {
      const csv = await exportReport('csv');
      await Share.share({
        message: csv,
        title: 'Portfolio Analytics Report',
      });
      toast.showSuccess('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.showError('Failed to export report');
    }
  };

  const handlePeriodChange = (period: TimePeriod) => {
    console.clear();
    setSelectedPeriod(period);
  };

  if (loading) {
    console.clear();
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <View style={styles.content}>
          <GlassSkeleton width="100%" height={120} style={{ marginBottom: 16 }} />
          <GlassSkeleton width="100%" height={300} style={{ marginBottom: 16 }} />
          <GlassSkeleton width="100%" height={200} />
        </View>
      </View>
    );
  }

  if (error) {
    console.clear();
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <ErrorState type="server" message={error} onRetry={refresh} />
      </View>
    );
  }

  console.clear();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport} activeOpacity={0.7}>
          <BlurView intensity={60} tint="dark" style={styles.exportButtonInner}>
            <Download size={16} color={colors.text} />
          </BlurView>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PerformanceSummaryCard summary={summary} />

        <View style={styles.sectionHeader}>
          <Activity size={20} color={colors.text} />
          <Text style={styles.sectionTitle}>Performance</Text>
        </View>

        <PeriodSelector selectedPeriod={selectedPeriod} onSelect={handlePeriodChange} />

        {chartLoading ? (
          <GlassSkeleton width="100%" height={300} style={{ marginBottom: 16 }} />
        ) : (
          <PerformanceChart data={chartData} period={selectedPeriod} />
        )}

        <View style={styles.sectionHeader}>
          <PieChart size={20} color={colors.text} />
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
        </View>

        {allocationsLoading ? (
          <GlassSkeleton width="100%" height={280} style={{ marginBottom: 16 }} />
        ) : (
          <AllocationChart allocations={allocations} />
        )}

        <MetricsGrid summary={summary} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function PerformanceSummaryCard({ summary }: { summary: any }) {
  if (!summary) return null;

  const isPositive = summary.total_return >= 0;

  return (
    <BlurView intensity={40} tint="dark" style={styles.summaryCard}>
      <LinearGradient
        colors={
          isPositive
            ? ['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.02)']
            : ['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.02)']
        }
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.summaryContent}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryLabel}>Portfolio Value</Text>
          <View style={styles.changeIndicator}>
            {isPositive ? (
              <TrendingUp size={16} color="#10B981" />
            ) : (
              <TrendingDown size={16} color="#EF4444" />
            )}
          </View>
        </View>
        <Text style={styles.summaryValue}>{formatCurrency(summary.current_value)}</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryReturn, isPositive ? styles.positive : styles.negative]}>
            {isPositive ? '+' : ''}
            {formatCurrency(summary.total_return)}
          </Text>
          <Text style={[styles.summaryPercent, isPositive ? styles.positive : styles.negative]}>
            ({isPositive ? '+' : ''}
            {summary.total_return_percent.toFixed(2)}%)
          </Text>
        </View>
      </View>
    </BlurView>
  );
}

function PeriodSelector({
  selectedPeriod,
  onSelect,
}: {
  selectedPeriod: TimePeriod;
  onSelect: (period: TimePeriod) => void;
}) {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'week', label: '1W' },
    { value: 'month', label: '1M' },
    { value: 'quarter', label: '3M' },
    { value: 'year', label: '1Y' },
    { value: 'all', label: 'All' },
  ];

  return (
    <View style={styles.periodSelector}>
      {periods.map(period => (
        <TouchableOpacity
          key={period.value}
          style={[styles.periodButton, selectedPeriod === period.value && styles.periodButtonActive]}
          onPress={() => onSelect(period.value)}
          activeOpacity={0.7}
        >
          <BlurView intensity={selectedPeriod === period.value ? 80 : 40} tint="dark" style={styles.periodButtonInner}>
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.value && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </BlurView>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PerformanceChart({ data, period }: { data: any[]; period: TimePeriod }) {
  if (data.length === 0) {
    return (
      <BlurView intensity={40} tint="dark" style={styles.emptyChart}>
        <BarChart3 size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>No Data Available</Text>
        <Text style={styles.emptySubtext}>Performance data will appear here</Text>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={40} tint="dark" style={styles.chartCard}>
      <PerformanceLineChart data={data} />
    </BlurView>
  );
}

function AllocationChart({ allocations }: { allocations: any[] }) {
  if (allocations.length === 0) {
    return (
      <BlurView intensity={40} tint="dark" style={styles.emptyChart}>
        <PieChart size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>No Allocations</Text>
        <Text style={styles.emptySubtext}>Asset allocation will appear here</Text>
      </BlurView>
    );
  }

  const totalValue = allocations.reduce((sum, a) => sum + a.value, 0);
  const chartData = allocations.map((a, index) => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    return {
      label: a.category,
      value: a.value,
      color: colors[index % colors.length],
    };
  });

  return (
    <View style={styles.allocationContainer}>
      <BlurView intensity={40} tint="dark" style={styles.chartCard}>
        <AllocationDonutChart data={chartData} totalValue={totalValue} size={200} />
      </BlurView>

      <View style={styles.allocationList}>
        {allocations.map((allocation, index) => (
          <AllocationItem key={allocation.id} allocation={allocation} index={index} />
        ))}
      </View>
    </View>
  );
}

function AllocationItem({ allocation, index }: { allocation: any; index: number }) {
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const color = colors[index % colors.length];
  const isPositiveGain = allocation.unrealized_gain >= 0;

  return (
    <BlurView intensity={30} tint="dark" style={styles.allocationItem}>
      <View style={styles.allocationRow}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <View style={styles.allocationInfo}>
          <Text style={styles.allocationSymbol}>{allocation.category}</Text>
          <Text style={styles.allocationPercent}>{allocation.percentage.toFixed(1)}%</Text>
        </View>
        <View style={styles.allocationValues}>
          <Text style={styles.allocationValue}>{formatCurrency(allocation.value)}</Text>
          <Text style={[styles.allocationGain, isPositiveGain ? styles.positive : styles.negative]}>
            {isPositiveGain ? '+' : ''}
            {formatCurrency(allocation.unrealized_gain)}
          </Text>
        </View>
      </View>
    </BlurView>
  );
}

function MetricsGrid({ summary }: { summary: any }) {
  if (!summary) return null;

  const metrics = [
    { label: 'Day Change', value: summary.day_change, percent: summary.day_change_percent },
    { label: 'Week Return', value: summary.week_return, percent: summary.week_return_percent },
    { label: 'Month Return', value: summary.month_return, percent: summary.month_return_percent },
    { label: 'Year Return', value: summary.year_return, percent: summary.year_return_percent },
  ];

  return (
    <View style={styles.metricsGrid}>
      <View style={styles.sectionHeader}>
        <Calendar size={20} color={colors.text} />
        <Text style={styles.sectionTitle}>Period Returns</Text>
      </View>
      <View style={styles.metricsRow}>
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </View>
    </View>
  );
}

function MetricCard({ metric }: { metric: any }) {
  const isPositive = metric.value >= 0;

  return (
    <BlurView intensity={40} tint="dark" style={styles.metricCard}>
      <LinearGradient
        colors={
          isPositive
            ? ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.02)']
            : ['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.02)']
        }
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.metricLabel}>{metric.label}</Text>
      <Text style={[styles.metricValue, isPositive ? styles.positive : styles.negative]}>
        {isPositive ? '+' : ''}
        {formatCurrency(metric.value)}
      </Text>
      <Text style={[styles.metricPercent, isPositive ? styles.positive : styles.negative]}>
        {isPositive ? '+' : ''}
        {metric.percent.toFixed(2)}%
      </Text>
    </BlurView>
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
  summaryCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: spacing.lg + 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  summaryContent: {
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  changeIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: isTablet ? 36 : 32,
    fontWeight: '700',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryReturn: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryPercent: {
    fontSize: 16,
    fontWeight: '500',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  periodButtonInner: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  periodButtonActive: {},
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: spacing.lg,
    marginBottom: 24,
    overflow: 'hidden',
  },
  emptyChart: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: isTablet ? 48 : 32,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
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
  allocationContainer: {
    marginBottom: 24,
  },
  allocationList: {
    gap: 8,
    marginTop: 16,
  },
  allocationItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  allocationInfo: {
    flex: 1,
    gap: 4,
  },
  allocationSymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  allocationPercent: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  allocationValues: {
    alignItems: 'flex-end',
    gap: 4,
  },
  allocationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  allocationGain: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsGrid: {
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: isTablet ? '48%' : '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: spacing.lg,
    gap: 8,
    overflow: 'hidden',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricPercent: {
    fontSize: 14,
    fontWeight: '500',
  },
});
