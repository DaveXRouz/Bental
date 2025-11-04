import { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, CheckCheck, TrendingUp, AlertCircle, Info, DollarSign } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatDate } from '@/utils/formatting';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { showToast } from '@/components/ui/ToastManager';

const { height } = Dimensions.get('window');

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  read: boolean;
  created_at: string;
}

type FilterType = 'all' | 'trades' | 'alerts' | 'account';

export default function NotificationCenterModal({ visible, onClose }: NotificationCenterModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setError(null);
    setLoading(true);

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('category', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter]);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Failed to mark notifications as read', 'error');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.headerRight}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={markAllAsRead}
                    activeOpacity={0.7}
                  >
                    <CheckCheck size={18} color="#10B981" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <BlurView intensity={40} tint="dark" style={styles.closeButtonInner}>
                    <X size={20} color="#FFFFFF" />
                  </BlurView>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterContainer}>
              {(['all', 'trades', 'alerts', 'account'] as FilterType[]).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, filter === type && styles.filterChipActive]}
                  onPress={() => setFilter(type)}
                  activeOpacity={0.7}
                >
                  <BlurView intensity={filter === type ? 80 : 40} tint="dark" style={styles.filterChipInner}>
                    <Text style={[styles.filterChipText, filter === type && styles.filterChipTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner message="Loading notifications..." />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <ErrorState type="server" message={error} onRetry={fetchNotifications} />
              </View>
            ) : (
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {notifications.length === 0 ? (
                  <BlurView intensity={40} tint="dark" style={styles.emptyState}>
                    <Info size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No Notifications</Text>
                    <Text style={styles.emptySubtext}>
                      You're all caught up!
                    </Text>
                  </BlurView>
                ) : (
                  notifications.map(notification => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onPress={() => markAsRead(notification.id)}
                    />
                  ))
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const getIcon = () => {
    switch (notification.category) {
      case 'trades':
        return <TrendingUp size={20} color="#10B981" />;
      case 'alerts':
        return <AlertCircle size={20} color="#F59E0B" />;
      case 'account':
        return <DollarSign size={20} color="#3B82F6" />;
      default:
        return <Info size={20} color={colors.textSecondary} />;
    }
  };

  const getCategoryColor = (): readonly [string, string, ...string[]] => {
    switch (notification.category) {
      case 'trades':
        return ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.06)'] as const;
      case 'alerts':
        return ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.06)'] as const;
      case 'account':
        return ['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.06)'] as const;
      default:
        return ['rgba(100,116,139,0.12)', 'rgba(100,116,139,0.06)'] as const;
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <BlurView
        intensity={notification.read ? 20 : 60}
        tint="dark"
        style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
      >
        <LinearGradient colors={getCategoryColor()} style={StyleSheet.absoluteFill} />
        <View style={styles.notificationContent}>
          <View style={styles.iconContainer}>{getIcon()}</View>
          <View style={styles.notificationInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationDate}>{formatDate(notification.created_at)}</Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
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
    height: height * 0.85,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  markAllButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  filterChip: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  filterChipInner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  filterChipActive: {},
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  emptyState: {
    padding: 48,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notificationCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  notificationCardUnread: {
    borderColor: '#3B82F6',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
