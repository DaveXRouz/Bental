import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  TrendingDown,
  Search,
  ArrowRight,
  Flame,
  BarChart3,
  Globe,
  Star,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacing, shadows, zIndex } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { useWatchlist } from '@/hooks/useWatchlist';
import { SearchAutocomplete } from '@/components/markets/SearchAutocomplete';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: string;
}

const MOCK_INDICES: MarketIndex[] = [
  { symbol: 'SPY', name: 'S&P 500', price: 487.32, change: 5.42, changePercent: 1.12 },
  { symbol: 'QQQ', name: 'NASDAQ', price: 428.15, change: -2.18, changePercent: -0.51 },
  { symbol: 'DIA', name: 'DOW', price: 391.07, change: 3.21, changePercent: 0.83 },
];

const MOCK_TRENDING: Stock[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 892.45, change: 15.32, changePercent: 1.75, volume: '52.3M' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 242.18, change: -4.52, changePercent: -1.83, volume: '128.5M' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 189.25, change: 2.14, changePercent: 1.14, volume: '47.2M' },
  { symbol: 'MSFT', name: 'Microsoft', price: 412.08, change: 5.67, changePercent: 1.39, volume: '23.8M' },
  { symbol: 'GOOGL', name: 'Alphabet', price: 148.92, change: 1.83, changePercent: 1.24, volume: '21.4M' },
];

const MOCK_GAINERS: Stock[] = [
  { symbol: 'AMD', name: 'AMD', price: 167.45, change: 8.92, changePercent: 5.62 },
  { symbol: 'META', name: 'Meta', price: 478.32, change: 12.18, changePercent: 2.61 },
  { symbol: 'NFLX', name: 'Netflix', price: 568.74, change: 14.32, changePercent: 2.58 },
];

const MOCK_LOSERS: Stock[] = [
  { symbol: 'BA', name: 'Boeing', price: 187.42, change: -5.83, changePercent: -3.02 },
  { symbol: 'DIS', name: 'Disney', price: 92.15, change: -2.47, changePercent: -2.61 },
  { symbol: 'INTC', name: 'Intel', price: 42.83, change: -1.12, changePercent: -2.55 },
];

