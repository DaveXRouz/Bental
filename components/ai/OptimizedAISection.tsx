import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Target,
  AlertCircle,
  Activity,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency, formatPercent } from '@/utils/formatting';

interface KPI {
  label: string;
  value: string;
  change?: number;
  icon: any;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  created_at: string;
}

interface Guardrail {
  id: string;
  rule_type: string;
  threshold: number;
  current_value: number;
  is_breached: boolean;
}

export const SummarySection = memo(({ bot, allocation }: any) => {
  if (!bot || !allocation) return null;

  return (
    <BlurView intensity={20} tint="dark" style={styles.card}>
      <View style={styles.cardHeader}>
        <Sparkles size={24} color="#A78BFA" />
        <Text style={styles.cardTitle}>AI Trading Summary</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Account Value</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(allocation.current_value || 0)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Return</Text>
          <Text
            style={[
              styles.summaryValue,
              allocation.total_return >= 0 ? styles.positive : styles.negative,
            ]}
          >
            {formatPercent(allocation.total_return || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.statusBadge}>
        <Activity size={16} color={bot.is_active ? '#10B981' : '#9CA3AF'} />
        <Text style={[styles.statusText, bot.is_active && styles.statusActive]}>
          {bot.is_active ? 'Active' : 'Paused'}
        </Text>
      </View>
    </BlurView>
  );
});

export const KPISection = memo(({ kpis }: { kpis: KPI[] }) => {
  if (!kpis || kpis.length === 0) return null;

  return (
    <BlurView intensity={20} tint="dark" style={styles.card}>
      <View style={styles.cardHeader}>
        <Target size={24} color="#60A5FA" />
        <Text style={styles.cardTitle}>Performance Metrics</Text>
      </View>

      <View style={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <View key={index} style={styles.kpiItem}>
            <View style={styles.kpiIcon}>
              <kpi.icon size={20} color="#60A5FA" />
            </View>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            {kpi.change !== undefined && (
              <Text
                style={[styles.kpiChange, kpi.change >= 0 ? styles.positive : styles.negative]}
              >
                {kpi.change >= 0 ? '+' : ''}
                {formatPercent(kpi.change)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </BlurView>
  );
});

export const GuardrailsSection = memo(({ guardrails }: { guardrails: Guardrail[] }) => {
  if (!guardrails || guardrails.length === 0) return null;

  return (
    <BlurView intensity={20} tint="dark" style={styles.card}>
      <View style={styles.cardHeader}>
        <Shield size={24} color="#34D399" />
        <Text style={styles.cardTitle}>Risk Guardrails</Text>
      </View>

      {guardrails.map((rail) => (
        <View key={rail.id} style={styles.guardrailItem}>
          <View style={styles.guardrailHeader}>
            <Text style={styles.guardrailLabel}>{rail.rule_type}</Text>
            <Text
              style={[
                styles.guardrailStatus,
                rail.is_breached ? styles.breached : styles.safe,
              ]}
            >
              {rail.is_breached ? 'Breached' : 'Safe'}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(rail.current_value / rail.threshold) * 100}%` },
                rail.is_breached && styles.progressBreached,
              ]}
            />
          </View>

          <View style={styles.guardrailValues}>
            <Text style={styles.guardrailText}>
              Current: {formatPercent(rail.current_value)}
            </Text>
            <Text style={styles.guardrailText}>Limit: {formatPercent(rail.threshold)}</Text>
          </View>
        </View>
      ))}
    </BlurView>
  );
});

export const ActivitySection = memo(({ trades }: { trades: Trade[] }) => {
  if (!trades || trades.length === 0) return null;

  return (
    <BlurView intensity={20} tint="dark" style={styles.card}>
      <View style={styles.cardHeader}>
        <Activity size={24} color="#F59E0B" />
        <Text style={styles.cardTitle}>Recent Activity</Text>
      </View>

      {trades.slice(0, 5).map((trade) => (
        <View key={trade.id} style={styles.tradeItem}>
          <View
            style={[
              styles.tradeSide,
              trade.side === 'buy' ? styles.tradeBuy : styles.tradeSell,
            ]}
          >
            {trade.side === 'buy' ? (
              <TrendingUp size={16} color="#10B981" />
            ) : (
              <TrendingDown size={16} color="#EF4444" />
            )}
          </View>

          <View style={styles.tradeInfo}>
            <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
            <Text style={styles.tradeDetails}>
              {trade.quantity} @ {formatCurrency(trade.price)}
            </Text>
          </View>

          <Text style={styles.tradeValue}>{formatCurrency(trade.quantity * trade.price)}</Text>
        </View>
      ))}
    </BlurView>
  );
});

export const InsightsSection = memo(({ insights }: { insights: Insight[] }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <BlurView intensity={20} tint="dark" style={styles.card}>
      <View style={styles.cardHeader}>
        <Sparkles size={24} color="#A78BFA" />
        <Text style={styles.cardTitle}>AI Insights</Text>
      </View>

      {insights.map((insight) => (
        <TouchableOpacity key={insight.id} style={styles.insightItem} activeOpacity={0.7}>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightDescription} numberOfLines={2}>
              {insight.description}
            </Text>
            <Text style={styles.insightCategory}>{insight.category}</Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </BlurView>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: '#9CA3AF',
  },
  statusActive: {
    color: '#10B981',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  kpiItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: Spacing.md,
  },
  kpiIcon: {
    marginBottom: Spacing.xs,
  },
  kpiLabel: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
    marginBottom: Spacing.xs,
  },
  kpiValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  kpiChange: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.xs,
  },
  guardrailItem: {
    marginBottom: Spacing.md,
  },
  guardrailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  guardrailLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  guardrailStatus: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safe: {
    color: '#34D399',
    backgroundColor: 'rgba(52,211,153,0.2)',
  },
  breached: {
    color: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
  },
  progressBreached: {
    backgroundColor: '#EF4444',
  },
  guardrailValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  guardrailText: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
  },
  tradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tradeSide: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  tradeBuy: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  tradeSell: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  tradeInfo: {
    flex: 1,
  },
  tradeSymbol: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  tradeDetails: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  tradeValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: Spacing.xs,
  },
  insightDescription: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  insightCategory: {
    fontSize: Typography.size.xs,
    color: '#A78BFA',
    textTransform: 'uppercase',
  },
});
