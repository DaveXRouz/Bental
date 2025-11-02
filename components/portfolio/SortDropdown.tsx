import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { SortOption, getSortLabel } from '@/utils/sorting';

interface SortDropdownProps {
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: SortOption[] = ['value', 'gainLoss', 'symbol'];

export default function SortDropdown({ selectedSort, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: SortOption) => {
    onSortChange(option);
    setIsOpen(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <BlurView intensity={60} tint="dark" style={styles.triggerInner}>
          <Text style={styles.triggerText}>{getSortLabel(selectedSort)}</Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </BlurView>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.dropdownContainer}>
            <BlurView intensity={80} tint="dark" style={styles.dropdown}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Sort By</Text>
              </View>

              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.option}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedSort === option && styles.optionTextActive,
                    ]}
                  >
                    {getSortLabel(option)}
                  </Text>
                  {selectedSort === option && (
                    <Check size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </BlurView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  triggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownContainer: {
    width: '100%',
    maxWidth: 300,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  dropdownHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  optionText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
