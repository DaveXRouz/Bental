import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { User, Mail, Phone, Lock, Chrome, Apple as AppleIcon, Shield } from 'lucide-react-native';
import { useBrandImages } from '@/services/media';
import AuthFooter from '@/components/ui/AuthFooter';
import { UnifiedInput } from '@/components/ui/UnifiedInput';
import { UnifiedButton } from '@/components/ui/UnifiedButton';
import {
  QuantumColors,
  QuantumTypography,
  QuantumRadius,
  QuantumSpacing,
  QuantumGlass,
  QuantumElevation,
} from '@/constants/quantum-glass';

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

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

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
    backgroundColor: QuantumColors.deepSpace,
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
    paddingHorizontal: QuantumSpacing[5],
    paddingVertical: QuantumSpacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: QuantumSpacing[5],
    marginTop: QuantumSpacing[4],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: QuantumSpacing[3],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: QuantumTypography.size.h1,
    fontWeight: '700',
    color: QuantumColors.frostWhite,
    fontFamily: QuantumTypography.family.heading,
    marginBottom: QuantumSpacing[2],
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: QuantumTypography.size.body,
    color: QuantumColors.mistWhite,
    fontFamily: QuantumTypography.family.body,
  },
  formBlur: {
    borderRadius: QuantumRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: QuantumGlass.border.inner,
    ...QuantumElevation.E2,
  },
  formGradient: {
    borderRadius: QuantumRadius.lg,
  },
  form: {
    padding: QuantumSpacing[5],
  },
  errorContainer: {
    backgroundColor: 'rgba(255,77,77,0.12)',
    borderRadius: QuantumRadius.sm,
    padding: QuantumSpacing[3],
    marginBottom: QuantumSpacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.3)',
  },
  errorText: {
    color: QuantumColors.danger,
    fontSize: QuantumTypography.size.caption,
    textAlign: 'center',
    fontFamily: QuantumTypography.family.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: QuantumSpacing[4],
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dividerText: {
    color: 'rgba(248,250,252,0.5)',
    fontSize: QuantumTypography.size.small,
    fontWeight: '600',
    marginHorizontal: QuantumSpacing[3],
    letterSpacing: QuantumTypography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: QuantumRadius.md,
    paddingVertical: QuantumSpacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryButtonText: {
    color: QuantumColors.frostWhite,
    fontSize: QuantumTypography.size.caption,
    fontWeight: '600',
    fontFamily: QuantumTypography.family.semibold,
  },
  footer: {
    fontSize: QuantumTypography.size.small,
    color: 'rgba(248,250,252,0.4)',
    textAlign: 'center',
    marginTop: QuantumSpacing[5],
    paddingHorizontal: QuantumSpacing[5],
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: QuantumSpacing[3],
    marginBottom: QuantumSpacing[4],
  },
});
