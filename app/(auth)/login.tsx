import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { Mail, Lock, CreditCard, Fingerprint, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { Futuristic3DBackground } from '@/components/backgrounds/Futuristic3DBackground';
import { MinimalLogo } from '@/components/branding/MinimalLogo';
import { GlassmorphicCard } from '@/components/login/GlassmorphicCard';
import { GlassToggleButtons } from '@/components/login/GlassToggleButtons';
import { GlassInput } from '@/components/login/GlassInput';
import { Glass3DButton } from '@/components/login/Glass3DButton';
import { GlassOAuthButton } from '@/components/login/GlassOAuthButton';
import { Shield, WifiOff, AlertTriangle } from 'lucide-react-native';
import { Chrome as GoogleIcon, Apple as AppleIcon } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Tooltip } from '@/components/ui/Tooltip';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { MFAVerificationModal } from '@/components/auth/MFAVerificationModal';
import { useMFA } from '@/hooks/useMFA';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useLoginHistory } from '@/hooks/useLoginHistory';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { MagicLinkModal } from '@/components/auth/MagicLinkModal';

type LoginMode = 'email' | 'passport';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { width, isMobile, spacing: responsiveSpacing, fontSize: responsiveFontSize } = useResponsive();
  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [tradingPassport, setTradingPassport] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passportError, setPassportError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, passport: false, password: false });
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showHelpBanner, setShowHelpBanner] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingMFAEmail, setPendingMFAEmail] = useState('');
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);

  const biometric = useBiometricAuth();
  const mfa = useMFA();
  const rateLimit = useRateLimit(loginMode === 'email' ? email : null);
  const loginHistory = useLoginHistory();
  const sessionManagement = useSessionManagement();

  useEffect(() => {
    const loadRememberMe = async () => {
      const value = await AsyncStorage.getItem('rememberMe');
      setRememberMe(value === 'true');
    };
    loadRememberMe();

    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  // Load biometric credentials if available
  useEffect(() => {
    const loadBiometricCreds = async () => {
      if (biometric.capabilities.isAvailable) {
        const creds = await biometric.getStoredCredentials();
        if (creds?.email) {
          setEmail(creds.email);
        }
      }
    };
    loadBiometricCreds();
  }, [biometric.capabilities.isAvailable]);

  useFocusEffect(
    useCallback(() => {
      // Only clear email if Remember Me is off
      if (!rememberMe) {
        setEmail('');
      }
      setTradingPassport('');
      setPassword('');
      setEmailError('');
      setPassportError('');
      setPasswordError('');
      setTouched({ email: false, passport: false, password: false });
      setLoading(false);
    }, [rememberMe])
  );

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassport = (passport: string): boolean => {
    return passport.length >= 6;
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleBlur = (field: 'email' | 'passport' | 'password') => {
    setTouched({ ...touched, [field]: true });

    if (field === 'email' && loginMode === 'email') {
      if (!email) {
        setEmailError('Email is required');
      } else if (!validateEmail(email)) {
        setEmailError('Please enter a valid email');
      } else {
        setEmailError('');
      }
    }

    if (field === 'passport' && loginMode === 'passport') {
      if (!tradingPassport) {
        setPassportError('Trading Passport is required');
      } else if (!validatePassport(tradingPassport)) {
        setPassportError('Please enter a valid Trading Passport');
      } else {
        setPassportError('');
      }
    }

    if (field === 'password') {
      if (!password) {
        setPasswordError('Password is required');
      } else if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleBiometricSignIn = async () => {
    if (!biometric.capabilities.isAvailable) return;

    setLoading(true);
    setLoadingMessage('Authenticating...');

    const result = await biometric.authenticate();

    if (result.success) {
      const creds = await biometric.getStoredCredentials();
      if (creds?.email && creds?.encryptedPassword) {
        setEmail(creds.email);
        setPassword(creds.encryptedPassword);
        await handleSignIn();
      }
    } else {
      setLoading(false);
      setLoadingMessage('');
      if (result.error !== 'Cancelled by user') {
        setPasswordError(result.error || 'Biometric authentication failed');
      }
    }
  };

  const handleSignIn = async () => {
    setTouched({ email: true, passport: true, password: true });

    let hasErrors = false;

    if (loginMode === 'email') {
      if (!email) {
        setEmailError('Email is required');
        hasErrors = true;
      } else if (!validateEmail(email)) {
        setEmailError('Please enter a valid email');
        hasErrors = true;
      }
    } else {
      if (!tradingPassport) {
        setPassportError('Trading Passport is required');
        hasErrors = true;
      } else if (!validatePassport(tradingPassport)) {
        setPassportError('Please enter a valid Trading Passport');
        hasErrors = true;
      }
    }

    if (!password) {
      setPasswordError('Password is required');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (hasErrors) return;

    // Check online status
    if (!isOnline) {
      setPasswordError('No internet connection. Please check your network.');
      return;
    }

    // Check rate limiting
    if (rateLimit.isLocked) {
      setPasswordError(`Too many attempts. Try again in ${rateLimit.formatCountdown()}`);
      return;
    }

    setLoading(true);
    setLoadingMessage('Verifying credentials...');

    try {
      await AsyncStorage.setItem('rememberMe', rememberMe.toString());

      let loginEmail = email;

      if (loginMode === 'passport') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('trading_passport_number', tradingPassport)
          .maybeSingle();

        if (!profile?.email) {
          setPassportError('Invalid Trading Passport');
          setLoading(false);
          return;
        }

        loginEmail = profile.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      // Record login attempt
      await rateLimit.recordAttempt(!error, error?.message);

      if (error) {
        console.error('Login error:', error);
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // Show help banner after 3 failed attempts
        if (newAttempts >= 3) {
          setShowHelpBanner(true);
        }

        // Haptic feedback on error
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        if (error.message.includes('Invalid login credentials')) {
          if (loginMode === 'email') {
            setEmailError('Email not found or incorrect password');
            setPasswordError('Please check your credentials');
          } else {
            setPassportError('Invalid Trading Passport or password');
            setPasswordError('Please check your credentials');
          }
        } else if (error.message.includes('Email not confirmed')) {
          setEmailError('Please verify your email address');
        } else {
          setPasswordError('An error occurred. Please try again.');
        }
        setLoading(false);
        setLoadingMessage('');
        return;
      }

      if (data?.user) {
        setLoadingMessage('Loading profile...');

        // Record successful login
        await loginHistory.recordLogin(true);

        // Create/update session
        await sessionManagement.createSession(rememberMe);

        // Check if MFA is enabled for this user
        const { data: mfaData } = await supabase
          .from('mfa_secrets')
          .select('enabled, method')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (mfaData?.enabled) {
          // Show MFA verification modal
          setPendingMFAEmail(loginEmail);
          setShowMFAModal(true);
          setLoading(false);
          setLoadingMessage('');
          return;
        }

        // Save biometric credentials if enabled
        if (biometric.capabilities.isAvailable && rememberMe) {
          await biometric.saveCredentials(loginEmail, password);
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        setLoadingMessage('Redirecting...');

        // Haptic success feedback
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (profile?.role === 'admin') {
          router.replace('/admin-panel');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      setPasswordError('An error occurred. Please try again.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleMFAVerify = async (code: string) => {
    const result = await mfa.verifyMFACode(code);

    if (result.success) {
      // Complete login after successful MFA
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (profile?.role === 'admin') {
          router.replace('/admin-panel');
        } else {
          router.replace('/(tabs)');
        }
      }
    }

    return result;
  };

  const isFormValid =
    (loginMode === 'email' ? email && validateEmail(email) : tradingPassport && validatePassport(tradingPassport)) &&
    password &&
    password.length >= 6 &&
    !emailError &&
    !passwordError &&
    !passportError &&
    !rateLimit.isLocked;

  const styles = React.useMemo(() => createResponsiveStyles(width, isMobile, responsiveSpacing, responsiveFontSize), [width, isMobile, responsiveSpacing, responsiveFontSize]);

  const logoSize = width < 375 ? 48 : width < 390 ? 56 : 64;
  const oauthIconSize = width < 375 ? 18 : 20;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Futuristic3DBackground />

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => Keyboard.dismiss()}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Offline Banner */}
            {!isOnline && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                exiting={FadeOut.duration(200)}
                style={styles.offlineBanner}
              >
                <View style={{ marginRight: spacing.sm }}>
                  <WifiOff size={16} color="#FFF" />
                </View>
                <Text style={styles.offlineBannerText}>No internet connection</Text>
              </Animated.View>
            )}

            {/* Help Banner after 3 failed attempts */}
            {showHelpBanner && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={styles.helpBanner}
              >
                <View style={{ marginRight: spacing.sm }}>
                  <AlertTriangle size={18} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpBannerText}>Having trouble signing in?</Text>
                  <View style={styles.helpLinks}>
                    <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                      <Text style={styles.helpLink}>Reset Password</Text>
                    </TouchableOpacity>
                    <Text style={styles.helpSeparator}>•</Text>
                    <TouchableOpacity>
                      <Text style={styles.helpLink}>Contact Support</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowHelpBanner(false)}
                  style={styles.helpClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.helpCloseText}>✕</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <View style={styles.content}>
            <Animated.View
              entering={FadeIn.duration(800).delay(300)}
              style={styles.logoContainer}
            >
              <MinimalLogo size={logoSize} />
            </Animated.View>

            <Animated.Text
              entering={FadeIn.duration(600).delay(500)}
              style={styles.title}
            >
              Welcome back
            </Animated.Text>

            <GlassmorphicCard>
              <View style={styles.toggleContainer}>
                <GlassToggleButtons
                  options={['Email', 'Trading Passport']}
                  selected={loginMode === 'email' ? 0 : 1}
                  onSelect={(index) => {
                    setLoginMode(index === 0 ? 'email' : 'passport');
                    setEmail('');
                    setTradingPassport('');
                    setPassword('');
                    setEmailError('');
                    setPassportError('');
                    setPasswordError('');
                    setTouched({ email: false, passport: false, password: false });
                  }}
                />
              </View>

              <Animated.View
                key={loginMode}
                entering={FadeIn.duration(500)}
                style={{ width: '100%' }}
              >
                {loginMode === 'email' ? (
                  <GlassInput
                    label="Email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (touched.email) {
                        setEmailError('');
                      }
                      setPasswordError('');
                    }}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    autoComplete="email"
                    error={emailError}
                    onBlur={() => handleBlur('email')}
                    icon={<Mail size={18} color="rgba(255, 255, 255, 0.5)" />}
                    showSuccess={touched.email}
                    onValidate={validateEmail}
                  />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <GlassInput
                        label="Trading Passport"
                        value={tradingPassport}
                        onChangeText={(text) => {
                          setTradingPassport(text);
                          if (touched.passport) {
                            setPassportError('');
                          }
                          setPasswordError('');
                        }}
                        placeholder="Enter your Trading Passport"
                        autoCapitalize="none"
                        autoCorrect={false}
                        error={passportError}
                        onBlur={() => handleBlur('passport')}
                        icon={<CreditCard size={18} color="rgba(255, 255, 255, 0.5)" />}
                        showSuccess={touched.passport}
                        onValidate={validatePassport}
                      />
                    </View>
                    <View style={{ marginBottom: passportError ? 34 : 12 }}>
                      <Tooltip content="Your Trading Passport is a unique 6+ character identifier that you can use instead of your email address to sign in. It's displayed in your profile settings." />
                    </View>
                  </View>
                )}
              </Animated.View>

              <GlassInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (touched.password) {
                    setPasswordError('');
                  }
                  if (loginMode === 'email') {
                    setEmailError('');
                  } else {
                    setPassportError('');
                  }
                }}
                placeholder="Enter your password"
                autoComplete="password"
                error={passwordError}
                onBlur={() => handleBlur('password')}
                icon={<Lock size={18} color="rgba(255, 255, 255, 0.5)" />}
                isPassword
                showSuccess={touched.password}
                onValidate={validatePassword}
              />

              {/* Biometric Auth Button */}
              {biometric.capabilities.isAvailable && email && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={styles.biometricButton}
                >
                  <TouchableOpacity
                    onPress={handleBiometricSignIn}
                    style={styles.biometricTouchable}
                    accessibilityLabel={`Sign in with ${biometric.capabilities.biometricType}`}
                    accessibilityRole="button"
                  >
                    <View style={{ marginRight: spacing.sm }}>
                      <Fingerprint size={20} color="rgba(255, 255, 255, 0.7)" />
                    </View>
                    <Text style={styles.biometricText}>Use {biometric.capabilities.biometricType}</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              <View style={styles.rememberRow}>
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  style={styles.rememberContainer}
                  accessibilityLabel="Remember me"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && (
                      <Check size={12} color="rgba(255, 255, 255, 0.95)" strokeWidth={3} />
                    )}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  accessibilityLabel="Forgot password"
                  accessibilityRole="button"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>

            </GlassmorphicCard>

            <View style={styles.actionSection}>
              {/* Rate Limit Warning */}
              {rateLimit.isLocked && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={styles.rateLimitBanner}
                >
                  <View style={{ marginRight: spacing.sm }}>
                    <AlertTriangle size={18} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rateLimitText}>
                      Too many failed attempts
                    </Text>
                    <Text style={styles.rateLimitCountdown}>
                      Try again in {rateLimit.formatCountdown()}
                    </Text>
                  </View>
                </Animated.View>
              )}

              <Glass3DButton
                title={loading && loadingMessage ? loadingMessage : 'Sign In'}
                onPress={handleSignIn}
                disabled={!isFormValid || loading || !isOnline}
                loading={loading}
              />

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setShowMagicLinkModal(true)}
                style={styles.magicLinkButton}
              >
                <Text style={styles.magicLinkText}>Or sign in with magic link</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.oauthSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.oauthContainer}>
                <GlassOAuthButton
                  onPress={() => {}}
                  icon={<GoogleIcon size={oauthIconSize} color="rgba(255, 255, 255, 0.75)" />}
                  label="Google"
                />
                <GlassOAuthButton
                  onPress={() => {}}
                  icon={<AppleIcon size={oauthIconSize} color="rgba(255, 255, 255, 0.75)" />}
                  label="Apple"
                />
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.securityBadge}>
                <Shield size={12} color="rgba(255, 255, 255, 0.25)" strokeWidth={2} />
                <Text style={styles.securityText}>256-bit SSL Encrypted</Text>
              </View>
              <View style={styles.footerLinks}>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.footerLink}>Privacy</Text>
                </TouchableOpacity>
                <Text style={styles.footerSeparator}>•</Text>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.footerLink}>Terms</Text>
                </TouchableOpacity>
                <Text style={styles.footerSeparator}>•</Text>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.footerLink}>Contact</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.copyright}>© 2025 Trading Platform. All rights reserved.</Text>
            </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* MFA Verification Modal */}
      <MFAVerificationModal
        visible={showMFAModal}
        onClose={() => {
          setShowMFAModal(false);
          setLoading(false);
          setLoadingMessage('');
        }}
        onVerify={handleMFAVerify}
        method="totp"
      />

      {/* Magic Link Modal */}
      <MagicLinkModal
        visible={showMagicLinkModal}
        onClose={() => setShowMagicLinkModal(false)}
        onSuccess={() => {
          // Modal will stay open to show success message
        }}
      />
    </SafeAreaView>
  );
}

