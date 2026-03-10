import { useState } from "react";
import { requestNotificationPermission } from "@/logic/notificationPermission";

export function useNotificationPermission() {
  const [loading, setLoading] = useState(false);

  const enableNotifications = async () => {
    setLoading(true);

    try {
      const result = await requestNotificationPermission();
      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    enableNotifications,
    loading,
  };
}