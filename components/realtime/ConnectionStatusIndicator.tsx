import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react-native';
import type { ConnectionStatus } from '@/services/realtime/connection-manager';

export interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  onReconnect?: () => void;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'inline' | 'floating';
}

const STATUS_CONFIG = {
  disconnected: {
    color: '#6B7280',
    icon: WifiOff,
    label: 'Disconnected',
    pulse: false,
  },
  connecting: {
    color: '#F59E0B',
    icon: RefreshCw,
    label: 'Connecting',
    pulse: true,
  },
  connected: {
    color: '#10B981',
    icon: Wifi,
    label: 'Connected',
    pulse: true,
  },
  reconnecting: {
    color: '#F59E0B',
    icon: RefreshCw,
    label: 'Reconnecting',
    pulse: true,
  },
  error: {
    color: '#EF4444',
    icon: AlertCircle,
    label: 'Error',
    pulse: false,
  },
};

export function ConnectionStatusIndicator({
  status,
  onReconnect,
  showLabel = true,
  size = 'medium',
  position = 'inline',
}: ConnectionStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation
  useEffect(() => {
    if (!config.pulse) {
      pulseAnim.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [config.pulse, pulseAnim]);

  // Rotate animation for connecting/reconnecting
  useEffect(() => {
    if (status !== 'connecting' && status !== 'reconnecting') {
      rotateAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [status, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const iconSize = size === 'small' ? 14 : size === 'medium' ? 18 : 24;
  const dotSize = size === 'small' ? 8 : size === 'medium' ? 10 : 12;

  const containerStyle = position === 'floating' ? styles.floatingContainer : styles.inlineContainer;

  if (!showLabel && position === 'inline') {
    // Minimal dot indicator
    return (
      <Animated.View
        style={[
          styles.dotIndicator,
          {
            backgroundColor: config.color,
            width: dotSize,
            height: dotSize,
            opacity: pulseAnim,
          },
        ]}
      />
    );
  }

  return (
    <View style={[containerStyle, position === 'floating' && styles.floating]}>
      <View style={[styles.indicator, { backgroundColor: `${config.color}15` }]}>
        <Animated.View
          style={{
            opacity: pulseAnim,
            transform: [{ rotate: rotation }],
          }}
        >
          <Icon size={iconSize} color={config.color} />
        </Animated.View>

        {showLabel && (
          <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        )}

        {(status === 'error' || status === 'disconnected') && onReconnect && (
          <TouchableOpacity
            style={[styles.reconnectButton, { borderColor: config.color }]}
            onPress={onReconnect}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RefreshCw size={12} color={config.color} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineContainer: {
    alignSelf: 'flex-start',
  },
  floatingContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1000,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reconnectButton: {
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 4,
  },
  dotIndicator: {
    borderRadius: 999,
  },
});
