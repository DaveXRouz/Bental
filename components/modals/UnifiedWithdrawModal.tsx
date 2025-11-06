import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Upload, Building2, CreditCard, Bitcoin, Check, AlertCircle, Zap, DollarSign, Wallet, ChevronDown, ChevronUp } from 'lucide-react-native';
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

type WithdrawMethod = 'bank_transfer' | 'wire' | 'check' | 'ach' | 'paypal' | 'venmo' | 'crypto' | 'debit_card';
type CategoryType = 'banking' | 'digital' | 'crypto';

interface MethodOption {
  id: WithdrawMethod;
  label: string;
  speed: string;
  fee: string;
  icon: typeof Building2;
  color: string;
}

interface CategoryOption {
  id: CategoryType;
  label: string;
  subtitle: string;
  icon: typeof Building2;
  color: string;
  methods: MethodOption[];
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'banking',
    label: 'Traditional Banking',
    subtitle: 'Bank transfers & checks',
    icon: Building2,
    color: '#3B82F6',
    methods: [
      { id: 'ach', label: 'ACH Transfer', speed: 'Next day', fee: 'Free', icon: Zap, color: '#06B6D4' },
      { id: 'bank_transfer', label: 'Bank Transfer', speed: '2-3 days', fee: 'Free', icon: Building2, color: '#3B82F6' },
      { id: 'wire', label: 'Wire Transfer', speed: 'Same day', fee: '$25', icon: Building2, color: '#8B5CF6' },
      { id: 'check', label: 'Check by Mail', speed: '5-7 days', fee: 'Free', icon: Check, color: '#6B7280' },
    ],
  },
  {
    id: 'digital',
    label: 'Digital Wallets',
    subtitle: 'PayPal, Venmo & Cards',
    icon: Wallet,
    color: '#10B981',
    methods: [
      { id: 'paypal', label: 'PayPal', speed: 'Instant', fee: '1%', icon: DollarSign, color: '#0070BA' },
      { id: 'venmo', label: 'Venmo', speed: 'Instant', fee: '1%', icon: Wallet, color: '#3D95CE' },
      { id: 'debit_card', label: 'Debit Card', speed: 'Instant', fee: '2.9%', icon: CreditCard, color: '#10B981' },
    ],
  },
  {
    id: 'crypto',
    label: 'Cryptocurrency',
    subtitle: 'BTC, ETH, USDT, USDC',
    icon: Bitcoin,
    color: '#F7931A',
    methods: [
      { id: 'crypto', label: 'Crypto Wallet', speed: '15-60 min', fee: 'Network fees', icon: Bitcoin, color: '#F7931A' },
    ],
  },
];

