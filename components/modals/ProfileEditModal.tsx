import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, User, Mail, Phone, Save, CheckCircle } from 'lucide-react-native';
import { colors, Spacing, Typography, radii } from '@/constants/theme';
import { getModalAccessibilityProps, getCloseButtonAccessibilityProps, getSubmitButtonAccessibilityProps, getCancelButtonAccessibilityProps, getErrorAccessibilityProps } from '@/utils/accessibility-enhancer';
import { useProfile } from '@/hooks/useProfile';
import * as Haptics from 'expo-haptics';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  initialData: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

export default function ProfileEditModal({ visible, onClose, initialData }: ProfileEditModalProps) {
  const [fullName, setFullName] = useState(initialData.full_name);
  const [email, setEmail] = useState(initialData.email);
  const [phone, setPhone] = useState(initialData.phone || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { updateProfile } = useProfile();

  useEffect(() => {
    if (visible) {
      setFullName(initialData.full_name);
      setEmail(initialData.email);
      setPhone(initialData.phone || '');
      setError('');
      setSuccess(false);
    }
  }, [visible, initialData]);

  const validate = (): boolean => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (phone && phone.length > 0) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        setError('Please enter a valid phone number');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    setError('');

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const updates = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
    };

    const result = await updateProfile(updates);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } else {
      setError(result.error || 'Failed to update profile');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleEmailChange = () => {
    Alert.alert(
      'Email Change',
      'Changing your email requires verification. You will receive a confirmation email at your new address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: handleSave },
      ]
    );
  };

  const hasChanges = () => {
    return (
      fullName !== initialData.full_name ||
      email !== initialData.email ||
      phone !== (initialData.phone || '')
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      {...getModalAccessibilityProps('Edit profile', 'Update your personal information')}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.modalContainer}>
          <BlurView intensity={40} tint="dark" style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(255,255,255,0.10)' as const, 'rgba(255,255,255,0.05)' as const]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Edit Profile</Text>
                  <Text style={styles.subtitle}>Update your account information</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                  {...getCloseButtonAccessibilityProps('profile edit dialog')}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.form}>
                  {success ? (
                    <View style={styles.successContainer}>
                      <CheckCircle size={48} color="#10B981" strokeWidth={2} />
                      <Text style={styles.successText}>Profile updated successfully!</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                          <User size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={fullName}
                            onChangeText={(text) => {
                              setFullName(text);
                              setError('');
                            }}
                            autoCapitalize="words"
                            editable={!loading}
                            accessible={true}
                            accessibilityLabel="Full name"
                            accessibilityHint="Enter your full name"
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                          <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={email}
                            onChangeText={(text) => {
                              setEmail(text);
                              setError('');
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                            accessible={true}
                            accessibilityLabel="Email address"
                            accessibilityHint="Enter your email address. Changing email requires verification"
                          />
                        </View>
                        <Text style={styles.helperText}>
                          Changing email requires verification
                        </Text>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputWrapper}>
                          <Phone size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your phone number"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={phone}
                            onChangeText={(text) => {
                              setPhone(text);
                              setError('');
                            }}
                            keyboardType="phone-pad"
                            editable={!loading}
                            accessible={true}
                            accessibilityLabel="Phone number"
                            accessibilityHint="Optional phone number for notifications"
                          />
                        </View>
                        <Text style={styles.helperText}>Optional - for notifications</Text>
                      </View>

                      {error ? (
                        <BlurView
                          intensity={40}
                          tint="dark"
                          style={styles.errorContainer}
                          {...getErrorAccessibilityProps(error)}
                        >
                          <Text style={styles.errorText}>{error}</Text>
                        </BlurView>
                      ) : null}
                    </>
                  )}
                </View>
              </ScrollView>

              {!success && (
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                    activeOpacity={0.8}
                    disabled={loading}
                    {...getCancelButtonAccessibilityProps()}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      (!hasChanges() || loading) && styles.saveButtonDisabled,
                    ]}
                    onPress={email !== initialData.email ? handleEmailChange : handleSave}
                    disabled={!hasChanges() || loading}
                    activeOpacity={0.8}
                    {...getSubmitButtonAccessibilityProps('Save profile changes', !hasChanges() || loading, loading)}
                  >
                    <LinearGradient
                      colors={
                        loading || !hasChanges()
                          ? ['#6B7280', '#4B5563']
                          : ['#10B981', '#059669']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButtonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  modalGradient: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Typography.family.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: Typography.family.regular,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  formScroll: {
    maxHeight: 400,
  },
  form: {
    padding: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 10,
    fontFamily: Typography.family.semibold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontFamily: Typography.family.regular,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 4,
    fontFamily: Typography.family.regular,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    overflow: 'hidden',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Typography.family.medium,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: Spacing.md,
    fontFamily: Typography.family.semibold,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Typography.family.semibold,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.family.bold,
  },
});
