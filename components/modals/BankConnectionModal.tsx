import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Building2, CheckCircle, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Bank {
  name: string;
  domain: string;
  country: string;
}

const DEMO_BANKS: Bank[] = [
  { name: 'Chase Bank', domain: 'chase.com', country: 'US' },
  { name: 'Bank of America', domain: 'bankofamerica.com', country: 'US' },
  { name: 'Wells Fargo', domain: 'wellsfargo.com', country: 'US' },
  { name: 'Citibank', domain: 'citibank.com', country: 'US' },
  { name: 'Capital One', domain: 'capitalone.com', country: 'US' },
  { name: 'US Bank', domain: 'usbank.com', country: 'US' },
  { name: 'TD Bank', domain: 'td.com', country: 'US' },
  { name: 'PNC Bank', domain: 'pnc.com', country: 'US' },
  { name: 'Royal Bank of Canada', domain: 'rbc.com', country: 'CA' },
  { name: 'TD Canada Trust', domain: 'td.com', country: 'CA' },
  { name: 'Scotiabank', domain: 'scotiabank.com', country: 'CA' },
  { name: 'BMO', domain: 'bmo.com', country: 'CA' },
];

type Step = 'search' | 'details' | 'success';

export default function BankConnectionModal({ visible, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [last4, setLast4] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredBanks = DEMO_BANKS.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setStep('details');

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleConnect = async () => {
    if (!selectedBank || last4.length !== 4) {
      Alert.alert('Invalid Input', 'Please enter the last 4 digits of your account');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('bank_accounts').insert({
        user_id: user?.id,
        institution: selectedBank.name,
        account_type: accountType,
        last4,
        connected_via: 'manual',
        status: 'active',
      });

      if (error) throw error;

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }

      setStep('success');
      onSuccess?.();
    } catch (error) {
      console.error('Error connecting bank:', error);
      Alert.alert('Error', 'Failed to connect bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('search');
    setSearchQuery('');
    setSelectedBank(null);
    setLast4('');
    setAccountType('checking');
    onClose();
  };

  const getBankLogo = (domain: string) => {
    return `https://logo.clearbit.com/${domain}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Bank Account</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 'search' && (
              <View>
                <View style={styles.searchContainer}>
                  <Search size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for your bank..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <Text style={styles.sectionTitle}>Popular Banks</Text>

                <View style={styles.bankList}>
                  {filteredBanks.map((bank) => (
                    <TouchableOpacity
                      key={bank.name}
                      style={styles.bankItem}
                      onPress={() => handleBankSelect(bank)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.bankLogo}>
                        <Image
                          source={{ uri: getBankLogo(bank.domain) }}
                          style={styles.logoImage}
                        />
                      </View>
                      <View style={styles.bankInfo}>
                        <Text style={styles.bankName}>{bank.name}</Text>
                        <Text style={styles.bankCountry}>{bank.country}</Text>
                      </View>
                      <Building2 size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {step === 'details' && selectedBank && (
              <View>
                <View style={styles.selectedBankCard}>
                  <View style={styles.bankLogo}>
                    <Image
                      source={{ uri: getBankLogo(selectedBank.domain) }}
                      style={styles.logoImage}
                    />
                  </View>
                  <Text style={styles.selectedBankName}>{selectedBank.name}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Account Type</Text>
                  <View style={styles.typeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        accountType === 'checking' && styles.typeButtonActive,
                      ]}
                      onPress={() => setAccountType('checking')}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          accountType === 'checking' && styles.typeButtonTextActive,
                        ]}
                      >
                        Checking
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        accountType === 'savings' && styles.typeButtonActive,
                      ]}
                      onPress={() => setAccountType('savings')}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          accountType === 'savings' && styles.typeButtonTextActive,
                        ]}
                      >
                        Savings
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Last 4 Digits of Account</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0000"
                    placeholderTextColor={colors.textMuted}
                    value={last4}
                    onChangeText={setLast4}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <Text style={styles.hint}>
                    This helps us verify your account when making deposits
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoText}>
                    In production, this would integrate with Plaid or Teller for instant bank
                    verification. For demo purposes, we're using manual entry.
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep('search')}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleConnect}
                    disabled={loading || last4.length !== 4}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? 'Connecting...' : 'Connect Account'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 'success' && (
              <View style={styles.successContainer}>
                <CheckCircle size={64} color="#10B981" />
                <Text style={styles.successTitle}>Bank Connected!</Text>
                <Text style={styles.successMessage}>
                  Your {selectedBank?.name} account has been successfully connected. You can now
                  make deposits and withdrawals.
                </Text>

                <TouchableOpacity style={styles.button} onPress={handleClose}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Done</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'rgba(20,20,20,0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    color: colors.white,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: Spacing.md,
  },
  bankList: {
    gap: Spacing.sm,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bankLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  bankCountry: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  selectedBankCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedBankName: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: Spacing.sm,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: '#10B981',
  },
  typeButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  typeButtonTextActive: {
    color: '#10B981',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.lg,
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    textAlign: 'center',
    letterSpacing: 4,
  },
  hint: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  infoText: {
    fontSize: Typography.size.sm,
    color: '#60A5FA',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  primaryButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  buttonGradient: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginTop: Spacing.lg,
  },
  successMessage: {
    fontSize: Typography.size.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
  },
});
