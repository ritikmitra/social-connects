import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Linking from "expo-linking";

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

  // Permanently denied
  return {
    granted: false,
    canAskAgain: false,
    openSettings: () => Linking.openSettings(),
  };
}

export async function getNotificationPermissionStatus() {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();

  return {
    status,
    canAskAgain,
  };
}