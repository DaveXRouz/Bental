import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, TrendingUp, TrendingDown, AlertCircle, DollarSign } from 'lucide-react-native';
import { colors, Spacing, Typography } from '@/constants/theme';
import { usePortfolioOperations } from '@/hooks/usePortfolioOperations';
import { useAccountContext } from '@/contexts/AccountContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import * as Haptics from 'expo-haptics';

interface TradingModalProps {
  visible: boolean;
  onClose: () => void;
  symbol: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'bond';
  currentPrice: number;
  mode: 'buy' | 'sell';
  availableQuantity?: number;
  totalQuantity?: number;
  lockedQuantity?: number;
}

export default function TradingModal({
  visible,
  onClose,
  symbol,
  assetType,
  currentPrice,
  mode,
  availableQuantity = 0,
  totalQuantity,
  lockedQuantity,
}: TradingModalProps) {
  const { selectedAccounts } = useAccountContext();
  const { cashBalance, refreshPortfolio } = usePortfolio();
  const { executeBuyOrder, createSellOrder, loading } = usePortfolioOperations(
    selectedAccounts[0]?.id
  );

  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const isBuy = mode === 'buy';
  const accountId = selectedAccounts[0]?.id;

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setQuantity('');
      setNotes('');
      setError('');
    }
  }, [visible]);

  const totalCost = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    return qty * currentPrice;
  }, [quantity, currentPrice]);

  const quantityValue = parseFloat(quantity) || 0;
  const hasEnteredQuantity = quantity.trim() !== '' && quantityValue > 0;

  const canAfford = isBuy ? totalCost <= cashBalance : true;
  // Use small epsilon for floating point comparison
  const hasEnoughShares = !isBuy ? quantityValue <= availableQuantity + 0.00000001 : true;
  const hasLockedQty = !isBuy && lockedQuantity && lockedQuantity > 0;

  const isValid = useMemo(() => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return false;
    if (isBuy && !canAfford) return false;
    if (!isBuy && !hasEnoughShares) return false;
    return true;
  }, [quantity, isBuy, canAfford, hasEnoughShares]);

  const handleSubmit = async () => {
    if (!isValid || !accountId) return;

    const qty = parseFloat(quantity);
    setError('');

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      let result;

      if (isBuy) {
        result = await executeBuyOrder({
          symbol,
          asset_type: assetType,
          quantity: qty,
          price: currentPrice,
        });
      } else {
        result = await createSellOrder({
          symbol,
          asset_type: assetType,
          quantity: qty,
          estimated_price: currentPrice,
          user_notes: notes || undefined,
        });
      }

      if (result) {
        // Refresh portfolio after successful trade
        await refreshPortfolio();

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        onClose();
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} ${symbol}`);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconContainer, isBuy ? styles.buyBg : styles.sellBg]}>
                  {isBuy ? (
                    <TrendingUp size={20} color={colors.success} />
                  ) : (
                    <TrendingDown size={20} color={colors.danger} />
                  )}
                </View>
                <View>
                  <Text style={styles.headerTitle}>
                    {isBuy ? 'Buy' : 'Sell'} {symbol}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    ${currentPrice.toFixed(2)} per {assetType}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Account Balance Info */}
              {isBuy && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Available Balance</Text>
                  <Text style={styles.infoValue}>${cashBalance.toFixed(2)}</Text>
                </View>
              )}

              {/* Available Shares Info */}
              {!isBuy && (
                <View style={styles.infoCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Available to Sell</Text>
                    <Text style={styles.infoValue}>{availableQuantity.toFixed(4)} {symbol}</Text>
                    {hasLockedQty && (
                      <View style={styles.lockedInfo}>
                        <AlertCircle size={12} color={colors.warning} />
                        <Text style={styles.lockedText}>
                          {lockedQuantity?.toFixed(4)} locked in pending orders
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Quantity Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity{!isBuy && ` (max: ${availableQuantity.toFixed(4)})`}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={!isBuy ? `Enter amount (up to ${availableQuantity.toFixed(4)})` : "0.00"}
                    placeholderTextColor={colors.textMuted}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    editable={!loading}
                  />
                </View>
                {!hasEnoughShares && !isBuy && hasEnteredQuantity && (
                  <View style={styles.inlineError}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.errorText}>
                      Insufficient available shares. You have {availableQuantity.toFixed(4)} available
                      {hasLockedQty && ` (${lockedQuantity?.toFixed(4)} locked in pending orders)`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Total Cost */}
              <View style={styles.totalContainer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total {isBuy ? 'Cost' : 'Proceeds'}</Text>
                  <View style={styles.totalValue}>
                    <DollarSign size={18} color={colors.white} />
                    <Text style={styles.totalAmount}>{totalCost.toFixed(2)}</Text>
                  </View>
                </View>

                {!canAfford && isBuy && (
                  <View style={styles.warningContainer}>
                    <AlertCircle size={16} color={colors.warning} />
                    <Text style={styles.warningText}>Insufficient balance</Text>
                  </View>
                )}
              </View>

              {/* Sell Order Note */}
              {!isBuy && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes (Optional)</Text>
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Add any notes for your sell order..."
                      placeholderTextColor={colors.textMuted}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      editable={!loading}
                    />
                  </View>
                </View>
              )}

              {/* Sell Order Warning */}
              {!isBuy && (
                <View style={styles.noteContainer}>
                  <AlertCircle size={16} color={colors.info} />
                  <Text style={styles.noteText}>
                    Sell orders require admin approval. You'll be notified when your order is processed.
                  </Text>
                </View>
              )}

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color={colors.danger} />
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isBuy ? styles.buyButton : styles.sellButton,
                  (!isValid || loading) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isValid || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isBuy ? 'Buy Now' : 'Submit for Approval'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modal: {
    backgroundColor: 'rgba(20, 20, 22, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  sellBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: Spacing.lg,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  lockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  lockedText: {
    fontSize: Typography.size.xs,
    color: colors.warning,
    fontWeight: Typography.weight.medium,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    padding: Spacing.md,
    fontSize: Typography.size.lg,
    color: colors.white,
    fontWeight: Typography.weight.semibold,
  },
  textAreaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: {
    padding: Spacing.md,
    fontSize: Typography.size.md,
    color: colors.white,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  totalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.size.md,
    color: colors.textMuted,
    fontWeight: Typography.weight.semibold,
  },
  totalValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalAmount: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  warningText: {
    fontSize: Typography.size.sm,
    color: colors.warning,
  },
  noteContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: Spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: colors.info,
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: colors.danger,
    lineHeight: 18,
  },
  errorMessage: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: colors.danger,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  submitButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    backgroundColor: colors.success,
  },
  sellButton: {
    backgroundColor: colors.danger,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
});
