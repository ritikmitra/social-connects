import {
    View,
    Text,
    FlatList,
    TextInput,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons"; // Ensure you have expo/vector-icons

import { getConversationMessagesApi } from "@/services/message.service";
import { useAppTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/context/socket.context";
import { useChatStore } from "@/store/chat.store";

export default function ChatScreen() {
    const { conversationId } = useLocalSearchParams();
    const { accentColor } = useAppTheme();
    const { user } = useAuthStore();
    const { socket } = useSocket();

    const flatListRef = useRef<FlatList>(null);
    const currentUserId = user?.id;
    const [input, setInput] = useState("");

    const { messages, setMessages, addMessage, hasLoaded, markLoaded } = useChatStore();
    const conversationMessages = messages[conversationId as string] || [];

    useEffect(() => {
        const loadMessages = async () => {
            if (hasLoaded[conversationId as string]) return;
            const data = await getConversationMessagesApi(conversationId as string);
            setMessages(conversationId as string, [...data.messages].reverse());
            markLoaded(conversationId as string);
        };
        loadMessages();
    }, [conversationId]);

    // Handle Socket
    useEffect(() => {
        if (!socket) return;
        socket.emit("join_conversation", { conversation_id: conversationId });

        const handleMessage = (msg: any) => {
            if (msg.conversation_id === conversationId) {
                addMessage(conversationId as string, {
                    id: msg.message_id,
                    content: msg.content,
                    sender_id: msg.from,
                    created_at: msg.created_at,
                });
            }
        };

        socket.on("receive_message", handleMessage);
        return () => {
            socket.off("receive_message", handleMessage);
        };
    }, [socket, conversationId]);

    const receiverId = conversationMessages.find((m) => m.sender_id !== currentUserId)?.sender_id;

    const sendMessage = () => {
        if (!input.trim() || !socket) return;

        const newMsg = {
            id: Math.random().toString(), // Improved temp ID
            content: input.trim(),
            sender_id: currentUserId!,
            created_at: new Date().toISOString(),
        };

        addMessage(conversationId as string, newMsg);
        socket.emit("send_message", {
            receiver_id: receiverId,
            content: input.trim(),
        });

        setInput("");
    };

    const renderItem = ({ item }: any) => {
        const isSentByMe = item.sender_id === currentUserId;

        return (
            <View style={[styles.messageWrapper, isSentByMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                <View style={[styles.messageBubble, isSentByMe ? { backgroundColor: accentColor } : styles.receivedBubble]}>
                    <Text style={[styles.messageText, isSentByMe ? styles.sentText : styles.receivedText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.timeText, isSentByMe ? styles.sentTime : styles.receivedTime]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View
            style={styles.container}
        >
            <FlatList
                ref={flatListRef}
                data={conversationMessages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.inputArea}>
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Message..."
                    placeholderTextColor="#999"
                    style={styles.input}
                    multiline
                />
                <Pressable
                    onPress={sendMessage}
                    disabled={!input.trim()}
                    style={[styles.sendButton, { backgroundColor: input.trim() ? accentColor : '#E0E0E0' }]}
                >
                    <Ionicons name="send" size={18} color="white" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        paddingBottom: 20,
    },
    messageWrapper: {
        width: '100%',
        marginBottom: 12,
    },
    messageBubble: {
        maxWidth: "80%",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    receivedBubble: {
        backgroundColor: "white",
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    sentText: {
        color: "white",
    },
    receivedText: {
        color: "#1C1C1C",
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: "flex-end",
    },
    sentTime: {
        color: "rgba(255,255,255,0.7)",
    },
    receivedTime: {
        color: "#999",
    },
    inputArea: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#EEE",
    },
    input: {
        flex: 1,
        backgroundColor: "#F1F3F5",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 16,
        maxHeight: 100,
        color: "#000",
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 10,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 2,
    },
});