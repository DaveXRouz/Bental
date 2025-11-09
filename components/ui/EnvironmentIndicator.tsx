import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getEnvironmentFromUrl } from '@/config/env';

interface EnvironmentIndicatorProps {
  variant?: 'badge' | 'banner';
  showInProduction?: boolean;
}

export function EnvironmentIndicator({
  variant = 'badge',
  showInProduction = false,
}: EnvironmentIndicatorProps) {
  const environment = getEnvironmentFromUrl();

  // Don't show in production unless explicitly requested
  if (environment === 'PRODUCTION' && !showInProduction) {
    return null;
  }

  const getColor = () => {
    switch (environment) {
      case 'PRODUCTION':
        return '#10B981'; // Green
      case 'STAGING':
        return '#F59E0B'; // Orange
      case 'DEVELOPMENT':
        return '#3B82F6'; // Blue
      case 'LOCAL':
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280'; // Gray
    }
  };

  if (variant === 'banner') {
    return (
      <View style={[styles.banner, { backgroundColor: `${getColor()}20` }]}>
        <View style={[styles.dot, { backgroundColor: getColor() }]} />
        <Text style={[styles.bannerText, { color: getColor() }]}>
          {environment} ENVIRONMENT
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: `${getColor()}20` }]}>
      <View style={[styles.dot, { backgroundColor: getColor() }]} />
      <Text style={[styles.badgeText, { color: getColor() }]}>
        {environment}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
