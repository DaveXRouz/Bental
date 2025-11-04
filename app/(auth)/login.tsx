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
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Mail, Lock, CreditCard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius } from '@/constants/theme';
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

const { width } = Dimensions.get('window');

type LoginMode = 'email' | 'passport';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
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
              <MinimalLogo size={48} />
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

              <View style={styles.buttonContainer}>
                <Glass3DButton
                  title="Sign In"
                  onPress={handleSignIn}
                  disabled={!isFormValid || loading}
                  loading={loading}
                />
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.oauthContainer}>
                <GlassOAuthButton
                  onPress={() => {}}
                  icon={<GoogleIcon size={20} color="rgba(255, 255, 255, 0.7)" />}
                  label="Google"
                />
                <GlassOAuthButton
                  onPress={() => {}}
                  icon={<AppleIcon size={20} color="rgba(255, 255, 255, 0.7)" />}
                  label="Apple"
                />
              </View>

              <View style={styles.footer}>
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
            </GlassmorphicCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl * 2,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.98)',
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  toggleContainer: {
    marginBottom: spacing.md + 4,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: 4,
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
  buttonContainer: {
    marginBottom: spacing.md + 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(200, 200, 200, 0.12)',
  },
  dividerText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: spacing.md + 2,
    letterSpacing: 0.5,
  },
  oauthContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.3,
  },
  footerSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
  },
  copyright: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
