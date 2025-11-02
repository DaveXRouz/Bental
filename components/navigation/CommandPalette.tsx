import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Keyboard,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import {
  Command,
  X,
  Home,
  Briefcase,
  TrendingUp,
  Zap,
  MoreHorizontal,
  History,
  Bot,
  User,
  Settings,
  Bell,
  Search,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { colors, Spacing, Typography } from '@/constants/theme';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

export function CommandPalette({ visible, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [filteredCommands, setFilteredCommands] = useState<CommandItem[]>([]);

  const commands: CommandItem[] = [
    {
      id: 'go-home',
      title: 'Go to Home',
      subtitle: 'Navigate to dashboard',
      icon: Home,
      iconColor: '#3B82F6',
      shortcut: '⌘H',
      action: () => { router.push('/(tabs)'); handleClose(); },
    },
    {
      id: 'go-portfolio',
      title: 'Go to Portfolio',
      subtitle: 'View your holdings',
      icon: Briefcase,
      iconColor: '#10B981',
      shortcut: '⌘P',
      action: () => { router.push('/(tabs)/portfolio'); handleClose(); },
    },
    {
      id: 'go-markets',
      title: 'Go to Markets',
      subtitle: 'Explore stocks',
      icon: TrendingUp,
      iconColor: '#F59E0B',
      shortcut: '⌘M',
      action: () => { router.push('/(tabs)/markets'); handleClose(); },
    },
    {
      id: 'quick-trade',
      title: 'Quick Trade',
      subtitle: 'Place an order',
      icon: Zap,
      iconColor: '#10B981',
      shortcut: '⌘T',
      action: () => { router.push('/(tabs)/trade'); handleClose(); },
    },
    {
      id: 'open-search',
      title: 'Open Search',
      subtitle: 'Search stocks and features',
      icon: Search,
      iconColor: '#64748B',
      shortcut: '⌘F',
      action: () => { handleClose(); },
    },
    {
      id: 'view-activity',
      title: 'View Activity',
      subtitle: 'Transaction history',
      icon: History,
      iconColor: '#06B6D4',
      action: () => { router.push('/(tabs)/history'); handleClose(); },
    },
    {
      id: 'manage-bots',
      title: 'Manage AutoTrade',
      subtitle: 'AI trading bots',
      icon: Bot,
      iconColor: '#8B5CF6',
      action: () => { router.push('/(tabs)/ai-assistant'); handleClose(); },
    },
    {
      id: 'open-profile',
      title: 'Open Profile',
      subtitle: 'Account settings',
      icon: User,
      iconColor: '#64748B',
      action: () => { router.push('/(tabs)/profile'); handleClose(); },
    },
    {
      id: 'open-settings',
      title: 'Open Settings',
      subtitle: 'App preferences',
      icon: Settings,
      iconColor: '#64748B',
      action: () => { handleClose(); },
    },
    {
      id: 'notifications',
      title: 'View Notifications',
      subtitle: 'Recent alerts',
      icon: Bell,
      iconColor: '#F59E0B',
      action: () => { handleClose(); },
    },
  ];

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredCommands(commands);
    } else {
      const filtered = commands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(query.toLowerCase()) ||
          cmd.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCommands(filtered);
    }
  }, [query]);

  const handleClose = () => {
    setQuery('');
    onClose();
    Keyboard.dismiss();
  };

  const renderCommand = ({ item }: { item: CommandItem }) => (
    <TouchableOpacity
      style={styles.commandItem}
      onPress={() => {
        if (Platform.OS !== 'web') {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {}
        }
        item.action();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.commandIcon, { backgroundColor: `${item.iconColor}20` }]}>
        <item.icon size={20} color={item.iconColor} strokeWidth={2} />
      </View>
      <View style={styles.commandText}>
        <Text style={styles.commandTitle}>{item.title}</Text>
        <Text style={styles.commandSubtitle}>{item.subtitle}</Text>
      </View>
      {item.shortcut && (
        <View style={styles.shortcutBadge}>
          <Text style={styles.shortcutText}>{item.shortcut}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <BlurView intensity={80} tint="dark" style={styles.container}>
        <Animated.View
          entering={SlideInDown.springify()}
          exiting={FadeOut}
          style={styles.paletteContainer}
        >
          <View style={styles.header}>
            <Command size={20} color="#3B82F6" strokeWidth={2.5} />
            <Text style={styles.headerTitle}>Command Palette</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Type a command..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredCommands}
            renderItem={renderCommand}
            keyExtractor={(item) => item.id}
            style={styles.commandsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Command size={48} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No commands found</Text>
                <Text style={styles.emptySubtitle}>
                  Try a different search term
                </Text>
              </View>
            }
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Press <Text style={styles.footerKey}>⌘K</Text> to toggle
            </Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  paletteContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    color: colors.white,
    paddingVertical: Spacing.sm,
  },
  commandsList: {
    maxHeight: 400,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  commandIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commandText: {
    flex: 1,
  },
  commandTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  commandSubtitle: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  shortcutBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  shortcutText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
  },
  footerKey: {
    fontWeight: Typography.weight.bold,
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginTop: Spacing.sm,
  },
});
