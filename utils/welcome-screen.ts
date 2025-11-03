import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_SHOWN_KEY = '@app/welcome_shown';

export const welcomeScreenUtils = {
  async hasSeenWelcome(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking welcome screen status:', error);
      return false;
    }
  },

  async markWelcomeSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Error marking welcome screen as seen:', error);
    }
  },

  async resetWelcome(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WELCOME_SHOWN_KEY);
      console.log('Welcome screen reset successfully');
    } catch (error) {
      console.error('Error resetting welcome screen:', error);
    }
  },
};