const createResponsiveStyles = (
  width: number,
  isMobile: boolean,
  responsiveSpacing: (base: number) => number,
  responsiveFontSize: (base: number) => number
) => {
  const scale = Math.min(width / 390, 1);
  const isSmallDevice = width < 375;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#000000',
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: isSmallDevice ? spacing.sm : spacing.md,
      paddingVertical: isSmallDevice ? spacing.md : spacing.lg,
      minHeight: '100%',
    },
    content: {
      width: '100%',
      maxWidth: isMobile ? width - (isSmallDevice ? spacing.xxxl : spacing.xxxxl + spacing.sm) : 440,
      alignSelf: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      marginBottom: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: isSmallDevice ? 22 : isMobile ? 24 : 28,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.98)',
      marginBottom: isSmallDevice ? spacing.md : spacing.lg,
      textAlign: 'center',
      letterSpacing: -0.5,
      lineHeight: isSmallDevice ? 26 : isMobile ? 29 : 34,
    },
    toggleContainer: {
      marginBottom: isSmallDevice ? spacing.sm : spacing.md,
    },
    rememberRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isSmallDevice ? spacing.sm : spacing.md,
      marginTop: spacing.xxs,
    },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: spacing.sm,
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(200, 200, 200, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  rememberText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  forgotText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: 'rgba(200, 200, 200, 0.9)',
  },
    actionSection: {
      width: '100%',
      marginTop: isSmallDevice ? spacing.md : spacing.lg,
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    signupText: {
      fontSize: isSmallDevice ? 13 : 14,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.55)',
    },
    signupLink: {
      fontSize: isSmallDevice ? 13 : 14,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.95)',
      textDecorationLine: 'underline',
    },
    oauthSection: {
      width: '100%',
      marginTop: spacing.xs,
      marginBottom: isSmallDevice ? spacing.md : spacing.lg,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isSmallDevice ? spacing.sm : spacing.md,
    },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(200, 200, 200, 0.12)',
  },
    dividerText: {
      fontSize: isSmallDevice ? 10 : typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: isSmallDevice ? spacing.sm : spacing.md,
      letterSpacing: 0.5,
    },
    oauthContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footer: {
      alignItems: 'center',
      marginTop: isSmallDevice ? spacing.sm : spacing.md,
      paddingTop: isSmallDevice ? spacing.sm : spacing.md,
    },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
    securityText: {
      fontSize: isSmallDevice ? 9 : 10,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.25)',
      letterSpacing: 0.2,
    },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
    footerLink: {
      fontSize: isSmallDevice ? 10 : 11,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.5)',
      letterSpacing: 0.3,
    },
  footerSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
  },
    copyright: {
      fontSize: isSmallDevice ? 10 : 11,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.4)',
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.9)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      marginBottom: spacing.md,
      marginHorizontal: spacing.md,
    },
    offlineBannerText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: '#FFF',
    },
    helpBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 12,
      marginBottom: spacing.lg,
      marginHorizontal: spacing.md,
    },
    helpBannerText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 4,
    },
    helpLinks: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    helpLink: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.semibold,
      color: '#F59E0B',
      textDecorationLine: 'underline',
    },
    helpSeparator: {
      fontSize: typography.size.xs,
      color: 'rgba(255, 255, 255, 0.4)',
    },
    helpClose: {
      padding: 4,
    },
    helpCloseText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    biometricButton: {
      marginBottom: spacing.md,
    },
    biometricTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      backgroundColor: 'rgba(200, 200, 200, 0.1)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    biometricText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    rateLimitBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 12,
      marginBottom: spacing.md,
    },
    rateLimitText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 2,
    },
    rateLimitCountdown: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      color: '#F59E0B',
    },
    magicLinkButton: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    magicLinkText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: 'rgba(200, 200, 200, 0.9)',
      textDecorationLine: 'underline',
    },
  });
};
