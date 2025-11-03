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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Check } from 'lucide-react-native';
import { colors, Spacing, Typography, radii } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { changePasswordSchema } from '@/utils/validation';
import { calculatePasswordStrength, getPasswordRequirements } from '@/utils/password-strength';
import * as Haptics from 'expo-haptics';

interface PasswordChangeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PasswordChangeModal({ visible, onClose }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { changePassword } = useAuth();

  const passwordStrength = calculatePasswordStrength(newPassword);
  const requirements = getPasswordRequirements(newPassword);

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError('');
      setFieldErrors({});
      setSuccess(false);
    }
  }, [visible]);

  const validate = (): boolean => {
    try {
      changePasswordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setFieldErrors({});
      return true;
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.errors?.forEach((error: any) => {
        if (error.path && error.path.length > 0) {
          errors[error.path[0]] = error.message;
        }
      });
      setFieldErrors(errors);
      return false;
    }
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

    const result = await changePassword(currentPassword, newPassword);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } else {
      setError(result.error || 'Failed to change password');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
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
                  <View style={styles.headerTitleRow}>
                    <Lock size={24} color={colors.primary} style={styles.headerIcon} />
                    <Text style={styles.title}>Change Password</Text>
                  </View>
                  <Text style={styles.subtitle}>Update your account password</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityLabel="Close modal"
                  accessibilityRole="button"
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.form}>
                  {success ? (
                    <View style={styles.successContainer}>
                      <CheckCircle size={48} color="#10B981" strokeWidth={2} />
                      <Text style={styles.successText}>Password changed successfully!</Text>
                      <Text style={styles.successSubtext}>
                        Your password has been updated securely
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={[
                          styles.inputWrapper,
                          fieldErrors.currentPassword && styles.inputWrapperError
                        ]}>
                          <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter current password"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={currentPassword}
                            onChangeText={(text) => {
                              setCurrentPassword(text);
                              setError('');
                              setFieldErrors({});
                            }}
                            secureTextEntry={!showCurrentPassword}
                            autoCapitalize="none"
                            editable={!loading}
                            accessible={true}
                            accessibilityLabel="Current password"
                          />
                          <TouchableOpacity
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={styles.eyeButton}
                            activeOpacity={0.7}
                            accessible={true}
                            accessibilityLabel={showCurrentPassword ? 'Hide password' : 'Show password'}
                            accessibilityRole="button"
                          >
                            {showCurrentPassword ? (
                              <EyeOff size={20} color="#94A3B8" />
                            ) : (
                              <Eye size={20} color="#94A3B8" />
                            )}
                          </TouchableOpacity>
                        </View>
                        {fieldErrors.currentPassword && (
                          <Text style={styles.errorText}>
                            {fieldErrors.currentPassword}
                          </Text>
                        )}
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={[
                          styles.inputWrapper,
                          fieldErrors.newPassword && styles.inputWrapperError
                        ]}>
                          <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={newPassword}
                            onChangeText={(text) => {
                              setNewPassword(text);
                              setError('');
                              setFieldErrors({});
                            }}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                            editable={!loading}
                            accessible={true}
                            accessibilityLabel="New password"
                          />
                          <TouchableOpacity
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            style={styles.eyeButton}
                            activeOpacity={0.7}
                            accessible={true}
                            accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}
                            accessibilityRole="button"
                          >
                            {showNewPassword ? (
                              <EyeOff size={20} color="#94A3B8" />
                            ) : (
                              <Eye size={20} color="#94A3B8" />
                            )}
                          </TouchableOpacity>
                        </View>
                        {fieldErrors.newPassword && (
                          <Text style={styles.errorText}>
                            {fieldErrors.newPassword}
                          </Text>
                        )}

                        {newPassword.length > 0 && (
                          <View style={styles.strengthContainer}>
                            <View style={styles.strengthHeader}>
                              <Text style={styles.strengthLabel}>Password Strength</Text>
                              <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>
                                {passwordStrength.feedback}
                              </Text>
                            </View>
                            <View style={styles.strengthBar}>
                              <View
                                style={[
                                  styles.strengthBarFill,
                                  {
                                    width: `${passwordStrength.score}%`,
                                    backgroundColor: passwordStrength.color,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        )}

                        <View style={styles.requirementsContainer}>
                          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                          {requirements.map((req, index) => (
                            <View key={index} style={styles.requirementRow}>
                              <View
                                style={[
                                  styles.requirementIndicator,
                                  req.met && styles.requirementIndicatorMet,
                                ]}
                              >
                                {req.met && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                              </View>
                              <Text
                                style={[
                                  styles.requirementText,
                                  req.met && styles.requirementTextMet,
                                ]}
                              >
                                {req.text}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={[
                          styles.inputWrapper,
                          fieldErrors.confirmPassword && styles.inputWrapperError
                        ]}>
                          <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={confirmPassword}
                            onChangeText={(text) => {
                              setConfirmPassword(text);
                              setError('');
                              setFieldErrors({});
                            }}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            editable={!loading}
                            accessible={true}
                            accessibilityLabel="Confirm new password"
                          />
                          <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeButton}
                            activeOpacity={0.7}
                            accessible={true}
                            accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                            accessibilityRole="button"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} color="#94A3B8" />
                            ) : (
                              <Eye size={20} color="#94A3B8" />
                            )}
                          </TouchableOpacity>
                        </View>
                        {fieldErrors.confirmPassword && (
                          <Text style={styles.errorText}>
                            {fieldErrors.confirmPassword}
                          </Text>
                        )}
                      </View>

                      {error ? (
                        <BlurView intensity={40} tint="dark" style={styles.errorContainer}>
                          <AlertCircle size={18} color="#FCA5A5" style={styles.errorIcon} />
                          <Text style={styles.errorContainerText}>{error}</Text>
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
                    accessible={true}
                    accessibilityLabel="Cancel"
                    accessibilityRole="button"
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      loading && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityLabel="Change password"
                    accessibilityRole="button"
                  >
                    <LinearGradient
                      colors={
                        loading
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
                          <Lock size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={styles.saveButtonText}>Change Password</Text>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Typography.family.bold,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: Typography.family.regular,
    marginLeft: 34,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  formScroll: {
    maxHeight: 500,
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
  inputWrapperError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
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
  eyeButton: {
    padding: 4,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: Typography.family.regular,
  },
  strengthContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Typography.family.medium,
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.family.semibold,
  },
  strengthBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  requirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    fontFamily: Typography.family.semibold,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementIndicatorMet: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  requirementText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: Typography.family.regular,
  },
  requirementTextMet: {
    color: '#10B981',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    marginRight: 10,
  },
  errorContainerText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 14,
    fontFamily: Typography.family.medium,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginTop: Spacing.md,
    fontFamily: Typography.family.bold,
  },
  successSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
    fontFamily: Typography.family.regular,
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
