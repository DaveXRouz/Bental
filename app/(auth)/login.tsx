import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Mail, Lock, CreditCard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { GlassCard } from '@/components/login/GlassCard';
import { Segmented } from '@/components/login/Segmented';
import { TextField } from '@/components/login/TextField';
import { PasswordField } from '@/components/login/PasswordField';
import { ThreeDButton } from '@/components/login/ThreeDButton';
import { OAuthButton } from '@/components/login/OAuthButton';
import { Chrome as GoogleIcon, Apple as AppleIcon, Twitter, Linkedin, Github } from 'lucide-react-native';
import { ParallaxBackground } from '@/components/backgrounds/ParallaxBackground';

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
        <ParallaxBackground />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <GlassCard>
              <Text style={styles.title}>Step Into the Future</Text>

              <View style={styles.segmentedContainer}>
                <Segmented
                  options={['Email', 'Trading Passport']}
                  selected={loginMode === 'email' ? 0 : 1}
                  onSelect={(index) => {
                    setLoginMode(index === 0 ? 'email' : 'passport');
                    setEmailError('');
                    setPassportError('');
                  }}
                />
              </View>

              {loginMode === 'email' ? (
                <TextField
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
                  icon={<Mail size={18} color="#909090" />}
                />
              ) : (
                <TextField
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
                  icon={<CreditCard size={18} color="#909090" />}
                />
              )}

              <PasswordField
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
                icon={<Lock size={18} color="#909090" />}
              />

              <View style={styles.rememberRow}>
                <View style={styles.rememberContainer}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: colors.surface, true: colors.accent }}
                    thumbColor={colors.white}
                    accessibilityLabel="Remember me"
                  />
                  <Text style={styles.rememberText}>Remember</Text>
                </View>
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
                <ThreeDButton
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
                <View style={styles.oauthButton}>
                  <OAuthButton
                    onPress={() => {}}
                    icon={<GoogleIcon size={18} color="#b0b0b0" />}
                    label="Google"
                  />
                </View>
                <View style={styles.oauthButton}>
                  <OAuthButton
                    onPress={() => {}}
                    icon={<AppleIcon size={18} color="#b0b0b0" />}
                    label="Apple"
                  />
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.socialIcons}>
                  <TouchableOpacity style={styles.socialIcon} accessibilityLabel="Twitter">
                    <Twitter size={16} color="#707070" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialIcon} accessibilityLabel="LinkedIn">
                    <Linkedin size={16} color="#707070" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialIcon} accessibilityLabel="GitHub">
                    <Github size={16} color="#707070" />
                  </TouchableOpacity>
                </View>
                <View style={styles.footerLinks}>
                  <TouchableOpacity accessibilityLabel="Privacy">
                    <Text style={styles.footerLink}>Privacy</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerDot}>·</Text>
                  <TouchableOpacity accessibilityLabel="Terms">
                    <Text style={styles.footerLink}>Terms</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerDot}>·</Text>
                  <TouchableOpacity accessibilityLabel="Contact">
                    <Text style={styles.footerLink}>Contact</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.25,
  },
  orb1: {
    backgroundColor: colors.accent,
    top: -100,
    left: -100,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
  },
  orb2: {
    backgroundColor: colors.accentDark,
    bottom: -100,
    right: -100,
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md * 2,
    paddingVertical: spacing.md * 4,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e0e0e0',
    marginBottom: spacing.lg + 4,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  segmentedContainer: {
    marginBottom: spacing.lg,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  rememberText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: '#b0b0b0',
  },
  forgotText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: '#909090',
  },
  buttonContainer: {
    marginBottom: spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.25)',
  },
  dividerText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.regular,
    color: '#808080',
    marginHorizontal: spacing.md,
  },
  oauthContainer: {
    flexDirection: width >= 400 ? 'row' : 'column',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  oauthButton: {
    flex: width >= 400 ? 1 : undefined,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  socialIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  footerLink: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.regular,
    color: '#707070',
  },
  footerDot: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.regular,
    color: '#707070',
  },
});
