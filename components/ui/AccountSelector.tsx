import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronDown, Wallet, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency } from '@/utils/formatting';

const { width, height } = Dimensions.get('window');

interface Account {
  id: string;
  name: string;
  balance: number;
  account_type: string;
  currency: string;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelect: (accountId: string) => void;
  showBalance?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function AccountSelector({
  accounts,
  selectedAccountId,
  onSelect,
  showBalance = true,
  disabled = false,
  placeholder = 'Select Account',
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const handleOpen = () => {
    if (disabled || accounts.length === 0) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsOpen(true);
  };

  const handleSelect = (accountId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelect(accountId);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Selector Button */}
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={selectedAccount ? `Selected account: ${selectedAccount.name}` : placeholder}
        accessibilityHint="Tap to change account"
        accessibilityState={{ disabled }}
      >
        <BlurView intensity={60} tint="dark" style={styles.selectorBlur}>
          <View style={styles.selectorContent}>
            <Wallet size={18} color={selectedAccount ? '#3B82F6' : colors.textMuted} />
            <View style={styles.selectorInfo}>
              {selectedAccount ? (
                <>
                  <Text style={styles.selectorName}>{selectedAccount.name}</Text>
                  {showBalance && (
                    <Text style={styles.selectorBalance}>
                      {formatCurrency(selectedAccount.balance)}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.selectorPlaceholder}>{placeholder}</Text>
              )}
            </View>
            <ChevronDown
              size={20}
              color={colors.textSecondary}
              style={[styles.chevron, isOpen && styles.chevronOpen]}
            />
          </View>
        </BlurView>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
        accessible={true}
        accessibilityViewIsModal={true}
        accessibilityLabel="Account selection menu"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        <View style={styles.modalContainer}>
          <View style={styles.dropdown}>
            <BlurView intensity={80} tint="dark" style={styles.dropdownBlur}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Account</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close account selection"
                >
                  <Text style={styles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.dropdownScroll}
                contentContainerStyle={styles.dropdownContent}
                showsVerticalScrollIndicator={false}
              >
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountOption,
                      selectedAccountId === account.id && styles.accountOptionActive,
                    ]}
                    onPress={() => handleSelect(account.id)}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`${account.name}, balance ${formatCurrency(account.balance)}`}
                    accessibilityState={{ selected: selectedAccountId === account.id }}
                  >
                    <Wallet
                      size={20}
                      color={selectedAccountId === account.id ? '#3B82F6' : colors.textSecondary}
                    />
                    <View style={styles.accountInfo}>
                      <Text
                        style={[
                          styles.accountName,
                          selectedAccountId === account.id && styles.accountNameActive,
                        ]}
                      >
                        {account.name}
                      </Text>
                      <View style={styles.accountDetails}>
                        <Text style={styles.accountType}>
                          {account.account_type.replace('_', ' ').toUpperCase()}
                        </Text>
                        {showBalance && (
                          <>
                            <Text style={styles.accountDetailsDot}>•</Text>
                            <Text style={styles.accountBalance}>
                              {formatCurrency(account.balance)}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    {selectedAccountId === account.id && (
                      <Check size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}

                {accounts.length === 0 && (
                  <View style={styles.emptyState}>
                    <Wallet size={40} color={colors.textMuted} />
                    <Text style={styles.emptyStateText}>No accounts available</Text>
                  </View>
                )}
              </ScrollView>
            </BlurView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    ...shadows.glass,
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorBlur: {
    width: '100%',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  selectorInfo: {
    flex: 1,
  },
  selectorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  selectorBalance: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: colors.textMuted,
  },
  chevron: {
    transition: 'transform 0.2s',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dropdown: {
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.6,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    ...shadows.glass,
  },
  dropdownBlur: {
    flex: 1,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  dropdownScroll: {
    flex: 1,
  },
  dropdownContent: {
    padding: 12,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accountOptionActive: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderColor: '#3B82F6',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  accountNameActive: {
    color: colors.text,
  },
  accountDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountType: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  accountDetailsDot: {
    fontSize: 12,
    color: colors.textMuted,
  },
  accountBalance: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 12,
  },
});
