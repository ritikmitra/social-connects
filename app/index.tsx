import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { getMeApi } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { storage } from '@/services/storage.service';

// Keep native splash visible while we resolve initial route
SplashScreen.preventAutoHideAsync();

export default function IndexScreen() {
  const router = useRouter();
  const hydrateUser = useAuthStore((s) => s.hydrateUser);

  useEffect(() => {
    const resolveInitialRoute = async () => {
      try {
        // 1. Check if user is logged in (session valid via cookies)
        const me = await getMeApi();
        if (me) {
          hydrateUser(me);
          router.replace('/(tabs)');
          return;
        }
      } catch {
        // Not logged in or session expired
      }

      // 2. Check if user has seen splash before
      const hasSeenSplash = await storage.getHasSeenSplash();

      if (hasSeenSplash) {
        router.replace('/auth/email');
      } else {
        router.replace('/splash');
      }
    };

    resolveInitialRoute().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [router, hydrateUser]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
