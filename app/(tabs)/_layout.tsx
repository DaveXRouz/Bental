import { View, StyleSheet } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { FixedBottomNav } from '@/components/navigation/FixedBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TabLayout() {
  const { session } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      setUserRole(profile?.role || 'user');
      setLoading(false);
    };

    checkUserRole();
  }, [session]);

  if (loading) {
    return null;
  }

  if (userRole === 'admin') {
    return <Redirect href="/admin-panel" />;
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <FixedBottomNav {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarAccessibilityLabel: 'Home - View your dashboard',
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: 'Portfolio',
            tabBarAccessibilityLabel: 'Portfolio - Manage your holdings',
          }}
        />
        <Tabs.Screen
          name="ai-assistant"
          options={{
            title: 'AI Trading',
            tabBarAccessibilityLabel: 'AI Trading - Auto trading bots',
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarAccessibilityLabel: 'More - Access additional features',
          }}
        />

        <Tabs.Screen
          name="markets"
          options={{
            href: null,
            title: 'Markets',
          }}
        />
        <Tabs.Screen
          name="trade"
          options={{
            href: null,
            title: 'Trade',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            href: null,
            title: 'History',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
            title: 'Profile',
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            href: null,
            title: 'Support',
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
