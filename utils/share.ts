import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";

export async function shareFriendId(friendId: string) {
    const link = `connects://add-friend/${friendId}`;
    await Share.share({
        message: `Add me on Connects 👋

Friend ID: ${friendId}
        
Tap this link in apps that support it:

${link}
        
Or copy & paste it manually.`,
    });
}

export async function copyFriendId(friendId: string) {
    return await Clipboard.setStringAsync(friendId);
}