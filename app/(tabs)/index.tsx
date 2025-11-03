import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, SafeAreaView, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TickerRibbon } from '@/components/ticker/TickerRibbon';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { AccountSplit } from '@/components/dashboard/AccountSplit';
import { PerformanceCard } from '@/components/dashboard/PerformanceCard';
import { AllocationDonut } from '@/components/dashboard/AllocationDonut';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { NotificationBadge } from '@/components/dashboard/NotificationBadge';
import { BottomInsetSpacer, TAB_BAR_HEIGHT_CONSTANT } from '@/components/ui/BottomInsetSpacer';
import TransferModal from '@/components/modals/TransferModal';
import DepositModal from '@/components/modals/DepositModal';
import WithdrawModal from '@/components/modals/WithdrawModal';
import NotificationCenterModal from '@/components/modals/NotificationCenterModal';
import { usePortfolioSnapshots } from '@/hooks/usePortfolioSnapshots';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, zIndex, breakpoints } from '@/constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DataStreamBackground } from '@/components/backgrounds';

const S = 8;

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export default function HomeScreen() {
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const isTablet = useMemo(() => width >= breakpoints.tablet, [width]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [netWorth, setNetWorth] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [investmentBalance, setInvestmentBalance] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [activeInvestments, setActiveInvestments] = useState(0);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [portfolioReturn, setPortfolioReturn] = useState(0);
  const [todayChange, setTodayChange] = useState(0);
  const [todayChangePercent, setTodayChangePercent] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [botStatus, setBotStatus] = useState<'active' | 'paused' | 'inactive'>('active');
  const [botTodayPnL, setBotTodayPnL] = useState(0);
  const [botWinRate, setBotWinRate] = useState(0);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  const { snapshots, createSnapshot } = usePortfolioSnapshots(user?.id, timeRange);
  const { unreadCount: notificationCount } = useNotifications(user?.id);

  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const rotation3 = useSharedValue(0);
  const floatY1 = useSharedValue(0);
  const floatY2 = useSharedValue(0);
  const floatY3 = useSharedValue(0);
  const floatX1 = useSharedValue(0);
  const floatX2 = useSharedValue(0);
  const floatX3 = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.25);
  const opacity3 = useSharedValue(0.2);

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    const ultraSmoothEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

    rotation1.value = withRepeat(withTiming(360, { duration: 45000, easing: Easing.linear }), -1, false);
    rotation2.value = withRepeat(withTiming(-360, { duration: 55000, easing: Easing.linear }), -1, false);
    rotation3.value = withRepeat(withTiming(360, { duration: 65000, easing: Easing.linear }), -1, false);

    floatY1.value = withRepeat(withTiming(35, { duration: 8500, easing: ultraSmoothEasing }), -1, true);
    floatY2.value = withRepeat(withTiming(-40, { duration: 9000, easing: ultraSmoothEasing }), -1, true);
    floatY3.value = withRepeat(withTiming(30, { duration: 8000, easing: ultraSmoothEasing }), -1, true);

    floatX1.value = withRepeat(withTiming(25, { duration: 7500, easing: ultraSmoothEasing }), -1, true);
    floatX2.value = withRepeat(withTiming(-30, { duration: 8000, easing: ultraSmoothEasing }), -1, true);
    floatX3.value = withRepeat(withTiming(20, { duration: 7000, easing: ultraSmoothEasing }), -1, true);

    scale1.value = withRepeat(withTiming(1.15, { duration: 6500, easing: ultraSmoothEasing }), -1, true);
    scale2.value = withRepeat(withTiming(1.2, { duration: 7000, easing: ultraSmoothEasing }), -1, true);
    scale3.value = withRepeat(withTiming(1.1, { duration: 6000, easing: ultraSmoothEasing }), -1, true);

    opacity1.value = withRepeat(withTiming(0.6, { duration: 5500, easing: ultraSmoothEasing }), -1, true);
    opacity2.value = withRepeat(withTiming(0.5, { duration: 6000, easing: ultraSmoothEasing }), -1, true);
    opacity3.value = withRepeat(withTiming(0.45, { duration: 5000, easing: ultraSmoothEasing }), -1, true);
  };

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: floatX1.value },
      { translateY: floatY1.value },
      { rotateZ: `${rotation1.value}deg` },
      { scale: scale1.value },
    ],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: floatX2.value },
      { translateY: floatY2.value },
      { rotateZ: `${rotation2.value}deg` },
      { scale: scale2.value },
    ],
    opacity: opacity2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [
      { translateX: floatX3.value },
      { translateY: floatY3.value },
      { rotateZ: `${rotation3.value}deg` },
      { scale: scale3.value },
    ],
    opacity: opacity3.value,
  }));

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (accounts && accounts.length > 0) {
        const total = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
        setNetWorth(total);
        setTotalAccounts(accounts.length);

        const cash = accounts
          .filter(a => a.account_type.includes('cash'))
          .reduce((sum, acc) => sum + Number(acc.balance), 0);
        const investments = accounts
          .filter(a => !a.account_type.includes('cash'))
          .reduce((sum, acc) => sum + Number(acc.balance), 0);

        setCashBalance(cash);
        setInvestmentBalance(investments);

        await createSnapshot(total, cash, investments);

        const accountIds = accounts.map(a => a.id);

        const { data: holdings } = await supabase
          .from('holdings')
          .select('*')
          .in('account_id', accountIds);

        if (holdings && holdings.length > 0) {
          setActiveInvestments(holdings.length);

          const holdingsWithChange = holdings.map(h => {
            const cost = Number(h.quantity) * Number(h.average_cost);
            const value = Number(h.market_value);
            const changePct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
            return {
              ...h,
              change: changePct,
            };
          }).sort((a, b) => Number(b.market_value) - Number(a.market_value));

          setHoldings(holdingsWithChange.slice(0, 5));

          const totalCost = holdings.reduce((sum, h) =>
            sum + (Number(h.quantity) * Number(h.average_cost)), 0
          );
          const totalValue = holdings.reduce((sum, h) =>
            sum + Number(h.market_value), 0
          );

          if (totalCost > 0) {
            const returnPct = ((totalValue - totalCost) / totalCost) * 100;
            setPortfolioReturn(returnPct);

            const todayValue = holdings.reduce((sum, h) => {
              const dayChange = Number(h.day_change || 0);
              return sum + dayChange;
            }, 0);
            setTodayChange(todayValue);

            if (totalValue > 0) {
              setTodayChangePercent((todayValue / totalValue) * 100);
            }
          }
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, createSnapshot]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTransfer = useCallback(() => setTransferModalVisible(true), []);
  const handleDeposit = useCallback(() => setDepositModalVisible(true), []);
  const handleWithdraw = useCallback(() => setWithdrawModalVisible(true), []);
  const handleNotifications = useCallback(() => setNotificationModalVisible(true), []);
  const handleBotToggle = useCallback((active: boolean) => {
    setBotStatus(active ? 'active' : 'paused');
  }, []);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const assetAllocations = useMemo(() => [
    {
      label: 'Cash',
      value: cashBalance,
      percent: netWorth > 0 ? (cashBalance / netWorth) * 100 : 0,
      color: '#9CA3AF',
      type: 'cash' as const,
    },
    {
      label: 'Equities',
      value: investmentBalance * 0.7,
      percent: netWorth > 0 ? ((investmentBalance * 0.7) / netWorth) * 100 : 0,
      color: '#3B82F6',
      type: 'equities' as const,
    },
    {
      label: 'Crypto',
      value: investmentBalance * 0.2,
      percent: netWorth > 0 ? ((investmentBalance * 0.2) / netWorth) * 100 : 0,
      color: '#8B5CF6',
      type: 'crypto' as const,
    },
    {
      label: 'Bonds',
      value: investmentBalance * 0.1,
      percent: netWorth > 0 ? ((investmentBalance * 0.1) / netWorth) * 100 : 0,
      color: '#10B981',
      type: 'bonds' as const,
    },
  ].filter(a => a.value > 0), [cashBalance, investmentBalance, netWorth]);

  const performanceData = useMemo(() => snapshots.map(s => ({
    date: s.snapshot_date,
    value: Number(s.total_value),
  })), [snapshots]);

  const sparklineData = useMemo(() =>
    performanceData.slice(-7).map(d => d.value),
    [performanceData]
  );

  const shapeSize1 = useMemo(() => Math.min(280, width * 0.7), [width]);
  const shapeSize2 = useMemo(() => Math.min(220, width * 0.55), [width]);
  const shapeSize3 = useMemo(() => Math.min(200, width * 0.5), [width]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.shape3D, styles.shape1, animatedStyle1]}>
          <LinearGradient colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']} style={styles.shapeGradient} />
        </Animated.View>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your portfolio...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TransferModal visible={transferModalVisible} onClose={() => setTransferModalVisible(false)} />
      <DepositModal visible={depositModalVisible} onClose={() => setDepositModalVisible(false)} />
      <WithdrawModal visible={withdrawModalVisible} onClose={() => setWithdrawModalVisible(false)} />
      <NotificationCenterModal visible={notificationModalVisible} onClose={() => setNotificationModalVisible(false)} />
      <View style={styles.container}>
        <DataStreamBackground />

        <TickerRibbon />

        <View style={[styles.header, { paddingHorizontal: isTablet ? S * 4 : S * 2 }]} accessible={true} accessibilityLabel="Page header">
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { fontSize: isTablet ? 15 : 13 }]}>Welcome back</Text>
            <Text style={[styles.headerTitle, { fontSize: isTablet ? 28 : 24 }]} numberOfLines={1} ellipsizeMode="tail">
              {user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
          <NotificationBadge count={notificationCount} onPress={handleNotifications} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isTablet ? S * 4 : S * 2 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
          showsVerticalScrollIndicator={false}
          accessible={true}
          accessibilityLabel="Dashboard main content"
        >
          <HeroSection
            totalValue={netWorth}
            todayChange={todayChange}
            todayChangePercent={todayChangePercent}
            totalReturn={portfolioReturn}
            totalReturnPercent={portfolioReturn}
            sparklineData={sparklineData}
            botStatus={botStatus}
            botTodayPnL={botTodayPnL}
            botWinRate={botWinRate}
            onBotToggle={handleBotToggle}
            onDeposit={handleDeposit}
            onTransfer={handleTransfer}
            onWithdraw={handleWithdraw}
          />

          {isTablet ? (
            <View style={[styles.tabletGrid, { gap: S * 3 }]}>
              <View style={styles.tabletColumnLeft}>
                <AccountSplit
                  cashBalance={cashBalance}
                  investmentBalance={investmentBalance}
                  totalValue={netWorth}
                />
                <RecentActivity userId={user?.id} />
              </View>

              <View style={styles.tabletColumnRight}>
                <PerformanceCard
                  data={performanceData}
                  currentValue={netWorth}
                  onTimeRangeChange={handleTimeRangeChange}
                  loading={false}
                />
                {assetAllocations.length > 0 && (
                  <AllocationDonut allocations={assetAllocations} totalValue={netWorth} />
                )}
              </View>
            </View>
          ) : (
            <>
              <AccountSplit
                cashBalance={cashBalance}
                investmentBalance={investmentBalance}
                totalValue={netWorth}
              />

              <PerformanceCard
                data={performanceData}
                currentValue={netWorth}
                onTimeRangeChange={handleTimeRangeChange}
                loading={false}
              />

              {assetAllocations.length > 0 && (
                <AllocationDonut allocations={assetAllocations} totalValue={netWorth} />
              )}

              <RecentActivity userId={user?.id} />
            </>
          )}

          <BottomInsetSpacer />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  shape3D: {
    position: 'absolute',
    borderRadius: 40,
    zIndex: zIndex.background,
    overflow: 'hidden',
  },
  shape1: {
    top: -80,
  },
  shape2: {
    top: '30%',
  },
  shape3: {
    bottom: 100,
  },
  shapeGradient: {
    flex: 1,
    borderRadius: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: S * 4,
    paddingBottom: S * 2.5,
    backgroundColor: 'transparent',
    zIndex: zIndex.content,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: colors.textMuted,
    marginBottom: S * 0.5,
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.white,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
    zIndex: zIndex.content,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: S * 2,
  },
  tabletGrid: {
    flexDirection: 'row',
    marginTop: S,
    minWidth: 0,
  },
  tabletColumnLeft: {
    flex: 1,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
  },
  tabletColumnRight: {
    flex: 1,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
  },
});
