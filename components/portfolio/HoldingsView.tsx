import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, Typography } from '@/constants/theme';
import { formatCurrency, formatNumber, safeNumber, safePercentage } from '@/utils/formatting';
import { sortHoldings, getSortPreference, setSortPreference, SortOption } from '@/utils/sorting';
import PositionDetailModal from '@/components/modals/PositionDetailModal';
import TradingModal from '@/components/modals/TradingModal';
import SortDropdown from './SortDropdown';
import { CurrencyDisplay, PercentageDisplay, NumberText } from '@/components/ui';
import { useAccountContext } from '@/contexts/AccountContext';
import { usePendingSellOrders } from '@/hooks/usePortfolioOperations';
import { formatDistance } from 'date-fns';
import { getHoldingsWithAvailability } from '@/services/portfolio/portfolio-operations-service';

export default function HoldingsView() {
  const { user } = useAuth();
  const { selectedAccounts } = useAccountContext();
  const { pendingOrders, loading: ordersLoading, refresh: refreshPendingOrders } = usePendingSellOrders(user?.id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalGainLoss, setTotalGainLoss] = useState(0);
  const [totalGainLossPercent, setTotalGainLossPercent] = useState(0);
  const [selectedHolding, setSelectedHolding] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('value');

  // Trading modal state
  const [tradingModalVisible, setTradingModalVisible] = useState(false);
  const [tradingMode, setTradingMode] = useState<'buy' | 'sell'>('buy');
  const [tradingSymbol, setTradingSymbol] = useState('');
  const [tradingAssetType, setTradingAssetType] = useState<'stock' | 'crypto' | 'etf' | 'bond'>('stock');
  const [tradingPrice, setTradingPrice] = useState(0);
  const [tradingAvailableQty, setTradingAvailableQty] = useState(0);

  const fetchHoldings = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Use selected accounts from context instead of fetching all accounts
      const accountsToFetch = selectedAccounts.length > 0 ? selectedAccounts : [];

      if (accountsToFetch.length === 0) {
        // No accounts selected, show empty state
        setHoldings([]);
        setTotalValue(0);
        setTotalGainLoss(0);
        setTotalGainLossPercent(0);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch holdings with availability info for selected accounts
      const holdingsPromises = accountsToFetch.map(account =>
        getHoldingsWithAvailability(account.id)
      );
      const holdingsArrays = await Promise.all(holdingsPromises);
      const holdingsData = holdingsArrays.flat();

      if (holdingsData) {
        const sorted = sortHoldings(holdingsData, sortBy);

        setHoldings(sorted);

        const total = sorted.reduce((sum, h) => sum + Number(h.market_value), 0);
        setTotalValue(total);

        const totalCost = sorted.reduce((sum, h) =>
          sum + (Number(h.quantity) * Number(h.average_cost)), 0
        );
        const gainLoss = total - totalCost;
        const gainLossPercent = totalCost > 0 ? ((gainLoss / totalCost) * 100) : 0;

        setTotalGainLoss(gainLoss);
        setTotalGainLossPercent(gainLossPercent);
      }
    } catch (error) {
      console.error('[Holdings] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedAccounts, sortBy]);

  useEffect(() => {
    const loadSortPreference = async () => {
      const pref = await getSortPreference();
      setSortBy(pref);
    };
    loadSortPreference();
  }, []);

  useEffect(() => {
    fetchHoldings();
    refreshPendingOrders();
  }, [fetchHoldings, refreshPendingOrders]);

  const handleSortChange = async (newSort: SortOption) => {
    setSortBy(newSort);
    await setSortPreference(newSort);
    const sorted = sortHoldings(holdings, newSort);
    setHoldings(sorted);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHoldings();
    refreshPendingOrders();
  }, [fetchHoldings, refreshPendingOrders]);

  const isPositive = totalGainLoss >= 0;

  const handleHoldingPress = (holding: any) => {
    setSelectedHolding(holding);
    setModalVisible(true);
  };

  const handleBuyAssets = () => {
    // For now, we'll open with BTC as a default. In the future, this could open an asset search modal
    setTradingMode('buy');
    setTradingSymbol('BTC');
    setTradingAssetType('crypto');
    setTradingPrice(67234.56); // Would come from real-time price feed
    setTradingAvailableQty(0);
    setTradingModalVisible(true);
  };

  const handleSellAssets = (holding?: any) => {
    if (holding) {
      // Selling a specific holding - use available quantity
      const availableQty = safeNumber(holding.available_quantity);
      const totalQty = safeNumber(holding.quantity);
      const marketVal = safeNumber(holding.market_value);
      const currentPrice = totalQty > 0 ? marketVal / totalQty : 0;

      setTradingMode('sell');
      setTradingSymbol(holding.symbol);
      setTradingAssetType(holding.asset_type || 'stock');
      setTradingPrice(currentPrice);
      setTradingAvailableQty(availableQty); // Use available, not total
      setTradingModalVisible(true);
    } else if (holdings.length > 0) {
      // No specific holding selected, use the first one as default
      const firstHolding = holdings[0];
      const availableQty = safeNumber(firstHolding.available_quantity);
      const totalQty = safeNumber(firstHolding.quantity);
      const marketVal = safeNumber(firstHolding.market_value);
      const currentPrice = totalQty > 0 ? marketVal / totalQty : 0;

      setTradingMode('sell');
      setTradingSymbol(firstHolding.symbol);
      setTradingAssetType(firstHolding.asset_type || 'stock');
      setTradingPrice(currentPrice);
      setTradingAvailableQty(availableQty); // Use available, not total
      setTradingModalVisible(true);
    }
  };

  const handleCloseTradingModal = () => {
    setTradingModalVisible(false);
    // Refresh holdings after a trade
    fetchHoldings();
  };

  return (
    <>
      <PositionDetailModal
        visible={modalVisible}
        holding={selectedHolding}
        onClose={() => {
          setModalVisible(false);
          setSelectedHolding(null);
        }}
        onSell={(holding) => {
          setModalVisible(false);
          handleSellAssets(holding);
        }}
      />
      <TradingModal
        visible={tradingModalVisible}
        onClose={handleCloseTradingModal}
        symbol={tradingSymbol}
        assetType={tradingAssetType}
        currentPrice={tradingPrice}
        mode={tradingMode}
        availableQuantity={tradingAvailableQty}
      />
      <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
      }
      showsVerticalScrollIndicator={false}
    >
      <BlurView intensity={20} tint="dark" style={styles.summaryCard}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradient}
        >
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Holdings Value</Text>
            <CurrencyDisplay
              value={totalValue}
              size="large"
              style={styles.summaryValue}
            />

            <View style={styles.gainLossContainer}>
              {isPositive ? (
                <TrendingUp size={20} color="#10B981" />
              ) : (
                <TrendingDown size={20} color="#EF4444" />
              )}
              <CurrencyDisplay
                value={totalGainLoss}
                showSign
                color={isPositive ? colors.success : colors.danger}
                style={styles.gainLossText}
              />
              <Text style={[styles.gainLossText, isPositive ? styles.positive : styles.negative]}>
                {' '}(
              </Text>
              <PercentageDisplay
                value={totalGainLossPercent}
                colorize
                style={styles.gainLossText}
              />
              <Text style={[styles.gainLossText, isPositive ? styles.positive : styles.negative]}>
                )
              </Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>

      <View style={styles.tradeButtons}>
        <TouchableOpacity
          style={[styles.tradeButton, styles.buyButton]}
          activeOpacity={0.7}
          onPress={handleBuyAssets}
        >
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={styles.tradeButtonText}>Buy Assets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tradeButton, styles.sellButton]}
          activeOpacity={0.7}
          onPress={() => handleSellAssets()}
          disabled={holdings.length === 0}
        >
          <DollarSign size={20} color="#FFFFFF" />
          <Text style={styles.tradeButtonText}>Sell Assets</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Sell Orders Section */}
      {pendingOrders.length > 0 && (
        <View style={styles.pendingOrdersSection}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={colors.warning} />
            <Text style={styles.sectionTitle}>Pending Sell Orders ({pendingOrders.length})</Text>
          </View>

          {pendingOrders.map((order) => {
            const getStatusIcon = () => {
              switch (order.status) {
                case 'approved':
                  return <CheckCircle2 size={16} color={colors.success} />;
                case 'rejected':
                  return <XCircle size={16} color={colors.danger} />;
                case 'cancelled':
                  return <XCircle size={16} color={colors.textMuted} />;
                default:
                  return <Clock size={16} color={colors.warning} />;
              }
            };

            const getStatusColor = () => {
              switch (order.status) {
                case 'approved':
                  return colors.success;
                case 'rejected':
                  return colors.danger;
                case 'cancelled':
                  return colors.textMuted;
                default:
                  return colors.warning;
              }
            };

            return (
              <BlurView key={order.id} intensity={12} tint="dark" style={styles.pendingOrderCard}>
                <View style={styles.pendingOrderHeader}>
                  <View style={styles.pendingOrderLeft}>
                    <TrendingDown size={18} color={colors.danger} />
                    <View>
                      <Text style={styles.pendingOrderSymbol}>{order.symbol}</Text>
                      <Text style={styles.pendingOrderQuantity}>{order.quantity} shares</Text>
                    </View>
                  </View>
                  <View style={styles.pendingOrderRight}>
                    <View style={styles.statusBadge}>
                      {getStatusIcon()}
                      <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pendingOrderDetails}>
                  <View style={styles.pendingDetailRow}>
                    <Text style={styles.pendingDetailLabel}>Estimated Value</Text>
                    <CurrencyDisplay
                      value={order.estimated_total}
                      size="small"
                      style={styles.pendingDetailValue}
                    />
                  </View>
                  <View style={styles.pendingDetailRow}>
                    <Text style={styles.pendingDetailLabel}>Submitted</Text>
                    <Text style={styles.pendingDetailValue}>
                      {formatDistance(new Date(order.submitted_at), new Date(), { addSuffix: true })}
                    </Text>
                  </View>
                  {order.rejection_reason && (
                    <View style={styles.rejectionNotice}>
                      <AlertCircle size={14} color={colors.danger} />
                      <Text style={styles.rejectionText}>{order.rejection_reason}</Text>
                    </View>
                  )}
                </View>
              </BlurView>
            );
          })}
        </View>
      )}

      {holdings.length > 0 && (
        <View style={styles.sortContainer}>
          <Text style={styles.holdingsCount}>{holdings.length} Holdings</Text>
          <SortDropdown selectedSort={sortBy} onSortChange={handleSortChange} />
        </View>
      )}

      {holdings.length === 0 ? (
        <BlurView intensity={12} tint="dark" style={styles.emptyState}>
          <Text style={styles.emptyText}>No holdings yet</Text>
          <Text style={styles.emptySubtext}>Start investing to build your portfolio</Text>
        </BlurView>
      ) : (
        holdings.map((holding) => {
          const marketVal = safeNumber(holding.market_value);
          const quantity = safeNumber(holding.quantity);
          const availableQty = safeNumber(holding.available_quantity);
          const lockedQty = safeNumber(holding.locked_quantity);
          const avgCost = safeNumber(holding.average_cost);
          const costBasis = quantity * avgCost;
          const gainLoss = marketVal - costBasis;
          const gainLossPct = costBasis > 0 ? ((marketVal / costBasis) - 1) * 100 : 0;
          const isPositive = gainLoss >= 0;
          const currentPrice = quantity > 0 ? marketVal / quantity : 0;
          const hasLockedQty = lockedQty > 0;

          return (
            <TouchableOpacity key={holding.id} activeOpacity={0.7} onPress={() => handleHoldingPress(holding)}>
              <BlurView intensity={12} tint="dark" style={styles.holdingCard}>
                <View style={styles.holdingHeader}>
                  <View style={styles.holdingSymbol}>
                    <Text style={styles.symbolText}>{holding.symbol}</Text>
                  </View>
                  <View style={styles.holdingInfo}>
                    <Text style={styles.holdingName}>{holding.symbol}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <NumberText
                        value={quantity.toFixed(2)}
                        variant="quantity"
                        suffix=" shares"
                        style={styles.holdingShares}
                        color={colors.textMuted}
                      />
                      {hasLockedQty && (
                        <Text style={styles.lockedBadge}>
                          ({availableQty.toFixed(2)} available)
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.holdingValue}>
                    <CurrencyDisplay
                      value={marketVal}
                      size="medium"
                      style={styles.holdingAmount}
                    />
                    <PercentageDisplay
                      value={gainLossPct}
                      colorize
                      size="small"
                      style={styles.holdingGain}
                    />
                  </View>
                </View>

                <View style={styles.holdingDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Current Price</Text>
                    <CurrencyDisplay
                      value={currentPrice}
                      size="small"
                      style={styles.detailValue}
                    />
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Avg Cost</Text>
                    <CurrencyDisplay
                      value={avgCost}
                      size="small"
                      style={styles.detailValue}
                    />
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Gain/Loss</Text>
                    <CurrencyDisplay
                      value={gainLoss}
                      showSign
                      size="small"
                      color={isPositive ? colors.success : colors.danger}
                      style={styles.detailValue}
                    />
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  summaryCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryGradient: {
    padding: 24,
  },
  summaryContent: {
    gap: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  gainLossContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gainLossText: {
    fontSize: 16,
    fontWeight: '600',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  tradeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  buyButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  sellButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  tradeButtonText: {
    fontSize: 15,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  holdingsCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  holdingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  holdingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  holdingSymbol: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  holdingInfo: {
    flex: 1,
  },
  holdingName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  holdingShares: {
    fontSize: 13,
    color: colors.textMuted,
  },
  lockedBadge: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600',
  },
  holdingValue: {
    alignItems: 'flex-end',
  },
  holdingAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  holdingGain: {
    fontSize: 14,
    fontWeight: '600',
  },
  holdingDetails: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  pendingOrdersSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  pendingOrderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  pendingOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingOrderSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  pendingOrderQuantity: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pendingOrderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingOrderDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  pendingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingDetailLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pendingDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  rejectionNotice: {
    flexDirection: 'row',
    gap: 6,
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    marginTop: 4,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 16,
  },
});
