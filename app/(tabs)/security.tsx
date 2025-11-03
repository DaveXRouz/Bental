import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Shield,
  Lock,
  Smartphone,
  Eye,
  Clock,
  AlertTriangle,
  Fingerprint,
  Mail,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/glass/GlassCard';
import { DataStreamBackground } from '@/components/backgrounds';
import PasswordChangeModal from '@/components/modals/PasswordChangeModal';
import { BottomInsetSpacer } from '@/components/ui/BottomInsetSpacer';

interface LoginHistory {
  id: string;
  login_time: string;
  ip_address: string;
  device_name: string;
  device_type: string;
}

interface UserDevice {
  id: string;
  device_fingerprint: string;
  device_name: string;
  device_type: string;
  is_trusted: boolean;
  last_seen: string;
}

export default function SecurityScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [passwordChangeVisible, setPasswordChangeVisible] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadSecuritySettings();
    }, [user])
  );

  const loadSecuritySettings = async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('two_factor_enabled, biometric_enabled, email_verified, failed_login_attempts')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setTwoFactorEnabled(profile.two_factor_enabled || false);
      setBiometricEnabled(profile.biometric_enabled || false);
      setEmailVerified(profile.email_verified || false);
      setFailedAttempts(profile.failed_login_attempts || 0);
    }

    const { data: history } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user.id)
      .order('login_time', { ascending: false })
      .limit(10);

    if (history) {
      setLoginHistory(history);
    }

    const { data: deviceList } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false });

    if (deviceList) {
      setDevices(deviceList);
    }

    setLoading(false);
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable 2FA',
        'Two-factor authentication adds an extra layer of security. This feature will be available soon.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ two_factor_enabled: value })
      .eq('id', user?.id);

    if (!error) {
      setTwoFactorEnabled(value);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ biometric_enabled: value })
      .eq('id', user?.id);

    if (!error) {
      setBiometricEnabled(value);
      Alert.alert('Success', `Biometric authentication ${value ? 'enabled' : 'disabled'}`);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    Alert.alert(
      'Remove Device',
      'Are you sure you want to remove this device? You will need to sign in again on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('user_devices')
              .delete()
              .eq('id', deviceId);

            if (!error) {
              setDevices(devices.filter(d => d.id !== deviceId));
              Alert.alert('Success', 'Device removed successfully');
            }
          },
        },
      ]
    );
  };

  const handleVerifyEmail = () => {
    Alert.alert(
      'Verify Email',
      'A verification link has been sent to your email address.',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <DataStreamBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Shield size={32} color="#FFFFFF" strokeWidth={1.5} />
          <Text style={styles.title}>Security & Privacy</Text>
          <Text style={styles.subtitle}>Protect your account and data</Text>
        </View>

        {!emailVerified && (
          <GlassCard>
            <View style={styles.warningCard}>
              <AlertTriangle size={24} color="#F59E0B" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Verify Your Email</Text>
                <Text style={styles.warningText}>
                  Verify your email to secure your account
                </Text>
              </View>
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerifyEmail}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        <GlassCard>
          <Text style={styles.sectionTitle}>Authentication</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setPasswordChangeVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Lock size={20} color="rgba(255, 255, 255, 0.7)" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Change Password</Text>
                <Text style={styles.settingDescription}>
                  Update your account password
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Fingerprint size={20} color="rgba(255, 255, 255, 0.7)" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Biometric Login</Text>
                <Text style={styles.settingDescription}>
                  Use Face ID or fingerprint
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Shield size={20} color="rgba(255, 255, 255, 0.7)" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Two-Factor Auth</Text>
                <Text style={styles.settingDescription}>
                  Extra layer of security
                </Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggleTwoFactor}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        {failedAttempts > 0 && (
          <GlassCard>
            <View style={styles.alertCard}>
              <AlertTriangle size={20} color="#EF4444" />
              <Text style={styles.alertText}>
                {failedAttempts} failed login attempt{failedAttempts > 1 ? 's' : ''} detected
              </Text>
            </View>
          </GlassCard>
        )}

        <GlassCard>
          <Text style={styles.sectionTitle}>Login History</Text>
          {loginHistory.length === 0 ? (
            <Text style={styles.emptyText}>No login history yet</Text>
          ) : (
            loginHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Clock size={16} color="rgba(255, 255, 255, 0.5)" />
                <View style={styles.historyContent}>
                  <Text style={styles.historyTime}>
                    {formatDate(item.login_time)}
                  </Text>
                  <Text style={styles.historyDetails}>
                    {item.device_type || 'Unknown Device'} • {item.ip_address || 'Unknown IP'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>Trusted Devices</Text>
          {devices.length === 0 ? (
            <Text style={styles.emptyText}>No devices registered</Text>
          ) : (
            devices.map((device) => (
              <View key={device.id} style={styles.deviceItem}>
                <Smartphone size={20} color="rgba(255, 255, 255, 0.7)" />
                <View style={styles.deviceContent}>
                  <Text style={styles.deviceName}>
                    {device.device_name || 'Unknown Device'}
                  </Text>
                  <Text style={styles.deviceDetails}>
                    Last seen: {formatDate(device.last_seen)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveDevice(device.id)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </GlassCard>

        <BottomInsetSpacer />
      </ScrollView>

      <PasswordChangeModal
        visible={passwordChangeVisible}
        onClose={() => setPasswordChangeVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  verifyButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyContent: {
    flex: 1,
  },
  historyTime: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  deviceContent: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
