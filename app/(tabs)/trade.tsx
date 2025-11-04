import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { DataStreamBackground } from '@/components/backgrounds';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useQuote } from '@/hooks/useQuote';
import { colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatting';
import { useAppConfig } from '@/hooks/useAppConfig';
import { tradeExecutor } from '@/services/trading/trade-executor';
import TradeConfirmationModal from '@/components/modals/TradeConfirmationModal';
import { useToast } from '@/components/ui/ToastManager';

type OrderType = 'market' | 'limit' | 'stop';
type OrderSide = 'buy' | 'sell';

export default function TradeScreen() {
  const { user } = useAuth();
  const { trading_enabled } = useAppConfig();
  const { accounts } = useAccounts();
  const { showError, showSuccess } = useToast();
  const [symbol, setSymbol] = useState('');
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [timeInForce, setTimeInForce] = useState<'day' | 'gtc'>('day');
  const [extendedHours, setExtendedHours] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const primaryAccount = accounts.length > 0 ? accounts[0] : null;
  const { quote, loading: quoteLoading } = useQuote(symbol.trim().toUpperCase(), false);
  const currentPrice = quote?.price || 0;

  const handleSubmitOrder = async () => {
    if (!trading_enabled) {
      showError('Trading is temporarily disabled');
      return;
    }

    if (!primaryAccount) {
      showError('No active account found');
      return;
    }

    if (!symbol.trim()) {
      showError('Please enter a valid symbol');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      showError('Please enter a valid quantity');
      return;
    }

    if (!currentPrice && orderType === 'market') {
      showError('Unable to fetch current price');
      return;
    }

    // Validate trade before showing confirmation
    setIsValidating(true);
    const validation = await tradeExecutor.validateTrade(
      {
        symbol: symbol.trim().toUpperCase(),
        side: orderSide,
        quantity: parseFloat(quantity),
        orderType: orderType === 'stop' ? 'market' : orderType,
        limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
        accountId: primaryAccount.id,
      },
      user!.id
    );
    setIsValidating(false);

    if (!validation.valid) {
      showError(validation.error || 'Trade validation failed');
      return;
    }

    // Show confirmation modal
    setConfirmationVisible(true);
  };

  const handleConfirmTrade = async () => {
    try {
      const result = await tradeExecutor.executeTrade(
        {
          symbol: symbol.trim().toUpperCase(),
          side: orderSide,
          quantity: parseFloat(quantity),
          orderType: orderType === 'stop' ? 'market' : orderType,
          limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
          accountId: primaryAccount!.id,
        },
        user!.id
      );

      if (result.success) {
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
        showSuccess(result.message);
        // Reset form
        setSymbol('');
        setQuantity('');
        setLimitPrice('');
        setStopPrice('');
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message || 'Trade execution failed');
    }
  };

  const isFormValid = symbol.trim().length > 0 && parseFloat(quantity) > 0 && !isValidating;

  const executionPrice = orderType === 'limit' && limitPrice
    ? parseFloat(limitPrice)
    : currentPrice;

  const estimatedCost = parseFloat(quantity || '0') * executionPrice;

  return (
    <View style={styles.container}>
      <DataStreamBackground />

      <TradeConfirmationModal
        visible={confirmationVisible}
        onClose={() => setConfirmationVisible(false)}
        onConfirm={handleConfirmTrade}
        trade={{
          symbol: symbol.trim().toUpperCase(),
          side: orderSide,
          quantity: parseFloat(quantity || '0'),
          orderType: orderType === 'stop' ? 'market' : orderType,
          limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
          estimatedPrice: executionPrice,
          estimatedTotal: estimatedCost,
          fees: 0,
          buyingPower: primaryAccount ? Number(primaryAccount.balance) : 0,
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quick Trade</Text>
        <Text style={styles.headerSubtitle}>Place orders instantly</Text>
      </View>

      {!trading_enabled && (
        <View style={styles.disabledBanner}>
          <AlertCircle size={18} color="#ef4444" />
          <Text style={styles.disabledText}>
            Trading is temporarily disabled by admin
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BlurView intensity={20} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>Order Side</Text>
          <View style={styles.orderSideContainer}>
            <TouchableOpacity
              style={[
                styles.orderSideButton,
                orderSide === 'buy' && styles.orderSideBuyActive,
              ]}
              onPress={() => setOrderSide('buy')}
              activeOpacity={0.7}
            >
              <TrendingUp
                size={24}
                color={orderSide === 'buy' ? '#10B981' : colors.textMuted}
                strokeWidth={orderSide === 'buy' ? 2.5 : 2}
              />
              <Text
                style={[
                  styles.orderSideText,
                  orderSide === 'buy' && styles.orderSideBuyText,
                ]}
              >
                Buy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderSideButton,
                orderSide === 'sell' && styles.orderSideSellActive,
              ]}
              onPress={() => setOrderSide('sell')}
              activeOpacity={0.7}
            >
              <TrendingDown
                size={24}
                color={orderSide === 'sell' ? '#EF4444' : colors.textMuted}
                strokeWidth={orderSide === 'sell' ? 2.5 : 2}
              />
              <Text
                style={[
                  styles.orderSideText,
                  orderSide === 'sell' && styles.orderSideSellText,
                ]}
              >
                Sell
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        <BlurView intensity={20} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>Stock Symbol</Text>
          <View style={styles.inputContainer}>
            <Search size={20} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Enter symbol (e.g., AAPL)"
              placeholderTextColor={colors.textMuted}
              value={symbol}
              onChangeText={setSymbol}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          {symbol.trim() && currentPrice > 0 && (
            <View style={styles.priceDisplay}>
              <Text style={styles.priceLabel}>Current Price:</Text>
              <Text style={styles.priceValue}>{formatCurrency(currentPrice)}</Text>
            </View>
          )}
          {symbol.trim() && quoteLoading && (
            <Text style={styles.loadingText}>Fetching price...</Text>
          )}
        </BlurView>

        <BlurView intensity={20} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>Order Type</Text>
          <View style={styles.orderTypeContainer}>
            {(['market', 'limit', 'stop'] as OrderType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.orderTypeButton,
                  orderType === type && styles.orderTypeActive,
                ]}
                onPress={() => setOrderType(type)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === type && styles.orderTypeTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>

        <BlurView intensity={20} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>Quantity</Text>
          <View style={styles.inputContainer}>
            <DollarSign size={20} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Number of shares"
              placeholderTextColor={colors.textMuted}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
        </BlurView>

        {orderType === 'limit' && (
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>Limit Price</Text>
            <View style={styles.inputContainer}>
              <Percent size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Price per share"
                placeholderTextColor={colors.textMuted}
                value={limitPrice}
                onChangeText={setLimitPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </BlurView>
        )}

        {orderType === 'stop' && (
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>Stop Price</Text>
            <View style={styles.inputContainer}>
              <AlertCircle size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Trigger price"
                placeholderTextColor={colors.textMuted}
                value={stopPrice}
                onChangeText={setStopPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </BlurView>
        )}

        <BlurView intensity={20} tint="dark" style={styles.card}>
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Clock size={20} color={colors.textMuted} />
              <Text style={styles.optionLabel}>Time in Force</Text>
            </View>
            <View style={styles.optionRight}>
              <TouchableOpacity
                style={[
                  styles.tifButton,
                  timeInForce === 'day' && styles.tifButtonActive,
                ]}
                onPress={() => setTimeInForce('day')}
              >
                <Text
                  style={[
                    styles.tifText,
                    timeInForce === 'day' && styles.tifTextActive,
                  ]}
                >
                  Day
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tifButton,
                  timeInForce === 'gtc' && styles.tifButtonActive,
                ]}
                onPress={() => setTimeInForce('gtc')}
              >
                <Text
                  style={[
                    styles.tifText,
                    timeInForce === 'gtc' && styles.tifTextActive,
                  ]}
                >
                  GTC
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Clock size={20} color={colors.textMuted} />
              <Text style={styles.optionLabel}>Extended Hours</Text>
            </View>
            <Switch
              value={extendedHours}
              onValueChange={setExtendedHours}
              trackColor={{ false: '#3e3e3e', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </BlurView>

        {isFormValid && (
          <BlurView intensity={20} tint="dark" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Cost</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(estimatedCost)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order Type</Text>
              <Text style={styles.summaryValue}>
                {orderType.toUpperCase()}
              </Text>
            </View>
          </BlurView>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitOrder}
          disabled={!isFormValid}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              orderSide === 'buy'
                ? ['#10B981', '#059669']
                : ['#EF4444', '#DC2626']
            }
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.submitText}>
              {orderSide === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: isTablet ? Spacing.xl : Spacing.lg,
  },
  headerTitle: {
    fontSize: isTablet ? Typography.size.xxxl : 26,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: isTablet ? Typography.size.md : 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? Spacing.xl : Spacing.lg,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 12,
    padding: isTablet ? Spacing.lg : Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: isTablet ? Typography.size.md : Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: Spacing.sm,
  },
  orderSideContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  orderSideButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: isTablet ? Spacing.md : Spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  orderSideBuyActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: '#10B981',
  },
  orderSideSellActive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: '#EF4444',
  },
  orderSideText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  orderSideBuyText: {
    color: '#10B981',
  },
  orderSideSellText: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.md,
    color: colors.white,
    paddingVertical: Spacing.sm,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  orderTypeButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  orderTypeActive: {
    backgroundColor: 'rgba(59,130,246,0.2)',
  },
  orderTypeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  orderTypeTextActive: {
    color: '#3B82F6',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionLabel: {
    fontSize: Typography.size.md,
    color: colors.white,
  },
  optionRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tifButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tifButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.2)',
  },
  tifText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  tifTextActive: {
    color: '#3B82F6',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: Spacing.sm,
  },
  summaryCard: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  submitText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginHorizontal: isTablet ? Spacing.xl : Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  disabledText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.weight.medium,
  },
  priceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  priceLabel: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#10B981',
  },
  loadingText: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
