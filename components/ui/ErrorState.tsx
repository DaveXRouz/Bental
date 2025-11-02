import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, WifiOff, ServerCrash, RefreshCw, Mail } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

interface ErrorStateProps {
  type?: 'network' | 'server' | 'validation' | 'generic';
  title?: string;
  message?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  showSupport?: boolean;
}

export function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  onContactSupport,
  showSupport = false,
}: ErrorStateProps) {
  const errorConfig = getErrorConfig(type);
  const finalTitle = title || errorConfig.title;
  const finalMessage = message || errorConfig.message;

  return (
    <View style={styles.container}>
      <BlurView intensity={60} tint="dark" style={styles.card}>
        <LinearGradient
          colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.06)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.iconContainer}>
          {errorConfig.icon}
        </View>
        <Text style={styles.title}>{finalTitle}</Text>
        <Text style={styles.message}>{finalMessage}</Text>

        <View style={styles.actions}>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.7}>
              <BlurView intensity={60} tint="dark" style={styles.retryButtonInner}>
                <RefreshCw size={16} color="#3B82F6" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </BlurView>
            </TouchableOpacity>
          )}

          {showSupport && onContactSupport && (
            <TouchableOpacity
              style={styles.supportButton}
              onPress={onContactSupport}
              activeOpacity={0.7}
            >
              <Mail size={16} color={colors.textSecondary} />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </View>
  );
}

export function InlineError({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <BlurView intensity={40} tint="dark" style={styles.inlineError}>
      <AlertCircle size={16} color="#EF4444" />
      <Text style={styles.inlineErrorText}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </BlurView>
  );
}

export function FieldError({ message }: { message: string }) {
  return (
    <View style={styles.fieldError}>
      <AlertCircle size={14} color="#EF4444" />
      <Text style={styles.fieldErrorText}>{message}</Text>
    </View>
  );
}

function getErrorConfig(type: string) {
  switch (type) {
    case 'network':
      return {
        icon: <WifiOff size={48} color="#EF4444" />,
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
      };
    case 'server':
      return {
        icon: <ServerCrash size={48} color="#EF4444" />,
        title: 'Server Error',
        message: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
      };
    case 'validation':
      return {
        icon: <AlertCircle size={48} color="#F59E0B" />,
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
      };
    default:
      return {
        icon: <AlertCircle size={48} color="#EF4444" />,
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239,68,68,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  retryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    overflow: 'hidden',
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 18,
  },
  dismissText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  fieldError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#EF4444',
  },
});
