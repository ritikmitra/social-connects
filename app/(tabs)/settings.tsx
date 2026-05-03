import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  ToastAndroid,
  AppState
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useAppTheme } from '@/context/ThemeContext';
import { useTheme } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { logoutApi } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { copyFriendId, shareFriendId } from '@/utils/share';
import { requestNotificationPermission } from '@/logic/notificationPermission';
import * as Notifications from 'expo-notifications';


interface RowProps {
  title: string;
  value: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

const handleNotificationPress = async () => {
  const result = await requestNotificationPermission();

  if (result.granted) {
    return;
  }

  if (result.openSettings) {
    ToastAndroid.show(
      "Enable notifications from settings",
      ToastAndroid.SHORT
    );

    result.openSettings();
  }
};

const Row = ({ title, value, onPress, colors }: RowProps) => (
  <Pressable
    style={[
      styles.row,
      { backgroundColor: colors.card },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.rowTitle, { color: colors.text }]}>
      {title}
    </Text>

    <View style={styles.rowRight}>
      <Text style={{ color: colors.primary, marginRight: 6 }}>
        {value}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.border}
      />
    </View>
  </Pressable>
);

export default function SettingsScreen() {
  const { mode, setMode, accentColor, setAccentColor } = useAppTheme();
  const { colors } = useTheme();
  const router = useRouter();

  const [notificationStatus, setNotificationStatus] = useState("Disabled");
  const appState = useRef(AppState.currentState);


  const [visible, setVisible] = useState(false);
  const [sheetType, setSheetType] = useState<'theme' | 'color' | null>(null);
  const [copied, setCopied] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleCopyId = async () => {
    if (!user) return;

    await copyFriendId(user.id);
    ToastCopiedId();
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const ToastCopiedId = () => {
    ToastAndroid.showWithGravity(
      'You\'ve copied your connect ID',
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
    );
  }

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    console.log("Permission status:", status);
    setNotificationStatus(status === "granted" ? "Enabled" : "Disabled");
  };

  useEffect(() => {
    // Initial check
    checkNotificationPermission();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to foreground, re-check permissions
        checkNotificationPermission();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  const openSheet = (type: 'theme' | 'color') => {
    setSheetType(type);
    setVisible(true);
  };

  const closeSheet = () => setVisible(false);

  const themeOptions = [
    { label: 'System Default', value: 'system' },
    { label: 'Light Mode', value: 'light' },
    { label: 'Dark Mode', value: 'dark' },
  ];

  const colorOptions = [
    '#007AFF',
    '#FF3B30',
    '#34C759',
    '#AF52DE',
    '#FF9500',
    '#ff57c4',
  ];

  const handleLogout = async () => {
    await logoutApi();
    await logout();
    router.replace('/auth/email');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {user && (
        <View style={[styles.inviteCard, { backgroundColor: colors.card }]}>

          {/* USER HEADER */}
          <View style={styles.userHeader}>

            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: colors.primary + "30" }]}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </Text>
            </View>

            {/* USER INFO */}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user.first_name} {user.last_name}
              </Text>

              <Text style={[styles.email, { color: colors.text }]}>
                {user.email}
              </Text>
            </View>

          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => shareFriendId(user.id)}
            >
              <Feather name="share" size={16} color="#fff" />
              <Text style={styles.actionText}>Share</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButtonOutline, { borderColor: colors.primary }]}
              onPress={handleCopyId}
            >
              <Feather
                name={copied ? "check" : "copy"}
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.actionTextOutline, { color: colors.primary }]}>
                {copied ? "Copied" : "Copy ID"}
              </Text>
            </Pressable>

          </View>

        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Appearance
      </Text>

      <Row
        title="Theme"
        value={mode}
        onPress={() => openSheet('theme')}
        colors={colors}
      />

      <Row
        title="Accent Color"
        value=""
        onPress={() => openSheet('color')}
        colors={colors}
      />

      <Row
        title="Notifications"
        value={notificationStatus}
        onPress={handleNotificationPress}
        colors={colors}
      />

      <Pressable
        style={[styles.row, { backgroundColor: colors.card, overflow: 'hidden' }]}
        onPress={handleLogout}
        android_ripple={{
          color: 'rgba(0,0,0,0.1)',
          borderless: false,
          foreground: true,
        }}
      >
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '500' }}>
          Log Out
        </Text>
      </Pressable>

      {/* Bottom Sheet */}
      <Modal transparent visible={visible} animationType="none">
        <Pressable style={styles.overlay} onPress={closeSheet}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {sheetType === 'theme' &&
              themeOptions.map(option => (
                <Pressable
                  key={option.value}
                  style={styles.sheetItem}
                  onPress={() => {
                    setMode(option.value as any);
                    closeSheet();
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                    }}
                  >
                    {option.label}
                  </Text>

                  {mode === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}

            {sheetType === 'color' &&
              colorOptions.map(color => (
                <Pressable
                  key={color}
                  style={styles.sheetItem}
                  onPress={() => {
                    setAccentColor(color);
                    closeSheet();
                  }}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                    ]}
                  />

                  {accentColor === color && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    elevation: 2,
  },
  profileEmail: {
    fontSize: 14,
    opacity: 0.7,
  },

  shareButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  row: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetItem: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  inviteCard: {
    padding: 18,
    borderRadius: 16,
    marginTop: 0,
    elevation: 2,
  },

  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 16,
    fontWeight: "700",
  },

  email: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },

  userId: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },

  actionButtonOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },

  actionText: {
    color: "#fff",
    fontWeight: "600",
  },

  actionTextOutline: {
    fontWeight: "600",
  },
});