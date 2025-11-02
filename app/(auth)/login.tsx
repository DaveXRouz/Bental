import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  AccessibilityInfo,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Mail, Lock, Eye, EyeOff, Chrome, Apple as AppleIcon, Shield } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import AuthFooter from '@/components/ui/AuthFooter';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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

  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const rotation3 = useSharedValue(0);
  const floatY1 = useSharedValue(0);
  const floatY2 = useSharedValue(0);
  const floatY3 = useSharedValue(0);
  const floatX1 = useSharedValue(0);
  const floatX2 = useSharedValue(0);
  const floatX3 = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.6);
  const opacity2 = useSharedValue(0.5);
  const opacity3 = useSharedValue(0.4);
  const logoRotate = useSharedValue(0);
  const logoScale = useSharedValue(1);

  useEffect(() => {
    loadRememberedEmail();
    checkReducedMotion();
    startAnimations();
  }, []);

  const checkReducedMotion = async () => {
    if (Platform.OS !== 'web') {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(isReduceMotionEnabled);
    }
  };

  const startAnimations = () => {
    const smoothEasing = Easing.bezier(0.4, 0.0, 0.2, 1);
    const gentleEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
    const ultraSmoothEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

    rotation1.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1,
      false
    );

    rotation2.value = withRepeat(
      withTiming(-360, { duration: 50000, easing: Easing.linear }),
      -1,
      false
    );

    rotation3.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );

    floatY1.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 8000, easing: gentleEasing }),
        withTiming(-30, { duration: 8000, easing: gentleEasing })
      ),
      -1,
      false
    );

    floatY2.value = withRepeat(
      withSequence(
        withTiming(-35, { duration: 9000, easing: gentleEasing }),
        withTiming(35, { duration: 9000, easing: gentleEasing })
      ),
      -1,
      false
    );

    floatY3.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 8500, easing: gentleEasing }),
        withTiming(-25, { duration: 8500, easing: gentleEasing })
      ),
      -1,
      false
    );

    floatX1.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 7000, easing: gentleEasing }),
        withTiming(-15, { duration: 7000, easing: gentleEasing })
      ),
      -1,
      false
    );

    floatX2.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 8000, easing: gentleEasing }),
        withTiming(20, { duration: 8000, easing: gentleEasing })
      ),
      -1,
      false
    );

    floatX3.value = withRepeat(
      withSequence(
        withTiming(18, { duration: 7500, easing: gentleEasing }),
        withTiming(-18, { duration: 7500, easing: gentleEasing })
      ),
      -1,
      false
    );

    scale1.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 6000, easing: ultraSmoothEasing }),
        withTiming(0.95, { duration: 6000, easing: ultraSmoothEasing })
      ),
      -1,
      false
    );

    scale2.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 7000, easing: ultraSmoothEasing }),
        withTiming(1.1, { duration: 7000, easing: ultraSmoothEasing })
      ),
      -1,
      false
    );

    scale3.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 6500, easing: ultraSmoothEasing }),
        withTiming(0.92, { duration: 6500, easing: ultraSmoothEasing })
      ),
      -1,
      false
    );

    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 5000, easing: gentleEasing }),
        withTiming(0.4, { duration: 5000, easing: gentleEasing })
      ),
      -1,
      false
    );

    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 6000, easing: gentleEasing }),
        withTiming(0.3, { duration: 6000, easing: gentleEasing })
      ),
      -1,
      false
    );

    opacity3.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 5500, easing: gentleEasing }),
        withTiming(0.35, { duration: 5500, easing: gentleEasing })
      ),
      -1,
      false
    );

    logoRotate.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 4000, easing: smoothEasing }),
        withTiming(-5, { duration: 4000, easing: smoothEasing }),
        withTiming(0, { duration: 4000, easing: smoothEasing })
      ),
      -1,
      false
    );

    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 4000, easing: smoothEasing }),
        withTiming(1, { duration: 4000, easing: smoothEasing })
      ),
      -1,
      false
    );
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

  const shape1Style = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0.3 };
    return {
      opacity: opacity1.value,
      transform: [
        { translateX: floatX1.value },
        { translateY: floatY1.value },
        { scale: scale1.value },
        { rotate: `${rotation1.value}deg` },
        { perspective: 1000 },
        { rotateX: `${interpolate(floatY1.value, [-30, 30], [-12, 12])}deg` },
        { rotateY: `${interpolate(floatX1.value, [-15, 15], [-8, 8])}deg` },
      ],
    };
  });

  const shape2Style = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0.3 };
    return {
      opacity: opacity2.value,
      transform: [
        { translateX: floatX2.value },
        { translateY: floatY2.value },
        { scale: scale2.value },
        { rotate: `${rotation2.value}deg` },
        { perspective: 1000 },
        { rotateY: `${interpolate(floatY2.value, [-35, 35], [-15, 15])}deg` },
        { rotateX: `${interpolate(floatX2.value, [-20, 20], [-10, 10])}deg` },
      ],
    };
  });

  const shape3Style = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0.3 };
    return {
      opacity: opacity3.value,
      transform: [
        { translateX: floatX3.value },
        { translateY: floatY3.value },
        { scale: scale3.value },
        { rotate: `${rotation3.value}deg` },
        { perspective: 1000 },
        { rotateX: `${interpolate(floatY3.value, [-25, 25], [-10, 10])}deg` },
        { rotateY: `${interpolate(floatX3.value, [-18, 18], [-12, 12])}deg` },
      ],
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [
        { rotate: `${logoRotate.value}deg` },
        { scale: logoScale.value },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.backgroundShapes}>
        <Animated.View style={[styles.shape1, shape1Style]} />
        <Animated.View style={[styles.shape2, shape2Style]} />
        <Animated.View style={[styles.shape3, shape3Style]} />
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0.97)', 'rgba(0,0,0,0.92)', 'rgba(0,0,0,0.97)']}
        style={styles.overlay}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <Shield size={56} color="#FFFFFF" strokeWidth={2.5} />
            </Animated.View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <Animated.View style={styles.formContainer}>
          <BlurView intensity={24} tint="dark" style={styles.formBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formGradient}
            >
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#BDBDBD" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="rgba(248,250,252,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={20} color="#BDBDBD" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(248,250,252,0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={toggleShowPassword}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#BDBDBD" />
                    ) : (
                      <Eye size={18} color="#BDBDBD" />
                    )}
                  </TouchableOpacity>
                </View>

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

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,1)', 'rgba(235,235,235,1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#000000" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
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
              </View>
            </LinearGradient>
          </BlurView>
          </Animated.View>
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
                        We've sent a password reset link to {resetEmail}. Please check your email and follow the instructions.
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

                      <View style={styles.modalInputContainer}>
                        <Mail size={20} color="#BDBDBD" style={styles.inputIcon} />
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Email address"
                          placeholderTextColor="rgba(248,250,252,0.4)"
                          value={resetEmail}
                          onChangeText={setResetEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          editable={!resetLoading}
                        />
                      </View>

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
    backgroundColor: '#000000',
  },
  backgroundShapes: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: '#0B6E4F',
    top: -width * 0.6,
    right: -width * 0.4,
  },
  shape2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: '#08503B',
    bottom: -width * 0.5,
    left: -width * 0.3,
  },
  shape3: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: '#0D8A62',
    top: height * 0.45,
    right: -width * 0.2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#0B6E4F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(248,250,252,0.7)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  formBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  formGradient: {
    borderRadius: 24,
  },
  form: {
    padding: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 58,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
  },
  eyeIcon: {
    padding: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0B6E4F',
    borderColor: '#0B6E4F',
  },
  checkmark: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  checkboxLabel: {
    color: 'rgba(248,250,252,0.8)',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  signupLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: 'rgba(248,250,252,0.6)',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dividerText: {
    color: 'rgba(248,250,252,0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 16,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardView: {
    width: '100%',
    maxWidth: 400,
  },
  modalContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalGradient: {
    borderRadius: 20,
  },
  modalContent: {
    padding: 28,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: 'rgba(248,250,252,0.7)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
  },
  modalErrorContainer: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  modalErrorText: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalButtonSecondaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
