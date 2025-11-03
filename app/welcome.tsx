import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WelcomeScreen } from '@/components/glass/WelcomeScreen';

const WELCOME_SHOWN_KEY = '@app/welcome_shown';

export default function Welcome() {
  const router = useRouter();

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Failed to save welcome shown status:', error);
      router.replace('/(auth)/login');
    }
  };

  return <WelcomeScreen onContinue={handleContinue} />;
}
