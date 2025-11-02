import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, Typography } from '@/constants/theme';
import { formatCurrency, formatNumber, safeNumber, safePercentage } from '@/utils/formatting';
import { sortHoldings, getSortPreference, setSortPreference, SortOption } from '@/utils/sorting';
import PositionDetailModal from '@/components/modals/PositionDetailModal';
import SortDropdown from './SortDropdown';

export default function HoldingsView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalGainLoss, setTotalGainLoss] = useState(0);
  const [totalGainLossPercent, setTotalGainLossPercent] = useState(0);
  const [selectedHolding, setSelectedHolding] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('value');

  const fetchHoldings = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id);

      if (accounts && accounts.length > 0) {
        const accountIds = accounts.map(a => a.id);

        const { data: holdingsData } = await supabase
          .from('holdings')
          .select('*')
          .in('account_id', accountIds);

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
      }
    } catch (error) {
      console.error('[Holdings] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, sortBy]);

  useEffect(() => {
    const loadSortPreference = async () => {
      const pref = await getSortPreference();
      setSortBy(pref);
    };
    loadSortPreference();
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const handleSortChange = async (newSort: SortOption) => {
    setSortBy(newSort);
    await setSortPreference(newSort);
    const sorted = sortHoldings(holdings, newSort);
    setHoldings(sorted);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHoldings();
  }, [fetchHoldings]);

  const isPositive = totalGainLoss >= 0;

  const handleHoldingPress = (holding: any) => {
    setSelectedHolding(holding);
    setModalVisible(true);
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
            <Text style={styles.summaryValue}>{formatCurrency(totalValue, 2)}</Text>

            <View style={styles.gainLossContainer}>
              {isPositive ? (
                <TrendingUp size={20} color="#10B981" />
              ) : (
                <TrendingDown size={20} color="#EF4444" />
              )}
              <Text style={[styles.gainLossText, isPositive ? styles.positive : styles.negative]}>
                {isPositive ? '+' : ''}{formatCurrency(totalGainLoss, 2)} ({isPositive ? '+' : ''}{safePercentage(totalGainLossPercent)}%)
              </Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>

      <View style={styles.tradeButtons}>
        <TouchableOpacity style={[styles.tradeButton, styles.buyButton]} activeOpacity={0.7}>
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={styles.tradeButtonText}>Buy Assets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tradeButton, styles.sellButton]} activeOpacity={0.7}>
          <DollarSign size={20} color="#FFFFFF" />
          <Text style={styles.tradeButtonText}>Sell Assets</Text>
        </TouchableOpacity>
      </View>

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
          const avgCost = safeNumber(holding.average_cost);
          const costBasis = quantity * avgCost;
          const gainLoss = marketVal - costBasis;
          const gainLossPct = costBasis > 0 ? ((marketVal / costBasis) - 1) * 100 : 0;
          const isPositive = gainLoss >= 0;
          const currentPrice = quantity > 0 ? marketVal / quantity : 0;

          return (
            <TouchableOpacity key={holding.id} activeOpacity={0.7} onPress={() => handleHoldingPress(holding)}>
              <BlurView intensity={12} tint="dark" style={styles.holdingCard}>
                <View style={styles.holdingHeader}>
                  <View style={styles.holdingSymbol}>
                    <Text style={styles.symbolText}>{holding.symbol}</Text>
                  </View>
                  <View style={styles.holdingInfo}>
                    <Text style={styles.holdingName}>{holding.symbol}</Text>
                    <Text style={styles.holdingShares}>{formatNumber(quantity, 2)} shares</Text>
                  </View>
                  <View style={styles.holdingValue}>
                    <Text style={styles.holdingAmount}>{formatCurrency(marketVal, 2)}</Text>
                    <Text style={[styles.holdingGain, isPositive ? styles.positive : styles.negative]}>
                      {isPositive ? '+' : ''}{safePercentage(gainLossPct)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.holdingDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Current Price</Text>
                    <Text style={styles.detailValue}>{formatCurrency(currentPrice, 2)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Avg Cost</Text>
                    <Text style={styles.detailValue}>{formatCurrency(avgCost, 2)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Gain/Loss</Text>
                    <Text style={[styles.detailValue, isPositive ? styles.positive : styles.negative]}>
                      {isPositive ? '+' : ''}{formatCurrency(gainLoss, 2)}
                    </Text>
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
});
