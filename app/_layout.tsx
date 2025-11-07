import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccountProvider } from '@/contexts/AccountContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ToastProvider as OldToastProvider } from '@/contexts/ToastContext';
import { ToastProvider } from '@/components/ui/ToastManager';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useTickerStore } from '@/stores/useTickerStore';
import { validateEnvironment } from '@/config/env';

if (Platform.OS === 'web') {
  console.clear();

  // Fix React Native Web gap property bug that creates phantom text nodes
  const style = document.createElement('style');
  style.textContent = `
    [data-focusable="true"]:focus { outline: none; }
    * { -webkit-tap-highlight-color: transparent; }
  `;
  document.head.appendChild(style);

  // Suppress the React Native Web text node warnings
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('text node cannot be a child') ||
       args[0].includes('Unexpected text node'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Playfair-Regular': PlayfairDisplay_400Regular,
    'Playfair-Bold': PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    try {
      validateEnvironment();
    } catch (error) {
      console.warn('Environment validation failed', error);
    }

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const cleanup = useTickerStore.getState().initialize();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <LoadingProvider>
        <ToastProvider>
          <AuthProvider>
            <AccountProvider>
              {!fontsLoaded && !fontError ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="#0B6E4F" />
                </View>
              ) : (
                <>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="admin-panel" />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                </>
              )}
            </AccountProvider>
          </AuthProvider>
        </ToastProvider>
      </LoadingProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
