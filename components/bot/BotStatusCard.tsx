import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Bot, TrendingUp, Activity, DollarSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, Typography } from '@/constants/theme';
import { formatSmartCurrency } from '@/utils/formatting';

interface BotStatusCardProps {
  botName: string;
  status: 'active' | 'inactive' | 'maintenance';
  strategyType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  allocatedAmount: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  winRate: number;
  totalTrades: number;
}

const statusConfig = {
  active: {
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    label: 'Active',
  },
  inactive: {
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    label: 'Inactive',
  },
  maintenance: {
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    label: 'Maintenance',
  },
};

const riskConfig = {
  low: { color: '#10B981', label: 'Low Risk' },
  medium: { color: '#3B82F6', label: 'Medium Risk' },
  high: { color: '#F59E0B', label: 'High Risk' },
  very_high: { color: '#EF4444', label: 'Very High Risk' },
};

export function BotStatusCard({
  botName,
  status,
  strategyType,
  riskLevel,
  allocatedAmount,
  currentValue,
  totalReturn,
  totalReturnPercent,
  winRate,
  totalTrades,
}: BotStatusCardProps) {
  const statusInfo = statusConfig[status];
  const riskInfo = riskConfig[riskLevel];
  const isProfit = totalReturn >= 0;

  return (
    <BlurView intensity={15} tint="dark" style={styles.container}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.05)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconContainer}>
                <Bot size={24} color="#FFFFFF" />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.botName}>{botName}</Text>
                <Text style={styles.strategyType}>{strategyType}</Text>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Activity size={14} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.riskBadge}>
            <Text style={[styles.riskText, { color: riskInfo.color }]}>
              {riskInfo.label}
            </Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Portfolio Value</Text>
              <Text style={styles.metricValue}>{formatSmartCurrency(currentValue)}</Text>
              <View style={[styles.returnBadge, isProfit ? styles.returnPositive : styles.returnNegative]}>
                {isProfit ? (
                  <TrendingUp size={12} color="#10B981" />
                ) : (
                  <TrendingUp size={12} color="#EF4444" style={{ transform: [{ rotate: '180deg' }] }} />
                )}
                <Text style={[styles.returnText, isProfit ? styles.returnPositive : styles.returnNegative]}>
                  {isProfit ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Return</Text>
              <Text style={[styles.metricValue, isProfit ? styles.profitColor : styles.lossColor]}>
                {isProfit ? '+' : ''}{formatSmartCurrency(totalReturn)}
              </Text>
              <Text style={styles.metricSubtext}>
                {formatSmartCurrency(allocatedAmount)} invested
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{winRate.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalTrades}</Text>
              <Text style={styles.statLabel}>Total Trades</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.floor(totalTrades / 30) || 1}</Text>
              <Text style={styles.statLabel}>Avg/Day</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  botName: {
    fontSize: 20,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 2,
  },
  strategyType: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: Typography.weight.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  riskText: {
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
    fontWeight: Typography.weight.medium,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 6,
  },
  metricSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  returnText: {
    fontSize: 12,
    fontWeight: Typography.weight.bold,
  },
  returnPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
  },
  returnNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
  },
  profitColor: {
    color: '#10B981',
  },
  lossColor: {
    color: '#EF4444',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: Typography.weight.medium,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