export default function MarketsScreen() {
  const { user } = useAuth();
  const { addToWatchlist } = useWatchlist(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [indices, setIndices] = useState<MarketIndex[]>(MOCK_INDICES);
  const [trending, setTrending] = useState<Stock[]>(MOCK_TRENDING);
  const [gainers, setGainers] = useState<Stock[]>(MOCK_GAINERS);
  const [losers, setLosers] = useState<Stock[]>(MOCK_LOSERS);

  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const floatY1 = useSharedValue(0);
  const floatY2 = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.25);

  useEffect(() => {
    const ultraSmoothEasing = Easing.bezier(0.34, 1.56, 0.64, 1);
    rotation1.value = withRepeat(withTiming(360, { duration: 50000, easing: Easing.linear }), -1, false);
    rotation2.value = withRepeat(withTiming(-360, { duration: 60000, easing: Easing.linear }), -1, false);
    floatY1.value = withRepeat(withTiming(40, { duration: 9000, easing: ultraSmoothEasing }), -1, true);
    floatY2.value = withRepeat(withTiming(-35, { duration: 8500, easing: ultraSmoothEasing }), -1, true);
    scale1.value = withRepeat(withTiming(1.15, { duration: 7000, easing: ultraSmoothEasing }), -1, true);
    scale2.value = withRepeat(withTiming(1.2, { duration: 7500, easing: ultraSmoothEasing }), -1, true);
    opacity1.value = withRepeat(withTiming(0.5, { duration: 6000, easing: ultraSmoothEasing }), -1, true);
    opacity2.value = withRepeat(withTiming(0.45, { duration: 5500, easing: ultraSmoothEasing }), -1, true);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY1.value },
      { rotateZ: `${rotation1.value}deg` },
      { scale: scale1.value },
    ],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY2.value },
      { rotateZ: `${rotation2.value}deg` },
      { scale: scale2.value },
    ],
    opacity: opacity2.value,
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAddToWatchlist = async (symbol: string) => {
    try {
      await addToWatchlist(symbol);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const renderStockCard = (stock: Stock, showVolume = false) => {
    const isPositive = stock.change >= 0;
    return (
      <TouchableOpacity key={stock.symbol} activeOpacity={0.8} style={styles.stockCard}>
        <BlurView intensity={60} tint="dark" style={styles.stockCardInner}>
          <LinearGradient
            colors={isPositive ? ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.04)'] : ['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.04)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.stockCardContent}>
            <View style={styles.stockLeft}>
              <Text style={styles.stockSymbol}>{stock.symbol}</Text>
              <Text style={styles.stockName} numberOfLines={1}>{stock.name}</Text>
              {showVolume && stock.volume && (
                <Text style={styles.stockVolume}>Vol: {stock.volume}</Text>
              )}
            </View>
            <View style={styles.stockRight}>
              <Text style={styles.stockPrice}>${stock.price.toFixed(2)}</Text>
              <View style={styles.stockChange}>
                {isPositive ? (
                  <TrendingUp size={12} color="#10B981" />
                ) : (
                  <TrendingDown size={12} color="#EF4444" />
                )}
                <Text style={[styles.stockChangeText, isPositive ? styles.positiveText : styles.negativeText]}>
                  {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToWatchlist(stock.symbol)}
              >
                <Star size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(59,130,246,0.12)', 'rgba(16,185,129,0.12)', 'transparent']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />

      <Animated.View style={[styles.floatingOrb1, animatedStyle1]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(59,130,246,0.35)', 'rgba(16,185,129,0.35)']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.floatingOrb2, animatedStyle2]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(16,185,129,0.3)', 'rgba(59,130,246,0.3)']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.header} accessible={true} accessibilityLabel="Markets page header">
        <View>
          <Text style={styles.headerSubtitle}>Explore</Text>
          <Text style={styles.headerTitle}>Markets</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Markets main content"
      >
        <View style={styles.searchContainer}>
          <SearchAutocomplete />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Market Indices</Text>
          </View>
          <View style={styles.indicesGrid}>
            {indices.map((index) => {
              const isPositive = index.change >= 0;
              return (
                <BlurView key={index.symbol} intensity={60} tint="dark" style={styles.indexCard}>
                  <LinearGradient
                    colors={['rgba(59,130,246,0.08)', 'rgba(59,130,246,0.04)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.indexSymbol}>{index.symbol}</Text>
                  <Text style={styles.indexName}>{index.name}</Text>
                  <Text style={styles.indexPrice}>${index.price.toFixed(2)}</Text>
                  <View style={styles.indexChange}>
                    {isPositive ? (
                      <TrendingUp size={14} color="#10B981" />
                    ) : (
                      <TrendingDown size={14} color="#EF4444" />
                    )}
                    <Text style={[styles.indexChangeText, isPositive ? styles.positiveText : styles.negativeText]}>
                      {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                    </Text>
                  </View>
                </BlurView>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Flame size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <ArrowRight size={14} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          {trending.map(stock => renderStockCard(stock, true))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Top Gainers</Text>
          </View>
          {gainers.map(stock => renderStockCard(stock))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingDown size={20} color="#EF4444" />
            <Text style={styles.sectionTitle}>Top Losers</Text>
          </View>
          {losers.map(stock => renderStockCard(stock))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: zIndex.background,
  },
  floatingOrb1: {
    position: 'absolute',
    top: 100,
    right: -100,
    width: 280,
    height: 280,
    zIndex: zIndex.background,
  },
  floatingOrb2: {
    position: 'absolute',
    top: 400,
    left: -120,
    width: 300,
    height: 300,
    zIndex: zIndex.background,
  },
  orb: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    zIndex: zIndex.content,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '700',
    color: colors.text,
  },
  searchButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  searchButtonInner: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  scrollView: {
    flex: 1,
    zIndex: zIndex.content,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? 32 : 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  searchContainer: {
    marginBottom: isTablet ? 24 : 16,
  },
  section: {
    marginBottom: isTablet ? 32 : 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  indicesGrid: {
    flexDirection: 'row',
    gap: isTablet ? 12 : 8,
    flexWrap: width < 768 ? 'wrap' : 'nowrap',
  },
  indexCard: {
    flex: 1,
    minWidth: width < 768 ? width * 0.28 : undefined,
    borderRadius: radius.xl,
    padding: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.glass,
  },
  indexSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  indexName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  indexPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  indexChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  indexChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockCard: {
    marginBottom: 12,
  },
  stockCardInner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  stockCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  stockLeft: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  stockName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  stockVolume: {
    fontSize: 11,
    color: colors.textMuted,
  },
  stockRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stockPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  stockChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  positiveText: {
    color: '#10B981',
  },
  negativeText: {
    color: '#EF4444',
  },
  addButton: {
    marginTop: 4,
    padding: 4,
  },
});
