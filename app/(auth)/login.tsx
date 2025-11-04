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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Mail, Lock, CreditCard } from 'lucide-react-native';
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
import { Shield } from 'lucide-react-native';
import { Chrome as GoogleIcon, Apple as AppleIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type LoginMode = 'email' | 'passport';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { width, isMobile, spacing: responsiveSpacing, fontSize: responsiveFontSize } = useResponsive();
  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [tradingPassport, setTradingPassport] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passportError, setPassportError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, passport: false, password: false });

  useEffect(() => {
    const loadRememberMe = async () => {
      const value = await AsyncStorage.getItem('rememberMe');
      setRememberMe(value === 'true');
    };
    loadRememberMe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setEmail('');
      setTradingPassport('');
      setPassword('');
      setEmailError('');
      setPassportError('');
      setPasswordError('');
      setTouched({ email: false, passport: false, password: false });
      setLoading(false);
    }, [])
  );

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassport = (passport: string): boolean => {
    return passport.length >= 6;
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

    setLoading(true);

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

      if (error) {
        console.error('Login error:', error);
        if (loginMode === 'email') {
          setEmailError('Invalid email or password');
          setPasswordError('Invalid email or password');
        } else {
          setPassportError('Invalid Trading Passport or password');
          setPasswordError('Invalid Trading Passport or password');
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile?.role === 'admin') {
          router.replace('/admin-panel');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    (loginMode === 'email' ? email && validateEmail(email) : tradingPassport && validatePassport(tradingPassport)) &&
    password &&
    password.length >= 6;

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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                      setEmailError('');
                      setPasswordError('');
                    }}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    error={emailError}
                    onBlur={() => handleBlur('email')}
                    icon={<Mail size={18} color="rgba(255, 255, 255, 0.5)" />}
                  />
                ) : (
                  <GlassInput
                    label="Trading Passport"
                    value={tradingPassport}
                    onChangeText={(text) => {
                      setTradingPassport(text);
                      setPassportError('');
                      setPasswordError('');
                    }}
                    placeholder="Enter your Trading Passport"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={passportError}
                    onBlur={() => handleBlur('passport')}
                    icon={<CreditCard size={18} color="rgba(255, 255, 255, 0.5)" />}
                  />
                )}
              </Animated.View>

              <GlassInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                  if (loginMode === 'email') {
                    setEmailError('');
                  } else {
                    setPassportError('');
                  }
                }}
                placeholder="Enter your password"
                error={passwordError}
                onBlur={() => handleBlur('password')}
                icon={<Lock size={18} color="rgba(255, 255, 255, 0.5)" />}
                isPassword
              />

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
                      <View style={styles.checkmark} />
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
              <Glass3DButton
                title="Sign In"
                onPress={handleSignIn}
                disabled={!isFormValid || loading}
                loading={loading}
              />

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.oauthSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
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
                <Text style={styles.footerSeparator}> · </Text>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.footerLink}>Terms</Text>
                </TouchableOpacity>
                <Text style={styles.footerSeparator}> · </Text>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.footerLink}>Contact</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.copyright}>© 2025 Trading Platform. All rights reserved.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
      maxWidth: isMobile ? width - (isSmallDevice ? 32 : 48) : 440,
      alignSelf: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      marginBottom: isSmallDevice ? spacing.sm : spacing.md,
      alignItems: 'center',
    },
    title: {
      fontSize: isSmallDevice ? 22 : isMobile ? 24 : 28,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.98)',
      marginBottom: isSmallDevice ? spacing.md : spacing.lg,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    toggleContainer: {
      marginBottom: isSmallDevice ? spacing.sm : spacing.md,
    },
    rememberRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isSmallDevice ? spacing.sm : spacing.md,
      marginTop: 2,
    },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
      marginBottom: isSmallDevice ? spacing.md : spacing.lg,
      gap: isSmallDevice ? spacing.sm : spacing.md,
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs + 2,
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
      fontSize: isSmallDevice ? 10 : typography.size.xs,
      fontWeight: typography.weight.semibold,
      color: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: isSmallDevice ? spacing.sm : spacing.md + 2,
      letterSpacing: 0.5,
    },
    oauthContainer: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    footer: {
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: isSmallDevice ? spacing.sm : spacing.md,
      paddingTop: isSmallDevice ? spacing.sm : spacing.md,
    },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  });
};
