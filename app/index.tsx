import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SplashGlass } from '@/components/glass/SplashGlass';
import { MaintenanceMode } from '@/components/screens/MaintenanceMode';
import { supabase } from '@/lib/supabase';
import { useAppConfig } from '@/hooks/useAppConfig';

export default function Index() {
  const auth = useAuth();
  const { maintenance_mode, loading: configLoading } = useAppConfig();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const { session, loading } = auth;

  useEffect(() => {
    async function fetchUserRole() {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUserRole(data?.role || 'user');
      }
      setRoleLoading(false);
    }

    if (!loading) {
      fetchUserRole();
    }
  }, [session, loading]);

  if (loading || roleLoading || configLoading) {
    return <SplashGlass />;
  }

  if (maintenance_mode && userRole !== 'admin') {
    return <MaintenanceMode />;
  }

  if (session) {
    if (userRole === 'admin') {
      return <Redirect href="/admin-panel" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
