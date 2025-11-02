import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, GripVertical, Plus, Minus, Lock, RotateCcw, Save } from 'lucide-react-native';
import { FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useDockStore } from '@/stores/useDockStore';
import {
  DockItemId,
  NavItem,
  getAvailableItems,
  getNavItem,
  MAX_DOCK_ITEMS,
} from '@/constants/nav-items';
import { colors, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function DockCustomizationModal({ visible, onClose, onSave }: Props) {
  const { user } = useAuth();
  const { config, loadConfig, saveConfig, resetToDefaults, reorderItems } = useDockStore();

  const [activeItems, setActiveItems] = useState<DockItemId[]>([]);
  const [availableItems, setAvailableItems] = useState<NavItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && user?.id) {
      loadConfig(user.id);
    }
  }, [visible, user?.id]);

  useEffect(() => {
    if (visible) {
      setActiveItems([...config.items]);
      setAvailableItems(getAvailableItems(config.items));
    }
  }, [visible, config.items]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...activeItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setActiveItems(newItems);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleMoveDown = (index: number) => {
    if (index === activeItems.length - 1) return;
    const newItems = [...activeItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setActiveItems(newItems);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleAddItem = (itemId: DockItemId) => {
    if (activeItems.length >= MAX_DOCK_ITEMS) {
      Alert.alert('Limit Reached', `You can pin up to ${MAX_DOCK_ITEMS} items`);
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    const newActiveItems = [...activeItems, itemId];
    setActiveItems(newActiveItems);
    setAvailableItems(getAvailableItems(newActiveItems));
  };

  const handleRemoveItem = (itemId: DockItemId) => {
    if (itemId === 'home') {
      Alert.alert('Cannot Remove', 'Home tab must remain pinned');
      return;
    }

    if (activeItems.length <= 1) {
      Alert.alert('Cannot Remove', 'You must have at least one tab');
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    const newActiveItems = activeItems.filter(id => id !== itemId);
    setActiveItems(newActiveItems);
    setAvailableItems(getAvailableItems(newActiveItems));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);

    const success = await saveConfig(user.id, activeItems);

    if (success) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }

      onSave?.();
      onClose();
    } else {
      Alert.alert('Error', 'Failed to save dock configuration');
    }

    setSaving(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset your dock to default configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            const success = await resetToDefaults(user.id);

            if (success) {
              if (Platform.OS !== 'web') {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) {}
              }

              onSave?.();
              onClose();
            } else {
              Alert.alert('Error', 'Failed to reset dock configuration');
            }
          },
        },
      ]
    );
  };

  const renderActiveItem = (item: DockItemId, index: number) => {
    const navItem = getNavItem(item);
    if (!navItem) return null;

    const IconComponent = navItem.icon;
    const isPinned = item === 'home';

    return (
      <View
        style={styles.activeItem}
      >
        <View style={styles.activeItemContent}>
          <View style={styles.dragHandle}>
            {!isPinned && index > 0 && (
              <TouchableOpacity onPress={() => handleMoveUp(index)} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                <Text style={styles.moveText}>↑</Text>
              </TouchableOpacity>
            )}
            {!isPinned && index < activeItems.length - 1 && (
              <TouchableOpacity onPress={() => handleMoveDown(index)} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                <Text style={styles.moveText}>↓</Text>
              </TouchableOpacity>
            )}
            {isPinned && <Lock size={16} color={colors.textMuted} />}
          </View>

          <View style={[styles.iconContainer, { backgroundColor: `${navItem.iconColor}20` }]}>
            <IconComponent size={20} color={navItem.iconColor} strokeWidth={2} />
          </View>

          <View style={styles.itemTextContainer}>
            <Text style={styles.itemLabel}>{navItem.label}</Text>
            {isPinned && <Text style={styles.pinnedText}>Pinned</Text>}
          </View>

          {!isPinned && (
            <TouchableOpacity
              onPress={() => handleRemoveItem(item)}
              style={styles.removeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Minus size={20} color="#EF4444" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderAvailableItem = (item: NavItem) => {
    const IconComponent = item.icon;
    const isDisabled = item.requires && item.requires.length > 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.availableItem, isDisabled && styles.availableItemDisabled]}
        onPress={() => !isDisabled && handleAddItem(item.id)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={styles.availableItemContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
            <IconComponent size={20} color={item.iconColor} strokeWidth={2} />
            {isDisabled && (
              <View style={styles.lockBadge}>
                <Lock size={12} color="#EF4444" />
              </View>
            )}
          </View>

          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemLabel, isDisabled && styles.disabledText]}>
              {item.label}
            </Text>
            {item.description && (
              <Text style={styles.itemDescription}>{item.description}</Text>
            )}
          </View>

          {!isDisabled && (
            <View style={styles.addButton}>
              <Plus size={20} color="#10B981" strokeWidth={2.5} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Customize My Dock</Text>
              <Text style={styles.subtitle}>
                Drag to reorder • Pin up to {MAX_DOCK_ITEMS} items
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Tabs ({activeItems.length}/{MAX_DOCK_ITEMS})</Text>
              <FlatList
                data={activeItems}
                keyExtractor={(item) => item}
                renderItem={({ item, index }) => renderActiveItem(item, index)}
                style={styles.activeList}
                scrollEnabled={false}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Tabs</Text>
              <ScrollView
                style={styles.availableList}
                showsVerticalScrollIndicator={false}
              >
                {availableItems.map(renderAvailableItem)}
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <RotateCcw size={18} color={colors.textMuted} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.saveGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Save size={18} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Dock'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  activeList: {
    flexGrow: 0,
  },
  activeItem: {
    marginBottom: Spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activeItemDragging: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  activeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dragHandle: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  pinnedText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: Spacing.lg,
  },
  availableList: {
    maxHeight: 300,
  },
  availableItem: {
    marginBottom: Spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  availableItemDisabled: {
    opacity: 0.5,
  },
  availableItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(20,20,20,0.98)',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  moveText: {
    fontSize: 16,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
});
