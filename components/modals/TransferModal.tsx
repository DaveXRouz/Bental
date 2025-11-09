import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { X, ArrowRightLeft, Wallet, Check, AlertCircle, TrendingUp } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency } from '@/utils/formatting';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransfers } from '@/hooks/useTransfers';
import { transferService } from '@/services/banking/transfer-service';
import { useToast } from '@/components/ui/ToastManager';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';

const { height } = Dimensions.get('window');

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransferModal({ visible, onClose, onSuccess }: TransferModalProps) {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const { refetch: refetchTransfers } = useTransfers();
  const { showSuccess, showError } = useToast();

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      console.clear();
      setAmount('');
      setNotes('');
      setError('');
      setIsSubmitting(false);
    }
  }, [visible]);

  // Set default accounts when modal opens
  useEffect(() => {
    if (visible && accounts.length > 0) {
      console.clear();
      // Set first account as from
      setFromAccountId(accounts[0].id);
      // Set second account as to (if exists)
      if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      }
    }
  }, [visible, accounts]);

  // Get selected account balances
  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);
  const availableBalance = fromAccount ? Number(fromAccount.balance) : 0;

  const handleTransfer = async () => {
    console.clear();
    setError('');

    // Validation
    if (!fromAccountId || !toAccountId) {
      setError('Please select both source and destination accounts');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Cannot transfer to the same account');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (!amount || isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (transferAmount > availableBalance) {
      setError(`Insufficient funds. Available: ${formatCurrency(availableBalance)}`);
      return;
    }

    if (!user?.id) {
      setError('Authentication required');
      return;
    }

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    try {
      const result = await transferService.executeTransfer(
        {
          fromAccountId,
          toAccountId,
          amount: transferAmount,
          notes: notes.trim() || undefined,
        },
        user.id
      );

      if (result.success) {
        // Success haptic
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        showSuccess(
          `Transfer completed successfully! Reference: ${result.referenceNumber}`
        );

        // Refresh data
        await Promise.all([refetchAccounts(), refetchTransfers()]);

        // Reset form
        setAmount('');
        setNotes('');
        setError('');

        // Call success callback
        if (onSuccess) onSuccess();

        // Close modal
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        setError(result.error || 'Transfer failed');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'Failed to process transfer');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaxAmount = () => {
    if (availableBalance > 0) {
      setAmount(availableBalance.toFixed(2));
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel="Transfer funds between accounts"
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={styles.blurOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
            disabled={isSubmitting}
          />
        </BlurView>

        <View style={styles.modalContainer}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
              style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <ArrowRightLeft size={24} color="#3B82F6" />
                <Text style={styles.headerTitle}>Transfer Funds</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isSubmitting}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close transfer modal"
              >
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {/* From Account */}
              <View style={styles.section}>
                <Text style={styles.label}>From Account</Text>
                <View style={styles.accountSelector}>
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        fromAccountId === account.id && styles.accountOptionActive,
                        toAccountId === account.id && styles.accountOptionDisabled,
                      ]}
                      onPress={() => {
                        if (toAccountId !== account.id) {
                          setFromAccountId(account.id);
                          setError('');
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }
                      }}
                      disabled={toAccountId === account.id}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Transfer from ${account.name}, balance ${formatCurrency(Number(account.balance))}`}
                    >
                      <Wallet
                        size={18}
                        color={fromAccountId === account.id ? '#3B82F6' : colors.textSecondary}
                      />
                      <View style={styles.accountInfo}>
                        <Text
                          style={[
                            styles.accountText,
                            fromAccountId === account.id && styles.accountTextActive,
                          ]}
                        >
                          {account.name}
                        </Text>
                        <Text style={styles.accountBalance}>
                          {formatCurrency(Number(account.balance))}
                        </Text>
                      </View>
                      {fromAccountId === account.id && <Check size={16} color="#3B82F6" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.divider} />

              {/* To Account */}
              <View style={styles.section}>
                <Text style={styles.label}>To Account</Text>
                <View style={styles.accountSelector}>
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        toAccountId === account.id && styles.accountOptionActive,
                        fromAccountId === account.id && styles.accountOptionDisabled,
                      ]}
                      onPress={() => {
                        if (fromAccountId !== account.id) {
                          setToAccountId(account.id);
                          setError('');
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }
                      }}
                      disabled={fromAccountId === account.id}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Transfer to ${account.name}, balance ${formatCurrency(Number(account.balance))}`}
                    >
                      <Wallet
                        size={18}
                        color={toAccountId === account.id ? '#3B82F6' : colors.textSecondary}
                      />
                      <View style={styles.accountInfo}>
                        <Text
                          style={[
                            styles.accountText,
                            toAccountId === account.id && styles.accountTextActive,
                          ]}
                        >
                          {account.name}
                        </Text>
                        <Text style={styles.accountBalance}>
                          {formatCurrency(Number(account.balance))}
                        </Text>
                      </View>
                      {toAccountId === account.id && <Check size={16} color="#3B82F6" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Amount */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Amount</Text>
                  {fromAccount && (
                    <TouchableOpacity onPress={handleMaxAmount} disabled={isSubmitting}>
                      <Text style={styles.maxButton}>
                        Max: {formatCurrency(availableBalance)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <BlurView intensity={60} tint="dark" style={styles.input}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={(text) => {
                      setAmount(text);
                      setError('');
                    }}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    editable={!isSubmitting}
                    accessible={true}
                    accessibilityLabel="Transfer amount"
                    accessibilityHint="Enter the amount you want to transfer"
                  />
                </BlurView>
              </View>

              {/* Notes (Optional) */}
              <View style={styles.section}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <BlurView intensity={60} tint="dark" style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add a note for this transfer..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    editable={!isSubmitting}
                    accessible={true}
                    accessibilityLabel="Transfer notes"
                  />
                </BlurView>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Transfer Summary */}
              {fromAccount && toAccount && amount && parseFloat(amount) > 0 && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Transfer Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>From:</Text>
                    <Text style={styles.summaryValue}>{fromAccount.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>To:</Text>
                    <Text style={styles.summaryValue}>{toAccount.name}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                    <Text style={styles.summaryLabelBold}>Amount:</Text>
                    <Text style={styles.summaryValueBold}>
                      {formatCurrency(parseFloat(amount))}
                    </Text>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleTransfer}
                activeOpacity={0.8}
                disabled={isSubmitting || !fromAccountId || !toAccountId || !amount}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Complete transfer"
                accessibilityState={{ disabled: isSubmitting }}
              >
                <LinearGradient
                  colors={
                    isSubmitting
                      ? ['#6B7280', '#4B5563']
                      : ['#3B82F6', '#8B5CF6']
                  }
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <ButtonSpinner />
                  ) : (
                    <>
                      <ArrowRightLeft size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Complete Transfer</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
    height: height * 0.85,
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  maxButton: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  accountSelector: {
    gap: 12,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  accountOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  accountOptionDisabled: {
    opacity: 0.4,
  },
  accountInfo: {
    flex: 1,
  },
  accountText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  accountTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  accountBalance: {
    fontSize: 13,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: GLASS.border,
    marginVertical: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  textAreaContainer: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    padding: 16,
  },
  textArea: {
    fontSize: 15,
    color: colors.text,
    minHeight: 60,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryRowHighlight: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryLabelBold: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  summaryValueBold: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '700',
  },
  submitButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 8,
    ...shadows.glass,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
