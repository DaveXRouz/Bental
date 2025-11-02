import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Upload, Building2, CreditCard, Bitcoin, Check, AlertCircle } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { useToast } from '@/contexts/ToastContext';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';

const { height } = Dimensions.get('window');

interface UnifiedWithdrawModalProps {
  visible: boolean;
  onClose: () => void;
}

type WithdrawMethod = 'bank' | 'card' | 'crypto';

interface WithdrawMethodOption {
  id: WithdrawMethod;
  label: string;
  subtitle: string;
  icon: typeof Building2;
  color: string;
}

const WITHDRAW_METHODS: WithdrawMethodOption[] = [
  {
    id: 'bank',
    label: 'Bank Transfer',
    subtitle: '2-3 business days • No fees',
    icon: Building2,
    color: '#06B6D4',
  },
  {
    id: 'card',
    label: 'Debit Card',
    subtitle: '30 minutes • 1% fee',
    icon: CreditCard,
    color: '#3B82F6',
  },
  {
    id: 'crypto',
    label: 'Cryptocurrency',
    subtitle: 'Network fees apply',
    icon: Bitcoin,
    color: '#F59E0B',
  },
];

export default function UnifiedWithdrawModal({ visible, onClose }: UnifiedWithdrawModalProps) {
  const [activeMethod, setActiveMethod] = useState<WithdrawMethod>('bank');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const availableBalance = 12547.89;

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > availableBalance) {
      toast.error('Insufficient funds');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Withdrawal of $${amount} initiated successfully`);
      setAmount('');
      onClose();
    } catch (error) {
      toast.error('Failed to process withdrawal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMethodContent = () => {
    switch (activeMethod) {
      case 'bank':
        return (
          <View style={styles.methodContent}>
            <View style={styles.section}>
              <Text style={styles.label}>Withdrawal Destination</Text>
              <BlurView intensity={60} tint="dark" style={styles.bankCard}>
                <Building2 size={20} color="#06B6D4" />
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>Chase Bank ****4532</Text>
                  <Text style={styles.bankSubtext}>Primary checking account</Text>
                </View>
                <Check size={18} color="#10B981" />
              </BlurView>
              <TouchableOpacity style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change Account</Text>
              </TouchableOpacity>
            </View>

            <BlurView intensity={40} tint="dark" style={styles.infoBox}>
              <Text style={styles.infoText}>
                Funds will arrive in your bank account within 2-3 business days. No processing fees.
              </Text>
            </BlurView>
          </View>
        );

      case 'card':
        return (
          <View style={styles.methodContent}>
            <View style={styles.section}>
              <Text style={styles.label}>Card Details</Text>
              <BlurView intensity={60} tint="dark" style={styles.input}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Card number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </BlurView>
            </View>

            <View style={styles.row}>
              <View style={[styles.section, { flex: 1 }]}>
                <Text style={styles.label}>Expiry</Text>
                <BlurView intensity={60} tint="dark" style={styles.input}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </BlurView>
              </View>
              <View style={[styles.section, { flex: 1 }]}>
                <Text style={styles.label}>CVV</Text>
                <BlurView intensity={60} tint="dark" style={styles.input}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="123"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </BlurView>
              </View>
            </View>

            <BlurView intensity={40} tint="dark" style={styles.warningBox}>
              <AlertCircle size={18} color="#F59E0B" />
              <Text style={styles.warningText}>
                Fast withdrawal to debit card incurs a 1% processing fee. Funds arrive within 30 minutes.
              </Text>
            </BlurView>
          </View>
        );

      case 'crypto':
        return (
          <View style={styles.methodContent}>
            <View style={styles.section}>
              <Text style={styles.label}>Select Cryptocurrency</Text>
              <View style={styles.cryptoOptions}>
                {['Bitcoin (BTC)', 'Ethereum (ETH)', 'USDT', 'USDC'].map((crypto) => (
                  <TouchableOpacity key={crypto} style={styles.cryptoOption}>
                    <BlurView intensity={40} tint="dark" style={styles.cryptoOptionInner}>
                      <Text style={styles.cryptoLabel}>{crypto}</Text>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Withdrawal Address</Text>
              <BlurView intensity={60} tint="dark" style={styles.input}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter crypto wallet address"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                />
              </BlurView>
            </View>

            <BlurView intensity={40} tint="dark" style={styles.warningBox}>
              <AlertCircle size={18} color="#EF4444" />
              <Text style={styles.warningText}>
                Double-check the address. Cryptocurrency transactions cannot be reversed. Network fees will be deducted from your withdrawal.
              </Text>
            </BlurView>
          </View>
        );
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
                <Upload size={24} color="#F59E0B" />
                <Text style={styles.headerTitle}>Withdraw Funds</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <BlurView intensity={40} tint="dark" style={styles.balanceCard}>
                <LinearGradient
                  colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.06)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.balanceLabel}>Available to Withdraw</Text>
                <Text style={styles.balanceValue}>
                  ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </BlurView>

              <View style={styles.methodTabs}>
                {WITHDRAW_METHODS.map((method) => {
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
                <Text style={styles.label}>Withdrawal Amount</Text>
                <BlurView intensity={60} tint="dark" style={styles.input}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </BlurView>
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={() => setAmount(availableBalance.toString())}
                >
                  <Text style={styles.maxButtonText}>Withdraw Maximum</Text>
                </TouchableOpacity>
              </View>

              {renderMethodContent()}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleWithdraw}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <ButtonSpinner />
                  ) : (
                    <>
                      <Upload size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Complete Withdrawal</Text>
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
  balanceCard: {
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    marginBottom: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
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
  maxButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  maxButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  methodContent: {
    gap: 16,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  bankSubtext: {
    fontSize: 12,
    color: colors.textMuted,
  },
  changeButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
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
