import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { getModalAccessibilityProps, getCloseButtonAccessibilityProps, getSubmitButtonAccessibilityProps, getCancelButtonAccessibilityProps } from '@/utils/accessibility-enhancer';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Plus, CreditCard, Building2, Check, Bitcoin, Truck } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { depositSchema } from '@/utils/validation-schemas';
import { FieldError } from '@/components/ui/ErrorState';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';

const { height } = Dimensions.get('window');

interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
}

type DepositMethod = 'bank' | 'card' | 'crypto' | 'courier';

interface MethodOption {
  id: DepositMethod;
  label: string;
  subtitle: string;
  icon: any;
  color: string;
}

const METHODS: MethodOption[] = [
  {
    id: 'bank',
    label: 'Bank',
    subtitle: '2-3 days',
    icon: Building2,
    color: '#06B6D4',
  },
  {
    id: 'card',
    label: 'Card',
    subtitle: 'Instant',
    icon: CreditCard,
    color: '#3B82F6',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    subtitle: 'Fast',
    icon: Bitcoin,
    color: '#F59E0B',
  },
  {
    id: 'courier',
    label: 'Courier',
    subtitle: 'Secure',
    icon: Truck,
    color: '#10B981',
  },
];

export default function DepositModal({ visible, onClose }: DepositModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>('bank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const form = useValidatedForm(depositSchema);

  const handleDeposit = async () => {
    if (!form.validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Deposit of $${form.values.amount} initiated successfully`);
      form.reset();
      onClose();
    } catch (error) {
      toast.error('Failed to process deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      {...getModalAccessibilityProps('Deposit funds', 'Add money to your account')}
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
                <Plus size={24} color="#10B981" />
                <Text style={styles.headerTitle}>Deposit Funds</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                {...getCloseButtonAccessibilityProps('deposit dialog')}
              >
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <Text style={styles.label}>Deposit Method</Text>
                <View style={styles.methodGrid}>
                  {METHODS.map((method) => {
                    const Icon = method.icon;
                    const isActive = selectedMethod === method.id;
                    return (
                      <TouchableOpacity
                        key={method.id}
                        style={[styles.methodCard, isActive && styles.methodCardActive]}
                        onPress={() => setSelectedMethod(method.id)}
                        activeOpacity={0.7}
                      >
                        <BlurView intensity={isActive ? 60 : 30} tint="dark" style={styles.methodCardInner}>
                          <View style={[styles.iconContainer, { backgroundColor: `${method.color}20` }]}>
                            <Icon size={22} color={method.color} />
                          </View>
                          <Text style={[styles.methodLabel, isActive && styles.methodLabelActive]}>
                            {method.label}
                          </Text>
                          <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                          {isActive && (
                            <View style={styles.checkBadge}>
                              <Check size={14} color="#FFFFFF" />
                            </View>
                          )}
                        </BlurView>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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

              <BlurView intensity={40} tint="dark" style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Your deposit will be processed securely. Funds will be available in your account according to the selected method.
                </Text>
              </BlurView>

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
                      <Plus size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Deposit Funds</Text>
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
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    width: '48%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  methodCardActive: {
    transform: [{ scale: 0.98 }],
  },
  methodCardInner: {
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: GLASS.border,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  methodLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  methodSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
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
  infoBox: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.glass,
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
