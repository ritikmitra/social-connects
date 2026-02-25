import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useTheme } from '@react-navigation/native';
import { Color } from 'expo-router';

export default function SettingsScreen() {
  const { mode, setMode } = useAppTheme();
  const { colors } = useTheme();
  console.log(Color);
  

  const Option = ({ label, value }: any) => (
    <Pressable
      onPress={() => setMode(value)}
      style={[
        styles.option,
        {
          backgroundColor:
            mode === value ? colors.primary : colors.card,
        },
      ]}
    >
      <Text
        style={{
          color: mode === value ? '#fff' : colors.text,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Appearance
      </Text>

      <Option label="System Default" value="system" />
      <Option label="Light Mode" value="light" />
      <Option label="Dark Mode" value="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  option: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
});