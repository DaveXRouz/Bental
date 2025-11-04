import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency } from '@/utils/formatting';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { clearConsole } from '@/utils/console-manager';

const { height } = Dimensions.get('window');

interface TradeConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  trade: {
    symbol: string;
    companyName?: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType: 'market' | 'limit';
    limitPrice?: number;
    estimatedPrice: number;
    estimatedTotal: number;
    fees?: number;
    buyingPower?: number;
  };
}

export default function TradeConfirmationModal({
  visible,
  onClose,
  onConfirm,
  trade,
}: TradeConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    clearConsole();
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Trade confirmation error:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const isBuy = trade.side === 'buy';
  const totalWithFees = trade.estimatedTotal + (trade.fees || 0);
  const sufficientFunds = trade.buyingPower ? trade.buyingPower >= totalWithFees : true;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel={`Confirm ${isBuy ? 'purchase' : 'sale'} of ${trade.quantity} shares of ${trade.symbol}`}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={styles.blurOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </BlurView>

        <View style={styles.modalContainer}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {isBuy ? (
                  <TrendingUp size={24} color="#10B981" />
                ) : (
                  <TrendingDown size={24} color="#EF4444" />
                )}
                <Text style={styles.headerTitle}>Confirm {isBuy ? 'Purchase' : 'Sale'}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isConfirming}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close confirmation dialog"
                accessibilityHint="Cancels the trade and closes this dialog"
              >
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              accessible={false}
              accessibilityLabel="Trade details"
            >
              <BlurView
                intensity={60}
                tint="dark"
                style={styles.summaryCard}
                accessible={true}
                accessibilityRole="summary"
                accessibilityLabel={`Trade summary: ${isBuy ? 'Buying' : 'Selling'} ${trade.quantity} shares of ${trade.symbol} for approximately ${formatCurrency(trade.estimatedTotal)}`}
              >
                <View style={styles.symbolRow}>
                  <Text style={styles.symbol}>{trade.symbol}</Text>
                  {trade.companyName && <Text style={styles.companyName}>{trade.companyName}</Text>}
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>{trade.quantity} shares</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Type</Text>
                  <Text style={styles.detailValue}>
                    {trade.orderType === 'market' ? 'Market Order' : 'Limit Order'}
                  </Text>
                </View>
                {trade.orderType === 'limit' && trade.limitPrice && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Limit Price</Text>
                    <Text style={styles.detailValue}>{formatCurrency(trade.limitPrice)}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estimated Price</Text>
                  <Text style={styles.detailValue}>{formatCurrency(trade.estimatedPrice)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subtotal</Text>
                  <Text style={styles.detailValue}>{formatCurrency(trade.estimatedTotal)}</Text>
                </View>
                {trade.fees && trade.fees > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fees</Text>
                    <Text style={styles.detailValue}>{formatCurrency(trade.fees)}</Text>
                  </View>
                )}
                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total {isBuy ? 'Cost' : 'Proceeds'}</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalWithFees)}</Text>
                </View>
              </BlurView>

              {isBuy && trade.buyingPower !== undefined && (
                <BlurView intensity={40} tint="dark" style={styles.buyingPowerCard}>
                  <View style={styles.buyingPowerRow}>
                    <Text style={styles.buyingPowerLabel}>Available Buying Power</Text>
                    <Text style={styles.buyingPowerValue}>{formatCurrency(trade.buyingPower)}</Text>
                  </View>
                  {!sufficientFunds && (
                    <View
                      style={styles.insufficientFundsWarning}
                      accessible={true}
                      accessibilityRole="alert"
                      accessibilityLiveRegion="assertive"
                      accessibilityLabel="Warning: Insufficient buying power for this trade"
                    >
                      <AlertCircle size={16} color="#EF4444" />
                      <Text style={styles.warningText}>Insufficient buying power for this trade</Text>
                    </View>
                  )}
                </BlurView>
              )}

              <BlurView
                intensity={40}
                tint="dark"
                style={styles.disclaimerCard}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Important notice: ${trade.orderType === 'market' ? 'Market orders execute at the current market price, which may differ from the estimate shown' : 'Your limit order will only execute if the market price reaches your limit price'}`}
              >
                <AlertCircle size={18} color="#F59E0B" />
                <Text style={styles.disclaimerText}>
                  {trade.orderType === 'market'
                    ? 'Market orders execute at the current market price, which may differ from the estimate shown.'
                    : 'Your limit order will only execute if the market price reaches your limit price.'}
                </Text>
              </BlurView>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                  disabled={isConfirming}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel trade"
                  accessibilityHint="Returns to the trading screen without placing the order"
                  accessibilityState={{ disabled: isConfirming }}
                >
                  <BlurView intensity={60} tint="dark" style={styles.cancelButtonInner}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, (!sufficientFunds || isConfirming) && styles.buttonDisabled]}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  disabled={!sufficientFunds || isConfirming}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Confirm ${isBuy ? 'purchase' : 'sale'} of ${trade.quantity} shares`}
                  accessibilityHint={!sufficientFunds ? 'Insufficient funds to complete this trade' : `Places ${trade.orderType} order for ${formatCurrency(totalWithFees)}`}
                  accessibilityState={{ disabled: !sufficientFunds || isConfirming, busy: isConfirming }}
                >
                  <LinearGradient
                    colors={isBuy ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
                    style={styles.confirmButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isConfirming ? (
                      <ButtonSpinner />
                    ) : (
                      <>
                        <CheckCircle size={18} color="#FFFFFF" />
                        <Text style={styles.confirmButtonText}>
                          Confirm {isBuy ? 'Purchase' : 'Sale'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
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
    height: height * 0.8,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
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
  summaryCard: {
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  symbolRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  symbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: GLASS.border,
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  buyingPowerCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  buyingPowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyingPowerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  buyingPowerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  insufficientFundsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GLASS.border,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cancelButtonInner: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
