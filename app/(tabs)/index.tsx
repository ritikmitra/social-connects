import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useTheme } from '@react-navigation/native';

export default function HomeScreen() {
  const { mode } = useAppTheme();
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Welcome 👋
      </Text>
      <Text style={{ color: colors.text }}>
        Current Mode: {mode}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 10,
  },
});