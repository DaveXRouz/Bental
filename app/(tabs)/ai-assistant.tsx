import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Linking,
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Target,
  AlertCircle,
  Calendar,
  Sparkles,
  Settings,
  Play,
  Pause,
  BarChart3,
  Zap,
  Info,
  ChevronRight,
  Activity,
  Clock,
  TrendingUpIcon,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useBotDashboard } from '@/hooks/useBotDashboard';
import { useBotTrades } from '@/hooks/useBotTrades';
import { useBotKPIs } from '@/hooks/useBotKPIs';
import { useInsights } from '@/hooks/useInsights';
import { useGuardrails } from '@/hooks/useGuardrails';
import { formatSmartCurrency, formatCompactCurrency } from '@/utils/formatting';
import BotConfigurationSetup from '@/components/bot/BotConfigurationSetup';
import { colors, shadows, radius, spacing } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const CALENDLY_URL = process.env.EXPO_PUBLIC_CALENDLY_URL || '';

export default function AIAssistantScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(true);
  const [selectedInsightFilter, setSelectedInsightFilter] = useState<string>('all');

  const { bot, allocation, loading, refresh } = useBotDashboard(user?.id);
  const botKey = allocation?.bot_key || bot?.key || null;

  const { trades } = useBotTrades(user?.id, botKey, '1D', 6);
  const kpis = useBotKPIs(user?.id, botKey, allocation?.allocated_amount || 0);
  const { insights } = useInsights(user?.id, botKey);
  const guardrails = useGuardrails(
    user?.id,
    botKey,
    allocation?.current_value || 0,
    allocation?.allocated_amount || 0
  );

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleScheduleCall = () => {
    Linking.openURL(CALENDLY_URL);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(59,130,246,0.15)', 'rgba(139,92,246,0.15)', 'transparent']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.loadingContainer}>
          <Sparkles size={48} color="#3B82F6" />
          <Text style={styles.loadingText}>Loading AI Bot...</Text>
        </View>
      </View>
    );
  }

  if (!allocation || !bot) {
    if (showConfiguration && user?.id) {
      return (
        <BotConfigurationSetup
          userId={user.id}
          onComplete={() => {
            setShowConfiguration(false);
            refresh();
          }}
        />
      );
    }

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(59,130,246,0.15)', 'rgba(139,92,246,0.15)', 'transparent']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <Animated.View style={[styles.floatingOrb1, animatedStyle1]}>
          <LinearGradient
            colors={['rgba(59,130,246,0.4)', 'rgba(139,92,246,0.4)']}
            style={styles.orb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <Animated.View style={[styles.floatingOrb2, animatedStyle2]}>
          <LinearGradient
            colors={['rgba(139,92,246,0.3)', 'rgba(236,72,153,0.3)']}
            style={styles.orb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <Animated.View style={[styles.floatingOrb3, animatedStyle3]}>
          <LinearGradient
            colors={['rgba(236,72,153,0.25)', 'rgba(59,130,246,0.25)']}
            style={styles.orb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.setupContent}
          accessible={true}
          accessibilityLabel="AI Bot setup content"
        >
          <BlurView intensity={60} tint="dark" style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(59,130,246,0.1)', 'rgba(139,92,246,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.iconContainer}>
              <Sparkles size={56} color="#3B82F6" />
            </View>
            <Text style={styles.heroTitle}>AI Trading Assistant</Text>
            <Text style={styles.heroSubtitle}>
              Experience autonomous trading powered by advanced machine learning algorithms
            </Text>

            <View style={styles.benefits}>
              <BlurView intensity={40} tint="dark" style={styles.benefit}>
                <Target size={20} color="#10B981" />
                <Text style={styles.benefitText}>24/7 Autonomous Trading</Text>
              </BlurView>
              <BlurView intensity={40} tint="dark" style={styles.benefit}>
                <Shield size={20} color="#3B82F6" />
                <Text style={styles.benefitText}>Advanced Risk Controls</Text>
              </BlurView>
              <BlurView intensity={40} tint="dark" style={styles.benefit}>
                <TrendingUp size={20} color="#8B5CF6" />
                <Text style={styles.benefitText}>Adaptive Strategies</Text>
              </BlurView>
              <BlurView intensity={40} tint="dark" style={styles.benefit}>
                <Zap size={20} color="#F59E0B" />
                <Text style={styles.benefitText}>Real-time Optimization</Text>
              </BlurView>
            </View>

            <TouchableOpacity
              style={styles.setupButton}
              activeOpacity={0.8}
              onPress={() => setShowConfiguration(true)}
            >
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                style={styles.setupButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.setupButtonText}>Get Started</Text>
                <ChevronRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.7} onPress={handleScheduleCall}>
              <Calendar size={16} color="#3B82F6" />
              <Text style={styles.scheduleButtonText}>Schedule Consultation</Text>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </View>
    );
  }

  const isDayProfit = kpis.todayPL >= 0;
  const isMTDProfit = kpis.mtdReturn >= 0;
  const insightTags = Array.from(new Set(insights.flatMap(i => i.tags)));
  const filteredInsights = selectedInsightFilter === 'all'
    ? insights
    : insights.filter(i => i.tags.includes(selectedInsightFilter));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(59,130,246,0.15)', 'rgba(139,92,246,0.15)', 'transparent']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.floatingOrb1, animatedStyle1]}>
        <LinearGradient
          colors={['rgba(59,130,246,0.4)', 'rgba(139,92,246,0.4)']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.floatingOrb2, animatedStyle2]}>
        <LinearGradient
          colors={['rgba(139,92,246,0.3)', 'rgba(236,72,153,0.3)']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.floatingOrb3, animatedStyle3]}>
        <LinearGradient
          colors={['rgba(236,72,153,0.25)', 'rgba(59,130,246,0.25)']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.header} accessible={true} accessibilityLabel="AI Assistant page header">
        <View>
          <Text style={styles.headerSubtitle}>My AI Bot</Text>
          <Text style={styles.headerTitle}>{bot.name}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <BlurView intensity={40} tint="dark" style={styles.settingsButtonInner}>
            <Settings size={20} color="#FFFFFF" />
          </BlurView>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        accessible={true}
        accessibilityLabel="AI Assistant main content"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
        showsVerticalScrollIndicator={false}
      >
        <BlurView intensity={60} tint="dark" style={styles.statusCard}>
          <LinearGradient
            colors={['rgba(59,130,246,0.1)', 'rgba(139,92,246,0.05)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.statusContent}>
            <View style={styles.statusLeft}>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, allocation.status === 'active' && styles.statusDotActive]} />
                <Text style={styles.statusText}>
                  {allocation.status === 'active' ? 'Active' : 'Paused'}
                </Text>
              </View>
              <Text style={styles.statusStrategy}>{bot.strategy || 'Momentum Trading'}</Text>
            </View>
            <View style={styles.statusRight}>
              <Text style={styles.statusLabel}>Allocation</Text>
              <Text style={styles.statusValue}>{formatCompactCurrency(allocation.allocated_amount)}</Text>
            </View>
          </View>
        </BlurView>

        <View style={styles.kpiGrid}>
          <BlurView intensity={60} tint="dark" style={styles.kpiCard}>
            <LinearGradient
              colors={isDayProfit ? ['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.05)'] : ['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.kpiIconContainer}>
              <Activity size={18} color={isDayProfit ? '#10B981' : '#EF4444'} />
            </View>
            <Text style={styles.kpiLabel}>Today P/L</Text>
            <Text style={[styles.kpiValue, isDayProfit ? styles.profitText : styles.lossText]}>
              {isDayProfit ? '+' : ''}{formatCompactCurrency(kpis.todayPL)}
            </Text>
            <Text style={[styles.kpiSubtext, isDayProfit ? styles.profitText : styles.lossText]}>
              {isDayProfit ? '+' : ''}{kpis.todayPLPct.toFixed(2)}%
            </Text>
          </BlurView>

          <BlurView intensity={60} tint="dark" style={styles.kpiCard}>
            <LinearGradient
              colors={isMTDProfit ? ['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.05)'] : ['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.kpiIconContainer}>
              <TrendingUpIcon size={18} color={isMTDProfit ? '#10B981' : '#EF4444'} />
            </View>
            <Text style={styles.kpiLabel}>MTD Return</Text>
            <Text style={[styles.kpiValue, isMTDProfit ? styles.profitText : styles.lossText]}>
              {isMTDProfit ? '+' : ''}{formatCompactCurrency(kpis.mtdReturn)}
            </Text>
            <Text style={[styles.kpiSubtext, isMTDProfit ? styles.profitText : styles.lossText]}>
              {isMTDProfit ? '+' : ''}{kpis.mtdReturnPct.toFixed(2)}%
            </Text>
          </BlurView>

          <BlurView intensity={60} tint="dark" style={styles.kpiCard}>
            <LinearGradient
              colors={['rgba(59,130,246,0.1)', 'rgba(59,130,246,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.kpiIconContainer}>
              <Target size={18} color="#3B82F6" />
            </View>
            <Text style={styles.kpiLabel}>Win Rate</Text>
            <Text style={styles.kpiValue}>{kpis.winRate.toFixed(0)}%</Text>
            <Text style={styles.kpiSubtext}>{kpis.tradesCount} trades</Text>
          </BlurView>

          <BlurView intensity={60} tint="dark" style={styles.kpiCard}>
            <LinearGradient
              colors={['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.kpiIconContainer}>
              <Shield size={18} color="#EF4444" />
            </View>
            <Text style={styles.kpiLabel}>Max DD</Text>
            <Text style={styles.kpiValue}>{kpis.maxDD.toFixed(1)}%</Text>
            <Text style={styles.kpiSubtext}>MTD</Text>
          </BlurView>
        </View>

        <BlurView intensity={60} tint="dark" style={styles.controlCard}>
          <LinearGradient
            colors={['rgba(59,130,246,0.08)', 'rgba(139,92,246,0.04)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.controlRow}>
            <View style={styles.controlLeft}>
              <Zap size={20} color="#F59E0B" />
              <View>
                <Text style={styles.controlTitle}>Auto Trading</Text>
                <Text style={styles.controlSubtitle}>AI makes decisions automatically</Text>
              </View>
            </View>
            <Switch
              value={autoTradeEnabled}
              onValueChange={setAutoTradeEnabled}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </BlurView>

        {trades.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Clock size={18} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Recent Activity</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{trades.length}</Text>
              </View>
            </View>

            {trades.map(trade => {
              const isProfit = trade.profit_loss >= 0;
              return (
                <TouchableOpacity key={trade.id} activeOpacity={0.8}>
                  <BlurView intensity={60} tint="dark" style={styles.tradeCard}>
                    <LinearGradient
                      colors={isProfit ? ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.04)'] : ['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.04)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.tradeContent}>
                      <View style={styles.tradeHeader}>
                        <View style={styles.tradeSymbol}>
                          <Text style={styles.tradeSymbolText}>{trade.symbol}</Text>
                          <View style={[styles.tradeBadge, trade.side === 'buy' ? styles.tradeBuyBadge : styles.tradeSellBadge]}>
                            <Text style={styles.tradeBadgeText}>{trade.side.toUpperCase()}</Text>
                          </View>
                        </View>
                        <View style={styles.tradePL}>
                          {isProfit ? (
                            <TrendingUp size={14} color="#10B981" />
                          ) : (
                            <TrendingDown size={14} color="#EF4444" />
                          )}
                          <Text style={[styles.tradePLText, isProfit ? styles.profitText : styles.lossText]}>
                            {isProfit ? '+' : ''}{formatCompactCurrency(trade.profit_loss)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.tradeDetails}>
                        <Text style={styles.tradeDetailText}>
                          {trade.qty} @ ${trade.entry_price.toFixed(2)}
                        </Text>
                        <Text style={[styles.tradePercentText, isProfit ? styles.profitText : styles.lossText]}>
                          {isProfit ? '+' : ''}{trade.pl_pct.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={18} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>AI Insights</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {insightTags.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, selectedInsightFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setSelectedInsightFilter('all')}
                >
                  <BlurView intensity={40} tint="dark" style={styles.filterChipInner}>
                    <Text style={[styles.filterChipText, selectedInsightFilter === 'all' && styles.filterChipTextActive]}>
                      All
                    </Text>
                  </BlurView>
                </TouchableOpacity>
                {insightTags.slice(0, 5).map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.filterChip, selectedInsightFilter === tag && styles.filterChipActive]}
                    onPress={() => setSelectedInsightFilter(tag)}
                  >
                    <BlurView intensity={40} tint="dark" style={styles.filterChipInner}>
                      <Text style={[styles.filterChipText, selectedInsightFilter === tag && styles.filterChipTextActive]}>
                        {tag}
                      </Text>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {filteredInsights.slice(0, 5).map(insight => (
              <TouchableOpacity key={insight.id} activeOpacity={0.8}>
                <BlurView intensity={60} tint="dark" style={styles.insightCard}>
                  <LinearGradient
                    colors={['rgba(139,92,246,0.08)', 'rgba(139,92,246,0.04)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.insightContent}>
                    <View style={styles.insightHeader}>
                      <View style={styles.insightIcon}>
                        <Sparkles size={16} color="#8B5CF6" />
                      </View>
                      <View style={styles.insightText}>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <Text style={styles.insightBody} numberOfLines={2}>
                          {insight.body}
                        </Text>
                        {insight.tags.length > 0 && (
                          <View style={styles.insightTags}>
                            {insight.tags.slice(0, 2).map(tag => (
                              <View key={tag} style={styles.insightTag}>
                                <Text style={styles.insightTagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      {!insight.is_read && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {guardrails.breaches.length > 0 && (
          <BlurView intensity={60} tint="dark" style={styles.alertCard}>
            <LinearGradient
              colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.08)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.alertContent}>
              <AlertCircle size={22} color="#EF4444" />
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>Risk Alert</Text>
                <Text style={styles.alertBody}>{guardrails.breaches.join(', ')}</Text>
              </View>
            </View>
          </BlurView>
        )}

        <BlurView intensity={60} tint="dark" style={styles.riskCard}>
          <LinearGradient
            colors={['rgba(59,130,246,0.08)', 'rgba(139,92,246,0.04)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.riskHeader}>
            <Shield size={20} color="#3B82F6" />
            <Text style={styles.riskTitle}>Risk Management</Text>
          </View>
          <View style={styles.riskMetrics}>
            <View style={styles.riskMetricItem}>
              <Text style={styles.riskMetricLabel}>Current DD</Text>
              <Text style={styles.riskMetricValue}>{guardrails.currentDD.toFixed(1)}%</Text>
            </View>
            <View style={styles.riskMetricItem}>
              <Text style={styles.riskMetricLabel}>Max DD</Text>
              <Text style={styles.riskMetricValue}>{guardrails.maxDD.toFixed(1)}%</Text>
            </View>
            <View style={styles.riskMetricItem}>
              <Text style={styles.riskMetricLabel}>Max Position</Text>
              <Text style={styles.riskMetricValue}>{guardrails.maxPos.toFixed(1)}%</Text>
            </View>
          </View>
        </BlurView>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BlurView intensity={80} tint="dark" style={styles.footer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.footerContent}>
          <TouchableOpacity style={styles.footerButton} activeOpacity={0.8}>
            <BlurView intensity={40} tint="dark" style={styles.footerButtonInner}>
              <DollarSign size={18} color="#FFFFFF" />
              <Text style={styles.footerButtonText}>Add Funds</Text>
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} activeOpacity={0.8}>
            <BlurView intensity={40} tint="dark" style={styles.footerButtonInner}>
              <BarChart3 size={18} color="#FFFFFF" />
              <Text style={styles.footerButtonText}>Analytics</Text>
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButtonPrimary} activeOpacity={0.8}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              style={styles.footerButtonPrimaryInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Info size={18} color="#FFFFFF" />
              <Text style={styles.footerButtonPrimaryText}>Contact AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BlurView>
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
    height: height * 0.5,
    zIndex: 0,
  },
  floatingOrb1: {
    position: 'absolute',
    top: 80,
    right: -100,
    width: 280,
    height: 280,
    zIndex: 1,
  },
  floatingOrb2: {
    position: 'absolute',
    top: 300,
    left: -120,
    width: 320,
    height: 320,
    zIndex: 1,
  },
  floatingOrb3: {
    position: 'absolute',
    bottom: 200,
    right: -80,
    width: 240,
    height: 240,
    zIndex: 1,
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
    paddingHorizontal: isTablet ? 32 : 16,
    zIndex: 2,
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
  settingsButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  settingsButtonInner: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 2,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  setupContent: {
    paddingHorizontal: isTablet ? 32 : 16,
    paddingTop: isTablet ? 100 : 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: isTablet ? 600 : undefined,
    borderRadius: radius.xl,
    padding: isTablet ? 32 : 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.glass3D,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(59,130,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: isTablet ? 15 : 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: isTablet ? 22 : 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  benefits: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  setupButton: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 16,
    ...shadows.glass,
  },
  setupButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  setupButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  scheduleButtonText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
  },
  statusCard: {
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.glass,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  statusStrategy: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusRight: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: (width - 60) / 2,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.glass,
  },
  kpiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  kpiSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  profitText: {
    color: '#10B981',
  },
  lossText: {
    color: '#EF4444',
  },
  controlCard: {
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.glass,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  controlTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  controlSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.2)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterChip: {
    marginRight: 8,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  filterChipActive: {
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  filterChipInner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#3B82F6',
  },
  tradeCard: {
    borderRadius: radius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  tradeContent: {
    padding: 16,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tradeSymbolText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  tradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tradeBuyBadge: {
    backgroundColor: 'rgba(59,130,246,0.2)',
  },
  tradeSellBadge: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  tradeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  tradePL: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tradePLText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tradeDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tradePercentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  insightCard: {
    borderRadius: radius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  insightContent: {
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  insightBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  insightTags: {
    flexDirection: 'row',
    gap: 6,
  },
  insightTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  insightTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  alertCard: {
    borderRadius: radius.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    overflow: 'hidden',
    ...shadows.md,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 4,
  },
  alertBody: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  riskCard: {
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.glass,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  riskMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  riskMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  riskMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  riskMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: GLASS.border,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  footerContent: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  footerButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  footerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  footerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  footerButtonPrimary: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.glass,
  },
  footerButtonPrimaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  footerButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
});
