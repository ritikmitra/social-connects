// app/index.tsx

import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { getMeApi } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { storage } from "@/services/storage.service";

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const hydrateUser = useAuthStore((s) => s.hydrateUser);
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 1️⃣ Validate session using cookies
        const me = await getMeApi();

        if (me) {
          hydrateUser(me);
          setRoute("/(tabs)");
          return;
        }
      } catch {}

      // 2️⃣ Fallback logic
      const hasSeenSplash = await storage.getHasSeenSplash();

      if (hasSeenSplash) {
        setRoute("/auth/email");
      } else {
        setRoute("/splash");
      }
    };

    init().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [hydrateUser]);

  if (!route) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={route as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
