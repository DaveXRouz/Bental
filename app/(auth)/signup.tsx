import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { User, Mail, Phone, Lock, Chrome, Apple as AppleIcon, Shield } from 'lucide-react-native';
import { colors, Spacing, Typography, radii, shadows } from '@/constants/theme';
import { useBrandImages } from '@/services/media';
import AuthFooter from '@/components/ui/AuthFooter';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const { images } = useBrandImages();

  const clearError = () => {
    setError('');
  };

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    clearError();
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    clearError();
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    clearError();
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    clearError();
  };

  const handleSignUp = async () => {
    clearError();

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, phone);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearError();
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    clearError();
    try {
      const { error } = await signInWithApple();
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: images.hero }}
        style={styles.backgroundImage}
        blurRadius={60}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.96)' as const, 'rgba(0,0,0,0.88)' as const, 'rgba(0,0,0,0.96)' as const]}
        style={styles.overlay}
      />

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
                <View style={styles.inputContainer}>
                  <User size={20} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(248,250,252,0.4)"
                    value={fullName}
                    onChangeText={handleFullNameChange}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Mail size={20} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="rgba(248,250,252,0.4)"
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Phone size={20} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone (optional)"
                    placeholderTextColor="rgba(248,250,252,0.4)"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={20} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(248,250,252,0.4)"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={20} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(248,250,252,0.4)"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry
                  />
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignUp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,1)' as const, 'rgba(235,235,235,1)' as const]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.black} size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Create Account</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtonsRow}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.socialButtonContent}>
                      <Chrome size={20} color="#FFFFFF" />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.socialButtonContent}>
                      <AppleIcon size={20} color="#FFFFFF" />
                      <Text style={styles.socialButtonText}>Apple</Text>
                    </View>
                  </TouchableOpacity>
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
    backgroundColor: colors.black,
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: Typography.size.xxxl,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Typography.family.bold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: Typography.size.md,
    color: colors.textSecondary,
    fontFamily: Typography.family.regular,
  },
  formBlur: {
    borderRadius: radii.modal,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...shadows.glass3D,
  },
  formGradient: {
    borderRadius: radii.modal,
  },
  form: {
    padding: Spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.sm,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.md,
    color: colors.text,
    fontFamily: Typography.family.regular,
  },
  errorContainer: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: radii.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: colors.danger,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    fontFamily: Typography.family.medium,
  },
  button: {
    borderRadius: radii.card,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.black,
    fontSize: Typography.size.md,
    fontWeight: '700',
    fontFamily: Typography.family.bold,
    letterSpacing: 0.4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dividerText: {
    color: 'rgba(248,250,252,0.5)',
    fontSize: Typography.size.xs,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.card,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    fontFamily: Typography.family.semibold,
  },
  footer: {
    fontSize: Typography.size.xs,
    color: 'rgba(248,250,252,0.4)',
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: 14,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.family.semibold,
    letterSpacing: 0.3,
  },
});
