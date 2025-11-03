import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Lock, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { QuantumFieldBackground } from '@/components/backgrounds';
import { GlassCard } from '@/components/login/GlassCard';
import { PasswordField } from '@/components/login/PasswordField';
import { PrimaryButton } from '@/components/login/PrimaryButton';
import { calculatePasswordStrength } from '@/utils/password-strength';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });

  const passwordStrength = calculatePasswordStrength(password);

  useFocusEffect(
    useCallback(() => {
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
      setError('');
      setSuccess(false);
      setTouched({ password: false, confirm: false });
    }, [])
  );

  const handleBlur = (field: 'password' | 'confirm') => {
    setTouched({ ...touched, [field]: true });

    if (field === 'password') {
      if (!password) {
        setError('Password is required');
      } else if (password.length < 8) {
        setError('Password must be at least 8 characters');
      } else if (passwordStrength.score < 2) {
        setError('Password is too weak');
      } else {
        setError('');
      }
    }

    if (field === 'confirm') {
      if (!confirmPassword) {
        setError('Please confirm your password');
      } else if (confirmPassword !== password) {
        setError('Passwords do not match');
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = async () => {
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    const result = await updatePassword(password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const isFormValid = password && confirmPassword && password === confirmPassword && passwordStrength.score >= 2;

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <QuantumFieldBackground />

          <View style={styles.content}>
            <GlassCard>
              <View style={styles.successContainer}>
                <CheckCircle size={64} color="#10B981" strokeWidth={1.5} />
                <Text style={styles.successTitle}>Password Reset!</Text>
                <Text style={styles.successText}>
                  Your password has been successfully reset.
                  You can now sign in with your new password.
                </Text>
                <PrimaryButton
                  title="Continue to Login"
                  onPress={() => router.replace('/(auth)/login')}
                />
              </View>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <QuantumFieldBackground />

        <View style={styles.content}>
          <GlassCard>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password for your account
            </Text>

            <PasswordField
              label="New Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (touched.password) {
                  setError('');
                }
              }}
              onBlur={() => handleBlur('password')}
              placeholder="Enter new password"
              icon={<Lock size={20} color="rgba(255, 255, 255, 0.5)" />}
              error={touched.password && error && error.includes('Password') ? error : undefined}
              showStrength={true}
              editable={!loading}
            />

            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (touched.confirm) {
                  setError('');
                }
              }}
              onBlur={() => handleBlur('confirm')}
              placeholder="Confirm new password"
              icon={<Lock size={20} color="rgba(255, 255, 255, 0.5)" />}
              error={touched.confirm && error && error.includes('match') ? error : undefined}
              editable={!loading}
            />

            {error && !error.includes('Password') && !error.includes('match') && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <PrimaryButton
              title={loading ? 'Resetting...' : 'Reset Password'}
              onPress={handleSubmit}
              disabled={!isFormValid || loading}
              loading={loading}
            />
          </GlassCard>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});
