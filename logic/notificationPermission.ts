import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import * as Application from "expo-application";

export type NotificationPermissionResult =
  | { granted: true; token: string }
  | { granted: false; canAskAgain: boolean; openSettings?: () => void };

export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  if (!Device.isDevice) {
    return { granted: false, canAskAgain: false };
  }

  const { status, canAskAgain } = await Notifications.getPermissionsAsync();

  // Already granted
  if (status === "granted") {
    const token = await Notifications.getDevicePushTokenAsync();
    return {
      granted: true,
      token: token.data,
    };
  }

  // Ask permission
  if (canAskAgain) {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();

    if (newStatus === "granted") {
      const token = await Notifications.getDevicePushTokenAsync();
      return {
        granted: true,
        token: token.data,
      };
    }

    return { granted: false, canAskAgain: true };
  }

  const openSettings = async () => {
    const packageName = Application.applicationId;
    
    if (Platform.OS === "android") {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS, {
        extra: {
          "android.provider.extra.APP_PACKAGE": packageName,
        }
      }
      );
    } else {
      await Linking.openSettings();
    }
  };


  // Permanently denied
  return {
    granted: false,
    canAskAgain: false,
    openSettings: openSettings,
  };
}

export async function getNotificationPermissionStatus() {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();

  return {
    status,
    canAskAgain,
  };
}