export default function UnifiedWithdrawModal({ visible, onClose, onSuccess }: UnifiedWithdrawModalProps) {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const { showSuccess, showError } = useToast();

  const [expandedCategory, setExpandedCategory] = useState<CategoryType | null>(null);
  const [activeMethod, setActiveMethod] = useState<WithdrawMethod | null>(null);
  const [amount, setAmount] = useState('');

  // Traditional banking fields
  const [bankName, setBankName] = useState('');
  const [accountLast4, setAccountLast4] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  // Digital wallet fields
  const [email, setEmail] = useState('');

  // Crypto fields
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState<'BTC' | 'ETH' | 'USDT' | 'USDC'>('BTC');

  // Card fields
  const [cardLast4, setCardLast4] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryAccount, setPrimaryAccount] = useState<any>(null);
  const availableBalance = primaryAccount ? Number(primaryAccount.balance) : 0;

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      console.clear();
      setExpandedCategory(null);
      setActiveMethod(null);
      setAmount('');
      setBankName('');
      setAccountLast4('');
      setRoutingNumber('');
      setEmail('');
      setCryptoAddress('');
      setCryptoCurrency('BTC');
      setCardLast4('');
      setIsSubmitting(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && accounts.length > 0) {
      console.clear();
      setPrimaryAccount(accounts[0]);
    }
  }, [visible, accounts]);

  const handleCategoryPress = (categoryId: CategoryType) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      setActiveMethod(null);
    } else {
      setExpandedCategory(categoryId);
      // Auto-select first method in category
      const category = CATEGORIES.find((c) => c.id === categoryId);
      if (category && category.methods.length > 0) {
        setActiveMethod(category.methods[0].id);
      }
    }
  };

  const handleMethodSelect = (methodId: WithdrawMethod) => {
    setActiveMethod(methodId);
  };

  const handleWithdraw = async () => {
    console.clear();
    if (!amount || parseFloat(amount) <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!activeMethod) {
      showError('Please select a withdrawal method');
      return;
    }

    // Method-specific validation
    if (['bank_transfer', 'wire', 'check', 'ach'].includes(activeMethod)) {
      if (!bankName.trim()) {
        showError('Please enter bank name');
        return;
      }
      if (!accountLast4 || accountLast4.length !== 4) {
        showError('Please enter last 4 digits of account number');
        return;
      }
    }

    if (['paypal', 'venmo'].includes(activeMethod)) {
      if (!email.trim()) {
        showError('Please enter your email address');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
      }
    }

    if (activeMethod === 'crypto') {
      if (!cryptoAddress.trim()) {
        showError('Please enter crypto wallet address');
        return;
      }
      if (cryptoAddress.length < 26) {
        showError('Invalid wallet address');
        return;
      }
    }

    if (activeMethod === 'debit_card') {
      if (!cardLast4 || cardLast4.length !== 4) {
        showError('Please enter last 4 digits of card number');
        return;
      }
      if (parseFloat(amount) > 10000) {
        showError('Debit card withdrawals are limited to $10,000');
        return;
      }
    }

    if (!user?.id || !primaryAccount) {
      showError('Account information not available');
      return;
    }

    const withdrawAmount = parseFloat(amount);

    setIsSubmitting(true);
    try {
      const withdrawalRequest: any = {
        accountId: primaryAccount.id,
        amount: withdrawAmount,
        method: activeMethod as ServiceWithdrawalMethod,
      };

      // Add method-specific fields
      if (['bank_transfer', 'wire', 'check', 'ach'].includes(activeMethod)) {
        withdrawalRequest.bankName = bankName.trim();
        withdrawalRequest.accountNumberLast4 = accountLast4;
        withdrawalRequest.routingNumber = routingNumber || undefined;
      }

      if (['paypal', 'venmo'].includes(activeMethod)) {
        withdrawalRequest.email = email.trim();
      }

      if (activeMethod === 'crypto') {
        withdrawalRequest.cryptoAddress = cryptoAddress.trim();
        withdrawalRequest.cryptoCurrency = cryptoCurrency;
        withdrawalRequest.cryptoNetwork = cryptoCurrency === 'BTC' ? 'Bitcoin Mainnet' : 'Ethereum (ERC-20)';
      }

      if (activeMethod === 'debit_card') {
        withdrawalRequest.cardLast4 = cardLast4;
      }

      const result = await depositWithdrawalService.createWithdrawal(withdrawalRequest, user.id);

      if (result.success) {
        await refetchAccounts();
        if (onSuccess) onSuccess();
        showSuccess(result.message);
        setAmount('');
        setBankName('');
        setAccountLast4('');
        setRoutingNumber('');
        setEmail('');
        setCryptoAddress('');
        setCardLast4('');
        setExpandedCategory(null);
        setActiveMethod(null);
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

  const renderMethodFields = () => {
    if (!activeMethod) return null;

    // Traditional banking methods
    if (['bank_transfer', 'wire', 'check', 'ach'].includes(activeMethod)) {
      return (
        <View style={styles.fieldsContainer}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Bank Name</Text>
            <BlurView intensity={60} tint="dark" style={styles.fieldInput}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter bank name"
                placeholderTextColor={colors.textMuted}
                value={bankName}
                onChangeText={setBankName}
              />
            </BlurView>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Account Number (Last 4 Digits)</Text>
            <BlurView intensity={60} tint="dark" style={styles.fieldInput}>
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

          {(activeMethod === 'bank_transfer' || activeMethod === 'wire' || activeMethod === 'ach') && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Routing Number (Optional)</Text>
              <BlurView intensity={60} tint="dark" style={styles.fieldInput}>
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
        </View>
      );
    }

    // PayPal / Venmo
    if (activeMethod === 'paypal' || activeMethod === 'venmo') {
      return (
        <View style={styles.fieldsContainer}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{activeMethod === 'paypal' ? 'PayPal' : 'Venmo'} Email</Text>
            <BlurView intensity={60} tint="dark" style={styles.fieldInput}>
              <TextInput
                style={styles.textInput}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </BlurView>
          </View>

          <BlurView intensity={30} tint="dark" style={styles.warningBox}>
            <AlertCircle size={18} color="#F59E0B" />
            <Text style={styles.warningText}>
              Ensure your email is verified on {activeMethod === 'paypal' ? 'PayPal' : 'Venmo'} to receive funds instantly.
            </Text>
          </BlurView>
        </View>
      );
    }

    // Crypto
    if (activeMethod === 'crypto') {
      const CRYPTO_OPTIONS = [
        { value: 'BTC', label: 'Bitcoin' },
        { value: 'ETH', label: 'Ethereum' },
        { value: 'USDT', label: 'Tether' },
        { value: 'USDC', label: 'USD Coin' },
      ];

      return (
        <View style={styles.fieldsContainer}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Select Cryptocurrency</Text>
            <View style={styles.cryptoGrid}>
              {CRYPTO_OPTIONS.map((crypto) => (
                <TouchableOpacity
                  key={crypto.value}
                  style={[
                    styles.cryptoChip,
                    cryptoCurrency === crypto.value && styles.cryptoChipActive,
                  ]}
                  onPress={() => setCryptoCurrency(crypto.value as any)}
                >
                  <Text
                    style={[
                      styles.cryptoChipText,
                      cryptoCurrency === crypto.value && styles.cryptoChipTextActive,
                    ]}
                  >
                    {crypto.value}
                  </Text>
                  {cryptoCurrency === crypto.value && <Check size={14} color="#F7931A" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Wallet Address</Text>
            <BlurView intensity={60} tint="dark" style={styles.fieldInput}>
              <TextInput
                style={[styles.textInput, { fontFamily: 'monospace', fontSize: 13 }]}
                placeholder="Enter your wallet address"
                placeholderTextColor={colors.textMuted}
                value={cryptoAddress}
                onChangeText={setCryptoAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </BlurView>
          </View>

          <BlurView intensity={30} tint="dark" style={styles.warningBox}>
            <AlertCircle size={18} color="#EF4444" />
            <Text style={styles.warningText}>
              Cryptocurrency transactions are irreversible. Double-check your wallet address before submitting.
            </Text>
          </BlurView>
        </View>
      );
    }

    // Debit Card
    if (activeMethod === 'debit_card') {
      return (
        <View style={styles.fieldsContainer}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Card Number (Last 4 Digits)</Text>
            <BlurView intensity={60} tint="dark" style={styles.fieldInput}>
              <CreditCard size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.textInput, { marginLeft: 12 }]}
                placeholder="1234"
                placeholderTextColor={colors.textMuted}
                value={cardLast4}
                onChangeText={setCardLast4}
                keyboardType="number-pad"
                maxLength={4}
              />
            </BlurView>
          </View>

          <BlurView intensity={30} tint="dark" style={styles.warningBox}>
            <AlertCircle size={18} color="#F59E0B" />
            <Text style={styles.warningText}>
              Maximum withdrawal is $10,000 per transaction. A 2.9% processing fee applies.
            </Text>
          </BlurView>
        </View>
      );
    }

    return null;
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

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
                <BlurView intensity={60} tint="dark" style={styles.amountInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountTextInput}
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

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Withdrawal Method</Text>
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isExpanded = expandedCategory === category.id;

                  return (
                    <View key={category.id} style={styles.categoryWrapper}>
                      <TouchableOpacity
                        style={[styles.categoryCard, isExpanded && styles.categoryCardActive]}
                        onPress={() => handleCategoryPress(category.id)}
                      >
                        <BlurView intensity={isExpanded ? 60 : 40} tint="dark" style={styles.categoryCardInner}>
                          <View style={styles.categoryHeader}>
                            <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                              <Icon size={24} color={category.color} />
                            </View>
                            <View style={styles.categoryInfo}>
                              <Text style={styles.categoryLabel}>{category.label}</Text>
                              <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                            </View>
                            {isExpanded ? (
                              <ChevronUp size={20} color={colors.textSecondary} />
                            ) : (
                              <ChevronDown size={20} color={colors.textSecondary} />
                            )}
                          </View>
                        </BlurView>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.methodsList}>
                          {category.methods.map((method) => {
                            const MethodIcon = method.icon;
                            const isActive = activeMethod === method.id;

                            return (
                              <TouchableOpacity
                                key={method.id}
                                style={[styles.methodChip, isActive && styles.methodChipActive]}
                                onPress={() => handleMethodSelect(method.id)}
                              >
                                <MethodIcon size={16} color={isActive ? method.color : colors.textSecondary} />
                                <View style={styles.methodChipInfo}>
                                  <Text style={[styles.methodChipLabel, isActive && { color: method.color }]}>
                                    {method.label}
                                  </Text>
                                  <Text style={styles.methodChipMeta}>
                                    {method.speed} • {method.fee}
                                  </Text>
                                </View>
                                {isActive && <Check size={16} color={method.color} />}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {activeMethod && (
                <>
                  {renderMethodFields()}

                  <BlurView intensity={40} tint="dark" style={styles.reviewInfoBox}>
                    <AlertCircle size={18} color="#3B82F6" />
                    <Text style={styles.reviewInfoText}>
                      Your withdrawal will be submitted for admin review. You'll be notified once it's processed, usually within 24 hours.
                    </Text>
                  </BlurView>
                </>
              )}

              <TouchableOpacity
                style={[styles.submitButton, !activeMethod && styles.submitButtonDisabled]}
                onPress={handleWithdraw}
                activeOpacity={0.8}
                disabled={isSubmitting || !activeMethod}
              >
                <LinearGradient
                  colors={!activeMethod ? ['#4B5563', '#374151'] : ['#F59E0B', '#D97706']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <ButtonSpinner />
                  ) : (
                    <>
                      <Upload size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Submit for Review</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  amountInput: {
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
  amountTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
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
  categoryWrapper: {
    marginBottom: 12,
  },
  categoryCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  categoryCardActive: {
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  categoryCardInner: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  methodsList: {
    marginTop: 12,
    gap: 8,
    paddingLeft: 8,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(26, 26, 28, 0.6)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  methodChipActive: {
    backgroundColor: 'rgba(26, 26, 28, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  methodChipInfo: {
    flex: 1,
  },
  methodChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  methodChipMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  fieldsContainer: {
    marginTop: 24,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  cryptoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cryptoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(26, 26, 28, 0.6)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  cryptoChipActive: {
    backgroundColor: 'rgba(247, 147, 26, 0.12)',
    borderColor: 'rgba(247, 147, 26, 0.3)',
  },
  cryptoChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cryptoChipTextActive: {
    color: '#F7931A',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.08)',
    overflow: 'hidden',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#F59E0B',
    lineHeight: 18,
  },
  reviewInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.08)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  reviewInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.glass,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
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
