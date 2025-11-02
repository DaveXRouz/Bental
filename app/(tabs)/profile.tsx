import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, RefreshControl, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
import { useRouter } from 'expo-router';
import { LogOut, User as UserIcon, Phone, Mail, Calendar, Shield, Edit2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeStore } from '@/stores/useThemeStore';
import { colors, Spacing, Typography, radii, shadows } from '@/constants/theme';
import { GlassCard, GlassHeader, GlassHero } from '@/components/glass';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileEditModal from '@/components/modals/ProfileEditModal';
import * as Haptics from 'expo-haptics';

interface ClientData {
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useThemeStore();
  const router = useRouter();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    if (data) {
      setClientData(data);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditModalVisible(true);
  };

  const handleCloseEdit = async () => {
    setEditModalVisible(false);
    await fetchProfile();
  };

  const handleSignOut = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="Profile" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        accessible={true}
        accessibilityLabel="Profile main content"
      >
        <GlassHero
          name={clientData?.full_name || 'User'}
          role="Financial Advisory Client"
          verified
        />

        <GlassCard style={styles.section} variant="elevated">
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.text} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Information
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
              activeOpacity={0.7}
            >
              <BlurView intensity={15} tint="dark" style={styles.editButtonBlur}>
                <Edit2 size={16} color="#FFFFFF" strokeWidth={2.5} />
              </BlurView>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <UserIcon size={20} color={colors.text} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Full Name
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                {clientData?.full_name || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Mail size={20} color={colors.text} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Email
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                {clientData?.email || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Phone size={20} color={colors.text} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Phone
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                {clientData?.phone || 'Not provided'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Calendar size={20} color={colors.text} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Member Since
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                {clientData?.created_at ? formatDate(clientData.created_at) : 'N/A'}
              </Text>
            </View>
          </View>
        </GlassCard>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <BlurView intensity={18} tint="dark" style={styles.signOutBlur}>
            <LinearGradient
              colors={['rgba(239,68,68,0.20)' as const, 'rgba(220,38,38,0.12)' as const]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signOutGradient}
            >
              <LogOut size={20} color={colors.danger} strokeWidth={2.5} />
              <Text style={[styles.signOutText, { color: colors.danger }]}>
                Sign Out
              </Text>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        <View style={styles.footer} accessible={true} accessibilityLabel="Application information">
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Professional Financial Advisory
          </Text>
        </View>
      </ScrollView>

      {clientData && (
        <ProfileEditModal
          visible={editModalVisible}
          onClose={handleCloseEdit}
          initialData={{
            full_name: clientData.full_name,
            email: clientData.email,
            phone: clientData.phone || undefined,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: isTablet ? Spacing.xl : Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  avatarContainer: {
    width: isTablet ? 96 : 80,
    height: isTablet ? 96 : 80,
    borderRadius: isTablet ? 48 : 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: isTablet ? 42 : 36,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Typography.family.bold,
  },
  headerName: {
    fontSize: isTablet ? Typography.size.xxl : 22,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    fontFamily: Typography.family.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.family.regular,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIcon: {
    opacity: 0.8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: isTablet ? Typography.size.lg : 16,
    fontWeight: '600',
    fontFamily: Typography.family.semibold,
  },
  editButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  editButtonBlur: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  infoIconContainer: {
    width: isTablet ? 48 : 42,
    height: isTablet ? 48 : 42,
    borderRadius: isTablet ? 24 : 21,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: isTablet ? Typography.size.sm : 12,
    marginBottom: 4,
    fontFamily: Typography.family.regular,
  },
  infoValue: {
    fontSize: isTablet ? Typography.size.md : 14,
    fontWeight: '500',
    fontFamily: Typography.family.medium,
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },
  signOutButton: {
    borderRadius: radii.card,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...shadows.md,
  },
  signOutBlur: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md + 2,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: radii.card,
  },
  signOutText: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    fontFamily: Typography.family.bold,
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.size.xs,
    marginBottom: 4,
    fontFamily: Typography.family.regular,
    textAlign: 'center',
  },
});
