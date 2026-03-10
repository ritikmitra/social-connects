import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';


export async function getFCMToken() {

    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        console.log('Push notifications disabled in Expo Go / dev client');
        return null;
    }
    if (!Device.isDevice) {
        return null;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log("Permission not granted");
        return;
    }
    const pushToken = await Notifications.getDevicePushTokenAsync();
    return pushToken.data;
}