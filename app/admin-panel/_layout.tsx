import { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AdminPanelLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAccess() {
      if (!session?.user) {
        router.replace('/(auth)/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (data?.role !== 'admin') {
        router.replace('/(tabs)');
      }
    }

    if (!loading) {
      checkAdminAccess();
    }
  }, [session, loading, router]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Admin Panel</Text>
        <Text style={styles.errorText}>Web Only Access</Text>
        <Text style={styles.errorSubtext}>Please use a desktop browser</Text>
      </View>
    );
  }

  if (loading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="configuration" />
      <Stack.Screen name="logs" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
    padding: 24,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
