import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  User,
  Activity,
  Bot,
  Settings,
  HelpCircle,
  FileText,
  Bell,
  Lock,
  Palette,
  Globe,
  LogOut,
  ChevronRight,
  Shield,
  CreditCard,
  Download,
  Upload,
  Building2,
  Bitcoin,
  Truck,
  Layout,
  TrendingUp,
  Newspaper,
  Trophy,
  Search,
  Receipt,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, Spacing, Typography } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';
import UnifiedDepositModal from '@/components/modals/UnifiedDepositModal';
import UnifiedWithdrawModal from '@/components/modals/UnifiedWithdrawModal';
import BankConnectionModal from '@/components/modals/BankConnectionModal';
import NotificationCenterModal from '@/components/modals/NotificationCenterModal';
import DockCustomizationModal from '@/components/modals/DockCustomizationModal';

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
  badge?: number;
}

export default function MoreScreen() {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [bankConnectionModalVisible, setBankConnectionModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [dockModalVisible, setDockModalVisible] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Funding',
      items: [
        {
          id: 'deposit',
          title: 'Deposit',
          subtitle: 'Bank • Card • Crypto • Cash',
          icon: Download,
          iconColor: '#10B981',
          iconBg: 'rgba(16, 185, 129, 0.15)',
          onPress: () => setDepositModalVisible(true),
        },
        {
          id: 'withdraw',
          title: 'Withdraw',
          subtitle: 'Bank • Card • Crypto',
          icon: Upload,
          iconColor: '#F59E0B',
          iconBg: 'rgba(245, 158, 11, 0.15)',
          onPress: () => setWithdrawModalVisible(true),
        },
        {
          id: 'bank-connection',
          title: 'Connect Bank',
          subtitle: 'Link your bank account',
          icon: Building2,
          iconColor: '#06B6D4',
          iconBg: 'rgba(6, 182, 212, 0.15)',
          onPress: () => setBankConnectionModalVisible(true),
        },
      ],
    },
    {
      title: 'Explore',
      items: [
        {
          id: 'markets',
          title: 'Markets',
          subtitle: 'Explore stocks and trends',
          icon: TrendingUp,
          iconColor: '#F59E0B',
          iconBg: 'rgba(245, 158, 11, 0.15)',
          onPress: () => router.push('/(tabs)/markets'),
        },
        {
          id: 'alerts',
          title: 'Price Alerts',
          subtitle: 'Set custom price alerts',
          icon: Bell,
          iconColor: '#F59E0B',
          iconBg: 'rgba(245, 158, 11, 0.15)',
          onPress: () => router.push('/(tabs)/alerts'),
        },
        {
          id: 'news',
          title: 'Market News',
          subtitle: 'Latest financial news',
          icon: Newspaper,
          iconColor: '#3B82F6',
          iconBg: 'rgba(59, 130, 246, 0.15)',
          onPress: () => router.push('/(tabs)/news'),
        },
        {
          id: 'leaderboard',
          title: 'Leaderboard',
          subtitle: 'Top traders rankings',
          icon: Trophy,
          iconColor: '#F59E0B',
          iconBg: 'rgba(245, 158, 11, 0.15)',
          onPress: () => router.push('/(tabs)/leaderboard'),
        },
        {
          id: 'bots',
          title: 'Bot Marketplace',
          subtitle: 'Trading strategies',
          icon: Bot,
          iconColor: '#8B5CF6',
          iconBg: 'rgba(139, 92, 246, 0.15)',
          onPress: () => router.push('/(tabs)/bot-marketplace'),
        },
        {
          id: 'screener',
          title: 'Stock Screener',
          subtitle: 'Filter stocks',
          icon: Search,
          iconColor: '#3B82F6',
          iconBg: 'rgba(59, 130, 246, 0.15)',
          onPress: () => router.push('/(tabs)/screener'),
        },
        {
          id: 'activity',
          title: 'Activity',
          subtitle: 'View transaction history',
          icon: Activity,
          iconColor: '#06B6D4',
          iconBg: 'rgba(6, 182, 212, 0.15)',
          onPress: () => router.push('/(tabs)/history'),
        },
        {
          id: 'tax',
          title: 'Tax Reports',
          subtitle: 'Generate tax documents',
          icon: Receipt,
          iconColor: '#10B981',
          iconBg: 'rgba(16, 185, 129, 0.15)',
          onPress: () => router.push('/(tabs)/tax-reports'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          subtitle: 'Personal information',
          icon: User,
          iconColor: '#64748B',
          iconBg: 'rgba(100, 116, 139, 0.15)',
          onPress: () => router.push('/(tabs)/profile'),
        },
        {
          id: 'security',
          title: 'Security & Privacy',
          subtitle: 'Manage your security settings',
          icon: Lock,
          iconColor: '#EF4444',
          iconBg: 'rgba(239, 68, 68, 0.15)',
          onPress: () => {},
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Configure alerts and updates',
          icon: Bell,
          iconColor: '#F59E0B',
          iconBg: 'rgba(245, 158, 11, 0.15)',
          onPress: () => setNotificationModalVisible(true),
          badge: unreadCount,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'dock',
          title: 'Customize My Dock',
          subtitle: 'Personalize bottom navigation',
          icon: Layout,
          iconColor: '#8B5CF6',
          iconBg: 'rgba(139, 92, 246, 0.15)',
          onPress: () => setDockModalVisible(true),
        },
        {
          id: 'settings',
          title: 'Settings',
          subtitle: 'App preferences',
          icon: Settings,
          iconColor: '#64748B',
          iconBg: 'rgba(100, 116, 139, 0.15)',
          onPress: () => {},
        },
        {
          id: 'theme',
          title: 'Appearance',
          subtitle: 'Theme and display',
          icon: Palette,
          iconColor: '#EC4899',
          iconBg: 'rgba(236, 72, 153, 0.15)',
          onPress: () => {},
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English',
          icon: Globe,
          iconColor: '#3B82F6',
          iconBg: 'rgba(59, 130, 246, 0.15)',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          subtitle: 'Get support',
          icon: HelpCircle,
          iconColor: '#10B981',
          iconBg: 'rgba(16, 185, 129, 0.15)',
          onPress: () => router.push('/(tabs)/support'),
        },
        {
          id: 'documents',
          title: 'Documents',
          subtitle: 'Statements and tax forms',
          icon: FileText,
          iconColor: '#3B82F6',
          iconBg: 'rgba(59, 130, 246, 0.15)',
          onPress: () => {},
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <BlurView intensity={15} tint="dark" style={styles.menuItemBlur}>
        <View style={styles.menuItemContent}>
          <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
            <item.icon size={24} color={item.iconColor} strokeWidth={2} />
          </View>
          <View style={styles.menuItemText}>
            <View style={styles.menuItemHeader}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              {item.badge && item.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: item.iconColor }]}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </View>
            {item.subtitle && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFFFFF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {menuSections.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map(renderMenuItem)}
          </View>
        ))}

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => signOut()}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} tint="dark" style={styles.signOutBlur}>
            <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </BlurView>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 2.1.0</Text>
          <Text style={styles.footerText}>Bental Advisor</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <UnifiedDepositModal
        visible={depositModalVisible}
        onClose={() => setDepositModalVisible(false)}
      />

      <UnifiedWithdrawModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
      />

      <BankConnectionModal
        visible={bankConnectionModalVisible}
        onClose={() => setBankConnectionModalVisible(false)}
        onSuccess={() => {
          setBankConnectionModalVisible(false);
          handleRefresh();
        }}
      />

      <NotificationCenterModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />

      <DockCustomizationModal
        visible={dockModalVisible}
        onClose={() => setDockModalVisible(false)}
        onSave={() => handleRefresh()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  menuItem: {
    marginBottom: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItemBlur: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  menuItemSubtitle: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOutButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  signOutBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  signOutText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
});
