import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Upload, Building2, CreditCard, Bitcoin, Check, AlertCircle } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { useToast } from '@/components/ui/ToastManager';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { depositWithdrawalService, WithdrawalMethod as ServiceWithdrawalMethod } from '@/services/banking/deposit-withdrawal-service';

const { height } = Dimensions.get('window');

interface UnifiedWithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type WithdrawMethod = 'bank_transfer' | 'wire' | 'check';

interface WithdrawMethodOption {
  id: WithdrawMethod;
  label: string;
  subtitle: string;
  icon: typeof Building2;
  color: string;
}

const WITHDRAW_METHODS: WithdrawMethodOption[] = [
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
    id: 'check',
    label: 'Check by Mail',
    subtitle: '5-7 business days',
    icon: Building2,
    color: '#10B981',
  },
];

export default function UnifiedWithdrawModal({ visible, onClose, onSuccess }: UnifiedWithdrawModalProps) {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const { showSuccess, showError } = useToast();
  const [activeMethod, setActiveMethod] = useState<WithdrawMethod>('bank_transfer');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountLast4, setAccountLast4] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryAccount, setPrimaryAccount] = useState<any>(null);
  const availableBalance = primaryAccount ? Number(primaryAccount.balance) : 0;

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      console.clear();
      setAmount('');
      setBankName('');
      setAccountLast4('');
      setRoutingNumber('');
      setIsSubmitting(false);
      setActiveMethod('bank_transfer');
    }
  }, [visible]);

  useEffect(() => {
    if (visible && accounts.length > 0) {
      console.clear();
      setPrimaryAccount(accounts[0]);
    }
  }, [visible, accounts]);

  const handleWithdraw = async () => {
    console.clear();
    if (!amount || parseFloat(amount) <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!bankName.trim()) {
      showError('Please enter bank name');
      return;
    }

    if (!accountLast4 || accountLast4.length !== 4) {
      showError('Please enter last 4 digits of account number');
      return;
    }

    if (!user?.id || !primaryAccount) {
      showError('Account information not available');
      return;
    }

    const withdrawAmount = parseFloat(amount);

    setIsSubmitting(true);
    try {
      const result = await depositWithdrawalService.createWithdrawal(
        {
          accountId: primaryAccount.id,
          amount: withdrawAmount,
          method: activeMethod as ServiceWithdrawalMethod,
          bankName: bankName.trim(),
          accountNumberLast4: accountLast4,
          routingNumber: routingNumber || undefined,
        },
        user.id
      );

      if (result.success) {
        await refetchAccounts();
        if (onSuccess) onSuccess();
        showSuccess(result.message);
        setAmount('');
        setBankName('');
        setAccountLast4('');
        setRoutingNumber('');
        onClose();
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      showError(error.message || 'Failed to process withdrawal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMethodContent = () => {
    return (
      <View style={styles.methodContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Bank Name</Text>
          <BlurView intensity={60} tint="dark" style={styles.input}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter bank name"
              placeholderTextColor={colors.textMuted}
              value={bankName}
              onChangeText={setBankName}
            />
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Account Number (Last 4 Digits)</Text>
          <BlurView intensity={60} tint="dark" style={styles.input}>
            <TextInput
              style={styles.textInput}
              placeholder="1234"
              placeholderTextColor={colors.textMuted}
              value={accountLast4}
              onChangeText={setAccountLast4}
              keyboardType="number-pad"
              maxLength={4}
            />
          </BlurView>
        </View>

        {(activeMethod === 'bank_transfer' || activeMethod === 'wire') && (
          <View style={styles.section}>
            <Text style={styles.label}>Routing Number (Optional)</Text>
            <BlurView intensity={60} tint="dark" style={styles.input}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter routing number"
                placeholderTextColor={colors.textMuted}
                value={routingNumber}
                onChangeText={setRoutingNumber}
                keyboardType="number-pad"
              />
            </BlurView>
          </View>
        )}

        <BlurView intensity={40} tint="dark" style={styles.infoBox}>
          <Text style={styles.infoText}>
            {activeMethod === 'wire'
              ? 'Wire transfers are processed same day. A $25 fee applies.'
              : activeMethod === 'check'
              ? 'Checks are mailed within 1-2 business days and typically arrive in 5-7 business days.'
              : 'Funds will arrive in your bank account within 2-3 business days. No processing fees.'}
          </Text>
        </BlurView>
      </View>
    );
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
