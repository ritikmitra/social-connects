import * as Notifications from "expo-notifications";
import { ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProviderCustom, useAppTheme } from '@/context/ThemeContext';
import SafeScreen from '@/components/SafeScreen';
import { SocketProvider, useSocket } from "@/context/socket.context";
import { useEffect, useRef, useState } from "react";
import { Platform, Vibration } from "react-native";
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as Haptics from "expo-haptics";
import IncomingCallSheet from "@/components/IncomingCallSheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAudioPlayer } from "expo-audio";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type IncomingCallPayload = {
  call_id: string;
  caller_name?: string;
  caller_id?: string;
  from?: string;
  user_id?: string;
  is_video?: boolean;
};

function IncomingCallListener() {
  const { socket } = useSocket();
  const [incoming, setIncoming] = useState<IncomingCallPayload | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringtone = useAudioPlayer(require("../assets/sounds/ringtone.mp3"));

  const callerName = incoming?.caller_name ?? "Someone";
  const callerId = incoming?.caller_id ?? incoming?.from ?? incoming?.user_id ?? "";
  const isVideo = !!incoming?.is_video;
  const callId = incoming?.call_id ?? "";

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: IncomingCallPayload) => {
      if (!data?.call_id) return;
      setIncoming(data);
    };

    socket.on("incoming_call", handleIncomingCall);
    return () => {
      socket.off("incoming_call", handleIncomingCall);
    };
  }, [socket]);

  // Start/stop ringing while sheet is visible.
  useEffect(() => {
    if (!incoming) {
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
      try { Vibration.cancel(); } catch {}
      try { ringtone.pause(); } catch {}
      try { (ringtone as any).loop = false; } catch {}
      return;
    }

    // Vibrate in a loop. (Android: pattern loops; iOS: best-effort fallback)
    try { Vibration.vibrate([0, 900, 700], true); } catch {}

    // Play ringtone loop (foreground only)
    try {
      (ringtone as any).loop = true;
      ringtone.play();
    } catch {}

    // Add a light repeated haptic pulse (helps on devices where vibration loop is limited).
    ringTimerRef.current = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }, 1600);

    return () => {
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
      try { Vibration.cancel(); } catch {}
      try { ringtone.pause(); } catch {}
      try { (ringtone as any).loop = false; } catch {}
    };
  }, [incoming, ringtone]);

  if (!incoming) return null;

  const onReject = () => {
    socket?.emit("reject_call", { call_id: callId, target_user_id: callerId });
    setIncoming(null);
  };

  const onAccept = () => {
    socket?.emit("accept_call", { call_id: callId, target_user_id: callerId });
    setIncoming(null);
    router.push({
      pathname: "/call",
      params: {
        callId,
        targetUserId: callerId,
        targetName: callerName,
        isVideo: isVideo.toString(),
        isCaller: "false",
      },
    });
  };

  return (
    <IncomingCallSheet
      visible={!!incoming}
      callerName={callerName}
      isVideo={isVideo}
      onAccept={onAccept}
      onReject={onReject}
    />
  );
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SocketProvider>
        <KeyboardProvider>
          <ThemeProviderCustom>
            <RootNavigator />
          </ThemeProviderCustom>
        </KeyboardProvider>
      </SocketProvider>
    </GestureHandlerRootView>
  );
}