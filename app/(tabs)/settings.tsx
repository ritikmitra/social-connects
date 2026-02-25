import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useAppTheme } from '@/context/ThemeContext';
import { useTheme } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SettingsScreen() {
  const { mode, setMode, accentColor, setAccentColor } = useAppTheme();
  const { colors } = useTheme();

  const [visible, setVisible] = useState(false);
  const [sheetType, setSheetType] = useState<'theme' | 'color' | null>(null);

  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible,slideAnim]);

  const openSheet = (type: 'theme' | 'color') => {
    setSheetType(type);
    setVisible(true);
  };

  const closeSheet = () => setVisible(false);

  const themeOptions = [
    { label: 'System Default', value: 'system' },
    { label: 'Light Mode', value: 'light' },
    { label: 'Dark Mode', value: 'dark' },
  ];

  const colorOptions = [
    '#007AFF',
    '#FF3B30',
    '#34C759',
    '#AF52DE',
    '#FF9500',
  ];

  const Row = ({ title, value, onPress }: any) => (
    <Pressable
      style={[
        styles.row,
        { backgroundColor: colors.card },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.rowTitle, { color: colors.text }]}>
        {title}
      </Text>

      <View style={styles.rowRight}>
        <Text style={{ color: colors.primary, marginRight: 6 }}>
          {value}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.border}
        />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Appearance
      </Text>

      <Row
        title="Theme"
        value={mode}
        onPress={() => openSheet('theme')}
      />

      <Row
        title="Accent Color"
        value=""
        onPress={() => openSheet('color')}
      />

      {/* Bottom Sheet */}
      <Modal transparent visible={visible} animationType="none">
        <Pressable style={styles.overlay} onPress={closeSheet}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {sheetType === 'theme' &&
              themeOptions.map(option => (
                <Pressable
                  key={option.value}
                  style={styles.sheetItem}
                  onPress={() => {
                    setMode(option.value as any);
                    closeSheet();
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                    }}
                  >
                    {option.label}
                  </Text>

                  {mode === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}

            {sheetType === 'color' &&
              colorOptions.map(color => (
                <Pressable
                  key={color}
                  style={styles.sheetItem}
                  onPress={() => {
                    setAccentColor(color);
                    closeSheet();
                  }}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                    ]}
                  />

                  {accentColor === color && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  row: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetItem: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});