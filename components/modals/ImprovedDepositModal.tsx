import { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Building2, CreditCard, Bitcoin, Truck, Mail } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';
import { SmartInput } from '@/components/ui/SmartInput';
import { ProgressiveForm } from '@/components/ui/ProgressiveForm';
import { useSmartForm, getSmartDefaults } from '@/hooks/useSmartForm';
import { createDepositSchema, createCardSchema } from '@/utils/friendly-validation';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const { height } = Dimensions.get('window');

interface ImprovedDepositModalProps {
  visible: boolean;
  onClose: () => void;
}

type DepositMethod = 'bank' | 'card' | 'crypto' | 'cash-courier';

const DEPOSIT_METHODS = [
  {
    id: 'bank' as DepositMethod,
    label: 'Bank Transfer',
    subtitle: '2-3 business days • No fees',
    icon: Building2,
    color: '#06B6D4',
  },
  {
    id: 'card' as DepositMethod,
    label: 'Debit Card',
    subtitle: 'Instant • 2.9% fee',
    icon: CreditCard,
    color: '#3B82F6',
  },
  {
    id: 'crypto' as DepositMethod,
    label: 'Cryptocurrency',
    subtitle: 'Network fees apply',
    icon: Bitcoin,
    color: '#F59E0B',
  },
  {
    id: 'cash-courier' as DepositMethod,
    label: 'Cash Courier',
    subtitle: 'For amounts over $10,000',
    icon: Truck,
    color: '#10B981',
  },
];

