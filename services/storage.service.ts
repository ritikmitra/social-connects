import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HAS_SEEN_SPLASH: '@connects:hasSeenSplash',
  USER: '@connects:user',
} as const;

export const storage = {
  getHasSeenSplash: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(KEYS.HAS_SEEN_SPLASH);
      return value === 'true';
    } catch {
      return false;
    }
  },

  setHasSeenSplash: async (): Promise<void> => {
    await AsyncStorage.setItem(KEYS.HAS_SEEN_SPLASH, 'true');
  },

  getUser: async (): Promise<unknown | null> => {
    try {
      const value = await AsyncStorage.getItem(KEYS.USER);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  setUser: async (user: unknown): Promise<void> => {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  removeUser: async (): Promise<void> => {
    await AsyncStorage.removeItem(KEYS.USER);
  },
};
