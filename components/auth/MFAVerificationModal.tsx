import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { spacing, typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface MFAVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  method?: 'totp' | 'sms';
  phoneNumber?: string;
}

export function MFAVerificationModal({
  visible,
  onClose,
  onVerify,
  method = 'totp',
  phoneNumber,
}: MFAVerificationModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      // Focus first input when modal opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      // Reset state when modal closes
      setCode(['', '', '', '', '', '']);
      setError('');
    }
  }, [visible]);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);

      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value) {
      handleVerify([...newCode.slice(0, 5), value]);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeToVerify = code) => {
    const fullCode = codeToVerify.join('');

    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onVerify(fullCode);

      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onClose();
      } else {
        setError(result.error || 'Invalid verification code');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.container}
        >
          <LinearGradient
            colors={['rgba(26, 26, 28, 0.95)', 'rgba(20, 20, 22, 0.98)']}
            style={styles.content}
          >
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Shield size={48} color="rgba(255, 255, 255, 0.9)" strokeWidth={2} />
            </View>

            <Text style={styles.title}>Two-Factor Authentication</Text>
            <Text style={styles.subtitle}>
              {method === 'sms'
                ? `Enter the code sent to ${phoneNumber || 'your phone'}`
                : 'Enter the 6-digit code from your authenticator app'}
            </Text>

            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    if (ref) inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                    error && styles.codeInputError,
                  ]}
                  value={digit}
                  onChangeText={value => handleCodeChange(value, index)}
                  onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                  accessible
                  accessibilityLabel={`Digit ${index + 1}`}
                />
              ))}
            </View>

            {error && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.errorContainer}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              onPress={() => handleVerify()}
              style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            {method === 'sms' && (
              <TouchableOpacity style={styles.resendButton}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.backupButton}>
              <Text style={styles.backupText}>Use backup code instead</Text>
            </TouchableOpacity>
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
    maxWidth: 440,
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
    padding: spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.98)',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  codeInputError: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorContainer: {
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#EF4444',
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  resendButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  resendText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: 'rgba(200, 200, 200, 0.9)',
    textDecorationLine: 'underline',
  },
  backupButton: {
    paddingVertical: spacing.sm,
  },
  backupText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
