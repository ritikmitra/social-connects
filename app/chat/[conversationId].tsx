import { View, Text, FlatList, TextInput, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { getConversationMessagesApi } from '@/services/message.service';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';

export default function ChatScreen() {
    const { conversationId } = useLocalSearchParams();
    const { accentColor } = useAppTheme();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const { user } = useAuthStore();
    const currentUserId = user?.id;

    useEffect(() => {
        const fetchMessages = async () => {
            const data = await getConversationMessagesApi(conversationId as string);
            setMessages(data.messages.reverse());
        };
        fetchMessages();
    }, [conversationId]);

    const sendMessage = () => {
        if (!input.trim()) return;

        const newMsg = {
            id: Date.now().toString(),
            content: input,
            sender_id: currentUserId,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);
        setInput('');

        // Scroll to bottom
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    const renderItem = ({ item }: any) => {
        const isSentByMe = item.sender_id === currentUserId;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isSentByMe ? styles.sentMessage : styles.receivedMessage,
                ]}
            >
                <Text style={styles.messageText}>{item.content}</Text>
                <Text style={styles.timeText}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <View
            style={styles.container}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Input Bar */}
            <View style={styles.inputContainer}>
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type a message..."
                    style={styles.input}
                />
                <Pressable onPress={sendMessage} style={[styles.sendButton, { backgroundColor: accentColor }]}>
                    <Text style={styles.sendText}>Send</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },

    messageContainer: {
        maxWidth: '75%',
        marginVertical: 4,
        padding: 10,
        borderRadius: 10,
    },

    sentMessage: {
        backgroundColor: '#DCF8C6',
        alignSelf: 'flex-end',
        borderTopRightRadius: 0,
    },

    receivedMessage: {
        backgroundColor: 'white',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0,
    },

    messageText: { fontSize: 16, color: '#000' },

    timeText: { fontSize: 10, color: '#555', alignSelf: 'flex-end', marginTop: 4 },

    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 8,
        backgroundColor: 'white',
    },

    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 16,
    },

    sendButton: {
        marginLeft: 8,
        borderRadius: 20,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sendText: { color: 'white', fontWeight: '600' },
});