import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProviderCustom, useAppTheme } from '@/context/ThemeContext';
import SafeScreen from '@/components/SafeScreen';
import { SocketProvider } from "@/context/socket.context";
function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <ThemeProvider value={theme}>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="auth/email" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="(tabs)"/>
        </Stack>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
      </SafeScreen>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SocketProvider>
      <ThemeProviderCustom>
        <RootNavigator />
      </ThemeProviderCustom>
    </SocketProvider>
  );
}