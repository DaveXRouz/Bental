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
import { X, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Mail } from 'lucide-react-native';
import { colors, Spacing, Typography, radii } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { passwordStrengthSchema } from '@/utils/validation';
import { calculatePasswordStrength, getPasswordRequirements } from '@/utils/password-strength';
import * as Haptics from 'expo-haptics';

interface AdminPasswordResetModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
}

export default function AdminPasswordResetModal({
  visible,
  onClose,
  onSuccess,
}: AdminPasswordResetModalProps) {
  const [email, setEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'search' | 'reset'>('search');

  const passwordStrength = calculatePasswordStrength(newPassword);
  const requirements = getPasswordRequirements(newPassword);

  useEffect(() => {
    if (visible) {
      setEmail('');
      setSearchedUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError('');
      setSuccess(false);
      setStep('search');
    }
  }, [visible]);

  const handleSearchUser = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const { data, error: searchError } = await supabase.rpc('admin_get_user_by_email', {
        p_email: email.trim(),
      });

      if (searchError) throw searchError;

      if (!data || data.length === 0) {
        setError('User not found');
        setSearchedUser(null);
      } else {
        setSearchedUser(data[0]);
        setStep('reset');
        setError('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find user');
      setSearchedUser(null);
    } finally {
      setSearching(false);
    }
  };

  const validatePassword = (): boolean => {
    try {
      passwordStrengthSchema.parse(newPassword);

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      return true;
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid password');
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (!searchedUser) return;

    if (!validatePassword()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    Alert.alert(
      'Confirm Password Reset',
      `Are you sure you want to reset the password for ${searchedUser.full_name} (${searchedUser.email})?\n\nThis action will be logged for security purposes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Password',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setError('');

            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            try {
              const { data: { user: currentUser } } = await supabase.auth.getUser();

              if (!currentUser) {
                throw new Error('Not authenticated');
              }

              const { error: updateError } = await supabase.auth.admin.updateUserById(
                searchedUser.id,
                { password: newPassword }
              );

              if (updateError) {
                throw updateError;
              }

              await supabase
                .from('profiles')
                .update({ password_changed_at: new Date().toISOString() })
                .eq('id', searchedUser.id);

              await supabase.rpc('log_admin_password_reset', {
                p_admin_id: currentUser.id,
                p_target_user_id: searchedUser.id,
                p_success: true,
              });

              setSuccess(true);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              setTimeout(() => {
                onClose();
                onSuccess?.();
                setSuccess(false);
              }, 2000);
            } catch (err: any) {
              console.error('Password reset error:', err);

              if (err.message?.includes('admin')) {
                setError('Admin privileges required. This feature requires service role access.');
              } else {
                setError(err.message || 'Failed to reset password');
              }

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }

              if (searchedUser) {
                await supabase.rpc('log_admin_password_reset', {
                  p_admin_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
                  p_target_user_id: searchedUser.id,
                  p_success: false,
                });
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
                    <Shield size={24} color="#ef4444" style={styles.headerIcon} />
                    <Text style={styles.title}>Admin Password Reset</Text>
                  </View>
                  <Text style={styles.subtitle}>
                    {step === 'search' ? 'Search for user by email' : 'Set new password'}
                  </Text>
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
                      <Text style={styles.successText}>Password reset successfully!</Text>
                      <Text style={styles.successSubtext}>
                        User can now log in with their new password
                      </Text>
                    </View>
                  ) : step === 'search' ? (
                    <>
                      <View style={styles.warningBox}>
                        <AlertCircle size={20} color="#f59e0b" style={styles.warningIcon} />
                        <Text style={styles.warningText}>
                          Admin function: All password resets are logged for security audit
                        </Text>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>User Email Address</Text>
                        <View style={styles.inputWrapper}>
                          <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter user email"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={email}
                            onChangeText={(text) => {
                              setEmail(text);
                              setError('');
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!searching}
                            accessible={true}
                            accessibilityLabel="User email"
                          />
                        </View>
                      </View>

                      {error && (
                        <BlurView intensity={40} tint="dark" style={styles.errorContainer}>
                          <AlertCircle size={18} color="#FCA5A5" style={styles.errorIcon} />
                          <Text style={styles.errorContainerText}>{error}</Text>
                        </BlurView>
                      )}
                    </>
                  ) : (
                    <>
                      <View style={styles.userInfoBox}>
                        <Text style={styles.userInfoLabel}>Resetting password for:</Text>
                        <Text style={styles.userInfoName}>{searchedUser?.full_name}</Text>
                        <Text style={styles.userInfoEmail}>{searchedUser?.email}</Text>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputWrapper}>
                          <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={newPassword}
                            onChangeText={(text) => {
                              setNewPassword(text);
                              setError('');
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
                          >
                            {showNewPassword ? (
                              <EyeOff size={20} color="#94A3B8" />
                            ) : (
                              <Eye size={20} color="#94A3B8" />
                            )}
                          </TouchableOpacity>
                        </View>

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
                                {req.met && (
                                  <Text style={styles.requirementCheck}>✓</Text>
                                )}
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
                        <View style={styles.inputWrapper}>
                          <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={confirmPassword}
                            onChangeText={(text) => {
                              setConfirmPassword(text);
                              setError('');
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
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} color="#94A3B8" />
                            ) : (
                              <Eye size={20} color="#94A3B8" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {error && (
                        <BlurView intensity={40} tint="dark" style={styles.errorContainer}>
                          <AlertCircle size={18} color="#FCA5A5" style={styles.errorIcon} />
                          <Text style={styles.errorContainerText}>{error}</Text>
                        </BlurView>
                      )}
                    </>
                  )}
                </View>
              </ScrollView>

              {!success && (
                <View style={styles.footer}>
                  {step === 'reset' && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => {
                        setStep('search');
                        setSearchedUser(null);
                        setNewPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, (loading || searching) && styles.actionButtonDisabled]}
                    onPress={step === 'search' ? handleSearchUser : handleResetPassword}
                    disabled={loading || searching}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        loading || searching
                          ? ['#6B7280', '#4B5563']
                          : step === 'search'
                          ? ['#3b82f6', '#2563eb']
                          : ['#ef4444', '#dc2626']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      {loading || searching ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          {step === 'search' ? (
                            <Mail size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          ) : (
                            <Lock size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          )}
                          <Text style={styles.actionButtonText}>
                            {step === 'search' ? 'Search User' : 'Reset Password'}
                          </Text>
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: Spacing.lg,
  },
  warningIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#fbbf24',
    fontFamily: Typography.family.medium,
    lineHeight: 18,
  },
  userInfoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: Spacing.lg,
  },
  userInfoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontFamily: Typography.family.medium,
  },
  userInfoName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    fontFamily: Typography.family.bold,
  },
  userInfoEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: Typography.family.regular,
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
  eyeButton: {
    padding: 4,
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
  requirementCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Typography.family.semibold,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.family.bold,
  },
});
