import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  Plus,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { ButtonSpinner, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastManager';
import { useAuth } from '@/contexts/AuthContext';
import {
  accountManagementService,
  AccountType,
  CreateAccountParams,
} from '@/services/accounts/account-management-service';

const { height, width } = Dimensions.get('window');

interface CreateAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'select_type' | 'configure' | 'review';

const ACCOUNT_TYPE_ICONS: Record<string, any> = {
  Wallet: Wallet,
  Bitcoin: require('lucide-react-native').Bitcoin,
  LineChart: require('lucide-react-native').LineChart,
  DollarSign: require('lucide-react-native').DollarSign,
  TrendingUp: require('lucide-react-native').TrendingUp,
  Home: require('lucide-react-native').Home,
  Zap: require('lucide-react-native').Zap,
  PiggyBank: require('lucide-react-native').PiggyBank,
};

export default function CreateAccountModal({ visible, onClose, onSuccess }: CreateAccountModalProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState<Step>('select_type');
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountDescription, setAccountDescription] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      console.clear();
      fetchAccountTypes();
      setStep('select_type');
      setSelectedType(null);
      setAccountName('');
      setAccountDescription('');
      setInitialDeposit('');
      setCurrency('USD');
      setError('');
      setIsSubmitting(false);
    }
  }, [visible]);

  const fetchAccountTypes = async () => {
    setLoadingTypes(true);
    const result = await accountManagementService.getAccountTypes();
    if (result.success && result.data) {
      setAccountTypes(result.data);
    }
    setLoadingTypes(false);
  };

  const handleTypeSelect = (type: AccountType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedType(type);
    // Auto-fill suggested name
    setAccountName(`My ${type.name}`);
    setStep('configure');
    setError('');
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (step === 'configure') {
      setStep('select_type');
    } else if (step === 'review') {
      setStep('configure');
    }
    setError('');
  };

  const handleNext = () => {
    setError('');

    if (step === 'configure') {
      // Validate inputs
      if (!accountName.trim()) {
        setError('Please enter an account name');
        return;
      }

      if (accountName.trim().length > 50) {
        setError('Account name must be less than 50 characters');
        return;
      }

      const depositAmount = parseFloat(initialDeposit);
      if (initialDeposit && (isNaN(depositAmount) || depositAmount < 0)) {
        setError('Please enter a valid initial deposit amount');
        return;
      }

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setStep('review');
    }
  };

  const handleCreateAccount = async () => {
    console.clear();
    setError('');

    if (!selectedType || !user?.id) {
      setError('Please select an account type');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    try {
      const params: CreateAccountParams = {
        accountType: selectedType.id,
        name: accountName.trim(),
        description: accountDescription.trim() || undefined,
        currency,
        initialDeposit: initialDeposit ? parseFloat(initialDeposit) : 0,
      };

      const result = await accountManagementService.createAccount(user.id, params);

      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        showSuccess(result.message || 'Account created successfully');

        if (onSuccess) onSuccess();

        // Reset and close
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        setError(result.error || 'Failed to create account');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err: any) {
      console.error('Create account error:', err);
      setError(err.message || 'Failed to create account');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'select_type', label: 'Type' },
      { key: 'configure', label: 'Details' },
      { key: 'review', label: 'Review' },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((s, index) => (
          <View key={s.key} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                index <= currentStepIndex && styles.stepCircleActive,
              ]}
            >
              {index < currentStepIndex ? (
                <Check size={14} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    index <= currentStepIndex && styles.stepNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                index <= currentStepIndex && styles.stepLabelActive,
              ]}
            >
              {s.label}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  index < currentStepIndex && styles.stepConnectorActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderSelectType = () => {
    const categorizedTypes = {
      cash: accountTypes.filter(t => t.category === 'cash'),
      investment: accountTypes.filter(t => t.category === 'investment'),
      specialized: accountTypes.filter(t => t.category === 'specialized'),
    };

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Select Account Type</Text>
        <Text style={styles.stepSubtitle}>Choose the type of account you want to create</Text>

        {loadingTypes ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" />
          </View>
        ) : (
          <>
            {Object.entries(categorizedTypes).map(([category, types]) => {
              if (types.length === 0) return null;

              return (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} Accounts
                  </Text>

                  {types.map(type => {
                    const IconComponent = ACCOUNT_TYPE_ICONS[type.icon] || Wallet;

                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={styles.typeCard}
                        onPress={() => handleTypeSelect(type)}
                        activeOpacity={0.7}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`${type.name}: ${type.description}`}
                      >
                        <BlurView intensity={60} tint="dark" style={styles.typeCardBlur}>
                          <View style={styles.typeCardContent}>
                            <View
                              style={[
                                styles.typeIconContainer,
                                { backgroundColor: `${type.color}20` },
                              ]}
                            >
                              <IconComponent size={24} color={type.color} />
                            </View>

                            <View style={styles.typeInfo}>
                              <Text style={styles.typeName}>{type.name}</Text>
                              <Text style={styles.typeDescription}>{type.description}</Text>

                              <View style={styles.typeFeatures}>
                                {type.allows_deposits && (
                                  <View style={styles.featureBadge}>
                                    <Text style={styles.featureText}>Deposits</Text>
                                  </View>
                                )}
                                {type.allows_withdrawals && (
                                  <View style={styles.featureBadge}>
                                    <Text style={styles.featureText}>Withdrawals</Text>
                                  </View>
                                )}
                                {type.allows_trading && (
                                  <View style={styles.featureBadge}>
                                    <Text style={styles.featureText}>Trading</Text>
                                  </View>
                                )}
                                {type.allows_crypto && (
                                  <View style={styles.featureBadge}>
                                    <Text style={styles.featureText}>Crypto</Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            <ChevronRight size={20} color={colors.textMuted} />
                          </View>
                        </BlurView>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    );
  };

  const renderConfigure = () => {
    if (!selectedType) return null;

    const IconComponent = ACCOUNT_TYPE_ICONS[selectedType.icon] || Wallet;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Configure Account</Text>
        <Text style={styles.stepSubtitle}>Customize your {selectedType.name}</Text>

        {/* Selected Type Display */}
        <View style={styles.selectedTypeDisplay}>
          <BlurView intensity={50} tint="dark" style={styles.selectedTypeBlur}>
            <View
              style={[
                styles.selectedTypeIcon,
                { backgroundColor: `${selectedType.color}20` },
              ]}
            >
              <IconComponent size={20} color={selectedType.color} />
            </View>
            <Text style={styles.selectedTypeName}>{selectedType.name}</Text>
          </BlurView>
        </View>

        {/* Account Name */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Account Name <Text style={styles.required}>*</Text>
          </Text>
          <BlurView intensity={60} tint="dark" style={styles.input}>
            <TextInput
              style={styles.textInput}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g., My Investment Account"
              placeholderTextColor={colors.textMuted}
              editable={!isSubmitting}
              maxLength={50}
              accessible={true}
              accessibilityLabel="Account name"
            />
          </BlurView>
          <Text style={styles.helperText}>{accountName.length}/50 characters</Text>
        </View>

        {/* Description (Optional) */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Description (Optional)</Text>
          <BlurView intensity={60} tint="dark" style={[styles.input, styles.textAreaInput]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={accountDescription}
              onChangeText={setAccountDescription}
              placeholder="What will you use this account for?"
              placeholderTextColor={colors.textMuted}
              editable={!isSubmitting}
              multiline
              numberOfLines={3}
              accessible={true}
              accessibilityLabel="Account description"
            />
          </BlurView>
        </View>

        {/* Initial Deposit (Optional) */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Initial Deposit (Optional)</Text>
          <BlurView intensity={60} tint="dark" style={styles.input}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.textInput}
              value={initialDeposit}
              onChangeText={setInitialDeposit}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              editable={!isSubmitting}
              accessible={true}
              accessibilityLabel="Initial deposit amount"
            />
          </BlurView>
          <Text style={styles.helperText}>You can add funds later</Text>
        </View>
      </ScrollView>
    );
  };

  const renderReview = () => {
    if (!selectedType) return null;

    const IconComponent = ACCOUNT_TYPE_ICONS[selectedType.icon] || Wallet;
    const depositAmount = initialDeposit ? parseFloat(initialDeposit) : 0;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Review & Confirm</Text>
        <Text style={styles.stepSubtitle}>Review your account details before creating</Text>

        <BlurView intensity={60} tint="dark" style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View
              style={[
                styles.reviewIcon,
                { backgroundColor: `${selectedType.color}20` },
              ]}
            >
              <IconComponent size={28} color={selectedType.color} />
            </View>
            <View style={styles.reviewHeaderInfo}>
              <Text style={styles.reviewTypeName}>{selectedType.name}</Text>
              <Text style={styles.reviewAccountName}>{accountName}</Text>
            </View>
          </View>

          {accountDescription && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Description</Text>
              <Text style={styles.reviewValue}>{accountDescription}</Text>
            </View>
          )}

          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Currency</Text>
            <Text style={styles.reviewValue}>{currency}</Text>
          </View>

          {depositAmount > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Initial Deposit</Text>
              <Text style={styles.reviewValueHighlight}>
                ${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          <View style={styles.reviewFeatures}>
            <Text style={styles.reviewFeaturesTitle}>Account Features</Text>
            <View style={styles.reviewFeaturesList}>
              {selectedType.allows_deposits && (
                <View style={styles.reviewFeatureItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={styles.reviewFeatureText}>Deposits Enabled</Text>
                </View>
              )}
              {selectedType.allows_withdrawals && (
                <View style={styles.reviewFeatureItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={styles.reviewFeatureText}>Withdrawals Enabled</Text>
                </View>
              )}
              {selectedType.allows_trading && (
                <View style={styles.reviewFeatureItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={styles.reviewFeatureText}>Trading Enabled</Text>
                </View>
              )}
              {selectedType.allows_crypto && (
                <View style={styles.reviewFeatureItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={styles.reviewFeatureText}>Crypto Support</Text>
                </View>
              )}
            </View>
          </View>
        </BlurView>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel="Create new account"
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={styles.blurOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={isSubmitting ? undefined : onClose}
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
                <Plus size={24} color="#10B981" />
                <Text style={styles.headerTitle}>Create Account</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isSubmitting}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close create account modal"
              >
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Step Content */}
            <View style={styles.content}>
              {step === 'select_type' && renderSelectType()}
              {step === 'configure' && renderConfigure()}
              {step === 'review' && renderReview()}
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Footer Actions */}
            <View style={styles.footer}>
              {step !== 'select_type' && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <BlurView intensity={50} tint="dark" style={styles.backButtonBlur}>
                    <ChevronLeft size={20} color={colors.text} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </BlurView>
                </TouchableOpacity>
              )}

              {step === 'configure' && (
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1, marginLeft: spacing.md }]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to review"
                >
                  <LinearGradient
                    colors={['#3B82F6', '#8B5CF6']}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.actionButtonText}>Continue</Text>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {step === 'review' && (
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1, marginLeft: spacing.md }]}
                  onPress={handleCreateAccount}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                  accessibilityState={{ disabled: isSubmitting }}
                >
                  <LinearGradient
                    colors={isSubmitting ? ['#6B7280', '#4B5563'] : ['#10B981', '#059669']}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isSubmitting ? (
                      <ButtonSpinner size="small" />
                    ) : (
                      <>
                        <Check size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Create Account</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
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
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: -1,
  },
  stepConnectorActive: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeCard: {
    marginBottom: 12,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  typeCardBlur: {
    padding: 16,
  },
  typeCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  typeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  featureText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedTypeDisplay: {
    marginBottom: 24,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  selectedTypeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  selectedTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
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
  textAreaInput: {
    alignItems: 'flex-start',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  reviewCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  reviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderInfo: {
    flex: 1,
  },
  reviewTypeName: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  reviewAccountName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  reviewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reviewValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  reviewFeatures: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: GLASS.border,
  },
  reviewFeaturesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  reviewFeaturesList: {
    gap: 8,
  },
  reviewFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewFeatureText: {
    fontSize: 14,
    color: colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: GLASS.border,
  },
  backButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  backButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
