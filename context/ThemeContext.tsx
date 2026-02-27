import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  const [mode, setMode] = useState<ThemeMode>('system');
  const [accentColor, setAccentColor] = useState('#007AFF');

  const systemScheme = Appearance.getColorScheme();

  const resolvedMode = mode === 'system' ? systemScheme : mode;

  const baseTheme = resolvedMode === 'dark' ? DarkTheme : DefaultTheme;

  const theme: Theme = useMemo(() => ({
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: accentColor,
    },
  }), [accentColor, baseTheme]);

  // Load saved values
  useEffect(() => {
    const loadSavedPreferences = async () => {
      const savedMode = await AsyncStorage.getItem('themeMode');
      const savedColor = await AsyncStorage.getItem('accentColor');

      if (savedMode) setMode(savedMode as ThemeMode);
      if (savedColor) setAccentColor(savedColor);
    };
    loadSavedPreferences();
  }, []);

  const handleSetMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    await AsyncStorage.setItem('themeMode', newMode);
  };

  const handleSetAccentColor = async (color: string) => {
    setAccentColor(color);
    await AsyncStorage.setItem('accentColor', color);
  };

  const contextValue = useMemo(() => ({
    mode,
    setMode: handleSetMode,
    accentColor,
    setAccentColor: handleSetAccentColor,
    theme,
  }), [mode, accentColor, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);