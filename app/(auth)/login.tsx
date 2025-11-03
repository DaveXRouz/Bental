import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { Mail, Lock, CreditCard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/theme';
import { GlassCard } from '@/components/login/GlassCard';
import { Segmented } from '@/components/login/Segmented';
import { TextField } from '@/components/login/TextField';
import { PasswordField } from '@/components/login/PasswordField';
import { PrimaryButton } from '@/components/login/PrimaryButton';
import { OAuthButton } from '@/components/login/OAuthButton';
import { Chrome as GoogleIcon, Apple as AppleIcon, Twitter, Linkedin, Github } from 'lucide-react-native';
import { QuantumFieldBackground } from '@/components/backgrounds';

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
        if (loginMode === 'email') {
          setEmailError('Invalid email or password');
        } else {
          setPassportError('Invalid Trading Passport or password');
        }
        setPasswordError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (data?.user) {
        router.replace('/(tabs)');
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
        <QuantumFieldBackground />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <GlassCard>
              <Text style={styles.title}>Welcome back</Text>

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
                    if (touched.email) {
                      setEmailError('');
                    }
                  }}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  error={touched.email ? emailError : ''}
                  onBlur={() => handleBlur('email')}
                  icon={<Mail size={20} color={theme.colors.textSecondary} />}
                />
              ) : (
                <TextField
                  label="Trading Passport"
                  value={tradingPassport}
                  onChangeText={(text) => {
                    setTradingPassport(text);
                    if (touched.passport) {
                      setPassportError('');
                    }
                  }}
                  placeholder="Enter your Trading Passport"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={touched.passport ? passportError : ''}
                  onBlur={() => handleBlur('passport')}
                  icon={<CreditCard size={20} color={theme.colors.textSecondary} />}
                />
              )}

              <PasswordField
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (touched.password) {
                    setPasswordError('');
                  }
                }}
                placeholder="Enter your password"
                error={touched.password ? passwordError : ''}
                onBlur={() => handleBlur('password')}
                icon={<Lock size={20} color={theme.colors.textSecondary} />}
              />

              <View style={styles.rememberRow}>
                <View style={styles.rememberContainer}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                    thumbColor={theme.colors.white}
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

              <View style={styles.signInContainer}>
                <PrimaryButton
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
                    icon={<GoogleIcon size={20} color={theme.colors.text} />}
                    label="Google"
                  />
                </View>
                <View style={styles.oauthButton}>
                  <OAuthButton
                    onPress={() => {}}
                    icon={<AppleIcon size={20} color={theme.colors.text} />}
                    label="Apple"
                  />
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.socialIcons}>
                  <TouchableOpacity style={styles.socialIcon} accessibilityLabel="Twitter">
                    <Twitter size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialIcon} accessibilityLabel="LinkedIn">
                    <Linkedin size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialIcon} accessibilityLabel="GitHub">
                    <Github size={18} color={theme.colors.textSecondary} />
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
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.25,
  },
  orb1: {
    backgroundColor: theme.colors.accent,
    top: -100,
    left: -100,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
  },
  orb2: {
    backgroundColor: theme.colors.accentSecondary,
    bottom: -100,
    right: -100,
    shadowColor: theme.colors.accentSecondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(4),
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing(3),
    textAlign: 'center',
  },
  segmentedContainer: {
    marginBottom: theme.spacing(3),
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  rememberText: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  forgotText: {
    ...theme.typography.label,
    color: theme.colors.accent,
  },
  signInContainer: {
    marginBottom: theme.spacing(3),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing(3),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.stroke,
  },
  dividerText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing(2),
  },
  oauthContainer: {
    flexDirection: width >= 400 ? 'row' : 'column',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  oauthButton: {
    flex: width >= 400 ? 1 : undefined,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  socialIcons: {
    flexDirection: 'row',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  socialIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  footerLink: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  footerDot: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
});
