export type DeviceInfo = {
    device_id: string;
    device_type: "ios" | "android" | "windows" | "macos" | "web";
    device_model: string;
    os_version: string;
    app_version: string;
    is_simulator: boolean;
  };