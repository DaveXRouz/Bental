import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, BellOff, CheckCircle, Smartphone } from 'lucide-react-native';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { colors, spacing } from '@/constants/theme';
import { BlurView } from 'expo-blur';

export default function NotificationSettings() {
  const {
    expoPushToken,
    permissionGranted,
    loading,
    registerForNotifications,
    scheduleNotification,
    sendImmediateNotification,
  } = usePushNotifications();

  const [priceAlerts, setPriceAlerts] = useState(true);
  const [tradeUpdates, setTradeUpdates] = useState(true);
  const [marketNews, setMarketNews] = useState(true);
  const [portfolioUpdates, setPortfolioUpdates] = useState(true);
  const [botAlerts, setBotAlerts] = useState(true);

  const handleEnableNotifications = async () => {
    if (permissionGranted) {
      Alert.alert('Already Enabled', 'Push notifications are already enabled');
      return;
    }

    await registerForNotifications();
  };

  const handleTestNotification = async () => {
    if (!permissionGranted) {
      Alert.alert('Not Enabled', 'Please enable push notifications first');
      return;
    }

    await sendImmediateNotification(
      'Test Notification',
      'This is a test notification from your trading app!'
    );

    Alert.alert('Sent', 'Test notification sent!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <BlurView intensity={40} tint="dark" style={styles.statusCard}>
          <View style={styles.statusIcon}>
            {permissionGranted ? (
              <Bell size={32} color="#10B981" />
            ) : (
              <BellOff size={32} color="#EF4444" />
            )}
          </View>
          <Text style={styles.statusTitle}>
            {permissionGranted ? 'Notifications Enabled' : 'Notifications Disabled'}
          </Text>
          <Text style={styles.statusDescription}>
            {permissionGranted
              ? 'You will receive push notifications for important events'
              : 'Enable push notifications to stay updated'}
          </Text>

          {loading ? (
            <Text style={styles.statusLoading}>Setting up notifications...</Text>
          ) : permissionGranted ? (
            <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
              <Smartphone size={18} color={colors.white} />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.enableButton} onPress={handleEnableNotifications}>
              <Bell size={18} color={colors.white} />
              <Text style={styles.enableButtonText}>Enable Notifications</Text>
            </TouchableOpacity>
          )}

          {expoPushToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Device Token:</Text>
              <Text style={styles.tokenValue} numberOfLines={1} ellipsizeMode="middle">
                {expoPushToken}
              </Text>
            </View>
          )}
        </BlurView>

        {/* Notification Preferences */}
        {permissionGranted && (
          <BlurView intensity={40} tint="dark" style={styles.preferencesCard}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceTitle}>Price Alerts</Text>
                <Text style={styles.preferenceDescription}>
                  Get notified when prices hit your target
                </Text>
              </View>
              <Switch
                value={priceAlerts}
                onValueChange={setPriceAlerts}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceTitle}>Trade Updates</Text>
                <Text style={styles.preferenceDescription}>
                  Notifications when trades are executed
                </Text>
              </View>
              <Switch
                value={tradeUpdates}
                onValueChange={setTradeUpdates}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceTitle}>Market News</Text>
                <Text style={styles.preferenceDescription}>
                  Breaking news and market updates
                </Text>
              </View>
              <Switch
                value={marketNews}
                onValueChange={setMarketNews}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceTitle}>Portfolio Updates</Text>
                <Text style={styles.preferenceDescription}>
                  Daily portfolio performance summaries
                </Text>
              </View>
              <Switch
                value={portfolioUpdates}
                onValueChange={setPortfolioUpdates}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceTitle}>Bot Alerts</Text>
                <Text style={styles.preferenceDescription}>
                  Trading bot performance and actions
                </Text>
              </View>
              <Switch
                value={botAlerts}
                onValueChange={setBotAlerts}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor={colors.white}
              />
            </View>
          </BlurView>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  statusCard: {
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statusLoading: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#10B981',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  enableButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#3B82F6',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  tokenContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  tokenLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  tokenValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.white,
  },
  preferencesCard: {
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.lg,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  preferenceLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xxs,
  },
  preferenceDescription: {
    fontSize: 13,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
