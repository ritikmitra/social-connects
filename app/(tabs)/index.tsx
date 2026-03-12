import { View, Text, StyleSheet, FlatList, Pressable, AppState } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { getConversationsApi, registerForNotificationsApi } from '@/services/message.service';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@react-navigation/native';
import { formatTime } from '@/utils/dateTime';
import { router } from 'expo-router';
import { useSocket } from "@/context/socket.context";
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { getFCMToken } from '@/utils/pushNotification';

export default function HomeScreen() {
  const { accentColor } = useAppTheme();
  const { colors } = useTheme();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const appState = useRef(AppState.currentState);


  useEffect(() => {
    const fetchConversations = async () => {
      const data = await getConversationsApi();
      setConversations(data);
    };
    fetchConversations();
  }, []);
  const deviceInfo = useDeviceInfo();


  useEffect(() => {
    // Initial registration

    const registerDevice = async () => {
      if (deviceInfo.is_simulator) return;
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await registerForNotificationsApi(
          deviceInfo.device_id,
          deviceInfo.device_type,
          deviceInfo.device_model,
          deviceInfo.os_version,
          deviceInfo.app_version,
          fcmToken
        );
      }
    };
    registerDevice();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came back to foreground, re-register
        registerDevice();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [deviceInfo]);

  // Listen for incoming messages globally
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg: any) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === msg.conversation_id
            ? {
              ...c,
              last_message: { content: msg.content, created_at: msg.created_at },
              unread_count: c.unread_count + 1,
            }
            : c
        )
      );
    };

    socket.on("receive_message", handleMessage);
    return () => {
      socket.off("receive_message", handleMessage);
    };
  }, [socket]);

  const getInitials = (first?: string, last?: string) => {
    const f = first ? first[0].toUpperCase() : "";
    const l = last ? last[0].toUpperCase() : "";
    return `${f}${l}` || "?";
  };

  const handleConversationClick = (conversationId: string) => {
    router.push({
      pathname: "/chat/[conversationId]",
      params: { conversationId },
    });
  };

  const renderItem = ({ item }: any) => {
    const { user, last_message, unread_count } = item;

    return (
      <Pressable style={styles.row} onPress={() => handleConversationClick(item.conversation_id)}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: accentColor }]}>
          <Text style={styles.avatarText}>
            {getInitials(user?.first_name, user?.last_name)}
          </Text>
        </View>

        {/* Conversation Info */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.first_name || "Unknown"} {user?.last_name || ""}
          </Text>

          <Text style={{ color: colors.text, opacity: 0.6 }}>
            {last_message?.content}
          </Text>
        </View>

        {/* Right Side (time + unread) */}
        <View style={styles.rightSection}>
          <Text style={[styles.time, { color: colors.text }]}>
            {formatTime(last_message?.created_at)}
          </Text>

          {unread_count > 0 && (
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{unread_count}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.conversation_id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 9,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "white",
    fontWeight: "600",
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },

  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  rightSection: {
    alignItems: "flex-end",
  },

  time: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
});