import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, SafeAreaView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
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
import UnifiedDepositModal from '@/components/modals/UnifiedDepositModal';
import UnifiedWithdrawModal from '@/components/modals/UnifiedWithdrawModal';
import NotificationCenterModal from '@/components/modals/NotificationCenterModal';
import { usePortfolioSnapshots } from '@/hooks/usePortfolioSnapshots';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, zIndex, breakpoints } from '@/constants/theme';
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

  useFocusEffect(
    useCallback(() => {
      setTransferModalVisible(false);
      setDepositModalVisible(false);
      setWithdrawModalVisible(false);
      setNotificationModalVisible(false);
    }, [])
  );


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


  if (loading) {
    return (
      <View style={styles.container}>
        <DataStreamBackground />
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
      <UnifiedDepositModal visible={depositModalVisible} onClose={() => setDepositModalVisible(false)} />
      <UnifiedWithdrawModal visible={withdrawModalVisible} onClose={() => setWithdrawModalVisible(false)} />
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
