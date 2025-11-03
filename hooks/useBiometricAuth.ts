import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_STORAGE_KEY = 'biometric_credentials';

interface BiometricCapabilities {
  isAvailable: boolean;
  biometricType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'None';
  isEnrolled: boolean;
}

export function useBiometricAuth() {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    biometricType: 'None',
    isEnrolled: false,
  });

  useEffect(() => {
    checkBiometricCapabilities();
  }, []);

  const checkBiometricCapabilities = async () => {
    if (Platform.OS === 'web') {
      setCapabilities({
        isAvailable: false,
        biometricType: 'None',
        isEnrolled: false,
      });
      return;
    }

    try {
      setCapabilities({
        isAvailable: true,
        biometricType: Platform.OS === 'ios' ? 'FaceID' : 'Fingerprint',
        isEnrolled: true,
      });
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const authenticate = async (): Promise<{ success: boolean; error?: string }> => {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Biometric auth not available on web' };
    }

    if (!capabilities.isAvailable) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    Alert.alert(
      'Biometric Authentication',
      'Biometric authentication would be triggered here on a real device.',
      [{ text: 'OK' }]
    );

    return { success: true };
  };

  const saveCredentials = async (email: string, encryptedPassword: string) => {
    if (Platform.OS === 'web') return;

    try {
      await AsyncStorage.setItem(
        BIOMETRIC_STORAGE_KEY,
        JSON.stringify({ email, encryptedPassword })
      );
    } catch (error) {
      console.error('Failed to save biometric credentials:', error);
    }
  };

  const getStoredCredentials = async (): Promise<{ email: string; encryptedPassword: string } | null> => {
    if (Platform.OS === 'web') return null;

    try {
      const stored = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get stored credentials:', error);
    }
    return null;
  };

  const clearStoredCredentials = async () => {
    if (Platform.OS === 'web') return;

    try {
      await AsyncStorage.removeItem(BIOMETRIC_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear biometric credentials:', error);
    }
  };

  return {
    capabilities,
    authenticate,
    saveCredentials,
    getStoredCredentials,
    clearStoredCredentials,
  };
}
