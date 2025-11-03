import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { QuantumFieldBackground } from '@/components/backgrounds';
import { GlassCard } from '@/components/login/GlassCard';
import { TextField } from '@/components/login/TextField';
import { PrimaryButton } from '@/components/login/PrimaryButton';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleBlur = () => {
    setTouched(true);
    if (!email) {
      setError('Email is required');
    } else if (!validateEmail(email)) {
      setError('Please enter a valid email');
    } else {
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    const result = await resetPassword(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const isFormValid = email && validateEmail(email);

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <QuantumFieldBackground />

          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <GlassCard>
              <View style={styles.successContainer}>
                <CheckCircle size={64} color="#10B981" strokeWidth={1.5} />
                <Text style={styles.successTitle}>Check Your Email</Text>
                <Text style={styles.successText}>
                  We've sent password reset instructions to{'\n'}
                  <Text style={styles.emailText}>{email}</Text>
                </Text>
                <Text style={styles.infoText}>
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </Text>
                <PrimaryButton
                  title="Back to Login"
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <GlassCard>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you instructions to reset your password
            </Text>

            <TextField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (touched) {
                  setError('');
                }
              }}
              onBlur={handleBlur}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={20} color="rgba(255, 255, 255, 0.5)" />}
              error={touched && error ? error : undefined}
              editable={!loading}
            />

            <PrimaryButton
              title={loading ? 'Sending...' : 'Send Reset Link'}
              onPress={handleSubmit}
              disabled={!isFormValid || loading}
              loading={loading}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.back()}
            >
              <Text style={styles.linkText}>Remember your password? Sign in</Text>
            </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
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
    marginBottom: 24,
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
});
