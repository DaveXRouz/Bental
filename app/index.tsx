import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SplashGlass } from '@/components/glass/SplashGlass';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

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

  useEffect(() => {
  }, [loading, session, userRole]);

  if (loading || roleLoading) {
    return <SplashGlass />;
  }

  if (session) {
    if (userRole === 'admin') {
      return <Redirect href="/admin-panel" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
