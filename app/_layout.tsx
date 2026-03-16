import * as Notifications from "expo-notifications";
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProviderCustom, useAppTheme } from '@/context/ThemeContext';
import SafeScreen from '@/components/SafeScreen';
import { SocketProvider } from "@/context/socket.context";
import { useEffect } from "react";
import { Platform } from "react-native";
import { KeyboardProvider } from 'react-native-keyboard-controller';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootNavigator() {
  const { theme } = useAppTheme();
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }, []);

  return (
    <ThemeProvider value={theme}>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="auth/email" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
      </SafeScreen>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SocketProvider>
      <KeyboardProvider>
        <ThemeProviderCustom>
          <RootNavigator />
        </ThemeProviderCustom>
      </KeyboardProvider>
    </SocketProvider>
  );
}