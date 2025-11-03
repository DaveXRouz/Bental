import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  AccessibilityInfo,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Mail, Lock, Eye, EyeOff, Chrome, Apple as AppleIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import AuthFooter from '@/components/ui/AuthFooter';
import { Silk3DBackground } from '@/components/quantum/Silk3DBackground';
import { QuantumInput } from '@/components/quantum/QuantumInput';
import { PlasmaCapsule } from '@/components/quantum/PlasmaCapsule';
import {
  QuantumColors,
  QuantumTypography,
  QuantumRadius,
  QuantumSpacing,
  QuantumGlass,
  QuantumElevation,
} from '@/constants/quantum-glass';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const { returnUrl } = useLocalSearchParams<{ returnUrl?: string }>();

  useEffect(() => {
    loadRememberedEmail();
    checkReducedMotion();
  }, []);

  const checkReducedMotion = async () => {
    if (Platform.OS !== 'web') {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(isReduceMotionEnabled);
    }
  };

  const loadRememberedEmail = async () => {
    try {
      const remembered = await AsyncStorage.getItem('rememberMe');
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      if (remembered === 'true' && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('savedEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberMe');
        await AsyncStorage.removeItem('savedEmail');
      }

      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        setLoading(false);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        if (returnUrl) {
          router.replace(returnUrl as any);
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
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
    setError('');
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

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess(true);
      }
    } catch (err) {
      setResetError('An error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      <Silk3DBackground reduceMotion={reduceMotion} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>I know,{'\n'}something else.</Text>
            <Text style={styles.subtitle}>Enter your realm</Text>
          </View>

          <View style={styles.formContainer}>
            <BlurView intensity={QuantumGlass.blur.card} tint="dark" style={styles.formBlur}>
              <LinearGradient
                colors={[QuantumGlass.fill.gradient.top, QuantumGlass.fill.gradient.bottom]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.formGradient}
              >
                <View style={styles.form}>
                  <QuantumInput
                    icon={<Mail size={20} color={QuantumColors.mistWhite} strokeWidth={1.5} />}
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />

                  <QuantumInput
                    icon={<Lock size={20} color={QuantumColors.mistWhite} strokeWidth={1.5} />}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    rightIcon={
                      showPassword ? (
                        <EyeOff size={18} color={QuantumColors.mistWhite} />
                      ) : (
                        <Eye size={18} color={QuantumColors.mistWhite} />
                      )
                    }
                    onRightIconPress={toggleShowPassword}
                  />

                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setRememberMe(!rememberMe)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                        {rememberMe && <View style={styles.checkmark} />}
                      </View>
                      <Text style={styles.checkboxLabel}>Remember</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => router.push('/(auth)/signup')}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <Text style={styles.signupLink}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowForgotPassword(true)}
                    activeOpacity={0.7}
                    disabled={loading}
                    style={styles.forgotPasswordButton}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                  </TouchableOpacity>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <PlasmaCapsule
                    title="Sign In"
                    onPress={handleLogin}
                    disabled={loading}
                    loading={loading}
                  />

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
                      <BlurView intensity={18} tint="dark" style={styles.socialBlur}>
                        <View style={styles.socialButtonContent}>
                          <Chrome size={20} color="#FFFFFF" />
                          <Text style={styles.socialButtonText}>Google</Text>
                        </View>
                      </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={handleAppleSignIn}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <BlurView intensity={18} tint="dark" style={styles.socialBlur}>
                        <View style={styles.socialButtonContent}>
                          <AppleIcon size={20} color="#FFFFFF" />
                          <Text style={styles.socialButtonText}>Apple</Text>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={closeForgotPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <BlurView intensity={20} tint="dark" style={styles.modalContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalGradient}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {resetSuccess ? 'Check Your Email' : 'Reset Password'}
                  </Text>

                  {resetSuccess ? (
                    <>
                      <Text style={styles.modalDescription}>
                        We've sent a password reset link to {resetEmail}. Please check your email
                        and follow the instructions.
                      </Text>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={closeForgotPasswordModal}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.modalButtonText}>Done</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.modalDescription}>
                        Enter your email address and we'll send you a link to reset your password.
                      </Text>

                      <QuantumInput
                        icon={<Mail size={20} color={QuantumColors.mistWhite} strokeWidth={1.5} />}
                        placeholder="Email address"
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!resetLoading}
                      />

                      {resetError ? (
                        <View style={styles.modalErrorContainer}>
                          <Text style={styles.modalErrorText}>{resetError}</Text>
                        </View>
                      ) : null}

                      <View style={styles.modalButtonsRow}>
                        <TouchableOpacity
                          style={styles.modalButtonSecondary}
                          onPress={closeForgotPasswordModal}
                          activeOpacity={0.85}
                          disabled={resetLoading}
                        >
                          <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.modalButton, resetLoading && styles.buttonDisabled]}
                          onPress={handleForgotPassword}
                          activeOpacity={0.85}
                          disabled={resetLoading}
                        >
                          {resetLoading ? (
                            <ActivityIndicator color="#000000" size="small" />
                          ) : (
                            <Text style={styles.modalButtonText}>Send Reset Link</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </LinearGradient>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <AuthFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QuantumColors.deepSpace,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Platform.select({ web: QuantumSpacing[6], default: QuantumSpacing[5] }),
    paddingVertical: QuantumSpacing[6],
    maxWidth: Platform.select({ web: 1200, default: '100%' }),
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: QuantumSpacing[6],
  },
  title: {
    fontSize: Platform.select({ web: 42, default: QuantumTypography.size.h1 }),
    fontWeight: '700',
    color: QuantumColors.frostWhite,
    fontFamily: QuantumTypography.family.heading,
    marginBottom: QuantumSpacing[3],
    letterSpacing: -1.2,
    textAlign: 'center',
    lineHeight: Platform.select({ web: 52, default: 46 }),
  },
  subtitle: {
    fontSize: Platform.select({ web: 18, default: QuantumTypography.size.body }),
    color: QuantumColors.mistWhite,
    fontFamily: QuantumTypography.family.body,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
    maxWidth: Platform.select({ web: 460, default: 420 }),
    alignSelf: 'center',
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: QuantumSpacing[3],
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: QuantumSpacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: QuantumColors.ionTeal,
    borderColor: QuantumColors.ionTeal,
  },
  checkmark: {
    width: 10,
    height: 10,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  checkboxLabel: {
    color: QuantumColors.mistWhite,
    fontSize: QuantumTypography.size.caption,
    fontFamily: QuantumTypography.family.medium,
  },
  signupLink: {
    color: QuantumColors.frostWhite,
    fontSize: QuantumTypography.size.caption,
    fontWeight: '600',
    fontFamily: QuantumTypography.family.semibold,
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginBottom: QuantumSpacing[4],
  },
  forgotPasswordText: {
    color: QuantumColors.mistWhite,
    fontSize: QuantumTypography.size.caption,
    fontFamily: QuantumTypography.family.medium,
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
    marginBottom: QuantumSpacing[4],
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
  socialButtonsRow: {
    flexDirection: 'row',
    gap: QuantumSpacing[3],
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: QuantumRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  socialBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: QuantumTypography.size.caption,
    fontWeight: '600',
    fontFamily: QuantumTypography.family.semibold,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: QuantumSpacing[4],
  },
  modalKeyboardView: {
    width: '100%',
    maxWidth: 400,
  },
  modalContainer: {
    borderRadius: QuantumRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalGradient: {
    borderRadius: QuantumRadius.lg,
  },
  modalContent: {
    padding: QuantumSpacing[5],
  },
  modalTitle: {
    fontSize: QuantumTypography.size.h2,
    fontWeight: '700',
    color: QuantumColors.frostWhite,
    fontFamily: QuantumTypography.family.heading,
    marginBottom: QuantumSpacing[3],
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: QuantumTypography.size.caption,
    color: QuantumColors.mistWhite,
    fontFamily: QuantumTypography.family.body,
    textAlign: 'center',
    marginBottom: QuantumSpacing[5],
    lineHeight: 20,
  },
  modalErrorContainer: {
    backgroundColor: 'rgba(255,77,77,0.12)',
    borderRadius: QuantumRadius.sm,
    padding: QuantumSpacing[3],
    marginBottom: QuantumSpacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.3)',
  },
  modalErrorText: {
    color: QuantumColors.danger,
    fontSize: QuantumTypography.size.caption,
    textAlign: 'center',
    fontFamily: QuantumTypography.family.medium,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: QuantumSpacing[3],
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: QuantumRadius.sm,
    paddingVertical: QuantumSpacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#000000',
    fontSize: QuantumTypography.size.body,
    fontWeight: '600',
    fontFamily: QuantumTypography.family.semibold,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: QuantumRadius.sm,
    paddingVertical: QuantumSpacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 48,
  },
  modalButtonSecondaryText: {
    color: '#FFFFFF',
    fontSize: QuantumTypography.size.body,
    fontWeight: '600',
    fontFamily: QuantumTypography.family.semibold,
  },
});
