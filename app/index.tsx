import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SplashGlass } from '@/components/glass/SplashGlass';

export default function Index() {
  const { session, loading } = useAuth();

  useEffect(() => {
    console.log('[Index] Auth state:', { loading, hasSession: !!session });
  }, [loading, session]);

  if (loading) {
    return <SplashGlass />;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
