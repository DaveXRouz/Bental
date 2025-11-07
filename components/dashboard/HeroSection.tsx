import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, useWindowDimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Bot, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react-native';
import { Sparkline } from '@/components/ui/Sparkline';
import { colors, radius, spacing, typography, breakpoints } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

interface MarginCallDetails {
  shortfall_amount: number;
  triggered_value: number;
  threshold_value: number;
  triggered_at: string;
}

interface HeroSectionProps {
  totalValue: number;
  todayChange: number;
  todayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  sparklineData?: number[];
  hasBot: boolean;
  botStatus?: 'active' | 'paused' | 'margin_call';
  botTodayPnL?: number;
  botWinRate?: number;
  botTotalTrades?: number;
  isMarginCall?: boolean;
  marginCallDetails?: MarginCallDetails | null;
  onBotToggle?: (active: boolean) => void;
  onDeposit?: () => void;
  onTransfer?: () => void;
  onWithdraw?: () => void;
}

const S = 8;

export const HeroSection = React.memo(({
  totalValue,
  todayChange,
  todayChangePercent,
  totalReturn,
  totalReturnPercent,
  sparklineData = [],
  hasBot,
  botStatus,
  botTodayPnL = 0,
  botWinRate = 0,
  botTotalTrades = 0,
  isMarginCall = false,
  marginCallDetails,
  onBotToggle,
  onDeposit = () => {},
  onTransfer = () => {},
  onWithdraw = () => {},
}: HeroSectionProps) => {
  const { width } = useWindowDimensions();
  const isTablet = useMemo(() => width >= breakpoints.tablet, [width]);
  const [isBotActive, setIsBotActive] = React.useState(botStatus === 'active');

  const formattedValue = useMemo(() => {
    if (totalValue >= 100000) {
      return `$${(totalValue / 1000).toFixed(1)}k`;
    }
    return `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [totalValue]);

  const todayPositive = todayChange >= 0;
  const totalPositive = totalReturn >= 0;
  const pnlPositive = botTodayPnL >= 0;

  const botStatusColor = botStatus === 'active' ? '#10B981' : botStatus === 'paused' ? '#F59E0B' : '#6B7280';
  const botStatusLabel = botStatus === 'active' ? 'Active' : botStatus === 'paused' ? 'Paused' : 'Inactive';

  const handleBotToggle = React.useCallback((value: boolean) => {
    setIsBotActive(value);
    onBotToggle?.(value);
  }, [onBotToggle]);

  if (isTablet) {
    return (
      <View style={[styles.tabletContainer, !hasBot && styles.tabletContainerNoBot]}>
        <BlurView intensity={20} tint="dark" style={[styles.portfolioCard, !hasBot && styles.portfolioCardFullWidth]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.portfolioContent}>
              <View style={styles.portfolioHeader}>
                <View style={styles.portfolioValueSection}>
                  <Text style={styles.label}>Total Portfolio Value</Text>
                  <Text style={styles.value}>{formattedValue}</Text>

                  <View style={styles.pillsRow}>
                    <View style={[styles.pill, todayPositive ? styles.pillPositive : styles.pillNegative]}>
                      {todayPositive ? (
                        <TrendingUp size={14} color="#FFFFFF" strokeWidth={2.5} />
                      ) : (
                        <TrendingDown size={14} color="#FFFFFF" strokeWidth={2.5} />
                      )}
                      <Text style={styles.pillText}>
                        {todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}% Today
                      </Text>
                    </View>

                    <View style={[styles.pill, totalPositive ? styles.pillPositive : styles.pillNegative]}>
                      {totalPositive ? (
                        <TrendingUp size={14} color="#FFFFFF" strokeWidth={2.5} />
                      ) : (
                        <TrendingDown size={14} color="#FFFFFF" strokeWidth={2.5} />
                      )}
                      <Text style={styles.pillText}>
                        {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}% Total
                      </Text>
                    </View>
                  </View>

                  <View style={styles.quickStatsRowTablet}>
                    <View style={styles.quickStatTablet}>
                      <Text style={styles.quickStatLabelTablet}>Day Change</Text>
                      <Text style={[styles.quickStatValueTablet, todayPositive ? styles.statValuePositive : styles.statValueNegative]}>
                        {todayPositive ? '+' : ''}${Math.abs(todayChange).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.quickStatTablet}>
                      <Text style={styles.quickStatLabelTablet}>Total Gain</Text>
                      <Text style={[styles.quickStatValueTablet, totalPositive ? styles.statValuePositive : styles.statValueNegative]}>
                        {totalPositive ? '+' : ''}${Math.abs(totalReturn).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {sparklineData.length > 0 && (
                  <View style={styles.sparklineContainerTablet}>
                    <Sparkline
                      data={sparklineData}
                      height={80}
                      width={Math.max(200, Math.min(300, width * 0.25))}
                      color={todayPositive ? '#10B981' : '#EF4444'}
                    />
                  </View>
                )}
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionButtonTablet}
                  onPress={onDeposit}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Deposit funds"
                >
                  <View style={[styles.actionIconCircle, styles.depositIconBg]}>
                    <ArrowDownToLine size={20} color="#10B981" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionLabelTablet}>Deposit</Text>
                  <Text style={styles.actionSubtext}>Add funds</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButtonTablet}
                  onPress={onTransfer}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Transfer funds"
                >
                  <View style={[styles.actionIconCircle, styles.transferIconBg]}>
                    <ArrowRightLeft size={20} color="#3B82F6" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionLabelTablet}>Transfer</Text>
                  <Text style={styles.actionSubtext}>Move funds</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButtonTablet}
                  onPress={onWithdraw}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Withdraw funds"
                >
                  <View style={[styles.actionIconCircle, styles.withdrawIconBg]}>
                    <ArrowUpFromLine size={20} color="#F59E0B" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionLabelTablet}>Withdraw</Text>
                  <Text style={styles.actionSubtext}>Cash out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {hasBot && (
        <BlurView intensity={15} tint="dark" style={styles.botCard}>
          <View style={styles.botHeader}>
            <View style={styles.botHeaderLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${botStatusColor}20` }]}>
                <Bot size={24} color={botStatusColor} strokeWidth={2.5} />
              </View>
              <View style={styles.botTitleContainer}>
                <Text style={styles.botTitle}>AI Trading Bot</Text>
                <Text style={styles.botSubtitle}>Autonomous Trading</Text>
              </View>
            </View>
            <Switch
              value={isBotActive}
              onValueChange={handleBotToggle}
              trackColor={{ false: colors.grey[700], true: '#10B981' }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.grey[700]}
              accessibilityLabel={`Toggle AI bot ${isBotActive ? 'off' : 'on'}`}
              accessibilityRole="switch"
            />
          </View>

          {isMarginCall && marginCallDetails ? (
            <View style={styles.marginCallBanner}>
              <AlertTriangle size={20} color="#EF4444" strokeWidth={2.5} />
              <View style={styles.marginCallTextContainer}>
                <Text style={styles.marginCallTitle}>Margin Call - Bot Paused</Text>
                <Text style={styles.marginCallText}>
                  Add ${marginCallDetails.shortfall_amount.toFixed(2)} to resume trading
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.statusBanner, { backgroundColor: `${botStatusColor}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: botStatusColor }]} />
              <Text style={[styles.statusBannerText, { color: botStatusColor }]}>
                {botStatusLabel} {isBotActive ? '• Trading' : '• Standby'}
              </Text>
            </View>
          )}

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Today's P/L</Text>
              <View style={styles.statValueRow}>
                {pnlPositive ? (
                  <TrendingUp size={18} color="#10B981" strokeWidth={2.5} />
                ) : (
                  <TrendingDown size={18} color="#EF4444" strokeWidth={2.5} />
                )}
                <Text style={[styles.statValue, pnlPositive ? styles.statValuePositive : styles.statValueNegative]}>
                  {pnlPositive ? '+' : ''}${Math.abs(botTodayPnL).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.statSubtext}>
                {pnlPositive ? 'Profit' : 'Loss'} today
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Win Rate</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{botWinRate.toFixed(1)}%</Text>
              </View>
              <Text style={styles.statSubtext}>Success rate</Text>
            </View>
          </View>

          <View style={styles.botMetrics}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Trades</Text>
              <Text style={styles.metricValue}>{botTotalTrades}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Status</Text>
              <Text style={[styles.metricValue, isMarginCall && { color: '#EF4444' }]}>
                {isMarginCall ? 'Margin Call' : 'Active'}
              </Text>
            </View>
          </View>
        </BlurView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.mobileContainer}>
      <BlurView intensity={20} tint="dark" style={styles.portfolioCardMobile}>
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.mobileTopRow}>
            <View style={styles.portfolioSection}>
              <Text style={styles.labelMobile}>Total Portfolio Value</Text>
              <Text style={styles.valueMobile}>{formattedValue}</Text>

              <View style={styles.pillsRowMobile}>
                <View style={[styles.pillSmall, todayPositive ? styles.pillPositive : styles.pillNegative]}>
                  {todayPositive ? (
                    <TrendingUp size={12} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown size={12} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                  <Text style={styles.pillTextSmall}>
                    {todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}% Today
                  </Text>
                </View>

                <View style={[styles.pillSmall, totalPositive ? styles.pillPositive : styles.pillNegative]}>
                  {totalPositive ? (
                    <TrendingUp size={12} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown size={12} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                  <Text style={styles.pillTextSmall}>
                    {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}% Total
                  </Text>
                </View>
              </View>

              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStatItem}>
                  <Text style={[styles.quickStatValue, todayPositive ? styles.statValuePositive : styles.statValueNegative]}>
                    {todayPositive ? '+' : ''}${todayChange.toFixed(2)}
                  </Text>
                  <Text style={styles.quickStatLabel}>Day Change</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={[styles.quickStatValue, totalPositive ? styles.statValuePositive : styles.statValueNegative]}>
                    {totalPositive ? '+' : ''}${totalReturn.toFixed(2)}
                  </Text>
                  <Text style={styles.quickStatLabel}>Total Gain</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionsRowMobile}>
            <TouchableOpacity
              style={styles.actionButtonMobile}
              onPress={onDeposit}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Deposit funds"
            >
              <View style={[styles.actionIconCircleMobile, styles.depositIconBg]}>
                <ArrowDownToLine size={18} color="#10B981" strokeWidth={2.5} />
              </View>
              <Text style={styles.actionLabelMobile}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonMobile}
              onPress={onTransfer}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Transfer funds"
            >
              <View style={[styles.actionIconCircleMobile, styles.transferIconBg]}>
                <ArrowRightLeft size={18} color="#3B82F6" strokeWidth={2.5} />
              </View>
              <Text style={styles.actionLabelMobile}>Transfer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonMobile}
              onPress={onWithdraw}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Withdraw funds"
            >
              <View style={[styles.actionIconCircleMobile, styles.withdrawIconBg]}>
                <ArrowUpFromLine size={18} color="#F59E0B" strokeWidth={2.5} />
              </View>
              <Text style={styles.actionLabelMobile}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </BlurView>

      {hasBot && (
      <BlurView intensity={15} tint="dark" style={styles.botCardMobile}>
        <View style={styles.botHeaderMobile}>
          <View style={styles.botHeaderLeftMobile}>
            <View style={[styles.iconContainerMobile, { backgroundColor: `${botStatusColor}20` }]}>
              <Bot size={20} color={botStatusColor} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={styles.botTitleMobile}>AI Trading Bot</Text>
              <View style={[styles.statusChipMobile, { backgroundColor: `${botStatusColor}20` }]}>
                <View style={[styles.statusDotMobile, { backgroundColor: botStatusColor }]} />
                <Text style={[styles.statusTextMobile, { color: botStatusColor }]}>
                  {botStatusLabel}
                </Text>
              </View>
            </View>
          </View>
          <Switch
            value={isBotActive}
            onValueChange={handleBotToggle}
            trackColor={{ false: colors.grey[700], true: '#10B981' }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.grey[700]}
            accessibilityLabel="Toggle AI bot"
            accessibilityRole="switch"
          />
        </View>

        <View style={styles.statsRowMobile}>
          <View style={styles.statItemMobile}>
            <Text style={styles.statLabelMobile}>Today's P/L</Text>
            <View style={styles.statValueRowMobile}>
              {pnlPositive ? (
                <TrendingUp size={14} color="#10B981" strokeWidth={2.5} />
              ) : (
                <TrendingDown size={14} color="#EF4444" strokeWidth={2.5} />
              )}
              <Text style={[styles.statValueMobile, pnlPositive ? styles.statValuePositive : styles.statValueNegative]}>
                {pnlPositive ? '+' : ''}${Math.abs(botTodayPnL).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.dividerMobile} />

          <View style={styles.statItemMobile}>
            <Text style={styles.statLabelMobile}>Win Rate</Text>
            <Text style={styles.statValueMobile}>{botWinRate.toFixed(1)}%</Text>
          </View>

          <View style={styles.dividerMobile} />

          <View style={styles.statItemMobile}>
            <Text style={styles.statLabelMobile}>Trades</Text>
            <Text style={styles.statValueMobile}>{botTotalTrades}</Text>
          </View>
        </View>
      </BlurView>
      )}
    </View>
  );
});

HeroSection.displayName = 'HeroSection';

const styles = StyleSheet.create({
  tabletContainer: {
    flexDirection: 'row',
    gap: S * 2.5,
    marginBottom: S * 3,
    minWidth: 0,
  },
  tabletContainerNoBot: {
    flexDirection: 'column',
  },
  portfolioCard: {
    flex: 2,
    flexShrink: 1,
    flexGrow: 2,
    minWidth: 0,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  portfolioCardFullWidth: {
    flex: 1,
  },
  botCard: {
    flex: 1,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 200,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  portfolioContent: {
    padding: spacing.xl,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: S * 3,
  },
  portfolioValueSection: {
    flex: 1,
  },
  sparklineContainerTablet: {
    marginLeft: S * 3,
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: S * 2,
    paddingTop: S * 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonTablet: {
    flex: 1,
    alignItems: 'center',
    gap: S * 1.5,
    paddingVertical: S * 2.5,
    paddingHorizontal: S * 2,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  depositIconBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  transferIconBg: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  withdrawIconBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  actionLabelTablet: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  actionSubtext: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: S,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.white,
    marginBottom: S * 2,
    letterSpacing: -1.5,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: S * 1.5,
    marginBottom: S * 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S,
    paddingHorizontal: S * 2,
    paddingVertical: S * 1.25,
    borderRadius: radius.full,
  },
  pillPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  pillNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  pillText: {
    fontSize: 14,
    fontWeight: typography.weight.bold,
    color: colors.white,
    letterSpacing: 0.2,
  },
  quickStatsRowTablet: {
    flexDirection: 'row',
    gap: S * 4,
    marginTop: S * 3,
    paddingTop: S * 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  quickStatTablet: {
    flex: 1,
  },
  quickStatLabelTablet: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: S * 0.75,
    fontWeight: typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickStatValueTablet: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.white,
    letterSpacing: -0.4,
  },
  statValuePositive: {
    color: '#10B981',
  },
  statValueNegative: {
    color: '#EF4444',
  },
  sparklineContainer: {
    marginTop: S,
  },
  botHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S * 2,
  },
  botHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 1.5,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botTitleContainer: {
    flex: 1,
  },
  botTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.white,
    marginBottom: S * 0.25,
  },
  botSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S,
    paddingHorizontal: S * 2,
    paddingVertical: S * 1.5,
    borderRadius: radius.md,
    marginTop: S * 2,
    marginBottom: S * 2.5,
  },
  statusBannerText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  statusDot: {
    width: S * 1.25,
    height: S * 1.25,
    borderRadius: S * 0.625,
  },
  marginCallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 1.5,
    paddingHorizontal: S * 2,
    paddingVertical: S * 2,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: S * 2,
    marginBottom: S * 2.5,
  },
  marginCallTextContainer: {
    flex: 1,
  },
  marginCallTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: '#EF4444',
    marginBottom: S * 0.5,
  },
  marginCallText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: S * 2,
    marginBottom: S * 2.5,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    padding: S * 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: S,
    fontWeight: typography.weight.medium,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 0.75,
    marginBottom: S * 0.75,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  statSubtext: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.regular,
  },
  botMetrics: {
    gap: S * 1.5,
    paddingTop: S * 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
  },
  metricValue: {
    fontSize: typography.size.sm,
    color: colors.white,
    fontWeight: typography.weight.semibold,
  },
  mobileContainer: {
    gap: S * 2,
    marginBottom: S * 3,
  },
  portfolioCardMobile: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  mobileTopRow: {
    padding: spacing.lg,
  },
  portfolioSection: {
    flex: 1,
  },
  labelMobile: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: S * 0.75,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  valueMobile: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    marginBottom: S * 1.5,
    letterSpacing: -1,
  },
  pillsRowMobile: {
    flexDirection: 'row',
    gap: S,
  },
  pillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 0.75,
    paddingHorizontal: S * 1.5,
    paddingVertical: S,
    borderRadius: radius.full,
  },
  pillTextSmall: {
    fontSize: 13,
    fontWeight: typography.weight.bold,
    color: colors.white,
    letterSpacing: 0.2,
  },
  actionsRowMobile: {
    flexDirection: 'row',
    gap: S * 1.5,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: S * 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actionButtonMobile: {
    flex: 1,
    alignItems: 'center',
    gap: S,
    paddingVertical: S * 2,
    paddingHorizontal: S,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionIconCircleMobile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabelMobile: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: S * 2,
    marginTop: S * 2.5,
    paddingTop: S * 2.5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  quickStatItem: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 17,
    fontWeight: typography.weight.bold,
    color: colors.white,
    marginBottom: S * 0.75,
    letterSpacing: -0.2,
  },
  quickStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  botCardMobile: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  botHeaderMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S * 2,
  },
  botHeaderLeftMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 1.5,
    flex: 1,
  },
  iconContainerMobile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botTitleMobile: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
    marginBottom: S * 0.5,
  },
  statusChipMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 0.75,
    paddingHorizontal: S * 1.25,
    paddingVertical: S * 0.5,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  statusDotMobile: {
    width: S,
    height: S,
    borderRadius: S * 0.5,
  },
  statusTextMobile: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  statsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    padding: S * 1.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItemMobile: {
    flex: 1,
    alignItems: 'center',
  },
  statLabelMobile: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: S * 0.5,
    fontWeight: typography.weight.medium,
  },
  statValueRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 0.5,
  },
  statValueMobile: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  dividerMobile: {
    width: 1,
    height: 32,
    backgroundColor: colors.glass.borderLight,
  },
});
