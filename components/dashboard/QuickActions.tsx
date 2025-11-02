import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowRightLeft, Plus, ArrowDown } from 'lucide-react-native';
import { colors, Spacing, Typography } from '@/constants/theme';

interface Props {
  onTransfer: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
}

export function QuickActions({ onTransfer, onDeposit, onWithdraw }: Props) {
  return (
    <View style={styles.actions} accessibilityRole="toolbar" accessibilityLabel="Quick action buttons">
      <TouchableOpacity
        style={[styles.actionButton, styles.transferButton]}
        onPress={onTransfer}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Transfer funds between accounts"
        accessibilityHint="Opens transfer dialog"
      >
        <ArrowRightLeft size={18} color="#FFFFFF" />
        <Text style={styles.actionText}>Transfer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.depositButton]}
        onPress={onDeposit}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Deposit funds"
        accessibilityHint="Opens deposit dialog"
      >
        <Plus size={18} color="#FFFFFF" />
        <Text style={styles.actionText}>Deposit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.withdrawButton]}
        onPress={onWithdraw}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Withdraw funds"
        accessibilityHint="Opens withdrawal dialog"
      >
        <ArrowDown size={18} color="#FFFFFF" />
        <Text style={styles.actionText}>Withdraw</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  transferButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  depositButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  withdrawButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
});
