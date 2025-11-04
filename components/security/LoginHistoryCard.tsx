import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { CheckCircle2, XCircle, MapPin, Monitor, Smartphone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { spacing, typography } from '@/constants/theme';
import { useLoginHistory } from '@/hooks/useLoginHistory';

export function LoginHistoryCard() {
  const { history, loading, formatRelativeTime, getLocationDisplay, getDeviceDisplay } = useLoginHistory(5);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Login Activity</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.7)" />
        </View>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Login Activity</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No login history available</Text>
        </View>
      </View>
    );
  }

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === 'Web') {
      return <Monitor size={16} color="rgba(255, 255, 255, 0.6)" />;
    }
    return <Smartphone size={16} color="rgba(255, 255, 255, 0.6)" />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Login Activity</Text>
        <Text style={styles.subtitle}>Last {history.length} login attempts</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {history.map((entry, index) => (
          <Animated.View
            key={entry.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
            style={styles.historyItem}
          >
            <LinearGradient
              colors={
                entry.success
                  ? ['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.05)']
                  : ['rgba(239, 68, 68, 0.08)', 'rgba(239, 68, 68, 0.05)']
              }
              style={styles.itemGradient}
            >
              <View style={styles.itemHeader}>
                <View style={styles.statusIconContainer}>
                  {entry.success ? (
                    <CheckCircle2 size={20} color="#10B981" strokeWidth={2.5} />
                  ) : (
                    <XCircle size={20} color="#EF4444" strokeWidth={2.5} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusText}>
                    {entry.success ? 'Successful Login' : 'Failed Login Attempt'}
                  </Text>
                  <Text style={styles.timeText}>{formatRelativeTime(entry.created_at)}</Text>
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  {getDeviceIcon(entry.device_type)}
                  <Text style={styles.detailText}>{getDeviceDisplay(entry)}</Text>
                </View>

                {(entry.location || entry.ip_address) && (
                  <View style={styles.detailRow}>
                    <MapPin size={16} color="rgba(255, 255, 255, 0.6)" />
                    <Text style={styles.detailText}>{getLocationDisplay(entry)}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.98)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  loadingContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  list: {
    maxHeight: 400,
  },
  historyItem: {
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemGradient: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 2,
  },
  timeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detailsContainer: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
