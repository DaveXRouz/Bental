import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
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
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'None' = 'None';
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'FaceID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint';
      }

      setCapabilities({
        isAvailable: compatible && enrolled,
        biometricType,
        isEnrolled: enrolled,
      });
    } catch (error) {
      console.error('Biometric check error:', error);
      setCapabilities({
        isAvailable: false,
        biometricType: 'None',
        isEnrolled: false,
      });
    }
  };

  const authenticate = async (): Promise<{ success: boolean; error?: string }> => {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Biometric auth not available on web' };
    }

    if (!capabilities.isAvailable) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error === 'user_cancel' ? 'Cancelled by user' : 'Authentication failed'
        };
      }
    } catch (error) {
      return { success: false, error: 'Authentication error occurred' };
    }
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
