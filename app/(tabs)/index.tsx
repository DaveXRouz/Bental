import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, SafeAreaView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TickerRibbon } from '@/components/ticker/TickerRibbon';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { AccountSplit } from '@/components/dashboard/AccountSplit';
import { PerformanceCard } from '@/components/dashboard/PerformanceCard';
import { AllocationChart } from '@/components/charts/AllocationChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { NotificationBadge } from '@/components/dashboard/NotificationBadge';
import { BottomInsetSpacer, TAB_BAR_HEIGHT_CONSTANT } from '@/components/ui/BottomInsetSpacer';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { ConnectionStatusBanner } from '@/components/ui/ConnectionStatusBanner';
import TransferModal from '@/components/modals/TransferModal';
import UnifiedDepositModal from '@/components/modals/UnifiedDepositModal';
import UnifiedWithdrawModal from '@/components/modals/UnifiedWithdrawModal';
import NotificationCenterModal from '@/components/modals/NotificationCenterModal';
import { usePortfolioSnapshots } from '@/hooks/usePortfolioSnapshots';
import { useFilteredPortfolioMetrics } from '@/hooks/useFilteredPortfolioMetrics';
import { useAccountContext } from '@/contexts/AccountContext';
import { DashboardAccountSelector } from '@/components/ui/DashboardAccountSelector';
import { useNotifications } from '@/hooks/useNotifications';
import { useMarketPriceUpdater } from '@/hooks/useMarketPriceUpdater';
import { useBot } from '@/hooks/useBot';
import { portfolioAggregationService } from '@/services/portfolio/portfolio-aggregation-service';
import { colors, zIndex, breakpoints } from '@/constants/theme';
import { DataStreamBackground } from '@/components/backgrounds';
import { testSupabaseConnection } from '@/utils/connection-test';

