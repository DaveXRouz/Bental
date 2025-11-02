import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ArrowRightLeft, Wallet, Check } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency } from '@/utils/formatting';

const { height } = Dimensions.get('window');

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TransferModal({ visible, onClose }: TransferModalProps) {
  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('main');
  const [toAccount, setToAccount] = useState('investment');

  const handleTransfer = () => {
    onClose();
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
                <ArrowRightLeft size={24} color="#3B82F6" />
                <Text style={styles.headerTitle}>Transfer Funds</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                  <X size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <Text style={styles.label}>From Account</Text>
                <View style={styles.accountSelector}>
                  <TouchableOpacity
                    style={[styles.accountOption, fromAccount === 'main' && styles.accountOptionActive]}
                    onPress={() => setFromAccount('main')}
                  >
                    <Wallet size={18} color={fromAccount === 'main' ? '#3B82F6' : colors.textSecondary} />
                    <Text style={[styles.accountText, fromAccount === 'main' && styles.accountTextActive]}>
                      Main Account
                    </Text>
                    {fromAccount === 'main' && <Check size={16} color="#3B82F6" />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.accountOption, fromAccount === 'investment' && styles.accountOptionActive]}
                    onPress={() => setFromAccount('investment')}
                  >
                    <Wallet size={18} color={fromAccount === 'investment' ? '#3B82F6' : colors.textSecondary} />
                    <Text style={[styles.accountText, fromAccount === 'investment' && styles.accountTextActive]}>
                      Investment Account
                    </Text>
                    {fromAccount === 'investment' && <Check size={16} color="#3B82F6" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.label}>To Account</Text>
                <View style={styles.accountSelector}>
                  <TouchableOpacity
                    style={[styles.accountOption, toAccount === 'main' && styles.accountOptionActive]}
                    onPress={() => setToAccount('main')}
                  >
                    <Wallet size={18} color={toAccount === 'main' ? '#3B82F6' : colors.textSecondary} />
                    <Text style={[styles.accountText, toAccount === 'main' && styles.accountTextActive]}>
                      Main Account
                    </Text>
                    {toAccount === 'main' && <Check size={16} color="#3B82F6" />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.accountOption, toAccount === 'investment' && styles.accountOptionActive]}
                    onPress={() => setToAccount('investment')}
                  >
                    <Wallet size={18} color={toAccount === 'investment' ? '#3B82F6' : colors.textSecondary} />
                    <Text style={[styles.accountText, toAccount === 'investment' && styles.accountTextActive]}>
                      Investment Account
                    </Text>
                    {toAccount === 'investment' && <Check size={16} color="#3B82F6" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Amount</Text>
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
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleTransfer} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#3B82F6', '#8B5CF6']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <ArrowRightLeft size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Transfer Funds</Text>
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
    height: height * 0.7,
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
  accountSelector: {
    gap: 12,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  accountOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  accountText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  accountTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: GLASS.border,
    marginVertical: 8,
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
  submitButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 8,
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
