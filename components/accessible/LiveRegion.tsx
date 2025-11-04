import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'none';
  atomic?: boolean;
  children?: React.ReactNode;
}

export function LiveRegion({
  message,
  politeness = 'polite',
  atomic = true,
  children,
}: LiveRegionProps) {
  const previousMessage = useRef<string>('');

  useEffect(() => {
    if (message && message !== previousMessage.current) {
      AccessibilityInfo.announceForAccessibility(message);
      previousMessage.current = message;
    }
  }, [message]);

  return (
    <View
      style={styles.liveRegion}
      accessible={true}
      accessibilityLiveRegion={politeness}
      accessibilityRole="alert"
      {...(atomic && { accessibilityAtomic: atomic })}
    >
      {children || <Text style={styles.srOnly}>{message}</Text>}
    </View>
  );
}

interface StatusMessageProps {
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  visible?: boolean;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

export function StatusMessage({
  status,
  message,
  visible = true,
  onDismiss,
  autoHideDuration = 5000,
}: StatusMessageProps) {
  useEffect(() => {
    if (visible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [visible, autoHideDuration, onDismiss]);

  if (!visible) return null;

  const statusColors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  };

  const statusIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <LiveRegion
      message={message}
      politeness={status === 'error' ? 'assertive' : 'polite'}
    >
      <View
        style={[
          styles.statusMessage,
          { borderLeftColor: statusColors[status] },
        ]}
        accessible={true}
        accessibilityRole="alert"
      >
        <Text style={styles.statusIcon}>{statusIcons[status]}</Text>
        <Text style={styles.statusText}>{message}</Text>
      </View>
    </LiveRegion>
  );
}

interface LoadingAnnouncerProps {
  loading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
}

export function LoadingAnnouncer({
  loading,
  loadingMessage = 'Loading...',
  completedMessage = 'Loading complete',
}: LoadingAnnouncerProps) {
  const wasLoading = useRef(false);

  useEffect(() => {
    if (loading && !wasLoading.current) {
      AccessibilityInfo.announceForAccessibility(loadingMessage);
      wasLoading.current = true;
    } else if (!loading && wasLoading.current) {
      AccessibilityInfo.announceForAccessibility(completedMessage);
      wasLoading.current = false;
    }
  }, [loading, loadingMessage, completedMessage]);

  return (
    <View
      style={styles.srOnly}
      accessible={true}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: loading }}
    >
      <Text>{loading ? loadingMessage : completedMessage}</Text>
    </View>
  );
}

interface ErrorBoundaryAnnouncerProps {
  error: Error | null;
  errorMessage?: string;
}

export function ErrorBoundaryAnnouncer({
  error,
  errorMessage = 'An error occurred',
}: ErrorBoundaryAnnouncerProps) {
  useEffect(() => {
    if (error) {
      AccessibilityInfo.announceForAccessibility(
        `${errorMessage}: ${error.message}`
      );
    }
  }, [error, errorMessage]);

  if (!error) return null;

  return (
    <View
      style={styles.srOnly}
      accessible={true}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
    >
      <Text>
        {errorMessage}: {error.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  liveRegion: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  } as any,
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    gap: 12,
  },
  statusIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