const S = 8;

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const formatTimeSince = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'today';
};

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
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [assetAllocations, setAssetAllocations] = useState<any[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { selectedAccountIds, isAllAccountsSelected } = useAccountContext();
  const { snapshots, createSnapshot, loading: snapshotsLoading, refreshSnapshots } = usePortfolioSnapshots(user?.id, timeRange);
  const { metrics: portfolioMetrics, loading: metricsLoading, refetch: refetchMetrics } = useFilteredPortfolioMetrics(selectedAccountIds);
  const { unreadCount: notificationCount } = useNotifications(user?.id);
  const { lastUpdate: priceLastUpdate, isRunning: priceUpdaterRunning } = useMarketPriceUpdater(true, 30000);
  const {
    hasBot,
    allocation: botAllocation,
    todayPnL: botTodayPnL,
    isMarginCall,
    marginCallDetails,
    updateStatus: updateBotStatus,
    loading: botLoading
  } = useBot(user?.id);

  useFocusEffect(
    useCallback(() => {
      console.clear();
      setTransferModalVisible(false);
      setDepositModalVisible(false);
      setWithdrawModalVisible(false);
      setNotificationModalVisible(false);
    }, [])
  );


  const fetchDashboardData = useCallback(async () => {
    console.clear();
    if (!user?.id) {
      console.warn('[Dashboard] No user ID available');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Run connection test first
      console.log('[Dashboard] Testing Supabase connection...');
      const connectionTest = await testSupabaseConnection();

      if (!connectionTest.success) {
        console.error('[Dashboard] Connection test failed:', connectionTest);
        console.error('[Dashboard] Error:', connectionTest.error);
        if (connectionTest.details) {
          console.error('[Dashboard] Details:', connectionTest.details);
        }

        // Still continue to show what we can with local data
        if (!connectionTest.authenticated) {
          console.warn('[Dashboard] User not authenticated - may need to re-login');
        }
      } else {
        console.log('[Dashboard] Connection test passed');
      }

      console.log('[Dashboard] Fetching data for user:', user.id);
      console.log('[Dashboard] Portfolio metrics:', {
        totalValue: portfolioMetrics.totalValue,
        cashBalance: portfolioMetrics.cashBalance,
        investmentBalance: portfolioMetrics.investmentBalance,
        todayChange: portfolioMetrics.todayChange,
        todayChangePercent: portfolioMetrics.todayChangePercent,
        totalReturnPercent: portfolioMetrics.totalReturnPercent,
      });

      setNetWorth(portfolioMetrics.totalValue);
      setCashBalance(portfolioMetrics.cashBalance);
      setInvestmentBalance(portfolioMetrics.investmentBalance);
      setTodayChange(portfolioMetrics.todayChange);
      setTodayChangePercent(portfolioMetrics.todayChangePercent);
      setPortfolioReturn(portfolioMetrics.totalReturnPercent);

      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (accountsError) {
        console.error('[Dashboard] Error fetching accounts:', accountsError);
        console.error('[Dashboard] Account error details:', {
          message: accountsError.message,
          details: accountsError.details,
          hint: accountsError.hint,
          code: accountsError.code
        });
        // Continue even if accounts fetch fails to show what we can
      }

      if (accounts && accounts.length > 0) {
        console.log(`[Dashboard] Found ${accounts.length} accounts`);
        setTotalAccounts(accounts.length);
        const accountIds = accounts.map(a => a.id);

        const { data: holdings, error: holdingsError } = await supabase
          .from('holdings')
          .select('*')
          .in('account_id', accountIds);

        if (holdingsError) {
          console.error('[Dashboard] Error fetching holdings:', holdingsError);
          console.error('[Dashboard] Holdings error details:', {
            message: holdingsError.message,
            details: holdingsError.details,
            hint: holdingsError.hint,
            code: holdingsError.code
          });
        }

        if (holdings && holdings.length > 0) {
          console.log(`[Dashboard] Found ${holdings.length} holdings`);
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
        }
      }

      // Get real asset allocation data (filtered by selected accounts)
      const allocations = await portfolioAggregationService.getAssetAllocation(user.id, selectedAccountIds);
      console.log('[Dashboard] Asset allocations:', allocations.length);
      setAssetAllocations(allocations);

      refetchMetrics();
      setLastUpdated(new Date());
      console.log('[Dashboard] Data fetch complete');
    } catch (error: any) {
      console.error('[Dashboard] Error:', error);
      console.error('[Dashboard] Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      // Check if it's a network error
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        console.error('[Dashboard] Network error detected - possible CORS or connectivity issue');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, portfolioMetrics, refetchMetrics, selectedAccountIds]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTransfer = useCallback(() => setTransferModalVisible(true), []);
  const handleDeposit = useCallback(() => setDepositModalVisible(true), []);
  const handleWithdraw = useCallback(() => setWithdrawModalVisible(true), []);
  const handleNotifications = useCallback(() => setNotificationModalVisible(true), []);
  const handleBotToggle = useCallback(async (active: boolean) => {
    if (botAllocation) {
      try {
        await updateBotStatus(active ? 'active' : 'paused');
      } catch (error) {
        console.error('Failed to toggle bot status:', error);
      }
    }
  }, [botAllocation, updateBotStatus]);

  const handleTimeRangeChange = useCallback(async (range: TimeRange) => {
    setPerformanceLoading(true);
    setTimeRange(range);
    setTimeout(() => setPerformanceLoading(false), 300);
  }, []);

  // Asset allocations are now fetched from the aggregation service

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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <DataStreamBackground />
          <TickerRibbon />

          <View style={[styles.header, { paddingHorizontal: isTablet ? S * 4 : S * 2 }]}>
            <View style={styles.headerLeft}>
              <GlassSkeleton width={80} height={12} style={{ marginBottom: S * 0.5 }} />
              <GlassSkeleton width={140} height={24} />
            </View>
            <GlassSkeleton width={40} height={40} borderRadius={20} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isTablet ? S * 4 : S * 2 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.skeletonHero}>
              <GlassSkeleton width={100} height={14} style={{ marginBottom: S }} />
              <GlassSkeleton width="60%" height={36} style={{ marginBottom: S * 0.5 }} />
              <GlassSkeleton width={120} height={16} style={{ marginBottom: S * 2 }} />
              <View style={{ flexDirection: 'row', gap: S }}>
                <GlassSkeleton width="30%" height={44} borderRadius={12} />
                <GlassSkeleton width="30%" height={44} borderRadius={12} />
                <GlassSkeleton width="30%" height={44} borderRadius={12} />
              </View>
            </View>

            <View style={styles.skeletonCard}>
              <GlassSkeleton width={120} height={18} style={{ marginBottom: S * 2 }} />
              <GlassSkeleton width="100%" height={40} style={{ marginBottom: S }} />
              <GlassSkeleton width="100%" height={4} borderRadius={2} style={{ marginBottom: S * 2 }} />
              <GlassSkeleton width="100%" height={40} style={{ marginBottom: S }} />
              <GlassSkeleton width="100%" height={4} borderRadius={2} />
            </View>

            <View style={styles.skeletonCard}>
              <GlassSkeleton width={120} height={18} style={{ marginBottom: S * 2 }} />
              <GlassSkeleton width={80} height={12} style={{ marginBottom: S * 0.5 }} />
              <GlassSkeleton width="50%" height={28} style={{ marginBottom: S * 2 }} />
              <View style={{ flexDirection: 'row', gap: S, marginBottom: S * 2 }}>
                {TIME_RANGES.map((range, idx) => (
                  <GlassSkeleton key={idx} width="15%" height={32} borderRadius={8} />
                ))}
              </View>
              <GlassSkeleton width="100%" height={180} borderRadius={12} />
            </View>

            <View style={styles.skeletonCard}>
              <GlassSkeleton width={140} height={18} style={{ marginBottom: S * 2 }} />
              <View style={{ alignItems: 'center', marginBottom: S * 2 }}>
                <GlassSkeleton width={160} height={160} borderRadius={80} />
              </View>
              <GlassSkeleton width="100%" height={40} style={{ marginBottom: S }} />
              <GlassSkeleton width="100%" height={40} style={{ marginBottom: S }} />
              <GlassSkeleton width="100%" height={40} />
            </View>

            <View style={styles.skeletonCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: S * 2 }}>
                <View style={{ flexDirection: 'row', gap: S }}>
                  <GlassSkeleton width={18} height={18} borderRadius={9} />
                  <GlassSkeleton width={120} height={18} />
                </View>
                <GlassSkeleton width={60} height={18} />
              </View>
              {[1, 2, 3, 4, 5].map((idx) => (
                <View key={idx} style={styles.skeletonActivity}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: S * 1.5 }}>
                    <GlassSkeleton width={36} height={36} borderRadius={18} />
                    <View style={{ flex: 1 }}>
                      <GlassSkeleton width="60%" height={14} style={{ marginBottom: S * 0.5 }} />
                      <GlassSkeleton width="80%" height={12} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <GlassSkeleton width={80} height={14} style={{ marginBottom: S * 0.5 }} />
                    <GlassSkeleton width={50} height={11} />
                  </View>
                </View>
              ))}
            </View>

            <BottomInsetSpacer />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TransferModal visible={transferModalVisible} onClose={() => setTransferModalVisible(false)} />
      <UnifiedDepositModal
        visible={depositModalVisible}
        onClose={() => setDepositModalVisible(false)}
        onSuccess={() => {
          fetchDashboardData();
          refetchMetrics();
        }}
      />
      <UnifiedWithdrawModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        onSuccess={() => {
          fetchDashboardData();
          refetchMetrics();
        }}
      />
      <NotificationCenterModal visible={notificationModalVisible} onClose={() => setNotificationModalVisible(false)} />
      <View style={styles.container}>
        <DataStreamBackground />

        <TickerRibbon />

        <ConnectionStatusBanner />

        <View style={[styles.header, { paddingHorizontal: isTablet ? S * 4 : S * 2 }]} accessible={true} accessibilityLabel="Page header">
          <View style={styles.headerLeft}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.greeting, { fontSize: isTablet ? 15 : 13 }]}>Welcome back</Text>
                <Text style={[styles.headerTitle, { fontSize: isTablet ? 28 : 24 }]} numberOfLines={1} ellipsizeMode="tail">
                  {user?.email?.split('@')[0] || 'User'}
                </Text>
              </View>
              <NotificationBadge count={notificationCount} onPress={handleNotifications} />
            </View>
            {!loading && (
              <View style={styles.headerBottom}>
                <DashboardAccountSelector />
                <Text style={[styles.lastUpdated, { fontSize: isTablet ? 12 : 11 }]}>
                  Updated {formatTimeSince(lastUpdated)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isTablet ? S * 4 : S * 2 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
              progressBackgroundColor="rgba(26, 26, 28, 0.8)"
            />
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
            hasBot={hasBot}
            botStatus={botAllocation?.status as 'active' | 'paused' | 'margin_call' | undefined}
            botTodayPnL={botTodayPnL}
            botWinRate={botAllocation?.win_rate || 0}
            botTotalTrades={botAllocation?.total_trades || 0}
            isMarginCall={isMarginCall}
            marginCallDetails={marginCallDetails}
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
                  loading={performanceLoading || snapshotsLoading}
                />
                {assetAllocations.length > 0 && (
                  <AllocationChart allocations={assetAllocations} totalValue={netWorth} />
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
                loading={performanceLoading || snapshotsLoading}
              />

              {assetAllocations.length > 0 && (
                <AllocationChart allocations={assetAllocations} totalValue={netWorth} />
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
    gap: S,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S * 2,
    marginTop: S * 0.5,
  },
  lastUpdated: {
    color: colors.textMuted,
    fontWeight: '500',
    opacity: 0.7,
    marginTop: S * 0.5,
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
  skeletonHero: {
    padding: S * 2.5,
    borderRadius: 16,
    marginBottom: S * 3,
    backgroundColor: 'rgba(26, 26, 28, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  skeletonCard: {
    padding: S * 2,
    borderRadius: 16,
    marginBottom: S * 3,
    backgroundColor: 'rgba(26, 26, 28, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  skeletonActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: S * 1.75,
    borderRadius: 12,
    marginBottom: S * 1.25,
    backgroundColor: 'rgba(20, 20, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
