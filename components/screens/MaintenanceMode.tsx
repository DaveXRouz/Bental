import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Settings, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { spacing, typography } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

interface MaintenanceModeProps {
  message?: string;
}

export function MaintenanceMode({
  message = "We're currently performing scheduled maintenance. We'll be back soon!"
}: MaintenanceModeProps) {
  const { width, isMobile } = useResponsive();
  const isSmallDevice = width < 375;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        entering={FadeIn.duration(800)}
        style={[styles.content, { maxWidth: isMobile ? width - 48 : 500 }]}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
            style={styles.iconGradient}
          >
            <Settings
              size={isSmallDevice ? 64 : 80}
              color="#3b82f6"
              strokeWidth={1.5}
            />
          </LinearGradient>
        </View>

        <Text style={[styles.title, { fontSize: isSmallDevice ? 28 : 32 }]}>
          Under Maintenance
        </Text>

        <Text style={[styles.message, { fontSize: isSmallDevice ? 15 : 16 }]}>
          {message}
        </Text>

        <View style={styles.statusContainer}>
          <View style={styles.statusDot}>
            <Animated.View
              style={[
                styles.statusDotInner,
                styles.statusDotPulse
              ]}
            />
          </View>
          <Text style={styles.statusText}>System maintenance in progress</Text>
        </View>

        <View style={styles.infoCard}>
          <RefreshCw size={20} color="#94a3b8" strokeWidth={2} />
          <Text style={styles.infoText}>
            This page will automatically refresh when maintenance is complete
          </Text>
        </View>

        <Text style={styles.footer}>
          Thank you for your patience
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xxxl,
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: 'rgba(255, 255, 255, 0.98)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  statusDotPulse: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  statusText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.3,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 28, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  infoText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  footer: {
    fontSize: typography.size.sm,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontWeight: typography.weight.medium,
    letterSpacing: 0.3,
  },
});
