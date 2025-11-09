import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, Clipboard, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { X, Download, Building2, CreditCard, Bitcoin, Truck, Check, Copy, AlertCircle, Calendar, MapPin } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastManager';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountSelector } from '@/components/ui/AccountSelector';
import { depositWithdrawalService, DepositMethod as ServiceDepositMethod } from '@/services/banking/deposit-withdrawal-service';

const { height } = Dimensions.get('window');

interface UnifiedDepositModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type DepositMethod = 'bank_transfer' | 'card' | 'wire' | 'check' | 'crypto' | 'cash_courier';
type CryptoCurrency = 'BTC' | 'ETH' | 'USDT' | 'USDC';

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
    subtitle: '2-3 days • Free',
    icon: Building2,
    color: '#06B6D4',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    subtitle: '15-30 min • Network fees',
    icon: Bitcoin,
    color: '#F7931A',
  },
  {
    id: 'card',
    label: 'Debit Card',
    subtitle: 'Instant • 2.9% fee',
    icon: CreditCard,
    color: '#3B82F6',
  },
  {
    id: 'wire',
    label: 'Wire',
    subtitle: 'Same day • $25 fee',
    icon: Building2,
    color: '#8B5CF6',
  },
  {
    id: 'cash_courier',
    label: 'Cash Courier',
    subtitle: 'Same day • $50 + insurance',
    icon: Truck,
    color: '#EAB308',
  },
  {
    id: 'check',
    label: 'Check',
    subtitle: '5-7 days',
    icon: Building2,
    color: '#10B981',
  },
];

const CRYPTO_CURRENCIES: { value: CryptoCurrency; label: string; network: string }[] = [
  { value: 'BTC', label: 'Bitcoin', network: 'Bitcoin Mainnet' },
  { value: 'ETH', label: 'Ethereum', network: 'Ethereum (ERC-20)' },
  { value: 'USDT', label: 'Tether', network: 'Ethereum (ERC-20)' },
  { value: 'USDC', label: 'USD Coin', network: 'Ethereum (ERC-20)' },
];

