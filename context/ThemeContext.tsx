import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProviderCustom = ({ children }: any) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState('#007AFF');

  const systemScheme = Appearance.getColorScheme();

  const resolvedMode =
    mode === 'system' ? systemScheme : mode;

  const baseTheme =
    resolvedMode === 'dark' ? DarkTheme : DefaultTheme;

  const theme: Theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: accentColor,
    },
  };

  // Load saved values
  useEffect(() => {
    const load = async () => {
      const savedMode = await AsyncStorage.getItem('themeMode');
      const savedColor = await AsyncStorage.getItem('accentColor');

      if (savedMode) setModeState(savedMode as ThemeMode);
      if (savedColor) setAccentColorState(savedColor);
    };
    load();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('themeMode', newMode);
  };

  const setAccentColor = async (color: string) => {
    setAccentColorState(color);
    await AsyncStorage.setItem('accentColor', color);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        accentColor,
        setAccentColor,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);