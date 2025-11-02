import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, MapPin, Calendar, CheckCircle, Truck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatting';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { CashCourierDeposit } from '@/types/models';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'form' | 'confirm' | 'success';

export default function CashCourierDepositModal({ visible, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  const [amount, setAmount] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('USA');
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    setStep('form');
    setAmount('');
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    setCountry('USA');
    setNotes('');
    setTrackingId('');
    onClose();
  };

  const validateZip = async (zipCode: string): Promise<boolean> => {
    if (!zipCode || zipCode.length < 5) return false;

    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.places?.[0]) {
          setCity(data.places[0]['place name']);
          setState(data.places[0]['state abbreviation']);
          return true;
        }
      }
    } catch (error) {
      console.log('ZIP validation optional, continuing...');
    }
    return true;
  };

  const handleNext = async () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 10000) {
      Alert.alert('Invalid Amount', 'Minimum deposit is $10,000');
      return;
    }

    if (!street || !city || !state || !zip) {
      Alert.alert('Incomplete Address', 'Please fill in all address fields');
      return;
    }

    await validateZip(zip);

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    setStep('confirm');
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const depositData = {
        user_id: user?.id,
        amount: parseFloat(amount),
        currency: 'USD',
        status: 'submitted',
        address_json: {
          street,
          city,
          state,
          zip,
          country,
        },
        notes: notes || null,
      };

      const { data, error } = await supabase
        .from('cash_courier_deposits')
        .insert(depositData)
        .select()
        .single();

      if (error) throw error;

      setTrackingId(data.id);
      setStep('success');

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting deposit:', error);
      Alert.alert('Error', 'Failed to submit deposit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Cash Courier Deposit</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 'form' && (
              <View>
                <View style={styles.section}>
                  <Text style={styles.label}>Deposit Amount</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10,000 minimum"
                      placeholderTextColor={colors.textMuted}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.hint}>Minimum deposit: $10,000</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Delivery Address</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Street Address"
                    placeholderTextColor={colors.textMuted}
                    value={street}
                    onChangeText={setStreet}
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.textInput, styles.flex1]}
                      placeholder="City"
                      placeholderTextColor={colors.textMuted}
                      value={city}
                      onChangeText={setCity}
                    />
                    <TextInput
                      style={[styles.textInput, styles.stateInput]}
                      placeholder="State"
                      placeholderTextColor={colors.textMuted}
                      value={state}
                      onChangeText={setState}
                      maxLength={2}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.textInput, styles.flex1]}
                      placeholder="ZIP Code"
                      placeholderTextColor={colors.textMuted}
                      value={zip}
                      onChangeText={setZip}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    <TextInput
                      style={[styles.textInput, styles.flex1]}
                      placeholder="Country"
                      placeholderTextColor={colors.textMuted}
                      value={country}
                      onChangeText={setCountry}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Special instructions..."
                    placeholderTextColor={colors.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleNext}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {step === 'confirm' && (
              <View>
                <View style={styles.confirmCard}>
                  <Truck size={48} color="#10B981" />
                  <Text style={styles.confirmTitle}>Review Your Deposit</Text>

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Amount</Text>
                    <Text style={styles.confirmValue}>{formatCurrency(parseFloat(amount))}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Delivery Address</Text>
                    <Text style={styles.confirmValue}>
                      {street}{'\n'}
                      {city}, {state} {zip}{'\n'}
                      {country}
                    </Text>
                  </View>

                  {notes && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Notes</Text>
                        <Text style={styles.confirmValue}>{notes}</Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep('form')}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? 'Submitting...' : 'Confirm Deposit'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 'success' && (
              <View style={styles.successContainer}>
                <CheckCircle size={64} color="#10B981" />
                <Text style={styles.successTitle}>Deposit Submitted!</Text>
                <Text style={styles.successMessage}>
                  Your cash courier deposit has been scheduled. You'll receive updates as your deposit progresses.
                </Text>

                <View style={styles.trackingCard}>
                  <Text style={styles.trackingLabel}>Tracking ID</Text>
                  <Text style={styles.trackingId}>{trackingId.substring(0, 8).toUpperCase()}</Text>
                </View>

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
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  currencySymbol: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.xl,
    color: colors.white,
    paddingVertical: Spacing.md,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.md,
    color: colors.white,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  stateInput: {
    width: 80,
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
  confirmCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  confirmTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  confirmRow: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  confirmLabel: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginBottom: Spacing.xs,
  },
  confirmValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    marginVertical: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
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
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  trackingCard: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    width: '100%',
  },
  trackingLabel: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginBottom: Spacing.xs,
  },
  trackingId: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: '#10B981',
    letterSpacing: 2,
  },
});
