import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography } from '@/constants/theme';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface AccessibleSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiSelect?: boolean;
  emptyMessage?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  required?: boolean;
  helperText?: string;
}

export function AccessibleSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  searchable = false,
  multiSelect = false,
  emptyMessage = 'No options available',
  accessibilityLabel,
  accessibilityHint,
  required = false,
  helperText,
}: AccessibleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(
    value ? [value] : []
  );
  const inputRef = useRef<TextInput>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleOpen = useCallback(() => {
    if (disabled) return;

    setIsOpen(true);
    setSearchQuery('');

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    AccessibilityInfo.announceForAccessibility(
      `${label || 'Select'} opened. ${options.length} options available.`
    );

    setTimeout(() => {
      if (searchable) {
        inputRef.current?.focus();
      }
    }, 100);
  }, [disabled, label, options.length, searchable]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');

    AccessibilityInfo.announceForAccessibility(
      `${label || 'Select'} closed${selectedOption ? `. Selected: ${selectedOption.label}` : ''}`
    );
  }, [label, selectedOption]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
      }

      if (multiSelect) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];

        setSelectedValues(newValues);
        onChange(newValues.join(','));

        AccessibilityInfo.announceForAccessibility(
          `${options.find((o) => o.value === optionValue)?.label} ${
            newValues.includes(optionValue) ? 'selected' : 'deselected'
          }`
        );
      } else {
        onChange(optionValue);
        handleClose();

        const option = options.find((o) => o.value === optionValue);
        AccessibilityInfo.announceForAccessibility(
          option ? `Selected ${option.label}` : 'Option selected'
        );
      }
    },
    [multiSelect, selectedValues, onChange, handleClose, options]
  );

  const renderOption = ({ item }: { item: SelectOption }) => {
    const isSelected = multiSelect
      ? selectedValues.includes(item.value)
      : value === item.value;

    return (
      <TouchableOpacity
        style={[
          styles.option,
          isSelected && styles.optionSelected,
          item.disabled && styles.optionDisabled,
        ]}
        onPress={() => !item.disabled && handleSelect(item.value)}
        disabled={item.disabled}
        accessible={true}
        accessibilityLabel={item.label}
        accessibilityHint={item.description}
        accessibilityRole="button"
        accessibilityState={{
          selected: isSelected,
          disabled: item.disabled,
        }}
      >
        <View style={styles.optionContent}>
          {item.icon && <View style={styles.optionIcon}>{item.icon}</View>}
          <View style={styles.optionText}>
            <Text
              style={[
                styles.optionLabel,
                item.disabled && styles.optionLabelDisabled,
              ]}
            >
              {item.label}
            </Text>
            {item.description && (
              <Text style={styles.optionDescription}>{item.description}</Text>
            )}
          </View>
        </View>
        {isSelected && (
          <Check size={20} color="#10B981" strokeWidth={2.5} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={styles.label}
          accessible={true}
          accessibilityRole="text"
        >
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.trigger,
          isOpen && styles.triggerActive,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessible={true}
        accessibilityLabel={
          accessibilityLabel ||
          `${label || 'Select'}.${selectedOption ? ` Selected: ${selectedOption.label}` : ` ${placeholder}`}`
        }
        accessibilityHint={
          accessibilityHint || 'Double tap to open selection menu'
        }
        accessibilityRole="button"
        accessibilityState={{
          disabled,
          expanded: isOpen,
        }}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.triggerPlaceholder,
            disabled && styles.triggerTextDisabled,
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown
          size={20}
          color={disabled ? colors.textMuted : colors.white}
          style={[isOpen && styles.chevronRotated]}
        />
      </TouchableOpacity>

      {helperText && !error && (
        <Text style={styles.helperText} accessible={true}>
          {helperText}
        </Text>
      )}

      {error && (
        <Text
          style={styles.errorText}
          accessible={true}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
          accessible={false}
        >
          <BlurView intensity={80} tint="dark" style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} accessible={false}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {label || 'Select Option'}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={handleClose}
                    accessible={true}
                    accessibilityLabel="Close selection menu"
                    accessibilityRole="button"
                  >
                    <X size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>

                {searchable && (
                  <View style={styles.searchContainer}>
                    <Search size={20} color={colors.textMuted} />
                    <TextInput
                      ref={inputRef}
                      style={styles.searchInput}
                      placeholder="Search options..."
                      placeholderTextColor={colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      accessible={true}
                      accessibilityLabel="Search options"
                      accessibilityRole="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        accessible={true}
                        accessibilityLabel="Clear search"
                      >
                        <X size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <FlatList
                  data={filteredOptions}
                  renderItem={renderOption}
                  keyExtractor={(item) => item.value}
                  style={styles.optionsList}
                  contentContainerStyle={styles.optionsListContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>{emptyMessage}</Text>
                    </View>
                  }
                  accessible={false}
                  keyboardShouldPersistTaps="handled"
                />

                {multiSelect && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={handleClose}
                      accessible={true}
                      accessibilityLabel={`Done. ${selectedValues.length} items selected`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.doneButtonText}>
                        Done ({selectedValues.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: Spacing.sm,
  },
  required: {
    color: '#EF4444',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    minHeight: 44,
  },
  triggerActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  triggerError: {
    borderColor: '#EF4444',
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    flex: 1,
    fontSize: Typography.size.md,
    color: colors.white,
  },
  triggerPlaceholder: {
    color: colors.textMuted,
  },
  triggerTextDisabled: {
    color: colors.textMuted,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  helperText: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.size.xs,
    color: '#EF4444',
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalContent: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  modalClose: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    color: colors.white,
    paddingVertical: Spacing.xs,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionsListContent: {
    paddingVertical: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  optionSelected: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  optionLabelDisabled: {
    color: colors.textMuted,
  },
  optionDescription: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.size.md,
    color: colors.textMuted,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  doneButton: {
    backgroundColor: '#10B981',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
});
