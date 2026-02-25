import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProviderCustom, useAppTheme } from '@/context/ThemeContext';
import SafeScreen from '@/components/SafeScreen';

function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <ThemeProvider value={theme}>
      <SafeScreen>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
      </SafeScreen>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProviderCustom>
      <RootNavigator />
    </ThemeProviderCustom>
  );
}