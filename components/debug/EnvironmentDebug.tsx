import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ENV } from '@/config/env';
import { Info, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * Environment Debug Component
 * Shows runtime environment configuration
 * REMOVE THIS IN PRODUCTION - For debugging only
 */
export function EnvironmentDebug() {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={styles.toggleButton}
        accessibilityLabel="Show environment debug info"
      >
        <Info size={20} color="rgba(255, 255, 255, 0.5)" />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Environment Debug</Text>
        <TouchableOpacity
          onPress={() => setIsVisible(false)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <DebugRow label="Environment" value={ENV.env} />
        <DebugRow
          label="Supabase URL"
          value={ENV.supabase.url || 'NOT SET'}
          status={!!ENV.supabase.url}
        />
        <DebugRow
          label="Supabase Key"
          value={ENV.supabase.anonKey ? `${ENV.supabase.anonKey.substring(0, 20)}...` : 'NOT SET'}
          status={!!ENV.supabase.anonKey}
        />
        <DebugRow
          label="Key Length"
          value={ENV.supabase.anonKey ? `${ENV.supabase.anonKey.length} chars` : 'N/A'}
        />
      </View>

      <Text style={styles.footer}>
        REMOVE THIS COMPONENT IN PRODUCTION
      </Text>
    </Animated.View>
  );
}

function DebugRow({ label, value, status }: { label: string; value: string; status?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <View style={styles.valueContainer}>
        {status !== undefined && (
          <Text style={styles.status}>{status ? '✅' : '❌'}</Text>
        )}
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    padding: 16,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    minWidth: 100,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  status: {
    fontSize: 10,
  },
  value: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
    flex: 1,
  },
  footer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