export default function ImprovedDepositModal({
  visible,
  onClose,
}: ImprovedDepositModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>('bank');
  const toast = useToast();
  const { user } = useAuth();

  const form = useSmartForm({
    schema: createDepositSchema({ minAmount: 10, maxAmount: 100000 }),
    initialValues: { amount: '', method: 'bank' },
    persistKey: `deposit_${user?.id}`,
    persistDuration: 1800000,
    smartDefaults: {
      method: async () => {
        const { data } = await supabase
          .from('profiles')
          .select('preferred_deposit_method')
          .eq('id', user?.id)
          .maybeSingle();
        return (data?.preferred_deposit_method as DepositMethod) || 'bank';
      },
    },
    validateOnChange: true,
  });

  const cardForm = useSmartForm({
    schema: createCardSchema(),
    initialValues: { cardNumber: '', expiry: '', cvv: '' },
    persistKey: `card_${user?.id}`,
    validateOnChange: false,
    validateOnBlur: true,
  });

  const handleMethodSelect = (method: DepositMethod) => {
    setSelectedMethod(method);
    form.setFieldValue('method', method);
  };

  const handleSubmit = async () => {
    const isValid = form.validateForm();
    if (!isValid) {
      toast.error('Please fix the errors before continuing');
      return false;
    }

    try {
      const { error } = await supabase.from('deposits').insert({
        user_id: user?.id,
        amount: parseFloat(form.values.amount),
        method: selectedMethod,
        status: 'pending',
      });

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ preferred_deposit_method: selectedMethod })
        .eq('id', user?.id);

      toast.success('Deposit initiated successfully!');
      form.reset();
      form.clearPersistedData();
      onClose();
      return true;
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Failed to process deposit. Please try again.');
      return false;
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.methodsGrid}>
      {DEPOSIT_METHODS.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;

        return (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              isSelected && { borderColor: method.color, borderWidth: 2 },
            ]}
            onPress={() => handleMethodSelect(method.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.methodIcon, { backgroundColor: `${method.color}20` }]}>
              <Icon size={24} color={method.color} />
            </View>
            <Text style={styles.methodLabel}>{method.label}</Text>
            <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderAmountInput = () => (
    <View>
      <SmartInput
        label="How much would you like to deposit?"
        type="amount"
        value={form.values.amount}
        onChangeText={(value) => form.setFieldValue('amount', value)}
        error={form.touched.amount ? form.errors.amount : undefined}
        required
        hint="Min: $10 • Max: $100,000"
        autoValidate
        showValidIcon
      />

      <View style={styles.quickAmounts}>
        {['100', '500', '1000', '5000'].map((amount) => (
          <TouchableOpacity
            key={amount}
            style={styles.quickAmountButton}
            onPress={() => form.setFieldValue('amount', amount)}
          >
            <Text style={styles.quickAmountText}>${amount}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPaymentDetails = () => {
    switch (selectedMethod) {
      case 'card':
        return (
          <View>
            <SmartInput
              label="Card Number"
              type="card-number"
              value={cardForm.values.cardNumber}
              onChangeText={(value) => cardForm.setFieldValue('cardNumber', value)}
              error={cardForm.touched.cardNumber ? cardForm.errors.cardNumber : undefined}
              icon={CreditCard}
              required
              autoValidate
            />
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <SmartInput
                  label="Expiry"
                  type="card-expiry"
                  value={cardForm.values.expiry}
                  onChangeText={(value) => cardForm.setFieldValue('expiry', value)}
                  error={cardForm.touched.expiry ? cardForm.errors.expiry : undefined}
                  required
                />
              </View>
              <View style={{ flex: 1 }}>
                <SmartInput
                  label="CVV"
                  type="cvv"
                  value={cardForm.values.cvv}
                  onChangeText={(value) => cardForm.setFieldValue('cvv', value)}
                  error={cardForm.touched.cvv ? cardForm.errors.cvv : undefined}
                  required
                />
              </View>
            </View>
          </View>
        );

      case 'bank':
        return (
          <View style={styles.infoCard}>
            <Building2 size={32} color="#06B6D4" />
            <Text style={styles.infoTitle}>Bank Transfer Instructions</Text>
            <Text style={styles.infoText}>
              After submitting, you'll receive detailed bank transfer instructions via email.
              Transfers typically arrive within 2-3 business days.
            </Text>
          </View>
        );

      case 'crypto':
        return (
          <View style={styles.infoCard}>
            <Bitcoin size={32} color="#F59E0B" />
            <Text style={styles.infoTitle}>Cryptocurrency Deposit</Text>
            <Text style={styles.infoText}>
              After submitting, you'll receive a unique wallet address for your deposit.
              Funds are credited after network confirmations.
            </Text>
          </View>
        );

      case 'cash-courier':
        return (
          <View style={styles.infoCard}>
            <Truck size={32} color="#10B981" />
            <Text style={styles.infoTitle}>Cash Courier Service</Text>
            <Text style={styles.infoText}>
              For deposits over $10,000, we'll arrange secure cash pickup from your location.
              A representative will contact you within 24 hours.
            </Text>
          </View>
        );
    }
  };

  const steps = [
    {
      id: 'method',
      title: 'Choose deposit method',
      subtitle: 'Select how you would like to add funds',
      content: renderMethodSelection(),
      validate: () => {
        if (!selectedMethod) {
          toast.error('Please select a deposit method');
          return false;
        }
        return true;
      },
    },
    {
      id: 'amount',
      title: 'Enter amount',
      subtitle: 'How much would you like to deposit?',
      content: renderAmountInput(),
      validate: () => {
        return form.validateForm();
      },
    },
    {
      id: 'details',
      title:
        selectedMethod === 'card'
          ? 'Payment details'
          : 'Review & confirm',
      subtitle:
        selectedMethod === 'card'
          ? 'Enter your card information'
          : 'Review your deposit details',
      content: renderPaymentDetails(),
      validate: async () => {
        if (selectedMethod === 'card') {
          return cardForm.validateForm();
        }
        return handleSubmit();
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ProgressiveForm
          steps={steps}
          onComplete={handleSubmit}
          onCancel={onClose}
          showProgress
          allowBackNavigation
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  methodCard: {
    width: '48%',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  methodSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoCard: {
    padding: spacing.xl,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
