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
        <Tabs.Screen
          name="analytics"
          options={{
            href: null,
            title: 'Analytics',
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            href: null,
            title: 'News',
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            href: null,
            title: 'Alerts',
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            href: null,
            title: 'Leaderboard',
          }}
        />
        <Tabs.Screen
          name="bot-marketplace"
          options={{
            href: null,
            title: 'Bot Marketplace',
          }}
        />
        <Tabs.Screen
          name="screener"
          options={{
            href: null,
            title: 'Screener',
          }}
        />
        <Tabs.Screen
          name="security"
          options={{
            href: null,
            title: 'Security',
          }}
        />
        <Tabs.Screen
          name="tax-reports"
          options={{
            href: null,
            title: 'Tax Reports',
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
