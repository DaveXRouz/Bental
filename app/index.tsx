import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { SplashGlass } from '@/components/glass/SplashGlass';

const WELCOME_SHOWN_KEY = '@app/welcome_shown';

export default function Index() {
  const { session, loading } = useAuth();
  const [welcomeShown, setWelcomeShown] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const shown = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
        setWelcomeShown(shown === 'true');
      } catch (error) {
        console.error('Failed to check welcome status:', error);
        setWelcomeShown(true);
      }
    };
    checkWelcomeStatus();
  }, []);

  useEffect(() => {
    console.log('[Index] Auth state:', { loading, hasSession: !!session });
  }, [loading, session]);

  if (loading || welcomeShown === null) {
    return <SplashGlass />;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  if (!welcomeShown) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(auth)/login" />;
}
