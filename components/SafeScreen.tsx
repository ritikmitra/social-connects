import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/context/ThemeContext';

const SafeScreen = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  const { mode } = useAppTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'bottom']}
    >
      <StatusBar style={mode ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </SafeAreaView>
  );
};

export default SafeScreen;