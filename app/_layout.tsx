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
import { PortfolioProvider } from '@/contexts/PortfolioContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ToastProvider } from '@/components/ui/ToastManager';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useTickerStore } from '@/stores/useTickerStore';
import { validateEnvironment } from '@/config/env';
import { ensureSchemaReady } from '@/utils/schema-refresh';

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
      console.error('[App] Environment validation failed:', error);
    }

    // Verify database schema is accessible
    ensureSchemaReady().catch((error) => {
      console.error('[App] Schema verification failed:', error);
    });

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();

      // Inject custom fonts for web platform
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        // Check if font styles already injected
        if (!document.getElementById('custom-font-injection')) {
          const fontStyle = document.createElement('style');
          fontStyle.id = 'custom-font-injection';
          fontStyle.textContent = `
            /* Apply Inter font family globally for React Native Web */
            body,
            html,
            #root,
            input,
            textarea,
            select,
            button {
              font-family: 'Inter-Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }

            /* Override React Native Web default text rendering */
            [dir] {
              font-family: 'Inter-Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }

            /* Font smoothing for better rendering */
            body,
            html {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }

            /* Enable tabular numbers for professional number alignment */
            body {
              font-variant-numeric: tabular-nums;
              font-feature-settings: "tnum" 1, "zero" 1;
            }

            /* Ensure @font-face rules for all Inter variants */
            @font-face {
              font-family: 'Inter-Regular';
              font-style: normal;
              font-weight: 400;
              font-display: swap;
              font-feature-settings: "tnum" 1, "zero" 1;
            }

            @font-face {
              font-family: 'Inter-Medium';
              font-style: normal;
              font-weight: 500;
              font-display: swap;
              font-feature-settings: "tnum" 1, "zero" 1;
            }

            @font-face {
              font-family: 'Inter-SemiBold';
              font-style: normal;
              font-weight: 600;
              font-display: swap;
              font-feature-settings: "tnum" 1, "zero" 1;
            }

            @font-face {
              font-family: 'Inter-Bold';
              font-style: normal;
              font-weight: 700;
              font-display: swap;
              font-feature-settings: "tnum" 1, "zero" 1;
            }

            @font-face {
              font-family: 'Playfair-Regular';
              font-style: normal;
              font-weight: 400;
              font-display: swap;
            }

            @font-face {
              font-family: 'Playfair-Bold';
              font-style: normal;
              font-weight: 700;
              font-display: swap;
            }
          `;
          document.head.appendChild(fontStyle);
          console.log('[App] Custom fonts injected for web platform');
        }
      }
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        console.log('[App] Initializing ticker store...');
        const cleanup = useTickerStore.getState().initialize();
        return () => {
          if (cleanup) {
            console.log('[App] Cleaning up ticker store...');
            cleanup();
          }
        };
      } catch (error) {
        console.error('[App] Failed to initialize ticker store:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  return (
    <ErrorBoundary>
      <LoadingProvider>
        <ToastProvider>
          <AuthProvider>
            <AccountProvider>
              <PortfolioProvider>
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
              </PortfolioProvider>
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
