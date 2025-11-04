import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Mail, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { spacing, typography } from '@/constants/theme';
import { useMagicLink } from '@/hooks/useMagicLink';

interface MagicLinkModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MagicLinkModal({ visible, onClose, onSuccess }: MagicLinkModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { loading, emailSent, sendMagicLink, resetState } = useMagicLink();

  const handleClose = () => {
    setEmail('');
    setError('');
    resetState();
    onClose();
  };

  const handleSendLink = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    const result = await sendMagicLink(email);

    if (!result.success) {
      setError(result.error || 'Failed to send magic link');
    } else {
      onSuccess?.();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
          <LinearGradient
            colors={['rgba(26, 26, 28, 0.95)', 'rgba(20, 20, 22, 0.98)']}
            style={styles.content}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>

            {!emailSent ? (
              <>
                <View style={styles.iconContainer}>
                  <Mail size={48} color="rgba(255, 255, 255, 0.9)" strokeWidth={2} />
                </View>

                <Text style={styles.title}>Sign In with Magic Link</Text>
                <Text style={styles.subtitle}>
                  We'll send you a secure link to sign in instantly without a password
                </Text>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color="rgba(255, 255, 255, 0.5)" />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                      }}
                      placeholder="your@email.com"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      editable={!loading}
                    />
                  </View>

                  {error && (
                    <Animated.View entering={FadeInDown.duration(200)}>
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleSendLink}
                  style={[styles.button, loading && styles.buttonDisabled]}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Send Magic Link</Text>
                      <ArrowRight size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>
                    The link will expire in 1 hour for security
                  </Text>
                </View>
              </>
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <CheckCircle2 size={64} color="#10B981" strokeWidth={2} />
                </View>

                <Text style={styles.successTitle}>Check Your Email</Text>
                <Text style={styles.successSubtitle}>
                  We've sent a magic link to
                </Text>
                <Text style={styles.emailDisplay}>{email}</Text>

                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionText}>1. Open your email</Text>
                  <Text style={styles.instructionText}>2. Click the magic link</Text>
                  <Text style={styles.instructionText}>3. You'll be signed in automatically</Text>
                </View>

                <TouchableOpacity onPress={handleClose} style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => resetState()} style={styles.resendButton}>
                  <Text style={styles.resendText}>Didn't receive it? Try again</Text>
                </TouchableOpacity>
              </Animated.View>
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
    width: 96,
    height: 96,
    borderRadius: 48,
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
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.95)',
    padding: 0,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#EF4444',
    marginTop: spacing.sm,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#FFF',
  },
  infoContainer: {
    paddingVertical: spacing.sm,
  },
  infoText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.98)',
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing.xs,
  },
  emailDisplay: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: spacing.xl,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  instructionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  doneButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  doneButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#10B981',
  },
  resendButton: {
    paddingVertical: spacing.sm,
  },
  resendText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'underline',
  },
});
