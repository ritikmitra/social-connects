import * as Notifications from "expo-notifications";
import { ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProviderCustom, useAppTheme } from '@/context/ThemeContext';
import SafeScreen from '@/components/SafeScreen';
import { SocketProvider, useSocket } from "@/context/socket.context";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";
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

function IncomingCallListener() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      const callId = data?.call_id;
      const callerName = data?.caller_name ?? "Someone";
      const callerId = data?.caller_id ?? data?.from ?? data?.user_id ?? "";
      const isVideo = !!data?.is_video;

      if (!callId) return;

      Alert.alert("Incoming Call", `${callerName} is calling...`, [
        {
          text: "Reject",
          style: "destructive",
          onPress: () => socket.emit("reject_call", { call_id: callId }),
        },
        {
          text: "Accept",
          onPress: () => {
            socket.emit("accept_call", {
              call_id: callId,
              target_user_id: callerId,
            });

            router.push({
              pathname: "/call",
              params: {
                callId,
                targetUserId: callerId,
                isVideo: isVideo.toString(),
                isCaller: "false",
              },
            });
          },
        },
      ]);
    };

    socket.on("incoming_call", handleIncomingCall);
    return () => {
      socket.off("incoming_call", handleIncomingCall);
    };
  }, [socket]);

  return null;
}

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
        <IncomingCallListener />
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