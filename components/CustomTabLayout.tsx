import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '@/context/ThemeContext';
import { useTheme } from '@react-navigation/native';

type CustomTabLayoutProps = BottomTabBarProps;

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: Readonly<CustomTabLayoutProps>) {
  const { colors } = useTheme();

  const { accentColor } = useAppTheme();

  const animatedColor = useRef(new Animated.Value(0)).current;
  const previousColor = useRef(accentColor);

  useEffect(() => {
    animatedColor.setValue(0);

    Animated.timing(animatedColor, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

  }, [accentColor, animatedColor]);

  const interpolatedColor = animatedColor.interpolate({
    inputRange: [0, 1],
    outputRange: [previousColor.current, accentColor],
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [friendId, setFriendId] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // After render update previousColor
  useEffect(() => {
    previousColor.current = accentColor;
  }, [accentColor]);

  const focusedOptions = descriptors[state.routes[state.index].key]?.options;

  if (focusedOptions?.tabBarStyle === null) {
    return null;
  }

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    if (isSending) return;
    setIsModalVisible(false);
  };

  const handleStartChat = async () => {
    const trimmedId = friendId.trim();
    const trimmedMessage = initialMessage.trim();

    if (!trimmedId || isSending) {
      return;
    }

    try {
      setIsSending(true);

      // TODO: Hook this into your actual "start conversation" / messaging flow.
      navigation.navigate('index', {
        friendId: trimmedId,
        initialMessage: trimmedMessage,
      });

      setFriendId('');
      setInitialMessage('');
      setIsModalVisible(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key] ?? {};
          let label;

          if (options?.tabBarLabel) {
            label = options.tabBarLabel;
          } else if (options?.title) {
            label = options.title;
          } else {
            label = route.name;
          }

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              android_ripple={{ radius: 100, borderless: true, color: 'rgba(255, 255, 255, 0.1)' }}
            >
              <View style={styles.tabContent}>
                {options?.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused ? accentColor : '#999999',
                  size: 24,
                })}
                {typeof label === 'string' && (
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? accentColor : '#999999' },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Floating Plus Button */}
      <Pressable
        style={styles.plusButton}
        onPress={handleOpenModal}
      >
        <Animated.View style={[styles.plusButtonInner, { backgroundColor: interpolatedColor }]}>
          <Ionicons name="add" size={28} color="white" />
        </Animated.View>
      </Pressable>

      {/* New Chat Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalContainer}
          >
            <Pressable style={styles.modalOverlayPressable} onPress={handleCloseModal} />

            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Start a new chat
              </Text>

              <Text style={[styles.modalSubtitle, { color: colors.text }]}>
                Enter your friend&apos;s Connect ID and send your first message.
              </Text>

              <TextInput
                value={friendId}
                onChangeText={setFriendId}
                placeholder="Friend&apos;s Connect ID"
                placeholderTextColor='#94A3B8'
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    borderColor: accentColor,
                    color: colors.text,
                  },
                ]}
              />

              <TextInput
                value={initialMessage}
                onChangeText={setInitialMessage}
                placeholder="Say hi 👋 (optional)"
                placeholderTextColor='#94A3B8'
                multiline
                style={[
                  styles.input,
                  styles.messageInput,
                  {
                    borderColor: accentColor,
                    color: colors.text,
                  },
                ]}
              />

              <View style={styles.modalButtonsRow}>
                <Pressable
                  style={[styles.modalButton, styles.modalSecondaryButton]}
                  onPress={handleCloseModal}
                  disabled={isSending}
                >
                  <Text style={[styles.modalButtonText, styles.modalSecondaryButtonText]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalButton,
                    styles.modalPrimaryButton,
                    {
                      opacity: !friendId.trim() || isSending ? 0.6 : 1,
                      backgroundColor: accentColor,
                    },
                  ]}
                  onPress={handleStartChat}
                  disabled={!friendId.trim() || isSending}
                >
                  <Text style={[styles.modalButtonText, styles.modalPrimaryButtonText]}>
                    {isSending ? 'Sending…' : 'Send'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e000',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
  },
  plusButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayPressable: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalSecondaryButton: {
    backgroundColor: 'transparent',
  },
  modalSecondaryButtonText: {
    color: '#999',
  },
  modalPrimaryButton: {},
  modalPrimaryButtonText: {
    color: '#fff',
  },
});
