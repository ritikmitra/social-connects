import { useEffect, useState } from "react";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { Platform } from "react-native";
import { DeviceInfo } from "@/types/device";


export const useDeviceInfo = (): DeviceInfo => {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
        device_id: Device.osBuildId ?? Device.modelId ?? "unknown",
        device_type: Platform.OS as DeviceInfo["device_type"],
        device_model: Device.modelName ?? "unknown",
        os_version: Device.osVersion ?? "unknown",
        app_version: Application.nativeApplicationVersion ?? "unknown",
        is_simulator: !Device.isDevice,
    });

    useEffect(() => {
        const loadDeviceId = async () => {
            setDeviceInfo((prev) => ({ ...prev }));
        };
        loadDeviceId();
    }, []);

    return deviceInfo;
};