import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Platform, StyleSheet, Text, View, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type CustomTabLayoutProps = BottomTabBarProps;

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabLayoutProps) {
  const focusedOptions = descriptors[state.routes[state.index].key]?.options;

  if (focusedOptions?.tabBarStyle === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key] ?? {};
          const label =
            options?.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options?.title !== undefined
                ? options.title
                : route.name;

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
                {options?.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? '#007AFF' : '#999999',
                    size: 24,
                  })}
                {typeof label === 'string' && (
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? '#007AFF' : '#999999' },
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
        onPress={() => {
          // Handle plus button press - navigate to new screen or open modal
          console.log('Plus button pressed');
          // You can navigate to a create/add screen here
          // navigation.navigate('create'); // Example route
        }}
      >
        <View style={styles.plusButtonInner}>
          <Ionicons name="add" size={28} color="white" />
        </View>
      </Pressable>
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
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
});
