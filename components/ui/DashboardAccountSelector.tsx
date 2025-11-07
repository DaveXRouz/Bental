import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronDown, Wallet, Check, Filter } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency } from '@/utils/formatting';
import { useAccountContext } from '@/contexts/AccountContext';
import { useAccounts } from '@/hooks/useAccounts';

const { width, height } = Dimensions.get('window');

export function DashboardAccountSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { accounts } = useAccounts();
  const {
    selectedAccountIds,
    isAllAccountsSelected,
    toggleAccount,
    selectAllAccounts,
  } = useAccountContext();

  const activeAccounts = accounts.filter(acc => acc.is_active && acc.status === 'active');

  const handleOpen = () => {
    if (activeAccounts.length === 0) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsOpen(true);
  };

  const handleToggleAccount = (accountId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleAccount(accountId);
  };

  const handleSelectAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    selectAllAccounts();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (isAllAccountsSelected) {
      return 'All Accounts';
    }
    if (selectedAccountIds.length === 1) {
      const account = activeAccounts.find(a => a.id === selectedAccountIds[0]);
      return account?.name || 'All Accounts';
    }
    return `${selectedAccountIds.length} Accounts`;
  };

  const getTotalBalance = () => {
    if (isAllAccountsSelected) {
      return activeAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    }
    return activeAccounts
      .filter(acc => selectedAccountIds.includes(acc.id))
      .reduce((sum, acc) => sum + Number(acc.balance), 0);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={handleOpen}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Account filter: ${getDisplayText()}`}
        accessibilityHint="Tap to change account filter"
      >
        <BlurView intensity={50} tint="dark" style={styles.selectorBlur}>
          <View style={styles.selectorContent}>
            <Filter size={16} color={isAllAccountsSelected ? colors.textSecondary : '#3B82F6'} />
            <View style={styles.selectorInfo}>
              <Text style={styles.selectorName}>{getDisplayText()}</Text>
              <Text style={styles.selectorBalance}>
                {formatCurrency(getTotalBalance())}
              </Text>
            </View>
            <ChevronDown
              size={16}
              color={colors.textSecondary}
              style={[styles.chevron, isOpen && styles.chevronOpen]}
            />
          </View>
        </BlurView>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
        accessible={true}
        accessibilityViewIsModal={true}
        accessibilityLabel="Account filter selection"
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
                <Text style={styles.dropdownTitle}>Filter Accounts</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close account filter"
                >
                  <Text style={styles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.dropdownScroll}
                contentContainerStyle={styles.dropdownContent}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={[
                    styles.accountOption,
                    styles.allAccountsOption,
                    isAllAccountsSelected && styles.accountOptionActive,
                  ]}
                  onPress={handleSelectAll}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Show all accounts"
                  accessibilityState={{ selected: isAllAccountsSelected }}
                >
                  <Wallet
                    size={20}
                    color={isAllAccountsSelected ? '#3B82F6' : colors.textSecondary}
                  />
                  <View style={styles.accountInfo}>
                    <Text
                      style={[
                        styles.accountName,
                        isAllAccountsSelected && styles.accountNameActive,
                      ]}
                    >
                      All Accounts
                    </Text>
                    <Text style={styles.accountDetails}>
                      View combined balances from all accounts
                    </Text>
                  </View>
                  {isAllAccountsSelected && (
                    <Check size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Individual Accounts</Text>
                  <View style={styles.dividerLine} />
                </View>

                {activeAccounts.map((account) => {
                  const isSelected = selectedAccountIds.includes(account.id);

                  return (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        isSelected && !isAllAccountsSelected && styles.accountOptionActive,
                      ]}
                      onPress={() => handleToggleAccount(account.id)}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`${account.name}, balance ${formatCurrency(account.balance)}`}
                      accessibilityState={{ selected: isSelected && !isAllAccountsSelected }}
                    >
                      <Wallet
                        size={20}
                        color={isSelected && !isAllAccountsSelected ? '#3B82F6' : colors.textSecondary}
                      />
                      <View style={styles.accountInfo}>
                        <Text
                          style={[
                            styles.accountName,
                            isSelected && !isAllAccountsSelected && styles.accountNameActive,
                          ]}
                        >
                          {account.name}
                        </Text>
                        <View style={styles.accountDetailsRow}>
                          <Text style={styles.accountType}>
                            {account.account_type.replace('_', ' ').toUpperCase()}
                          </Text>
                          <Text style={styles.accountDetailsDot}>•</Text>
                          <Text style={styles.accountBalance}>
                            {formatCurrency(account.balance)}
                          </Text>
                        </View>
                      </View>
                      {isSelected && !isAllAccountsSelected && (
                        <Check size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {activeAccounts.length === 0 && (
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
    minWidth: 160,
  },
  selectorBlur: {
    width: '100%',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  selectorInfo: {
    flex: 1,
  },
  selectorName: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  selectorBalance: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
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
    padding: spacing.lg,
  },
  dropdown: {
    width: '100%',
    maxWidth: 420,
    maxHeight: height * 0.7,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  dropdownTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: '#3B82F6',
  },
  dropdownScroll: {
    flex: 1,
  },
  dropdownContent: {
    padding: 12,
  },
  allAccountsOption: {
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
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
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  accountNameActive: {
    color: colors.text,
  },
  accountDetails: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: typography.weight.regular,
  },
  accountDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountType: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
  accountDetailsDot: {
    fontSize: 11,
    color: colors.textMuted,
  },
  accountBalance: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GLASS.border,
  },
  dividerText: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxxl,
  },
  emptyStateText: {
    fontSize: typography.size.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
