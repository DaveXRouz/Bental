import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Smartphone, Monitor, Shield, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { spacing, typography } from '@/constants/theme';
import { useSessionManagement } from '@/hooks/useSessionManagement';

interface SessionManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SessionManagementModal({ visible, onClose }: SessionManagementModalProps) {
  const { sessions, loading, revokeSession, revokeAllOtherSessions, trustDevice } = useSessionManagement();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRevokeSession = async (sessionId: string, deviceName: string) => {
    Alert.alert(
      'Revoke Session',
      `Are you sure you want to sign out from ${deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(sessionId);
            await revokeSession(sessionId);
            setActionLoading(null);
          },
        },
      ]
    );
  };

  const handleRevokeAll = () => {
    Alert.alert(
      'Sign Out All Other Devices',
      'This will sign you out from all devices except this one. You\'ll need to sign in again on those devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('all');
            await revokeAllOtherSessions();
            setActionLoading(null);
          },
        },
      ]
    );
  };

  const handleTrustDevice = async (sessionId: string) => {
    setActionLoading(sessionId);
    await trustDevice(sessionId);
    setActionLoading(null);
  };

  const formatLastActive = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.includes('Web') || deviceName.includes('Browser')) {
      return <Monitor size={20} color="rgba(255, 255, 255, 0.7)" />;
    }
    return <Smartphone size={20} color="rgba(255, 255, 255, 0.7)" />;
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
          <LinearGradient
            colors={['rgba(26, 26, 28, 0.95)', 'rgba(20, 20, 22, 0.98)']}
            style={styles.content}
          >
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Shield size={24} color="rgba(255, 255, 255, 0.9)" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Active Sessions</Text>
                <Text style={styles.subtitle}>Manage devices where you're signed in</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.7)" />
              </View>
            ) : (
              <>
                <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
                  {sessions.map((session, index) => (
                    <Animated.View
                      key={session.id}
                      entering={FadeInDown.duration(300).delay(index * 50)}
                      style={[styles.sessionCard, session.is_current && styles.currentSession]}
                    >
                      <View style={styles.sessionHeader}>
                        <View style={styles.deviceIconContainer}>
                          {getDeviceIcon(session.device_name)}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.sessionTitleRow}>
                            <Text style={styles.deviceName}>{session.device_name}</Text>
                            {session.is_current && (
                              <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>Current</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.lastActive}>
                            {formatLastActive(session.last_active)}
                          </Text>
                          {session.ip_address && (
                            <Text style={styles.ipAddress}>{session.ip_address}</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.sessionActions}>
                        {!session.trusted && !session.is_current && (
                          <TouchableOpacity
                            onPress={() => handleTrustDevice(session.id)}
                            style={styles.trustButton}
                            disabled={actionLoading === session.id}
                          >
                            {actionLoading === session.id ? (
                              <ActivityIndicator size="small" color="#10B981" />
                            ) : (
                              <>
                                <CheckCircle2 size={16} color="#10B981" />
                                <Text style={styles.trustButtonText}>Trust</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}

                        {session.trusted && !session.is_current && (
                          <View style={styles.trustedBadge}>
                            <CheckCircle2 size={14} color="#10B981" />
                            <Text style={styles.trustedText}>Trusted</Text>
                          </View>
                        )}

                        {!session.is_current && (
                          <TouchableOpacity
                            onPress={() => handleRevokeSession(session.id, session.device_name)}
                            style={styles.revokeButton}
                            disabled={actionLoading === session.id}
                          >
                            {actionLoading === session.id ? (
                              <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                              <>
                                <Trash2 size={16} color="#EF4444" />
                                <Text style={styles.revokeButtonText}>Revoke</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </Animated.View>
                  ))}
                </ScrollView>

                {sessions.filter(s => !s.is_current).length > 1 && (
                  <TouchableOpacity
                    onPress={handleRevokeAll}
                    style={styles.revokeAllButton}
                    disabled={actionLoading === 'all'}
                  >
                    {actionLoading === 'all' ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <AlertTriangle size={18} color="#FFF" />
                        <Text style={styles.revokeAllText}>Sign Out All Other Devices</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.98)',
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionsList: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentSession: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  deviceName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: '#10B981',
  },
  lastActive: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  ipAddress: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  trustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  trustButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#10B981',
  },
  trustedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  trustedText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: '#10B981',
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  revokeButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#EF4444',
  },
  revokeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  revokeAllText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#FFF',
  },
});
