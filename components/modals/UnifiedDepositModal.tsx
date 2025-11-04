import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Download, Building2, CreditCard, Bitcoin, Truck, Check, Copy, AlertCircle } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { depositSchema } from '@/utils/validation-schemas';
import { FieldError } from '@/components/ui/ErrorState';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastManager';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { depositWithdrawalService, DepositMethod as ServiceDepositMethod } from '@/services/banking/deposit-withdrawal-service';

const { height } = Dimensions.get('window');

interface UnifiedDepositModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type DepositMethod = 'bank_transfer' | 'card' | 'wire' | 'check';

interface DepositMethodOption {
  id: DepositMethod;
  label: string;
  subtitle: string;
  icon: typeof Building2;
  color: string;
}

const DEPOSIT_METHODS: DepositMethodOption[] = [
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    subtitle: '2-3 business days • No fees',
    icon: Building2,
    color: '#06B6D4',
  },
  {
    id: 'wire',
    label: 'Wire Transfer',
    subtitle: 'Same day • $25 fee',
    icon: Building2,
    color: '#8B5CF6',
  },
  {
    id: 'card',
    label: 'Debit Card',
    subtitle: 'Instant • 2.9% fee',
    icon: CreditCard,
    color: '#3B82F6',
  },
  {
    id: 'check',
    label: 'Check Deposit',
    subtitle: '5-7 business days',
    icon: Building2,
    color: '#10B981',
  },
];

export default function UnifiedDepositModal({ visible, onClose, onSuccess }: UnifiedDepositModalProps) {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const { showSuccess, showError } = useToast();
  const [activeMethod, setActiveMethod] = useState<DepositMethod>('bank_transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useValidatedForm(depositSchema);
  const [primaryAccount, setPrimaryAccount] = useState<any>(null);

  useEffect(() => {
    if (accounts.length > 0) {
      setPrimaryAccount(accounts[0]);
    }
  }, [accounts]);

  const handleDeposit = async () => {
    if (!form.validate()) {
      showError('Please fix the errors before submitting');
      return;
    }

    if (!user?.id || !primaryAccount) {
      showError('Account information not available');
      return;
    }

    const depositAmount = parseFloat(form.values.amount || '0');
    if (depositAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await depositWithdrawalService.createDeposit(
        {
          accountId: primaryAccount.id,
          amount: depositAmount,
          method: activeMethod as ServiceDepositMethod,
        },
        user.id
      );

      if (result.success) {
        await refetchAccounts();
        if (onSuccess) onSuccess();
        showSuccess(result.message);
        form.reset();
        onClose();
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      showError(error.message || 'Failed to process deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMethodContent = () => {
    switch (activeMethod) {
      case 'bank_transfer':
      case 'wire':
        return (
          <View style={styles.methodContent}>
            <BlurView intensity={40} tint="dark" style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Bank Transfer Instructions</Text>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionLabel}>Account Name:</Text>
                <View style={styles.copyRow}>
                  <Text style={styles.instructionValue}>Bental Advisor Inc.</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Copy size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionLabel}>Account Number:</Text>
                <View style={styles.copyRow}>
                  <Text style={styles.instructionValue}>1234567890</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Copy size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionLabel}>Routing Number:</Text>
                <View style={styles.copyRow}>
                  <Text style={styles.instructionValue}>021000021</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Copy size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionLabel}>Reference ID:</Text>
                <View style={styles.copyRow}>
                  <Text style={styles.instructionValue}>USER-{Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Copy size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>

            <BlurView intensity={40} tint="dark" style={styles.warningBox}>
              <AlertCircle size={18} color="#F59E0B" />
              <Text style={styles.warningText}>
                Include your Reference ID in the transfer memo for automatic processing.
              </Text>
            </BlurView>
          </View>
        );

      case 'card':
        return (
          <View style={styles.methodContent}>
            <BlurView intensity={40} tint="dark" style={styles.infoBox}>
              <Text style={styles.infoText}>
                Card deposits are processed instantly. A 2.9% processing fee will be added to your deposit amount.
              </Text>
            </BlurView>
          </View>
        );

      case 'check':
        return (
          <View style={styles.methodContent}>
            <BlurView intensity={40} tint="dark" style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Check Deposit Instructions</Text>
              <Text style={styles.instructionText}>
                Mail your check to our processing center. Include your account reference number on the memo line.
              </Text>
            </BlurView>

            <BlurView intensity={40} tint="dark" style={styles.infoBox}>
              <Text style={styles.infoText}>
                Checks typically clear within 5-7 business days after receipt.
              </Text>
            </BlurView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
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
                <Download size={24} color="#10B981" />
                <Text style={styles.headerTitle}>Deposit Funds</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <View style={styles.methodTabs}>
                {DEPOSIT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isActive = activeMethod === method.id;
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[styles.methodTab, isActive && styles.methodTabActive]}
                      onPress={() => setActiveMethod(method.id)}
                    >
                      <BlurView intensity={isActive ? 60 : 30} tint="dark" style={styles.methodTabInner}>
                        <Icon size={20} color={isActive ? method.color : colors.textSecondary} />
                        <Text style={[styles.methodTabLabel, isActive && { color: method.color }]}>
                          {method.label}
                        </Text>
                        {isActive && <Check size={16} color={method.color} />}
                      </BlurView>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Amount</Text>
                <BlurView intensity={60} tint="dark" style={styles.input}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={form.values.amount || ''}
                    onChangeText={(text) => form.setFieldValue('amount', text)}
                    onBlur={() => form.handleBlur('amount')}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </BlurView>
                {form.touched.amount && form.errors.amount && (
                  <FieldError message={form.errors.amount} />
                )}
                <View style={styles.quickAmounts}>
                  {['100', '500', '1000', '5000'].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={styles.quickAmount}
                      onPress={() => form.setFieldValue('amount', amt)}
                    >
                      <Text style={styles.quickAmountText}>${amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {renderMethodContent()}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleDeposit}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <ButtonSpinner />
                  ) : (
                    <>
                      <Download size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Complete Deposit</Text>
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
    height: height * 0.9,
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
  methodTabs: {
    gap: 12,
    marginBottom: 24,
  },
  methodTab: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  methodTabActive: {
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  methodTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  methodTabLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
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
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickAmount: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  methodContent: {
    gap: 16,
  },
  instructionsBox: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  instructionItem: {
    marginBottom: 12,
  },
  instructionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  copyButton: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cryptoOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cryptoOption: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  cryptoOptionInner: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
  },
  cryptoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  qrPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoBox: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    overflow: 'hidden',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.glass,
    marginTop: 8,
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
