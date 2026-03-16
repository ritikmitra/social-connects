import {
    StyleSheet,
    View,
    Text,
    Platform,
    ActivityIndicator,
    Linking,
    Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import {
    GiftedChat,
    IMessage,
    Bubble,
    Send,
    InputToolbar,
    BubbleProps,
    SendProps,
    InputToolbarProps,
    Actions,
    ActionsProps,
    Day,
    DayProps,
    SystemMessage,
    SystemMessageProps,
    MessageText,
    MessageTextProps,
    Time,
    TimeProps,
    Composer,
    ComposerProps,
} from "react-native-gifted-chat";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { getConversationMessagesApi } from "@/services/message.service";
import { useAppTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/context/socket.context";
import { useChatStore } from "@/store/chat.store";
import { useSafeAreaInsets } from "react-native-safe-area-context";


// ─── Constants ────────────────────────────────────────────────────────────────

const BUBBLE_RADIUS = 20;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatScreen() {
    const { conversationId, firstName, lastName, receiverId } =
        useLocalSearchParams<{
            conversationId: string;
            firstName?: string;
            lastName?: string;
            receiverId: string;
        }>();

    const insets = useSafeAreaInsets();

    const { accentColor, theme } = useAppTheme();
    const { user } = useAuthStore();
    const { socket } = useSocket();

    const { messages, setMessages, addMessage, hasLoaded, markLoaded } =
        useChatStore();

    // ── Local state
    const [isTyping, setIsTyping] = useState(false);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentUserId = user?.id ?? "unknown";
    const isDark = theme.dark;

    const displayName =
        `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Contact";
    const initials = `${(firstName?.[0] ?? "").toUpperCase()}${(
        lastName?.[0] ?? ""
    ).toUpperCase()}` || "?";


    const setMessagesRef = useRef(setMessages);
    const addMessageRef = useRef(addMessage);
    const markLoadedRef = useRef(markLoaded);
    useEffect(() => { setMessagesRef.current = setMessages; }, [setMessages]);
    useEffect(() => { addMessageRef.current = addMessage; }, [addMessage]);
    useEffect(() => { markLoadedRef.current = markLoaded; }, [markLoaded]);

    const rawMessages = useMemo(
        () => messages[conversationId] ?? [],
        [messages, conversationId]
    );

    // ─── Transform messages → GiftedChat IMessage ─────────────────────────────

    const formattedMessages: IMessage[] = useMemo(
        () =>
            rawMessages.map((msg) => ({
                _id: msg.id,
                text: msg.content,
                createdAt: new Date(msg.created_at),
                user: {
                    _id: msg.sender_id,
                    name: msg.sender_id === currentUserId ? "You" : "Contact",
                    avatar: undefined,
                },
                sent: true,
                received: msg.sender_id === currentUserId,
                pending: false,
            })),
        [rawMessages, currentUserId]
    );

    // ─── Load initial messages ─────────────────────────────────────────────────

    useEffect(() => {
        if (!conversationId || hasLoaded[conversationId]) return;
        const load = async () => {
            const data = await getConversationMessagesApi(conversationId);
            setMessagesRef.current(conversationId, data.messages);
            markLoadedRef.current(conversationId);
        };
        load();
    }, [conversationId, hasLoaded]);

    // ─── Socket: join room + receive messages + typing ────────────────────────

    useEffect(() => {
        if (!socket || !conversationId) return;

        socket.emit("join_conversation", { conversation_id: conversationId });

        const handleMessage = (msg: any) => {
            if (msg.conversation_id !== conversationId) return;
            addMessageRef.current(conversationId, {
                id: msg.message_id,
                content: msg.content,
                sender_id: msg.from,
                created_at: msg.created_at,
            });
            setIsTyping(false);
        };

        const handleTyping = (data: any) => {
            if (data.conversation_id !== conversationId) return;
            setIsTyping(true);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
        };

        const handleStopTyping = (data: any) => {
            if (data.conversation_id !== conversationId) return;
            setIsTyping(false);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };

        socket.on("receive_message", handleMessage);
        socket.on("typing", handleTyping);
        socket.on("stop_typing", handleStopTyping);

        return () => {
            socket.off("receive_message", handleMessage);
            socket.off("typing", handleTyping);
            socket.off("stop_typing", handleStopTyping);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
    }, [socket, conversationId]);

    // ─── Send message ──────────────────────────────────────────────────────────

    const onSend = useCallback(
        (msgs: IMessage[] = []) => {
            const text = msgs[0]?.text?.trim();
            if (!text || !socket) return;

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

            addMessageRef.current(conversationId, {
                id: msgs[0]._id.toString(),
                content: text,
                sender_id: currentUserId,
                created_at: new Date().toISOString(),
            });

            socket.emit("send_message", {
                receiver_id: receiverId,
                content: text,
                conversation_id: conversationId,
            });

            socket.emit("stop_typing", { conversation_id: conversationId });
        },
        [socket, conversationId, receiverId, currentUserId]
    );

    // ─── Typing broadcast ──────────────────────────────────────────────────────

    const onInputTextChanged = useCallback(
        (text: string) => {
            if (!socket) return;
            socket.emit(text.length > 0 ? "typing" : "stop_typing", {
                conversation_id: conversationId,
            });
        },
        [socket, conversationId]
    );

    const onPressAttach = useCallback(async () => {
        return null;
    }, []);

    // ─── Render: Bubble ────────────────────────────────────────────────────────

    const renderBubble = useCallback(
        (props: BubbleProps<IMessage>) => (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: accentColor,
                        borderRadius: BUBBLE_RADIUS,
                        borderBottomRightRadius: 4,
                        paddingHorizontal: 2,
                        marginBottom: 2,
                        shadowColor: accentColor,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 3,
                    },
                    left: {
                        backgroundColor: isDark ? "#252634" : "#FFFFFF",
                        borderRadius: BUBBLE_RADIUS,
                        borderBottomLeftRadius: 4,
                        paddingHorizontal: 2,
                        marginBottom: 2,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 3,
                        elevation: 2,
                    },
                }}
                textStyle={{
                    right: { color: "#FFFFFF", fontSize: 15, lineHeight: 21 },
                    left: {
                        color: theme.colors.text,
                        fontSize: 15,
                        lineHeight: 21,
                    },
                }}
                tickStyle={{ color: "rgba(255,255,255,0.75)" }}
                usernameStyle={{ color: "#888", fontSize: 12, fontWeight: "600" }}
                containerStyle={{
                    left: { marginLeft: 4 },
                    right: { marginRight: 4 },
                }}
            />
        ),
        [accentColor, isDark, theme.colors.text]
    );


    const renderMessageText = useCallback(
        (props: MessageTextProps<IMessage>) => {
            const linkColor =
                props.position === "right"
                    ? "#cce8ff"
                    : accentColor;
            const extraProps: any = {
                parsePatterns: () => [
                    {
                        type: "url",
                        style: {
                            textDecorationLine: "underline",
                            color: linkColor,
                        },
                        onPress: (url: string) => Linking.openURL(url),
                    },
                    {
                        type: "phone",
                        style: {
                            textDecorationLine: "underline",
                            color: linkColor,
                        },
                        onPress: (phone: string) =>
                            Linking.openURL(`tel:${phone}`),
                    },
                ],
            };
            return <MessageText {...props} {...extraProps} />;
        },
        [accentColor]
    );


    const renderTime = useCallback(
        (props: TimeProps<IMessage>) => (
            <Time
                {...props}
                timeTextStyle={{
                    right: { color: "rgba(255,255,255,0.65)", fontSize: 11 },
                    left: {
                        color: isDark ? "#BBBBBB" : "#AAAAAA",
                        fontSize: 11,
                    },
                }}
            />
        ),
        [isDark]
    );



    const renderDay = useCallback(
        (props: DayProps) => (
            <Day
                {...props}
                wrapperStyle={{
                    backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(107, 105, 105, 0.47)",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    marginVertical: 8,
                }}
            />
        ),
        [isDark]
    );

    const renderSystemMessage = useCallback(
        (props: SystemMessageProps<IMessage>) => (
            <SystemMessage
                {...props}
                containerStyle={styles.systemMsgContainer}
                textStyle={[
                    styles.systemMsgText,
                    isDark && {
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "#CCCCCC",
                    },
                ]}
            />
        ),
        [isDark]
    );

    // ─── Render: Typing footer ─────────────────────────────────────────────────

    const renderFooter = useCallback(() => {
        if (!isTyping) return null;
        return (
            <View style={styles.typingContainer}>
                <View
                    style={[
                        styles.typingBubble,
                        {
                            backgroundColor: isDark ? "#252634" : "#FFFFFF",
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.typingDot,
                            { backgroundColor: isDark ? "#888888" : "#BBBBBB" },
                        ]}
                    />
                    <View
                        style={[
                            styles.typingDot,
                            { backgroundColor: isDark ? "#888888" : "#BBBBBB" },
                        ]}
                    />
                    <View
                        style={[
                            styles.typingDot,
                            { backgroundColor: isDark ? "#888888" : "#BBBBBB" },
                        ]}
                    />
                </View>
                <Text
                    style={[
                        styles.typingLabel,
                        { color: isDark ? "#888888" : "#AAAAAA" },
                    ]}
                >
                    typing…
                </Text>
            </View>
        );
    }, [isTyping, isDark]);

    // ─── Render: Empty state ───────────────────────────────────────────────────

    const renderChatEmpty = useCallback(
        () => (
            <View style={styles.emptyContainer}>
                <View
                    style={[
                        styles.emptyIcon,
                        { backgroundColor: `${accentColor}18` },
                    ]}
                >
                    <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={40}
                        color={accentColor}
                    />
                </View>
                <Text
                    style={[styles.emptyTitle, { color: theme.colors.text }]}
                >
                    No messages yet
                </Text>
                <Text
                    style={[
                        styles.emptySubtitle,
                        {
                            color: isDark ? "#999999" : "#888888",
                        },
                    ]}
                >
                    Send a message to start the conversation
                </Text>
            </View>
        ),
        [accentColor, theme.colors.text, isDark]
    );

    // ─── Render: Actions (attach) ──────────────────────────────────────────────
    // ActionsProps uses `wrapperStyle`, NOT `containerStyle`.

    const renderActions = useCallback(
        (props: ActionsProps) => (
            <Actions
                {...props}
                wrapperStyle={styles.actionsWrapper}
                icon={() => (
                    <View style={[styles.attachBtn, { backgroundColor: `${accentColor}15` }]}>
                        <Ionicons name="add" size={22} color={accentColor} />
                    </View>
                )}
                onPressActionButton={onPressAttach}
            />
        ),
        [accentColor, onPressAttach]
    );

    // ─── Render: Composer ──────────────────────────────────────────────────────
    // ComposerProps does NOT have `textInputStyle` — use `textInputProps.style`.

    const renderComposer = useCallback(
        (props: ComposerProps) => (
            <Composer
                {...props}
                textInputProps={{
                    ...props.textInputProps,
                    onChangeText: (text: string) => {
                        props.textInputProps?.onChangeText?.(text);
                        onInputTextChanged(text);
                    },
                    style: [
                        styles.composerInput,
                        { color: isDark ? "#FFFFFF" : "#1A1A2E" },
                        props.textInputProps?.style,
                    ],
                    placeholderTextColor: isDark ? "#777777" : "#AAAAAA",
                    placeholder: "Type a message…",
                    multiline: true,
                }}
            />
        ),
        [isDark, onInputTextChanged]
    );

    // ─── Render: Send button ───────────────────────────────────────────────────
    // SendProps does NOT have `disabled` — control appearance via text presence.

    const renderSend = useCallback(
        (props: SendProps<IMessage>) => {
            const hasText = !!props.text?.trim();
            return (
                <Send {...props} containerStyle={styles.sendContainer}>
                    <View
                        style={[
                            styles.sendButton,
                            {
                                backgroundColor: accentColor,
                                opacity: hasText ? 1 : 0.4,
                            },
                        ]}
                    >
                        <Ionicons
                            name="send"
                            size={16}
                            color={hasText ? "white" : "#E0E0E0"}
                        />
                    </View>
                </Send>
            );
        },
        [accentColor]
    );

    // ─── Render: Input toolbar ─────────────────────────────────────────────────

    const renderInputToolbar = useCallback(
        (props: InputToolbarProps<IMessage>) => (
            <InputToolbar
                {...props}
                containerStyle={[
                    styles.inputToolbar,
                    {
                        backgroundColor: isDark ? "#1F212E" : "#FFFFFF",
                        borderColor: isDark ? "#2C2F3F" : "transparent",
                        borderWidth: isDark ? 1 : 0,
                        shadowOpacity: isDark ? 0.25 : 0.08,
                    },
                ]}
                primaryStyle={styles.inputPrimary}
            />
        ),
        [isDark]
    );

    // ─── Render: Loading ───────────────────────────────────────────────────────

    const renderLoading = useCallback(
        () => (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={accentColor} />
            </View>
        ),
        [accentColor]
    );

    // ─── JSX ───────────────────────────────────────────────────────────────────

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: theme.colors.card,
                        borderBottomColor: isDark ? "#2C2F3F" : "#E5E5E5",
                    },
                ]}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={styles.headerBackButton}
                    hitSlop={10}
                >
                    <Ionicons
                        name="chevron-back"
                        size={22}
                        color={theme.colors.text}
                    />
                </Pressable>

                <View style={styles.headerAvatar}>
                    <Text style={styles.headerAvatarText}>{initials}</Text>
                </View>

                <View style={styles.headerTextContainer}>
                    <Text
                        style={[styles.headerTitle, { color: theme.colors.text }]}
                        numberOfLines={1}
                    >
                        {displayName}
                    </Text>
                    <Text
                        style={[
                            styles.headerSubtitle,
                            { color: isDark ? "#A0A0A0" : "#666666" },
                        ]}
                        numberOfLines={1}
                    >
                        Chat
                    </Text>
                </View>
            </View>

            <GiftedChat
                // Core
                messages={formattedMessages}
                onSend={onSend}
                user={{ _id: currentUserId }}
                colorScheme={isDark ? "dark" : "light"}
                isTyping={isTyping}
                renderAvatar={null}
                isUserAvatarVisible={false}
                isAvatarVisibleForEveryMessage={false}
                isUsernameVisible={false}
                renderBubble={renderBubble}
                renderSend={renderSend}
                renderInputToolbar={renderInputToolbar}
                renderActions={renderActions}
                renderComposer={renderComposer}
                renderMessageText={renderMessageText}
                renderTime={renderTime}
                renderDay={renderDay}
                renderSystemMessage={renderSystemMessage}
                renderFooter={renderFooter}
                renderChatEmpty={renderChatEmpty}
                renderLoading={renderLoading}
                // Container
                keyboardAvoidingViewProps={{
                    behavior: Platform.OS === "ios" ? "padding" : "height",
                    keyboardVerticalOffset: insets.top * 3,
                }}
                messagesContainerStyle={[
                    styles.messagesContainer,
                    { backgroundColor: theme.colors.background },
                ]}
            />
        </View>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F2F5",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerBackButton: {
        paddingRight: 8,
        paddingVertical: 4,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        backgroundColor: "#4C6FFF",
    },
    headerAvatarText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
    headerTextContainer: {
        flex: 1,
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    messagesContainer: {
        paddingBottom: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    // Empty state — scaleY: -1 corrects the inverted FlatList flip
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A1A2E",
        marginBottom: 6,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        lineHeight: 20,
    },

    systemMsgContainer: {
        marginVertical: 6,
        alignItems: "center",
    },
    systemMsgText: {
        fontSize: 12,
        color: "#999",
        backgroundColor: "rgba(0,0,0,0.05)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        overflow: "hidden",
    },

    typingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 6,
    },
    typingBubble: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },
    typingDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: "#BBBBBB",
    },
    typingLabel: {
        fontSize: 12,
        color: "#AAAAAA",
        fontStyle: "italic",
    },

    scrollToBottom: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },

    inputToolbar: {
        marginHorizontal: 10,
        marginBottom: Platform.OS === "ios" ? 8 : 10,
        marginTop: 4,
        borderRadius: 28,
        borderTopWidth: 0,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        minHeight: 52,
    },
    inputPrimary: {
        alignItems: "center",
        minHeight: 52,
        paddingHorizontal: 4,
    },

    // gifted-chat Actions uses `wrapperStyle`, not `containerStyle`
    actionsWrapper: {
        width: 44,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 4,
        marginBottom: 0,
    },
    attachBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },

    composerInput: {
        fontSize: 15,
        lineHeight: 20,
        color: "#1A1A2E",
        paddingTop: Platform.OS === "ios" ? 16 : 12,
        paddingBottom: Platform.OS === "ios" ? 16 : 12,
        marginLeft: 4,
        flex: 1,
    },

    sendContainer: {
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
});