export default function UnifiedDepositModal({ visible, onClose, onSuccess }: UnifiedDepositModalProps) {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const { showSuccess, showError } = useToast();

  const [activeMethod, setActiveMethod] = useState<DepositMethod>('bank_transfer');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Crypto-specific state
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('BTC');
  const [depositAddress] = useState('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'); // Demo address

  // Cash courier-specific state
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('next_4_hours');
  const [insuranceAmount, setInsuranceAmount] = useState('100000');

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      console.clear();
      setAmount('');
      setError('');
      setIsSubmitting(false);
      setActiveMethod('bank_transfer');
      setPickupAddress('');
    }
  }, [visible]);

  useEffect(() => {
    if (visible && accounts.length > 0 && !selectedAccountId) {
      console.clear();
      setSelectedAccountId(accounts[0].id);
    }
  }, [visible, accounts, selectedAccountId]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    showSuccess(`${label} copied to clipboard`);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDeposit = async () => {
    console.clear();
    setError('');

    // Validation
    if (!selectedAccountId) {
      setError('Please select an account');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (!amount || isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Cash courier validation
    if (activeMethod === 'cash_courier') {
      if (depositAmount < 10000) {
        setError('Cash courier requires minimum deposit of $10,000');
        return;
      }
      if (depositAmount > 500000) {
        setError('Cash courier maximum deposit is $500,000');
        return;
      }
      if (!pickupAddress.trim()) {
        setError('Please enter pickup address');
        return;
      }
    }

    if (!user?.id) {
      setError('Authentication required');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    try {
      const result = await depositWithdrawalService.createDeposit(
        {
          accountId: selectedAccountId,
          amount: depositAmount,
          method: activeMethod as ServiceDepositMethod,
        },
        user.id
      );

      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        showSuccess(result.message);
        await refetchAccounts();

        if (onSuccess) onSuccess();

        setAmount('');
        setError('');
        setTimeout(() => onClose(), 100);
      } else {
        setError(result.error || 'Deposit failed');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err: any) {
      console.error('Deposit error:', err);
      setError(err.message || 'Failed to process deposit');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (amt: string) => {
    setAmount(amt);
    setError('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                <TouchableOpacity
                  style={styles.copyRow}
                  onPress={() => handleCopy('Bental Advisor Inc.', 'Account name')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.instructionValue}>Bental Advisor Inc.</Text>
                  <Copy size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionLabel}>Account Number:</Text>
                <TouchableOpacity
                  style={styles.copyRow}
                  onPress={() => handleCopy('1234567890', 'Account number')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.instructionValue}>1234567890</Text>
                  <Copy size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionLabel}>Routing Number:</Text>
                <TouchableOpacity
                  style={styles.copyRow}
                  onPress={() => handleCopy('021000021', 'Routing number')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.instructionValue}>021000021</Text>
                  <Copy size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        );

      case 'crypto':
        const cryptoInfo = CRYPTO_CURRENCIES.find(c => c.value === selectedCrypto)!;
        return (
          <View style={styles.methodContent}>
            {/* Currency Selector */}
            <View style={styles.section}>
              <Text style={styles.label}>Select Cryptocurrency</Text>
              <View style={styles.cryptoSelector}>
                {CRYPTO_CURRENCIES.map((crypto) => (
                  <TouchableOpacity
                    key={crypto.value}
                    style={[
                      styles.cryptoOption,
                      selectedCrypto === crypto.value && styles.cryptoOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedCrypto(crypto.value);
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cryptoLabel,
                        selectedCrypto === crypto.value && styles.cryptoLabelActive,
                      ]}
                    >
                      {crypto.value}
                    </Text>
                    {selectedCrypto === crypto.value && <Check size={16} color="#F7931A" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Deposit Address */}
            <BlurView intensity={40} tint="dark" style={styles.cryptoAddressBox}>
              <View style={styles.cryptoAddressHeader}>
                <Bitcoin size={20} color="#F7931A" />
                <View style={styles.cryptoAddressInfo}>
                  <Text style={styles.cryptoAddressTitle}>{cryptoInfo.label} Address</Text>
                  <Text style={styles.cryptoAddressNetwork}>{cryptoInfo.network}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.cryptoAddressContainer}
                onPress={() => handleCopy(depositAddress, 'Deposit address')}
                activeOpacity={0.7}
              >
                <Text style={styles.cryptoAddress}>{depositAddress}</Text>
                <View style={styles.cryptoCopyButton}>
                  <Copy size={16} color="#F7931A" />
                  <Text style={styles.cryptoCopyText}>Copy</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.cryptoInfoRow}>
                <Text style={styles.cryptoInfoLabel}>Network:</Text>
                <Text style={styles.cryptoInfoValue}>{cryptoInfo.network}</Text>
              </View>
              <View style={styles.cryptoInfoRow}>
                <Text style={styles.cryptoInfoLabel}>Min Deposit:</Text>
                <Text style={styles.cryptoInfoValue}>0.001 {selectedCrypto}</Text>
              </View>
              <View style={styles.cryptoInfoRow}>
                <Text style={styles.cryptoInfoLabel}>Confirmations:</Text>
                <Text style={styles.cryptoInfoValue}>{selectedCrypto === 'BTC' ? '3' : '12'} blocks</Text>
              </View>
            </BlurView>

            <BlurView intensity={30} tint="dark" style={styles.warningBox}>
              <AlertCircle size={18} color="#F59E0B" />
              <Text style={styles.warningText}>
                Only send {cryptoInfo.label} to this address. Sending other cryptocurrencies may result in loss of funds.
              </Text>
            </BlurView>
          </View>
        );

      case 'cash_courier':
        return (
          <View style={styles.methodContent}>
            <BlurView intensity={30} tint="dark" style={styles.infoBox}>
              <Text style={styles.infoText}>
                Secure cash pickup service for deposits $10,000 - $500,000. Same-day processing with full insurance.
              </Text>
            </BlurView>

            <View style={styles.section}>
              <Text style={styles.label}>Pickup Address</Text>
              <BlurView intensity={60} tint="dark" style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                  placeholder="Enter full pickup address..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  editable={!isSubmitting}
                />
              </BlurView>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Pickup Time</Text>
              <View style={styles.pickupTimeOptions}>
                {[
                  { value: 'next_4_hours', label: 'Next 4 Hours' },
                  { value: 'same_day', label: 'Same Day' },
                  { value: 'next_day', label: 'Next Day' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.pickupTimeOption,
                      pickupTime === option.value && styles.pickupTimeOptionActive,
                    ]}
                    onPress={() => {
                      setPickupTime(option.value);
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Calendar size={16} color={pickupTime === option.value ? '#EAB308' : colors.textSecondary} />
                    <Text
                      style={[
                        styles.pickupTimeLabel,
                        pickupTime === option.value && styles.pickupTimeLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Insurance Coverage</Text>
              <View style={styles.insuranceOptions}>
                {['100000', '250000', '500000', '1000000'].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.insuranceOption,
                      insuranceAmount === amt && styles.insuranceOptionActive,
                    ]}
                    onPress={() => {
                      setInsuranceAmount(amt);
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.insuranceLabel,
                        insuranceAmount === amt && styles.insuranceLabelActive,
                      ]}
                    >
                      ${(parseInt(amt) / 1000).toFixed(0)}K
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <BlurView intensity={30} tint="dark" style={styles.warningBox}>
              <AlertCircle size={18} color="#EAB308" />
              <Text style={styles.warningText}>
                Valid ID required at pickup. Courier tracking provided after booking.
              </Text>
            </BlurView>
          </View>
        );

      case 'card':
        return (
          <View style={styles.methodContent}>
            <BlurView intensity={30} tint="dark" style={styles.infoBox}>
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
              <Text style={styles.instructionsTitle}>Mail Check To:</Text>
              <Text style={styles.instructionText}>
                Bental Advisor Inc.{'\n'}
                PO Box 12345{'\n'}
                New York, NY 10001
              </Text>
              <Text style={[styles.instructionText, { marginTop: 12 }]}>
                Include your account reference on the memo line.
              </Text>
            </BlurView>
            <BlurView intensity={30} tint="dark" style={styles.infoBox}>
              <Text style={styles.infoText}>
                Checks typically clear within 5-7 business days after receipt.
              </Text>
            </BlurView>
          </View>
        );
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
      accessibilityLabel="Deposit funds"
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
                <Download size={24} color="#10B981" />
                <Text style={styles.headerTitle}>Deposit Funds</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isSubmitting}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close deposit modal"
              >
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {/* Account Selector */}
              <View style={styles.section}>
                <Text style={styles.label}>Deposit To</Text>
                <AccountSelector
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  onSelect={setSelectedAccountId}
                  showBalance={true}
                />
              </View>

              {/* Deposit Method Tabs */}
              <View style={styles.section}>
                <Text style={styles.label}>Deposit Method</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.methodTabs}
                  contentContainerStyle={styles.methodTabsContent}
                >
                  {DEPOSIT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isActive = activeMethod === method.id;
                    return (
                      <TouchableOpacity
                        key={method.id}
                        style={[styles.methodTab, isActive && styles.methodTabActive]}
                        onPress={() => {
                          setActiveMethod(method.id);
                          setError('');
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <BlurView intensity={isActive ? 60 : 30} tint="dark" style={styles.methodTabInner}>
                          <Icon size={20} color={isActive ? method.color : colors.textSecondary} />
                          <View style={styles.methodTabInfo}>
                            <Text style={[styles.methodTabLabel, isActive && { color: method.color }]}>
                              {method.label}
                            </Text>
                            <Text style={styles.methodTabSubtitle}>{method.subtitle}</Text>
                          </View>
                        </BlurView>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Amount */}
              <View style={styles.section}>
                <Text style={styles.label}>Amount</Text>
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
                    accessibilityLabel="Deposit amount"
                  />
                </BlurView>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmounts}>
                  {activeMethod === 'cash_courier'
                    ? ['10000', '25000', '50000', '100000'].map((amt) => (
                        <TouchableOpacity
                          key={amt}
                          style={styles.quickAmount}
                          onPress={() => handleQuickAmount(amt)}
                          activeOpacity={0.7}
                          disabled={isSubmitting}
                        >
                          <Text style={styles.quickAmountText}>${(parseInt(amt) / 1000).toFixed(0)}K</Text>
                        </TouchableOpacity>
                      ))
                    : ['100', '500', '1000', '5000'].map((amt) => (
                        <TouchableOpacity
                          key={amt}
                          style={styles.quickAmount}
                          onPress={() => handleQuickAmount(amt)}
                          activeOpacity={0.7}
                          disabled={isSubmitting}
                        >
                          <Text style={styles.quickAmountText}>${amt}</Text>
                        </TouchableOpacity>
                      ))}
                </View>
              </View>

              {/* Method-Specific Content */}
              {renderMethodContent()}

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleDeposit}
                activeOpacity={0.8}
                disabled={isSubmitting || !amount || !selectedAccountId}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Submit deposit"
                accessibilityState={{ disabled: isSubmitting }}
              >
                <LinearGradient
                  colors={isSubmitting ? ['#6B7280', '#4B5563'] : ['#10B981', '#059669']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <ButtonSpinner />
                  ) : (
                    <>
                      <Download size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>
                        {activeMethod === 'crypto' ? 'Generate Deposit Address' : 'Submit Deposit Request'}
                      </Text>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  methodTabs: {
    marginBottom: 0,
  },
  methodTabsContent: {
    gap: 12,
    paddingRight: 24,
  },
  methodTab: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    minWidth: 140,
  },
  methodTabActive: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  methodTabInner: {
    padding: 12,
    gap: 8,
  },
  methodTabInfo: {
    gap: 2,
  },
  methodTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  methodTabSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
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
    gap: 12,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  instructionItem: {
    gap: 6,
  },
  instructionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  copyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
  },
  instructionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  instructionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cryptoSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  cryptoOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  cryptoOptionActive: {
    backgroundColor: 'rgba(247, 147, 26, 0.12)',
    borderColor: '#F7931A',
  },
  cryptoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cryptoLabelActive: {
    color: '#F7931A',
  },
  cryptoAddressBox: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(247, 147, 26, 0.3)',
    overflow: 'hidden',
    gap: 12,
  },
  cryptoAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cryptoAddressInfo: {
    flex: 1,
  },
  cryptoAddressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cryptoAddressNetwork: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cryptoAddressContainer: {
    gap: 12,
  },
  cryptoAddress: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#F7931A',
    padding: 12,
    backgroundColor: 'rgba(247, 147, 26, 0.08)',
    borderRadius: radius.md,
  },
  cryptoCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(247, 147, 26, 0.15)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(247, 147, 26, 0.3)',
  },
  cryptoCopyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F7931A',
  },
  cryptoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cryptoInfoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  cryptoInfoValue: {
    fontSize: 13,
    fontWeight: '600',
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
  pickupTimeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  pickupTimeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  pickupTimeOptionActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: '#EAB308',
  },
  pickupTimeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pickupTimeLabelActive: {
    color: '#EAB308',
  },
  insuranceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  insuranceOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
  },
  insuranceOptionActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: '#EAB308',
  },
  insuranceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  insuranceLabelActive: {
    color: '#EAB308',
  },
  infoBox: {
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    overflow: 'hidden',
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    overflow: 'hidden',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#F59E0B',
    lineHeight: 18,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
