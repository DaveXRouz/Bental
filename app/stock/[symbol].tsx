import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, TrendingUp, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react-native';
import { CartesianChart, Line } from 'victory-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency, formatPercent } from '@/utils/formatting';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { AdvancedStockChart } from '@/components/charts/AdvancedStockChart';

const { width } = Dimensions.get('window');

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

export default function StockDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<any>(null);
  const [chartData, setChartData] = useState<Array<{timestamp: number, price: number}>>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (symbol) {
      fetchStockData();
      checkWatchlist();
    }
  }, [symbol, timeRange]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: quote } = await supabase
        .from('market_quotes')
        .select('*')
        .eq('symbol', symbol)
        .single();

      if (quote) {
        setStockData({
          symbol: quote.symbol,
          name: quote.company_name || symbol,
          price: Number(quote.price),
          change: Number(quote.change),
          changePercent: Number(quote.change_percent),
          high: Number(quote.day_high || quote.price * 1.02),
          low: Number(quote.day_low || quote.price * 0.98),
          volume: Number(quote.volume || 0),
        });

        const mockChartData = generateMockChartData(Number(quote.price), timeRange);
        setChartData(mockChartData);
      } else {
        setError('Stock data not available');
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .maybeSingle();

      setInWatchlist(!!data);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async () => {
    if (!user?.id) return;

    try {
      if (inWatchlist) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol);
        setInWatchlist(false);
      } else {
        await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            symbol: symbol,
          });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const generateMockChartData = (currentPrice: number, range: TimeRange) => {
    const dataPoints: Record<TimeRange, number> = {
      '1D': 24,
      '1W': 7 * 24,
      '1M': 30,
      '3M': 90,
      '1Y': 365,
    };

    const points = dataPoints[range];
    const data: Array<{timestamp: number, price: number}> = [];
    let price = currentPrice * 0.95;
    const now = Date.now();
    const interval = range === '1D' ? 3600000 : range === '1W' ? 3600000 : 86400000; // 1 hour or 1 day

    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * (currentPrice * 0.02);
      price += change;
      data.push({
        timestamp: now - (points - i) * interval,
        price: Math.max(0, price),
      });
    }

    return data;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BlurView intensity={60} tint="dark" style={styles.backButtonInner}>
              <ArrowLeft size={20} color={colors.text} />
            </BlurView>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="Loading stock data..." />
        </View>
      </View>
    );
  }

  if (error || !stockData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BlurView intensity={60} tint="dark" style={styles.backButtonInner}>
              <ArrowLeft size={20} color={colors.text} />
            </BlurView>
          </TouchableOpacity>
        </View>
        <ErrorState
          type="server"
          message={error || 'Stock not found'}
          onRetry={fetchStockData}
        />
      </View>
    );
  }

  const isPositive = stockData.change >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <BlurView intensity={60} tint="dark" style={styles.backButtonInner}>
            <ArrowLeft size={20} color={colors.text} />
          </BlurView>
        </TouchableOpacity>
        <TouchableOpacity style={styles.watchlistButton} onPress={toggleWatchlist} activeOpacity={0.7}>
          <BlurView intensity={60} tint="dark" style={styles.watchlistButtonInner}>
            <Star size={20} color={inWatchlist ? '#F59E0B' : colors.textSecondary} fill={inWatchlist ? '#F59E0B' : 'none'} />
          </BlurView>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.stockHeader}>
          <Text style={styles.symbol}>{stockData.symbol}</Text>
          <Text style={styles.companyName}>{stockData.name}</Text>
          <Text style={styles.price}>{formatCurrency(stockData.price)}</Text>
          <View style={styles.changeContainer}>
            {isPositive ? <TrendingUp size={16} color="#10B981" /> : <TrendingDown size={16} color="#EF4444" />}
            <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
              {isPositive ? '+' : ''}{formatCurrency(stockData.change)} ({formatPercent(stockData.changePercent)})
            </Text>
          </View>
        </View>

        <View style={styles.timeRangeContainer}>
          {(['1D', '1W', '1M', '3M', '1Y'] as TimeRange[]).map(range => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange(range)}
              activeOpacity={0.7}
            >
              <BlurView intensity={timeRange === range ? 80 : 40} tint="dark" style={styles.timeRangeButtonInner}>
                <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
                  {range}
                </Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>

        <AdvancedStockChart
          data={chartData}
          symbol={stockData.symbol}
          showIndicators={true}
        />

        <BlurView intensity={40} tint="dark" style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Day High</Text>
            <Text style={styles.statValue}>{formatCurrency(stockData.high)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Day Low</Text>
            <Text style={styles.statValue}>{formatCurrency(stockData.low)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{stockData.volume.toLocaleString()}</Text>
          </View>
        </BlurView>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.actionButtonGradient}>
              <ShoppingCart size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Buy</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.actionButtonGradient}>
              <DollarSign size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Sell</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  backButtonInner: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  watchlistButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  watchlistButtonInner: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  stockHeader: {
    marginBottom: 24,
  },
  symbol: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  price: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  timeRangeButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  timeRangeButtonInner: {
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  timeRangeButtonActive: {},
  timeRangeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  timeRangeTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: GLASS.border,
    marginVertical: 16,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
