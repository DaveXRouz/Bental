import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Target } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency, formatNumber } from '@/utils/formatting';

const { width, height } = Dimensions.get('window');

interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  average_cost: number;
  market_value: number;
  day_change?: number;
  created_at?: string;
}

interface PositionDetailModalProps {
  visible: boolean;
  holding: Holding | null;
  onClose: () => void;
  onSell?: (holding: Holding) => void;
}

export default function PositionDetailModal({ visible, holding, onClose, onSell }: PositionDetailModalProps) {
  if (!holding) return null;

  const totalCost = holding.quantity * holding.average_cost;
  const currentValue = holding.market_value;
  const totalGainLoss = currentValue - totalCost;
  const gainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100) : 0;
  const isProfit = totalGainLoss >= 0;
  const currentPrice = holding.quantity > 0 ? currentValue / holding.quantity : 0;
  const dayChange = holding.day_change || 0;
  const isDayPositive = dayChange >= 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={styles.blurOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </BlurView>

        <View style={styles.modalContainer}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.symbolText}>{holding.symbol}</Text>
                <Text style={styles.subtitleText}>Position Details</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Current Price</Text>
                <Text style={styles.priceValue}>{formatCurrency(currentPrice, 2)}</Text>
                <View style={styles.dayChangeContainer}>
                  {isDayPositive ? (
                    <TrendingUp size={16} color="#10B981" />
                  ) : (
                    <TrendingDown size={16} color="#EF4444" />
                  )}
                  <Text style={[styles.dayChangeText, isDayPositive ? styles.profitText : styles.lossText]}>
                    {isDayPositive ? '+' : ''}{formatCurrency(dayChange, 2)} today
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <BlurView intensity={60} tint="dark" style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(59,130,246,0.1)', 'rgba(59,130,246,0.05)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <DollarSign size={20} color="#3B82F6" />
                  <Text style={styles.statLabel}>Shares</Text>
                  <Text style={styles.statValue}>{formatNumber(holding.quantity, 0)}</Text>
                </BlurView>

                <BlurView intensity={60} tint="dark" style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(139,92,246,0.1)', 'rgba(139,92,246,0.05)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <BarChart3 size={20} color="#8B5CF6" />
                  <Text style={styles.statLabel}>Avg Cost</Text>
                  <Text style={styles.statValue}>{formatCurrency(holding.average_cost, 2)}</Text>
                </BlurView>
              </View>

              <BlurView intensity={60} tint="dark" style={styles.summaryCard}>
                <LinearGradient
                  colors={isProfit ? ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.06)'] : ['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.06)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Cost</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalCost, 2)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Market Value</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(currentValue, 2)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <View style={styles.gainLossLabel}>
                    {isProfit ? (
                      <TrendingUp size={18} color="#10B981" />
                    ) : (
                      <TrendingDown size={18} color="#EF4444" />
                    )}
                    <Text style={[styles.summaryLabel, styles.bold]}>Total Gain/Loss</Text>
                  </View>
                  <View style={styles.gainLossValue}>
                    <Text style={[styles.summaryValue, isProfit ? styles.profitText : styles.lossText, styles.bold]}>
                      {isProfit ? '+' : ''}{formatCurrency(totalGainLoss, 2)}
                    </Text>
                    <Text style={[styles.percentText, isProfit ? styles.profitText : styles.lossText]}>
                      ({isProfit ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                    </Text>
                  </View>
                </View>
              </BlurView>

              {holding.created_at && (
                <View style={styles.infoRow}>
                  <Calendar size={16} color={colors.textSecondary} />
                  <Text style={styles.infoText}>
                    Position opened: {new Date(holding.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#3B82F6', '#8B5CF6']}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Target size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Add More</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  activeOpacity={0.8}
                  onPress={() => onSell && onSell(holding)}
                >
                  <BlurView intensity={40} tint="dark" style={styles.actionButtonSecondaryInner}>
                    <TrendingUp size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonSecondaryText}>Sell</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    height: height * 0.75,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  headerLeft: {
    flex: 1,
  },
  symbolText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  dayChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayChangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    alignItems: 'center',
    ...shadows.glass,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryCard: {
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    marginBottom: 24,
    ...shadows.glass,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: GLASS.border,
    marginVertical: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  gainLossLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gainLossValue: {
    alignItems: 'flex-end',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
  },
  profitText: {
    color: '#10B981',
  },
  lossText: {
    color: '#EF4444',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.glass,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  actionButtonSecondary: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  actionButtonSecondaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
