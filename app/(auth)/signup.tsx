import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { User, Mail, Phone, Lock, Chrome, Apple as AppleIcon, Shield } from 'lucide-react-native';
import { VibrantGradientBackground } from '@/components/backgrounds';
import { useBrandImages } from '@/services/media';
import AuthFooter from '@/components/ui/AuthFooter';
import { UnifiedInput } from '@/components/ui/UnifiedInput';
import { UnifiedButton } from '@/components/ui/UnifiedButton';
import { colors, typography, radius, spacing, shadows } from '@/constants/theme';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const { images } = useBrandImages();
  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
    }, [])
  );

  const handleFullNameChange = (text: string) => {
    setFullName(text);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, phone);

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Account created successfully!');
      router.replace('/(tabs)');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signed in with Google');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signed in with Apple');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <VibrantGradientBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Shield size={48} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to get started</Text>
          </View>

          <BlurView intensity={22} tint="dark" style={styles.formBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.10)' as const, 'rgba(255,255,255,0.04)' as const]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formGradient}
            >
              <View style={styles.form}>
                <UnifiedInput
                  icon={<User size={20} color="rgba(11, 22, 33, 0.6)" strokeWidth={1.8} />}
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={handleFullNameChange}
                  autoCapitalize="words"
                  editable={!loading}
                />

                <UnifiedInput
                  icon={<Mail size={20} color="rgba(11, 22, 33, 0.6)" strokeWidth={1.8} />}
                  placeholder="Email address"
                  value={email}
                  onChangeText={handleEmailChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />

                <UnifiedInput
                  icon={<Phone size={20} color="rgba(11, 22, 33, 0.6)" strokeWidth={1.8} />}
                  placeholder="Phone (optional)"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  editable={!loading}
                />

                <UnifiedInput
                  icon={<Lock size={20} color="rgba(11, 22, 33, 0.6)" strokeWidth={1.8} />}
                  placeholder="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                  editable={!loading}
                />

                <UnifiedInput
                  icon={<Lock size={20} color="rgba(11, 22, 33, 0.6)" strokeWidth={1.8} />}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry
                  editable={!loading}
                />

                <UnifiedButton
                  title="Create Account"
                  onPress={handleSignUp}
                  disabled={loading}
                  loading={loading}
                  variant="primary"
                  fullWidth
                />

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtonsRow}>
                  <UnifiedButton
                    title="Google"
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    variant="secondary"
                    size="md"
                    icon={<Chrome size={20} color="#FFFFFF" />}
                    style={{ flex: 1 }}
                  />

                  <UnifiedButton
                    title="Apple"
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    variant="secondary"
                    size="md"
                    icon={<AppleIcon size={20} color="#FFFFFF" />}
                    style={{ flex: 1 }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.back()}
                  activeOpacity={0.9}
                >
                  <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>

          <Text style={styles.footer}>By signing up, you agree to our Terms & Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <AuthFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    fontFamily: typography.family.bold,
    marginBottom: spacing.sm,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    fontFamily: typography.family.regular,
  },
  formBlur: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.glass3D,
  },
  formGradient: {
    borderRadius: radius.lg,
  },
  form: {
    padding: spacing.xl,
  },
  errorContainer: {
    backgroundColor: 'rgba(255,77,77,0.12)',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.3)',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.size.sm,
    textAlign: 'center',
    fontFamily: typography.family.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dividerText: {
    color: 'rgba(248,250,252,0.5)',
    fontSize: typography.size.sm,
    fontWeight: '600',
    marginHorizontal: spacing.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: '600',
    fontFamily: typography.family.semibold,
  },
  footer: {
    fontSize: typography.size.sm,
    color: 'rgba(248,250,252,0.4)',
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
});
